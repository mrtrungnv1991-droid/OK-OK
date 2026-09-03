import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Globe, 
  Search, 
  RefreshCw, 
  Play, 
  Pause, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Layers, 
  Sliders, 
  ArrowRight, 
  ExternalLink, 
  Tag, 
  Activity, 
  Database, 
  Eye, 
  EyeOff, 
  Plus, 
  Filter, 
  Check, 
  X, 
  Zap, 
  Clock, 
  AlertCircle,
  FileText,
  Key
} from 'lucide-react';
import { 
  SourceAccountRecord, 
  SourceProductItem, 
  SourceScanJobRecord, 
  SourceOfferItem, 
  ScannerProfileItem,
  CurrencyCode 
} from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminSourceConnectorTabProps {
  currency: CurrencyCode;
}

export const AdminSourceConnectorTab: React.FC<AdminSourceConnectorTabProps> = ({ currency }) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'monitor' | 'products' | 'routing' | 'profiles' | 'audit'>('accounts');
  
  // Data state
  const [accounts, setAccounts] = useState<SourceAccountRecord[]>([]);
  const [jobs, setJobs] = useState<SourceScanJobRecord[]>([]);
  const [products, setProducts] = useState<SourceProductItem[]>([]);
  const [offers, setOffers] = useState<SourceOfferItem[]>([]);
  const [profiles, setProfiles] = useState<ScannerProfileItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Filters & selection
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState<SourceProductItem | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState<number>(0);

  // New account form state
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    domain: '',
    username: '',
    password: '',
    sessionToken: '',
    connector_type: 'BROWSER' as const,
    scanner_profile: 'MUAKey_STANDARD',
    balance: 500000,
    currency: 'VND',
    low_balance_threshold: 200000
  });

  // Multi-source routing simulator state
  const [routeSimProduct, setRouteSimProduct] = useState('INT-RBX-1000');
  const [routeSimQty, setRouteSimQty] = useState(1);
  const [routeSimResult, setRouteSimResult] = useState<any>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accRes, jobRes, prodRes, offRes, profRes, audRes] = await Promise.all([
        fetch('/api/v1/source-connector/accounts').then(r => r.json()),
        fetch('/api/v1/source-connector/scan/jobs').then(r => r.json()),
        fetch('/api/v1/source-connector/products').then(r => r.json()),
        fetch('/api/v1/source-connector/offers').then(r => r.json()),
        fetch('/api/v1/source-connector/profiles').then(r => r.json()),
        fetch('/api/v1/source-connector/audit-logs').then(r => r.json())
      ]);

      if (accRes.success) setAccounts(accRes.data);
      if (jobRes.success) setJobs(jobRes.data);
      if (prodRes.success) setProducts(prodRes.data);
      if (offRes.success) setOffers(offRes.data);
      if (profRes.success) setProfiles(profRes.data);
      if (audRes.success) setAuditLogs(audRes.data);
    } catch (err) {
      console.error('Failed to load Source Connector data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000); // Polling for live scan progress
    return () => clearInterval(interval);
  }, []);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Test Login Action
  const handleTestLogin = async (accountId: string) => {
    notify('Đang kiểm tra kết nối & Browser Session...', 'success');
    try {
      const res = await fetch(`/api/v1/source-connector/accounts/${accountId}/test-login`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        notify(`Xác thực thành công! Session hợp lệ, số dư: ${Number(data.data.balance).toLocaleString('vi-VN')} VND`);
        fetchData();
      } else {
        notify(`Xác thực thất bại: ${data.error?.message || 'Lỗi không xác định'}`, 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Trigger Scan (Full or Incremental)
  const handleTriggerScan = async (accountId: string, scanType: 'FULL' | 'INCREMENTAL') => {
    const endpoint = scanType === 'FULL' ? '/api/v1/source-connector/scan/full' : '/api/v1/source-connector/scan/incremental';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      if (data.success) {
        notify(`Đã khởi động tiến trình ${scanType === 'FULL' ? 'Quét Toàn Diện (Full Scan)' : 'Quét Gia Tăng (Incremental)'}`);
        setActiveSubTab('monitor');
        fetchData();
      } else if (res.status === 409) {
        notify('Một tiến trình Scan đang chạy cho tài khoản này (Idempotency Active)!', 'error');
        setActiveSubTab('monitor');
      } else {
        notify(`Không thể bắt đầu: ${data.message}`, 'error');
      }
    } catch (err) {
      notify('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Toggle Pause/Resume
  const handleTogglePause = async (account: SourceAccountRecord) => {
    const endpoint = account.is_active 
      ? `/api/v1/source-connector/accounts/${account.id}/pause`
      : `/api/v1/source-connector/accounts/${account.id}/resume`;
    await fetch(endpoint, { method: 'POST' });
    notify(`Đã ${account.is_active ? 'Tạm Dừng' : 'Kích Hoạt'} tài khoản nguồn ${account.name}`);
    fetchData();
  };

  // Save new account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/source-connector/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccountForm)
      });
      const data = await res.json();
      if (data.success) {
        notify('Đã thêm tài khoản nguồn và khởi tạo Browser Profile mới thành công!');
        setShowAddAccountModal(false);
        fetchData();
      } else {
        notify(data.message, 'error');
      }
    } catch (err) {
      notify('Lỗi tạo tài khoản', 'error');
    }
  };

  // Run Route Simulator
  const handleRunSimulator = async () => {
    try {
      const res = await fetch('/api/v1/source-connector/offers/best-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalProductId: routeSimProduct,
          quantity: routeSimQty
        })
      });
      const data = await res.json();
      if (data.success) {
        setRouteSimResult(data.data);
      }
    } catch (err) {
      notify('Lỗi mô phỏng định tuyến', 'error');
    }
  };

  // Active Running Job
  const activeJob = jobs.find(j => j.status === 'RUNNING' || j.status === 'QUEUED');

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (selectedAccountId !== 'all' && p.source_account_id !== selectedAccountId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.source_product_id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner Alert / Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          notification.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Module Header & Quick Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl shadow-lg shadow-cyan-500/20">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Source Account Connector & Website Product Scan Engine
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                    No-API Required
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý trực tiếp tài khoản mua hàng nguồn, Browser Session cách ly & Engine quét đồng bộ sản phẩm tự động
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              Thêm Tài Khoản Nguồn
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Tài Khoản Nguồn</div>
            <div className="text-lg font-bold text-white mt-1 flex items-center justify-between">
              {accounts.length}
              <span className="text-xs font-normal text-emerald-400">
                {accounts.filter(a => a.status === 'ONLINE').length} Online
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Hàng Hóa Đã Quét</div>
            <div className="text-lg font-bold text-cyan-300 mt-1 flex items-center justify-between">
              {products.length}
              <span className="text-xs font-normal text-slate-400">
                {products.filter(p => p.source_status === 'IN_STOCK').length} Còn Hàng
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Multi-Source Offers</div>
            <div className="text-lg font-bold text-indigo-300 mt-1 flex items-center justify-between">
              {offers.length}
              <span className="text-xs font-normal text-indigo-400">Tối ưu giá</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Trạng Thái Scanner</div>
            <div className="text-lg font-bold mt-1 flex items-center justify-between">
              {activeJob ? (
                <span className="text-amber-400 flex items-center gap-1 text-sm">
                  <Activity className="w-4 h-4 animate-spin" /> Đang Quét ({activeJob.progress}%)
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Sẵn Sàng
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-500">Lock: TTL OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'accounts'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          1. Tài Khoản Nguồn & Browser Profile ({accounts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('monitor')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap relative ${
            activeSubTab === 'monitor'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          2. Product Scan Monitor (Tiến Trình Trực Tiếp)
          {activeJob && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          3. Hàng Hóa Nguồn & Bảng Giá Override ({products.length})
        </button>

        <button
          onClick={() => setActiveSubTab('routing')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'routing'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          4. Multi-Source Routing (Mô Phỏng Nguồn Tối Ưu)
        </button>

        <button
          onClick={() => setActiveSubTab('profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'profiles'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          5. Scanner Profiles ({profiles.length})
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          6. Audit Log & Bảo Mật
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: SOURCE ACCOUNTS LIST & BROWSER PROFILES */}
      {/* ========================================================================= */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => {
              const isLow = acc.balance < acc.low_balance_threshold;
              return (
                <div 
                  key={acc.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {acc.connector_type}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
                        {acc.name}
                      </h3>
                      <div className="text-xs text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-500" />
                        {acc.domain}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      acc.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      acc.status === 'REAUTH_REQUIRED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {acc.status}
                    </span>
                  </div>

                  {/* Balance & Threshold */}
                  <div className="my-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Số Dư Khả Dụng:</span>
                      <span className={`font-bold font-mono text-sm ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {acc.balance.toLocaleString('vi-VN')} {acc.currency}
                      </span>
                    </div>

                    {isLow && (
                      <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Dưới ngưỡng an toàn ({acc.low_balance_threshold.toLocaleString('vi-VN')} {acc.currency})</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Tài khoản:</span>
                      <span className="font-mono text-slate-300">{acc.maskedUsername}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Profile:</span>
                      <span className="font-mono text-slate-300 text-[10px]">{acc.browser_profile_id}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Scanner:</span>
                      <span className="font-mono text-cyan-400 text-[10px]">{acc.scanner_profile}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleTriggerScan(acc.id, 'FULL')}
                        className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Scan Toàn Bộ
                      </button>

                      <button
                        onClick={() => handleTriggerScan(acc.id, 'INCREMENTAL')}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Scan Gia Tăng
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleTestLogin(acc.id)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        <Key className="w-3 h-3 text-cyan-400" />
                        Test Session
                      </button>

                      <button
                        onClick={() => handleTogglePause(acc)}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          acc.is_active 
                            ? 'bg-slate-950 hover:bg-rose-950/40 border-slate-700 text-slate-400 hover:text-rose-300' 
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-600/50 text-emerald-300'
                        }`}
                      >
                        {acc.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {acc.is_active ? 'Tạm Dừng' : 'Tiếp Tục'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PRODUCT SCAN MONITOR (LIVE WORKER QUEUE & PROGRESS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'monitor' && (
        <div className="space-y-6">
          {/* Active Job Visual Box (Matching ASCII prompt specification) */}
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-cyan-300 font-bold">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>PRODUCT SCAN MONITOR — {activeJob ? activeJob.scan_type : 'IDLE'}</span>
              </div>
              <span className="text-xs text-slate-400">
                Worker Lock: {activeJob ? `lock:source_scan:${activeJob.source_account_id}` : 'NONE'}
              </span>
            </div>

            {activeJob ? (
              <div className="space-y-5">
                {/* Visual Progress ASCII bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                    <span className="font-semibold text-white">{activeJob.current_step}</span>
                    <span className="text-cyan-400 font-bold text-sm">{activeJob.progress}%</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                      style={{ width: `${activeJob.progress}%` }}
                    />
                  </div>

                  {/* Exact ASCII Bar rendering */}
                  <div className="text-xs text-cyan-400 font-mono mt-1">
                    {`[${'█'.repeat(Math.floor(activeJob.progress / 5))}${'░'.repeat(20 - Math.floor(activeJob.progress / 5))}] ${activeJob.progress}%`}
                  </div>
                </div>

                {/* Counters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] text-slate-400">Danh Mục</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {activeJob.processed_categories} / {activeJob.total_categories}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] text-slate-400">Sản Phẩm</div>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">
                      {activeJob.processed_products} / {activeJob.total_products}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] text-slate-400">Tạo Mới</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      +{activeJob.created_count}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] text-slate-400">Cập Nhật</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">
                      {activeJob.updated_count}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] text-slate-400">Bỏ Qua</div>
                    <div className="text-sm font-bold text-slate-400 mt-0.5">
                      {activeJob.skipped_count}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] text-slate-400">Lỗi Trích Xuất</div>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">
                      {activeJob.failed_count}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-sans">Hiện không có tiến trình quét nào đang chạy.</p>
                <p className="text-xs text-slate-500 mt-1 font-sans">Hãy bấm "Scan Toàn Bộ" tại tab Tài Khoản Nguồn để bắt đầu quét tự động.</p>
              </div>
            )}
          </div>

          {/* Job History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Lịch Sử Các Job Quét (Scan Jobs History)
              </h3>
              <span className="text-xs text-slate-400">{jobs.length} jobs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Nguồn</th>
                    <th className="p-3">Loại Scan</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3">Tiến Độ</th>
                    <th className="p-3">Sản Phẩm Đã Xử Lý</th>
                    <th className="p-3">Thời Gian Bắt Đầu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {jobs.map(j => (
                    <tr key={j.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-cyan-300 font-bold">{j.id}</td>
                      <td className="p-3 text-slate-300 font-sans">{j.source_account_name || j.source_account_id}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {j.scan_type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          j.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          j.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="p-3 text-white font-bold">{j.progress}%</td>
                      <td className="p-3 text-slate-300">
                        {j.processed_products} sản phẩm (+{j.created_count} mới, ~{j.updated_count} cập nhật)
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(j.created_at).toLocaleTimeString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SOURCE PRODUCTS & PRICING MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm hoặc Product ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Tất cả tài khoản nguồn</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions Button */}
            {selectedProductIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Đã chọn: {selectedProductIds.length}</span>
                <button
                  onClick={async () => {
                    await fetch('/api/v1/source-connector/products/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productIds: selectedProductIds, action: 'IGNORE' })
                    });
                    notify(`Đã bỏ qua đồng bộ ${selectedProductIds.length} sản phẩm`);
                    setSelectedProductIds([]);
                    fetchData();
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs"
                >
                  Bỏ Qua Đồng Bộ (Ignore)
                </button>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-8">
                      <input 
                        type="checkbox"
                        checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProductIds(filteredProducts.map(p => p.id));
                          else setSelectedProductIds([]);
                        }}
                      />
                    </th>
                    <th className="p-3">ID Nguồn</th>
                    <th className="p-3">Tên Hàng Hóa Nguồn</th>
                    <th className="p-3">Danh Mục</th>
                    <th className="p-3 text-right">Giá Nguồn</th>
                    <th className="p-3 text-right">Markup %</th>
                    <th className="p-3 text-right">Giá Bán CyberPool</th>
                    <th className="p-3 text-center">Tồn Kho</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-center">Auto Sync</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {filteredProducts.map(prod => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    const isIgnored = prod.is_sync_ignored;
                    const isOverride = prod.price_override !== undefined && prod.price_override > 0;
                    
                    // Final calculated price
                    const baseVnd = prod.original_price;
                    const final = prod.price_override || Math.round((baseVnd * 1.05 + 5000) / 1000) * 1000;

                    return (
                      <tr key={prod.id} className={`hover:bg-slate-800/40 ${isSelected ? 'bg-cyan-950/20' : ''}`}>
                        <td className="p-3">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedProductIds([...selectedProductIds, prod.id]);
                              else setSelectedProductIds(selectedProductIds.filter(id => id !== prod.id));
                            }}
                          />
                        </td>
                        <td className="p-3 font-mono text-cyan-400 font-semibold">{prod.source_product_id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{prod.title}</div>
                          <a 
                            href={prod.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 font-mono mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Mở trang nguồn
                          </a>
                        </td>
                        <td className="p-3 text-slate-300 font-mono text-xs">{prod.category_raw || 'General'}</td>
                        <td className="p-3 text-right font-mono text-slate-300 font-bold">
                          {prod.original_price.toLocaleString('vi-VN')} {prod.original_currency}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {prod.markup_percent !== undefined ? `${prod.markup_percent}%` : '5% (Mặc định)'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {final.toLocaleString('vi-VN')} VND
                          {isOverride && (
                            <span className="block text-[10px] text-amber-400 font-sans font-normal">Override</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${prod.stock > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {prod.stock}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            prod.source_status === 'IN_STOCK' ? 'bg-emerald-500/10 text-emerald-400' :
                            prod.source_status === 'SOURCE_REMOVED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {prod.source_status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={async () => {
                              await fetch(`/api/v1/source-connector/products/${prod.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ auto_sync_price: !prod.auto_sync_price })
                              });
                              fetchData();
                            }}
                            className={`p-1.5 rounded-lg border text-xs ${
                              prod.auto_sync_price 
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {prod.auto_sync_price ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setShowOverrideModal(prod);
                                setOverridePriceInput(prod.price_override || final);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                              title="Đặt giá Override"
                            >
                              Sửa Giá
                            </button>
                            <button
                              onClick={async () => {
                                await fetch(`/api/v1/source-connector/products/${prod.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ is_sync_ignored: !prod.is_sync_ignored })
                                });
                                fetchData();
                              }}
                              className={`px-2 py-1 rounded text-xs ${isIgnored ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}
                            >
                              {isIgnored ? 'Bỏ Chặn' : 'Chặn Đồng Bộ'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MULTI-SOURCE ROUTING (SIMULATOR) */}
      {/* ========================================================================= */}
      {activeSubTab === 'routing' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Mô Phỏng Định Tuyến Đơn Hàng Nhiều Nguồn (Multi-Source Routing)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Khi khách hàng đặt mua một sản phẩm, Router tự động đối chiếu các ưu đãi (Offers) từ tất cả tài khoản nguồn khả dụng theo thứ tự ưu tiên: Tồn kho &gt; Số dư ví nguồn &gt; Sức khỏe tài khoản &gt; Giá vốn thấp nhất &gt; Mức ưu tiên.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Sản Phẩm Nội Bộ CyberPool</label>
                <select 
                  value={routeSimProduct}
                  onChange={(e) => setRouteSimProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="INT-ROBUX_1000">Roblox 1,000 Robux Clean</option>
                  <option value="INT-STM-100K">Thẻ Steam Wallet 100.000 VNĐ</option>
                  <option value="INT-MS-OFFICE-365">Microsoft 365 Family Bản Quyền</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Số Lượng Đặt Mua</label>
                <input 
                  type="number" 
                  min={1}
                  value={routeSimQty}
                  onChange={(e) => setRouteSimQty(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunSimulator}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/25 transition"
                >
                  Mô Phỏng Định Tuyến Nguồn
                </button>
              </div>
            </div>

            {/* Results Box */}
            {routeSimResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-semibold text-white">Kết Quả Định Tuyến:</span>
                  <span className="text-xs font-mono text-cyan-400">{routeSimResult.routingReason}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400 font-medium">Đánh Giá Từng Nguồn Khả Dụng:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {routeSimResult.evaluatedOffers.map((eo: any) => (
                      <div 
                        key={eo.offerId}
                        className={`p-3 rounded-xl border ${
                          eo.eligible 
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' 
                            : 'bg-rose-950/20 border-rose-500/30 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{eo.sourceAccount}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            eo.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {eo.eligible ? 'HỢP LỆ' : 'LOẠI BỎ'}
                          </span>
                        </div>
                        <div className="text-xs mt-1.5 font-mono">
                          Giá vốn: {eo.price.toLocaleString('vi-VN')} VND | Tồn: {eo.stock}
                        </div>
                        {eo.disqualificationReason && (
                          <div className="text-[11px] text-rose-400 mt-1">
                            Lý do loại: {eo.disqualificationReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: SCANNER PROFILES */}
      {/* ========================================================================= */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map(prof => (
              <div key={prof.profileId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-cyan-400 font-bold text-sm">{prof.name}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    {prof.paginationStrategy}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Domain:</span> <span className="text-slate-300">{prof.domainPattern}</span></div>
                  <div><span className="text-slate-500">Politeness:</span> <span className="text-slate-300">{prof.politenessDelayMs}ms</span></div>
                  <div><span className="text-slate-500">Max Pages:</span> <span className="text-slate-300">{prof.maxPagesSafetyLimit}</span></div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl space-y-1 text-[11px]">
                  <div className="text-slate-500">DOM Selectors:</div>
                  <div><span className="text-cyan-400 font-semibold">Card:</span> {prof.productCardSelector}</div>
                  <div><span className="text-cyan-400 font-semibold">Title:</span> {prof.titleSelector}</div>
                  <div><span className="text-cyan-400 font-semibold">Price:</span> {prof.priceSelector}</div>
                  <div><span className="text-cyan-400 font-semibold">Stock:</span> {prof.stockSelector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Nhật Ký Bảo Mật & Thao Tác (Audit Log Stream)
            </h3>
            <span className="text-xs text-slate-500">Tất cả mật khẩu/token được mã hóa & ẩn danh</span>
          </div>

          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto font-mono text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-bold">{log.id}</span>
                  </div>
                  <pre className="text-[11px] text-slate-400 mt-1.5 whitespace-pre-wrap font-mono">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SOURCE ACCOUNT */}
      {/* ========================================================================= */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Thêm Tài Khoản Nguồn Mới
              </h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tên Gọi Tài Khoản</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Muakey.com Tài Khoản Phụ 2"
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tên Miền (Domain)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="muakey.com"
                    value={newAccountForm.domain}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, domain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Loại Kết Nối</label>
                  <select 
                    value={newAccountForm.connector_type}
                    onChange={(e: any) => setNewAccountForm({ ...newAccountForm, connector_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="BROWSER">BROWSER (Trình Duyệt Tự Động)</option>
                    <option value="HYBRID">HYBRID (Trình Duyệt + Session API)</option>
                    <option value="API">API ADAPTER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tên Đăng Nhập / Email Tài Khoản Nguồn</label>
                <input 
                  type="text" 
                  required
                  placeholder="reseller@example.com"
                  value={newAccountForm.username}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Mật Khẩu (Mã hóa AES-256)</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newAccountForm.password}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Session Token / Cookie (Tùy chọn)</label>
                  <input 
                    type="text" 
                    placeholder="sess_..."
                    value={newAccountForm.sessionToken}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, sessionToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Scanner Profile</label>
                  <select 
                    value={newAccountForm.scanner_profile}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, scanner_profile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="MUAKey_STANDARD">Muakey.com Standard Grid</option>
                    <option value="GENERIC_ECOMMERCE_GRID">Generic E-Commerce Grid</option>
                    <option value="SITE_B_DYNAMIC_LOAD_MORE">Dynamic Load More Profile</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Số Dư Ban Đầu (VND)</label>
                  <input 
                    type="number" 
                    value={newAccountForm.balance}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, balance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/25"
                >
                  Lưu & Tạo Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SET PRICE OVERRIDE */}
      {/* ========================================================================= */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                Cài Đặt Giá Override Bán Lẻ
              </h3>
              <button onClick={() => setShowOverrideModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Sản phẩm:</span>
                <span className="font-semibold text-white text-sm">{showOverrideModal.title}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Giá gốc tại nguồn:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {showOverrideModal.original_price.toLocaleString('vi-VN')} {showOverrideModal.original_currency}
                </span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Giá Override CyberPool (VND)</label>
                <input 
                  type="number" 
                  step={1000}
                  value={overridePriceInput}
                  onChange={(e) => setOverridePriceInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Lưu ý: Giá Override sẽ có mức ưu tiên cao nhất, Scanner Engine sẽ không tự động ghi đè giá này.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={async () => {
                    await fetch(`/api/v1/source-connector/products/${showOverrideModal.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ price_override: undefined })
                    });
                    notify('Đã xóa giá Override, trở về quy tắc tính tự động');
                    setShowOverrideModal(null);
                    fetchData();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Xóa Override
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/v1/source-connector/products/${showOverrideModal.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ price_override: overridePriceInput })
                    });
                    notify(`Đã lưu giá Override: ${overridePriceInput.toLocaleString('vi-VN')} VND`);
                    setShowOverrideModal(null);
                    fetchData();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/25"
                >
                  Áp Dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
