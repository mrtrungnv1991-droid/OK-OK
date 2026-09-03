import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Key, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Copy, 
  Check, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  ExternalLink,
  Percent,
  Wallet
} from 'lucide-react';
import { CTVUser, CTVWithdrawal, CTVTier, Currency } from '../../types';
import { INITIAL_CTV_USERS, INITIAL_CTV_WITHDRAWALS, INITIAL_CTV_TIERS } from '../../data/systemExtendedData';
import { formatCurrency } from '../../utils/formatters';

interface AdminCTVResellerTabProps {
  currency?: Currency;
}

export const AdminCTVResellerTab: React.FC<AdminCTVResellerTabProps> = ({ currency = 'VND' }) => {
  const [subTab, setSubTab] = useState<'members' | 'tiers' | 'withdrawals' | 'child_domains' | 'api_docs'>('members');
  const [ctvUsers, setCTVUsers] = useState<CTVUser[]>(INITIAL_CTV_USERS);
  const [withdrawals, setWithdrawals] = useState<CTVWithdrawal[]>(INITIAL_CTV_WITHDRAWALS);
  const [tiers, setTiers] = useState<CTVTier[]>(INITIAL_CTV_TIERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApproveWithdrawal = (id: string) => {
    const updated = withdrawals.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: 'approved' as const,
          processedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
          note: 'Admin duyệt chi trả hoa hồng thành công'
        };
      }
      return w;
    });
    setWithdrawals(updated);
    setSaveNotice('Đã duyệt chi trả hoa hồng CTV thành công!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleRejectWithdrawal = (id: string) => {
    let reason = 'Thông tin thanh toán không chính xác hoặc vi phạm chính sách';
    try {
      const input = prompt('Nhập lý do từ chối rút tiền (hoặc bấm OK để dùng lý do mặc định):');
      if (input !== null && input.trim()) {
        reason = input.trim();
      }
    } catch {
      // Prompt blocked in iframe
    }

    const updated = withdrawals.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: 'rejected' as const,
          processedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
          note: reason
        };
      }
      return w;
    });
    setWithdrawals(updated);
    setSaveNotice('Đã từ chối yêu cầu rút tiền của CTV!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleUpdateTierDiscount = (tierId: string, newRate: number) => {
    setTiers(tiers.map(t => t.id === tierId ? { ...t, discountRate: newRate } : t));
    setSaveNotice('Đã cập nhật tỷ lệ chiết khấu cấp bậc CTV!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const totalCommissionPaid = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const totalPendingWithdrawal = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>CTV PANEL - HỆ THỐNG CỘNG TÁC VIÊN & TỔNG ĐẠI LÝ RESELLER</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Reseller Hub
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Quản lý cấp bậc chiết khấu (Cấp 1, Cấp 2, VIP Reseller), duyệt rút hoa hồng, kết nối API bán lại và quản lý site con.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
            Chờ rút: <span className="font-bold">{formatCurrency(totalPendingWithdrawal, currency)}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            Đã chi trả: <span className="font-bold">{formatCurrency(totalCommissionPaid, currency)}</span>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setSubTab('members')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'members'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Danh Sách CTV & Đại Lý ({ctvUsers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('withdrawals')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'withdrawals'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Duyệt Rút Hoa Hồng ({withdrawals.filter(w => w.status === 'pending').length} Chờ)</span>
        </button>

        <button
          onClick={() => setSubTab('tiers')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'tiers'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Cấu Hình 3 Cấp Bậc Chiết Khấu</span>
        </button>

        <button
          onClick={() => setSubTab('child_domains')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'child_domains'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Quản Lý Site Con (Child Sites)</span>
        </button>

        <button
          onClick={() => setSubTab('api_docs')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'api_docs'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Tài Liệu API Bán Lại Reseller</span>
        </button>
      </div>

      {/* SUBTAB 1: MEMBERS */}
      {subTab === 'members' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm CTV theo tên, username, số điện thoại, domain..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Tài Khoản / Tên CTV</th>
                  <th className="p-3">Cấp Bậc & Chiết Khấu</th>
                  <th className="p-3">Doanh Số Bán</th>
                  <th className="p-3">Số Dư Hoa Hồng</th>
                  <th className="p-3">API Reseller Key</th>
                  <th className="p-3">Site Con (Domain)</th>
                  <th className="p-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ctvUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{user.fullName}</div>
                      <div className="text-[10px] text-slate-400">@{user.username} | {user.phone}</div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        user.tier === 'ctv_vip_reseller'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : user.tier === 'ctv_level_2'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {user.tier === 'ctv_vip_reseller' ? 'Tổng Đại Lý VIP (-15%)' : user.tier === 'ctv_level_2' ? 'Đại Lý Cấp 2 (-10%)' : 'CTV Cấp 1 (-5%)'}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-slate-200">
                      {formatCurrency(user.totalSales, currency)}
                    </td>

                    <td className="p-3 font-bold text-emerald-400">
                      {formatCurrency(user.commissionBalance, currency)}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[120px]">
                          {user.apiKey.slice(0, 12)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(user.apiKey, user.id + '_key')}
                          className="text-slate-500 hover:text-white p-0.5"
                          title="Copy API Key"
                        >
                          {copiedKey === user.id + '_key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3">
                      {user.childDomain ? (
                        <div className="flex items-center gap-1 text-cyan-400 font-bold">
                          <span>{user.childDomain}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Chưa cấu hình</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kích Hoạt</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: WITHDRAWALS */}
      {subTab === 'withdrawals' && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Mã Yêu Cầu / Ngày</th>
                  <th className="p-3">Cộng Tác Viên</th>
                  <th className="p-3">Số Tiền Rút</th>
                  <th className="p-3">Thông Tin Ngân Hàng Nhận</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{w.id}</div>
                      <div className="text-[10px] text-slate-500">{w.createdAt}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-cyan-300">{w.ctvName}</div>
                    </td>

                    <td className="p-3 font-bold text-emerald-400 text-sm">
                      {formatCurrency(w.amount, currency)}
                    </td>

                    <td className="p-3">
                      <div className="text-slate-200 font-bold">{w.bankName}</div>
                      <div className="text-[10px] text-amber-300 font-mono">STK: {w.accountNumber} - {w.accountName}</div>
                    </td>

                    <td className="p-3">
                      {w.status === 'pending' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                          Chờ Kế Toán Duyệt
                        </span>
                      ) : w.status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                          Đã Chuyển Tiền
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                          Từ Chối
                        </span>
                      )}
                      {w.note && <div className="text-[10px] text-slate-500 mt-0.5">"{w.note}"</div>}
                    </td>

                    <td className="p-3 text-right">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer text-[10px]"
                          >
                            Duyệt Chuyển Tiền
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w.id)}
                            className="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/30 hover:bg-rose-900 cursor-pointer text-[10px]"
                          >
                            Từ Chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Đã xử lý lúc {w.processedAt}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TIERS */}
      {subTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: tier.color }} />
                  <span className="font-bold text-white text-sm">{tier.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                  Chiết khấu -{tier.discountRate}%
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doanh số tối thiểu:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(tier.minMonthlySales, currency)} / tháng</span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cấu hình % Chiết khấu giá sỉ:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={tier.discountRate}
                      onChange={(e) => handleUpdateTierDiscount(tier.id, Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                    />
                    <span className="text-slate-400 font-bold">% Giảm</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: CHILD DOMAINS */}
      {subTab === 'child_domains' && (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>HỆ THỐNG ĐẤU NỐI WEBSITE CON (CHILD SITES RESELLER)</span>
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Đại lý chỉ cần trỏ CNAME tên miền riêng về IP máy chủ: <code className="bg-slate-950 px-2 py-0.5 rounded text-cyan-300 font-mono">103.28.36.19</code> hoặc CNAME <code className="bg-slate-950 px-2 py-0.5 rounded text-cyan-300 font-mono">cname.cyberescrow.io</code>. Hệ thống sẽ tự động cấp SSL HTTPS và nhận diện thương hiệu riêng của đại lý.
          </p>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">Đại Lý Sở Hữu</th>
                  <th className="p-2.5">Tên Miền Riêng</th>
                  <th className="p-2.5">Trạng Thái DNS & SSL</th>
                  <th className="p-2.5">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ctvUsers.filter(u => u.childDomain).map(u => (
                  <tr key={u.id}>
                    <td className="p-2.5 font-bold text-white">{u.fullName}</td>
                    <td className="p-2.5 font-bold text-cyan-400">{u.childDomain}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.childDomainStatus === 'active' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {u.childDomainStatus === 'active' ? '✓ Đang Hoạt Động (SSL Valid)' : '⏳ Đang chờ xác minh DNS'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <button className="text-cyan-400 hover:underline cursor-pointer">Kiểm tra DNS</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: API DOCS */}
      {subTab === 'api_docs' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>TÀI LIỆU KẾT NỐI API BÁN LẠI TỰ ĐỘNG (RESELLER API ENDPOINTS)</span>
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Đại lý có thể tích hợp API trực tiếp vào bot Discord, Telegram hoặc website riêng để mua sản phẩm và nạp game tự động.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
              <span className="text-emerald-400 font-bold">GET</span> <span className="text-slate-300">/api/v1/reseller/products</span>
              <div className="text-[10px] text-slate-500 mt-1">Header: Authorization: Bearer &lt;RESELLER_API_KEY&gt; - Lấy danh sách sản phẩm và giá đại lý</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
              <span className="text-cyan-400 font-bold">POST</span> <span className="text-slate-300">/api/v1/reseller/buy-key</span>
              <div className="text-[10px] text-slate-500 mt-1">Body: &#123; "product_id": "prod-101", "quantity": 1 &#125; - Mua key và trả về ngay</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
              <span className="text-amber-400 font-bold">POST</span> <span className="text-slate-300">/api/v1/reseller/topup-order</span>
              <div className="text-[10px] text-slate-500 mt-1">Body: &#123; "game_id": "genshin", "tier_id": "tier-6480", "uid": "812938491", "server": "Asia" &#125;</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
