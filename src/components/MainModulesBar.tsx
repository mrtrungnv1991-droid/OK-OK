import React from 'react';
import { 
  Users, 
  Gamepad2, 
  Key, 
  Zap, 
  Bot, 
  Sparkles, 
  Flame, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ProductCategory } from '../types';
import { useTranslation } from '../i18n';

interface MainModulesBarProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  onOpenTopupModal?: () => void;
  counts: {
    all: number;
    accounts: number;
    key_games: number;
    key_apps: number;
    topup_games: number;
    ai_tools: number;
  };
}

export const MainModulesBar: React.FC<MainModulesBarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenTopupModal,
  counts
}) => {
  const { t } = useTranslation();

  const modules = [
    {
      id: 'all' as ProductCategory,
      title: t('modules.all_products'),
      sub: t('modules.all_desc'),
      icon: Layers,
      count: counts.all,
      color: 'from-cyan-500 to-blue-600',
      badge: t('modules.tag_hot'),
      badgeBg: 'bg-cyan-500 text-black'
    },
    {
      id: 'accounts' as ProductCategory,
      title: t('modules.accounts'),
      sub: t('modules.accounts_desc'),
      icon: Users,
      count: counts.accounts,
      color: 'from-indigo-500 to-purple-600',
      badge: t('modules.tag_official'),
      badgeBg: 'bg-purple-500 text-white'
    },
    {
      id: 'key_games' as ProductCategory,
      title: t('modules.key_games'),
      sub: t('modules.key_games_desc'),
      icon: Gamepad2,
      count: counts.key_games,
      color: 'from-emerald-500 to-teal-600',
      badge: t('modules.tag_cdkey'),
      badgeBg: 'bg-emerald-500 text-black'
    },
    {
      id: 'key_apps' as ProductCategory,
      title: t('modules.key_apps'),
      sub: t('modules.key_apps_desc'),
      icon: Key,
      count: counts.key_apps,
      color: 'from-amber-500 to-orange-600',
      badge: t('modules.tag_lifetime'),
      badgeBg: 'bg-amber-500 text-black'
    },
    {
      id: 'topup_games' as ProductCategory,
      title: t('modules.topup_games'),
      sub: t('modules.topup_games_desc'),
      icon: Zap,
      count: counts.topup_games,
      color: 'from-rose-500 to-pink-600',
      badge: t('modules.tag_auto'),
      badgeBg: 'bg-rose-500 text-white',
      isTopupAction: true
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
              <span>{t('modules.title')}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {t('modules.tag')}
              </span>
            </h3>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('hero.escrow_guarantee')}</span>
        </div>
      </div>

      {/* Grid of Main Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {modules.map(mod => {
          const isSelected = selectedCategory === mod.id;
          const Icon = mod.icon;

          return (
            <button
              key={mod.id}
              onClick={() => {
                onSelectCategory(mod.id);
                if (mod.isTopupAction && onOpenTopupModal) {
                  // also can scroll or open topup
                }
              }}
              className={`group relative p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0d1627] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                  : 'bg-[#0a0f1d]/90 hover:bg-[#0e172a] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Active glow gradient bar at top */}
              {isSelected && (
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color}`} />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${mod.color} text-black font-black shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4 text-white drop-shadow" />
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider ${mod.badgeBg}`}>
                    {mod.badge}
                  </span>
                </div>

                <h4 className={`text-xs sm:text-sm font-bold font-mono transition-colors ${
                  isSelected ? 'text-cyan-300' : 'text-white group-hover:text-cyan-400'
                }`}>
                  {mod.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                  {mod.sub}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className={isSelected ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                  {t('modules.count_items', { count: mod.count })}
                </span>
                <ArrowRight className={`w-3 h-3 transition-transform ${
                  isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'
                }`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

