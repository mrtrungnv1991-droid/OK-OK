import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Info,
  Search,
  Check,
  Zap,
  Flame,
  Tag,
  Clock,
  Users,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { Product, ProductCategory, GroupPool, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCreate: (product: Product, newPool: GroupPool) => void;
  currency: CurrencyCode;
  products?: Product[];
  initialProduct?: Product | null;
}

export const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onSuccessCreate,
  currency,
  products = [],
  initialProduct = null
}) => {
  const { t } = useTranslation();

  // State for Product Selection & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || products[0] || null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom Product state (if user specifically wants to create a new product not in catalog)
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<ProductCategory>('gaming');
  const [customPlatform, setCustomPlatform] = useState<string>('Steam');
  const [customRetailPrice, setCustomRetailPrice] = useState<number>(800000);
  const [customGroupPrice, setCustomGroupPrice] = useState<number>(400000);

  // Pool Configuration state
  const [targetSlots, setTargetSlots] = useState<number>(4);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [customPoolTitle, setCustomPoolTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update selected product if initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setTargetSlots(initialProduct.minSlots || 4);
      setIsCustomMode(false);
    } else if (!selectedProduct && products.length > 0) {
      setSelectedProduct(products[0]);
      setTargetSlots(products[0].minSlots || 4);
    }
  }, [initialProduct, products]);

  // When selectedProduct changes, update default targetSlots
  useEffect(() => {
    if (selectedProduct) {
      setTargetSlots(Math.max(2, selectedProduct.minSlots || 4));
      setCustomPoolTitle(`Pool: ${selectedProduct.title}`);
    }
  }, [selectedProduct]);

  if (!isOpen) return null;

  // Filter available products for search
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchSearch = searchTerm.trim() === '' || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchCat && matchSearch;
  });

  // Effective Pricing calculations
  const effectiveRetailPrice = isCustomMode 
    ? customRetailPrice 
    : (selectedProduct?.retailPrice || 0);

  // Wholesale price is STRICTLY determined by the product catalog / supplier policy
  const effectiveGroupPrice = isCustomMode
    ? customGroupPrice
    : (selectedProduct?.groupPrice || Math.round(effectiveRetailPrice * 0.5));

  const savingsPercent = effectiveRetailPrice > 0 
    ? Math.max(1, Math.round(((effectiveRetailPrice - effectiveGroupPrice) / effectiveRetailPrice) * 100))
    : 0;

  const totalPoolValue = effectiveGroupPrice * targetSlots;
  const totalSavings = Math.max(0, (effectiveRetailPrice - effectiveGroupPrice) * targetSlots);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isCustomMode && !selectedProduct) {
      setErrorMsg(t('common.error'));
      return;
    }

    if (isCustomMode && !customTitle.trim()) {
      setErrorMsg(t('common.error'));
      return;
    }

    if (targetSlots < 2 || targetSlots > 20) {
      setErrorMsg(t('common.error'));
      return;
    }

    const currentProduct: Product = isCustomMode ? {
      id: `prod-custom-${Date.now()}`,
      title: customTitle.trim(),
      subtitle: `Pool ${customTitle.trim()} -${savingsPercent}%`,
      category: customCategory,
      platform: customPlatform as any,
      bannerImg: customCategory === 'gaming'
        ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
        : customCategory === 'ai_tools'
        ? 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
      retailPrice: customRetailPrice,
      groupPrice: customGroupPrice,
      minSlots: targetSlots,
      deliveryType: 'instant_key',
      deliveryEstimate: 'Instant delivery on full pool',
      description: `Pool ${customTitle.trim()}`,
      features: [
        'Checked and escrow guaranteed',
        'Auto dispatch key on completion',
        '100% money back warranty'
      ],
      instructions: [
        '1. Join pool slot',
        '2. Wait for pool completion',
        '3. Receive key in Vault'
      ],
      seller: {
        id: 'seller-official',
        name: 'Official CyberPool Partner',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        badge: 'Verified',
        rating: 5.0,
        totalDeals: 120,
        completedPools: 98,
        responseTime: '< 1 min'
      },
      activePools: [],
      rating: 5.0,
      reviewCount: 12,
      stockAvailable: targetSlots * 5,
      tags: ['ESCROW 100%', `-${savingsPercent}%`, 'OFFICIAL']
    } : selectedProduct!;

    // Auto-generate keysVault items for the pool based on targetSlots so auto-fulfillment works
    const autoVaultKeys = Array.from({ length: targetSlots }).map((_, idx) => {
      const codePrefix = currentProduct.platform.toUpperCase();
      const randomCode = `${codePrefix}-VAULT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return {
        id: `k-vault-${Date.now()}-${idx + 1}`,
        code: randomCode,
        status: (idx === 0 ? 'reserved' : 'available') as 'reserved' | 'available'
      };
    });

    const poolId = `pool-${Date.now()}`;
    const newPool: GroupPool = {
      id: poolId,
      productId: currentProduct.id,
      title: customPoolTitle.trim() || `Pool: ${currentProduct.title}`,
      targetSlots: targetSlots,
      filledSlots: 1, // Host takes slot #1
      pricePerSlot: effectiveGroupPrice,
      retailPrice: effectiveRetailPrice,
      savingsPercent: savingsPercent,
      expiresAt: `${durationHours}h 00m`,
      status: 'filling',
      hostName: 'CyberBuyer_Vn (Host)',
      isHot: true,
      participants: [
        {
          id: 'p-host-creator',
          name: 'CyberBuyer_Vn (Host)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
          joinedAt: 'Just now',
          txHash: '0x' + Math.random().toString(16).substring(2, 10),
          slotNumber: 1
        }
      ],
      keysVault: autoVaultKeys
    };

    onSuccessCreate(currentProduct, newPool);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0b0e17] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#0d1424] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-md">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>{t('create_pool.title')}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {t('create_pool.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Workflow Transparent Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs">
            <div className="p-2 rounded-lg bg-black/40 border border-slate-800/80 space-y-1">
              <div className="text-cyan-400 font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] flex items-center justify-center font-black">1</span>
                <span>{t('create_pool.select_product')}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {t('create_pool.select_product')}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-slate-800/80 space-y-1">
              <div className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] flex items-center justify-center font-black">2</span>
                <span>{t('product.group_price')}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {t('escrow.auto_refund')}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-slate-800/80 space-y-1">
              <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] flex items-center justify-center font-black">3</span>
                <span>{t('escrow.instant_delivery')}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {t('escrow.instant_delivery_desc')}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: TÌM KIẾM & CHỌN SẢN PHẨM TỪ HỆ THỐNG */}
          {/* ========================================================================= */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>1. {t('create_pool.select_product')}</span>
              </div>

              {/* Toggle Custom Product if needed */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(!isCustomMode);
                  setErrorMsg('');
                }}
                className="text-[11px] text-slate-400 hover:text-cyan-300 underline decoration-cyan-500/30 cursor-pointer self-start sm:self-auto"
              >
                {isCustomMode ? '← ' + t('create_pool.select_product') : '+ Custom'}
              </button>
            </div>

            {!isCustomMode ? (
              <div className="space-y-3">
                {/* Search & Category Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('nav.search_placeholder')}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    {[
                      { id: 'all', label: t('categories.all') },
                      { id: 'gaming', label: t('categories.gaming') },
                      { id: 'ai_tools', label: t('categories.ai_tools') },
                      { id: 'giftup_cards', label: t('categories.giftup_cards') },
                      { id: 'streaming', label: t('categories.streaming') },
                      { id: 'software', label: t('categories.software') },
                      { id: 'vpn', label: t('categories.vpn') }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategoryFilter === cat.id
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Products Selector List */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {filteredProducts.map(p => {
                    const isSelected = selectedProduct?.id === p.id;
                    const discount = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setErrorMsg('');
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.bannerImg}
                            alt={p.title}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{p.title}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                                {p.platform}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/30">
                                -{discount}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                              {p.subtitle || p.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <div className="text-[10px] text-slate-400 line-through font-mono">
                              {formatCurrency(p.retailPrice, currency)}
                            </div>
                            <div className="text-xs font-bold text-cyan-400 font-mono">
                              {formatCurrency(p.groupPrice, currency)}
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-400 text-black'
                              : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                      {t('common.filter')}: {searchTerm} (0)
                    </div>
                  )}
                </div>

                {/* Selected Product Highlight Card */}
                {selectedProduct && (
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={selectedProduct.bannerImg}
                        alt={selectedProduct.title}
                        className="w-10 h-10 rounded-lg object-cover border border-cyan-500/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{selectedProduct.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Platform: <span className="text-cyan-300 font-bold">{selectedProduct.platform}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">{t('product.group_price')}:</span>
                      <span className="text-xs font-bold text-cyan-400 font-mono">
                        {formatCurrency(selectedProduct.groupPrice, currency)} / slot
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Custom Product Creation Form (if user wants to list a custom item) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {t('common.info')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="ChatGPT Plus, Steam Key, etc."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ProductCategory)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="ai_tools">AI Tools</option>
                    <option value="giftup_cards">Gift Cards</option>
                    <option value="streaming">Streaming</option>
                    <option value="software">Software</option>
                    <option value="vpn">VPN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Steam">Steam</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="GiftUp">GiftUp</option>
                    <option value="Netflix">Netflix</option>
                    <option value="Adobe">Adobe</option>
                    <option value="NordVPN">NordVPN</option>
                    <option value="Spotify">Spotify</option>
                    <option value="Xbox">Xbox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {t('product.retail_price')}
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={customRetailPrice}
                    onChange={(e) => setCustomRetailPrice(Math.max(10000, Number(e.target.value)))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {t('product.group_price')}
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={customGroupPrice}
                    onChange={(e) => setCustomGroupPrice(Math.max(5000, Number(e.target.value)))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-400 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: CƠ CHẾ GOM ĐƠN & ĐỊNH GIÁ SỈ THỰC TẾ (CỐ ĐỊNH THEO PRODUCT) */}
          {/* ========================================================================= */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>2. {t('create_pool.target_slots')}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                -{savingsPercent}%
              </span>
            </div>

            {/* Explanatory Note regarding Fixed Wholesale Math */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1 font-sans">
                <p>
                  {formatCurrency(effectiveGroupPrice, currency)} / slot ({t('product.retail_price')}: {formatCurrency(effectiveRetailPrice, currency)})
                </p>
              </div>
            </div>

            {/* Target Slots Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('create_pool.target_slots')}:</span>
                </label>
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  {targetSlots} Slots
                </span>
              </div>

              {/* Quick slot selection pills */}
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {[2, 3, 4, 5, 6, 10].map(slots => (
                  <button
                    key={slots}
                    type="button"
                    onClick={() => setTargetSlots(slots)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      targetSlots === slots
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950/50 scale-102 ring-1 ring-cyan-400'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {slots} Slots
                  </button>
                ))}
              </div>
            </div>

            {/* Title for the Group Pool */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {t('create_pool.pool_title')}:
              </label>
              <input
                type="text"
                value={customPoolTitle}
                onChange={(e) => setCustomPoolTitle(e.target.value)}
                placeholder="Pool title..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Duration Selector */}
            <div className="flex items-center justify-between text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{t('create_pool.duration')}:</span>
              </span>
              <div className="flex items-center gap-2">
                {[24, 48, 72].map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDurationHours(hrs)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                      durationHours === hrs
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#0c1322] to-slate-950 border border-cyan-500/30 space-y-2 text-xs">
              <div className="text-slate-400 font-bold uppercase text-[11px] flex items-center justify-between border-b border-slate-800 pb-2">
                <span>{t('common.info')} ({targetSlots} SLOTS)</span>
                <span className="text-emerald-400 font-mono">Savings {formatCurrency(totalSavings, currency)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">{t('product.group_price')}:</span>
                  <span className="text-sm font-black text-cyan-400 font-mono">
                    {formatCurrency(effectiveGroupPrice, currency)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">{t('cart.total_label')}:</span>
                  <span className="text-sm font-black text-white font-mono">
                    {formatCurrency(totalPoolValue, currency)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block">Escrow:</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>100% Escrow</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: CƠ CHẾ PHÁT HÀNH KEY TỰ ĐỘNG & BẢO LÃNH ESCROW */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-950 to-cyan-950/20 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3. {t('escrow.title')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 font-sans">
              <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>⚡ {t('escrow.instant_delivery')}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('escrow.instant_delivery_desc')}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                <div className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🛡️ {t('escrow.auto_refund')}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('escrow.auto_refund_desc')}
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a0d14] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs border border-slate-800 cursor-pointer transition-colors"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isCustomMode && !selectedProduct}
            className="flex items-center gap-2 py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{t('create_pool.submit_btn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
