import React, { useState } from 'react';
import { 
  History, 
  Search, 
  DollarSign, 
  Key, 
  Globe, 
  Smartphone, 
  Monitor, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft,
  FileCode,
  Calendar
} from 'lucide-react';
import { BalanceLogItem, LoginHistoryItem, WebhookLogItem, Currency } from '../../types';
import { INITIAL_BALANCE_LOGS, INITIAL_LOGIN_LOGS, INITIAL_WEBHOOK_LOGS } from '../../data/systemExtendedData';
import { formatCurrency } from '../../utils/formatters';

interface AdminHistoryLogsTabProps {
  currency?: Currency;
}

export const AdminHistoryLogsTab: React.FC<AdminHistoryLogsTabProps> = ({ currency = 'VND' }) => {
  const [subTab, setSubTab] = useState<'balance' | 'login' | 'webhook'>('balance');
  const [balanceLogs, setBalanceLogs] = useState<BalanceLogItem[]>(INITIAL_BALANCE_LOGS);
  const [loginLogs, setLoginLogs] = useState<LoginHistoryItem[]>(INITIAL_LOGIN_LOGS);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>(INITIAL_WEBHOOK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBalanceLogs = balanceLogs.filter(b => 
    b.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.referenceCode && b.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLoginLogs = loginLogs.filter(l => 
    l.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ipAddress.includes(searchTerm) ||
    l.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWebhookLogs = webhookLogs.filter(w => 
    w.gateway.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.payloadSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.ipSender.includes(searchTerm)
  );

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-wide">
            <History className="w-4 h-4 text-emerald-400" />
            <span>NHẬT KÝ LỊCH SỬ TOÀN DIỆN (SYSTEM AUDIT & TRANSACTION LOGS)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-medium">
              Audit Engine
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi chi tiết: Lịch sử biến động số dư thành viên, Lịch sử đăng nhập & thiết bị, và Lịch sử Webhook Callback từ các cổng thanh toán.
          </p>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setSubTab('balance')}
          className={`px-3.5 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer text-xs transition-colors ${
            subTab === 'balance'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Biến Động Số Dư ({balanceLogs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('login')}
          className={`px-3.5 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer text-xs transition-colors ${
            subTab === 'login'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Lịch Sử Đăng Nhập ({loginLogs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('webhook')}
          className={`px-3.5 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer text-xs transition-colors ${
            subTab === 'webhook'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Nhật Ký Webhook Callback ({webhookLogs.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm trong nhật ký (Tên user, IP, lý do, mã đơn)..."
          className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* SUBTAB 1: BALANCE LOGS */}
      {subTab === 'balance' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap w-44">Thời Gian / Mã</th>
                <th className="py-3 px-4 whitespace-nowrap w-40">Thành Viên</th>
                <th className="py-3 px-4 whitespace-nowrap w-32">Số Dư Trước</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">Thay Đổi (+/-)</th>
                <th className="py-3 px-4 whitespace-nowrap w-32">Số Dư Sau</th>
                <th className="py-3 px-4 min-w-[200px]">Lý Do / Hành Động</th>
                <th className="py-3 px-4 whitespace-nowrap w-36 text-right">Địa Chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBalanceLogs.map((log) => {
                const isPositive = log.amountChanged > 0;
                return (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white font-mono text-xs">{log.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{log.timestamp}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-cyan-300">@{log.username}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {log.userId}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {formatCurrency(log.balanceBefore, currency)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`font-bold font-mono inline-flex items-center gap-1 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        <span>{isPositive ? '+' : ''}{formatCurrency(log.amountChanged, currency)}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {formatCurrency(log.balanceAfter, currency)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-normal leading-relaxed">{log.description}</div>
                      {log.referenceCode && (
                        <div className="text-[11px] text-purple-400 font-mono mt-0.5">Mã liên kết: {log.referenceCode}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-xs text-right whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 2: LOGIN LOGS */}
      {subTab === 'login' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap w-44">Thời Gian</th>
                <th className="py-3 px-4 whitespace-nowrap w-40">Tài Khoản</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">Địa Chỉ IP</th>
                <th className="py-3 px-4 whitespace-nowrap w-44">Vị Trí (GeoIP)</th>
                <th className="py-3 px-4 min-w-[260px]">Thiết Bị & Trình Duyệt</th>
                <th className="py-3 px-4 whitespace-nowrap w-52 text-right">Kết Quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLoginLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                    @{log.username}
                  </td>

                  <td className="py-3 px-4 text-cyan-400 font-semibold font-mono whitespace-nowrap">
                    {log.ipAddress}
                  </td>

                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    {log.location}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                      {log.deviceType === 'Mobile' ? (
                        <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <span>{log.deviceType}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm mt-0.5" title={log.userAgent}>
                      {log.userAgent}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-semibold whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đăng nhập thành công</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-semibold whitespace-nowrap">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Sai mật khẩu / Khóa</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 3: WEBHOOK LOGS */}
      {subTab === 'webhook' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap w-44">Thời Gian</th>
                <th className="py-3 px-4 whitespace-nowrap w-48">Cổng Thanh Toán / API</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">IP Người Gửi</th>
                <th className="py-3 px-4 min-w-[280px]">Nội Dung Dữ Liệu (Payload)</th>
                <th className="py-3 px-4 whitespace-nowrap w-36 text-right">Mã Phản Hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWebhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-400 whitespace-nowrap">
                    {log.gateway}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                    {log.ipSender}
                  </td>
                  <td className="py-3 px-4">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs truncate max-w-lg">
                      {log.payloadSummary}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-semibold font-mono whitespace-nowrap">
                      HTTP {log.responseStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
