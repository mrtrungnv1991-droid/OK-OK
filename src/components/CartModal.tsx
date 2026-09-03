import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Tag, 
  ArrowRight, 
  Sparkles, 
  Key, 
  UserCheck, 
  Zap, 
  Check, 
  AlertCircle,
  Package
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface CartModalProps {
  onClose?: () => void;
  onExploreProducts?: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  onClose,
  onExploreProducts
}) => {
  const { t } = useTranslation();
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    toggleSelect,
    selectAll,
    clearCart,
    selectedItems,
    totalItemCount,
    selectedCount,
    selectedSubtotal,
    openCheckoutConfirm
  } = useCart();

  const { currentUser } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'CYBER2026') {
      setAppliedCoupon({ code: 'CYBER2026', discountPercent: 10 });
    } else if (clean === 'VIP10') {
      setAppliedCoupon({ code: 'VIP10', discountPercent: 10 });
    } else if (clean === 'ESCROW50') {
      setAppliedCoupon({ code: 'ESCROW50', discountPercent: 15 });
    } else if (clean === 'FREESHIP' || clean === 'CYBER') {
      setAppliedCoupon({ code: clean, discountPercent: 5 });
    } else {
      setCouponError(t('errors.invalid_coupon'));
    }
  };


  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Quantity discount (buy 2 items -3%, 5+ items -7%)
  const bulkDiscountPercent = selectedCount >= 5 ? 7 : selectedCount >= 2 ? 3 : 0;
  const bulkDiscountAmount = Math.round(selectedSubtotal * (bulkDiscountPercent / 100));

  const couponDiscountAmount = appliedCoupon 
    ? Math.round(selectedSubtotal * (appliedCoupon.discountPercent / 100))
    : 0;

  const totalDiscount = bulkDiscountAmount + couponDiscountAmount;
  const finalTotal = Math.max(0, selectedSubtotal - totalDiscount);

  const isAllSelected = cartItems.length > 0 && cartItems.every(i => i.selected);

  const handleProceedToConfirmation = () => {
    if (selectedItems.length === 0) return;
    openCheckoutConfirm(selectedItems);
  };

  const getItemTypeBadge = (type: string, platform: string) => {
    switch (type) {
      case 'account':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
            <UserCheck className="w-2.5 h-2.5" />
            <span>Tài Khoản Số</span>
          </span>
        );
      case 'key_game':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <Key className="w-2.5 h-2.5" />
            <span>Key Game CDKey</span>
          </span>
        );
      case 'key_app':
      case 'software':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Key Bản Quyền</span>
          </span>
        );
      case 'topup':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <Zap className="w-2.5 h-2.5" />
            <span>Nạp Game Trực Tiếp</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Package className="w-2.5 h-2.5" />
            <span>{platform}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#090d16] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  {t('cart.title')}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-bold">
                  {totalItemCount} {t('common.units')}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('cart.empty_cart_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer"
                title={t('cart.clear_cart')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('cart.clear_cart')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                closeCart();
                if (onClose) onClose();
              }}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-base font-bold font-mono text-slate-200 mb-1">
                {t('cart.empty_cart')}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 font-mono">
                {t('cart.empty_cart_desc')}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  if (onExploreProducts) onExploreProducts();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>{t('cart.browse_store')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Select all & Quick Actions */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => selectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="font-bold">
                    {t('cart.select_all')} ({cartItems.length} {t('common.units')})
                  </span>
                </label>
                <div className="text-slate-400 text-[11px]">
                  {t('cart.selected_items', { count: selectedCount })}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const { product, quantity, selected, itemType } = item;
                  const itemSubtotal = product.retailPrice * quantity;

                  return (
                    <div
                      key={product.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        selected
                          ? 'bg-[#0e1424]/90 border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.08)]'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Select checkbox */}
                        <div className="pt-2 shrink-0">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(product.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 cursor-pointer"
                          />
                        </div>

                        {/* Product Image */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                          <img
                            src={product.bannerImg}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-black/80 text-cyan-300">
                            {product.platform}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {getItemTypeBadge(itemType, product.platform)}
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              ⚡ Sẵn {product.stockAvailable || 15} key kho
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold font-mono text-white line-clamp-1">
                            {product.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                            {product.subtitle}
                          </p>

                          {/* Price & Quantity Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-800/80">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-bold font-mono text-amber-400">
                                {formatCurrency(product.retailPrice, currentUser.currency)}
                              </span>
                              {product.groupPrice && (
                                <span className="text-[10px] font-mono text-slate-500 line-through">
                                  {formatCurrency(Math.round(product.retailPrice * 1.3), currentUser.currency)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Quantity Stepper */}
                              <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                                  title="Giảm số lượng"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-3 py-1 font-mono font-bold text-xs text-white min-w-[32px] text-center">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  disabled={quantity >= (product.stockAvailable || 99)}
                                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                                  title="Tăng số lượng"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Item Total & Remove */}
                              <div className="text-right">
                                <div className="text-xs font-bold font-mono text-cyan-300">
                                  {formatCurrency(itemSubtotal, currentUser.currency)}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(product.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                                title="Xoá món này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('cart.coupon_discount')}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    CYBER2026 (-10%), VIP10
                  </span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-emerald-300">{appliedCoupon.code}</span>
                        <span className="text-emerald-400 ml-2">(-{appliedCoupon.discountPercent}%)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder={t('cart.coupon_code')}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
                    >
                      {t('cart.apply_coupon')}
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Order Calculation Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#0e1628] to-[#0a0f1d] border border-cyan-500/30 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>{t('cart.selected_subtotal')} ({selectedCount}):</span>
                  <span className="text-white font-bold">{formatCurrency(selectedSubtotal, currentUser.currency)}</span>
                </div>

                {bulkDiscountPercent > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{t('cart.bulk_discount', { percent: bulkDiscountPercent })}:</span>
                    </span>
                    <span>-{formatCurrency(bulkDiscountAmount, currentUser.currency)}</span>
                  </div>
                )}

                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t('cart.coupon_discount')} ({appliedCoupon?.code}):</span>
                    <span>-{formatCurrency(couponDiscountAmount, currentUser.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>{t('escrow.title')}:</span>
                  <span className="text-emerald-400 font-bold">{t('common.free')} (0)</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">{t('cart.total')}:</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-cyan-400 font-mono">
                      {formatCurrency(finalTotal, currentUser.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#070b14] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs font-mono text-slate-400 text-center sm:text-left">
              <span>{t('cart.selected_items', { count: selectedCount })} / {totalItemCount}</span>
              <span className="mx-2">•</span>
              <span>{t('cart.total')}: <strong className="text-white font-bold">{formatCurrency(finalTotal, currentUser.currency)}</strong></span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={closeCart}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
              >
                {t('common.close')}
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleProceedToConfirmation}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-xs tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{t('checkout.confirm_payment_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
