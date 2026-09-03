import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Send, 
  RotateCcw, 
  Eye, 
  Gamepad2, 
  Gift, 
  Zap, 
  Sparkles, 
  Check, 
  Copy, 
  FileText, 
  User, 
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Wallet,
  Layers,
  BarChart3,
  Flame,
  ChevronRight
} from 'lucide-react';
import { ManualOrder, Currency, SourcePendingOrder } from '../../types';
import { INITIAL_MANUAL_ORDERS } from '../../data/systemExtendedData';
import { formatCurrency } from '../../utils/formatters';
import { DualStreamChatModal } from './DualStreamChatModal';

interface AdminManualOrdersTabProps {
  currency?: Currency;
}

export const AdminManualOrdersTab: React.FC<AdminManualOrdersTabProps> = ({ currency = 'VND' }) => {
  const [orders, setOrders] = useState<ManualOrder[]>(INITIAL_MANUAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ManualOrder | null>(null);
  const [deliveryContentInput, setDeliveryContentInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDualStreamOrder, setActiveDualStreamOrder] = useState<SourcePendingOrder | null>(null);

  // Comprehensive overview metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending_process');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const refundedOrders = orders.filter(o => o.status === 'refunded');

  const pendingCount = pendingOrders.length;
  const processingCount = processingOrders.length;
  const completedCount = completedOrders.length;
  const refundedCount = refundedOrders.length;

  const needActionOrders = orders.filter(o => o.status === 'pending_process' || o.status === 'processing');
  const pendingRevenue = needActionOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const completedRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  const keyGameCount = orders.filter(o => o.productType === 'key_game').length;
  const topupCount = orders.filter(o => o.productType === 'topup_manual').length;
  const giftCardCount = orders.filter(o => o.productType === 'gift_card').length;

  const completionRate = totalOrders > 0 
    ? Math.round((completedOrders.length / (totalOrders - refundedOrders.length || 1)) * 100) 
    : 100;

  const filteredOrders = orders.filter(ord => {
    const matchSearch = (ord.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.productTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.orderInputs?.uid && ord.orderInputs.uid.includes(searchTerm)) ||
      (ord.orderInputs?.emailDelivery && ord.orderInputs.emailDelivery.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchType = typeFilter === 'all' || ord.productType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const handleOpenProcess = (ord: ManualOrder) => {
    setSelectedOrder(ord);
    setDeliveryContentInput(ord.deliveredContent || '');
    setAdminNoteInput(ord.adminNote || '');
  };

  const handleFulfillOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!deliveryContentInput.trim()) {
      setSaveNotice('⚠️ Vui lòng nhập nội dung bàn giao (Key / Serial thẻ / Mã giao dịch Top Up)');
      setTimeout(() => setSaveNotice(null), 3000);
      return;
    }

    const updated = orders.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          status: 'completed' as const,
          deliveredContent: deliveryContentInput.trim(),
          adminNote: adminNoteInput.trim(),
          processedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
          processedBy: 'Root_SuperAdmin'
        };
      }
      return o;
    });

    setOrders(updated);
    setSaveNotice(`Đã hoàn tất duyệt và gửi bàn giao đơn "${selectedOrder.orderCode}" thành công!`);
    setSelectedOrder(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleRefundOrder = (ord: ManualOrder) => {
    const updated = orders.map(o => {
      if (o.id === ord.id) {
        return {
          ...o,
          status: 'refunded' as const,
          adminNote: 'Đã hoàn tiền vào số dư ví của khách hàng',
          processedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
          processedBy: 'Root_SuperAdmin'
        };
      }
      return o;
    });

    setOrders(updated);
    setSaveNotice(`Đã hủy & hoàn tiền ${formatCurrency(ord.totalPrice, currency)} cho đơn "${ord.orderCode}"!`);
    if (selectedOrder?.id === ord.id) setSelectedOrder(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'key_game':
        return <Gamepad2 className="w-4 h-4 text-cyan-400" />;
      case 'gift_card':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'topup_manual':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'key_game':
        return 'Key Game Bản Quyền';
      case 'gift_card':
        return 'Thẻ Quà Tặng E-Gift';
      case 'topup_manual':
        return 'Nạp Game UID/Server';
      default:
        return 'Tài Khoản Số';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_process':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Xử Lý</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>Đang Xử Lý</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã Giao Hàng</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã Hoàn Tiền</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Overview Dashboard Banner */}
      <div className="bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm space-y-4">
        {/* Top title & global metrics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Hàng Đợi Xử Lý Đơn Hàng Thủ Công</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium">
                ⚡ Manual & Game Top-Up Queue
              </span>
              {needActionOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[11px] font-bold animate-pulse flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>{needActionOrders.length} ĐƠN CẦN DUYỆT GẤP</span>
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase">
              BẢNG ĐIỀU PHỐI & TỔNG QUAN XỬ LÝ ĐƠN HÀNG THỦ CÔNG
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-2xl">
              Giám sát toàn diện luồng bàn giao Key Game, nạp Game UID/Server và mã thẻ E-Gift Card với cơ chế Escrow tạm giữ an toàn.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng Doanh Thu Hàng Đợi</div>
                <div className="text-sm font-bold text-amber-300 font-mono">
                  {formatCurrency(totalRevenue, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Interactive KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Chờ xử lý */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'pending_process' ? 'all' : 'pending_process')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
              statusFilter === 'pending_process'
                ? 'bg-amber-950/50 border-amber-500/80 shadow-lg shadow-amber-500/15'
                : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Chờ Duyệt Giao</span>
              </span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{pendingCount}</span>
              <span className="text-xs text-slate-400 font-medium">đơn hàng</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              <span>Chờ giao: <strong className="text-amber-400 font-mono">{formatCurrency(orders.filter(o => o.status === 'pending_process').reduce((s,o)=>s+o.totalPrice, 0), currency)}</strong></span>
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <span>Bấm để lọc nhóm này</span> <ChevronRight className="w-3 h-3" />
            </div>
          </button>

          {/* Card 2: Đang nạp / xử lý */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'processing' ? 'all' : 'processing')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
              statusFilter === 'processing'
                ? 'bg-cyan-950/50 border-cyan-500/80 shadow-lg shadow-cyan-500/15'
                : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang Nạp / Check</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                In-Progress
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">{processingCount}</span>
              <span className="text-xs text-slate-400 font-medium">đang chạy</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              <span>Giá trị: <strong className="text-cyan-400 font-mono">{formatCurrency(orders.filter(o => o.status === 'processing').reduce((s,o)=>s+o.totalPrice, 0), currency)}</strong></span>
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <span>Bấm để lọc nhóm này</span> <ChevronRight className="w-3 h-3" />
            </div>
          </button>

          {/* Card 3: Đã bàn giao thành công */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
              statusFilter === 'completed'
                ? 'bg-emerald-950/50 border-emerald-500/80 shadow-lg shadow-emerald-500/15'
                : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã Giao Thành Công</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Fulfilled
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{completedCount}</span>
              <span className="text-xs text-slate-400 font-medium">hoàn tất</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              <span>Doanh thu: <strong className="text-emerald-400 font-mono">{formatCurrency(completedRevenue, currency)}</strong></span>
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <span>Bấm để lọc nhóm này</span> <ChevronRight className="w-3 h-3" />
            </div>
          </button>

          {/* Card 4: Hiệu suất SLA */}
          <div className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-950/70 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hiệu Suất & SLA</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                100% Bảo Đảm
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">{completionRate}%</span>
              <span className="text-xs text-emerald-400 font-medium font-mono">Tỷ lệ thành công</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              <span>TG xử lý TB: <strong className="text-slate-200">~4 phút</strong> • Hoàn ví: <strong className="text-rose-400 font-mono">{refundedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & Category Breakdown */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tiến Độ Bàn Giao Toàn Hệ Thống ({completedCount}/{totalOrders} đơn)</span>
              </span>
              <span className="font-mono font-bold text-slate-300">
                {totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0}% Hoàn tất
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${totalOrders > 0 ? (pendingCount / totalOrders) * 100 : 0}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Chờ duyệt: ${pendingCount}`}
              />
              <div
                style={{ width: `${totalOrders > 0 ? (processingCount / totalOrders) * 100 : 0}%` }}
                className="bg-cyan-400 transition-all duration-500"
                title={`Đang nạp/xử lý: ${processingCount}`}
              />
              <div
                style={{ width: `${totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0}%` }}
                className="bg-emerald-400 transition-all duration-500"
                title={`Đã hoàn tất: ${completedCount}`}
              />
              <div
                style={{ width: `${totalOrders > 0 ? (refundedCount / totalOrders) * 100 : 0}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Đã hoàn tiền: ${refundedCount}`}
              />
            </div>
          </div>

          {/* Product Type Tags */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Kho mặt hàng:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 flex items-center gap-1">
              <Gamepad2 className="w-3 h-3 text-cyan-400" />
              <span>Key Game ({keyGameCount})</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-amber-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Nạp UID ({topupCount})</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-pink-300 flex items-center gap-1">
              <Gift className="w-3 h-3 text-pink-400" />
              <span>Gift Card ({giftCardCount})</span>
            </span>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Quick Interactive Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            statusFilter === 'all'
              ? 'bg-white text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
          }`}
        >
          <span>Tất Cả Đơn Hàng</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-300'
          }`}>
            {totalOrders}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending_process')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            statusFilter === 'pending_process'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Chờ Xử Lý</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'pending_process' ? 'bg-black text-amber-300 font-bold' : 'bg-amber-950 text-amber-300'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('processing')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            statusFilter === 'processing'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Đang Xử Lý</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'processing' ? 'bg-black text-cyan-300 font-bold' : 'bg-cyan-950 text-cyan-300'
          }`}>
            {processingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            statusFilter === 'completed'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đã Giao Hàng</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'completed' ? 'bg-black text-emerald-300 font-bold' : 'bg-emerald-950 text-emerald-300'
          }`}>
            {completedCount}
          </span>
        </button>

        {refundedCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('refunded')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'refunded'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-extrabold'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Đã Hoàn Tiền</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              statusFilter === 'refunded' ? 'bg-black text-rose-300 font-bold' : 'bg-rose-950 text-rose-300'
            }`}>
              {refundedCount}
            </span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách, UID game, email..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả mặt hàng</option>
            <option value="key_game">Key Game</option>
            <option value="gift_card">Gift Card</option>
            <option value="topup_manual">Nạp Game UID</option>
          </select>

          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer whitespace-nowrap"
              title="Đặt lại bộ lọc"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-3 whitespace-nowrap w-36">Mã Đơn / Ngày</th>
              <th className="py-3 px-3 whitespace-nowrap w-36">Khách Hàng</th>
              <th className="py-3 px-3 min-w-[160px]">Sản Phẩm & Phân Loại</th>
              <th className="py-3 px-3 min-w-[210px]">Thông Tin Đầu Vào (UID / Email / Ghi Chú)</th>
              <th className="py-3 px-3 whitespace-nowrap w-28 text-right">Tổng Tiền</th>
              <th className="py-3 px-3 whitespace-nowrap w-28 text-center">Trạng Thái</th>
              <th className="py-3 px-3 whitespace-nowrap w-32 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-amber-400 font-mono text-xs flex items-center gap-1">
                    <span>{ord.orderCode}</span>
                    <button
                      onClick={() => copyToClipboard(ord.orderCode, ord.id)}
                      className="text-slate-500 hover:text-white p-0.5 transition-colors"
                      title="Sao chép mã đơn"
                    >
                      {copiedId === ord.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ord.createdAt}</div>
                </td>

                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-white">{ord.customerName}</div>
                  {ord.customerContact && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 break-all">{ord.customerContact}</div>
                  )}
                </td>

                <td className="py-3 px-3 align-top">
                  <div className="flex items-start gap-1.5">
                    <div className="mt-0.5 shrink-0">{getTypeIcon(ord.productType)}</div>
                    <div>
                      <span className="font-semibold text-slate-200 leading-snug">{ord.productTitle}</span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Phân loại: <span className="text-cyan-400 font-medium">{getTypeLabel(ord.productType)}</span> (x{ord.quantity})
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-3 align-top">
                  <div className="space-y-1">
                    {ord.orderInputs.uid && (
                      <div className="text-xs">
                        <span className="text-slate-400">UID: </span>
                        <span className="font-semibold text-amber-300 font-mono select-all">{ord.orderInputs.uid}</span>
                        {ord.orderInputs.server && (
                          <span className="text-slate-400 ml-1">({ord.orderInputs.server})</span>
                        )}
                      </div>
                    )}
                    {ord.orderInputs.characterName && (
                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-400">Tên NV: </span>
                        <span className="font-medium text-white">{ord.orderInputs.characterName}</span>
                      </div>
                    )}
                    {ord.orderInputs.emailDelivery && (
                      <div className="text-[11px] text-cyan-300 font-mono break-all select-all">
                        <span className="text-slate-400 font-sans">Email: </span>
                        {ord.orderInputs.emailDelivery}
                      </div>
                    )}
                    {ord.orderInputs.notes && (
                      <div className="text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 rounded px-2 py-1 mt-1 break-words leading-relaxed">
                        <span className="text-amber-400 font-medium">Ghi chú:</span> "{ord.orderInputs.notes}"
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-3 px-3 font-bold text-emerald-400 font-mono align-top text-right whitespace-nowrap">
                  {formatCurrency(ord.totalPrice, currency)}
                </td>

                <td className="py-3 px-3 whitespace-nowrap align-top text-center">
                  {getStatusBadge(ord.status)}
                </td>

                <td className="py-3 px-3 text-center whitespace-nowrap align-top">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const mapped: SourcePendingOrder = {
                          id: ord.id,
                          orderCode: ord.orderCode,
                          customerName: ord.customerName,
                          productTitle: ord.productTitle,
                          productType: ord.productType,
                          retailPrice: ord.totalPrice,
                          sourceEstimatedCost: Math.round(ord.totalPrice * 0.75),
                          sourceName: 'Muakey.com',
                          idempotencyKey: `IDEMP-MAN-${ord.orderCode}`,
                          status: ord.status === 'completed' ? 'FULFILLED' : 'MANUAL_SUPPORT',
                          sourceAccountBalance: 85000,
                          fundsNeeded: 0,
                          telegramAlertSent: true,
                          deliveredContent: ord.deliveredContent,
                          accountDetails: {
                            uid: ord.orderInputs?.uid,
                            emailDelivery: ord.orderInputs?.emailDelivery,
                            accountNote: ord.orderInputs?.notes
                          },
                          createdAt: ord.createdAt,
                          updatedAt: ord.processedAt || ord.createdAt
                        };
                        setActiveDualStreamOrder(mapped);
                      }}
                      className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer transition-colors"
                      title="Mở Cầu Chat Song Song (Khách ⟷ Nguồn Muakey)"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenProcess(ord)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer flex items-center gap-1 text-xs transition-colors ${
                        ord.status === 'completed'
                          ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-bold'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{ord.status === 'completed' ? 'Chi Tiết' : 'Xử Lý'}</span>
                    </button>

                    {ord.status !== 'refunded' && ord.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleRefundOrder(ord)}
                        className="p-1.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-500/30 hover:bg-rose-900 cursor-pointer transition-colors"
                        title="Hủy đơn & Hoàn tiền ví"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span>Đang hiển thị: <strong className="text-white font-mono">{filteredOrders.length}</strong> / <span className="font-mono">{totalOrders}</span> đơn</span>
          <span className="text-slate-700">•</span>
          <span>Tổng giá trị đơn đang lọc: <strong className="text-emerald-400 font-mono text-sm">{formatCurrency(filteredRevenue, currency)}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cổng Escrow & Auto-Fulfillment hoạt động</span>
          </span>
          <span className="text-slate-700">•</span>
          <span>SLA phản hồi: <strong className="text-slate-200">~4 phút</strong></span>
        </div>
      </div>

      {/* Fulfillment Processing Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedOrder.productType)}
                <div>
                  <h4 className="font-bold text-white text-sm">
                    XỬ LÝ ĐƠN HÀNG THỦ CÔNG: #{selectedOrder.orderCode}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Khách: <span className="text-white font-bold">{selectedOrder.customerName}</span> | Phân loại: <span className="text-amber-400 font-bold">{getTypeLabel(selectedOrder.productType)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
              <div>
                <div className="text-slate-500">Sản phẩm:</div>
                <div className="font-bold text-white">{selectedOrder.productTitle} (x{selectedOrder.quantity})</div>
                <div className="text-slate-500 mt-1">Tổng tiền thanh toán:</div>
                <div className="font-bold text-emerald-400">{formatCurrency(selectedOrder.totalPrice, currency)}</div>
              </div>

              <div>
                <div className="text-slate-500">Thông tin khách cung cấp:</div>
                {selectedOrder.orderInputs.uid && (
                  <div className="text-amber-300 font-mono font-bold">UID: {selectedOrder.orderInputs.uid} ({selectedOrder.orderInputs.server || 'No Server'})</div>
                )}
                {selectedOrder.orderInputs.characterName && (
                  <div className="text-slate-300">Tên NV: {selectedOrder.orderInputs.characterName}</div>
                )}
                {selectedOrder.orderInputs.emailDelivery && (
                  <div className="text-cyan-300">Email: {selectedOrder.orderInputs.emailDelivery}</div>
                )}
                {selectedOrder.orderInputs.notes && (
                  <div className="text-slate-400 italic">"{selectedOrder.orderInputs.notes}"</div>
                )}
              </div>
            </div>

            <form onSubmit={handleFulfillOrder} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                  <span>Nội Dung Bàn Giao (Key / Thẻ / Mã Giao Dịch Top Up) (*):</span>
                  <span className="text-amber-400 text-[10px]">Khách hàng sẽ nhìn thấy nội dung này</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={deliveryContentInput}
                  onChange={(e) => setDeliveryContentInput(e.target.value)}
                  placeholder="Nhập CD-Key, Mã quà tặng Gift Card, hoặc Mã Transaction Top Up thành công..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs mt-1 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold">Ghi Chú Quản Trị (Admin Note):</label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Ghi chú nội bộ cho ca trực (VD: Đã check live, nạp qua Midasbuy)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {selectedOrder.status !== 'refunded' && selectedOrder.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => handleRefundOrder(selectedOrder)}
                    className="px-3.5 py-2 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/40 hover:bg-rose-900 font-bold cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hủy & Hoàn Tiền Ví</span>
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer text-xs"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-lg text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Bàn Giao Cho Khách</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual Stream Chat Support Bridge */}
      {activeDualStreamOrder && (
        <DualStreamChatModal
          isOpen={true}
          onClose={() => setActiveDualStreamOrder(null)}
          order={activeDualStreamOrder}
          currency={currency as any}
          onSendMessage={(stream, sender, text) => {
            console.log('Dual-stream msg:', stream, sender, text);
          }}
          onFulfillOrder={(orderId, deliveredKey) => {
            setOrders(prev => prev.map(o => {
              if (o.id === orderId) {
                return {
                  ...o,
                  status: 'completed',
                  deliveredContent: deliveredKey,
                  processedAt: new Date().toLocaleTimeString('vi-VN')
                };
              }
              return o;
            }));
            setSaveNotice(`✅ Đã bàn giao xong đơn qua Cầu Chat Song Song! Key: ${deliveredKey}`);
            setTimeout(() => setSaveNotice(null), 4000);
            setActiveDualStreamOrder(null);
          }}
        />
      )}
    </div>
  );
};
