import React, { useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Lock, 
  Eye, 
  Bell, 
  Send, 
  Search, 
  Filter, 
  Save, 
  Check, 
  Trash2, 
  PlusCircle, 
  AlertTriangle, 
  Terminal, 
  Activity,
  CheckCircle2,
  Server
} from 'lucide-react';
import { AuditLog, SystemConfig } from '../../types';
import { INITIAL_AUDIT_LOGS } from '../../data/systemAdminData';

interface AdminAuditSecurityTabProps {
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (newConfig: Partial<SystemConfig>) => void;
}

export const AdminAuditSecurityTab: React.FC<AdminAuditSecurityTabProps> = ({
  systemConfig = {} as SystemConfig,
  onUpdateSystemConfig = (_cfg?: Partial<SystemConfig>) => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit_logs' | 'security_ddos' | 'telegram_bot'>('audit_logs');
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Security Form State
  const [antiDdosMode, setAntiDdosMode] = useState(systemConfig?.antiDdosMode !== false);
  const [antiF12Inspect, setAntiF12Inspect] = useState(systemConfig?.antiF12Inspect ?? true);
  const [maxRequestsPerMinute, setMaxRequestsPerMinute] = useState(systemConfig?.maxRequestsPerMinute || 120);
  const [ipBlacklist, setIpBlacklist] = useState<string[]>(systemConfig?.ipBlacklist || ['45.154.255.80', '194.38.20.11']);
  const [newIpInput, setNewIpInput] = useState('');

  // Telegram Bot Form State
  const [telegramForm, setTelegramForm] = useState({
    telegramBotToken: systemConfig?.telegramBotToken || '7182938491:AAH8s9f2kLk9901MNaK9',
    telegramChatId: systemConfig?.telegramChatId || '-1002938481920',
    enableTelegramAlerts: systemConfig?.enableTelegramAlerts !== false,
    alertOnNewOrder: systemConfig?.alertOnNewOrder !== false,
    alertOnNewDeposit: systemConfig?.alertOnNewDeposit !== false,
    alertOnNewUser: systemConfig?.alertOnNewUser !== false,
    alertOnTicket: systemConfig?.alertOnTicket !== false
  });

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemConfig({
      antiDdosMode,
      antiF12Inspect,
      maxRequestsPerMinute,
      ipBlacklist
    });
    setSaveNotice('Đã cập nhật cấu hình bảo mật & Anti-DDOS thành công!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemConfig(telegramForm);
    setSaveNotice('Đã lưu cấu hình Bot Telegram Thông Báo tự động!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleAddIpBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpInput.trim()) return;
    if (!ipBlacklist.includes(newIpInput.trim())) {
      setIpBlacklist([...ipBlacklist, newIpInput.trim()]);
      setNewIpInput('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    setIpBlacklist(ipBlacklist.filter(i => i !== ip));
  };

  const handleSendTestTelegram = () => {
    setSaveNotice('🔔 [Security Telemetry] Đã gửi thông báo thử nghiệm tới Telegram Chat ID: ' + telegramForm.telegramChatId);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.adminUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header & Sub-tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <span>NHẬT KÝ HOẠT ĐỘNG & BẢO MẬT HỆ THỐNG ({logs.length} LOGS)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-500/30">
              System Security
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Audit trail hành động quản trị, cấu hình tường lửa Anti-DDOS/Anti-F12 và Bot Telegram thông báo.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => setActiveSubTab('audit_logs')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
              activeSubTab === 'audit_logs'
                ? 'bg-red-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveSubTab('security_ddos')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
              activeSubTab === 'security_ddos'
                ? 'bg-red-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Anti-DDOS & IP Firewall
          </button>
          <button
            onClick={() => setActiveSubTab('telegram_bot')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
              activeSubTab === 'telegram_bot'
                ? 'bg-red-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Telegram Bot Alerts
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-red-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* SUB-TAB 1: AUDIT LOGS */}
      {activeSubTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm log theo quản trị viên, hành động hoặc IP..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"
              >
                <option value="all">Tất cả modules</option>
                <option value="banking">Nạp tiền & Ngân hàng</option>
                <option value="members">Thành viên & Số dư</option>
                <option value="products">Sản phẩm & Kho Key</option>
                <option value="orders">Đơn hàng & Bảo hành</option>
                <option value="security">Bảo mật & Tường lửa</option>
                <option value="vouchers">Khuyến mãi & Minigame</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Mã Log / Thời Gian</th>
                  <th className="p-3">Người Thực Hiện</th>
                  <th className="p-3">Phân Hệ (Module)</th>
                  <th className="p-3">Hành Động</th>
                  <th className="p-3">Nội Dung Chi Tiết</th>
                  <th className="p-3 text-right">IP Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-bold text-slate-300">
                      <div>{log.id}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{log.timestamp}</div>
                    </td>
                    <td className="p-3 font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                        {log.adminUser}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 uppercase text-[9px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-400">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-300 font-sans">
                      {log.details}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ANTI-DDOS & IP FIREWALL */}
      {activeSubTab === 'security_ddos' && (
        <form onSubmit={handleSaveSecurity} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-white text-xs">CHẾ ĐỘ ANTI-DDOS LAYER 7 SHIELD</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30 text-[10px]">
                  Cloudflare & WAF
                </span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={antiDdosMode}
                    onChange={(e) => setAntiDdosMode(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 bg-slate-900"
                  />
                  <div>
                    <div className="text-white font-bold text-xs">Bật Tường Lửa Chống DDOS / Flood Request</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tự động phát hiện botnet và yêu cầu thử thách xác minh khi có lượng truy cập đột biến.</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={antiF12Inspect}
                    onChange={(e) => setAntiF12Inspect(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 bg-slate-900"
                  />
                  <div>
                    <div className="text-white font-bold text-xs">Khóa Phím F12 & Chuột Phải (Inspect Element)</div>
                    <div className="text-[10px] text-slate-400 font-sans">Ngăn chặn xem mã nguồn trang web, copy text và mở DevTools trình duyệt.</div>
                  </div>
                </label>

                <div>
                  <label className="text-[11px] text-slate-400">Giới Hạn Tối Đa Request/Phút Mỗi IP:</label>
                  <input
                    type="number"
                    value={maxRequestsPerMinute}
                    onChange={(e) => setMaxRequestsPerMinute(parseInt(e.target.value) || 120)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-red-400 font-bold mt-1 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* IP Blacklist */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">DANH SÁCH IP BỊ CHẶN (IP BLACKLIST)</span>
                </div>
                <span className="text-[10px] text-slate-500">{ipBlacklist.length} IP đang bị cấm</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIpInput}
                  onChange={(e) => setNewIpInput(e.target.value)}
                  placeholder="Nhập địa chỉ IPv4 (VD: 45.154.255.80)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddIpBlacklist}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
                >
                  + Chặn IP
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {ipBlacklist.map(ip => (
                  <div key={ip} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-red-400 font-mono font-bold">{ip}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(ip)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      title="Gỡ chặn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình Tường Lửa Bảo Mật</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: TELEGRAM BOT ALERTS */}
      {activeSubTab === 'telegram_bot' && (
        <form onSubmit={handleSaveTelegram} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs">CẤU HÌNH BOT TELEGRAM THÔNG BÁO TỰ ĐỘNG</span>
              </div>
              <button
                type="button"
                onClick={handleSendTestTelegram}
                className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 text-[10px] cursor-pointer flex items-center gap-1"
              >
                <Bell className="w-3 h-3" />
                <span>Bắn Test Thông Báo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Telegram Bot Token (@BotFather):</label>
                <input
                  type="text"
                  value={telegramForm.telegramBotToken}
                  onChange={(e) => setTelegramForm({ ...telegramForm, telegramBotToken: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Telegram Chat ID / Group Channel ID:</label>
                <input
                  type="text"
                  value={telegramForm.telegramChatId}
                  onChange={(e) => setTelegramForm({ ...telegramForm, telegramChatId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono mt-1 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white uppercase">CÁC SỰ KIỆN GỬI THÔNG BÁO VỀ TELEGRAM:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramForm.alertOnNewOrder}
                    onChange={(e) => setTelegramForm({ ...telegramForm, alertOnNewOrder: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900"
                  />
                  <span className="text-white text-xs">Thông báo khi có Đơn Mua Hàng Mới</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramForm.alertOnNewDeposit}
                    onChange={(e) => setTelegramForm({ ...telegramForm, alertOnNewDeposit: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900"
                  />
                  <span className="text-white text-xs">Thông báo khi có Thành Viên Nạp Tiền (VietQR / Thẻ)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramForm.alertOnNewUser}
                    onChange={(e) => setTelegramForm({ ...telegramForm, alertOnNewUser: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900"
                  />
                  <span className="text-white text-xs">Thông báo khi có Thành Viên Mới Đăng Ký</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramForm.alertOnTicket}
                    onChange={(e) => setTelegramForm({ ...telegramForm, alertOnTicket: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900"
                  />
                  <span className="text-white text-xs">Thông báo khi có Ticket Khiếu Nại / Yêu Cầu Bảo Hành</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình Bot Telegram</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
