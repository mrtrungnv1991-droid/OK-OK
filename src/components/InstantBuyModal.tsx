import React, { useState, useRef } from 'react';
import { 
  X, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  Wallet, 
  CreditCard, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Star, 
  Lock, 
  Layers, 
  Tag, 
  ExternalLink,
  Gift,
  KeyRound,
  Download,
  AlertCircle,
  Smartphone,
  Gamepad2
} from 'lucide-react';
import { Product, UserProfile, UserOrder } from '../types';
import { formatCurrency, generateTxHash, generateRandomKey } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';
import { ordersApi } from '../api/orders';
import { WebDeliveryOutput } from './WebDeliveryOutput';

interface InstantBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  user: UserProfile;
  onSuccessOrder: (order: UserOrder, paymentAmount: number, paymentMethod: string) => void;
  onOpenWallet: () => void;
  onOpenVault: () => void;
}

export const InstantBuyModal: React.FC<InstantBuyModalProps> = ({
  isOpen,
  onClose,
  product,
  user,
  onSuccessOrder,
  onOpenWallet,
  onOpenVault
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();
  const [quantity, setQuantity] = useState<number>(1);
  const isOutOfStock = (product.stockAvailable !== undefined && product.stockAvailable <= 0) ||
                       product.status === 'OUT_OF_STOCK' ||
                       product.isAvailable === false ||
                       (product.tags && product.tags.includes('OUT_OF_STOCK'));
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountPercent: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'vietqr' | 'telco'>('wallet');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  // CYBERPOOL FIX (#11): idempotencyKey ổn định cho mỗi lần bấm mua — server
  // hỗ trợ chống double-charge (orderRoutes) nhưng client trước đây KHÔNG gửi,
  // nên double-click/network-retry trừ tiền 2 lần. Key tạo 1 lần cho tới khi
  // giao dịch thành công thì reset cho lần mua kế tiếp.
  const idempotencyKeyRef = useRef<string>('');
  const getIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `IB_${product.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    return idempotencyKeyRef.current;
  };
  const [deliveredOrder, setDeliveredOrder] = useState<UserOrder | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Telco state for direct card payment
  const [telcoType, setTelcoType] = useState<string>('VIETTEL');
  const [cardPin, setCardPin] = useState<string>('');
  const [cardSerial, setCardSerial] = useState<string>('');

  if (!isOpen || !product) return null;

  // Pricing calculations
  const unitPrice = product.retailPrice;
  const rawTotal = unitPrice * quantity;
  
  // Bulk discount: 2-4 items -> 3% off, >= 5 items -> 7% off
  const bulkDiscountPercent = quantity >= 5 ? 7 : quantity >= 2 ? 3 : 0;
  const bulkDiscountAmount = Math.round(rawTotal * (bulkDiscountPercent / 100));

  // Voucher discount
  const voucherDiscountPercent = appliedVoucher ? appliedVoucher.discountPercent : 0;
  const voucherDiscountAmount = Math.round(rawTotal * (voucherDiscountPercent / 100));

  const totalDiscount = bulkDiscountAmount + voucherDiscountAmount;
  const finalTotal = Math.max(1000, rawTotal - totalDiscount);

  const hasEnoughBalance = user.walletBalance >= finalTotal;
  const balanceDifference = finalTotal - user.walletBalance;

  const handleApplyVoucher = () => {
    setVoucherError(null);
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'CYBER2026' || code === 'VIP10') {
      setAppliedVoucher({ code, discountPercent: 10 });
    } else if (code === 'ESCROW50' || code === 'SUPER5') {
      setAppliedVoucher({ code, discountPercent: 5 });
    } else {
      setVoucherError(t('errors.generic'));
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDownloadLicenseTxt = (order: UserOrder) => {
    const content = `=====================================================
CYBERPOOL TESLA ESCROW V4.2 - LICENSE RECEIPT
=====================================================
Order ID: ${order.id}
Product: ${order.productTitle}
Platform: ${order.platform}
Delivery Time: ${order.createdAt}
Escrow TxID: ${order.txId}
Total Paid: ${formatCurrency(order.pricePaid, user.currency)}

-----------------------------------------------------
LICENSE KEY / ACTIVATION DETAILS:
License Key: ${order.deliveredKey || 'N/A'}
PIN: ${order.pinCode || '8821'}
${order.giftUpCard ? `Gift Card Number: ${order.giftUpCard.cardNumber}\nPIN: ${order.giftUpCard.pinCode}\nBarcode: ${order.giftUpCard.barcode}\nRedeem URL: ${order.giftUpCard.redeemUrl}` : ''}
-----------------------------------------------------

Thank you for trading on CyberPool Escrow Network!
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CyberPool_${order.id}_License.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecutePurchase = async (method: 'wallet' | 'vietqr' | 'telco') => {
    if (isOutOfStock) {
      showToast('Sản phẩm này hiện đã bán hết tại shop API nguồn. Không thể thanh toán!', 'error', {
        title: 'HẾT HÀNG'
      });
      return;
    }

    if (method === 'wallet' && !hasEnoughBalance) {
      onOpenWallet();
      return;
    }

    if (method === 'telco' && (!cardPin.trim() || !cardSerial.trim())) {
      showToast('Vui lòng nhập đầy đủ mã PIN và Số Seri của thẻ cào!', 'warning', {
        title: 'THIẾU THÔNG TIN THẺ'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Execute REAL backend purchase - NO MORE PHANTOM ORDERS!
      const res = await ordersApi.instantBuy({
        productId: product.id,
        quantity,
        paymentMethod: method,
        voucherCode: voucherCode || undefined,
        finalTotal,
        idempotencyKey: getIdempotencyKey() // CYBERPOOL FIX (#11): chống double-charge khi retry/double-click
      });

      if (res.success && res.data?.order) {
        const realOrder = res.data.order;
        const orderAny = realOrder as any;
        // CYBERPOOL FIX (#10): không bịa key giả 'DELIVERED' + không tự nhận
        // 'fulfilled' khi server chưa giao (PENDING_STOCK / chưa có key thật).
        // Key hiển thị PHẢI đến từ deliveredData.keys hoặc deliveredKey thật.
        const realKey = orderAny.deliveredData?.keys?.[0] || (res.data as any).deliveredKey || '';
        const serverFulfilled = orderAny.status === 'COMPLETED' && Boolean(realKey || orderAny.deliveredData?.giftUpCard);
        const orderForState: UserOrder = {
          id: realOrder.id,
          productId: realOrder.productId,
          productTitle: realOrder.productTitle,
          platform: product.platform,
          type: 'instant_single',
          pricePaid: realOrder.pricePaid,
          status: serverFulfilled ? 'fulfilled' : 'processing',
          createdAt: new Date(realOrder.createdAt).toLocaleString('vi-VN'),
          deliveryBranch: orderAny.deliveryBranch || product.deliveryBranch,
          deliveredKey: realKey || undefined,
          pinCode: orderAny.deliveredData?.giftCardInfo?.pinCode,
          deliveredData: orderAny.deliveredData,
          giftUpCard: orderAny.deliveredData?.giftUpCard ? {
            cardNumber: orderAny.deliveredData.giftUpCard.cardNumber,
            pinCode: orderAny.deliveredData.giftUpCard.pinCode,
            barcode: orderAny.deliveredData.giftUpCard.barcode,
            balance: orderAny.deliveredData.giftUpCard.balance,
            currency: orderAny.deliveredData.giftUpCard.currency,
            expiryDate: '12/2028',
            redeemUrl: 'https://giftup.app/redeem/cyberpool'
          } : undefined,
          txId: orderAny.txHash || `TX-${realOrder.id.slice(-6)}`
        };

        setIsProcessing(false);
        setDeliveredOrder(orderForState);
        onSuccessOrder(orderForState, finalTotal, method);
        // CYBERPOOL FIX (#11): reset key để lần mua sau dùng key mới
        idempotencyKeyRef.current = '';
        if (serverFulfilled) {
          showToast('Đơn hàng thật đã được ghi nhận vào hệ thống và Kho Key!', 'success', {
            title: 'ĐẶT MUA THÀNH CÔNG'
          });
        } else {
          // CYBERPOOL FIX: server nhận đơn nhưng chưa giao key (chờ kho / xử lý)
          showToast('Đơn hàng đã ghi nhận và đang chờ hệ thống giao key. Theo dõi trong Kho Key / Đơn Hàng.', 'success', {
            title: 'ĐÃ NHẬN ĐƠN — ĐANG XỬ LÝ'
          });
        }
      } else {
        setIsProcessing(false);
        showToast(res.error || 'Đặt mua thất bại. Vui lòng kiểm tra lại số dư hoặc kết nối mạng.', 'error', {
          title: 'GIAO DỊCH KHÔNG THÀNH CÔNG'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Lỗi hệ thống khi tạo đơn hàng!', 'error', {
        title: 'LỖI MUA HÀNG'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Glowing Header Bar */}
        <div className="relative p-4 sm:p-5 border-b border-cyan-500/20 bg-gradient-to-r from-[#0d1424] via-[#101c33] to-[#0d1424] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Zap className="w-5 h-5 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500 text-black uppercase tracking-wider">
                  {t('products.instant_buy')}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t('checkout.safe_escrow_notice')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                {deliveredOrder ? t('checkout.order_success_title') : t('checkout.confirmation_title')}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* ================= VIEW 1: SUCCESSFUL DELIVERY SCREEN ================= */}
          {deliveredOrder ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Success Badge */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    {t('checkout.order_success_title')}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {formatCurrency(deliveredOrder.pricePaid, user.currency)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {t('wallet.tx_code')}: <span className="text-slate-300">{deliveredOrder.txId}</span>
                  </div>
                </div>
              </div>

              {/* Web Digital Delivery Output (Account, Key, Link, Giftcard) */}
              <WebDeliveryOutput
                branch={deliveredOrder.deliveryBranch || product.deliveryBranch}
                rawKey={deliveredOrder.deliveredKey}
                accountCredentials={deliveredOrder.deliveredData?.accountCredentials}
                inviteLink={deliveredOrder.deliveredData?.inviteLink}
                giftCardInfo={
                  deliveredOrder.deliveredData?.giftCardInfo ||
                  (deliveredOrder.pinCode
                    ? { cardNumber: deliveredOrder.deliveredKey, pinCode: deliveredOrder.pinCode }
                    : undefined)
                }
                productTitle={deliveredOrder.productTitle || product.title}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleDownloadLicenseTxt(deliveredOrder)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>{t('checkout.download_keys_txt')}</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenVault();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{t('checkout.go_to_vault')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= VIEW 2: PRODUCT CHECKOUT FORM ================= */
            <>
              {/* Product Presentation Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {(product.bannerImg && product.bannerImg.trim() !== '') || (product.images && product.images.length > 0) ? (
                  <img
                    src={product.bannerImg || product.images?.[0]}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full sm:w-24 h-24 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-full sm:w-24 h-24 rounded-lg border border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-center p-2 shrink-0">
                    <Gamepad2 className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="text-[9px] font-mono text-slate-400">Chưa có ảnh</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-400 border border-cyan-500/30">
                      {product.platform}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                      ★ {product.rating || 5.0} ({product.reviewCount || 36})
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Escrow
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-mono text-white leading-snug">
                    {product.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {product.description || product.subtitle}
                  </p>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 pt-1">
                    <span>{product.seller?.name || product.source_info?.supplierName || 'Cyber Verified Store'}</span>
                    <span>•</span>
                    {isOutOfStock ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Đã hết hàng (0 key khả dụng trên kho API)
                      </span>
                    ) : (
                      <span className="text-emerald-400">{product.stockAvailable ?? 15} keys</span>
                    )}
                  </div>
                </div>
              </div>

              {/* High Visibility Out Of Stock Banner */}
              {isOutOfStock && (
                <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/80 text-rose-200 text-xs font-mono space-y-1.5 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
                  <div className="flex items-center gap-2 font-black text-rose-300 text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>SẢN PHẨM NÀY ĐÃ BÁN HẾT TRÊN SHOP API NGUỒN</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Hệ thống Cron vừa đồng bộ với kho hàng nhà cung cấp: Số lượng sản phẩm này hiện tại đã hết (0 keys). 
                    Đường link sản phẩm vẫn giữ nguyên để bạn theo dõi thông tin, nhưng cổng thanh toán đã tạm khóa an toàn để tránh thất thoát số dư của bạn.
                  </p>
                </div>
              )}

              {/* Quantity Selector & Bulk Discount Pod */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Quantity Controls */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    {t('cart.quantity')}:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 h-9 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Discount Code Input */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                    <span>{t('cart.voucher_discount')}:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">CYBER2026 / VIP10</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder={t('cart.enter_voucher')}
                      className="flex-1 h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="h-9 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase cursor-pointer"
                    >
                      {t('cart.apply_btn')}
                    </button>
                  </div>
                  {appliedVoucher && (
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> -{appliedVoucher.discountPercent}% [{appliedVoucher.code}]
                    </div>
                  )}
                  {voucherError && (
                    <div className="text-[10px] font-mono text-rose-400">
                      {voucherError}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Breakdown Matrix */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t('cart.unit_price')}:</span>
                  <span>{formatCurrency(unitPrice, user.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('cart.quantity')}:</span>
                  <span>x {quantity}</span>
                </div>
                {bulkDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t('cart.bulk_discount', { percent: bulkDiscountPercent })}:</span>
                    <span>-{formatCurrency(bulkDiscountAmount, user.currency)}</span>
                  </div>
                )}
                {voucherDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t('cart.voucher_discount')} ({appliedVoucher?.code} -{voucherDiscountPercent}%):</span>
                    <span>-{formatCurrency(voucherDiscountAmount, user.currency)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">{t('checkout.order_total_amount')}:</span>
                  <span className="text-xl font-black text-cyan-400">
                    {formatCurrency(finalTotal, user.currency)}
                  </span>
                </div>
              </div>

              {/* Payment Methods Selector */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>{t('checkout.payment_method')}:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Method 1: Wallet Balance */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Wallet className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xs font-bold text-white font-mono">{t('wallet.current_balance')}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      <strong className={hasEnoughBalance ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(user.walletBalance, user.currency)}</strong>
                    </div>
                  </button>

                  {/* Method 2: VietQR Direct QR */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vietqr')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'vietqr'
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <QrCode className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xs font-bold text-white font-mono">{t('wallet.vietqr_title')}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      VietQR
                    </div>
                  </button>

                  {/* Method 3: Telco Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telco')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'telco'
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xs font-bold text-white font-mono">{t('wallet.telco_card_title')}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Telco Card
                    </div>
                  </button>
                </div>
              </div>

              {/* Insufficient Balance Notice if wallet selected */}
              {paymentMethod === 'wallet' && !hasEnoughBalance && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t('checkout.insufficient_balance')} ({formatCurrency(balanceDifference, user.currency)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenWallet}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                  >
                    {t('checkout.deposit_and_pay')}
                  </button>
                </div>
              )}

              {/* EXECUTE CHECKOUT BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleExecutePurchase(paymentMethod)}
                  disabled={isOutOfStock || isProcessing || (paymentMethod === 'wallet' && !hasEnoughBalance)}
                  className={`w-full py-3.5 px-6 rounded-xl font-mono font-black text-sm uppercase tracking-wider transition-all active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 ${
                    isOutOfStock 
                      ? 'bg-rose-950/80 border border-rose-600/70 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)] cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.45)]'
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>SẢN PHẨM ĐÃ HẾT HÀNG TRÊN KHO API</span>
                    </>
                  ) : isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{t('checkout.processing_payment')}</span>
                    </>
                  ) : paymentMethod === 'wallet' && !hasEnoughBalance ? (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>{t('checkout.insufficient_balance')}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black" />
                      <span>{t('checkout.confirm_payment_btn')} ({formatCurrency(finalTotal, user.currency)})</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
