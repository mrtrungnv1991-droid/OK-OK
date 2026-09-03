import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Flame, 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Filter,
  Gift
} from 'lucide-react';
import { Product, GroupPool, CurrencyCode } from '../types';
import { useTranslation } from '../i18n';
import { ProductCard } from './ProductCard';

interface ActivePoolsShowcaseProps {
  products: Product[];
  currency: CurrencyCode;
  onJoinPool?: (product: Product, pool?: GroupPool) => void;
  onOpenPool?: (product: Product, pool?: GroupPool) => void;
  onInstantBuy?: (product: Product) => void;
  onCreateNewPool?: (product?: Product) => void;
}

export const ActivePoolsShowcase: React.FC<ActivePoolsShowcaseProps> = ({
  products,
  currency,
  onJoinPool,
  onOpenPool,
  onInstantBuy,
  onCreateNewPool
}) => {
  const { t } = useTranslation();
  const handleJoin = onJoinPool || onOpenPool;
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'almost_full' | 'hot' | 'ai' | 'gaming' | 'giftup'>('all');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Extract all active pools across products
  const allActivePools = products.flatMap(prod => 
    (prod.activePools || []).map(pool => ({
      product: prod,
      pool: pool
    }))
  );

  // Filter products based on selected tab
  const displayedProducts = products.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'almost_full') {
      const activePool = p.activePools[0];
      return activePool && (activePool.filledSlots / activePool.targetSlots) >= 0.6;
    }
    if (filterType === 'hot') {
      return p.activePools.some(pool => pool.isHot || pool.filledSlots >= 3);
    }
    if (filterType === 'ai') return p.category === 'ai_tools';
    if (filterType === 'gaming') return p.category === 'gaming';
    if (filterType === 'giftup') return p.category === 'giftup_cards';
    return true;
  });

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      const total = scrollWidth - clientWidth;
      setScrollProgress(total > 0 ? (scrollLeft / total) * 100 : 0);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayedProducts, viewMode]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollDistance = 460;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header with Live Status & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Flame className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
              <span>{t('showcase.title')}</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                {t('showcase.items_count', { count: displayedProducts.length })}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t('showcase.escrow_note')}</span>
          </p>
        </div>

        {/* View Mode & Navigation Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'all' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('categories.all')} ({products.length})
            </button>
            <button
              onClick={() => setFilterType('almost_full')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                filterType === 'almost_full' ? 'bg-orange-500 text-black font-bold' : 'text-slate-400 hover:text-orange-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              {t('categories.almost_full')}
            </button>
            <button
              onClick={() => setFilterType('ai')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'ai' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              {t('categories.ai_tools')}
            </button>
            <button
              onClick={() => setFilterType('gaming')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'gaming' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              {t('categories.gaming')}
            </button>
            <button
              onClick={() => setFilterType('giftup')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'giftup' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              {t('categories.giftup_cards')}
            </button>
          </div>

          {/* View Mode Toggles */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                viewMode === 'carousel'
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t('showcase.scroll_mode')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('showcase.scroll_mode')}</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t('showcase.grid_mode')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('showcase.grid_mode')}</span>
            </button>
          </div>

          {/* Carousel Left/Right Scroll Arrows (When in Carousel mode) */}
          {viewMode === 'carousel' && (
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 rounded transition-all ${
                  canScrollLeft
                    ? 'bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-md cursor-pointer'
                    : 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                }`}
                title={t('common.prev')}
                aria-label={t('common.prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className={`p-1.5 rounded transition-all ${
                  canScrollRight
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] cursor-pointer'
                    : 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                }`}
                title={t('common.next')}
                aria-label={t('common.next')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Chips Bar */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-2 text-xs font-mono scrollbar-none">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full shrink-0 border ${
            filterType === 'all' ? 'bg-cyan-500 text-black border-cyan-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          {t('categories.all')} ({products.length})
        </button>
        <button
          onClick={() => setFilterType('almost_full')}
          className={`px-3 py-1 rounded-full shrink-0 border ${
            filterType === 'almost_full' ? 'bg-orange-500 text-black border-orange-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          ⚡ {t('categories.almost_full')}
        </button>
        <button
          onClick={() => setFilterType('ai')}
          className={`px-3 py-1 rounded-full shrink-0 border ${
            filterType === 'ai' ? 'bg-purple-600 text-white border-purple-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          {t('categories.ai_tools')}
        </button>
        <button
          onClick={() => setFilterType('gaming')}
          className={`px-3 py-1 rounded-full shrink-0 border ${
            filterType === 'gaming' ? 'bg-emerald-600 text-white border-emerald-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          {t('categories.gaming')}
        </button>
        <button
          onClick={() => setFilterType('giftup')}
          className={`px-3 py-1 rounded-full shrink-0 border ${
            filterType === 'giftup' ? 'bg-amber-600 text-white border-amber-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          {t('categories.giftup_cards')}
        </button>
      </div>

      {/* Main Content Area: Horizontal Carousel or Grid */}
      {displayedProducts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <Filter className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 mx-auto" />
          <div className="text-xs sm:text-sm font-mono text-slate-300">{t('products.no_products_found')}</div>
          <button
            onClick={() => setFilterType('all')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs cursor-pointer"
          >
            {t('categories.all')}
          </button>
        </div>
      ) : viewMode === 'carousel' ? (
        /* HORIZONTAL CAROUSEL SCROLLER MODE */
        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-2.5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-cyan-500/40 hover:scrollbar-thumb-cyan-400 scrollbar-track-slate-900/80 rounded-xl"
          >
            {displayedProducts.map(product => (
              <div
                key={product.id}
                className="w-[165px] xs:w-[190px] sm:w-[320px] md:w-[360px] shrink-0 snap-start flex flex-col"
              >
                <ProductCard
                  product={product}
                  currency={currency}
                  onJoinPool={handleJoin}
                  onInstantBuy={onInstantBuy}
                  onCreateNewPoolForProduct={onCreateNewPool}
                />
              </div>
            ))}
          </div>

          {/* Bottom Interactive Scroll Indicator Bar */}
          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>
                {t('showcase.scroll_hint', { count: displayedProducts.length })}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(12, scrollProgress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW MODE: 2 cols on mobile (4 tiles per screen view), 3-4 cols on desktop */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {displayedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onJoinPool={handleJoin}
              onInstantBuy={onInstantBuy}
              onCreateNewPoolForProduct={onCreateNewPool}
            />
          ))}
        </div>
      )}
    </div>
  );
};
