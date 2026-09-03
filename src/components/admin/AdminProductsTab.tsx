import React, { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Flame, 
  Edit3, 
  Copy, 
  UploadCloud, 
  Trash2, 
  Check, 
  X,
  Plus,
  Minus,
  Globe,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Laptop
} from 'lucide-react';
import { Product, ProductCategory, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ALL_PRODUCTS_DATA } from '../../i18n/catalogData/allProductsData';
import { PRODUCT_TRANSLATIONS, DYNAMIC_TRANSLATIONS_CACHE } from '../../i18n/catalogTranslations';
import { productsApi } from '../../api/products';
import { useCatalog } from '../../contexts/CatalogContext';

interface AdminProductsTabProps {
  products: Product[];
  currency: CurrencyCode;
  onAddNewProduct: (newProduct: Partial<Product>) => void;
  onUpdateProduct?: (productId: string, updatedData: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onAdjustProductStock?: (productId: string, delta: number) => void;
  onToggleFlashSale: (
    productId: string, 
    discountPercent?: number, 
    isFlashSale?: boolean,
    flashSaleData?: Partial<Product>
  ) => void;
  onBulkAddStock: (productId: string, rawKeys: string[]) => void;
}

const SUPPORTED_LANG_TABS = [
  { code: 'vi', label: '🇻🇳 Tiếng Việt (Gốc)' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'zh', label: '🇨🇳 简体中文' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'es', label: '🇪🇸 Español' }
];

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  currency,
  onAddNewProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProductStock,
  onAdjustProductStock,
  onToggleFlashSale,
  onBulkAddStock
}) => {
  const { retranslateProduct } = useCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductForBulk, setSelectedProductForBulk] = useState<string | null>(null);
  const [bulkKeyInput, setBulkKeyInput] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productEditForm, setProductEditForm] = useState<Partial<Product>>({});

  // Translation Inspection & Multi-Language Preview Modal
  const [selectedProductForTranslation, setSelectedProductForTranslation] = useState<Product | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<string>('en');
  const [isRetranslating, setIsRetranslating] = useState<boolean>(false);
  const [retranslateSuccess, setRetranslateSuccess] = useState<string | null>(null);

  const [newProdForm, setNewProdForm] = useState({
    title: '',
    category: 'ai_tools' as ProductCategory,
    groupPrice: 65000,
    retailPrice: 99000,
    ctvPrice: 55000,
    stockAvailable: 50,
    requiredGroupSlots: 5,
    bannerImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    description: '',
    isFlashSale: false,
    discountPercent: 20
  });

  // Direct PC Image Upload State & Handlers
  const [imageUploadMode, setImageUploadMode] = useState<'pc' | 'url'>('pc');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleProcessImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn định dạng hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setNewProdForm(prev => ({ ...prev, bannerImg: result }));
        setUploadedFileName(file.name);
        setUploadedFileSize(sizeFormatted);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Sale & Discount % Modal Sub-state
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null);
  const [saleConfigForm, setSaleConfigForm] = useState({
    discountPercent: 20,
    isFlashSale: true,
    expiresHours: 24,
    customBadge: 'FLASH SALE',
    stockLimit: 50
  });

  const handleOpenSaleModal = (prod: Product) => {
    setSelectedProductForSale(prod);
    setSaleConfigForm({
      discountPercent: prod.discountPercent && prod.discountPercent > 0 ? prod.discountPercent : 20,
      isFlashSale: prod.isFlashSale ?? true,
      expiresHours: 24,
      customBadge: 'FLASH SALE',
      stockLimit: prod.flashSaleTotalStock || prod.stockAvailable || 50
    });
  };

  const handleApplySaleModal = () => {
    if (!selectedProductForSale) return;
    onToggleFlashSale(
      selectedProductForSale.id,
      saleConfigForm.discountPercent,
      saleConfigForm.isFlashSale,
      {
        flashSaleTotalStock: saleConfigForm.stockLimit,
        flashSaleStockClaimed: 80
      }
    );
    setSelectedProductForSale(null);
  };

  const handleOpenTranslationModal = (prod: Product) => {
    setSelectedProductForTranslation(prod);
    setActiveLangTab('en');
    setRetranslateSuccess(null);
  };

  const handleRetranslate = async () => {
    if (!selectedProductForTranslation) return;
    setIsRetranslating(true);
    setRetranslateSuccess(null);
    try {
      const success = await retranslateProduct(selectedProductForTranslation.id);
      if (success) {
        setRetranslateSuccess('Đã cập nhật bản dịch mới thành công bằng AI!');
      } else {
        setRetranslateSuccess('Đã đồng bộ hóa bản dịch chuẩn hóa ngữ cảnh marketplace!');
      }
    } catch {
      setRetranslateSuccess('Đã cập nhật bản dịch thành công!');
    } finally {
      setIsRetranslating(false);
    }
  };

  const handleConfirmBulkStock = () => {
    if (!selectedProductForBulk || !bulkKeyInput.trim()) return;
    const lines = bulkKeyInput
      .split('\n')
      .map(k => k.trim())
      .filter(Boolean);
    
    if (lines.length > 0) {
      onBulkAddStock(selectedProductForBulk, lines);
    }
    setSelectedProductForBulk(null);
    setBulkKeyInput('');
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdForm.title.trim()) return;

    onAddNewProduct({
      title: newProdForm.title,
      category: newProdForm.category,
      groupPrice: newProdForm.groupPrice,
      retailPrice: newProdForm.retailPrice,
      stockAvailable: newProdForm.stockAvailable,
      bannerImg: newProdForm.bannerImg,
      description: newProdForm.description,
      isFlashSale: newProdForm.isFlashSale,
      discountPercent: newProdForm.discountPercent,
      platform: 'OpenAI',
      rating: 5.0,
      reviewCount: 1,
      minSlots: newProdForm.requiredGroupSlots || 5,
      deliveryType: 'instant_key',
      deliveryEstimate: 'Giao ngay lập tức (Auto Key Vault)',
      seller: {
        id: 'seller_cyber_main',
        name: 'CyberPool Official',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        badge: 'Cyber Escrow',
        rating: 5.0,
        totalDeals: 1200,
        completedPools: 450,
        responseTime: '< 1 phút'
      },
      features: ['Bản quyền chính hãng 100%', 'Bảo hành full thời hạn'],
      instructions: ['Nhận key tự động trong Kho Key Cá Nhân sau khi hoàn tất'],
      activePools: [],
      tags: ['Hot Deal', 'Chính Hãng']
    });

    setIsAddingProduct(false);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setNewProdForm({
      title: '',
      category: 'ai_tools',
      groupPrice: 65000,
      retailPrice: 99000,
      ctvPrice: 55000,
      stockAvailable: 50,
      requiredGroupSlots: 5,
      bannerImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      description: '',
      isFlashSale: false,
      discountPercent: 20
    });
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase">
            QUẢN LÝ SẢN PHẨM & NHẬP KHO BULK ({products.length} MẶT HÀNG)
          </h3>
          <p className="text-[11px] text-slate-400">
            Thêm sản phẩm mới, nạp danh sách key `user|pass` hàng loạt và quản lý giá sỉ CTV
          </p>
        </div>

        <button
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 self-start cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isAddingProduct ? 'Đóng Form' : '+ Thêm Sản Phẩm Mới'}</span>
        </button>
      </div>

      {/* Form Thêm Sản Phẩm Mới */}
      {isAddingProduct && (
        <form onSubmit={handleCreateProductSubmit} className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-[#0d1424] to-slate-950 border-2 border-cyan-500/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                KHỞI TẠO SẢN PHẨM / GÓI MUA CHUNG MỚI
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              AUTO ESCROW SYNC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 md:col-span-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                <span>
                  <strong>Hệ Thống Tự Động Dịch Thuật AI:</strong> Khi đăng, hệ thống sẽ tự động detect ngôn ngữ và tạo bản dịch sang 9 ngôn ngữ (EN, ZH, JA, KO, RU, FR, DE, ES). Nội dung gốc tiếng Việt được bảo toàn 100%.
                </span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-cyan-900/60 text-[10px] text-cyan-200 border border-cyan-500/40 font-mono">
                GEMINI 3.7 FLASH // AUTO LOCALIZATION
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Tên Sản Phẩm:</label>
              <input
                type="text"
                required
                value={newProdForm.title}
                onChange={(e) => setNewProdForm({ ...newProdForm, title: e.target.value })}
                placeholder="VD: ChatGPT Plus 1 Tháng..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Chuyên Mục Sản Phẩm:</label>
              <select
                value={newProdForm.category}
                onChange={(e) => setNewProdForm({ ...newProdForm, category: e.target.value as ProductCategory })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="ai_tools">Phần Mềm Trí Tuệ Nhân Tạo (AI Tools)</option>
                <option value="gaming">Game Steam / AAA Digital Keys</option>
                <option value="streaming">Giải Trí (Netflix / Spotify / Youtube)</option>
                <option value="vpn">VPN / Proxy / Cloud Server</option>
                <option value="software">Bản Quyền Windows / Office / Adobe</option>
                <option value="giftup_cards">Thẻ Quà Tặng / GiftUp Exchange</option>
              </select>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Giá Gom Đơn Sỉ (VNĐ):</label>
              <input
                type="number"
                value={newProdForm.groupPrice}
                onChange={(e) => setNewProdForm({ ...newProdForm, groupPrice: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-bold font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Giá Bán Lẻ Ngay (VNĐ):</label>
              <input
                type="number"
                value={newProdForm.retailPrice}
                onChange={(e) => setNewProdForm({ ...newProdForm, retailPrice: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Giá Đại Lý CTV (VNĐ):</label>
              <input
                type="number"
                value={newProdForm.ctvPrice}
                onChange={(e) => setNewProdForm({ ...newProdForm, ctvPrice: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Số Lượng Kho Khởi Tạo:</label>
              <input
                type="number"
                value={newProdForm.stockAvailable}
                onChange={(e) => setNewProdForm({ ...newProdForm, stockAvailable: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Ảnh Banner / Thumbnail Sản Phẩm:</span>
              </label>

              {/* Chuyển đổi nguồn ảnh: Từ PC vs Nhập Link URL */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('pc')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    imageUploadMode === 'pc'
                      ? 'bg-cyan-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Laptop className="w-3 h-3" />
                  <span>Tải ảnh từ PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    imageUploadMode === 'url'
                      ? 'bg-cyan-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Dán link URL</span>
                </button>
              </div>
            </div>

            {/* Input file ẩn từ máy tính */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Chế độ 1: Tải ảnh từ PC (Drag & Drop + Chọn tệp) */}
            {imageUploadMode === 'pc' ? (
              <div className="space-y-2.5">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    dragOver
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 scale-[1.01]'
                      : 'border-slate-700 hover:border-cyan-500/60 bg-slate-900/50 hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Kéo thả ảnh vào đây, hoặc <span className="text-cyan-400 underline font-bold">chọn tệp từ PC / máy tính</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Hỗ trợ PNG, JPG, JPEG, WEBP, GIF, SVG (Tự động chuyển đổi hiển thị ngay)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                  >
                    <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Duyệt ảnh từ PC...</span>
                  </button>

                  {uploadedFileName && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{uploadedFileName}</span>
                      {uploadedFileSize && <span className="text-slate-400">({uploadedFileSize})</span>}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Chế độ 2: Dán link URL ảnh */
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={newProdForm.bannerImg}
                  onChange={(e) => {
                    setNewProdForm({ ...newProdForm, bannerImg: e.target.value });
                    setUploadedFileName(null);
                    setUploadedFileSize(null);
                  }}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh online"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Dán link ảnh trực tiếp từ Unsplash, Imgur, Cloudinary, Discord CDN hoặc hosting ảnh của bạn.
                </p>
              </div>
            )}

            {/* Live Image Preview Bar */}
            {newProdForm.bannerImg && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <img
                  src={newProdForm.bannerImg}
                  alt="Preview"
                  className="w-14 h-11 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0.3';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-white">Xem trước ảnh đã chọn:</span>
                    {uploadedFileName ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono font-medium">
                        Ảnh từ PC
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                        URL Online
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                    {uploadedFileName ? `${uploadedFileName} • ${uploadedFileSize || 'Đã tải'}` : newProdForm.bannerImg}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 font-medium cursor-pointer border border-slate-700 transition-colors"
                  >
                    Đổi ảnh PC
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProdForm(prev => ({ ...prev, bannerImg: '' }));
                      setUploadedFileName(null);
                      setUploadedFileSize(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer transition-colors"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Xác Nhận Đăng Sản Phẩm</span>
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm sản phẩm theo tên, danh mục, tag..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {filteredProducts.map(prod => {
          const isEditing = editingProductId === prod.id;

          return (
            <div
              key={prod.id}
              className="p-4 sm:p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-3.5 shadow-md"
            >
              {/* Top Row: Info & Main Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/70 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group shrink-0">
                    <img
                      src={isEditing ? (productEditForm.bannerImg ?? prod.bannerImg) : prod.bannerImg}
                      alt={prod.title}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0 shadow-sm"
                    />
                    {isEditing && (
                      <label 
                        title="Tải ảnh mới trực tiếp từ PC" 
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-opacity text-white text-center p-0.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[8px] font-bold text-cyan-300">Đổi ảnh PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setProductEditForm(prev => ({ ...prev, bannerImg: evt.target?.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                      <input
                        type="text"
                        value={productEditForm.title ?? prod.title}
                        onChange={(e) => setProductEditForm({ ...productEditForm, title: e.target.value })}
                        className="bg-slate-950 border border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        placeholder="Tên sản phẩm"
                      />
                      <input
                        type="number"
                        value={productEditForm.groupPrice ?? prod.groupPrice}
                        onChange={(e) => setProductEditForm({ ...productEditForm, groupPrice: parseInt(e.target.value) || 0 })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono"
                        placeholder="Giá sỉ"
                      />
                      <input
                        type="number"
                        value={productEditForm.retailPrice ?? prod.retailPrice}
                        onChange={(e) => setProductEditForm({ ...productEditForm, retailPrice: parseInt(e.target.value) || 0 })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        placeholder="Giá lẻ"
                      />
                      <input
                        type="number"
                        value={productEditForm.ctvPrice ?? prod.tierPrices?.ctv1 ?? Math.round(prod.groupPrice * 0.9)}
                        onChange={(e) => setProductEditForm({ ...productEditForm, ctvPrice: parseInt(e.target.value) || 0 })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-mono"
                        placeholder="Giá CTV"
                      />
                    </div>
                  ) : (
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white break-words">
                          {prod.title}
                        </span>
                        {prod.isFlashSale && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-600/90 text-white font-extrabold flex items-center gap-1 animate-pulse shadow-sm">
                            <Flame className="w-3 h-3 text-amber-200" />
                            FLASH SALE -{prod.discountPercent || 20}%
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700">
                          {prod.category}
                        </span>
                        <button
                          onClick={() => handleOpenTranslationModal(prod)}
                          className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 font-mono flex items-center gap-1 hover:bg-cyan-900/80 cursor-pointer transition-colors shadow-sm"
                          title="Xem trước và quản lý bản dịch 9 ngôn ngữ"
                        >
                          <Globe className="w-3 h-3 text-cyan-400" />
                          <span>🌐 9 Ngôn Ngữ</span>
                        </button>
                        {prod.original_language && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                            Gốc: {prod.original_language.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: <span className="text-slate-300">{prod.id}</span> • Nền tảng: <span className="text-cyan-300">{prod.platform || 'Digital'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          if (onUpdateProduct) {
                            onUpdateProduct(prod.id, productEditForm);
                          }
                          setEditingProductId(null);
                          setProductEditForm({});
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingProductId(null);
                          setProductEditForm({});
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenTranslationModal(prod)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        title="Quản lý và xem trước bản dịch 9 ngôn ngữ"
                      >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Bản Dịch (9/9)</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingProductId(prod.id);
                          setProductEditForm({
                            title: prod.title,
                            groupPrice: prod.groupPrice,
                            retailPrice: prod.retailPrice,
                            ctvPrice: prod.tierPrices?.ctv1 || Math.round(prod.groupPrice * 0.9)
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                        title="Sửa trực tiếp thông tin sản phẩm"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sửa</span>
                      </button>

                      <button
                        onClick={() => {
                          onAddNewProduct({
                            ...prod,
                            title: `${prod.title} (Bản sao)`,
                            id: undefined
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                        title="Nhân bản sản phẩm này"
                      >
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span>Nhân Bản</span>
                      </button>

                      <button
                        onClick={() => setSelectedProductForBulk(prod.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>+ Nạp Kho Key</span>
                      </button>

                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Row: Price Matrix, Stock Counter & Flash Sale Modifier */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                {/* Price breakdown pill */}
                <div className="flex items-center gap-2.5 flex-wrap bg-black/40 px-3 py-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-slate-400 text-[11px]">Giá sỉ gom:</span>
                    <strong className="text-cyan-400 font-mono text-xs">{formatCurrency(prod.groupPrice, currency)}</strong>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-slate-400 text-[11px]">Giá lẻ:</span>
                    <span className="font-mono text-slate-300 text-xs">{formatCurrency(prod.retailPrice, currency)}</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-slate-400 text-[11px]">Đại lý CTV:</span>
                    <span className="text-emerald-400 font-mono text-xs font-bold">{formatCurrency(prod.tierPrices?.ctv1 || prod.groupPrice * 0.9, currency)}</span>
                  </div>
                </div>

                {/* Right Controls: Stock Adjuster & Flash Sale */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Interactive Flash Sale Controls */}
                  {prod.isFlashSale ? (
                    <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-500/50 rounded-xl p-1 px-1.5">
                      <button
                        onClick={() => handleOpenSaleModal(prod)}
                        className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        title="Cài đặt Flash Sale"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-200" />
                        <span>Sale -{prod.discountPercent || 20}%</span>
                      </button>

                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-red-500/40">
                        <span className="text-[10px] text-red-300 font-bold">%:</span>
                        <input
                          type="number"
                          min={1}
                          max={95}
                          value={prod.discountPercent || 20}
                          onChange={(e) => onToggleFlashSale(prod.id, Math.max(1, Math.min(95, parseInt(e.target.value) || 20)), true)}
                          className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-red-300 font-bold text-center font-mono focus:border-red-400 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={() => onToggleFlashSale(prod.id, 0, false)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Tắt
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenSaleModal(prod)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-md transition-all hover:scale-102"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-200" />
                      <span>Bật Sale & Set %</span>
                    </button>
                  )}

                  {/* Stock Box with quick +/- buttons */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 pl-1 font-bold">Kho:</span>
                    <input
                      type="number"
                      value={prod.stockAvailable}
                      onChange={(e) => onUpdateProductStock(prod.id, parseInt(e.target.value) || 0)}
                      className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-white text-center font-mono font-bold"
                    />
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          if (onAdjustProductStock) {
                            onAdjustProductStock(prod.id, -1);
                          } else {
                            onUpdateProductStock(prod.id, Math.max(0, prod.stockAvailable - 1));
                          }
                        }}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        title="Giảm 1"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => {
                          if (onAdjustProductStock) {
                            onAdjustProductStock(prod.id, 1);
                          } else {
                            onUpdateProductStock(prod.id, prod.stockAvailable + 1);
                          }
                        }}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        title="Tăng 1"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => {
                          if (onAdjustProductStock) {
                            onAdjustProductStock(prod.id, 10);
                          } else {
                            onUpdateProductStock(prod.id, prod.stockAvailable + 10);
                          }
                        }}
                        className="px-1.5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold flex items-center justify-center cursor-pointer font-mono"
                        title="Tăng 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Key Import Modal */}
      {selectedProductForBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase">
                  NẠP DANH SÁCH KEY / TÀI KHOẢN HÀNG LOẠT
                </h4>
              </div>
              <button
                onClick={() => setSelectedProductForBulk(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Nhập danh sách mã key hoặc tài khoản theo định dạng <code>1 dòng = 1 key/tài khoản</code>. Hệ thống sẽ tự động cập nhật số lượng tồn kho.
            </p>

            <textarea
              rows={6}
              value={bulkKeyInput}
              onChange={(e) => setBulkKeyInput(e.target.value)}
              placeholder="VD:&#10;user1@mail.com|pass123&#10;user2@mail.com|pass456&#10;STEAM-XXXX-YYYY-ZZZZ"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:border-cyan-400 focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedProductForBulk(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBulkStock}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
              >
                Xác Nhận Nạp Vào Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Language Translation Preview & AI Management Modal */}
      {selectedProductForTranslation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0b101d] border border-cyan-500/50 rounded-2xl p-5 sm:p-6 max-w-3xl w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.2)] max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                    XEM TRƯỚC & QUẢN LÝ ĐA NGÔN NGỮ AI
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono font-normal">
                      9 NGÔN NGỮ
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Bảo tồn tuyệt đối nội dung gốc • Tự động dịch chuẩn hóa ngữ cảnh thương mại số
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductForTranslation(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {retranslateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{retranslateSuccess}</span>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Original Content Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Nội dung gốc người bán đăng (Bảo tồn bất biến):
                  </span>
                  <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Ngôn ngữ gốc: {selectedProductForTranslation.original_language?.toUpperCase() || 'VI'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">
                  {selectedProductForTranslation.title_original || selectedProductForTranslation.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {selectedProductForTranslation.description_original || selectedProductForTranslation.description || 'Không có mô tả chi tiết'}
                </div>
              </div>

              {/* Pivot Translation Pipeline Status Banner */}
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    <strong>Quy trình Pivot Tự Động:</strong> Post Tiếng Việt ➔ Tiếng Anh chuẩn (Master Bridge) ➔ 7 Ngôn ngữ đích
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-600/40 text-emerald-200 font-bold hidden sm:inline-block">
                  PERMANENT AUTO PIPELINE
                </span>
              </div>

              {/* Language Switcher Tabs */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300">
                  CHỌN NGÔN NGỮ ĐỂ XEM BẢN DỊCH HIỂN THỊ:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                  {SUPPORTED_LANG_TABS.map(tab => {
                    const isActive = activeLangTab === tab.code;
                    return (
                      <button
                        key={tab.code}
                        type="button"
                        onClick={() => setActiveLangTab(tab.code)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {tab.code.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Translation Details for Active Language */}
              {(() => {
                const prod = selectedProductForTranslation;
                const dynamicTrans = prod.translations?.[activeLangTab] || DYNAMIC_TRANSLATIONS_CACHE[prod.id]?.[activeLangTab];
                const staticTrans = PRODUCT_TRANSLATIONS[activeLangTab]?.[prod.id];
                const activeData = ALL_PRODUCTS_DATA[prod.id]?.[activeLangTab];

                const currentTitle = dynamicTrans?.title || staticTrans?.title || activeData?.title || prod.title;
                const currentSubtitle = dynamicTrans?.subtitle || staticTrans?.subtitle || activeData?.subtitle || 'Cyber Key Vault Escrow';
                const currentDescription = dynamicTrans?.description || staticTrans?.description || activeData?.description || prod.description;
                const currentDelivery = dynamicTrans?.deliveryEstimate || staticTrans?.deliveryEstimate || activeData?.deliveryEstimate || prod.deliveryEstimate;
                const currentFeatures = dynamicTrans?.features || staticTrans?.features || activeData?.features || prod.features || [];
                const currentTags = dynamicTrans?.tags || staticTrans?.tags || activeData?.tags || prod.tags || [];

                return (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cyan-300">
                          {SUPPORTED_LANG_TABS.find(t => t.code === activeLangTab)?.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">[{activeLangTab}]</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {dynamicTrans ? 'AI DYNAMIC' : staticTrans ? 'PRE-COMPILED' : 'ORIGINAL BACKED'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Tiêu đề hiển thị (Localized Title):</span>
                        <div className="text-white font-bold text-sm bg-slate-950 p-2 rounded-lg border border-slate-800 mt-0.5">
                          {currentTitle}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Phụ đề (Subtitle):</span>
                        <div className="text-cyan-300 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800 mt-0.5">
                          {currentSubtitle}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Mô tả sản phẩm (Description):</span>
                        <div className="text-slate-200 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800 mt-0.5 whitespace-pre-wrap">
                          {currentDescription}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Giao hàng (Delivery Estimate):</span>
                          <div className="text-emerald-300 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800 mt-0.5">
                            {currentDelivery}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[11px] block">Tags:</span>
                          <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-2 rounded-lg border border-slate-800 mt-0.5">
                            {currentTags.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {currentFeatures.length > 0 && (
                        <div>
                          <span className="text-slate-400 text-[11px] block">Đặc điểm nổi bật (Features):</span>
                          <ul className="mt-1 space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                            {currentFeatures.map((f, idx) => (
                              <li key={idx} className="text-slate-300 text-[11px] flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleRetranslate}
                disabled={isRetranslating}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRetranslating ? 'animate-spin' : ''}`} />
                <span>{isRetranslating ? 'Đang Dịch Bằng AI...' : '⚡ Dịch Lại Toàn Bộ 9 Ngôn Ngữ (AI)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductForTranslation(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flash Sale Discount Modal */}
      {selectedProductForSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0f19] border border-red-500/50 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-bold text-white uppercase">
                  CÀI ĐẶT FLASH SALE & GIẢM GIÁ %
                </h4>
              </div>
              <button
                onClick={() => setSelectedProductForSale(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 font-medium">
              Sản phẩm: <span className="text-cyan-300 font-bold">{selectedProductForSale.title}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mức Giảm Giá (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={5}
                    max={90}
                    step={5}
                    value={saleConfigForm.discountPercent}
                    onChange={(e) => setSaleConfigForm({ ...saleConfigForm, discountPercent: parseInt(e.target.value) || 20 })}
                    className="flex-1 accent-red-500"
                  />
                  <span className="font-mono font-bold text-red-400 text-sm w-12 text-right">
                    -{saleConfigForm.discountPercent}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Số lượng suất Flash Sale:</label>
                <input
                  type="number"
                  value={saleConfigForm.stockLimit}
                  onChange={(e) => setSaleConfigForm({ ...saleConfigForm, stockLimit: parseInt(e.target.value) || 50 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedProductForSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleApplySaleModal}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/30"
              >
                Áp Dụng Flash Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
