import React, { useState } from 'react';
import { 
  Cpu, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Check, 
  Terminal, 
  Zap, 
  Database, 
  Bell, 
  CreditCard,
  RefreshCcw
} from 'lucide-react';
import { CronJobItem, CronExecutionLog } from '../../types';
import { INITIAL_CRON_JOBS, INITIAL_CRON_LOGS } from '../../data/systemExtendedData';

export const AdminAutomationCronTab: React.FC = () => {
  const [cronJobs, setCronJobs] = useState<CronJobItem[]>(INITIAL_CRON_JOBS);
  const [cronLogs, setCronLogs] = useState<CronExecutionLog[]>(INITIAL_CRON_LOGS);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleToggleJob = (id: string) => {
    setCronJobs(cronJobs.map(job => {
      if (job.id === id) {
        return { ...job, enabled: !job.enabled };
      }
      return job;
    }));
    setSaveNotice('Đã cập nhật trạng thái tiến trình Cron Job!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleExecuteNow = (job: CronJobItem) => {
    setRunningJobId(job.id);
    
    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN');
      
      const newLog: CronExecutionLog = {
        id: `clog-${Date.now()}`,
        jobId: job.id,
        jobName: job.name,
        status: 'success',
        message: `Kích hoạt thủ công bởi Admin lúc ${nowStr} thành công`,
        executionTimeMs: Math.floor(Math.random() * 150) + 50,
        timestamp: nowStr
      };

      setCronLogs([newLog, ...cronLogs]);
      setCronJobs(cronJobs.map(j => {
        if (j.id === job.id) {
          return {
            ...j,
            lastRunTime: nowStr,
            lastStatus: 'success',
            totalRuns: j.totalRuns + 1,
            lastLogMessage: `Kích hoạt thủ công: Quét xong và hoàn tất trong ${newLog.executionTimeMs}ms`
          };
        }
        return j;
      }));

      setRunningJobId(null);
      setSaveNotice(`Tiến trình "${job.name}" đã chạy hoàn tất!`);
      setTimeout(() => setSaveNotice(null), 3000);
    }, 800);
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'bank_auto_sync':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'telco_card_check':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'order_auto_cancel':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'low_stock_alert':
        return <Bell className="w-4 h-4 text-purple-400" />;
      case 'supplier_api_sync':
        return <RefreshCcw className="w-4 h-4 text-pink-400" />;
      case 'database_backup':
        return <Database className="w-4 h-4 text-blue-400" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>ĐỘNG CƠ TỰ ĐỘNG HÓA & TIẾN TRÌNH NỀN (CRON JOBS ENGINE)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Auto Worker
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Quản lý các tiến trình tự động: Quét biến động ngân hàng VietQR, kiểm tra thẻ cào TSR, hủy đơn gom quá hạn, cảnh báo tồn kho và đồng bộ API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Daemon Worker: RUNNING (6/6 Tác vụ)</span>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Cron Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cronJobs.map((job) => {
          const isRunning = runningJobId === job.id;
          return (
            <div key={job.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getTaskIcon(job.taskType)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{job.name}</h4>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-cyan-400 font-bold">{job.frequency}</span>
                      <span>•</span>
                      <span>Đã chạy: {job.totalRuns.toLocaleString()} lần</span>
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={job.enabled}
                    onChange={() => handleToggleJob(job.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Lần chạy gần nhất:</span>
                  <span className="text-slate-200">{job.lastRunTime}</span>
                </div>
                <div className="text-slate-500 truncate">
                  Log: <span className="text-slate-300 font-mono">{job.lastLogMessage}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                  job.lastStatus === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hoạt động bình thường</span>
                </span>

                <button
                  type="button"
                  disabled={isRunning || !job.enabled}
                  onClick={() => handleExecuteNow(job)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-[10px] ${
                    isRunning
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-cyan-300'
                  }`}
                >
                  <Play className={`w-3 h-3 ${isRunning ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{isRunning ? 'Đang Thực Thi...' : 'Chạy Ngay'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Logs */}
      <div className="space-y-2 pt-3">
        <h4 className="font-bold text-white text-xs flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>NHẬT KÝ THỰC THI GẦN NHẤT (CRON EXECUTION LOGS)</span>
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <th className="p-2.5">Thời Gian</th>
                <th className="p-2.5">Tác Vụ</th>
                <th className="p-2.5">Nội Dung Thực Thi</th>
                <th className="p-2.5">Thời Gian Xử Lý</th>
                <th className="p-2.5">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {cronLogs.map((log) => (
                <tr key={log.id}>
                  <td className="p-2.5 text-slate-400">{log.timestamp}</td>
                  <td className="p-2.5 font-bold text-cyan-300">{log.jobName}</td>
                  <td className="p-2.5 text-slate-200">{log.message}</td>
                  <td className="p-2.5 font-bold text-amber-400">{log.executionTimeMs}ms</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                      SUCCESS (200 OK)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
