import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Minus, 
  X, 
  DollarSign 
} from 'lucide-react';
import { MemberUser, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminMembersTabProps {
  members: MemberUser[];
  currency: CurrencyCode;
  onUpdateMemberRole: (memberId: string, newRole: MemberUser['role']) => void;
  onToggleMemberStatus: (memberId: string) => void;
  onAdjustMemberBalance: (memberId: string, amount: number, reason: string) => void;
}

export const AdminMembersTab: React.FC<AdminMembersTabProps> = ({
  members,
  currency,
  onUpdateMemberRole,
  onToggleMemberStatus,
  onAdjustMemberBalance
}) => {
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedMemberForBalance, setSelectedMemberForBalance] = useState<MemberUser | null>(null);
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'subtract'>('add');
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState(100000);
  const [balanceAdjustReason, setBalanceAdjustReason] = useState('Nạp tiền đối soát / Khuyến mãi');

  const handleConfirmAdjustBalance = () => {
    if (!selectedMemberForBalance || balanceAdjustAmount <= 0) return;
    const finalAmount = balanceAdjustType === 'add' ? balanceAdjustAmount : -balanceAdjustAmount;
    onAdjustMemberBalance(selectedMemberForBalance.id, finalAmount, balanceAdjustReason);
    setSelectedMemberForBalance(null);
  };

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>QUẢN LÝ THÀNH VIÊN & SỐ DƯ VÍ ({members.length} TÀI KHOẢN)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Tra cứu tài khoản, thay đổi cấp bậc CTV, cộng/trừ số dư và khóa tài khoản vi phạm
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={memberSearchTerm}
            onChange={(e) => setMemberSearchTerm(e.target.value)}
            placeholder="Tìm theo user, email, ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Adjust Balance Drawer/Card */}
      {selectedMemberForBalance && (
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">
                ĐIỀU CHỈNH SỐ DƯ VÍ CHO: <span className="text-cyan-400">{selectedMemberForBalance.username}</span>
              </span>
            </div>
            <button
              onClick={() => setSelectedMemberForBalance(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-300">Loại thao tác:</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setBalanceAdjustType('add')}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    balanceAdjustType === 'add'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Cộng Tiền
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAdjustType('subtract')}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    balanceAdjustType === 'subtract'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Trừ Tiền
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-300">Số tiền (VNĐ):</label>
              <input
                type="number"
                value={balanceAdjustAmount}
                onChange={(e) => setBalanceAdjustAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300">Lý do giao dịch:</label>
              <input
                type="text"
                value={balanceAdjustReason}
                onChange={(e) => setBalanceAdjustReason(e.target.value)}
                placeholder="Lý do..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedMemberForBalance(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmAdjustBalance}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold cursor-pointer text-xs"
            >
              Xác Nhận Thay Đổi Số Dư
            </button>
          </div>
        </div>
      )}

      {/* Member Table List */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 uppercase">
              <th className="p-3">Thành Viên</th>
              <th className="p-3">Cấp Bậc</th>
              <th className="p-3">Số Dư Ví</th>
              <th className="p-3">Tổng Nạp</th>
              <th className="p-3">Trạng Thái</th>
              <th className="p-3 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredMembers.map(m => (
              <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-3">
                  <div className="font-bold text-white text-xs">{m.username}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{m.email} • {m.id}</div>
                </td>
                <td className="p-3">
                  <select
                    value={m.role}
                    onChange={(e) => onUpdateMemberRole(m.id, e.target.value as MemberUser['role'])}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-cyan-300 focus:outline-none"
                  >
                    <option value="member">Thành Viên Thường</option>
                    <option value="ctv_silver">Đại Lý Bạc (2%)</option>
                    <option value="ctv_gold">Đại Lý Vàng (5%)</option>
                    <option value="ctv_diamond">Đại Lý Kim Cương (8%)</option>
                    <option value="admin">Root Admin</option>
                  </select>
                </td>
                <td className="p-3 font-bold text-emerald-400 text-xs font-mono">
                  {formatCurrency(m.walletBalance, currency)}
                </td>
                <td className="p-3 text-slate-300 text-xs font-mono">
                  {formatCurrency(m.totalDeposited, currency)}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}>
                    {m.status === 'active' ? 'Hoạt Động' : 'Bị Khóa'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => setSelectedMemberForBalance(m)}
                    className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold cursor-pointer"
                  >
                    ± Tiền Ví
                  </button>
                  <button
                    onClick={() => onToggleMemberStatus(m.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      m.status === 'active'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {m.status === 'active' ? 'Khóa' : 'Mở Khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
