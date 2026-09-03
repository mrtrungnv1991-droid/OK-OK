import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Key, 
  PlusCircle, 
  Wallet, 
  Flame,
  Globe,
  Layers,
  CreditCard,
  Sparkles,
  Search,
  Users,
  Receipt,
  Wrench,
  Compass,
  FolderTree,
  User,
  ChevronDown,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  LogOut,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Coins,
  ShoppingCart
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { UserProfile, LanguageCode, CurrencyCode } from '../types';
import { getTranslation, SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES } from '../utils/i18n';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from '../i18n';

interface NavbarProps {

  user: UserProfile;
  currentLanguage: LanguageCode;
  activeOrdersCount: number;
  onOpenWallet: () => void;
  onOpenDepositHub: () => void;
  onOpenVault: () => void;
  onOpenCreatePool: () => void;
  onOpenLanguageModal: () => void;
  onCurrencyToggle: () => void;
  onQuickChangeLanguage?: (lang: LanguageCode, curr?: CurrencyCode) => void;
  onLogoClick: () => void;
  onOpenEscrowGuide: () => void;
  onOpenTopup: () => void;
  onOpenTickets: () => void;
  onOpenSuppliers: () => void;
  onOpenAdmin: () => void;
  onOpenTelcoCard: () => void;
  onOpenLuckyWheel: () => void;
  onOpenOrderLookup: () => void;
  onOpenAffiliate: () => void;
  onOpenLedger: () => void;
  onOpenKeyTools: () => void;
  onOpenFanMenu: () => void;
  containerMaxWidth?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentLanguage,
  activeOrdersCount,
  onOpenWallet,
  onOpenDepositHub,
  onOpenVault,
  onOpenCreatePool,
  onOpenLanguageModal,
  onCurrencyToggle,
  onQuickChangeLanguage,
  onLogoClick,
  onOpenEscrowGuide,
  onOpenTopup,
  onOpenTickets,
  onOpenSuppliers,
  onOpenAdmin,
  onOpenTelcoCard,
  onOpenLuckyWheel,
  onOpenOrderLookup,
  onOpenAffiliate,
  onOpenLedger,
  onOpenKeyTools,
  onOpenFanMenu,
  containerMaxWidth = 'max-w-7xl'
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isQuickLangOpen, setIsQuickLangOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const { t: translateKey, locale, setLocale } = useTranslation();
  const t = (key: string) => {
    const modern = translateKey(key);
    if (modern && modern !== key) return modern;
    return getTranslation(key, currentLanguage || locale);
  };
  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === (currentLanguage || locale)) || SUPPORTED_LANGUAGES[0];
  const activeCurrObj = SUPPORTED_CURRENCIES.find(c => c.code === user.currency) || SUPPORTED_CURRENCIES[0];
  const { totalCount: cartTotalCount, setIsCartOpen } = useCart();


  // Close menus when clicked outside or on Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsQuickLangOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setIsQuickLangOpen(false);
      }
    };

    if (isAccountMenuOpen || isQuickLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen, isQuickLangOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#07090e]/95 backdrop-blur-md">
      {/* Main Bar */}
      <div className={`w-full ${containerMaxWidth || 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2`}>
        {/* Brand / Logo */}
        <div className="flex items-center gap-1 sm:gap-3 cursor-pointer select-none shrink-0" onClick={onLogoClick}>
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-500 to-blue-600 clip-chamfer shadow-[0_0_16px_rgba(6,182,212,0.4)]">
            <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black font-black" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-base md:text-xl font-black tracking-wider text-white font-mono">
                CYBER<span className="text-cyan-400">POOL</span>
              </span>
              <span className="hidden lg:inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                TESLA ESCROW V4.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden md:block">
              {t('app_brand_sub')}
            </p>
          </div>
        </div>

        {/* Right Actions (Optimized for Mobile & Desktop) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* AI Language & Currency Switcher with Quick Popover */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsQuickLangOpen(!isQuickLangOpen)}
              className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono font-bold text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] active:scale-95 cursor-pointer"
              title={t('nav.language_currency')}
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span className="text-xs">{activeLangObj.flag}</span>
              <span className="hidden md:inline font-bold">{user.currency}</span>
              <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isQuickLangOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {/* Quick Language & Currency Dropdown */}
            {isQuickLangOpen && (
              <>
                {/* Click-outside touch backdrop for mobile */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden"
                  onClick={() => setIsQuickLangOpen(false)}
                  aria-hidden="true"
                />

                <div className="fixed left-2 right-2 top-14 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 w-[calc(100vw-16px)] max-w-[325px] sm:w-80 p-2.5 bg-[#090d16]/98 backdrop-blur-xl border border-cyan-500/60 rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.95)] z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80dvh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono font-bold text-white">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{t('nav.language_currency')}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsQuickLangOpen(false);
                          onOpenLanguageModal();
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        AI Hub ↗
                      </button>
                      <button
                        onClick={() => setIsQuickLangOpen(false)}
                        className="p-1 rounded text-slate-400 hover:text-white bg-slate-800/80 transition-colors sm:hidden cursor-pointer"
                        title={t('common.close')}
                      >
                        <X className="w-3 h-3 text-slate-200" />
                      </button>
                    </div>
                  </div>

                {/* Language Grid */}
                <div className="flex flex-col gap-1 pt-2 pb-2.5 border-b border-slate-800/80 max-h-56 overflow-y-auto pr-0.5">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = (currentLanguage || locale) === lang.code || (locale === 'en-US' && lang.code === 'en') || (locale === 'zh-CN' && lang.code === 'zh') || (locale === 'ja-JP' && lang.code === 'ja') || (locale === 'ko-KR' && lang.code === 'ko') || (locale === 'ru-RU' && lang.code === 'ru') || (locale === 'fr-FR' && lang.code === 'fr') || (locale === 'de-DE' && lang.code === 'de') || (locale === 'es-ES' && lang.code === 'es');
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLocale(lang.code as any);
                          if (onQuickChangeLanguage) {
                            onQuickChangeLanguage(lang.code, lang.defaultCurrency);
                          }
                          setIsQuickLangOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{lang.flag}</span>
                          <span className="font-bold text-[11px] opacity-90">{lang.displayCode}</span>
                          <span className="truncate text-[11px]">{lang.nativeName}</span>
                        </div>
                        {isSelected && (
                          <span className="text-black font-black text-xs shrink-0 ml-1">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Currency Row */}
                <div className="pt-2">
                  <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>{t('currency_oracle.currency_title')}:</span>
                    <span className="text-cyan-400 font-bold">{user.currency}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {SUPPORTED_CURRENCIES.map((curr) => {
                      const isSelected = user.currency === curr.code;
                      return (
                        <button
                          key={curr.code}
                          onClick={() => {
                            if (onQuickChangeLanguage) {
                              onQuickChangeLanguage(currentLanguage, curr.code);
                            }
                            setIsQuickLangOpen(false);
                          }}
                          className={`flex items-center justify-center gap-0.5 py-1 px-1 rounded text-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-black shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span>{curr.symbol}</span>
                          <span>{curr.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Button to open advanced AI Localization & Oracle */}
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  <button
                    onClick={() => {
                      setIsQuickLangOpen(false);
                      onOpenLanguageModal();
                    }}
                    className="py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/40 text-cyan-300 hover:text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all hover:brightness-110"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>AI Hub ↗</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsQuickLangOpen(false);
                      onOpenLanguageModal();
                    }}
                    className="py-1.5 px-2 rounded-lg bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/40 text-emerald-300 hover:text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all hover:brightness-110"
                    title={t('currency_oracle.hourly_cron_active')}
                  >
                    <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Cron 1h (0 * * * *)</span>
                  </button>
                </div>
              </div>
            </>
          )}
          </div>

          {/* Fan Menu (All Devices Primary Action) */}
          <button
            onClick={onOpenFanMenu}
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold font-mono text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer shrink-0"
            title={t('nav.utilities')}
          >
            <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="font-black tracking-tight hidden sm:inline">{t('nav.utilities')}</span>
            <span className="font-black tracking-tight sm:hidden">18</span>
          </button>

          {/* Create Pool Button (Tablet & Desktop) */}
          <button
            onClick={onOpenCreatePool}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('nav.create_pool')}</span>
          </button>

          {/* Shopping Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative flex items-center gap-1 p-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-medium font-mono rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 ${
              cartTotalCount > 0
                ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse'
                : 'text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700'
            }`}
            title={t('nav.cart')}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">{t('nav.cart')}</span>
            {cartTotalCount > 0 && (
              <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                {cartTotalCount}
              </span>
            )}
          </button>

          {/* Prominent User Account Section with Dropdown */}
          <div className="relative shrink-0" ref={accountMenuRef}>
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-slate-900 via-[#0d1424] to-slate-900 hover:to-[#131c33] border border-cyan-500/50 hover:border-cyan-400 rounded-lg transition-all active:scale-95 text-left cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              title={t('nav.account_menu')}
            >
              {/* User Avatar with Status Dot */}
              <div className="relative shrink-0">
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse"></span>
              </div>

              {/* Account Info (Name & Balance - Desktop/Tablet) */}
              <div className="hidden sm:block min-w-0 pr-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold font-mono text-white truncate max-w-[90px]">
                    {user.name}
                  </span>
                  <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    VIP
                  </span>
                </div>
                <div className="text-[11px] font-bold font-mono text-emerald-400 leading-none mt-0.5">
                  {formatCurrency(user.walletBalance, user.currency)}
                </div>
              </div>

              <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {/* Smart Account Dropdown: Directly positioned from top, perfectly aligned on phone and desktop */}
            {isAccountMenuOpen && (
              <>
                {/* Click-outside touch backdrop for mobile */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden"
                  onClick={() => setIsAccountMenuOpen(false)}
                  aria-hidden="true"
                />

                <div className="fixed right-2 top-14 sm:absolute sm:right-0 sm:top-full sm:mt-1.5 w-[calc(100vw-16px)] max-w-[325px] sm:w-80 max-h-[75dvh] sm:max-h-[75vh] overflow-y-auto overscroll-contain bg-[#090d16]/98 backdrop-blur-xl border border-cyan-500/60 rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.95)] z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 scrollbar-thin scrollbar-thumb-cyan-500/40 scrollbar-track-black/40">
                  {/* Sticky Header: Profile info & Quick Close */}
                  <div className="sticky top-0 z-10 p-2 sm:p-2.5 bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border-b border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt={user.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        />
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#090d16]"></span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs sm:text-sm font-bold font-mono text-white truncate max-w-[130px]">
                            {user.name}
                          </h4>
                          <span className="px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50 uppercase shrink-0">
                            {user.role === 'admin' ? t('nav.role_admin') : t('nav.role_vip')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-slate-400 truncate">
                          <span className="text-emerald-400 font-bold">
                            {formatCurrency(user.walletBalance, user.currency)}
                          </span>
                          <span>• {activeLangObj.flag} {user.currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Smart Close Button */}
                    <button
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                      title={t('common.close')}
                    >
                      <X className="w-3.5 h-3.5 text-slate-200" />
                    </button>
                  </div>

                  {/* Compact Balances & Action Bar */}
                  <div className="p-1.5 sm:p-2 bg-black/50 border-b border-slate-800/80 space-y-1 sm:space-y-1.5">
                    <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                      <div className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">{t('nav.available')}:</span>
                        <span className="text-[10px] sm:text-xs font-black font-mono text-emerald-400 truncate ml-1">
                          {formatCurrency(user.walletBalance, user.currency)}
                        </span>
                      </div>
                      <div className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">{t('nav.escrow_locked')}:</span>
                        <span className="text-[10px] sm:text-xs font-black font-mono text-cyan-400 truncate ml-1">
                          {formatCurrency(user.escrowLocked, user.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        onClick={() => { setIsAccountMenuOpen(false); onOpenDepositHub(); }}
                        className="flex-1 py-1 px-1.5 rounded bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold font-mono text-[9px] sm:text-[11px] uppercase transition-all hover:brightness-110 shadow-sm text-center cursor-pointer truncate"
                      >
                        {t('nav.deposit')}
                      </button>
                      <button
                        onClick={() => { setIsAccountMenuOpen(false); onOpenWallet(); }}
                        className="flex-1 py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-[9px] sm:text-[11px] transition-all text-center cursor-pointer truncate"
                      >
                        {t('nav.wallet_settings')}
                      </button>
                    </div>
                  </div>

                  {/* Account Action Menu Links */}
                  <div className="p-1.5 space-y-0.5 font-mono text-xs">
                    {/* Language & Currency Hub Banner Button */}
                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenLanguageModal(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-950 via-teal-950 to-slate-900 border border-cyan-400/50 text-cyan-300 hover:from-cyan-900 hover:to-teal-900 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)] mb-1 cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-[11px] sm:text-xs">🌐 {t('nav.language_currency')}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-400 text-black font-black uppercase">
                        {activeLangObj.flag} {user.currency}
                      </span>
                    </button>

                    {/* All 18 Features Directory Banner */}
                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenFanMenu(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-950 via-blue-950 to-slate-900 border border-cyan-400/50 text-cyan-300 hover:from-cyan-900 hover:to-blue-900 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)] mb-1 cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                        <span className="font-bold text-white text-[11px] sm:text-xs">✨ {t('nav.utilities')}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-400 text-black font-black uppercase">
                        18 TOOLS
                      </span>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenVault(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>{t('nav.key_vault')}</span>
                      </div>
                      {activeOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold text-[10px]">
                          {activeOrdersCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenTopup(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span>{t('topup.title')}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenLuckyWheel(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{t('nav.lucky_wheel')}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenLedger(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-cyan-400" />
                        <span>{t('nav.transaction_ledger')}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenAffiliate(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>{t('nav.affiliate_reseller')}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenTickets(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{t('nav.support_tickets')}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenKeyTools(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        <span>{t('nav.key_tools')}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsAccountMenuOpen(false); onOpenEscrowGuide(); }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>{t('nav.escrow_workflow')}</span>
                      </div>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setIsAccountMenuOpen(false); onOpenAdmin(); }}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 transition-colors border border-red-500/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                          <span className="font-bold">⚡ ADCP Admin Control</span>
                        </div>
                        <span className="text-[9px] bg-red-600 text-white px-1 rounded">ADMIN</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};




