import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Flame, 
  Sparkles, 
  ArrowRight,
  Gift,
  ShoppingCart,
  Check
} from 'lucide-react';
import { Product, GroupPool } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from '../i18n';

interface ProductCardProps {
  product: Product;
  currency: 'VND' | 'USD';
  onJoinPool?: (product: Product, pool?: GroupPool) => void;
  onOpenPoolModal?: (pool?: GroupPool) => void;
  onInstantBuy?: (product: Product) => void;
  onCreatePool?: () => void;
  onCreateNewPoolForProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onJoinPool,
  onOpenPoolModal,
  onInstantBuy,
  onCreatePool,
  onCreateNewPoolForProduct
}) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const activePool = (product.activePools && product.activePools.length > 0)
    ? (product.activePools.find(p => p.status === 'filling') || product.activePools[0])
    : undefined;
  const savingsPercent = Math.round(((product.retailPrice - product.groupPrice) / product.retailPrice) * 100);
  
  const filledSlots = activePool ? activePool.filledSlots : 0;
  const targetSlots = activePool ? activePool.targetSlots : product.minSlots;
  const percentFilled = Math.min(100, Math.round((filledSlots / targetSlots) * 100));
  const remainingSlots = targetSlots - filledSlots;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleJoinClick = () => {
    if (onJoinPool) {
      onJoinPool(product, activePool);
    } else if (onOpenPoolModal) {
      onOpenPoolModal(activePool);
    }
  };

  const handleInstantBuyClick = () => {
    if (onInstantBuy) {
      onInstantBuy(product);
    }
  };

  return (
    <div className="group relative rounded-xl bg-[#0e121b] border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)] h-full">
      {/* Top Banner Image with Overlay */}
      <div className="relative h-24 xs:h-28 sm:h-36 md:h-40 w-full overflow-hidden bg-slate-950 shrink-0">
        <img
          src={product.bannerImg}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e121b] via-[#0e121b]/30 to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 right-1.5 sm:right-2.5 flex items-center justify-between gap-1">
          {/* Platform Tag */}
          <span className="px-1.5 sm:px-2.5 py-0.5 rounded text-[9px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40">
            {product.platform}
          </span>

          {/* Savings Badge */}
          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]">
            -{savingsPercent}%
          </span>
        </div>

        {/* Delivery Type Badge on bottom image */}
        <div className="absolute bottom-1.5 left-1.5 sm:left-2.5 flex items-center gap-1 text-[8px] sm:text-[10px] font-mono text-slate-300 bg-black/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
          {product.deliveryType === 'giftup_card' ? (
            <>
              <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
              <span>GiftUp Card</span>
            </>
          ) : (
            <>
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
              <span className="truncate max-w-[90px] sm:max-w-none">{product.deliveryEstimate}</span>
            </>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-2 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        {/* Title and Subtitle */}
        <div>
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-white font-mono line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {product.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">
            {product.subtitle}
          </p>
        </div>

        {/* Group-Buy Slot Progress Engine */}
        <div className="p-1.5 sm:p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1 sm:space-y-1.5">
          {activePool ? (
            <>
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono">
                <div className="flex items-center gap-1 text-cyan-400 font-bold">
                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>
                    {t('products.pool_status')}: {filledSlots}/{targetSlots}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400 text-[9px] sm:text-[10px]">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{activePool.expiresAt}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-1.5 sm:h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                  style={{ width: `${percentFilled}%` }}
                ></div>
              </div>

              {/* Slot hint */}
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-400">
                <span className="text-emerald-400 font-semibold truncate">
                  {remainingSlots === 1 
                    ? t('products.last_slot') 
                    : t('products.need_slots', { count: remainingSlots })}
                </span>
                <span className="text-slate-500 hidden sm:inline">#{activePool.id.slice(-4)}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-slate-400 py-0.5">
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px]">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400" />
                {t('products.no_active_pool')}
              </span>
              <button
                onClick={() => onCreateNewPoolForProduct && onCreateNewPoolForProduct(product)}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-500/40 text-[9px] sm:text-[10px] cursor-pointer"
              >
                {t('pools.create_pool_title')}
              </button>
            </div>
          )}
        </div>

        {/* Pricing Matrix */}
        <div className="flex items-end justify-between pt-1 border-t border-slate-800/80">
          <div>
            <div className="text-[8px] sm:text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
              {t('products.retail_price')}: <span className="line-through text-slate-400">{formatCurrency(product.retailPrice, currency)}</span>
            </div>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-cyan-400">
                {formatCurrency(product.groupPrice, currency)}
              </span>
            </div>
          </div>

          {/* Product Star rating and review count */}
          <div className="text-right">
            <div className="text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold flex items-center justify-end gap-0.5">
              <span>★</span>
              <span>{product.rating || 5.0}</span>
              <span className="text-slate-500 font-normal">({product.reviewCount || product.userReviews?.length || 0})</span>
            </div>
            <div className="text-[8px] sm:text-[9px] font-mono text-slate-500">
              {product.seller.name}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5">
          {/* Group Buy Button (Main) */}
          <button
            onClick={handleJoinClick}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-[10px] sm:text-xs uppercase tracking-tight transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
          >
            <span>{t('products.join_pool')}</span>
            <ArrowRight className="w-3 h-3 hidden sm:inline" />
          </button>

          {/* Instant Buy Retail Button */}
          <button
            onClick={handleInstantBuyClick}
            className="flex-1 flex items-center justify-center gap-0.5 py-1.5 sm:py-2 px-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-[9px] sm:text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer truncate"
          >
            <span>{t('products.instant_buy')}</span>
          </button>

          {/* Add to Cart Quick Button */}
          <button
            onClick={handleAddToCart}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center ${
              justAdded
                ? 'bg-emerald-500 text-black border-emerald-400'
                : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border-slate-700 hover:border-cyan-500/50'
            }`}
            title={t('products.add_to_cart')}
          >
            {justAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

