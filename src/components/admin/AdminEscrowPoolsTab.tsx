import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ArrowRight, 
  Users, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  Layers, 
  Send, 
  Download, 
  ExternalLink,
  Zap,
  Sparkles,
  Search,
  Eye,
  Info
} from 'lucide-react';
import { Product, GroupPool, UserOrder, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminEscrowPoolsTabProps {
  products: Product[];
  orders: UserOrder[];
  currency: CurrencyCode;
  onForceEscrowAction: (orderId: string, action: 'release' | 'refund') => void;
  onUpdatePoolStatus?: (poolId: string, newStatus: GroupPool['status']) => void;
}

export const AdminEscrowPoolsTab: React.FC<AdminEscrowPoolsTabProps> = ({
  products,
  orders,
  currency,
  onForceEscrowAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filling' | 'completed' | 'full'>('all');
  const [selectedPoolDetail, setSelectedPoolDetail] = useState<{ product: Product; pool: GroupPool } | null>(null);

  // Aggregate all pools from products
  const allPools = products.flatMap(prod => 
    (prod.activePools || []).map(pool => ({
      product: prod,
      pool: pool
    }))
  );

  const filteredPools = allPools.filter(item => {
    const matchSearch = item.pool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.pool.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'all') return true;
    return item.pool.status === statusFilter;
  });

  const totalLockedFunds = allPools.reduce((sum, item) => {
    return sum + (item.pool.filledSlots * item.pool.pricePerSlot);
  }, 0);

  const totalTargetSlots = allPools.reduce((sum, item) => sum + item.pool.targetSlots, 0);
  const totalFilledSlots = allPools.reduce((sum, item) => sum + item.pool.filledSlots, 0);

  return (
    <div className="space-y-5 text-slate-200">
      {/* Header Banner with Input & Output Flow Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c1424] via-[#0f1b33] to-[#0c1424] border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>QUẢN TRỊ GOM ĐƠN MUA CHUNG // ESCROW VAULT ENGINE</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  INPUT & OUTPUT TRANSPARENT
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kiểm soát luồng dữ liệu Đầu Vào (Input: Kho Key, Giá Sỉ, Slots) & Đầu Ra (Output: Bung Mã Vào Ví, Giải Ngân Seller / Hoàn Tiền 100%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Escrow Bảo Lãnh</span>
            </span>
          </div>
        </div>

        {/* 3-Step Input -> Processing -> Output Flow Pipeline Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* STEP 1: INPUT */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] flex items-center justify-center font-black">1</span>
                <span>INPUT // ĐẦU VÀO GOM ĐƠN</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300">Thiết lập</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>Mã sản phẩm / Dịch vụ sỉ gom chung</li>
              <li>Số slot yêu cầu (Target Slots)</li>
              <li>Giá sỉ chiết khấu & Giá bán lẻ</li>
              <li>Kho key đầu vào (Nạp sẵn vào Escrow)</li>
            </ul>
          </div>

          {/* STEP 2: ESCROW LOCK & PARTICIPATION */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] flex items-center justify-center font-black">2</span>
                <span>ESCROW // KHÓA CỌC AN TOÀN</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300">Đang giữ tiền</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>Thành viên đặt cọc giữ slot</li>
              <li>Tiền cọc khóa tại ví trung gian Escrow</li>
              <li>Đếm ngược thời gian gom đơn</li>
              <li>Người bán không thể rút trước</li>
            </ul>
          </div>

          {/* STEP 3: OUTPUT */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] flex items-center justify-center font-black">3</span>
                <span>OUTPUT // ĐẦU RA KHI HOÀN TẤT</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">Tự động 100%</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li><strong className="text-emerald-300">Đủ Slot:</strong> Tự động bung key vào kho cá nhân của từng thành viên</li>
              <li><strong className="text-emerald-300">Seller:</strong> Nhận tiền thanh toán đã cấn trừ phí</li>
              <li><strong className="text-rose-300">Hủy/Hết hạn:</strong> Hoàn 100% tiền ví tức thì</li>
            </ul>
          </div>
        </div>

        {/* Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Tổng Nhóm Gom</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">{allPools.length} Nhóm</div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Tiền Đang Khóa Escrow</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">{formatCurrency(totalLockedFunds, currency)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Tiến Độ Gom Slots</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{totalFilledSlots} / {totalTargetSlots} Slots</div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Tỷ Lệ Thành Công</div>
            <div className="text-base font-bold text-purple-400 mt-0.5">99.4%</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'filling', 'full', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {status === 'all' && 'Tất Cả Nhóm Gom'}
              {status === 'filling' && '⏳ Đang Gom (Filling)'}
              {status === 'full' && '🔒 Đã Đủ Slot (Locked)'}
              {status === 'completed' && '✅ Đã Bung Key (Dispatched)'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên nhóm / sản phẩm / mã..."
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white w-full sm:w-64 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Pools List with Explicit Input & Output breakdown */}
      <div className="space-y-3">
        {filteredPools.map(({ product, pool }) => {
          const percent = Math.min(100, Math.round((pool.filledSlots / pool.targetSlots) * 100));
          const isFull = pool.filledSlots >= pool.targetSlots;

          return (
            <div
              key={pool.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-3"
            >
              {/* Pool Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={product.bannerImg}
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{pool.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        ID: {pool.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFull 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40 animate-pulse'
                      }`}>
                        {isFull ? 'ĐÃ ĐỦ SLOT // CHỜ BUNG' : `ĐANG GOM (${pool.filledSlots}/${pool.targetSlots})`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sản phẩm gốc: <strong className="text-cyan-300">{product.title}</strong> • Host: <span className="text-slate-300">{pool.hostName || 'Hệ thống'}</span> • Hết hạn: <span className="text-amber-300">{pool.expiresAt}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => setSelectedPoolDetail({ product, pool })}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Chi Tiết I/O</span>
                  </button>
                </div>
              </div>

              {/* Explicit INPUT & OUTPUT Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Left Card: INPUT SPECIFICATION */}
                <div className="p-3 rounded-lg bg-black/40 border border-cyan-950/60 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>INPUT (THIẾT LẬP ĐẦU VÀO)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Giá Bán Lẻ:</span>
                      <span className="text-slate-300 font-bold line-through">{formatCurrency(pool.retailPrice, currency)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Giá Gom Sỉ / Slot:</span>
                      <span className="text-cyan-400 font-bold">{formatCurrency(pool.pricePerSlot, currency)} (-{pool.savingsPercent}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Số Slot Gom Yêu Cầu:</span>
                      <span className="text-white font-bold">{pool.targetSlots} Thành viên</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Kho Key Đã Nạp Sẵn:</span>
                      <span className="text-emerald-400 font-bold">{pool.keysVault?.length || pool.targetSlots} Keys trong Vault</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: OUTPUT SPECIFICATION */}
                <div className="p-3 rounded-lg bg-black/40 border border-emerald-950/60 space-y-2">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OUTPUT (KẾT QUẢ ĐẦU RA DỰ KIẾN)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Tiền Cọc Đang Giữ:</span>
                      <span className="text-amber-400 font-bold">{formatCurrency(pool.filledSlots * pool.pricePerSlot, currency)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Doanh Thu Seller:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(Math.round(pool.targetSlots * pool.pricePerSlot * 0.95), currency)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Quy Trình Giao Key:</span>
                      <span className="text-cyan-300 font-bold">Bung tự động vào ví Key</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Cam Kết Hoàn Tiền:</span>
                      <span className="text-emerald-300 font-bold">100% Hoàn ví nếu hủy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Participant Badges */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tiến độ slot: <strong className="text-white">{pool.filledSlots}</strong> / {pool.targetSlots} người ({percent}%)</span>
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    Cần thêm {Math.max(0, pool.targetSlots - pool.filledSlots)} slot nữa
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isFull
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Participant avatars */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Thành viên đã đặt cọc:</span>
                  {pool.participants?.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px]">
                      <img src={p.avatar} alt={p.name} className="w-3.5 h-3.5 rounded-full" />
                      <span className="text-slate-300 font-medium">{p.name}</span>
                      <span className="text-cyan-400 font-bold">Slot #{p.slotNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPools.length === 0 && (
          <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-400 space-y-2">
            <Info className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">Không tìm thấy nhóm gom đơn nào phù hợp với bộ lọc.</p>
          </div>
        )}
      </div>

      {/* Detail Modal for Selected Pool I/O */}
      {selectedPoolDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyan-500/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase">{selectedPoolDetail.pool.title}</h4>
                  <p className="text-xs text-slate-400">Kiểm tra chi tiết luồng dữ liệu Input & Output hợp đồng Escrow</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoolDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Input & Output Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2.5 text-xs">
                <h5 className="font-bold text-cyan-400 text-xs uppercase flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" /> THÔNG SỐ ĐẦU VÀO (INPUT)
                </h5>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sản phẩm:</span>
                    <span className="font-bold text-white">{selectedPoolDetail.product.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giá gốc thị trường:</span>
                    <span className="line-through">{formatCurrency(selectedPoolDetail.pool.retailPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giá gom sỉ mỗi người:</span>
                    <span className="text-cyan-400 font-bold">{formatCurrency(selectedPoolDetail.pool.pricePerSlot, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số lượng người cần:</span>
                    <span className="font-bold text-white">{selectedPoolDetail.pool.targetSlots} Slots</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời hạn gom:</span>
                    <span className="text-amber-400 font-bold">{selectedPoolDetail.pool.expiresAt}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2.5 text-xs">
                <h5 className="font-bold text-emerald-400 text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> KẾT QUẢ ĐẦU RA (OUTPUT)
                </h5>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bàn giao Key:</span>
                    <span className="text-emerald-400 font-bold">Tự động bung vào Kho Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hóa đơn điện tử:</span>
                    <span className="text-cyan-300 font-bold">Mã ORDER-POOL-{selectedPoolDetail.pool.id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giải ngân Seller:</span>
                    <span className="text-white font-bold">{formatCurrency(selectedPoolDetail.pool.targetSlots * selectedPoolDetail.pool.pricePerSlot, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bảo lãnh Escrow:</span>
                    <span className="text-emerald-300 font-bold">100% Hoàn tiền nếu thiếu người</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keys in Vault */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                <span>DANH SÁCH MÃ KEY TRONG ESCROW VAULT:</span>
                <span className="text-emerald-400 text-[11px] font-mono">Sẵn sàng giao tự động</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                {selectedPoolDetail.pool.keysVault?.map((k, idx) => (
                  <div key={k.id || idx} className="p-1.5 rounded bg-black/60 border border-slate-800 flex items-center justify-between text-slate-300">
                    <span>Key #{idx + 1}: <code className="text-cyan-300">{k.code}</code></span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                      k.status === 'reserved' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {k.status === 'reserved' ? 'Đã gán Slot' : 'Khả dụng'}
                    </span>
                  </div>
                )) || (
                  <div className="text-slate-500 text-xs">Mã key mẫu tự động gán theo số slot người mua.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPoolDetail(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
