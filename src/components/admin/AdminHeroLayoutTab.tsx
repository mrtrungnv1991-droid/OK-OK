import React, { useState } from 'react';
import { 
  Layout, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Eye, 
  Maximize2, 
  Check, 
  Smartphone, 
  Monitor, 
  PlusCircle, 
  CircleDollarSign, 
  CreditCard, 
  Gift, 
  TrendingUp, 
  History, 
  Compass,
  Lock,
  Clock,
  Award,
  Layers,
  Palette,
  Globe,
  Languages,
  Bot
} from 'lucide-react';
import { SystemConfig, HeroCustomConfig, LaunchpadButtonConfig, UiLayoutConfig, HeroTranslationData } from '../../types';
import { 
  getLocalizedHeroConfig, 
  HERO_TRANSLATIONS_DICT, 
  SUPPORTED_LOCALES, 
  SupportedLocale, 
  translateHeroFromSource, 
  translateHeroSentence,
  synchronizeBannerTranslations,
  computeHeroContentHash,
  ALL_TARGET_LOCALES,
  SOURCE_LANGUAGE
} from '../../i18n';

interface AdminHeroLayoutTabProps {
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (newConfig: Partial<SystemConfig>) => void;
}

export const DEFAULT_HERO_CONFIG: HeroCustomConfig = {
  badgeText: 'SÀN GOM ĐƠN MUA CHUNG SẢN PHẨM SỐ & KEY BẢN QUYỀN',
  badgeActive: true,
  badgeColor: 'cyan',
  mainHeadingLine1: 'MUA CHUNG KEY BẢN QUYỀN',
  mainHeadingLine2: 'TIẾT KIỆM ĐẾN 80%',
  mainHeadingGradient: 'cyan_blue',
  subheading: 'Giải pháp gom đơn thông minh: Nhận giá sỉ gốc cho ChatGPT Plus, Netflix 4K, Game Steam và nhiều tựa game hot. Thanh toán tự động, nhận mã tức thì qua hợp đồng bảo lãnh Escrow 100%.',
  containerMaxWidth: 'max-w-7xl',
  contentAlignment: 'balanced_split',
  verticalPadding: 'standard',
  heroBackground: 'cyber_grid',
  showTrustPods: true,
  trustPod1: {
    title: 'Tốc Độ Nhận Key',
    value: '3 - 30 Giây',
    sub: 'Tự động trả mã 24/7',
    icon: 'zap',
    color: 'cyan',
    active: true
  },
  trustPod2: {
    title: 'Bảo Lãnh Escrow',
    value: '100% Hoàn Tiền',
    sub: 'Bảo hành 1:1 mọi lỗi',
    icon: 'shield_check',
    color: 'emerald',
    active: true
  },
  showLaunchpad: true,
  launchpadLayout: 'wrap_grid',
  launchpadButtons: [
    { id: 'btn-1', key: 'topup', label: '⚡ Nạp 121 Game (3s)', icon: 'zap', colorScheme: 'cyan', active: true },
    { id: 'btn-2', key: 'createPool', label: '🚀 Mở Gom Đơn Mới', icon: 'plus_circle', colorScheme: 'blue', active: true },
    { id: 'btn-3', key: 'depositHub', label: '🏦 Nạp Tiền VietQR', icon: 'dollar', colorScheme: 'emerald', active: true },
    { id: 'btn-4', key: 'telcoCard', label: '💳 Đổi Thẻ Cào Tự Động', icon: 'card', colorScheme: 'purple', active: true },
    { id: 'btn-5', key: 'luckyWheel', label: '🎡 Vòng Quay May Mắn', icon: 'gift', colorScheme: 'amber', active: true },
    { id: 'btn-6', key: 'affiliate', label: '🤝 Đại Lý CTV (-10%)', icon: 'trending', colorScheme: 'indigo', active: true },
    { id: 'btn-7', key: 'escrowGuide', label: '🛡️ Quy Trình Escrow', icon: 'shield', colorScheme: 'slate', active: true },
    { id: 'btn-8', key: 'txLedger', label: '📑 Sao Kê Ví', icon: 'history', colorScheme: 'slate', active: true },
    { id: 'btn-9', key: 'fanMenu', label: '📂 18 Tiện Ích', icon: 'compass', colorScheme: 'cyan', active: true }
  ]
};

