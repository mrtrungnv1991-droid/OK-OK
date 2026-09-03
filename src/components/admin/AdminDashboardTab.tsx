import React from 'react';
import { 
  HardDrive, 
  Database, 
  TrendingUp, 
  Lock, 
  Users, 
  Server, 
  CreditCard, 
  Flame 
} from 'lucide-react';
import { Product, UserOrder, MemberUser, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminDashboardTabProps {
  products: Product[];
  orders: UserOrder[];
  members: MemberUser[];
  currency: CurrencyCode;
  totalGMV: number;
  totalEscrowLocked: number;
  totalUserBalance: number;
  onNavigateToTab: (tabName: any) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  products,
  orders,
  members,
  currency,
  totalGMV,
  totalEscrowLocked,
  totalUserBalance,
  onNavigateToTab
}) => {
  return (
    <div className="space-y-6">
      {/* System Architecture Telemetry Strip */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                <span className="font-sans font-bold text-slate-100">Dashboard</span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase font-mono font-medium">
                  v7.4.2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Xác thực toàn vẹn 18.7K Files • 388 PHP Core • 64 Database Tables • 121 Games (1.702 Tiers)
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('database_schema')}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Xem 64 Bảng SQL</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Tổng Files Mã Nguồn</div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">~18.700 Files</div>
            <div className="text-[9px] text-slate-400 truncate">9K SVG • 3.6K JS • 2.4K PNG</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Backend Handlers</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">388 File PHP</div>
            <div className="text-[9px] text-slate-400 truncate">Router / AJAX / Libs / Cron</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Cơ Sở Dữ Liệu</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">64 Database Tables</div>
            <div className="text-[9px] text-slate-400 truncate">InnoDB • UTF8MB4 Clean</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Kho Game & Gói Nạp</div>
            <div className="text-sm font-bold text-purple-300 mt-0.5">121 Games / 1.702 Tiers</div>
            <div className="text-[9px] text-slate-400 truncate">Midasbuy & TheSieuRe Sync</div>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5 mb-2">
            <span className="text-xs font-medium text-slate-300 leading-normal">Tổng GMV Giao Dịch</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <TrendingUp className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-cyan-300 tracking-tight leading-tight">
              {formatCurrency(totalGMV, currency)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              +24.5% tăng trưởng
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5 mb-2">
            <span className="text-xs font-medium text-slate-300 leading-normal">Tiền Tạm Giữ Escrow</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-amber-300 tracking-tight leading-tight">
              {formatCurrency(totalEscrowLocked, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 inline-block"></span>
              Bảo lãnh trung gian 100%
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5 mb-2">
            <span className="text-xs font-medium text-slate-300 leading-normal">Tổng Số Dư Thành Viên</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-blue-300 tracking-tight leading-tight">
              {formatCurrency(totalUserBalance, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80 inline-block"></span>
              {members.length} tài khoản thành viên
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5 mb-2">
            <span className="text-xs font-medium text-slate-300 leading-normal">Số Dư API Kho Suppliers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Server className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-purple-300 tracking-tight leading-tight">
              {formatCurrency(153000000, currency)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Midasbuy / TheSieuRe Sync
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Ratio & Weekly Activity Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Deposit Channels Breakdown */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>TỶ LỆ NẠP TIỀN QUA CÁC CỔNG THANH TOÁN</span>
            </h4>
            <span className="text-[10px] text-emerald-400">Hôm nay</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">VietQR Ngân Hàng Tự Động (MB, VCB)</span>
                <span className="text-cyan-400 font-bold">62% (88,500,000đ)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Thẻ Cào Viễn Thông (TheSieuRe API)</span>
                <span className="text-amber-400 font-bold">24% (34,280,000đ)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Ví Điện Tử MoMo / ZaloPay</span>
                <span className="text-pink-400 font-bold">9% (12,850,000đ)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full" style={{ width: '9%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Crypto USDT (TRC20 / BEP20)</span>
                <span className="text-purple-400 font-bold">5% (7,220,000đ)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400 shrink-0" />
            <span>TOP SẢN PHẨM BÁN CHẠY NHẤT</span>
          </h4>

          <div className="space-y-2">
            {products.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 text-[10px] font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-slate-200 font-bold truncate max-w-[180px]">{p.title}</span>
                </div>
                <div className="text-right">
                  <div className="text-cyan-300 font-bold">{formatCurrency(p.groupPrice, currency)}</div>
                  <div className="text-[10px] text-slate-500">Còn lại: {p.stockAvailable} key</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Order Streams in ADCP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200">NHẬT KÝ ĐƠN HÀNG TOÀN SÀN</h4>
          <span className="text-[11px] text-cyan-400">Live Telemetry Stream</span>
        </div>

        <div className="space-y-2">
          {orders.slice(0, 5).map(ord => (
            <div key={ord.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px]">
                  {ord.type}
                </span>
                <div>
                  <span className="text-white font-bold">{ord.productTitle}</span>
                  <span className="text-slate-500 text-[11px] ml-2">• {ord.txId}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-cyan-400">{formatCurrency(ord.pricePaid, currency)}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 uppercase">
                  {ord.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
