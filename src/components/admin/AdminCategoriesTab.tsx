import React, { useState } from 'react';
import { 
  FolderPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Layers, 
  Folder, 
  FolderTree, 
  Gamepad2, 
  Gift, 
  Zap, 
  Sparkles, 
  Cpu, 
  Film, 
  Shield, 
  Lock,
  Tag
} from 'lucide-react';
import { CategoryItem } from '../../types';
import { INITIAL_EXTENDED_CATEGORIES } from '../../data/systemExtendedData';

export const AdminCategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_EXTENDED_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'root' | 'sub'>('all');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CategoryItem>>({
    name: '',
    slug: '',
    parentId: null,
    iconName: 'Gamepad2',
    orderIndex: 1,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'key_game',
    description: ''
  });

  const rootCategories = categories.filter(c => !c.parentId);

  const filteredCategories = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchType = filterType === 'all' 
      ? true 
      : filterType === 'root' 
        ? !c.parentId 
        : !!c.parentId;

    return matchSearch && matchType;
  });

  const handleOpenCreate = (parentId?: string) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      parentId: parentId || null,
      iconName: 'Gamepad2',
      orderIndex: categories.length + 1,
      status: 'active',
      fulfillmentType: 'manual',
      deliveryClassification: 'key_game',
      description: ''
    });
    setIsCreatingNew(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setIsCreatingNew(false);
    setEditingCategory(cat);
    setFormData({ ...cat });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.slug?.trim()) {
      setSaveNotice('⚠️ Vui lòng nhập đầy đủ Tên chuyên mục và Đường dẫn Slug');
      setTimeout(() => setSaveNotice(null), 3000);
      return;
    }

    if (isCreatingNew) {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        parentId: formData.parentId || null,
        iconName: formData.iconName || 'Folder',
        orderIndex: Number(formData.orderIndex) || 1,
        status: formData.status || 'active',
        fulfillmentType: formData.fulfillmentType || 'manual',
        deliveryClassification: formData.deliveryClassification || 'key_game',
        productCount: 0,
        description: formData.description || ''
      };
      setCategories([...categories, newCat]);
      setSaveNotice(`Đã tạo chuyên mục "${newCat.name}" thành công!`);
    } else if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } as CategoryItem : c));
      setSaveNotice(`Đã cập nhật chuyên mục "${formData.name}" thành công!`);
    }

    setIsCreatingNew(false);
    setEditingCategory(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleDelete = (id: string) => {
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
      if (!confirm('Chuyên mục này đang có các nhánh phụ con. Bạn có chắc muốn xóa không?')) {
        return;
      }
    } else {
      if (!confirm('Bạn có chắc muốn xóa chuyên mục này không?')) return;
    }
    setCategories(categories.filter(c => c.id !== id && c.parentId !== id));
    setSaveNotice('Đã xóa chuyên mục thành công!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const getParentName = (parentId?: string | null) => {
    if (!parentId) return 'Nhánh chính (Gốc)';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : 'Không xác định';
  };

  const getClassificationBadge = (classification?: string, fulfillment?: string) => {
    switch (classification) {
      case 'account':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium whitespace-nowrap">Tự Động (Account)</span>;
      case 'key_game':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium whitespace-nowrap">Thủ Công (Key Game)</span>;
      case 'gift_card':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-pink-950/80 text-pink-300 border border-pink-500/30 text-[11px] font-medium whitespace-nowrap">Thủ Công (Gift Card)</span>;
      case 'topup_manual':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[11px] font-medium whitespace-nowrap">Thủ Công (Top Up UID)</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium whitespace-nowrap">{fulfillment === 'automatic' ? 'Tự Động' : 'Thủ Công'}</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-wide">
            <FolderTree className="w-4 h-4 text-purple-400" />
            <span>QUẢN LÝ CHUYÊN MỤC & PHÂN NHÁNH ĐA CẤP ({categories.length} DANH MỤC)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-purple-950 text-purple-300 border border-purple-500/30 font-medium">
              E-Commerce CMS
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cấu hình nhánh chính (Root Categories) & nhánh phụ (Subcategories) cho: Đơn tự động (Account) và Đơn thủ công (Key Game, Gift card, Top Up).
          </p>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-lg self-start text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Nhánh Chuyên Mục</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chuyên mục theo tên, slug, phân loại..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">Tất cả ({categories.length})</option>
            <option value="root">Chỉ Nhánh Chính ({rootCategories.length})</option>
            <option value="sub">Chỉ Nhánh Phụ ({categories.length - rootCategories.length})</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-2.5 px-2 w-12 text-center whitespace-nowrap">#</th>
              <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[150px]">Tên Chuyên Mục & Slug</th>
              <th className="py-2.5 px-2.5 text-left whitespace-nowrap w-36">Cấp Phân Nhánh</th>
              <th className="py-2.5 px-2.5 text-center whitespace-nowrap w-36">Phân Loại Giao Hàng</th>
              <th className="py-2.5 px-2 text-center w-16 whitespace-nowrap">Sản Phẩm</th>
              <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">Trạng Thái</th>
              <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCategories.map((cat) => {
              const isRoot = !cat.parentId;
              return (
                <tr key={cat.id} className={`hover:bg-slate-900/40 transition-colors ${isRoot ? 'bg-slate-900/20' : ''}`}>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400 align-middle text-xs">
                    #{cat.orderIndex}
                  </td>
                  <td className="py-2.5 px-3 align-middle">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${isRoot ? 'bg-purple-950/80 border-purple-500/40 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        {isRoot ? <FolderTree className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white flex items-center gap-1 leading-snug">
                          {!isRoot && <span className="text-purple-400 font-bold shrink-0 text-xs">↳</span>}
                          <span className="truncate max-w-[180px] lg:max-w-[240px]" title={cat.name}>{cat.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">slug: <span className="text-purple-400 font-medium">{cat.slug}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2.5 whitespace-nowrap align-middle">
                    {isRoot ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-500/30 text-[11px] font-medium whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span>Nhánh Chính</span>
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 max-w-[145px]" title={`Thuộc: ${getParentName(cat.parentId)}`}>
                        <span className="text-purple-400 font-bold shrink-0">↳</span>
                        <span className="text-cyan-400 font-medium truncate">{getParentName(cat.parentId)}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap align-middle">
                    {getClassificationBadge(cat.deliveryClassification, cat.fulfillmentType)}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap align-middle">
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-white font-mono font-bold text-xs shadow-sm">
                      {cat.productCount || 0}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap align-middle">
                    {cat.status === 'active' ? (
                      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-medium text-[11px] whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Hoạt động</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-medium text-[11px] whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>Tạm ẩn</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap align-middle">
                    <div className="flex items-center justify-center gap-1">
                      {isRoot && (
                        <button
                          type="button"
                          onClick={() => handleOpenCreate(cat.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
                          title="Thêm nhánh phụ con"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal / Form Edit or Create */}
      {(isCreatingNew || editingCategory) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-purple-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-white text-sm">
                  {isCreatingNew ? 'THÊM MỚI CHUYÊN MỤC / PHÂN NHÁNH' : `CHỈNH SỬA: ${editingCategory?.name}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreatingNew(false); setEditingCategory(null); }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Tên Chuyên Mục (*):</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Bản Quyền Game Steam"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs mt-1 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">Đường Dẫn Slug (*):</label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="VD: steam_cdkey"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono text-xs mt-1 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Nhánh Cha (Root Parent):</label>
                  <select
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs mt-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">-- Tạo làm Nhánh Chính (Root) --</option>
                    {rootCategories
                      .filter(c => c.id !== editingCategory?.id)
                      .map(rc => (
                        <option key={rc.id} value={rc.id}>Nhánh cha: {rc.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">Phân Loại Giao Hàng & Đơn Hàng:</label>
                  <select
                    value={formData.deliveryClassification || 'key_game'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFormData({ 
                        ...formData, 
                        deliveryClassification: val,
                        fulfillmentType: val === 'account' ? 'automatic' : 'manual'
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-semibold text-xs mt-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="account">Đơn Tự Động: Tài Khoản (Account Instant Delivery)</option>
                    <option value="key_game">Đơn Thủ Công: Key Game Bản Quyền (CD-Key)</option>
                    <option value="gift_card">Đơn Thủ Công: Thẻ Quà Tặng (Gift Card Scan/Pin)</option>
                    <option value="topup_manual">Đơn Thủ Công: Nạp Game Trực Tiếp (Top Up UID)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Thứ Tự Sắp Xếp:</label>
                  <input
                    type="number"
                    value={formData.orderIndex || 1}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs mt-1 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">Icon Đại Diện:</label>
                  <select
                    value={formData.iconName || 'Gamepad2'}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs mt-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Gamepad2">Gamepad (Game)</option>
                    <option value="Gift">Gift (Thẻ Quà Tặng)</option>
                    <option value="Zap">Zap (Nạp Nhanh)</option>
                    <option value="Sparkles">Sparkles (AI/Tài Khoản)</option>
                    <option value="Cpu">Cpu (Phần Mềm)</option>
                    <option value="Film">Film (Streaming)</option>
                    <option value="Shield">Shield (Bảo Mật/VPN)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">Trạng Thái:</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs mt-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="active">Hiển thị (Active)</option>
                    <option value="hidden">Tạm ẩn (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Mô Tả Chuyên Mục:</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về sản phẩm thuộc danh mục này..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs mt-1 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingCategory(null); }}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer text-xs transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg text-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreatingNew ? 'Tạo Chuyên Mục' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
