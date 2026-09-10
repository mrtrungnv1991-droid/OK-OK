import React, { useState, useEffect } from 'react';
import { 
  Type, 
  X, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Flame, 
  Zap, 
  ShoppingBag, 
  Check, 
  Palette, 
  Sliders,
  Maximize2
} from 'lucide-react';
import { SectionsHeaderConfig, SectionHeaderItemConfig } from '../types';

export type SectionKey = 'flashSale' | 'activePools' | 'topup' | 'marketplace';

interface SectionHeaderEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SectionKey;
  sectionsConfig?: SectionsHeaderConfig;
  onSave: (newConfig: SectionsHeaderConfig) => void;
}

export const FONT_OPTIONS = [
  { id: 'font-jakarta', label: 'Plus Jakarta Sans', familyName: 'Plus Jakarta Sans', desc: 'Hiện đại, sắc nét, chuẩn UI toàn cầu' },
  { id: 'font-bevietnam', label: 'Be Vietnam Pro', familyName: 'Be Vietnam Pro', desc: 'Thiết kế tối ưu dấu tiếng Việt hoàn hảo' },
  { id: 'font-jetbrains', label: 'JetBrains Mono', familyName: 'JetBrains Mono', desc: 'Phong cách lập trình, công nghệ cao' },
  { id: 'font-orbitron', label: 'Orbitron', familyName: 'Orbitron', desc: 'Cyberpunk, viễn tưởng Sci-Fi góc cạnh' },
  { id: 'font-chakra', label: 'Chakra Petch', familyName: 'Chakra Petch', desc: 'Gaming, Esports, sắc lạnh mạnh mẽ' },
  { id: 'font-montserrat', label: 'Montserrat', familyName: 'Montserrat', desc: 'Hình khối đậm đà, thể thao trẻ trung' },
  { id: 'font-playfair', label: 'Playfair Display', familyName: 'Playfair Display', desc: 'Cổ điển sang trọng, tạp chí đẳng cấp' },
  { id: 'font-inter', label: 'Inter', familyName: 'Inter', desc: 'Tiêu chuẩn quốc tế công nghệ cao' }
];

export const FONT_SIZES = [
  { id: 'text-sm sm:text-base', label: 'Nhỏ (14-16px)' },
  { id: 'text-base sm:text-lg', label: 'Vừa (16-18px)' },
  { id: 'text-lg sm:text-xl', label: 'Lớn (18-20px)' },
  { id: 'text-xl sm:text-2xl', label: 'Rất lớn (20-24px)' },
  { id: 'text-2xl sm:text-3xl', label: 'Cực đại (24-30px)' },
  { id: 'text-3xl sm:text-4xl', label: 'Siêu to (30-36px)' }
];

export const FONT_WEIGHTS = [
  { id: 'font-medium', label: 'Vừa (Medium 500)' },
  { id: 'font-semibold', label: 'Đậm vừa (Semibold 600)' },
  { id: 'font-bold', label: 'Đậm (Bold 700)' },
  { id: 'font-extrabold', label: 'Rất đậm (ExtraBold 800)' },
  { id: 'font-black', label: 'Siêu đậm (Black 900)' }
];

export const LETTER_SPACINGS = [
  { id: 'tracking-tight', label: 'Gọn hẹp (Tight)' },
  { id: 'tracking-normal', label: 'Tiêu chuẩn (Normal)' },
  { id: 'tracking-wide', label: 'Hơi rộng (Wide)' },
  { id: 'tracking-wider', label: 'Rộng (Wider)' },
  { id: 'tracking-widest', label: 'Rất rộng (Widest)' }
];

export const TEXT_TRANSFORMS = [
  { id: 'uppercase', label: 'IN HOA TOÀN BỘ' },
  { id: 'capitalize', label: 'Viết Hoa Chữ Đầu' },
  { id: 'normal-case', label: 'Chữ Thường' }
];

export const TITLE_COLOR_PRESETS = [
  { id: 'text-white', label: 'Trắng Sáng', hex: '#ffffff', class: 'text-white' },
  { id: 'text-cyan-400', label: 'Cyan Neon', hex: '#22d3ee', class: 'text-cyan-400' },
  { id: 'text-orange-400', label: 'Cam Lửa', hex: '#fb923c', class: 'text-orange-400' },
  { id: 'text-amber-400', label: 'Vàng Gold', hex: '#fbbf24', class: 'text-amber-400' },
  { id: 'text-emerald-400', label: 'Xanh Ngọc', hex: '#34d399', class: 'text-emerald-400' },
  { id: 'text-purple-400', label: 'Tím Hologram', hex: '#c084fc', class: 'text-purple-400' },
  { id: 'text-rose-400', label: 'Hồng Rose', hex: '#fb7185', class: 'text-rose-400' }
];

