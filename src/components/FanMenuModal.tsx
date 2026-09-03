import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Zap,
  Flame,
  PlusCircle,
  Key,
  CreditCard,
  Sparkles,
  Search,
  ShieldCheck,
  Users,
  Receipt,
  Wrench,
  Layers,
  HelpCircle,
  Settings,
  Wallet,
  Globe,
  Grid,
  ChevronRight,
  FolderTree,
  SlidersHorizontal,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTranslation } from '../i18n';

export interface FanMenuItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'finance' | 'gaming' | 'tools' | 'support' | 'admin';
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  color: string;
  action: () => void;
}

interface FanMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  activeOrdersCount?: number;
  onOpenWallet?: () => void;
  onOpenDepositHub?: () => void;
  onOpenVault?: () => void;
  onOpenCreatePool?: () => void;
  onCurrencyToggle?: () => void;
  onOpenEscrowGuide?: () => void;
  onOpenTopup?: () => void;
  onOpenTickets?: () => void;
  onOpenSuppliers?: () => void;
  onOpenAdmin?: () => void;
  onOpenTelcoCard?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenOrderLookup?: () => void;
  onOpenAffiliate?: () => void;
  onOpenLedger?: () => void;
  onOpenKeyTools?: () => void;
}

export const FanMenuModal: React.FC<FanMenuModalProps> = ({
  isOpen,
  onClose,
  user,
  activeOrdersCount = 0,
  onOpenWallet = () => {},
  onOpenDepositHub = () => {},
  onOpenVault = () => {},
  onOpenCreatePool = () => {},
  onCurrencyToggle = () => {},
  onOpenEscrowGuide = () => {},
  onOpenTopup = () => {},
  onOpenTickets = () => {},
  onOpenSuppliers = () => {},
  onOpenAdmin = () => {},
  onOpenTelcoCard = () => {},
  onOpenLuckyWheel = () => {},
  onOpenOrderLookup = () => {},
  onOpenAffiliate = () => {},
  onOpenLedger = () => {},
  onOpenKeyTools = () => {}
}) => {
  const { t } = useTranslation();
  const activeCurrency = user?.currency || 'VND';
  const [selectedTab, setSelectedTab] = useState<'all' | 'finance' | 'gaming' | 'tools' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState<'fan' | 'grid'>('fan');

  const menuItems: FanMenuItem[] = [
    {
      id: 'topup',
      title: t('nav.topup'),
      subtitle: '121 Game • Instant API',
      category: 'gaming',
      icon: <Zap className="w-5 h-5" />,
      badge: '121 GAMES',
      badgeColor: 'bg-cyan-500 text-black',
      color: 'from-cyan-500 to-blue-600',
      action: () => { onClose(); onOpenTopup(); }
    },
    {
      id: 'flash_sale',
      title: t('nav.flash_sales'),
      subtitle: 'Flash deals up to -81%',
      category: 'gaming',
      icon: <Flame className="w-5 h-5" />,
      badge: 'HOT -81%',
      badgeColor: 'bg-rose-600 text-white',
      color: 'from-orange-500 to-rose-600',
      action: () => {
        onClose();
        const el = document.querySelector('section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      id: 'lucky_wheel',
      title: t('lucky_wheel.title'),
      subtitle: 'Gems, gift cards, jackpot live',
      category: 'tools',
      icon: <Sparkles className="w-5 h-5" />,
      badge: 'JACKPOT',
      badgeColor: 'bg-amber-400 text-black font-black animate-pulse',
      color: 'from-amber-400 to-orange-500',
      action: () => { onClose(); onOpenLuckyWheel(); }
    },
    {
      id: 'telco_card',
      title: t('telco.title'),
      subtitle: 'Viettel, Vina, Mobi API',
      category: 'finance',
      icon: <CreditCard className="w-5 h-5" />,
      badge: 'CARD API',
      badgeColor: 'bg-emerald-500 text-black',
      color: 'from-emerald-400 to-teal-600',
      action: () => { onClose(); onOpenTelcoCard(); }
    },
    {
      id: 'deposit_hub',
      title: t('deposit.title'),
      subtitle: 'QR Code, Momo, USDT',
      category: 'finance',
      icon: <CreditCard className="w-5 h-5" />,
      badge: 'AUTO',
      badgeColor: 'bg-cyan-400 text-black',
      color: 'from-cyan-400 to-emerald-500',
      action: () => { onClose(); onOpenDepositHub(); }
    },
    {
      id: 'key_vault',
      title: t('nav.vault'),
      subtitle: t('key_vault.subtitle'),
      category: 'gaming',
      icon: <Key className="w-5 h-5" />,
      badge: activeOrdersCount > 0 ? `${activeOrdersCount} KEY` : undefined,
      badgeColor: 'bg-amber-500 text-black',
      color: 'from-amber-400 to-yellow-600',
      action: () => { onClose(); onOpenVault(); }
    },
    {
      id: 'create_pool',
      title: t('nav.create_pool'),
      subtitle: t('create_pool.subtitle'),
      category: 'gaming',
      icon: <PlusCircle className="w-5 h-5" />,
      badge: 'WHOLESALE',
      badgeColor: 'bg-cyan-900 text-cyan-300',
      color: 'from-cyan-500 to-indigo-600',
      action: () => { onClose(); onOpenCreatePool(); }
    },
    {
      id: 'order_lookup',
      title: 'Order Lookup',
      subtitle: 'Track order status by ID',
      category: 'tools',
      icon: <Search className="w-5 h-5" />,
      badge: 'LIVE',
      badgeColor: 'bg-slate-700 text-slate-200',
      color: 'from-slate-600 to-slate-800',
      action: () => { onClose(); onOpenOrderLookup(); }
    },
    {
      id: 'wallet',
      title: t('nav.wallet'),
      subtitle: 'Balance, top-up, security',
      category: 'finance',
      icon: <Wallet className="w-5 h-5" />,
      badge: activeCurrency,
      badgeColor: 'bg-emerald-950 border border-emerald-500/40 text-emerald-300',
      color: 'from-emerald-500 to-green-700',
      action: () => { onClose(); onOpenWallet(); }
    },
    {
      id: 'ledger',
      title: 'Ledger & Statements',
      subtitle: 'Transaction history',
      category: 'finance',
      icon: <Receipt className="w-5 h-5" />,
      color: 'from-teal-500 to-cyan-700',
      action: () => { onClose(); onOpenLedger(); }
    },
    {
      id: 'key_tools',
      title: t('key_tools.title'),
      subtitle: t('key_tools.subtitle'),
      category: 'tools',
      icon: <Wrench className="w-5 h-5" />,
      badge: 'PRO TOOLS',
      badgeColor: 'bg-blue-600 text-white',
      color: 'from-blue-500 to-indigo-700',
      action: () => { onClose(); onOpenKeyTools(); }
    },
    {
      id: 'tickets',
      title: 'Support & Warranty',
      subtitle: '1:1 replacement & dispute',
      category: 'support',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: '1:1 ESCROW',
      badgeColor: 'bg-emerald-600 text-white',
      color: 'from-emerald-500 to-teal-700',
      action: () => { onClose(); onOpenTickets(); }
    },
    {
      id: 'affiliate',
      title: t('affiliate.title'),
      subtitle: t('affiliate.subtitle'),
      category: 'tools',
      icon: <Users className="w-5 h-5" />,
      badge: 'VIP COMM',
      badgeColor: 'bg-purple-600 text-white',
      color: 'from-purple-500 to-pink-600',
      action: () => { onClose(); onOpenAffiliate(); }
    },
    {
      id: 'suppliers',
      title: 'Suppliers & API',
      subtitle: 'Manage supplier channels',
      category: 'tools',
      icon: <Layers className="w-5 h-5" />,
      color: 'from-violet-500 to-purple-800',
      action: () => { onClose(); onOpenSuppliers(); }
    },
    {
      id: 'escrow',
      title: t('escrow.title'),
      subtitle: t('escrow.subtitle'),
      category: 'support',
      icon: <HelpCircle className="w-5 h-5" />,
      color: 'from-cyan-600 to-blue-800',
      action: () => { onClose(); onOpenEscrowGuide(); }
    },
    {
      id: 'currency',
      title: 'Currency / Language',
      subtitle: `${activeCurrency}`,
      category: 'finance',
      icon: <Globe className="w-5 h-5" />,
      badge: activeCurrency,
      badgeColor: 'bg-slate-800 text-cyan-300',
      color: 'from-slate-700 to-slate-900',
      action: () => { onCurrencyToggle(); }
    },
    {
      id: 'admin',
      title: '⚡ ADCP Admin Control Panel',
      subtitle: 'Tiers, catalog, stock, users',
      category: 'admin',
      icon: <Settings className="w-5 h-5" />,
      badge: 'ADMIN',
      badgeColor: 'bg-red-600 text-white animate-pulse',
      color: 'from-red-600 to-rose-900',
      action: () => { onClose(); onOpenAdmin(); }
    }
  ];

  const filteredItems = menuItems.filter(item => {
    const matchCategory = selectedTab === 'all' || item.category === selectedTab || (selectedTab === 'admin' && item.category === 'admin');
    const matchQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl">
        {/* Animated Background Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e1320] via-[#090d16] to-[#06080d] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-[#070a12] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black font-black shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '12s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black font-mono text-white tracking-wide uppercase flex items-center gap-1.5">
                    <span>FAN MENU</span>
                    <span className="text-cyan-400">// UTILITIES</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold hidden sm:inline">
                    {menuItems.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Fast access to tools, games, wallet, and settings</p>
              </div>
            </div>

            {/* View switcher & Close button */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-black/60 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setViewStyle('fan')}
                  className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                    viewStyle === 'fan' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Fan</span>
                </button>
                <button
                  onClick={() => setViewStyle('grid')}
                  className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                    viewStyle === 'grid' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Category Filter Tabs */}
          <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800/80 space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search_placeholder')}
                className="w-full bg-[#0b0f19] border border-slate-800 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none font-mono transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  selectedTab === 'all'
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {t('categories.all')} ({menuItems.length})
              </button>
              <button
                onClick={() => setSelectedTab('gaming')}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  selectedTab === 'gaming'
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                🎮 {t('categories.gaming')}
              </button>
              <button
                onClick={() => setSelectedTab('finance')}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  selectedTab === 'finance'
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                💳 {t('nav.wallet')}
              </button>
              <button
                onClick={() => setSelectedTab('tools')}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  selectedTab === 'tools'
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                🎰 Tools & Minigames
              </button>
              <button
                onClick={() => setSelectedTab('admin')}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  selectedTab === 'admin'
                    ? 'bg-red-600 text-white border-red-500 font-bold'
                    : 'bg-slate-900/80 text-red-400 border-slate-800 hover:border-red-500/40'
                }`}
              >
                ⚡ Admin
              </button>
            </div>
          </div>

          {/* Body Content with Fan-Out / Grid Presentation */}
          <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* Visual Fan Showcase (when in Fan view on desktop/tablet) */}
            {viewStyle === 'fan' && selectedTab === 'all' && !searchQuery && (
              <div className="relative py-4 px-2 hidden md:block overflow-hidden rounded-xl bg-gradient-to-b from-[#0b0f19] to-black border border-cyan-500/20">
                <div className="text-center mb-3">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                    ✨ Fan Navigation
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 h-44 relative">
                  {menuItems.slice(0, 7).map((item, idx) => {
                    const total = 7;
                    const rotate = (idx - 3) * 10;
                    const translateY = Math.abs(idx - 3) * 8;

                    return (
                      <motion.div
                        key={item.id}
                        onClick={item.action}
                        initial={{ rotate: 0, y: 50, opacity: 0 }}
                        animate={{ rotate, y: translateY, opacity: 1 }}
                        whileHover={{ scale: 1.15, rotate: 0, zIndex: 30, y: -10 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                        className="w-32 h-36 rounded-xl p-3 bg-gradient-to-b from-slate-800 to-slate-950 border border-cyan-500/40 hover:border-cyan-400 shadow-xl cursor-pointer flex flex-col justify-between select-none relative group"
                        style={{ transformOrigin: 'bottom center' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} text-black font-bold shadow-md`}>
                            {item.icon}
                          </div>
                          {item.badge && (
                            <span className="text-[8px] font-mono font-bold px-1 rounded bg-black/70 text-cyan-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold font-mono text-white line-clamp-1 group-hover:text-cyan-300">
                            {item.title}
                          </div>
                          <div className="text-[9px] text-slate-400 font-sans line-clamp-1 mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List / 2x2 or 3-column Responsive Grid for All Devices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  onClick={item.action}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer p-3 sm:p-3.5 rounded-xl bg-[#0b0f19] hover:bg-[#0f1523] border border-slate-800 hover:border-cyan-500/60 shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-black font-bold shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold font-mono text-white truncate group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase shrink-0 ${item.badgeColor || 'bg-cyan-950 text-cyan-300'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-cyan-500 group-hover:text-black text-slate-400 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-mono text-slate-300">{t('common.filter')}: "{searchQuery}" (0)</div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 rounded bg-cyan-500 text-black font-mono font-bold text-xs"
                >
                  {t('categories.all')}
                </button>
              </div>
            )}
          </div>

          {/* Footer Quick Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#07090e] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{t('wallet.balance')}: <strong className="text-emerald-400">{user?.walletBalance.toLocaleString('vi-VN')} {user?.currency}</strong></span>
              <span>• <strong className="text-cyan-300">{user?.name}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { onClose(); onOpenDepositHub(); }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase transition-all text-xs cursor-pointer"
              >
                + {t('wallet.deposit_btn')}
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all text-xs cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
