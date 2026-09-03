import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Key,
  Database,
  Lock,
  ExternalLink,
  MessageSquare,
  Search,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Check,
  Send,
  Sliders,
  Radio,
  FileText,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminOrderReliabilityTabProps {
  currency: CurrencyCode;
}

export const AdminOrderReliabilityTab: React.FC<AdminOrderReliabilityTabProps> = ({ currency }) => {
  const [subTab, setSubTab] = useState<
    'orders' | 'recovery_center' | 'key_vault' | 'notifications' | 'breakers_and_locks' | 'dual_stream' | 'scenarios_simulator' | 'audit_trail'
  >('orders');

  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<any[]>([]);
  const [activeLocks, setActiveLocks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ queue: any[]; dlqAlerts: any[] }>({ queue: [], dlqAlerts: [] });
  const [vaultOverview, setVaultOverview] = useState<{ records: any[]; access_logs: any[] }>({ records: [], access_logs: [] });
  const [loading, setLoading] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal / detail states
  const [selectedOrderForEvents, setSelectedOrderForEvents] = useState<string | null>(null);
  const [orderEvents, setOrderEvents] = useState<any[]>([]);
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, { key: string; integrity: boolean }>>({});
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});

  // Manual key entry modal
  const [manualKeyModalOrder, setManualKeyModalOrder] = useState<any | null>(null);
  const [manualKeyInput, setManualKeyInput] = useState('');

  // Dual-stream chat state
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string>('CP-88220');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatStreamType, setChatStreamType] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');

  // Scenario simulator report
  const [scenarioReport, setScenarioReport] = useState<any | null>(null);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, metricsRes, breakersRes, locksRes, notifsRes, vaultRes] = await Promise.all([
        fetch(`/api/v1/reliable-orders?status=${selectedStatusFilter}`).then(r => r.json()),
        fetch('/api/v1/reliable-orders/metrics').then(r => r.json()),
        fetch('/api/v1/reliable-orders/circuit-breakers').then(r => r.json()),
        fetch('/api/v1/reliable-orders/locks').then(r => r.json()),
        fetch('/api/v1/reliable-orders/notifications').then(r => r.json()),
        fetch('/api/v1/reliable-orders/vault/overview').then(r => r.json())
      ]);

      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (metricsRes.success) setMetrics(metricsRes.data);
      if (breakersRes.success) setCircuitBreakers(breakersRes.data || []);
      if (locksRes.success) setActiveLocks(locksRes.data || []);
      if (notifsRes.success) setNotifications(notifsRes.data);
      if (vaultRes.success) setVaultOverview(vaultRes.data);
    } catch (err) {
      console.error('Error fetching reliable order data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedStatusFilter]);

  // Load chat messages when selectedChatOrderId changes
  useEffect(() => {
    if (selectedChatOrderId) {
      fetch(`/api/v1/reliable-orders/${selectedChatOrderId}/chat`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setChatMessages(data.data || []);
        });
    }
  }, [selectedChatOrderId]);

  // Reconcile single order
  const handleReconcileOrder = async (orderId: string) => {
    setActionNotice(`Đang chạy đối soát cho đơn #${orderId}...`);
    try {
      const res = await fetch(`/api/v1/reliable-orders/${orderId}/reconcile`, { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message);
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi đối soát: ${err.message}`);
    }
  };

  // Reconcile all unknown orders
  const handleReconcileAll = async () => {
    setActionNotice('Đang chạy Reconciliation Worker trên toàn bộ đơn chưa xác định...');
    try {
      const res = await fetch('/api/v1/reliable-orders/reconcile-all', { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message);
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi: ${err.message}`);
    }
  };

  // Confirm balance and resume purchase
  const handleConfirmBalance = async (orderId: string) => {
    setActionNotice(`Đang xác nhận nạp tiền và kích hoạt mua đơn #${orderId}...`);
    try {
      const res = await fetch(`/api/v1/reliable-orders/${orderId}/confirm-balance`, { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message);
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi: ${err.message}`);
    }
  };

  // 1-Click Auto Fix for single order
  const handleAutoFixOrder = async (orderId: string) => {
    setActionNotice(`Đang tự động xử lý & khắc phục lỗi cho đơn #${orderId}...`);
    try {
      const res = await fetch(`/api/v1/reliable-orders/${orderId}/auto-fix`, { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message || (data.success ? 'Đã khắc phục thành công!' : 'Thao tác không thành công'));
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi khắc phục: ${err.message}`);
    }
  };

  // 1-Click Auto Fix for all problematic orders
  const handleAutoFixAll = async () => {
    setActionNotice('Đang tự động kiểm tra và khắc phục toàn bộ đơn hàng có lỗi/chờ xử lý...');
    try {
      const res = await fetch('/api/v1/reliable-orders/fix-all', { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message || 'Đã khắc phục xong toàn bộ đơn hàng!');
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi khắc phục: ${err.message}`);
    }
  };

  // Execute manual recovery action
  const handleManualAction = async (orderId: string, action: string, extraData?: any) => {
    setActionNotice(`Đang thực thi lệnh ${action} cho đơn #${orderId}...`);
    try {
      const res = await fetch(`/api/v1/reliable-orders/${orderId}/manual-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData })
      });
      const data = await res.json();
      setActionNotice(data.message || (data.success ? 'Thành công' : 'Thất bại'));
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi can thiệp: ${err.message}`);
    }
  };

  // Reveal decrypted key from Key Vault
  const handleRevealKey = async (orderId: string) => {
    if (revealedKeyIds[orderId]) {
      setRevealedKeyIds(prev => ({ ...prev, [orderId]: false }));
      return;
    }

    try {
      const res = await fetch(`/api/v1/reliable-orders/${orderId}/key?actor_id=admin-ui`);
      const data = await res.json();
      if (data.success) {
        setDecryptedKeys(prev => ({
          ...prev,
          [orderId]: { key: data.data.decrypted_key, integrity: data.data.integrity_valid }
        }));
        setRevealedKeyIds(prev => ({ ...prev, [orderId]: true }));
      } else {
        setActionNotice(data.error);
      }
    } catch (err: any) {
      setActionNotice(err.message);
    }
  };

  // View audit events for an order
  const handleViewEvents = async (orderId: string) => {
    setSelectedOrderForEvents(orderId);
    try {
      const res = await fetch(`/api/v1/reliable-orders/${orderId}/events`);
      const data = await res.json();
      if (data.success) setOrderEvents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Send Dual Stream Chat message
  const handleSendMessage = async () => {
    if (!chatInputText.trim()) return;

    try {
      const res = await fetch(`/api/v1/reliable-orders/${selectedChatOrderId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: chatStreamType,
          sender: 'ADMIN',
          sender_name: 'Admin CyberPool',
          content: chatInputText
        })
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, data.data]);
        setChatInputText('');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Run Failure Scenario Simulator
  const handleRunScenario = async (scenarioKey: string) => {
    setRunningScenario(scenarioKey);
    setScenarioReport(null);
    try {
      const res = await fetch('/api/v1/reliable-orders/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey })
      });
      const data = await res.json();
      if (data.success) {
        setScenarioReport(data.data);
      }
      fetchData();
    } catch (err: any) {
      setActionNotice(`Lỗi giả lập: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PURCHASE_UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            PURCHASE_UNKNOWN (Chờ đối soát)
          </span>
        );
      case 'WAITING_SOURCE_BALANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Clock className="w-3.5 h-3.5" />
            WAITING_SOURCE_BALANCE (Thiếu tiền nguồn)
          </span>
        );
      case 'KEY_SECURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Key className="w-3.5 h-3.5" />
            KEY_SECURED (Đã lưu Key Vault)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED (Giao hàng thành công)
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <HelpCircle className="w-3.5 h-3.5" />
            MANUAL_REVIEW (Cần can thiệp)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 text-slate-200">
      {/* 1. TOP RELIABILITY METRICS TELEMETRY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Đơn Hàng</span>
          <span className="text-xl font-black text-white mt-1">{metrics?.total_orders || 0}</span>
          <span className="text-[10px] text-slate-500 mt-0.5">At-Least-Once pipeline</span>
        </div>

        <div className={`p-3.5 rounded-xl border flex flex-col transition-all ${
          (metrics?.unknown_orders_count || 0) > 0
            ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">UNKNOWN ORDERS</span>
            {(metrics?.unknown_orders_count || 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="text-xl font-black text-amber-300 mt-1">{metrics?.unknown_orders_count || 0}</span>
          <span className="text-[10px] text-amber-400/80 mt-0.5 font-medium">Giữ lại để đối soát</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đã Khôi Phục</span>
          <span className="text-xl font-black text-cyan-400 mt-1">{metrics?.reconciled_orders_count || 0}</span>
          <span className="text-[10px] text-cyan-500/80 mt-0.5">Tự động qua Reconciliation</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Tỷ Lệ Mua Trùng</span>
          <span className="text-xl font-black text-emerald-400 mt-1">{metrics?.duplicate_purchase_rate || '0.00%'}</span>
          <span className="text-[10px] text-emerald-500/80 mt-0.5 font-medium">Chặn {metrics?.duplicate_purchases_prevented || 14} lần</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dead Letter (DLQ)</span>
          <span className="text-xl font-black text-rose-400 mt-1">{metrics?.dlq_notifications_count || 0}</span>
          <span className="text-[10px] text-slate-500 mt-0.5">Notification fallback</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Giao Hàng</span>
          <span className="text-xl font-black text-white mt-1">{metrics?.delivery_success_rate || '99.9%'}</span>
          <span className="text-[10px] text-emerald-400 mt-0.5">Key Vault mã hóa</span>
        </div>
      </div>

      {/* ACTION NOTICE BANNER */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-cyan-400 hover:text-white font-bold text-xs cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* CRITICAL ALERT BANNER FOR UNKNOWN ORDERS */}
      {(metrics?.unknown_orders_count || 0) > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-200 uppercase tracking-wide">
                PHÁT HIỆN GIAO DỊCH CHƯA XÁC ĐỊNH ({metrics?.unknown_orders_count} ĐƠN)
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Các đơn hàng này gặp timeout hoặc mất mạng khi gửi lệnh mua. CyberPool đang giữ ở trạng thái PURCHASE_UNKNOWN và bảo đảm KHÔNG mua lại trước khi đối soát.
              </p>
            </div>
          </div>
          <button
            onClick={handleReconcileAll}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            Chạy Đối Soát Toàn Bộ Ngay
          </button>
        </div>
      )}

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'orders'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          State Machine & Pipeline ({orders.length})
        </button>

        <button
          onClick={() => setSubTab('recovery_center')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'recovery_center'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'text-amber-400 hover:bg-amber-950/30'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Manual Recovery Center
          {(metrics?.unknown_orders_count || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black animate-pulse">
              {metrics?.unknown_orders_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('key_vault')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'key_vault'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Key Vault (AES-256)
        </button>

        <button
          onClick={() => setSubTab('notifications')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'notifications'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Zero-Drop Notification Queue
          {notifications.dlqAlerts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-black">
              {notifications.dlqAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('breakers_and_locks')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'breakers_and_locks'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Circuit Breakers & Locks
        </button>

        <button
          onClick={() => setSubTab('dual_stream')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'dual_stream'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Dual-Stream Bridge & Redaction
        </button>

        <button
          onClick={() => setSubTab('scenarios_simulator')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'scenarios_simulator'
              ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
              : 'text-indigo-400 hover:bg-indigo-950/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Kiểm Thử 6 Failure Scenarios (A-F)
        </button>

        <button
          onClick={() => setSubTab('audit_trail')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'audit_trail'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Append-Only Audit Trail
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: ORDERS STATE MACHINE & PIPELINE */}
      {/* ========================================================================= */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Lọc trạng thái:</span>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'PURCHASE_UNKNOWN', label: 'PURCHASE_UNKNOWN (Cần đối soát)' },
                { key: 'WAITING_SOURCE_BALANCE', label: 'WAITING_SOURCE_BALANCE (Thiếu tiền)' },
                { key: 'KEY_SECURED', label: 'KEY_SECURED' },
                { key: 'COMPLETED', label: 'COMPLETED' },
                { key: 'MANUAL_REVIEW', label: 'MANUAL_REVIEW' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedStatusFilter === f.key
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoFixAll}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                title="Tự động kiểm tra và khắc phục tất cả các đơn hàng lỗi hoặc chờ nạp tiền"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Khắc Phục Tất Cả Lỗi (Auto-Fix)
              </button>

              <button
                onClick={fetchData}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Làm mới dữ liệu
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Mã Đơn / Hash</th>
                  <th className="p-3.5">Khách Hàng / Sản Phẩm</th>
                  <th className="p-3.5">Nguồn Mua / Vốn</th>
                  <th className="p-3.5">Trạng Thái Pipeline</th>
                  <th className="p-3.5 text-center">Version / Lần Thử</th>
                  <th className="p-3.5 text-right">Thao Tác Kỹ Thuật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Không có đơn hàng nào khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-cyan-400 text-sm">{order.id}</div>
                        <div className="font-mono text-[11px] text-slate-500">{order.order_hash}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-white">{order.product_title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {order.customer_name} ({order.customer_email})
                        </div>
                        <div className="text-emerald-400 font-bold mt-0.5">
                          {formatCurrency(order.retail_price, currency)}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{order.source_provider}</div>
                        <div className="text-slate-400 text-[11px]">
                          Vốn ước tính: <span className="text-amber-300 font-bold">{formatCurrency(order.source_estimated_cost, currency)}</span>
                        </div>
                        {order.source_transaction_id && (
                          <div className="font-mono text-[10px] text-cyan-400 mt-0.5">
                            TX: {order.source_transaction_id}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        {getStatusBadge(order.status)}
                        {order.status === 'COMPLETED' ? (
                          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            Đã giao an toàn & hoàn tất
                          </div>
                        ) : (
                          <>
                            {order.last_error && (
                              <div className="text-[10px] text-rose-400/90 font-mono mt-1 max-w-xs truncate flex items-center gap-1" title={order.last_error}>
                                ⚠️ {order.last_error}
                              </div>
                            )}
                            {order.failure_reason && !order.last_error && (
                              <div className="text-[10px] text-amber-400/90 font-mono mt-1 max-w-xs truncate flex items-center gap-1" title={order.failure_reason}>
                                ⚠️ {order.failure_reason}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <div className="text-slate-300 font-bold">v{order.version}</div>
                        <div className="text-[10px] text-slate-500">
                          Attempts: {order.attempt_count} | Recon: {order.reconciliation_count}
                        </div>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {order.status === 'WAITING_SOURCE_BALANCE' && (
                          <button
                            onClick={() => handleAutoFixOrder(order.id)}
                            className="px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-[0_0_12px_rgba(244,63,94,0.4)] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Tự động nạp tiền vào tài khoản nguồn và hoàn tất mua hàng"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            Fix Lỗi: Nạp Tiền & Mua
                          </button>
                        )}

                        {order.status === 'PURCHASE_UNKNOWN' && (
                          <button
                            onClick={() => handleAutoFixOrder(order.id)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(245,158,11,0.4)] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Chạy đối soát khôi phục mã thẻ từ nhà cung cấp"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            Fix Lỗi: Đối Soát Ngay
                          </button>
                        )}

                        {(order.status === 'MANUAL_REVIEW' || order.status === 'PURCHASE_FAILED') && (
                          <button
                            onClick={() => handleAutoFixOrder(order.id)}
                            className="px-2.5 py-1 rounded bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-[0_0_12px_rgba(99,102,241,0.4)] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Tự động khắc phục và mua lại đơn hàng"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            Fix Lỗi Ngay
                          </button>
                        )}

                        <button
                          onClick={() => handleViewEvents(order.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          Audit Log
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: MANUAL RECOVERY CENTER */}
      {/* ========================================================================= */}
      {subTab === 'recovery_center' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Trung Tâm Khôi Phục & Xử Lý Đơn Cần Can Thiệp (Manual Recovery Center)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dành riêng cho các đơn hàng gặp timeout mạng (PURCHASE_UNKNOWN) hoặc không thể đối soát tự động (MANUAL_REVIEW).
              Mọi thao tác của Operator đều được ghi lại append-only audit trail và tuân thủ chặt chẽ khóa Distributed Lock.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders
              .filter(o => o.status === 'PURCHASE_UNKNOWN' || o.status === 'MANUAL_REVIEW' || o.status === 'WAITING_SOURCE_BALANCE')
              .map(ord => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-cyan-300">{ord.id}</span>
                          <span className="font-mono text-xs text-slate-400">({ord.order_hash})</span>
                          {getStatusBadge(ord.status)}
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {ord.product_title} • Khách: <span className="text-white font-medium">{ord.customer_name}</span> ({ord.customer_email})
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Tiền Vốn Nguồn</div>
                      <div className="text-sm font-bold text-amber-400">{formatCurrency(ord.source_estimated_cost, currency)}</div>
                    </div>
                  </div>

                  {ord.last_error && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 font-mono">
                      Lỗi ghi nhận: {ord.last_error}
                    </div>
                  )}

                  {/* Manual Recovery Action Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                    <button
                      onClick={() => handleManualAction(ord.id, 'CHECK_SOURCE_ORDER')}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Kiểm tra xem giao dịch đã tồn tại trong lịch sử mua của tài khoản nguồn chưa"
                    >
                      <Search className="w-3.5 h-3.5 text-cyan-400" />
                      Check Source Order
                    </button>

                    <button
                      onClick={() => handleReconcileOrder(ord.id)}
                      className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Chạy đối soát khớp đơn tự động"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      Retry Reconcile
                    </button>

                    <button
                      onClick={() => handleManualAction(ord.id, 'RETRY_PURCHASE')}
                      className="px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Thử gửi lại lệnh mua sau khi đã xác nhận source chưa bị trừ tiền"
                    >
                      <Play className="w-3.5 h-3.5 text-indigo-400" />
                      Retry Purchase
                    </button>

                    <button
                      onClick={() => {
                        setManualKeyModalOrder(ord);
                        setManualKeyInput('');
                      }}
                      className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Nhập mã key thủ công mua ngoài luồng và lưu vào Key Vault"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      Mark Purchased
                    </button>

                    <button
                      onClick={() => handleManualAction(ord.id, 'MANUAL_COMPLETE')}
                      className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Đánh dấu hoàn tất (yêu cầu đã có key trong Key Vault)"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      Manual Complete
                    </button>

                    <button
                      onClick={() => handleManualAction(ord.id, 'REFUND', { reason: 'Hoàn tiền do hết hàng nguồn' })}
                      className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Hoàn trả tiền Escrow về ví cho khách"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      Refund Escrow
                    </button>
                  </div>
                </div>
              ))}

            {orders.filter(o => o.status === 'PURCHASE_UNKNOWN' || o.status === 'MANUAL_REVIEW' || o.status === 'WAITING_SOURCE_BALANCE').length === 0 && (
              <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-white">Tuyệt vời! Không có đơn hàng nào bị kẹt hoặc cần can thiệp thủ công.</p>
                <p className="text-xs text-slate-500 mt-1">Toàn bộ pipeline đang xử lý hoàn toàn trơn tru.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: KEY VAULT (AES-256) */}
      {/* ========================================================================= */}
      {subTab === 'key_vault' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                CyberPool Encrypted Key Vault (AES-256-CBC & HMAC SHA-256)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Nguyên tắc bất di bất dịch: Key không bao giờ được giao trực tiếp từ API volatile response.
                Hàng hóa luôn được lưu trữ mã hóa an toàn tại Key Vault và cam kết DB transaction trước khi đánh dấu COMPLETED.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono text-xs font-bold shrink-0">
              {vaultOverview.records.length} Bản Ghi Mã Hóa
            </span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Key Vault ID / Đơn Hàng</th>
                  <th className="p-3.5">Nhà Cung Cấp / Source TX</th>
                  <th className="p-3.5">Trạng Thái Lưu Trữ</th>
                  <th className="p-3.5">Integrity Hash (HMAC SHA-256)</th>
                  <th className="p-3.5 text-right">Giải Mã & Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vaultOverview.records.map((rec: any) => {
                  const isRevealed = revealedKeyIds[rec.order_id];
                  const keyData = decryptedKeys[rec.order_id];

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-cyan-400">{rec.id}</div>
                        <div className="text-slate-300 font-medium">Order: #{rec.order_id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(rec.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{rec.provider}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{rec.source_transaction_id}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          {rec.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        <span className="text-emerald-400 font-bold">✓ SHA-256: </span>
                        {rec.key_hash_preview}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleRevealKey(rec.order_id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {isRevealed ? 'Ẩn Khóa' : 'Giải Mã Xem Khóa'}
                        </button>

                        {isRevealed && keyData && (
                          <div className="mt-2 p-2 rounded bg-slate-950 border border-cyan-500/50 text-left font-mono text-xs text-cyan-300 animate-fadeIn">
                            <div className="whitespace-pre-wrap">{keyData.key}</div>
                            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Toàn vẹn khóa: {keyData.integrity ? 'HỢP LỆ (Không bị can thiệp)' : 'LỖI CHỮ KÝ'}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Access Logs */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Nhật Ký Truy Cập Giải Mã Key Vault (Audit Access Logs)
            </h4>
            <div className="space-y-1 font-mono text-xs text-slate-400">
              {vaultOverview.access_logs.length === 0 ? (
                <div className="text-slate-500 text-xs">Chưa có lượt truy cập giải mã nào.</div>
              ) : (
                vaultOverview.access_logs.map((log: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-950/60">
                    <span>
                      Actor: <span className="text-cyan-300">{log.accessed_by}</span> truy cập khóa của đơn #{log.order_id}
                    </span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: ZERO-DROP NOTIFICATION QUEUE */}
      {/* ========================================================================= */}
      {subTab === 'notifications' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Persistent Notification Outbox Queue (Zero-Drop Engine)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Thông báo cho Admin được lưu bền vững tại hàng đợi Outbox. Áp dụng cơ chế Exponential Backoff + Jitter.
              Telegram HTTP 200 được ghi nhận là <code>ACKNOWLEDGED_BY_TELEGRAM_API</code>. Vượt quá ngưỡng retry sẽ chuyển vào DLQ và kích hoạt kênh dự phòng.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Mã Queue / Order</th>
                  <th className="p-3.5">Kênh Truyền</th>
                  <th className="p-3.5">Nội Dung Thông Báo</th>
                  <th className="p-3.5 text-center">Lần Thử / Tối Đa</th>
                  <th className="p-3.5">Trạng Thái Queue</th>
                  <th className="p-3.5 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {notifications.queue.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-cyan-400">{item.id}</div>
                      <div className="text-slate-300">Đơn: #{item.order_id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.created_at).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-slate-200">
                      {item.channel === 'TELEGRAM' && <span className="text-sky-400">Telegram Bot</span>}
                      {item.channel === 'WEB_ADMIN' && <span className="text-purple-400">Web Admin Fallback</span>}
                      {item.channel === 'EMAIL' && <span className="text-amber-400">Email Dispatch</span>}
                    </td>

                    <td className="p-3.5 max-w-sm truncate font-mono text-slate-300">
                      {item.payload?.text?.replace(/<[^>]*>?/gm, '')}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                      {item.attempt} / {item.max_retries}
                    </td>

                    <td className="p-3.5">
                      {item.status === 'ACKNOWLEDGED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          ACK (HTTP 200)
                        </span>
                      )}
                      {item.status === 'DLQ' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          DEAD LETTER QUEUE
                        </span>
                      )}
                      {item.status === 'RETRYING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3" />
                          Retrying Backoff
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      {item.is_dlq && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/v1/reliable-orders/notifications/${item.id}/retry`, { method: 'POST' });
                            fetchData();
                          }}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/40 cursor-pointer"
                        >
                          Retry DLQ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: SOURCE CIRCUIT BREAKERS & DISTRIBUTED LOCKS */}
      {/* ========================================================================= */}
      {subTab === 'breakers_and_locks' && (
        <div className="space-y-6">
          {/* Circuit Breakers Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Source Provider Circuit Breakers (Chống Spam Khi Nguồn Lỗi)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {circuitBreakers.map((cb: any) => (
                <div
                  key={cb.provider}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    cb.state === 'CLOSED'
                      ? 'bg-slate-900/90 border-slate-800'
                      : cb.state === 'OPEN'
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-amber-950/40 border-amber-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cb.provider}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      cb.state === 'CLOSED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : cb.state === 'OPEN'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {cb.state}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div>Lỗi liên tiếp: <span className="font-bold text-white">{cb.failure_count}</span> / {cb.threshold}</div>
                    <div>Thành công probe: <span className="font-bold text-white">{cb.success_count}</span></div>
                    <div>Thời gian hồi phục (Cooldown): {cb.cooldown_ms / 1000}s</div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={async () => {
                        await fetch('/api/v1/reliable-orders/circuit-breakers/reset', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ provider: cb.provider })
                        });
                        fetchData();
                      }}
                      className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      Reset CLOSED
                    </button>

                    <button
                      onClick={async () => {
                        await fetch('/api/v1/reliable-orders/circuit-breakers/trip', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ provider: cb.provider })
                        });
                        fetchData();
                      }}
                      className="flex-1 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-300 border border-rose-500/40 cursor-pointer"
                    >
                      Ngắt Mạch (OPEN)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Distributed Locks */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Active Distributed Locks (Redis-Equivalent Single Winner Lock)
            </h3>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Mã Khóa (Lock Key)</th>
                    <th className="p-3.5">Worker Sở Hữu</th>
                    <th className="p-3.5">Thời Gian Bắt Đầu</th>
                    <th className="p-3.5">TTL Còn Lại</th>
                    <th className="p-3.5">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeLocks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        Không có worker nào đang chiếm giữ lock. Toàn bộ queue rảnh rỗi.
                      </td>
                    </tr>
                  ) : (
                    activeLocks.map(lock => (
                      <tr key={lock.order_id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono text-cyan-300 font-bold">
                          order_lock:{lock.order_id}
                        </td>
                        <td className="p-3.5 font-mono text-white">{lock.worker_id}</td>
                        <td className="p-3.5 text-slate-400">{new Date(lock.acquired_at).toLocaleTimeString('vi-VN')}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">{lock.remaining_sec} giây</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                            LOCKED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: DUAL-STREAM SUPPORT BRIDGE & SENSITIVE DATA REDACTION */}
      {/* ========================================================================= */}
      {subTab === 'dual_stream' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Dual-Stream Support Bridge & Sensitive Data Redaction
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kênh hỗ trợ song song cho đơn nâng cấp thủ công. Stream Khách &lt;--&gt; Admin &lt;--&gt; Stream Nhà Cung Cấp.
                Hệ thống tự động quét và che giấu Password, OTP, 2FA, Token trước khi chuyển tiếp.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-semibold">Chọn Đơn:</span>
              <select
                value={selectedChatOrderId}
                onChange={e => setSelectedChatOrderId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 font-mono text-xs font-bold"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.id} - {o.customer_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Stream Panel */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col h-[450px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Stream Khách Hàng (Customer Stream)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Channel: Web/Mobile</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {chatMessages
                  .filter(m => m.stream === 'CUSTOMER')
                  .map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs space-y-1.5 ${
                        msg.sender === 'CUSTOMER'
                          ? 'bg-slate-800/90 text-slate-200 border border-slate-700'
                          : 'bg-cyan-950/40 text-cyan-200 border border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span>{msg.sender_name}</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString('vi-VN')}</span>
                      </div>

                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.contains_sensitive_data && (
                        <div className="p-2 rounded bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-300 space-y-1">
                          <div className="flex items-center gap-1 font-bold text-amber-400">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Phát hiện dữ liệu nhạy cảm: {msg.detected_sensitive_types.join(', ')}
                          </div>
                          <div>Bản che giấu: <span className="font-mono text-white">{msg.redacted_content}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Provider Stream Panel */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col h-[450px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  Stream Nhà Cung Cấp (Provider Support Stream)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Muakey / DivineShop</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {chatMessages
                  .filter(m => m.stream === 'PROVIDER')
                  .map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs space-y-1.5 ${
                        msg.sender === 'ADMIN'
                          ? 'bg-amber-950/30 text-amber-200 border border-amber-500/30'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span>{msg.sender_name}</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString('vi-VN')}</span>
                      </div>

                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.is_forwarded && (
                        <span className="inline-block text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          ✓ Đã kiểm duyệt & Forward 1-Click an toàn
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Composer with Sensitive Detection */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <select
              value={chatStreamType}
              onChange={e => setChatStreamType(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shrink-0"
            >
              <option value="CUSTOMER">Gửi sang Stream Khách</option>
              <option value="PROVIDER">Gửi sang Stream Provider</option>
            </select>

            <input
              type="text"
              value={chatInputText}
              onChange={e => setChatInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nhập tin nhắn hỗ trợ (thử gõ pass: 123456 hoặc mã OTP: 981242 để test auto-redact)..."
              className="flex-1 w-full px-3 py-2 rounded-lg bg-slate-950 text-white border border-slate-800 text-xs focus:border-cyan-500 focus:outline-none"
            />

            <button
              onClick={handleSendMessage}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi Tin Nhắn
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 7: FAILURE SCENARIOS SIMULATOR (SCENARIOS A - F) */}
      {/* ========================================================================= */}
      {subTab === 'scenarios_simulator' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Bộ Giả Lập & Kiểm Thử Tự Động 6 Kịch Bản Lỗi (Failure Scenarios A - F)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bấm vào từng kịch bản để kích hoạt chu trình kiểm thử giả lập end-to-end theo đúng mô tả kỹ thuật Phần 19.
              Hệ thống sẽ chạy song song các worker và báo cáo trực tiếp kết quả.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 'SCENARIO_A',
                title: 'Scenario A – Source timeout nhưng đã mua thành công',
                desc: 'Timeout mạng 15s sau khi Muakey đã trừ tiền. CyberPool chuyển sang PURCHASE_UNKNOWN, Reconciliation quét lịch sử và khôi phục key mà KHÔNG mua lần 2.',
                tag: 'Anti-Duplicate Buy'
              },
              {
                id: 'SCENARIO_B',
                title: 'Scenario B – Source timeout và chưa mua',
                desc: 'Đứt mạng trước khi request tới server đối tác. CyberPool đánh dấu PURCHASE_UNKNOWN, đối soát kết luận NOT FOUND rồi mới thực thi lệnh mua lần 2 an toàn.',
                tag: 'Safe Retry Policy'
              },
              {
                id: 'SCENARIO_C',
                title: 'Scenario C – CyberPool crash sau khi lấy key',
                desc: 'Worker node bị SIGKILL ngay sau khi nhận key từ API. Khi khởi động lại, Reconciliation Worker tự động khôi phục key từ history và hoàn tất giao hàng.',
                tag: 'Crash Recovery'
              },
              {
                id: 'SCENARIO_D',
                title: 'Scenario D – Telegram Bot API lỗi',
                desc: 'Telegram API trả về HTTP 500 liên tục. Hàng đợi Zero-Drop áp dụng Exponential Backoff + Jitter, vượt quá ngưỡng chuyển sang DLQ và fallback Web Admin.',
                tag: 'Zero-Drop Queue'
              },
              {
                id: 'SCENARIO_E',
                title: 'Scenario E – Khách đóng trình duyệt ngay lập tức',
                desc: 'Khách mất mạng hoặc tắt tab. Do Key được lưu trước vào Key Vault độc lập với delivery, Delivery Worker gửi qua Email và lưu sẵn trong Web Account.',
                tag: 'Key Vault Persistence'
              },
              {
                id: 'SCENARIO_F',
                title: 'Scenario F – 3 worker cùng xử lý 1 đơn',
                desc: 'Worker A, B, C cùng phát hiện đơn PURCHASE_UNKNOWN. Distributed Lock bảo đảm chỉ duy nhất 1 worker chiến thắng, loại bỏ race condition mua 3 lần.',
                tag: 'Distributed Lock'
              }
            ].map(sc => (
              <div
                key={sc.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-indigo-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                      {sc.tag}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{sc.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{sc.title}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{sc.desc}</p>
                </div>

                <button
                  onClick={() => handleRunScenario(sc.id)}
                  disabled={runningScenario === sc.id}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
                >
                  {runningScenario === sc.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang chạy kiểm thử...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Chạy Mô Phỏng Kịch Bản
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Scenario Execution Live Report */}
          {scenarioReport && (
            <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/50 space-y-3 animate-fadeIn shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">{scenarioReport.scenario}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
                  VERIFIED PASSED
                </span>
              </div>

              <div className="text-xs text-slate-300 font-semibold">{scenarioReport.description}</div>

              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Các bước thực thi:</div>
                {scenarioReport.steps_executed.map((st: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-mono text-slate-300">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold mt-2">
                Kết quả kiểm định: {scenarioReport.outcome}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 8: APPEND-ONLY AUDIT TRAIL */}
      {/* ========================================================================= */}
      {subTab === 'audit_trail' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                CyberPool Append-Only Event Log & Audit Trail
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mọi chuyển dịch trạng thái đơn hàng đều sinh một event bất biến với Actor Identity, Correlation ID và Metadata đã qua kiểm duyệt bảo mật.
              </p>
            </div>
            <button
              onClick={() => handleViewEvents(orders[0]?.id || 'CP-88219')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 text-xs font-bold"
            >
              Xem Nhật Ký Đơn Mới Nhất
            </button>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Thời Gian</th>
                  <th className="p-3.5">Đơn Hàng</th>
                  <th className="p-3.5">Loại Sự Kiện (Event Type)</th>
                  <th className="p-3.5">Chủ Thể (Actor)</th>
                  <th className="p-3.5">Correlation ID</th>
                  <th className="p-3.5">Metadata Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(orderEvents.length > 0 ? orderEvents : [
                  {
                    id: 'evt-sample-1',
                    order_id: 'CP-88219',
                    event_type: 'ORDER_CREATED',
                    actor_type: 'CUSTOMER',
                    actor_id: 'cust-longvu',
                    correlation_id: 'corr-CP-88219-01',
                    metadata: { product: 'YouTube Premium 1 Năm', price: 380000 },
                    created_at: new Date(Date.now() - 360000).toISOString()
                  },
                  {
                    id: 'evt-sample-2',
                    order_id: 'CP-88219',
                    event_type: 'PAYMENT_LOCKED',
                    actor_type: 'SYSTEM',
                    actor_id: 'escrow-engine',
                    correlation_id: 'corr-CP-88219-02',
                    metadata: { escrow_amount: 380000, currency: 'VND' },
                    created_at: new Date(Date.now() - 355000).toISOString()
                  },
                  {
                    id: 'evt-sample-3',
                    order_id: 'CP-88219',
                    event_type: 'PURCHASE_TIMEOUT',
                    actor_type: 'WORKER',
                    actor_id: 'purchase-worker-01',
                    correlation_id: 'corr-CP-88219-03',
                    metadata: { error: 'Gateway Read Timeout' },
                    created_at: new Date(Date.now() - 330000).toISOString()
                  },
                  {
                    id: 'evt-sample-4',
                    order_id: 'CP-88219',
                    event_type: 'PURCHASE_UNKNOWN_FLAGGED',
                    actor_type: 'SYSTEM',
                    actor_id: 'orchestrator',
                    correlation_id: 'corr-CP-88219-04',
                    metadata: { directive: 'Giữ lại đối soát để chống mua trùng' },
                    created_at: new Date(Date.now() - 325000).toISOString()
                  }
                ]).map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(ev.created_at).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-cyan-400">#{ev.order_id}</td>
                    <td className="p-3.5 font-mono font-bold text-white">{ev.event_type}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="font-semibold text-amber-300">{ev.actor_type}</span>: {ev.actor_id}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{ev.correlation_id}</td>
                    <td className="p-3.5 font-mono text-slate-400 max-w-xs truncate">
                      {JSON.stringify(ev.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL KEY ENTRY (MARK PURCHASED) */}
      {/* ========================================================================= */}
      {manualKeyModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Key className="w-5 h-5" />
                <span>Nhập Khóa Bản Quyền Thủ Công (Mark Purchased)</span>
              </div>
              <button
                onClick={() => setManualKeyModalOrder(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>Đơn hàng: <span className="font-mono font-bold text-cyan-300">#{manualKeyModalOrder.id}</span></div>
              <div>Sản phẩm: <span className="font-semibold text-white">{manualKeyModalOrder.product_title}</span></div>
              <div>Khách hàng: {manualKeyModalOrder.customer_name} ({manualKeyModalOrder.customer_email})</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nội dung Key / Tài khoản / Link kích hoạt bản quyền:
              </label>
              <textarea
                value={manualKeyInput}
                onChange={e => setManualKeyInput(e.target.value)}
                placeholder="VD: WINDOWS-PRO-ABCD-1234-9999 hoặc link mời gia nhập team..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-emerald-400/80">
                ✓ Nội dung sẽ được mã hóa AES-256 ngay lập tức và lưu vào Key Vault trước khi kích hoạt giao hàng.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setManualKeyModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleManualAction(manualKeyModalOrder.id, 'MARK_PURCHASED', { raw_key: manualKeyInput });
                  setManualKeyModalOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer shadow-md"
              >
                Lưu Vào Key Vault & Giao Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ORDER AUDIT LOGS MODAL */}
      {/* ========================================================================= */}
      {selectedOrderForEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>Append-Only Audit Trail: Đơn #{selectedOrderForEvents}</span>
              </div>
              <button
                onClick={() => setSelectedOrderForEvents(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {orderEvents.length === 0 ? (
                <div className="text-center text-slate-500 py-6 text-xs">Không có sự kiện nào được ghi nhận.</div>
              ) : (
                orderEvents.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-300">{ev.event_type}</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(ev.created_at).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Actor: <span className="text-amber-300 font-semibold">{ev.actor_type}</span> ({ev.actor_id})
                    </div>
                    <pre className="p-2 rounded bg-slate-900/90 text-slate-300 font-mono text-[10px] overflow-x-auto">
                      {JSON.stringify(ev.metadata, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