export const DEFAULT_SECTION_DATA: Record<SectionKey, SectionHeaderItemConfig> = {
  flashSale: {
    title: 'SĂN DEAL FLASH SALE TỨC THÌ',
    subtitle: 'Số lượng slot có hạn - Hết giờ tự động hoàn tất!',
    badge: '-81% FLASH',
    fontFamily: 'font-jetbrains',
    fontSize: 'text-base sm:text-lg',
    fontWeight: 'font-black',
    letterSpacing: 'tracking-wide',
    textTransform: 'uppercase',
    titleColor: 'text-white',
    subtitleColor: 'text-slate-400',
    badgeColor: 'bg-red-600 text-white'
  },
  activePools: {
    title: 'NHÓM GOM ĐƠN ĐANG CHẠY',
    subtitle: 'Bảo chứng ký quỹ 100% - Đủ người giao key tức thì',
    badge: 'POOLS SÔI ĐỘNG',
    fontFamily: 'font-jetbrains',
    fontSize: 'text-lg sm:text-xl',
    fontWeight: 'font-bold',
    letterSpacing: 'tracking-wide',
    textTransform: 'uppercase',
    titleColor: 'text-white',
    subtitleColor: 'text-slate-400',
    badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
  },
  topup: {
    title: 'NẠP GAME TỰ ĐỘNG SIÊU TỐC',
    subtitle: 'Nạp qua UID / Riot ID / ZingID - Kích hoạt 3-30s với tỷ giá ưu đãi nhất',
    badge: '121 GAMES • 1.702 TIERS',
    fontFamily: 'font-jetbrains',
    fontSize: 'text-base sm:text-lg',
    fontWeight: 'font-bold',
    letterSpacing: 'tracking-wide',
    textTransform: 'uppercase',
    titleColor: 'text-white',
    subtitleColor: 'text-slate-400',
    badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
  },
  marketplace: {
    title: 'KHO SẢN PHẨM SỐ CHÍNH HÃNG',
    subtitle: 'Mua lẻ nhận tài khoản/key bản quyền tức thì hoặc mở nhóm gom đơn nhận giá sỉ cực sốc',
    badge: 'LIVE POOL & RETAIL MARKETPLACE',
    fontFamily: 'font-jakarta',
    fontSize: 'text-2xl sm:text-3xl',
    fontWeight: 'font-black',
    letterSpacing: 'tracking-tight',
    textTransform: 'uppercase',
    titleColor: 'text-white',
    subtitleColor: 'text-slate-400',
    badgeColor: 'text-cyan-400'
  }
};

const SECTIONS_META: { key: SectionKey; label: string; icon: any; color: string }[] = [
  { key: 'flashSale', label: '1. Flash Sale Deals', icon: Flame, color: 'text-orange-400' },
  { key: 'activePools', label: '2. Gom Đơn Đang Chạy', icon: Zap, color: 'text-cyan-400' },
  { key: 'topup', label: '3. Nạp Game Trực Tuyến', icon: Sliders, color: 'text-emerald-400' },
  { key: 'marketplace', label: '4. Kho Sản Phẩm (Marketplace)', icon: ShoppingBag, color: 'text-purple-400' }
];

