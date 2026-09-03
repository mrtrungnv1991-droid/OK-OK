import React, { useState } from 'react';
import { 
  Tag, 
  Sparkles, 
  Gift, 
  Percent, 
  PlusCircle, 
  Trash2, 
  Check, 
  Clock, 
  Sliders, 
  Save, 
  HelpCircle,
  Zap,
  Play,
  RotateCw,
  Coins,
  CheckCircle2,
  XCircle,
  TrendingDown,
  CreditCard,
  Flame,
  Plus
} from 'lucide-react';
import { VoucherCoupon, WheelPrize, SystemConfig, DepositPromotionRule, Currency, Product } from '../../types';
import { INITIAL_VOUCHERS, INITIAL_WHEEL_PRIZES } from '../../data/systemAdminData';
import { INITIAL_DEPOSIT_PROMOTIONS } from '../../data/systemExtendedData';
import { INITIAL_PRODUCTS } from '../../data/mockProducts';
import { formatCurrency } from '../../utils/formatters';

interface AdminPromotionsTabProps {
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (newConfig: Partial<SystemConfig>) => void;
  currency?: Currency;
  products?: Product[];
  onToggleFlashSale?: (productId: string, discountPercent?: number, isFlashSale?: boolean) => void;
}

export const AdminPromotionsTab: React.FC<AdminPromotionsTabProps> = ({
  systemConfig = {} as SystemConfig,
  onUpdateSystemConfig = (_cfg?: Partial<SystemConfig>) => {},
  currency = 'VND',
  products,
  onToggleFlashSale
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vouchers' | 'product_discounts' | 'deposit_promotions' | 'lucky_wheel'>('vouchers');
  const [vouchers, setVouchers] = useState<VoucherCoupon[]>(INITIAL_VOUCHERS);
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrize[]>(INITIAL_WHEEL_PRIZES);
  const [depositPromotions, setDepositPromotions] = useState<DepositPromotionRule[]>(
    systemConfig?.depositPromotions || INITIAL_DEPOSIT_PROMOTIONS
  );
  const [localProductsList, setLocalProductsList] = useState<Product[]>(products || INITIAL_PRODUCTS);
  const productsList = products || localProductsList;
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [isAddingDepositPromo, setIsAddingDepositPromo] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Lucky wheel config
  const [wheelActive, setWheelActive] = useState(systemConfig?.luckyWheelActive !== false);
  const [wheelCost, setWheelCost] = useState(systemConfig?.luckyWheelCost || 15000);

  // New Voucher form
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 50000,
    usageLimit: 100,
    expiresAt: '2026-12-31',
    status: 'active' as 'active' | 'expired' | 'disabled'
  });

  // New Deposit Promo form
  const [newDepositPromo, setNewDepositPromo] = useState<Partial<DepositPromotionRule>>({
    title: '',
    minDepositAmount: 500000,
    bonusPercent: 10,
    badge: 'Thưởng +10%',
    status: 'active',
    isFirstDepositOnly: false
  });

  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) return;
    const item: VoucherCoupon = {
      id: `vouch-${Date.now()}`,
      code: newVoucher.code.trim().toUpperCase(),
      discountType: newVoucher.discountType,
      discountValue: newVoucher.discountValue,
      minOrderValue: newVoucher.minOrderValue,
      maxDiscount: newVoucher.maxDiscount,
      usageLimit: newVoucher.usageLimit,
      usedCount: 0,
      expiresAt: newVoucher.expiresAt,
      status: 'active'
    };
    setVouchers([item, ...vouchers]);
    setIsAddingVoucher(false);
    setNewVoucher({
      code: '',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 100000,
      maxDiscount: 50000,
      usageLimit: 100,
      expiresAt: '2026-12-31',
      status: 'active'
    });
    setSaveNotice('Đã tạo mã giảm giá mới thành công!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleAddDepositPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepositPromo.title?.trim()) return;
    const newItem: DepositPromotionRule = {
      id: `dep-promo-${Date.now()}`,
      title: newDepositPromo.title.trim(),
      minDepositAmount: Number(newDepositPromo.minDepositAmount) || 100000,
      bonusPercent: Number(newDepositPromo.bonusPercent) || 5,
      badge: newDepositPromo.badge || `Thưởng +${newDepositPromo.bonusPercent}%`,
      status: 'active',
      isFirstDepositOnly: !!newDepositPromo.isFirstDepositOnly
    };

    const updated = [newItem, ...depositPromotions];
    setDepositPromotions(updated);
    onUpdateSystemConfig({ depositPromotions: updated });
    setIsAddingDepositPromo(false);
    setNewDepositPromo({
      title: '',
      minDepositAmount: 500000,
      bonusPercent: 10,
      badge: 'Thưởng +10%',
      status: 'active',
      isFirstDepositOnly: false
    });
    setSaveNotice('Đã tạo quy tắc khuyến mãi nạp tiền mới!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleUpdateProductDiscount = (prodId: string, discountPct: number) => {
    if (onToggleFlashSale) {
      onToggleFlashSale(prodId, discountPct, discountPct > 0);
    } else {
      setLocalProductsList(localProductsList.map(p => {
        if (p.id === prodId) {
          return {
            ...p,
            isFlashSale: discountPct > 0,
            discountPercent: discountPct,
            retailPrice: p.originalPrice ? Math.round(p.originalPrice * (1 - discountPct / 100)) : p.retailPrice
          };
        }
        return p;
      }));
    }
    setSaveNotice(`Đã cập nhật mức giảm ${discountPct}% cho sản phẩm!`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSaveWheelConfig = () => {
    onUpdateSystemConfig({
      luckyWheelActive: wheelActive,
      luckyWheelCost: wheelCost
    });
    setSaveNotice('Đã lưu cấu hình Vòng Quay May Mắn!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handlePrizeChange = (id: string, field: keyof WheelPrize, value: any) => {
    setWheelPrizes(wheelPrizes.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Percent className="w-4 h-4 text-pink-400" />
            <span>QUẢN LÝ KHUYẾN MÃI, GIẢM GIÁ SẢN PHẨM & MINIGAME</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-pink-950 text-pink-300 border border-pink-500/30">
              Promotions Hub
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Cấu hình mã giảm giá (Coupon), Giảm % trực tiếp theo từng sản phẩm, Thưởng nạp tiền tự động và Vòng quay may mắn.
          </p>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-pink-950/80 border border-pink-500/40 text-pink-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-pink-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setActiveSubTab('vouchers')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            activeSubTab === 'vouchers'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Mã Giảm Giá Voucher ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('product_discounts')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            activeSubTab === 'product_discounts'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Giảm Giá Sản Phẩm Riêng (% Discount)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('deposit_promotions')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            activeSubTab === 'deposit_promotions'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Khuyến Mãi Nạp Tiền (+% Thưởng)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lucky_wheel')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            activeSubTab === 'lucky_wheel'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Vòng Quay May Mắn (8 Ô Giải)</span>
        </button>
      </div>

      {/* SUBTAB 1: VOUCHERS */}
      {activeSubTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white text-xs">DANH SÁCH MÃ GIẢM GIÁ ĐANG ÁP DỤNG</h4>
            <button
              onClick={() => setIsAddingVoucher(!isAddingVoucher)}
              className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tạo Mã Voucher</span>
            </button>
          </div>

          {/* Create Form */}
          {isAddingVoucher && (
            <form onSubmit={handleAddVoucher} className="p-4 rounded-xl bg-slate-900/80 border border-pink-500/40 space-y-3">
              <h5 className="font-bold text-pink-300 text-xs">THÔNG TIN MÃ COUPON MỚI</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Mã Code (*):</label>
                  <input
                    type="text"
                    required
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                    placeholder="VD: CYBER2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase font-bold text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Loại Giảm Giá:</label>
                  <select
                    value={newVoucher.discountType}
                    onChange={(e) => setNewVoucher({ ...newVoucher, discountType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  >
                    <option value="percent">Theo Phần Trăm (%)</option>
                    <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Giá Trị Giảm (*):</label>
                  <input
                    type="number"
                    required
                    value={newVoucher.discountValue}
                    onChange={(e) => setNewVoucher({ ...newVoucher, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Đơn Hàng Tối Thiểu:</label>
                  <input
                    type="number"
                    value={newVoucher.minOrderValue}
                    onChange={(e) => setNewVoucher({ ...newVoucher, minOrderValue: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Giới Hạn Lượt Sử Dụng:</label>
                  <input
                    type="number"
                    value={newVoucher.usageLimit}
                    onChange={(e) => setNewVoucher({ ...newVoucher, usageLimit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Ngày Hết Hạn:</label>
                  <input
                    type="date"
                    value={newVoucher.expiresAt}
                    onChange={(e) => setNewVoucher({ ...newVoucher, expiresAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingVoucher(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold"
                >
                  Lưu Voucher
                </button>
              </div>
            </form>
          )}

          {/* Vouchers Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Mã Code</th>
                  <th className="p-3">Mức Giảm Giá</th>
                  <th className="p-3">Đơn Tối Thiểu</th>
                  <th className="p-3">Đã Dùng / Giới Hạn</th>
                  <th className="p-3">Hạn Dùng</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-pink-400">
                      {v.code}
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      {v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${formatCurrency(v.discountValue, currency)}`}
                    </td>
                    <td className="p-3 text-slate-300">
                      {formatCurrency(v.minOrderValue, currency)}
                    </td>
                    <td className="p-3">
                      <span className="text-white font-bold">{v.usedCount}</span> / <span className="text-slate-500">{v.usageLimit}</span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {v.expiresAt}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.status === 'active' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {v.status === 'active' ? 'Đang Hoạt Động' : 'Đã Hết Hạn'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setVouchers(vouchers.filter(item => item.id !== v.id))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRODUCT DISCOUNTS */}
      {activeSubTab === 'product_discounts' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            💡 Thiết lập % giảm giá riêng cho từng sản phẩm. Sản phẩm có % giảm giá sẽ tự động hiển thị huy hiệu Flash Sale và gạch giá gốc ngoài trang chủ.
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Sản Phẩm</th>
                  <th className="p-3">Nền Tảng</th>
                  <th className="p-3">Giá Bán Hiện Tại</th>
                  <th className="p-3">Cài Đặt % Giảm Giá Riêng</th>
                  <th className="p-3">Huy Hiệu Hiển Thị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {productsList.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">
                      {prod.title}
                    </td>

                    <td className="p-3 text-cyan-400 font-bold">
                      {prod.platform}
                    </td>

                    <td className="p-3 font-bold text-emerald-400">
                      {formatCurrency(prod.retailPrice, currency)}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={90}
                          defaultValue={prod.discountPercent || 0}
                          onBlur={(e) => handleUpdateProductDiscount(prod.id, Number(e.target.value))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                        />
                        <span className="text-pink-400 font-bold">% OFF</span>
                      </div>
                    </td>

                    <td className="p-3">
                      {(prod.discountPercent || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3 text-rose-400" />
                          <span>GIẢM -{prod.discountPercent}%</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Giá gốc</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DEPOSIT PROMOTIONS */}
      {activeSubTab === 'deposit_promotions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white text-xs">CÁC MỐC KHUYẾN MÃI NẠP TIỀN TỰ ĐỘNG (+% THƯỞNG)</h4>
            <button
              onClick={() => setIsAddingDepositPromo(!isAddingDepositPromo)}
              className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Mốc Thưởng Nạp</span>
            </button>
          </div>

          {/* Add Promo Form */}
          {isAddingDepositPromo && (
            <form onSubmit={handleAddDepositPromo} className="p-4 rounded-xl bg-slate-900/80 border border-pink-500/40 space-y-3">
              <h5 className="font-bold text-pink-300 text-xs">THÊM MỐC THƯỞNG NẠP MỚI</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Tên Khuyến Mãi (*):</label>
                  <input
                    type="text"
                    required
                    value={newDepositPromo.title}
                    onChange={(e) => setNewDepositPromo({ ...newDepositPromo, title: e.target.value })}
                    placeholder="VD: Nạp từ 500k thưởng 10%"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Mốc Nạp Tối Thiểu (VNĐ):</label>
                  <input
                    type="number"
                    required
                    value={newDepositPromo.minDepositAmount}
                    onChange={(e) => setNewDepositPromo({ ...newDepositPromo, minDepositAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold">% Thưởng Thêm:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={newDepositPromo.bonusPercent}
                    onChange={(e) => setNewDepositPromo({ ...newDepositPromo, bonusPercent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFirstOnly"
                  checked={newDepositPromo.isFirstDepositOnly || false}
                  onChange={(e) => setNewDepositPromo({ ...newDepositPromo, isFirstDepositOnly: e.target.checked })}
                  className="w-4 h-4 accent-pink-500 cursor-pointer"
                />
                <label htmlFor="isFirstOnly" className="text-slate-300 text-xs font-bold cursor-pointer">
                  Chỉ áp dụng cho lần nạp đầu tiên của tài khoản mới
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDepositPromo(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold"
                >
                  Lưu Quy Tắc Thưởng
                </button>
              </div>
            </form>
          )}

          {/* Promo Rules Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Tên Khuyến Mãi</th>
                  <th className="p-3">Mốc Nạp Tối Thiểu</th>
                  <th className="p-3">% Thưởng Thêm</th>
                  <th className="p-3">Huy Hiệu Hiển Thị</th>
                  <th className="p-3">Loại Áp Dụng</th>
                  <th className="p-3 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {depositPromotions.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">
                      {rule.title}
                    </td>

                    <td className="p-3 font-bold text-cyan-300">
                      {formatCurrency(rule.minDepositAmount, currency)}
                    </td>

                    <td className="p-3 font-bold text-emerald-400 text-sm">
                      +{rule.bonusPercent}%
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30 font-bold text-[10px]">
                        {rule.badge}
                      </span>
                    </td>

                    <td className="p-3">
                      {rule.isFirstDepositOnly ? (
                        <span className="text-amber-400 font-bold">Chỉ Lần Nạp Đầu</span>
                      ) : (
                        <span className="text-slate-400">Mọi Lần Nạp</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const updated = depositPromotions.filter(r => r.id !== rule.id);
                          setDepositPromotions(updated);
                          onUpdateSystemConfig({ depositPromotions: updated });
                        }}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: LUCKY WHEEL */}
      {activeSubTab === 'lucky_wheel' && (
        <div className="space-y-4">
          {/* Main Toggle & Price */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-pink-400">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">VÒNG QUAY MAY MẮN (LUCKY WHEEL MINIGAME)</h4>
                <div className="text-[11px] text-slate-400 font-sans">
                  Thu hút khách hàng nạp tiền quay thưởng trúng Voucher, Số Dư Ví và Thẻ Quà Tặng.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Giá mỗi lượt quay:</span>
                <input
                  type="number"
                  value={wheelCost}
                  onChange={(e) => setWheelCost(Number(e.target.value))}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                />
                <span className="text-slate-400">VNĐ</span>
              </div>

              <button
                onClick={handleSaveWheelConfig}
                className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
              </button>
            </div>
          </div>

          {/* 8 Prize Slots Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs">CẤU HÌNH 8 Ô GIẢI THƯỞNG VÀ TỶ LỆ TRÚNG (%)</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                    <th className="p-2.5">Ô Số</th>
                    <th className="p-2.5">Tên Phần Thưởng</th>
                    <th className="p-2.5">Loại Thưởng</th>
                    <th className="p-2.5">Giá Trị</th>
                    <th className="p-2.5">Tỷ Lệ Trúng (%)</th>
                    <th className="p-2.5">Màu Ô</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {wheelPrizes.map((prize, idx) => (
                    <tr key={prize.id}>
                      <td className="p-2.5 font-bold text-pink-400">#{idx + 1}</td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={prize.label}
                          onChange={(e) => handlePrizeChange(prize.id, 'label', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded p-1 text-white font-bold text-xs w-full"
                        />
                      </td>
                      <td className="p-2.5 text-cyan-300 font-bold capitalize">{prize.type}</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={prize.value}
                          onChange={(e) => handlePrizeChange(prize.id, 'value', Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 rounded p-1 text-white font-bold text-xs w-24"
                        />
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={prize.probability}
                            onChange={(e) => handlePrizeChange(prize.id, 'probability', Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded p-1 text-emerald-400 font-bold text-xs w-16 text-center"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded border border-slate-700" style={{ backgroundColor: prize.color }} />
                          <span className="text-[10px] text-slate-400">{prize.color}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
