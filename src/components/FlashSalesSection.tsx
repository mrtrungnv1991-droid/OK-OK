import React, { useState, useEffect, useRef } from 'react';
import { Flame, Clock, Zap, ChevronRight, ChevronLeft, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { Product, GroupPool } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface FlashSalesSectionProps {
  products: Product[];
  currency: 'VND' | 'USD';
  onSelectProduct?: (product: Product) => void;
  onOpenPool?: (product: Product, pool?: GroupPool) => void;
  onInstantBuy?: (product: Product) => void;
}

export const FlashSalesSection: React.FC<FlashSalesSectionProps> = ({
  products,
  currency,
  onSelectProduct,
  onOpenPool,
  onInstantBuy
}) => {
  const { t } = useTranslation();
  const flashProducts = products.filter(p => p.isFlashSale);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleProductClick = (product: Product) => {
    const activePool = product.activePools && product.activePools.length > 0 ? product.activePools[0] : undefined;
    if (onOpenPool) {
      onOpenPool(product, activePool);
    } else if (onSelectProduct) {
      onSelectProduct(product);
    }
  };
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileView, setMobileView] = useState<'grid4' | 'carousel'>('grid4');

  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      const totalScrollable = scrollWidth - clientWidth;
      setScrollProgress(totalScrollable > 0 ? (scrollLeft / totalScrollable) * 100 : 0);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [flashProducts]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (flashProducts.length === 0) return null;

  return (
    <section className="p-3 sm:p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-[#0c0f1a] border border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)] space-y-3 sm:space-y-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-orange-500/20 pb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500 text-black font-black shadow-[0_0_15px_rgba(249,115,22,0.6)] shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-black font-mono text-white tracking-wide flex items-center gap-1.5 flex-wrap">
              <span>{t('flash_sale.title')}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] bg-red-600 text-white font-bold uppercase shadow-sm">
                -81%
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] bg-orange-950/80 border border-orange-500/40 text-orange-300 font-mono hidden xs:inline">
                {t('flash_sale.deals_count', { count: flashProducts.length })}
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">{t('flash_sale.limited_time_slots')}</p>
          </div>
        </div>

        {/* Right Action: Countdown & View Mode Switcher */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Countdown Box */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-slate-300 bg-black/70 px-2 sm:px-3 py-1 rounded-lg border border-orange-500/30">
            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="hidden md:inline">{t('flash_sale.ends_in')}:</span>
            <div className="flex items-center gap-0.5 font-bold text-orange-300 font-mono">
              <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800">{String(timeLeft.hours).padStart(2, '0')}</span>:
              <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800">{String(timeLeft.minutes).padStart(2, '0')}</span>:
              <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Mobile Grid/Carousel Toggle */}
          <div className="flex sm:hidden items-center bg-black/60 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setMobileView('grid4')}
              className={`p-1 rounded transition-all ${
                mobileView === 'grid4' ? 'bg-orange-500 text-black font-bold' : 'text-slate-400'
              }`}
              title={t('flash_sale.grid_view')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileView('carousel')}
              className={`p-1 rounded transition-all ${
                mobileView === 'carousel' ? 'bg-orange-500 text-black font-bold' : 'text-slate-400'
              }`}
              title={t('flash_sale.carousel_view')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop Carousel Navigation Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded transition-all ${
                canScrollLeft
                  ? 'bg-slate-800 text-orange-400 hover:bg-orange-500 hover:text-black shadow-md cursor-pointer'
                  : 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
              }`}
              title={t('common.prev')}
              aria-label={t('common.prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1">
              {t('flash_sale.deals_count', { count: flashProducts.length })}
            </span>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-1.5 rounded transition-all ${
                canScrollRight
                  ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] cursor-pointer'
                  : 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
              }`}
              title={t('common.next')}
              aria-label={t('common.next')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE 4-TILE GRID VIEW (2x2 Grid on Mobile for effortless browsing) */}
      <div className={`sm:hidden ${mobileView === 'grid4' ? 'grid grid-cols-2 gap-2' : 'hidden'}`}>
        {flashProducts.slice(0, 4).map(product => {
          const claimedPercent = product.flashSaleStockClaimed || 80;
          const savings = product.discountPercent && product.discountPercent > 0 
            ? product.discountPercent 
            : Math.round(((product.retailPrice - product.groupPrice) / product.retailPrice) * 100);

          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct?.(product)}
              className="group cursor-pointer p-2 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-orange-500 transition-all flex flex-col justify-between select-none shadow-md"
            >
              {/* Product Thumbnail */}
              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-slate-800/80 bg-slate-900">
                <img
                  src={product.bannerImg}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-mono font-black bg-red-600 text-white uppercase shadow-sm">
                  -{savings}%
                </span>
                <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-black/80 text-orange-300 uppercase">
                  {product.platform}
                </span>
              </div>

              {/* Info Body */}
              <div className="mt-1.5 space-y-1">
                <h3 className="text-xs font-bold font-mono text-white line-clamp-1 group-hover:text-orange-300 transition-colors">
                  {product.title}
                </h3>

                {/* Mini Progress */}
                <div className="space-y-0.5">
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      style={{ width: `${claimedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span>{t('flash_sale.claimed_label')}: <strong className="text-white">{claimedPercent}%</strong></span>
                    <span className="text-orange-400 font-bold flex items-center gap-0.5">
                      <Zap className="w-2 h-2 fill-orange-400" />
                      {t('flash_sale.few_left')}
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-1 border-t border-slate-900 flex items-center justify-between">
                  <div>
                    <div className="text-[8px] line-through text-slate-500 font-mono">
                      {formatCurrency(product.retailPrice, currency)}
                    </div>
                    <div className="text-xs font-bold font-mono text-orange-400">
                      {formatCurrency(product.groupPrice, currency)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                    className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-400 text-black font-mono font-black text-[9px] uppercase shadow-sm flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{t('flash_sale.hunt_btn')}</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HORIZONTAL CAROUSEL OF FLASH PRODUCTS (Desktop & Mobile Carousel toggle) */}
      <div className={`relative ${mobileView === 'grid4' ? 'hidden sm:block' : 'block'}`}>
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-orange-500/40 hover:scrollbar-thumb-orange-500 scrollbar-track-slate-900/80 rounded-xl"
        >
          {flashProducts.map(product => {
            const claimedPercent = product.flashSaleStockClaimed || 80;
            const savings = product.discountPercent && product.discountPercent > 0 
              ? product.discountPercent 
              : Math.round(((product.retailPrice - product.groupPrice) / product.retailPrice) * 100);

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="w-[165px] xs:w-[185px] sm:w-[380px] md:w-[420px] shrink-0 snap-start group cursor-pointer p-2.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.25)] transition-all flex flex-col sm:flex-row gap-2 sm:gap-4 relative select-none"
              >
                <div className="w-full sm:w-28 md:w-32 h-20 sm:h-28 md:h-32 rounded-lg overflow-hidden shrink-0 border border-slate-800 relative bg-slate-900">
                  <img
                    src={product.bannerImg}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black bg-red-600 text-white uppercase shadow-md">
                    -{savings}%
                  </span>
                  <div className="absolute bottom-1 right-1 px-1 sm:px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-mono bg-black/80 text-orange-300 backdrop-blur-sm border border-orange-500/30">
                    {t('flash_sale.badge', { discount: savings })}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-1.5 min-w-0">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-orange-400 uppercase">
                        {product.platform}
                      </span>
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-mono">• {t('flash_sale.claimed_label')} {claimedPercent}%</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold font-mono text-white truncate group-hover:text-orange-300 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 mt-0.5 font-sans hidden sm:block">
                      {product.subtitle}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 rounded-full transition-all"
                        style={{ width: `${claimedPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-slate-400">
                      <span>{t('flash_sale.claimed_label')}: <strong className="text-white">{claimedPercent}/100</strong></span>
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-orange-400" />
                        <span className="hidden xs:inline">{t('flash_sale.few_left')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-slate-900">
                    <div>
                      <div className="text-[8px] sm:text-xs line-through text-slate-500 font-mono">
                        {formatCurrency(product.retailPrice, currency)}
                      </div>
                      <div className="text-xs sm:text-base font-bold font-mono text-orange-400">
                        {formatCurrency(product.groupPrice, currency)}
                      </div>
                    </div>

                    <span className="px-2 sm:px-3 py-1 rounded bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-[9px] sm:text-xs uppercase flex items-center gap-0.5 shadow-[0_0_10px_rgba(249,115,22,0.3)] group-hover:translate-x-0.5 transition-all">
                      <span>{t('flash_sale.hunt_btn')}</span>
                      <ChevronRight className="w-3 h-3 hidden sm:inline" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll Progress Bar at the bottom */}
        <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
            <span>{t('flash_sale.scroll_hint', { count: flashProducts.length })}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 w-32 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.max(15, scrollProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