export const SectionHeaderEditorModal: React.FC<SectionHeaderEditorModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'marketplace',
  sectionsConfig,
  onSave
}) => {
  const [activeKey, setActiveKey] = useState<SectionKey>(initialSection);
  const [currentConfig, setCurrentConfig] = useState<SectionsHeaderConfig>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveKey(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (!isOpen) return;
    // Populate with existing or defaults
    const initial: SectionsHeaderConfig = {
      flashSale: { ...DEFAULT_SECTION_DATA.flashSale, ...(sectionsConfig?.flashSale || {}) },
      activePools: { ...DEFAULT_SECTION_DATA.activePools, ...(sectionsConfig?.activePools || {}) },
      topup: { ...DEFAULT_SECTION_DATA.topup, ...(sectionsConfig?.topup || {}) },
      marketplace: { ...DEFAULT_SECTION_DATA.marketplace, ...(sectionsConfig?.marketplace || {}) }
    };
    setCurrentConfig(initial);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeItem: SectionHeaderItemConfig = currentConfig[activeKey] || DEFAULT_SECTION_DATA[activeKey];

  const updateActiveField = (field: keyof SectionHeaderItemConfig, value: any) => {
    setCurrentConfig(prev => ({
      ...prev,
      [activeKey]: {
        ...(prev[activeKey] || DEFAULT_SECTION_DATA[activeKey]),
        [field]: value
      }
    }));
    setIsSaved(false);
  };

  const handleApplyPreset = (preset: 'cyber' | 'gaming' | 'modern' | 'minimal' | 'luxury') => {
    let updates: Partial<SectionHeaderItemConfig> = {};
    if (preset === 'cyber') {
      updates = {
        fontFamily: 'font-orbitron',
        fontWeight: 'font-black',
        letterSpacing: 'tracking-wide',
        textTransform: 'uppercase',
        titleColor: 'text-cyan-400'
      };
    } else if (preset === 'gaming') {
      updates = {
        fontFamily: 'font-chakra',
        fontWeight: 'font-extrabold',
        letterSpacing: 'tracking-wider',
        textTransform: 'uppercase',
        titleColor: 'text-orange-400'
      };
    } else if (preset === 'modern') {
      updates = {
        fontFamily: 'font-bevietnam',
        fontWeight: 'font-bold',
        letterSpacing: 'tracking-tight',
        textTransform: 'uppercase',
        titleColor: 'text-white'
      };
    } else if (preset === 'minimal') {
      updates = {
        fontFamily: 'font-jetbrains',
        fontWeight: 'font-bold',
        letterSpacing: 'tracking-wide',
        textTransform: 'uppercase',
        titleColor: 'text-white'
      };
    } else if (preset === 'luxury') {
      updates = {
        fontFamily: 'font-playfair',
        fontWeight: 'font-bold',
        letterSpacing: 'tracking-wide',
        textTransform: 'capitalize',
        titleColor: 'text-amber-400'
      };
    }

    setCurrentConfig(prev => ({
      ...prev,
      [activeKey]: {
        ...(prev[activeKey] || DEFAULT_SECTION_DATA[activeKey]),
        ...updates
      }
    }));
  };

  const handleResetCurrent = () => {
    setCurrentConfig(prev => ({
      ...prev,
      [activeKey]: { ...DEFAULT_SECTION_DATA[activeKey] }
    }));
  };

  const handleResetAll = () => {
    setCurrentConfig({
      flashSale: { ...DEFAULT_SECTION_DATA.flashSale },
      activePools: { ...DEFAULT_SECTION_DATA.activePools },
      topup: { ...DEFAULT_SECTION_DATA.topup },
      marketplace: { ...DEFAULT_SECTION_DATA.marketplace }
    });
  };

  const handleSaveAll = () => {
    onSave(currentConfig);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0b101e] border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <span>TÙY CHỈNH TIÊU ĐỀ & FONT CHỮ CÁC MỤC</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                    LIVE CUSTOMIZER
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chỉnh sửa trực quan nội dung tiêu đề, mô tả phụ, nhãn badge và phông chữ cho 4 phân khu chính trang chủ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Selector Tabs */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto">
          {SECTIONS_META.map(tab => {
            const Icon = tab.icon;
            const isActive = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveKey(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.35)]' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body: 2 Columns (Live Preview + Editor Controls) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column 1: Editor Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1-Click Style Presets */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>MẪU PHONG CÁCH NHANH (1-CLICK PRESETS):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('modern')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                >
                  🇻🇳 Chuẩn Việt (Be Vietnam)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('cyber')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                >
                  ⚡ Cyberpunk (Orbitron)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('gaming')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-orange-950 text-slate-200 hover:text-orange-300 border border-slate-700 hover:border-orange-500/40 transition-colors"
                >
                  🎮 Gaming Esports (Chakra)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('minimal')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  💻 Tech Code (JetBrains)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('luxury')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-amber-950 text-slate-200 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-colors"
                >
                  👑 Sang Trọng (Playfair)
                </button>
              </div>
            </div>

            {/* Content Fields */}
            <div className="space-y-3 bg-[#0c1324] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. NỘI DUNG VĂN BẢN (TEXT CONTENT)</span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tiêu đề mục chính (Main Title):
                </label>
                <input
                  type="text"
                  value={activeItem.title || ''}
                  onChange={e => updateActiveField('title', e.target.value)}
                  placeholder="Nhập tiêu đề mục..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mô tả phụ (Subtitle / Description):
                </label>
                <textarea
                  rows={2}
                  value={activeItem.subtitle || ''}
                  onChange={e => updateActiveField('subtitle', e.target.value)}
                  placeholder="Nhập nội dung mô tả phụ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>

              {/* Badge Text */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nội dung huy hiệu / Tag / Số lượng (Badge text):
                </label>
                <input
                  type="text"
                  value={activeItem.badge || ''}
                  onChange={e => updateActiveField('badge', e.target.value)}
                  placeholder="Ví dụ: -81% FLASH, 121 GAMES, SÔI ĐỘNG..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Typography & Font Settings */}
            <div className="space-y-4 bg-[#0c1324] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>2. PHÔNG CHỮ & KIỂU DÁNG (TYPOGRAPHY & STYLING)</span>
              </div>

              {/* Font Family Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Chọn Phông Chữ (Font Family):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FONT_OPTIONS.map(font => {
                    const isSelected = (activeItem.fontFamily || 'font-jakarta') === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateActiveField('fontFamily', font.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${font.id}`}>{font.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{font.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size, Weight & Spacing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cỡ chữ (Size):</label>
                  <select
                    value={activeItem.fontSize || 'text-xl sm:text-2xl'}
                    onChange={e => updateActiveField('fontSize', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {FONT_SIZES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Font Weight */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Độ đậm (Weight):</label>
                  <select
                    value={activeItem.fontWeight || 'font-bold'}
                    onChange={e => updateActiveField('fontWeight', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {FONT_WEIGHTS.map(w => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                </div>

                {/* Letter Spacing */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Khoảng cách chữ:</label>
                  <select
                    value={activeItem.letterSpacing || 'tracking-wide'}
                    onChange={e => updateActiveField('letterSpacing', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {LETTER_SPACINGS.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text Transform & Color Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Text Transform */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kiểu chữ hoa/thường:</label>
                  <div className="flex gap-1.5">
                    {TEXT_TRANSFORMS.map(t => {
                      const isSel = (activeItem.textTransform || 'uppercase') === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateActiveField('textTransform', t.id)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {t.id === 'uppercase' ? 'IN HOA' : t.id === 'capitalize' ? 'Hoa Đầu' : 'Thường'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title Color Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Màu sắc tiêu đề:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TITLE_COLOR_PRESETS.map(c => {
                      const isSel = (activeItem.titleColor || 'text-white') === c.class;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateActiveField('titleColor', c.class)}
                          title={c.label}
                          className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                            isSel ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSel && <Check className="w-3.5 h-3.5 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Column 2: Interactive Real-Time Preview Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>XEM TRƯỚC THỰC TẾ (REAL-TIME PREVIEW):</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {SECTIONS_META.find(s => s.key === activeKey)?.label}
                </span>
              </div>

              {/* Preview Container simulating actual homepage section */}
              <div className="bg-[#070b16] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
                {/* Watermark grid effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  {/* Badge & Meta */}
                  {activeItem.badge && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${activeItem.badgeColor || 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'} font-mono`}>
                        {activeItem.badge}
                      </span>
                    </div>
                  )}

                  {/* Header Title with live customized typography */}
                  <h2 
                    className={`
                      ${activeItem.fontFamily || 'font-jakarta'} 
                      ${activeItem.fontSize || 'text-xl sm:text-2xl'} 
                      ${activeItem.fontWeight || 'font-black'} 
                      ${activeItem.letterSpacing || 'tracking-tight'} 
                      ${activeItem.textTransform || 'uppercase'} 
                      ${activeItem.titleColor || 'text-white'}
                      leading-tight transition-all
                    `}
                  >
                    {activeItem.title || 'TIÊU ĐỀ MẪU'}
                  </h2>

                  {/* Subtitle */}
                  <p className={`text-xs sm:text-sm ${activeItem.subtitleColor || 'text-slate-400'} font-sans leading-relaxed`}>
                    {activeItem.subtitle || 'Mô tả chi tiết nội dung phân khu...'}
                  </p>

                  {/* Demo Placeholder UI items */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Phông chữ: <strong className="text-cyan-400">{FONT_OPTIONS.find(f => f.id === activeItem.fontFamily)?.label || 'Plus Jakarta Sans'}</strong>
                    </span>
                    <span>{activeItem.textTransform}</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-400 space-y-2">
                <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Đặc quyền quản trị viên:
                </p>
                <p>
                  Khi bấm <strong className="text-cyan-400">Lưu Cấu Hình</strong>, toàn bộ thay đổi văn bản và font chữ sẽ được áp dụng ngay lập tức trên trang chủ và lưu trữ vĩnh viễn trên hệ thống.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetCurrent}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mục này</span>
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Đặt lại cả 4 mục
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ĐÃ LƯU THÀNH CÔNG!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>LƯU & ÁP DỤNG NGAY</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
