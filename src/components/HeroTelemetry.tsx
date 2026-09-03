import React from 'react';
import { 
  Search, 
  Sparkles, 
  Gamepad2, 
  Tv, 
  Layers, 
  Gift, 
  Shield, 
  Bot, 
  Filter, 
  Zap,
  ShieldCheck, 
  Compass,
  PlusCircle, 
  CreditCard, 
  CircleDollarSign, 
  TrendingUp, 
  History,
  Lock,
  Clock,
  Award,
  Star
} from 'lucide-react';
import { ProductCategory, UserProfile, CurrencyCode, HeroCustomConfig, UiLayoutConfig } from '../types';
import { DEFAULT_HERO_CONFIG } from './admin/AdminHeroLayoutTab';
import { MainModulesBar } from './MainModulesBar';
import { useTranslation, getLocalizedHeroConfig } from '../i18n';

interface HeroTelemetryProps {
  user?: UserProfile;
  currency?: CurrencyCode;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  selectedCategory?: ProductCategory;
  onSelectCategory?: (category: ProductCategory) => void;
  sortBy?: 'savings' | 'ending_soon' | 'price_asc' | 'popular' | 'price_low' | 'price_high' | 'rating' | 'discount';
  onSortChange?: (sort: any) => void;
  totalProductsCount?: number;
  moduleCounts?: {
    all: number;
    accounts: number;
    key_games: number;
    key_apps: number;
    topup_games: number;
    ai_tools: number;
  };
  onOpenTopupModal?: () => void;
  heroConfig?: HeroCustomConfig;
  uiLayoutConfig?: UiLayoutConfig;
  onOpenCreatePool?: () => void;
  onOpenEscrowGuide?: () => void;
  onOpenTopup?: () => void;
  onOpenTelcoCard?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenDepositHub?: () => void;
  onOpenAffiliate?: () => void;
  onOpenLedger?: () => void;
  onOpenFanMenu?: () => void;
}

