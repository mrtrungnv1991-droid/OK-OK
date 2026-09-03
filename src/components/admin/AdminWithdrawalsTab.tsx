import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  CreditCard, 
  Smartphone, 
  Coins, 
  FileText, 
  Plus, 
  Sliders,
  Send,
  Eye,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { CTVWithdrawal, Currency } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useUI } from '../../contexts/UIContext';

interface AdminWithdrawalsTabProps {
  withdrawals: CTVWithdrawal[];
  onApproveWithdrawal: (id: string, note?: string) => void;
  onRejectWithdrawal: (id: string, reason: string) => void;
  onCreateManualWithdrawal?: (newWd: Partial<CTVWithdrawal>) => void;
  currency?: Currency;
}

export const AdminWithdrawalsTab: React.FC<AdminWithdrawalsTabProps> = ({
  withdrawals,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onCreateManualWithdrawal,
  currency = 'VND'
}) => {
  const { showToast } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'affiliate_commission' | 'wallet_balance'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'bank' | 'momo' | 'usdt' | 'crypto_ltc' | 'binance_pay'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedWithdrawalForPay, setSelectedWithdrawalForPay] = useState<CTVWithdrawal | null>(null);
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<CTVWithdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState('Thông tin tài khoản ngân hàng thụ hưởng không chính xác');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual Payout Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    ctvName: '',
    amount: 500000,
    bankName: 'MB Bank',
    accountNumber: '',
    accountName: '',
    withdrawalType: 'affiliate_commission' as 'affiliate_commission' | 'wallet_balance',
    paymentMethod: 'bank' as 'bank' | 'momo' | 'usdt' | 'crypto_ltc' | 'binance_pay',
    note: 'Lệnh rút tiền thủ công tạo bởi Quản trị viên'
  });

  // Settings tab / policy
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'policy_settings'>('requests');
  const [policyConfig, setPolicyConfig] = useState({
    minWithdrawalVnd: 50000,
    maxDailyWithdrawalVnd: 50000000,
    autoApproveUnderVnd: 200000,
    withdrawalFeePercent: 0,
    processingTimeCommit: '5 - 15 Phút',
    allowCryptoUsdt: true
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = (id: string, note?: string) => {
    onApproveWithdrawal(id, note || 'Đã duyệt và chuyển khoản thành công qua ngân hàng');
    setSelectedWithdrawalForPay(null);
    setActionNotice(`✓ Đã duyệt chi trả thành công mã yêu cầu #${id}!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleConfirmReject = () => {
    if (!rejectingWithdrawal) return;
    onRejectWithdrawal(rejectingWithdrawal.id, rejectReason);
    setRejectingWithdrawal(null);
    setActionNotice(`✓ Đã từ chối lệnh #${rejectingWithdrawal.id} và hoàn trả số dư!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.ctvName || !manualForm.accountNumber || manualForm.amount <= 0) {
      showToast('Vui lòng điền đầy đủ tên, số tài khoản và số tiền hợp lệ!', 'warning', {
        title: 'THIẾU THÔNG TIN'
      });
      return;
    }

    if (onCreateManualWithdrawal) {
      onCreateManualWithdrawal({
        id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
        ctvId: `user-${Date.now().toString().slice(-4)}`,
        ctvName: manualForm.ctvName,
        amount: manualForm.amount,
        bankName: manualForm.bankName,
        accountNumber: manualForm.accountNumber,
        accountName: manualForm.accountName || manualForm.ctvName.toUpperCase(),
        status: 'pending',
        createdAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
        withdrawalType: manualForm.withdrawalType,
        paymentMethod: manualForm.paymentMethod,
        note: manualForm.note
      });
    }

    setIsManualModalOpen(false);
    showToast('Đã tạo lệnh rút tiền mới thành công!', 'success', {
      title: '✓ TẠO LỆNH THÀNH CÔNG'
    });
    setActionNotice('✓ Đã tạo lệnh rút tiền mới thành công!');
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Filter calculations
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchSearch = 
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.ctvName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchType = typeFilter === 'all' || (w.withdrawalType || 'affiliate_commission') === typeFilter;
    const matchMethod = methodFilter === 'all' || (w.paymentMethod || 'bank') === methodFilter;

    return matchSearch && matchStatus && matchType && matchMethod;
  });

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalApproved = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;
  const totalRejected = withdrawals.filter(w => w.status === 'rejected').reduce((sum, w) => sum + w.amount, 0);
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>QUẢN LÝ RÚT TIỀN & CHI TRẢ HOA HỒNG (WITHDRAWALS PANEL)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Payout Engine
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Duyệt chi trả hoa hồng Đại lý Tiếp thị liên kết (CTV Reseller) & Rút số dư ví thành viên về Ngân hàng / MoMo / USDT TRC20.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Lệnh Rút Mới</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{actionNotice}</span>
        </div>
      )}

      {/* Top 4 Financial Metric Pods */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Pending Card */}
        <div className={`p-3 rounded-xl border transition-all ${pendingCount > 0 ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-[11px] text-amber-400">
            <span className="flex items-center gap-1 font-bold">
              <Clock className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              CHỜ DUYỆT CHI TRẢ
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
              {pendingCount} ĐƠN
            </span>
          </div>
          <div className="text-lg font-black text-amber-300 font-mono mt-1.5">
            {formatCurrency(totalPending, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Cần admin kiểm tra & giải ngân
          </div>
        </div>

        {/* Approved Card */}
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between text-[11px] text-emerald-400">
            <span className="flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ĐÃ CHI TRẢ THÀNH CÔNG
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-black">
              {approvedCount}
            </span>
          </div>
          <div className="text-lg font-black text-emerald-300 font-mono mt-1.5">
            {formatCurrency(totalApproved, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Đã thanh toán về STK thụ hưởng
          </div>
        </div>

        {/* Rejected Card */}
        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
          <div className="flex items-center justify-between text-[11px] text-rose-400">
            <span className="flex items-center gap-1 font-bold">
              <XCircle className="w-3.5 h-3.5" />
              TỪ CHỐI / HOÀN TIỀN
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-900 text-rose-300 text-[10px] font-bold">
              {rejectedCount}
            </span>
          </div>
          <div className="text-lg font-black text-rose-300 font-mono mt-1.5">
            {formatCurrency(totalRejected, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Đã hoàn lại số dư cho thành viên
          </div>
        </div>

        {/* Speed & SLA Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-cyan-400">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              TỐC ĐỘ GIẢI NGÂN
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">99.8% SLA</span>
          </div>
          <div className="text-lg font-black text-cyan-300 font-mono mt-1.5">
            ~ 3.5 Phút
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Hỗ trợ quét VietQR 24/7 tức thì
          </div>
        </div>
      </div>

      {/* Subtabs for Requests vs Policy Settings */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
              activeSubTab === 'requests'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Danh Sách Lệnh Rút Tiền ({withdrawals.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('policy_settings')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
              activeSubTab === 'policy_settings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cài Đặt Hạn Mức & Phí Rút</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          Tổng cộng: <strong className="text-white">{filteredWithdrawals.length}</strong> yêu cầu phù hợp
        </div>
      </div>

      {/* SUBTAB 1: WITHDRAWAL REQUESTS LIST */}
      {activeSubTab === 'requests' && (
        <div className="space-y-3">
          {/* Filters & Search Toolbar */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã lệnh #WD, tên người rút, số tài khoản, tên ngân hàng..."
                className="w-full pl-9 pr-3 py-2 bg-black/70 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] text-slate-400 font-bold shrink-0">Trạng thái:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-cyan-600 text-white' : 'bg-black/50 text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-black' : 'bg-black/50 text-amber-400 hover:text-amber-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Chờ Duyệt ({pendingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-black/50 text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã Chi Trả ({approvedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'rejected' ? 'bg-rose-600 text-white' : 'bg-black/50 text-rose-400 hover:text-rose-300'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Từ Chối ({rejectedCount})</span>
              </button>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-black/70 border border-slate-700 rounded text-xs font-mono text-cyan-300 cursor-pointer focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="bank">Ngân Hàng (VietQR)</option>
                <option value="momo">Ví MoMo</option>
                <option value="usdt">Crypto USDT (TRC20)</option>
                <option value="crypto_ltc">Crypto Litecoin (LTC)</option>
                <option value="binance_pay">Binance Pay / UID</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-black/70 border border-slate-700 rounded text-xs font-mono text-cyan-300 cursor-pointer focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">Tất cả nguồn rút</option>
                <option value="affiliate_commission">💎 Hoa Hồng Đại Lý CTV</option>
                <option value="wallet_balance">💰 Số Dư Ví Thành Viên</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-slate-800 bg-black/60 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Mã Lệnh / Nguồn</th>
                    <th className="p-3">Người Yêu Cầu</th>
                    <th className="p-3">Số Tiền Rút</th>
                    <th className="p-3">Cổng & Tài Khoản Nhận</th>
                    <th className="p-3">Thời Gian</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-right">Thao Tác Admin</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        Không tìm thấy yêu cầu rút tiền nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((w) => {
                      const isPending = w.status === 'pending';
                      const isApproved = w.status === 'approved';
                      const isRejected = w.status === 'rejected';
                      const isAffiliate = w.withdrawalType === 'affiliate_commission' || !w.withdrawalType;
                      const method = w.paymentMethod || 'bank';

                      return (
                        <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                          {/* ID & Type */}
                          <td className="p-3 align-top">
                            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                              <span>#{w.id}</span>
                              <button
                                onClick={() => copyToClipboard(w.id, w.id)}
                                className="text-slate-500 hover:text-white cursor-pointer"
                                title="Copy mã đơn"
                              >
                                {copiedId === w.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <div className="mt-1">
                              {isAffiliate ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                                  💎 HOA HỒNG CTV
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                                  💰 RÚT VÍ CHÍNH
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Requester Info */}
                          <td className="p-3 align-top">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{w.ctvName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              ID: <code className="text-slate-300">{w.ctvId}</code>
                            </div>
                            {w.beneficiaryPhone && (
                              <div className="text-[10px] text-slate-400">
                                SĐT: <span className="text-slate-300">{w.beneficiaryPhone}</span>
                              </div>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="p-3 align-top">
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              {formatCurrency(w.amount, currency)}
                            </div>
                            {method === 'crypto_ltc' && (
                              <div className="text-[10px] text-blue-400 mt-0.5 font-bold">
                                ≈ {(w.amount / 2150000).toFixed(4)} LTC
                              </div>
                            )}
                            {(method === 'binance_pay' || method === 'usdt') && (
                              <div className="text-[10px] text-amber-400 mt-0.5 font-bold">
                                ≈ {(w.amount / 25400).toFixed(2)} USDT
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Phí: <span className="text-emerald-400">0₫ (Miễn phí)</span>
                            </div>
                          </td>

                          {/* Bank / Method & Account */}
                          <td className="p-3 align-top">
                            {method === 'bank' && (
                              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                                <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span>{w.bankName}</span>
                              </div>
                            )}
                            {method === 'momo' && (
                              <div className="flex items-center gap-1.5 text-pink-300 font-bold">
                                <Smartphone className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                <span>Ví MoMo Auto</span>
                              </div>
                            )}
                            {method === 'usdt' && (
                              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                                <Coins className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span>Crypto USDT (TRC20)</span>
                              </div>
                            )}
                            {method === 'crypto_ltc' && (
                              <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                                <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>Litecoin (LTC Mainnet)</span>
                              </div>
                            )}
                            {method === 'binance_pay' && (
                              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black font-black text-[8px] flex items-center justify-center">B</div>
                                <span>Binance Pay / UID</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-mono font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-xs truncate max-w-[200px]" title={w.accountNumber}>
                                {w.accountNumber}
                              </span>
                              <button
                                onClick={() => copyToClipboard(w.accountNumber, `acc-${w.id}`)}
                                className="text-slate-400 hover:text-white cursor-pointer p-0.5 rounded hover:bg-slate-800 shrink-0"
                                title="Copy số tài khoản / địa chỉ ví"
                              >
                                {copiedId === `acc-${w.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="text-[11px] text-slate-300 font-bold mt-1 uppercase truncate max-w-[200px]">
                              {w.accountName}
                            </div>
                          </td>

                          {/* Timestamp */}
                          <td className="p-3 align-top text-[11px] text-slate-400">
                            <div>Yêu cầu: <span className="text-slate-300 font-bold">{w.createdAt}</span></div>
                            {w.processedAt && (
                              <div className="text-[10px] text-emerald-400 mt-0.5">
                                Duyệt: {w.processedAt}
                              </div>
                            )}
                            {w.note && (
                              <div className="text-[10px] text-slate-400 italic mt-1 line-clamp-2 max-w-[200px]" title={w.note}>
                                "{w.note}"
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="p-3 align-top text-center">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
                                <Clock className="w-3 h-3" /> CHỜ DUYỆT
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" /> ĐÃ CHI TRẢ
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                                <XCircle className="w-3 h-3" /> TỪ CHỐI
                              </span>
                            )}
                          </td>

                          {/* Admin Action Buttons */}
                          <td className="p-3 align-top text-right space-y-1.5">
                            {isPending ? (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                                {/* Quick Pay with VietQR button */}
                                <button
                                  onClick={() => setSelectedWithdrawalForPay(w)}
                                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-md active:scale-95 transition-all"
                                  title="Quét mã VietQR hoặc duyệt chuyển khoản"
                                >
                                  <QrCode className="w-3 h-3" />
                                  <span>Duyệt & Chuyển Tiền</span>
                                </button>

                                {/* Reject button */}
                                <button
                                  onClick={() => setRejectingWithdrawal(w)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                  title="Từ chối yêu cầu và hoàn tiền"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Từ Chối</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedWithdrawalForPay(w)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Xem Chi Tiết</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: WITHDRAWAL POLICY & SETTINGS */}
      {activeSubTab === 'policy_settings' && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>CHÍNH SÁCH VÀ HẠN MỨC RÚT TIỀN TOÀN HỆ THỐNG</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Cấu hình số tiền rút tối thiểu, tối đa trong ngày và thời gian cam kết chi trả.
              </p>
            </div>
            <button
              onClick={() => {
                setActionNotice('✓ Đã lưu cấu hình chính sách rút tiền thành công!');
                setTimeout(() => setActionNotice(null), 3000);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer shadow-md"
            >
              Lưu Cấu Hình
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-black/50 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                Số Tiền Rút Tối Thiểu (₫):
              </label>
              <input
                type="number"
                value={policyConfig.minWithdrawalVnd}
                onChange={(e) => setPolicyConfig({ ...policyConfig, minWithdrawalVnd: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 font-sans">
                Khách hàng hoặc Đại lý phải tích lũy đủ số tiền này mới được tạo lệnh rút.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-black/50 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                Hạn Mức Rút Tối Đa Trong 24h (₫):
              </label>
              <input
                type="number"
                value={policyConfig.maxDailyWithdrawalVnd}
                onChange={(e) => setPolicyConfig({ ...policyConfig, maxDailyWithdrawalVnd: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 font-sans">
                Ngưỡng bảo vệ ví chống rút cạn số dư bất thường.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-black/50 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                Phí Rút Tiền (%):
              </label>
              <input
                type="number"
                value={policyConfig.withdrawalFeePercent}
                onChange={(e) => setPolicyConfig({ ...policyConfig, withdrawalFeePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:border-cyan-500"
              />
              <p className="text-[10px] text-emerald-400 font-sans">
                0% = Miễn phí hoàn toàn cho Đại lý & Thành viên.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-black/50 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                Cam Kết Thời Gian Chi Trả (SLA):
              </label>
              <input
                type="text"
                value={policyConfig.processingTimeCommit}
                onChange={(e) => setPolicyConfig({ ...policyConfig, processingTimeCommit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 font-sans">
                Hiển thị trên thông báo cho khách hàng khi gửi yêu cầu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DUYỆT CHI TRẢ & VIETQR PAYOUT POPUP */}
      {selectedWithdrawalForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0b0f1a] border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a1820] to-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">
                    CHI TIẾT LỆNH RÚT #{selectedWithdrawalForPay.id}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Người thụ hưởng: <span className="text-emerald-300">{selectedWithdrawalForPay.accountName}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWithdrawalForPay(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4 font-mono text-xs overflow-y-auto max-h-[75vh]">
              {/* Financial Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-black border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Số tiền cần chuyển khoản:</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {formatCurrency(selectedWithdrawalForPay.amount, currency)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Nguồn: <span className="text-cyan-300 font-bold">{selectedWithdrawalForPay.withdrawalType === 'affiliate_commission' ? 'Hoa Hồng Tiếp Thị Liên Kết' : 'Số Dư Ví Thành Viên'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    selectedWithdrawalForPay.status === 'pending'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : selectedWithdrawalForPay.status === 'approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}>
                    {selectedWithdrawalForPay.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Beneficiary Info Pod */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Thông Tin Tài Khoản Nhận Tiền:</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px]">Ngân hàng:</span>
                    <div className="font-bold text-white">{selectedWithdrawalForPay.bankName}</div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px]">Chủ tài khoản:</span>
                    <div className="font-bold text-emerald-300 uppercase">{selectedWithdrawalForPay.accountName}</div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-500 text-[10px]">Số tài khoản thụ hưởng:</span>
                    <div className="flex items-center justify-between p-2 rounded bg-black border border-slate-700 font-bold text-amber-300 text-sm mt-0.5">
                      <span>{selectedWithdrawalForPay.accountNumber}</span>
                      <button
                        onClick={() => copyToClipboard(selectedWithdrawalForPay.accountNumber, 'modal-acc')}
                        className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === 'modal-acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                {selectedWithdrawalForPay.note && (
                  <div className="p-2 rounded bg-black/40 border border-slate-800 text-[11px] text-slate-400">
                    <span className="text-slate-500">Ghi chú người rút: </span>
                    <span className="text-slate-300 font-sans">"{selectedWithdrawalForPay.note}"</span>
                  </div>
                )}
              </div>

              {/* Dynamic Payment Assist Box for Admin */}
              {selectedWithdrawalForPay.paymentMethod === 'crypto_ltc' ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-[#0a1526] border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span>Chi Trả Litecoin (LTC Core Node)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                      Mainnet
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Số LTC cần chuyển:</span>
                      <span className="text-blue-300 font-bold font-mono text-sm">
                        ≈ {(selectedWithdrawalForPay.amount / 2150000).toFixed(6)} LTC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Địa chỉ ví LTC nhận:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-mono font-bold">{selectedWithdrawalForPay.accountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(selectedWithdrawalForPay.accountNumber, 'modal-ltc-acc')}
                          className="text-cyan-400 hover:text-white p-0.5"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tỷ giá tính toán: 1 LTC = 2.150.000đ • Xác nhận sau 2 blocks (~5 phút).
                    </div>
                  </div>
                </div>
              ) : selectedWithdrawalForPay.paymentMethod === 'binance_pay' ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-[#191508] border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black font-black text-[8px] flex items-center justify-center">B</div>
                      <span>Chuyển Khoản Binance Pay / Binance UID</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      0% Fee Instant
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Số USDT cần chuyển:</span>
                      <span className="text-amber-300 font-bold font-mono text-sm">
                        ≈ {(selectedWithdrawalForPay.amount / 25400).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Binance Pay ID / UID:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-mono font-bold">{selectedWithdrawalForPay.accountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(selectedWithdrawalForPay.accountNumber, 'modal-binance-acc')}
                          className="text-cyan-400 hover:text-white p-0.5"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Chuyển nội bộ qua Binance App &gt; Pay &gt; Send &gt; Nhập Pay ID <code>{selectedWithdrawalForPay.accountNumber}</code>.
                    </div>
                  </div>
                </div>
              ) : selectedWithdrawalForPay.paymentMethod === 'usdt' ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-[#160c22] border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-purple-400" />
                      <span>Chi Trả Crypto USDT (TRC20 Network)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                      TRC20
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Số USDT TRC20:</span>
                      <span className="text-purple-300 font-bold font-mono text-sm">
                        ≈ {(selectedWithdrawalForPay.amount / 25400).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Địa chỉ ví TRC20:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-mono font-bold truncate max-w-[240px]">{selectedWithdrawalForPay.accountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(selectedWithdrawalForPay.accountNumber, 'modal-usdt-acc')}
                          className="text-cyan-400 hover:text-white p-0.5 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#0c1822] border border-cyan-500/30 flex items-center gap-3.5">
                  <div className="w-20 h-20 rounded-lg bg-white p-1.5 shrink-0 flex items-center justify-center shadow-md">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Thanh Toán Nhanh Bằng VietQR Pro</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      Mở App Ngân Hàng quét mã để chuyển tiền chính xác tới số tài khoản <strong>{selectedWithdrawalForPay.accountNumber}</strong> ({selectedWithdrawalForPay.bankName}) với nội dung <code>CYBERPOOL {selectedWithdrawalForPay.id}</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedWithdrawalForPay(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono text-xs cursor-pointer"
              >
                Đóng
              </button>

              {selectedWithdrawalForPay.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectingWithdrawal(selectedWithdrawalForPay);
                      setSelectedWithdrawalForPay(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-mono font-bold text-xs border border-rose-500/40 cursor-pointer"
                  >
                    Từ Chối
                  </button>

                  <button
                    onClick={() => handleApprove(selectedWithdrawalForPay.id)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Đã Chuyển Tiền & Hoàn Tất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT CONFIRMATION POPUP */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#110c14] border border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>TỪ CHỐI LỆNH RÚT TIỀN #{rejectingWithdrawal.id}</span>
              </div>
              <button
                onClick={() => setRejectingWithdrawal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono text-xs">
              <p className="text-slate-300 font-sans">
                Hệ thống sẽ hoàn trả lại <strong className="text-emerald-400">{formatCurrency(rejectingWithdrawal.amount, currency)}</strong> vào số dư của <strong>{rejectingWithdrawal.ctvName}</strong>.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold">Lý do từ chối gửi cho người nhận:</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 bg-black border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                  placeholder="Nhập lý do từ chối cụ thể..."
                />
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {['Sai số tài khoản', 'Tên chủ thẻ không khớp', 'Yêu cầu bảo trì cổng', 'Nghi vấn gian lận'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setRejectReason(`Từ chối: ${tag}`)}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectingWithdrawal(null)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs cursor-pointer shadow-md"
              >
                Xác Nhận Từ Chối & Hoàn Tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL WITHDRAWAL CREATOR */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#090d16] border border-cyan-500/50 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-sm">
                <Plus className="w-4 h-4" />
                <span>TẠO LỆNH RÚT TIỀN THỦ CÔNG (ADMIN PAYOUT)</span>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="p-4 sm:p-5 space-y-3.5 font-mono text-xs overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Tên Người Thụ Hưởng (*):</label>
                  <input
                    type="text"
                    required
                    value={manualForm.ctvName}
                    onChange={(e) => setManualForm({ ...manualForm, ctvName: e.target.value })}
                    placeholder="Nguyễn Văn A..."
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-white font-mono text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Số Tiền Cần Rút (₫) (*):</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-emerald-400 font-mono font-bold text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Tên Ngân Hàng / Ví:</label>
                  <input
                    type="text"
                    required
                    value={manualForm.bankName}
                    onChange={(e) => setManualForm({ ...manualForm, bankName: e.target.value })}
                    placeholder="MB Bank, Vietcombank, MoMo..."
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-white font-mono text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Số Tài Khoản (*):</label>
                  <input
                    type="text"
                    required
                    value={manualForm.accountNumber}
                    onChange={(e) => setManualForm({ ...manualForm, accountNumber: e.target.value })}
                    placeholder="0912345678..."
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-amber-300 font-mono font-bold text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Nguồn Rút:</label>
                  <select
                    value={manualForm.withdrawalType}
                    onChange={(e) => setManualForm({ ...manualForm, withdrawalType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-cyan-300 font-mono text-xs"
                  >
                    <option value="affiliate_commission">💎 Hoa Hồng Tiếp Thị CTV</option>
                    <option value="wallet_balance">💰 Số Dư Ví Thành Viên</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Hình Thức Chi Trả:</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-white font-mono text-xs"
                  >
                    <option value="bank">Ngân Hàng (VietQR 24/7)</option>
                    <option value="momo">Ví MoMo Auto</option>
                    <option value="usdt">Crypto USDT (TRC20)</option>
                    <option value="crypto_ltc">Crypto Litecoin (LTC Core)</option>
                    <option value="binance_pay">Binance Pay / UID (0% Phí)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">Ghi chú lệnh:</label>
                <input
                  type="text"
                  value={manualForm.note}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-slate-700 rounded text-slate-300 font-mono text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 -mx-4 -mb-4 mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs cursor-pointer shadow-md"
                >
                  Tạo Lệnh Rút Tiền Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
