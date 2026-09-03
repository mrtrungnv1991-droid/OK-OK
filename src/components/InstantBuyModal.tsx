import React, { useState } from 'react';
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
  Smartphone
} from 'lucide-react';
import { Product, UserProfile, UserOrder } from '../types';
import { formatCurrency, generateTxHash, generateRandomKey } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';

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
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountPercent: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'vietqr' | 'telco'>('wallet');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
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

  const handleExecutePurchase = (method: 'wallet' | 'vietqr' | 'telco') => {
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

    setTimeout(() => {
      const randomKey = generateRandomKey(product.platform);
      const newOrder: UserOrder = {
        id: `ord-retail-${Date.now()}`,
        productId: product.id,
        productTitle: `${product.title} (x${quantity})`,
        platform: product.platform,
        type: 'instant_single',
        pricePaid: finalTotal,
        status: 'fulfilled',
        createdAt: new Date().toLocaleString(),
        deliveredKey: randomKey,
        pinCode: '8821',
        giftUpCard: product.deliveryType === 'giftup_card' ? {
          cardNumber: `4928 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
          pinCode: '8821',
          barcode: `GU-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          balance: 50,
          currency: 'USD',
          expiryDate: '12/2028',
          redeemUrl: 'https://giftup.app/redeem/cyberpool'
        } : undefined,
        txId: `TX-RETAIL-${Date.now().toString().slice(-6)}`
      };

      setIsProcessing(false);
      setDeliveredOrder(newOrder);
      onSuccessOrder(newOrder, finalTotal, method);
    }, 1200);
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

              {/* Delivered Key Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase text-slate-200">
                      {t('checkout.keys_delivered')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Escrow Guaranteed
                  </span>
                </div>

                {/* Big Key Display */}
                <div className="p-3.5 rounded-lg bg-black/90 border border-cyan-500/60 flex items-center justify-between gap-3 shadow-inner">
                  <div className="font-mono font-black text-cyan-300 text-sm sm:text-base tracking-wider break-all select-all">
                    {deliveredOrder.deliveredKey}
                  </div>
                  <button
                    onClick={() => handleCopyText(deliveredOrder.deliveredKey || '', 'delivered_key')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shrink-0 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  >
                    {copiedField === 'delivered_key' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('common.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('common.copy')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Additional PIN or GiftUp Info */}
                {deliveredOrder.pinCode && (
                  <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">PIN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{deliveredOrder.pinCode}</span>
                      <button
                        onClick={() => handleCopyText(deliveredOrder.pinCode || '', 'pin')}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] underline cursor-pointer"
                      >
                        {copiedField === 'pin' ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                <img
                  src={product.bannerImg}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full sm:w-24 h-24 rounded-lg object-cover border border-slate-700 shrink-0"
                />

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
                    <span>{product.seller.name}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{product.stockAvailable || 15} keys</span>
                  </div>
                </div>
              </div>

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
                  disabled={isProcessing || (paymentMethod === 'wallet' && !hasEnoughBalance)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(6,182,212,0.45)] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
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
