import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Copy, 
  Check, 
  Wallet, 
  QrCode, 
  CreditCard, 
  Download, 
  ExternalLink, 
  Package, 
  ArrowRight, 
  Sparkles,
  Lock,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useOrders } from '../contexts/OrdersContext';
import { formatCurrency } from '../utils/formatters';
import { UserOrder } from '../types';
import { useTranslation } from '../i18n';
import { WebDeliveryOutput, detectDeliveryBranch } from './WebDeliveryOutput';
import { api } from '../api/client';

interface CheckoutConfirmationModalProps {
  onOpenVault?: () => void;
  onOpenDeposit?: () => void;
}

export const CheckoutConfirmationModal: React.FC<CheckoutConfirmationModalProps> = ({
  onOpenVault,
  onOpenDeposit
}) => {
  const { t } = useTranslation();
  const {
    isCheckoutConfirmOpen,
    closeCheckoutConfirm,
    checkoutTargetItems,
    removeFromCart
  } = useCart();

  const { currentUser, updateUserBalance, refreshUserProfile } = useAuth();
  const { addTransaction } = useWallet();
  const { addOrder } = useOrders();

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'vietqr' | 'telco'>('wallet');
  const [hasConfirmedAgreement, setHasConfirmedAgreement] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<UserOrder[] | null>(null);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  if (!isCheckoutConfirmOpen) return null;

  // Calculate totals
  const totalItemCount = checkoutTargetItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = checkoutTargetItems.reduce((sum, item) => sum + (item.product.retailPrice * item.quantity), 0);
  
  // Bulk discount
  const bulkDiscountPercent = totalItemCount >= 5 ? 7 : totalItemCount >= 2 ? 3 : 0;
  const bulkDiscountAmount = Math.round(subtotal * (bulkDiscountPercent / 100));
  const finalTotal = Math.max(0, subtotal - bulkDiscountAmount);

  const hasEnoughBalance = (currentUser.walletBalance || 0) >= finalTotal;

  const handleConfirmPurchase = async () => {
    if (!hasConfirmedAgreement) return;
    setErrorMessage(null);

    // If direct gateway is selected, user must route through deposit to authenticate payment
    if (paymentMethod !== 'wallet') {
      closeCheckoutConfirm();
      if (onOpenDeposit) {
        onOpenDeposit();
      }
      return;
    }

    if (!hasEnoughBalance) {
      setErrorMessage(`Số dư ví không đủ (hiện có ${formatCurrency(currentUser.walletBalance, currentUser.currency)}, cần ${formatCurrency(finalTotal, currentUser.currency)}). Vui lòng nạp thêm tiền.`);
      return;
    }

    setIsProcessing(true);

    // CYBERPOOL FIX (#11): mỗi item nhận idempotencyKey ổn định theo phiên
    // checkout — retry/double-click không trừ tiền 2 lần (server đã hỗ trợ
    // key này trong orderRoutes nhưng client chưa từng gửi).
    const checkoutSessionKey = `CK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const generatedOrders: UserOrder[] = [];
      const failedItems: { title: string; error: string }[] = [];

      // Process each checkout item atomically through backend API
      for (let itemIndex = 0; itemIndex < checkoutTargetItems.length; itemIndex++) {
        const item = checkoutTargetItems[itemIndex];

        const response = await api.request<any>('/orders/instant-buy', {
          method: 'POST',
          body: JSON.stringify({
            productId: item.product.id,
            quantity: item.quantity,
            paymentMethod: 'wallet',
            finalTotal: item.product.retailPrice * item.quantity,
            idempotencyKey: `${checkoutSessionKey}_${itemIndex}_${item.product.id}`
          })
        });

        // CYBERPOOL FIX: api.request() wraps the server JSON in response.data
                // (see api/client.ts:89-93), so the order lives at response.data.order.
                // The old code read response.order — always undefined — and threw an
                // error AFTER the server had already deducted the wallet and delivered
                // the key, showing a fake failure to the customer.
                const orderData = response.data || {};

                if (!response.success || !orderData.order) {
                  // CYBERPOOL FIX (#11): KHÔNG throw giữa loop — các item trước đã
                  // bị trừ tiền thật; throw sẽ hiện 1 lỗi chung và nuốt mất đơn đã
                  // mua thành công. Ghi nhận lỗi từng item và tiếp tục; cuối cùng
                  // báo cáo trung thực (thành công một phần / thất bại).
                  failedItems.push({
                    title: item.product.title,
                    error: response.error || response.message || 'Không thành công'
                  });
                  continue;
                }

                const serverOrder = orderData.order;
                const branch = serverOrder.deliveryBranch || item.product.deliveryBranch || detectDeliveryBranch(undefined, item.product.title, item.product.platform);

                // CYBERPOOL FIX (#10 tương tự InstantBuyModal): status chỉ
                // 'fulfilled' khi server COMPLETED + có key/card thật.
                const realKey = serverOrder.deliveredData?.keys?.[0] || orderData.deliveredKey || '';
                const isServerFulfilled = serverOrder.status === 'COMPLETED' && Boolean(realKey || serverOrder.deliveredData?.giftUpCard);

                const order: UserOrder = {
                  id: serverOrder.id,
                  productId: serverOrder.productId || item.product.id,
                  productTitle: serverOrder.productTitle || `${item.product.title} (x${item.quantity})`,
                  platform: serverOrder.platform || item.product.platform,
                  type: 'instant_single',
                  pricePaid: serverOrder.pricePaid || (item.product.retailPrice * item.quantity),
                  status: isServerFulfilled ? 'fulfilled' : 'processing',
                  createdAt: serverOrder.createdAt ? new Date(serverOrder.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
                  deliveryBranch: branch,
                  deliveredKey: realKey || '',
                  deliveredData: serverOrder.deliveredData || (realKey ? { keys: [realKey] } : undefined),
                  txId: serverOrder.id
                };

        addOrder(order);
        generatedOrders.push(order);
        removeFromCart(item.product.id);
      }

      // Refresh true user balance from backend ledger
      await refreshUserProfile();

      // Record in local wallet context summary
      const titlesSummary = checkoutTargetItems.map(i => `${i.product.title} (x${i.quantity})`).join(', ');
      addTransaction({
        type: 'buy_instant',
        description: `Mua hàng (${totalItemCount} món): ${titlesSummary.slice(0, 80)}...`,
        amount: -finalTotal,
        balanceAfter: Math.max(0, (currentUser.walletBalance || 0) - finalTotal),
        status: 'completed',
        txCode: generatedOrders[0]?.id || `TX-RETAIL-${Date.now()}`
      });

      setCompletedOrders(generatedOrders);

      // CYBERPOOL FIX (#11): báo cáo trung thực khi một phần thất bại
      if (failedItems.length > 0) {
        const failedList = failedItems.map(f => `${f.title}: ${f.error}`).join('\n');
        setErrorMessage(
          generatedOrders.length > 0
            ? `Đã mua thành công ${generatedOrders.length} món. Các món sau THẤT BẠI (không bị trừ tiền):\n${failedList}`
            : `Tất cả món hàng đều thất bại:\n${failedList}`
        );
      }
    } catch (err: any) {
      console.error('[Checkout] Purchase failed:', err);
      setErrorMessage(err.message || 'Giao dịch không thành công. Vui lòng kiểm tra lại số dư và tồn kho.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (keyText: string, index: number) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyIndex(index);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const handleDownloadTxt = () => {
    if (!completedOrders) return;
    const content = completedOrders.map((o, idx) => 
      `[MÃ ĐƠN #${idx + 1}] ${o.productTitle}\nNền tảng: ${o.platform}\nMã Bản Quyền / Key: ${o.deliveredKey}\nPIN Code: ${o.pinCode || 'N/A'}\nThời gian mua: ${o.createdAt}\nMã GD: ${o.txId}\n-----------------------------------\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CyberPool_Licenses_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#090d16] border border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1629] to-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black font-mono font-black flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                {completedOrders ? t('checkout.order_success_title') : t('checkout.confirmation_title')}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {completedOrders 
                  ? t('checkout.order_success_desc')
                  : t('checkout.anti_click_warning')}
              </p>
            </div>
          </div>

          {!completedOrders && (
            <button
              type="button"
              onClick={closeCheckoutConfirm}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* SUCCESS SCREEN */}
          {completedOrders ? (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-emerald-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-white">
                    {t('checkout.order_success_title')}
                  </h3>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">
                    {t('wallet.current_balance')}: <strong className="text-white">{formatCurrency(currentUser.walletBalance, currentUser.currency)}</strong>
                  </p>
                </div>
              </div>

              {/* Delivered Keys List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  <span>{t('checkout.keys_delivered')}</span>
                </h4>

                <div className="space-y-2.5">
                  {completedOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-white">
                          #{idx + 1}. {order.productTitle}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          {order.platform}
                        </span>
                      </div>

                      {/* Digital Delivery Output for Web (Account, Key, Link, Giftcard) */}
                      <WebDeliveryOutput
                        branch={order.deliveryBranch}
                        rawKey={order.deliveredKey}
                        accountCredentials={order.deliveredData?.accountCredentials}
                        inviteLink={order.deliveredData?.inviteLink}
                        giftCardInfo={
                          order.deliveredData?.giftCardInfo ||
                          (order.pinCode
                            ? { cardNumber: order.deliveredKey, pinCode: order.pinCode }
                            : undefined)
                        }
                        productTitle={order.productTitle}
                      />

                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                        <span>{t('wallet.tx_code')}: <strong className="text-slate-300">{order.txId}</strong></span>
                        <span>{order.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons after success */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('checkout.download_keys_txt')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeCheckoutConfirm();
                      if (onOpenVault) onOpenVault();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-xs tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>{t('checkout.go_to_vault')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeCheckoutConfirm}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ORDER CONFIRMATION & REVIEW STEP */
            <div className="space-y-4">
              
              {/* Error Message Banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs font-mono text-rose-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Anti-Accidental Click Warning Banner */}
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs font-mono">
                  <span className="text-slate-300">
                    {t('checkout.anti_click_warning')}
                  </span>
                </div>
              </div>

              {/* Items Summary Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>{t('checkout.item_breakdown', { count: totalItemCount })}</span>
                  <span>{t('cart.total')}</span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {checkoutTargetItems.map((item, idx) => {
                    const itemTotal = item.product.retailPrice * item.quantity;
                    return (
                      <div key={item.product.id} className="p-3.5 flex items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.product.bannerImg}
                            alt={item.product.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-white truncate max-w-xs sm:max-w-md">
                              {item.product.title}
                            </h5>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="text-cyan-400 font-bold">{item.product.platform}</span>
                              <span>•</span>
                              <span>{t('cart.unit_price')}: {formatCurrency(item.product.retailPrice, currentUser.currency)}</span>
                              <span>•</span>
                              <span>{t('cart.quantity')}: <strong className="text-white">x{item.quantity}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-amber-400 font-mono">
                            {formatCurrency(itemTotal, currentUser.currency)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-slate-300 block">
                  {t('checkout.payment_method')}:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Wallet Balance */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'wallet'
                        ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-white">
                        <Wallet className="w-4 h-4 text-cyan-400" />
                        <span>{t('wallet.current_balance')}</span>
                      </div>
                      {paymentMethod === 'wallet' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {formatCurrency(currentUser.walletBalance, currentUser.currency)}
                    </div>
                  </button>

                  {/* Option 2: VietQR */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vietqr')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'vietqr'
                        ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-white">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>{t('wallet.vietqr_title')}</span>
                      </div>
                      {paymentMethod === 'vietqr' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      VietQR
                    </div>
                  </button>

                  {/* Option 3: Telco Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telco')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'telco'
                        ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-white">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>{t('wallet.telco_card_title')}</span>
                      </div>
                      {paymentMethod === 'telco' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-xs font-mono text-amber-400 font-bold">
                      Telco Card
                    </div>
                  </button>
                </div>
              </div>

              {/* Insufficient balance warning & Quick Deposit */}
              {paymentMethod === 'wallet' && !hasEnoughBalance && (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {t('checkout.insufficient_balance')}
                    </span>
                  </div>
                  {onOpenDeposit && (
                    <button
                      type="button"
                      onClick={() => {
                        closeCheckoutConfirm();
                        onOpenDeposit();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all shrink-0 cursor-pointer"
                    >
                      {t('checkout.deposit_and_pay')} ➔
                    </button>
                  )}
                </div>
              )}

              {/* Direct Gateway Guidance */}
              {paymentMethod !== 'wallet' && (
                <div className="p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 flex items-start gap-2.5 text-xs font-mono text-cyan-200">
                  <QrCode className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Thanh toán qua cổng {paymentMethod === 'vietqr' ? 'VietQR Tự Động' : 'Thẻ Cào Telco'}</p>
                    <p className="text-slate-300 mt-0.5">
                      Hệ thống sẽ mở cổng nạp tự động với mã giao dịch định danh. Ngay khi ngân hàng hoặc nhà mạng xác nhận, đơn hàng được xử lý và kích hoạt ngay lập tức.
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery & Account Guarantee Info */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{t('common.security')}:</span>
                  <span className="text-emerald-400 font-bold">{t('checkout.safe_escrow_notice')}</span>
                </div>
              </div>

              {/* Final Breakdown & Agreement Checkbox */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#0e1628] to-[#0a0f1d] border border-cyan-500/40 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>{t('cart.subtotal')} ({totalItemCount}):</span>
                  <span className="text-white font-bold">{formatCurrency(subtotal, currentUser.currency)}</span>
                </div>

                {bulkDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t('cart.bulk_discount', { percent: bulkDiscountPercent })}:</span>
                    <span>-{formatCurrency(bulkDiscountAmount, currentUser.currency)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">{t('checkout.order_total_amount')}</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">
                    {formatCurrency(finalTotal, currentUser.currency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCheckoutConfirm}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  {t('common.back')}
                </button>

                <button
                  type="button"
                  disabled={!hasConfirmedAgreement || isProcessing || (paymentMethod === 'wallet' && !hasEnoughBalance)}
                  onClick={handleConfirmPurchase}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-black font-mono font-black text-xs tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{t('checkout.processing_payment')}</span>
                    </>
                  ) : paymentMethod !== 'wallet' ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Mở cổng nạp {paymentMethod === 'vietqr' ? 'VietQR' : 'Thẻ cào'} ({formatCurrency(finalTotal, currentUser.currency)})</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t('checkout.confirm_payment_btn')} ({formatCurrency(finalTotal, currentUser.currency)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