export const HeroTelemetry: React.FC<HeroTelemetryProps> = ({
  user,
  currency = 'VND',
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'all',
  onSelectCategory,
  sortBy = 'popular',
  onSortChange,
  totalProductsCount = 12,
  moduleCounts,
  onOpenTopupModal,
  heroConfig = DEFAULT_HERO_CONFIG,
  uiLayoutConfig,
  onOpenCreatePool,
  onOpenEscrowGuide,
  onOpenTopup,
  onOpenTelcoCard,
  onOpenLuckyWheel,
  onOpenDepositHub,
  onOpenAffiliate,
  onOpenLedger,
  onOpenFanMenu
}) => {
  const { t, locale } = useTranslation();
  const rawConfig = { 
    ...DEFAULT_HERO_CONFIG, 
    ...(heroConfig || {}),
    ...(uiLayoutConfig?.siteContainerWidth ? { containerMaxWidth: uiLayoutConfig.siteContainerWidth } : {})
  };
  const config = getLocalizedHeroConfig(rawConfig, locale, t);

  const categories: { id: ProductCategory; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: t('categories.all'), icon: <Sparkles className="w-3.5 h-3.5" />, count: totalProductsCount },
    { id: 'ai_tools', label: t('categories.ai_tools'), icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'gaming', label: t('categories.gaming'), icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'giftup_cards', label: t('categories.giftup_cards'), icon: <Gift className="w-3.5 h-3.5" /> },
    { id: 'streaming', label: t('categories.streaming'), icon: <Tv className="w-3.5 h-3.5" /> },
    { id: 'software', label: t('categories.software'), icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'vpn', label: t('categories.vpn'), icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  // Helper for gradient styling
  const getGradientClass = (gradient: string) => {
    switch (gradient) {
      case 'gold_amber':
        return 'from-amber-300 via-yellow-400 to-orange-500';
      case 'purple_rose':
        return 'from-purple-400 via-pink-400 to-rose-500';
      case 'emerald_teal':
        return 'from-emerald-300 via-teal-400 to-green-500';
      case 'fire_red':
        return 'from-red-400 via-orange-400 to-amber-500';
      case 'cyan_blue':
      default:
        return 'from-cyan-400 via-teal-300 to-blue-500';
    }
  };

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400';
      case 'purple':
        return 'bg-purple-950/90 border-purple-500/40 text-purple-400';
      case 'amber':
        return 'bg-amber-950/90 border-amber-500/40 text-amber-400';
      case 'red':
        return 'bg-red-950/90 border-red-500/40 text-red-400';
      case 'cyan':
      default:
        return 'bg-cyan-950/90 border-cyan-500/40 text-cyan-400';
    }
  };

  const getPaddingClass = (padding?: string) => {
    switch (padding) {
      case 'compact':
        return 'py-3 sm:py-5';
      case 'generous':
        return 'py-8 sm:py-12';
      case 'standard':
      default:
        return 'py-5 sm:py-8';
    }
  };

  const getPodIcon = (icon: string) => {
    switch (icon) {
      case 'shield':
      case 'shield_check':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'clock':
        return <Clock className="w-3.5 h-3.5 text-cyan-400" />;
      case 'lock':
        return <Lock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'award':
      case 'star':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 'zap':
      default:
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Launchpad action mapper
  const handleLaunchpadAction = (key: string) => {
    switch (key) {
      case 'topup':
        if (onOpenTopup) onOpenTopup();
        break;
      case 'createPool':
        if (onOpenCreatePool) onOpenCreatePool();
        break;
      case 'depositHub':
        if (onOpenDepositHub) onOpenDepositHub();
        break;
      case 'telcoCard':
        if (onOpenTelcoCard) onOpenTelcoCard();
        break;
      case 'luckyWheel':
        if (onOpenLuckyWheel) onOpenLuckyWheel();
        break;
      case 'affiliate':
        if (onOpenAffiliate) onOpenAffiliate();
        break;
      case 'escrowGuide':
        if (onOpenEscrowGuide) onOpenEscrowGuide();
        break;
      case 'txLedger':
        if (onOpenLedger) onOpenLedger();
        break;
      case 'fanMenu':
        if (onOpenFanMenu) onOpenFanMenu();
        break;
      default:
        break;
    }
  };

  const getButtonColorScheme = (scheme: string) => {
    switch (scheme) {
      case 'blue':
        return 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'emerald':
        return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'purple':
        return 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'amber':
        return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'indigo':
        return 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'slate':
        return 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80';
      case 'cyan':
      default:
        return 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className={`relative border-b border-slate-800 bg-[#07090e] overflow-hidden ${
      config.heroBackground === 'cyber_grid' ? 'cyber-grid' : ''
    }`}>
      {/* Ambient background glow */}
      {config.heroBackground !== 'minimal_dark' && (
        <>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      {/* Hero Container with Configurable Proportions & Max Width */}
      <div className={`w-full ${config.containerMaxWidth || 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 ${getPaddingClass(config.verticalPadding)}`}>
        {/* Main Title & Value Proposition Grid */}
        <div className={`flex ${
          config.contentAlignment === 'center' 
            ? 'flex-col items-center text-center' 
            : config.contentAlignment === 'left' 
              ? 'flex-col items-start text-left' 
              : 'flex-col lg:flex-row lg:items-end justify-between'
        } gap-4 sm:gap-6 mb-5 sm:mb-6`}>
          <div className="max-w-3xl">
            {config.badgeActive && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] sm:text-xs font-mono mb-2.5 shadow-sm ${getBadgeColorClass(config.badgeColor)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                {config.badgeText}
              </div>
            )}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase font-mono leading-tight">
              {config.mainHeadingLine1} <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${getGradientClass(config.mainHeadingGradient)}`}>
                {config.mainHeadingLine2}
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-2.5 font-normal leading-relaxed max-w-2xl font-sans">
              {config.subheading}
            </p>
          </div>

          {/* Telemetry Metrics Pod - Clean Customer Values */}
          {config.showTrustPods && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3 font-mono text-xs shrink-0 w-full sm:w-auto">
              {config.trustPod1?.active && (
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-colors shadow-sm">
                  <div className="text-slate-400 text-[9px] sm:text-[10px] uppercase flex items-center gap-1">
                    {getPodIcon(config.trustPod1.icon)}
                    <span>{config.trustPod1.title}</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-cyan-400 mt-1">{config.trustPod1.value}</div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-400 mt-0.5">{config.trustPod1.sub}</div>
                </div>
              )}

              {config.trustPod2?.active && (
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors shadow-sm">
                  <div className="text-slate-400 text-[9px] sm:text-[10px] uppercase flex items-center gap-1">
                    {getPodIcon(config.trustPod2.icon)}
                    <span>{config.trustPod2.title}</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-400 mt-1">{config.trustPod2.value}</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{config.trustPod2.sub}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Category Modules Bar (DANH MỤC TRỌNG TÂM - Replaced Launchpad) */}
        {onSelectCategory && (
          <div className="mb-2">
            <MainModulesBar
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onOpenTopupModal={onOpenTopupModal || onOpenTopup}
              counts={moduleCounts || {
                all: totalProductsCount,
                accounts: 6,
                key_games: 5,
                key_apps: 4,
                topup_games: 4,
                ai_tools: 3
              }}
            />
          </div>
        )}

        {/* Search & Filter Command Bar */}
        {onSearchChange && onSelectCategory && (
          <div className="space-y-3 sm:space-y-4 pt-2 border-t border-slate-800/80">
            <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t('nav.search_placeholder')}
                  className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:outline-none rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 font-mono transition-all shadow-inner"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                  >
                    {t('common.clear')}
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              {onSortChange && (
                <div className="flex items-center gap-2">
                  <div className="w-full md:w-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300">
                    <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="hidden sm:inline text-slate-400">{t('common.filter')}:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => onSortChange(e.target.value as any)}
                      className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer w-full md:w-auto text-xs"
                    >
                      <option value="popular" className="bg-slate-900 text-white">{t('products.sort_popular')}</option>
                      <option value="savings" className="bg-slate-900 text-white">{t('products.sort_savings')}</option>
                      <option value="price_low" className="bg-slate-900 text-white">{t('products.sort_price_low')}</option>
                      <option value="price_high" className="bg-slate-900 text-white">{t('products.sort_price_high')}</option>
                      <option value="rating" className="bg-slate-900 text-white">{t('marketplace.sort_rating')}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