export const DEFAULT_UI_LAYOUT_CONFIG: UiLayoutConfig = {
  siteContainerWidth: 'max-w-7xl',
  cardBorderRadius: 'rounded-xl',
  enableCyberGrid: true,
  enableGlowEffects: true
};

export const AdminHeroLayoutTab: React.FC<AdminHeroLayoutTabProps> = ({
  systemConfig,
  onUpdateSystemConfig
}) => {
  const [heroConfig, setHeroConfig] = useState<HeroCustomConfig>(
    systemConfig.heroConfig || DEFAULT_HERO_CONFIG
  );
  const [uiLayout, setUiLayout] = useState<UiLayoutConfig>(
    systemConfig.uiLayoutConfig || DEFAULT_UI_LAYOUT_CONFIG
  );
  const [activeSection, setActiveSection] = useState<'ratio_container' | 'text_content' | 'metric_pods' | 'launchpad_bar'>('ratio_container');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewLang, setPreviewLang] = useState<SupportedLocale>('vi');
  const [editingLang, setEditingLang] = useState<SupportedLocale>('vi');
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);

  // Compute preview config dynamically based on selected preview language
  const previewConfig = getLocalizedHeroConfig(heroConfig, previewLang);

  const handleSave = () => {
    const sourceData: HeroTranslationData = {
      badgeText: heroConfig.badgeText,
      mainHeadingLine1: heroConfig.mainHeadingLine1,
      mainHeadingLine2: heroConfig.mainHeadingLine2,
      subheading: heroConfig.subheading,
      pod1Title: heroConfig.trustPod1?.title,
      pod1Val: heroConfig.trustPod1?.value,
      pod1Sub: heroConfig.trustPod1?.sub,
      pod2Title: heroConfig.trustPod2?.title,
      pod2Val: heroConfig.trustPod2?.value,
      pod2Sub: heroConfig.trustPod2?.sub,
    };

    // Strict Pipeline: VI -> EN Master -> Other Enabled Languages
    const currentHash = computeHeroContentHash(sourceData);
    const isTextChanged = heroConfig.contentHash !== currentHash;
    const newVersion = (heroConfig.version || 0) + (isTextChanged ? 1 : 0);

    const syncResult = synchronizeBannerTranslations(
      sourceData,
      heroConfig.translations || {},
      {
        enabledLanguages: ALL_TARGET_LOCALES,
        version: newVersion,
        forceAll: false // Preserves manual overrides if any
      }
    );

    const updatedHeroConfig: HeroCustomConfig = {
      ...heroConfig,
      sourceLanguage: 'vi',
      version: syncResult.version,
      contentHash: syncResult.contentHash,
      translations: syncResult.translations
    };

    setHeroConfig(updatedHeroConfig);
    onUpdateSystemConfig({
      heroConfig: updatedHeroConfig,
      uiLayoutConfig: uiLayout
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAutoTranslateAll = () => {
    setIsAutoTranslating(true);
    setTimeout(() => {
      const sourceData: HeroTranslationData = {
        badgeText: heroConfig.badgeText,
        mainHeadingLine1: heroConfig.mainHeadingLine1,
        mainHeadingLine2: heroConfig.mainHeadingLine2,
        subheading: heroConfig.subheading,
        pod1Title: heroConfig.trustPod1?.title,
        pod1Val: heroConfig.trustPod1?.value,
        pod1Sub: heroConfig.trustPod1?.sub,
        pod2Title: heroConfig.trustPod2?.title,
        pod2Val: heroConfig.trustPod2?.value,
        pod2Sub: heroConfig.trustPod2?.sub,
      };

      // Force translate everything via VI -> EN Master -> All Languages
      const newVersion = (heroConfig.version || 0) + 1;
      const syncResult = synchronizeBannerTranslations(
        sourceData,
        {},
        {
          enabledLanguages: ALL_TARGET_LOCALES,
          forceAll: true,
          version: newVersion
        }
      );

      setHeroConfig(prev => ({
        ...prev,
        sourceLanguage: 'vi',
        version: syncResult.version,
        contentHash: syncResult.contentHash,
        translations: syncResult.translations
      }));
      setIsAutoTranslating(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  const updateLocalizedHeroField = (field: keyof HeroTranslationData, value: string) => {
    if (editingLang === 'vi') {
      setHeroConfig(prev => {
        const nextTranslations: Record<string, HeroTranslationData> = { ...(prev.translations || {}) };
        
        // Step 1: Translate VI field to EN Master
        const enVal = translateHeroSentence(value, 'en');
        nextTranslations.en = {
          ...(nextTranslations.en || {}),
          [field]: enVal,
          status: 'auto'
        };

        // Step 2: Translate from EN Master to all other target languages
        ALL_TARGET_LOCALES.forEach(lang => {
          if (lang === 'vi' || lang === 'en') return;
          const isManual = (nextTranslations[lang] as any)?.status === 'manual';
          if (!isManual) {
            const targetVal = translateHeroSentence(value, lang);
            nextTranslations[lang] = {
              ...(nextTranslations[lang] || {}),
              [field]: targetVal,
              status: 'auto'
            };
          }
        });

        if (field === 'badgeText' || field === 'mainHeadingLine1' || field === 'mainHeadingLine2' || field === 'subheading') {
          return {
            ...prev,
            [field]: value,
            translations: nextTranslations
          };
        } else if (field === 'pod1Title' || field === 'pod1Val' || field === 'pod1Sub') {
          const podKey = field === 'pod1Title' ? 'title' : field === 'pod1Val' ? 'value' : 'sub';
          return {
            ...prev,
            trustPod1: { ...prev.trustPod1, [podKey]: value },
            translations: nextTranslations
          };
        } else if (field === 'pod2Title' || field === 'pod2Val' || field === 'pod2Sub') {
          const podKey = field === 'pod2Title' ? 'title' : field === 'pod2Val' ? 'value' : 'sub';
          return {
            ...prev,
            trustPod2: { ...prev.trustPod2, [podKey]: value },
            translations: nextTranslations
          };
        }
        return {
          ...prev,
          translations: nextTranslations
        };
      });
    } else {
      setHeroConfig(prev => {
        const trans = { ...(prev.translations || {}) };
        const currentLangTrans = { ...(trans[editingLang] || {}) };
        currentLangTrans[field] = value;
        (currentLangTrans as any).status = 'manual'; // Marked manual override
        (currentLangTrans as any).updatedAt = new Date().toISOString();
        trans[editingLang] = currentLangTrans;
        return {
          ...prev,
          translations: trans
        };
      });
    }
  };

  const getFieldValue = (field: keyof HeroTranslationData): string => {
    if (editingLang === 'vi') {
      if (field === 'badgeText') return heroConfig.badgeText;
      if (field === 'mainHeadingLine1') return heroConfig.mainHeadingLine1;
      if (field === 'mainHeadingLine2') return heroConfig.mainHeadingLine2;
      if (field === 'subheading') return heroConfig.subheading;
      if (field === 'pod1Title') return heroConfig.trustPod1?.title || '';
      if (field === 'pod1Val') return heroConfig.trustPod1?.value || '';
      if (field === 'pod1Sub') return heroConfig.trustPod1?.sub || '';
      if (field === 'pod2Title') return heroConfig.trustPod2?.title || '';
      if (field === 'pod2Val') return heroConfig.trustPod2?.value || '';
      if (field === 'pod2Sub') return heroConfig.trustPod2?.sub || '';
      return '';
    }

    const custom = heroConfig.translations?.[editingLang]?.[field];
    if (custom !== undefined) return custom;

    // Dynamically translate from active Vietnamese text in real-time
    const sourceData: HeroTranslationData = {
      badgeText: heroConfig.badgeText,
      mainHeadingLine1: heroConfig.mainHeadingLine1,
      mainHeadingLine2: heroConfig.mainHeadingLine2,
      subheading: heroConfig.subheading,
      pod1Title: heroConfig.trustPod1?.title,
      pod1Val: heroConfig.trustPod1?.value,
      pod1Sub: heroConfig.trustPod1?.sub,
      pod2Title: heroConfig.trustPod2?.title,
      pod2Val: heroConfig.trustPod2?.value,
      pod2Sub: heroConfig.trustPod2?.sub,
    };
    const dynamicTrans = translateHeroFromSource(sourceData, editingLang);
    return dynamicTrans[field] || '';
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục tỷ lệ khung web & cấu hình Hero về mặc định chuẩn?')) {
      setHeroConfig(DEFAULT_HERO_CONFIG);
      setUiLayout(DEFAULT_UI_LAYOUT_CONFIG);
      onUpdateSystemConfig({
        heroConfig: DEFAULT_HERO_CONFIG,
        uiLayoutConfig: DEFAULT_UI_LAYOUT_CONFIG
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const updateHeroField = <K extends keyof HeroCustomConfig>(field: K, value: HeroCustomConfig[K]) => {
    setHeroConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateTrustPod1 = (field: string, value: any) => {
    setHeroConfig(prev => ({
      ...prev,
      trustPod1: { ...prev.trustPod1, [field]: value }
    }));
  };

  const updateTrustPod2 = (field: string, value: any) => {
    setHeroConfig(prev => ({
      ...prev,
      trustPod2: { ...prev.trustPod2, [field]: value }
    }));
  };

  const updateLaunchpadButton = (id: string, updates: Partial<LaunchpadButtonConfig>) => {
    setHeroConfig(prev => ({
      ...prev,
      launchpadButtons: prev.launchpadButtons.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  // Helper for gradient styling in preview
  const getGradientClass = (gradient: HeroCustomConfig['mainHeadingGradient']) => {
    switch (gradient) {
      case 'cyan_blue':
        return 'from-cyan-400 via-teal-300 to-blue-500';
      case 'gold_amber':
        return 'from-amber-300 via-yellow-400 to-orange-500';
      case 'purple_rose':
        return 'from-purple-400 via-pink-400 to-rose-500';
      case 'emerald_teal':
        return 'from-emerald-300 via-teal-400 to-green-500';
      case 'fire_red':
        return 'from-red-400 via-orange-400 to-amber-500';
      default:
        return 'from-cyan-400 via-teal-300 to-blue-500';
    }
  };

  const getBadgeColorClass = (color: HeroCustomConfig['badgeColor']) => {
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

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-mono">
              QUẢN TRỊ TỶ LỆ KHUNG WEB & HERO BANNER (PROPORTIONS & HERO CMS)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tùy chỉnh tỷ lệ chiều rộng website (Container Max-Width), font chữ, tiêu đề, 2 hộp thông số bảo lãnh và thanh phím tắt Launchpad đồng đều, không bị lệch hoặc cắt cụt chữ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer"
            title="Khôi phục về tỷ lệ chuẩn ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc Định</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-black" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'ĐÃ LƯU THÀNH CÔNG!' : 'LƯU CẤU HÌNH GIAO DIỆN'}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase text-white">Xem Trước Trực Tiếp (Live Realtime Preview)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
              Khung: {previewConfig.containerMaxWidth}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector for Live Preview */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono text-slate-400">Ngôn ngữ:</span>
              <select
                value={previewLang}
                onChange={e => setPreviewLang(e.target.value as SupportedLocale)}
                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-cyan-300 focus:outline-none"
              >
                {SUPPORTED_LOCALES.map(loc => (
                  <option key={loc.code} value={loc.code}>
                    {loc.flag} {loc.name} ({loc.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 transition-all ${
                  previewDevice === 'desktop' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 transition-all ${
                  previewDevice === 'mobile' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Container */}
        <div className={`overflow-x-auto bg-[#07090e] rounded-xl border border-slate-800/80 p-4 transition-all ${
          previewDevice === 'mobile' ? 'max-w-md mx-auto shadow-2xl' : 'w-full'
        } ${previewConfig.heroBackground === 'cyber_grid' ? 'cyber-grid' : ''}`}>
          <div className={`${previewConfig.containerMaxWidth} mx-auto transition-all`}>
            {/* Header Content */}
            <div className={`flex ${
              previewConfig.contentAlignment === 'center' 
                ? 'flex-col items-center text-center' 
                : previewConfig.contentAlignment === 'left' 
                  ? 'flex-col items-start text-left' 
                  : 'flex-col lg:flex-row lg:items-end justify-between'
            } gap-4 mb-4`}>
              <div className="max-w-2xl">
                {previewConfig.badgeActive && (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] sm:text-xs font-mono mb-2 shadow-sm ${getBadgeColorClass(previewConfig.badgeColor)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    {previewConfig.badgeText}
                  </div>
                )}
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase font-mono leading-tight">
                  {previewConfig.mainHeadingLine1} <br />
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${getGradientClass(previewConfig.mainHeadingGradient)}`}>
                    {previewConfig.mainHeadingLine2}
                  </span>
                </h1>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">
                  {previewConfig.subheading}
                </p>
              </div>

              {/* Metric Pods Preview */}
              {previewConfig.showTrustPods && (
                <div className="grid grid-cols-2 gap-2 font-mono text-xs shrink-0 w-full sm:w-auto">
                  {previewConfig.trustPod1?.active && (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400 text-[9px] uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-400" /> {previewConfig.trustPod1.title}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-cyan-400 mt-0.5">{previewConfig.trustPod1.value}</div>
                      <div className="text-[9px] text-emerald-400 mt-0.5">{previewConfig.trustPod1.sub}</div>
                    </div>
                  )}

                  {previewConfig.trustPod2?.active && (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400 text-[9px] uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> {previewConfig.trustPod2.title}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">{previewConfig.trustPod2.value}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{previewConfig.trustPod2.sub}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Launchpad Preview */}
            {previewConfig.showLaunchpad && (
              <div className={`pt-2 border-t border-slate-800/60 ${
                previewConfig.launchpadLayout === 'wrap_grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2'
                  : 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'
              }`}>
                {previewConfig.launchpadButtons.filter(b => b.active).map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-cyan-300 text-[11px] font-mono whitespace-nowrap text-center"
                  >
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveSection('ratio_container')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === 'ratio_container'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>1. Tỷ Lệ Khung Web & Kích Thước</span>
        </button>

        <button
          onClick={() => setActiveSection('text_content')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === 'text_content'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>2. Tiêu Đề, Badge & Đoạn Văn</span>
        </button>

        <button
          onClick={() => setActiveSection('metric_pods')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === 'metric_pods'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>3. Hộp Thông Số Kỹ Thuật (Pods)</span>
        </button>

        <button
          onClick={() => setActiveSection('launchpad_bar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === 'launchpad_bar'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>4. Thanh Phím Tắt Launchpad</span>
        </button>
      </div>

      {/* Section 1: Container & Web Ratio Proportions */}
      {activeSection === 'ratio_container' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              <span>Chiều Rộng Khung Khớp Toàn Web (Container Max Width)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Chọn kích thước giới hạn chiều rộng để đồng bộ tuyệt đối giữa Hero Banner và lưới sản phẩm, giỏ hàng, bảng thanh toán.
            </p>

            <div className="space-y-2">
              {[
                { id: 'max-w-7xl', label: 'Chuẩn 1280px (max-w-7xl)', desc: 'Tỷ lệ cân đối chuẩn hầu hết màn hình laptop và desktop thông dụng' },
                { id: 'max-w-[1440px]', label: 'Rộng Thoáng 1440px (max-w-[1440px])', desc: 'Tràn rộng đều màn hình lớn, giảm khoảng đen 2 bên' },
                { id: 'max-w-[1600px]', label: 'Ultra-Wide 1600px (max-w-[1600px])', desc: 'Tối đa không gian hiển thị cho màn hình 2K/4K/21:9' },
                { id: 'max-w-6xl', label: 'Gọn Gàng 1152px (max-w-6xl)', desc: 'Tập trung trung tâm, thích hợp các giao diện tối giản' },
                { id: 'max-w-full', label: 'Tràn Viền Tự Do (max-w-full 100%)', desc: 'Khung tự động giãn 100% theo bề ngang trình duyệt' }
              ].map(opt => (
                <label
                  key={opt.id}
                  onClick={() => {
                    updateHeroField('containerMaxWidth', opt.id as any);
                    setUiLayout(prev => ({ ...prev, siteContainerWidth: opt.id as any }));
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    heroConfig.containerMaxWidth === opt.id
                      ? 'bg-cyan-950/50 border-cyan-500/60 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="containerMaxWidth"
                    checked={heroConfig.containerMaxWidth === opt.id}
                    onChange={() => {}}
                    className="mt-1 accent-cyan-400"
                  />
                  <div>
                    <div className="text-xs font-mono font-bold text-white">{opt.label}</div>
                    <div className="text-[11px] text-slate-400">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span>Bố Cục Căn Chỉnh & Hiệu Ứng Nền</span>
            </h4>

            {/* Content Alignment */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">Kiểu căn chỉnh tiêu đề:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'balanced_split', label: 'Cân bằng 2 cột' },
                  { id: 'left', label: 'Căn lề trái' },
                  { id: 'center', label: 'Căn giữa tâm' }
                ].map(align => (
                  <button
                    key={align.id}
                    type="button"
                    onClick={() => updateHeroField('contentAlignment', align.id as any)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      heroConfig.contentAlignment === align.id
                        ? 'bg-cyan-500 text-black font-bold border-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {align.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Padding */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">Khoảng cách đệm chiều dọc (Vertical Padding):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', label: 'Gọn (py-3 sm:py-5)' },
                  { id: 'standard', label: 'Chuẩn (py-5 sm:py-8)' },
                  { id: 'generous', label: 'Rộng (py-8 sm:py-12)' }
                ].map(pad => (
                  <button
                    key={pad.id}
                    type="button"
                    onClick={() => updateHeroField('verticalPadding', pad.id as any)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      heroConfig.verticalPadding === pad.id
                        ? 'bg-cyan-500 text-black font-bold border-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pad.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">Hiệu ứng họa tiết nền Hero:</label>
              <select
                value={heroConfig.heroBackground}
                onChange={e => updateHeroField('heroBackground', e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              >
                <option value="cyber_grid">Lưới Cyberpunk Grid công nghệ cao (Mặc định)</option>
                <option value="neon_glow">Ánh sáng Neon Glow hai cực</option>
                <option value="aurora">Cực quang Aurora gradient huyền ảo</option>
                <option value="minimal_dark">Đen sâu tối giản Deep Dark Minimal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Text Content & Headings */}
      {activeSection === 'text_content' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Tùy Biến Nội Dung Văn Bản & Gradient Màu Sắc</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hệ thống tự động chuyển đổi hiển thị theo ngôn ngữ của khách hàng ({SUPPORTED_LOCALES.length} ngôn ngữ).
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoTranslateAll}
              disabled={isAutoTranslating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{isAutoTranslating ? 'Đang dịch AI...' : '⚡ AI Dịch 9 Ngôn Ngữ Tự Động'}</span>
            </button>
          </div>

          {/* Language Selection Tabs for Editing */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-800/60 scrollbar-none">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400" /> Sửa ngôn ngữ:
            </span>
            {SUPPORTED_LOCALES.map(loc => {
              const isSelected = editingLang === loc.code;
              const hasCustom = loc.code === 'vi' || Boolean(heroConfig.translations?.[loc.code]);
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => setEditingLang(loc.code)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500 text-black font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{loc.flag}</span>
                  <span>{loc.code.toUpperCase()}</span>
                  {hasCustom && loc.code !== 'vi' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          {editingLang === 'vi' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300 gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>
                  <strong>Cơ Chế Auto Dịch Pivot Đang Bật:</strong> Gõ Tiếng Việt ➔ Tự động dịch sang Tiếng Anh chuẩn (Master Bridge) ➔ Dịch ra 7 ngôn ngữ (ZH, JA, KO, RU, FR, DE, ES) với độ chính xác cao nhất.
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-600/40 text-emerald-200 font-bold shrink-0 self-start sm:self-auto">
                TỰ ĐỘNG VĨNH VIỄN
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-xs font-mono text-cyan-300">
              <span>Đang chỉnh sửa bản dịch cho: <strong>{SUPPORTED_LOCALES.find(l => l.code === editingLang)?.name} ({editingLang.toUpperCase()})</strong></span>
              <button
                type="button"
                onClick={() => {
                  const defaultForLang = HERO_TRANSLATIONS_DICT[editingLang] || HERO_TRANSLATIONS_DICT['en'];
                  updateLocalizedHeroField('badgeText', defaultForLang.badgeText || '');
                  updateLocalizedHeroField('mainHeadingLine1', defaultForLang.mainHeadingLine1 || '');
                  updateLocalizedHeroField('mainHeadingLine2', defaultForLang.mainHeadingLine2 || '');
                  updateLocalizedHeroField('subheading', defaultForLang.subheading || '');
                }}
                className="text-[11px] text-cyan-400 underline hover:text-cyan-200 cursor-pointer"
              >
                Khôi phục bản dịch chuẩn của {editingLang.toUpperCase()}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Badge Settings */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  Thẻ Badge Thông Báo Nổi Bật ({editingLang.toUpperCase()})
                </label>
                <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroConfig.badgeActive}
                    onChange={e => updateHeroField('badgeActive', e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span>Bật Badge</span>
                </label>
              </div>

              <input
                type="text"
                value={getFieldValue('badgeText')}
                onChange={e => updateLocalizedHeroField('badgeText', e.target.value)}
                placeholder="Nội dung dòng chữ badge..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Màu Badge:</span>
                {(['cyan', 'emerald', 'purple', 'amber', 'red'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateHeroField('badgeColor', c)}
                    className={`px-2 py-1 rounded text-[10px] font-mono uppercase border cursor-pointer ${
                      heroConfig.badgeColor === c
                        ? 'border-white font-bold bg-slate-800 text-white'
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Selector */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
              <label className="text-xs font-mono text-slate-300 font-bold block">
                Màu Gradient Dòng Nhấn Mạnh
              </label>
              <select
                value={heroConfig.mainHeadingGradient}
                onChange={e => updateHeroField('mainHeadingGradient', e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              >
                <option value="cyan_blue">Cyan Teal & Blue (Xanh công nghệ Cyber - Chuẩn)</option>
                <option value="gold_amber">Gold & Amber (Vàng Hoàng Gia sang trọng)</option>
                <option value="purple_rose">Purple & Rose (Tím Hồng thời thượng)</option>
                <option value="emerald_teal">Emerald & Teal (Xanh Lục Bảo tài lộc)</option>
                <option value="fire_red">Fire & Amber (Đỏ Cam rực lửa Flash Sale)</option>
              </select>
            </div>
          </div>

          {/* Heading Lines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">
                Tiêu đề chính (Dòng 1 - {editingLang.toUpperCase()}):
              </label>
              <input
                type="text"
                value={getFieldValue('mainHeadingLine1')}
                onChange={e => updateLocalizedHeroField('mainHeadingLine1', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">
                Tiêu đề phụ nổi bật (Dòng 2 Gradient - {editingLang.toUpperCase()}):
              </label>
              <input
                type="text"
                value={getFieldValue('mainHeadingLine2')}
                onChange={e => updateLocalizedHeroField('mainHeadingLine2', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-cyan-300 focus:border-cyan-400 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Subheading */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">
              Đoạn văn mô tả giới thiệu giải pháp ({editingLang.toUpperCase()}):
            </label>
            <textarea
              rows={3}
              value={getFieldValue('subheading')}
              onChange={e => updateLocalizedHeroField('subheading', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-sans text-slate-300 focus:border-cyan-400 focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Section 3: Metric Trust Pods */}
      {activeSection === 'metric_pods' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Cấu Hình 2 Hộp Thông Số Bảo Lãnh & Tốc Độ (Telemetry Pods)</span>
            </h4>
            <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={heroConfig.showTrustPods}
                onChange={e => updateHeroField('showTrustPods', e.target.checked)}
                className="accent-cyan-400"
              />
              <span>Hiển thị cụm Pods</span>
            </label>
          </div>

          {/* Language Tabs for Pods */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/60 scrollbar-none">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400" /> Ngôn ngữ:
            </span>
            {SUPPORTED_LOCALES.map(loc => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setEditingLang(loc.code)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 ${
                  editingLang === loc.code
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{loc.flag}</span>
                <span>{loc.code.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pod 1 */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  HỘP THÔNG SỐ 1 (TỐC ĐỘ GIAO - {editingLang.toUpperCase()})
                </span>
                <label className="flex items-center gap-1 text-[11px] font-mono">
                  <input
                    type="checkbox"
                    checked={heroConfig.trustPod1?.active}
                    onChange={e => updateTrustPod1('active', e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span>Bật</span>
                </label>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Tiêu đề nhãn:</label>
                  <input
                    type="text"
                    value={getFieldValue('pod1Title')}
                    onChange={e => updateLocalizedHeroField('pod1Title', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Chỉ số số liệu lớn:</label>
                  <input
                    type="text"
                    value={getFieldValue('pod1Val')}
                    onChange={e => updateLocalizedHeroField('pod1Val', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Dòng phụ chú thích:</label>
                  <input
                    type="text"
                    value={getFieldValue('pod1Sub')}
                    onChange={e => updateLocalizedHeroField('pod1Sub', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Pod 2 */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  HỘP THÔNG SỐ 2 (BẢO LÃNH ESCROW - {editingLang.toUpperCase()})
                </span>
                <label className="flex items-center gap-1 text-[11px] font-mono">
                  <input
                    type="checkbox"
                    checked={heroConfig.trustPod2?.active}
                    onChange={e => updateTrustPod2('active', e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span>Bật</span>
                </label>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Tiêu đề nhãn:</label>
                  <input
                    type="text"
                    value={getFieldValue('pod2Title')}
                    onChange={e => updateLocalizedHeroField('pod2Title', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Chỉ số số liệu lớn:</label>
                  <input
                    type="text"
                    value={getFieldValue('pod2Val')}
                    onChange={e => updateLocalizedHeroField('pod2Val', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Dòng phụ chú thích:</label>
                  <input
                    type="text"
                    value={getFieldValue('pod2Sub')}
                    onChange={e => updateLocalizedHeroField('pod2Sub', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Launchpad Shortcuts */}
      {activeSection === 'launchpad_bar' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Quản Lý Phím Tắt Khởi Chạy Nhanh (Launchpad Shortcuts)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bật/tắt, sửa nhãn hiển thị và chọn chế độ dàn trang (Grid co giãn chống cắt chữ vs Cuộn ngang).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={heroConfig.showLaunchpad}
                  onChange={e => updateHeroField('showLaunchpad', e.target.checked)}
                  className="accent-cyan-400"
                />
                <span>Bật Launchpad</span>
              </label>

              <select
                value={heroConfig.launchpadLayout}
                onChange={e => updateHeroField('launchpadLayout', e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="wrap_grid">Dàn Đều Lưới (Responsive Grid - Không bị cắt chữ)</option>
                <option value="scrollable_row">Dạng Cuộn Ngang (Scrollable Row)</option>
              </select>
            </div>
          </div>

          {/* Button Editor Table */}
          <div className="space-y-2">
            {heroConfig.launchpadButtons.map((btn, idx) => (
              <div
                key={btn.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-mono text-slate-500 font-bold">{idx + 1}</span>
                  <input
                    type="checkbox"
                    checked={btn.active}
                    onChange={e => updateLaunchpadButton(btn.id, { active: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <input
                    type="text"
                    value={btn.label}
                    onChange={e => updateLaunchpadButton(btn.id, { label: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none w-56 sm:w-64"
                  />
                </div>

                <div className="flex items-center gap-2 pl-7 sm:pl-0">
                  <span className="text-[11px] font-mono text-slate-400">Khóa chức năng:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 text-[10px] font-mono">
                    {btn.key}
                  </span>

                  <select
                    value={btn.colorScheme}
                    onChange={e => updateLaunchpadButton(btn.id, { colorScheme: e.target.value as any })}
                    className="bg-slate-950 border border-slate-700 text-[11px] font-mono text-slate-300 rounded px-2 py-1"
                  >
                    <option value="cyan">Xanh Cyan</option>
                    <option value="blue">Xanh Biển Blue</option>
                    <option value="emerald">Xanh Lá Emerald</option>
                    <option value="purple">Tím Purple</option>
                    <option value="amber">Vàng Amber</option>
                    <option value="indigo">Chàm Indigo</option>
                    <option value="slate">Xám Slate</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
