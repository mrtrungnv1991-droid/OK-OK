import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Zap, 
  Copy, 
  Check, 
  Flame, 
  ShieldAlert,
  Server
} from 'lucide-react';

interface CronLogItem {
  id: string;
  timestamp: string;
  trigger: 'auto_interval' | 'manual_admin' | 'external_webhook';
  durationMs: number;
  suppliersChecked: number;
  totalProductsScanned: number;
  totalStockUpdated: number;
  outOfStockDetected: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  details: string;
}

interface CronStatus {
  isActive: boolean;
  isExecuting: boolean;
  config: {
    enabled: boolean;
    intervalSeconds: number;
    autoHideOutOfStock: boolean;
    notificationOnOutOfStock: boolean;
  };
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalRuns: number;
  totalOutOfStockFound: number;
  uptimeSeconds: number;
  recentLogs: CronLogItem[];
}

export const AdminCronMonitor: React.FC = () => {
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [copiedPingUrl, setCopiedPingUrl] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/cron/status');
      const data = await res.json();
      if (data.success && data.data) {
        setStatus(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch cron status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000); // Poll status every 8s
    return () => clearInterval(interval);
  }, []);

  const handleTriggerNow = async () => {
    setTriggering(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/cron/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.result) {
        setStatus(data.status);
        setActionMessage(`✅ Đã thực thi Cron tức thì! Quét: ${data.result.totalProductsScanned} sản phẩm, Phát hiện: ${data.result.outOfStockDetected} hết hàng (${data.result.durationMs}ms)`);
      } else {
        setActionMessage(`⚠️ ${data.message || 'Lỗi khi kích hoạt Cron'}`);
      }
    } catch (err: any) {
      setActionMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setTriggering(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<CronStatus['config']>) => {
    try {
      const res = await fetch('/api/v1/cron/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to update cron config:', err);
    }
  };

  const handleCopyPing = () => {
    const pingUrl = `${window.location.origin}/api/v1/cron/ping`;
    navigator.clipboard.writeText(pingUrl);
    setCopiedPingUrl(true);
    setTimeout(() => setCopiedPingUrl(false), 2500);
  };

  if (!status && loading) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse text-xs font-mono text-slate-400">
        Đang tải trạng thái Cron nền...
      </div>
    );
  }

  const isRunning = status?.isActive && !status?.isExecuting;
  const isExecuting = status?.isExecuting;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0b1329] via-[#090e1d] to-[#070b16] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.12)] space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Activity className={`w-5 h-5 ${isExecuting ? 'animate-spin text-amber-400' : 'animate-pulse'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black font-mono text-white tracking-wide uppercase">
                CRON DAEMON ĐỒNG BỘ KHO & PHÁT HIỆN HẾT HÀNG TỰ ĐỘNG
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isExecuting
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                  : isRunning
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/50'
              }`}>
                {isExecuting ? (
                  <>ĐANG QUÉT KHO...</>
                ) : isRunning ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    HOẠT ĐỘNG LIÊN TỤC
                  </>
                ) : (
                  <>ĐÃ TẮT</>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Định kỳ quét các Shop API nguồn, phát hiện tức thì sản phẩm vừa bán hết (stock = 0) và tự động cập nhật khóa mua.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerNow}
            disabled={triggering || isExecuting}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggering || isExecuting ? 'animate-spin' : ''}`} />
            <span>{triggering || isExecuting ? 'Đang quét kho...' : 'Quét Ngay Lập Tức'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification if any */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs font-mono animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Chu kỳ quét */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Chu Kỳ Quét</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <select
            value={status?.config.intervalSeconds || 60}
            onChange={e => handleUpdateConfig({ intervalSeconds: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs rounded-lg py-1 px-2 focus:outline-none focus:border-cyan-400"
          >
            <option value={30}>30 giây / lần (Rất nhanh)</option>
            <option value={60}>60 giây / lần (Chuẩn)</option>
            <option value={120}>2 phút / lần (Khuyên dùng - Cân bằng)</option>
            <option value={180}>3 phút / lần (An toàn IP)</option>
            <option value={300}>5 phút / lần (Tiết kiệm)</option>
          </select>
        </div>

        {/* Metric 2: Lần quét gần nhất */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Lần Quét Gần Nhất</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-mono font-bold text-white truncate">
            {status?.lastRunAt ? new Date(status.lastRunAt).toLocaleTimeString('vi-VN') : 'Đang chờ...'}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Tổng: {status?.totalRuns || 0} chu kỳ
          </div>
        </div>

        {/* Metric 3: Sản phẩm hết hàng */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Sản Phẩm Hết Hàng</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base font-mono font-black text-rose-400">
            {status?.totalOutOfStockFound || 0} sản phẩm
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Đã khóa mua tự động
          </div>
        </div>

        {/* Metric 4: Webhook Cron Ngoại */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>External Webhook</span>
            <Server className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <button
            type="button"
            onClick={handleCopyPing}
            className="w-full py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            {copiedPingUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedPingUrl ? 'Đã sao chép!' : 'Copy Link Ping'}</span>
          </button>
          <div className="text-[9px] font-mono text-slate-500 truncate">
            Hỗ trợ cron-job.org / curl
          </div>
        </div>
      </div>


      {/* Switches & Logs Accordion */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={status?.config.enabled ?? true}
              onChange={e => handleUpdateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-300">Bật chạy ngầm tự động</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={status?.config.autoHideOutOfStock ?? false}
              onChange={e => handleUpdateConfig({ autoHideOutOfStock: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-300">Tự động ẩn sản phẩm khỏi trang chủ khi hết hàng</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer"
        >
          {showLogs ? 'Ẩn nhật ký Cron' : `Xem nhật ký Cron (${status?.recentLogs?.length || 0})`}
        </button>
      </div>

      {/* Logs Table when expanded */}
      {showLogs && status?.recentLogs && status.recentLogs.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 max-h-56 overflow-y-auto">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Nhật ký các lần quét gần nhất:
          </div>
          <div className="space-y-1.5">
            {status.recentLogs.map(log => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    log.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                  <span className="text-white font-medium">{log.details}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-amber-400">{log.durationMs}ms</span>
                  {log.outOfStockDetected > 0 && (
                    <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                      {log.outOfStockDetected} hết hàng
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
