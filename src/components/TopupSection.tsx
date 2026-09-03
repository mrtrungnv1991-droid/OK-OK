import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Gamepad2, 
  Zap, 
  Users, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Flame, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { GameItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface TopupSectionProps {
  games: GameItem[];
  currency: 'VND' | 'USD';
  onSelectGame: (game: GameItem) => void;
}

export const TopupSection: React.FC<TopupSectionProps> = ({
  games,
  currency,
  onSelectGame
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('grid');
  const [displayCount, setDisplayCount] = useState<number>(24);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const publishers = useMemo(() => {
    const list = Array.from(new Set(games.map(g => g.publisher).filter(Boolean)));
    return ['all', ...list.slice(0, 10)];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPub = selectedPublisher === 'all' || g.publisher.toLowerCase() === selectedPublisher.toLowerCase();
      return matchSearch && matchPub;
    });
  }, [games, searchTerm, selectedPublisher]);

  const visibleGridGames = filteredGames.slice(0, displayCount);

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
  }, [filteredGames, viewMode]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollDistance = 420;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide flex items-center gap-2 flex-wrap">
              <span>{t('topup.title')}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                {games.length} GAMES • 1.702 TIERS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono hidden sm:inline">
                API Live 3s
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {t('topup.subtitle')}
            </p>
          </div>
        </div>

        {/* Top Controls: View Mode & Scroll Arrows */}
        <div className="flex items-center gap-3 justify-between lg:justify-end flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Carousel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Carousel Arrow Buttons (In carousel mode) */}
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
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">
                {t('common.scroll')}
              </span>
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className={`p-1.5 rounded transition-all ${
                  canScrollRight
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] cursor-pointer'
                    : 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Publisher Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none font-mono text-[11px]">
          <button
            onClick={() => setSelectedPublisher('all')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              selectedPublisher === 'all'
                ? 'bg-cyan-500 text-black font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t('common.all')} ({games.length})
          </button>
          {publishers.filter(p => p !== 'all').map(pub => (
            <button
              key={pub}
              onClick={() => setSelectedPublisher(pub)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                selectedPublisher === pub
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {pub}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Horizontal Carousel or Grid */}
      {filteredGames.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
          <Filter className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-xs font-mono text-slate-400">{t('errors.not_found')}</div>
        </div>
      ) : viewMode === 'carousel' ? (
        /* HORIZONTAL SYNCHRONIZED CAROUSEL VIEW */
        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-cyan-500/40 hover:scrollbar-thumb-cyan-400 scrollbar-track-slate-900/80 rounded-xl"
          >
            {filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="w-[140px] xs:w-[160px] sm:w-[190px] shrink-0 snap-start group cursor-pointer rounded-xl bg-gradient-to-b from-[#0e1320] to-[#080a10] border border-slate-800 hover:border-cyan-400 p-2 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] relative overflow-hidden select-none"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-1 left-1 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-black/80 text-cyan-300 border border-cyan-500/30 uppercase backdrop-blur-xs">
                      {game.category || 'Game'}
                    </span>
                    <span className="absolute top-1 right-1 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                      {game.tiers.length} {t('common.items')}
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-xs font-bold font-mono text-white truncate group-hover:text-cyan-300 transition-colors">
                      {game.name}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center justify-between">
                      <span className="text-slate-500 truncate max-w-[75px] sm:max-w-[90px]">{game.publisher}</span>
                      {game.tiers[0] && (
                        <span className="text-emerald-400 font-bold">
                          -{Math.round(((game.tiers[0].retailPrice - game.tiers[0].groupPrice) / game.tiers[0].retailPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs font-mono">
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-500">{t('common.from') || 'From'}</div>
                    <div className="font-bold text-cyan-400 text-xs sm:text-sm">
                      {game.tiers[0] ? formatCurrency(game.tiers[0].groupPrice, currency) : t('common.contact_support')}
                    </div>
                  </div>

                  <div className="p-1 sm:p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-hover:text-black text-cyan-400 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Interactive Scroll Indicator Bar */}
          <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>{filteredGames.length} {t('categories.gaming')}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(10, scrollProgress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW MODE WITH EXPAND / COLLAPSE (THU GỌN) */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
            {visibleGridGames.map(game => (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="group cursor-pointer rounded-xl bg-gradient-to-b from-[#0e1320] to-[#080a10] border border-slate-800 hover:border-cyan-400 p-2 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] relative overflow-hidden"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-1 left-1 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-black/80 text-cyan-300 border border-cyan-500/30 uppercase backdrop-blur-xs">
                      {game.category || 'Game'}
                    </span>
                    <span className="absolute top-1 right-1 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                      {game.tiers.length} {t('common.items')}
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-xs font-bold font-mono text-white truncate group-hover:text-cyan-300 transition-colors">
                      {game.name}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center justify-between">
                      <span className="text-slate-500 truncate max-w-[75px] sm:max-w-[90px]">{game.publisher}</span>
                      {game.tiers[0] && (
                        <span className="text-emerald-400 font-bold">
                          -{Math.round(((game.tiers[0].retailPrice - game.tiers[0].groupPrice) / game.tiers[0].retailPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs font-mono">
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-500">{t('common.from') || 'From'}</div>
                    <div className="font-bold text-cyan-400 text-xs sm:text-sm">
                      {game.tiers[0] ? formatCurrency(game.tiers[0].groupPrice, currency) : t('common.contact_support')}
                    </div>
                  </div>

                  <div className="p-1 sm:p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-hover:text-black text-cyan-400 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expand and Collapse Dual-Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {filteredGames.length > displayCount && (
              <button
                onClick={() => setDisplayCount(prev => Math.min(prev + 18, filteredGames.length))}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-1.5"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{t('common.view_all')} (+18) • {displayCount}/{filteredGames.length}</span>
              </button>
            )}

            {displayCount > 18 && (
              <button
                onClick={() => {
                  setDisplayCount(18);
                  window.scrollTo({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-lg bg-slate-900/90 hover:bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronUp className="w-4 h-4" />
                <span>{t('common.close')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

