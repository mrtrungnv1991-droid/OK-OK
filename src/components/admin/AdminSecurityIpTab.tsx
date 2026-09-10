import React, { useState } from 'react';
import { 
  Shield,
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  Plus, 
  Trash2, 
  Globe, 
  Lock, 
  Check, 
  AlertTriangle, 
  Search, 
  Terminal, 
  RefreshCw,
  EyeOff,
  Bell,
  Send,
  Filter,
  Activity,
  FileText
} from 'lucide-react';
import { BlockedIPItem, SystemConfig, AuditLog } from '../../types';
import { INITIAL_BLOCKED_IPS } from '../../data/systemExtendedData';
import { INITIAL_AUDIT_LOGS } from '../../data/systemAdminData';

interface AdminSecurityIpTabProps {
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (config: Partial<SystemConfig>) => void;
}

export const AdminSecurityIpTab: React.FC<AdminSecurityIpTabProps> = ({
  systemConfig = {} as SystemConfig,
  onUpdateSystemConfig = (_cfg?: Partial<SystemConfig>) => {}
}) => {
  const [subTab, setSubTab] = useState<'blocked_ips' | 'country_block' | 'firewall_settings' | 'telegram_bot' | 'audit_logs'>('blocked_ips');
  const [blockedList, setBlockedList] = useState<BlockedIPItem[]>(INITIAL_BLOCKED_IPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIpInput, setNewIpInput] = useState('');
  const [newReasonInput, setNewReasonInput] = useState('');
  const [newTypeInput, setNewTypeInput] = useState<'manual_block' | 'subnet_cidr'>('manual_block');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [ipToUnblock, setIpToUnblock] = useState<BlockedIPItem | null>(null);

  // Geo Block state
  const [selectedCountries, setSelectedCountries] = useState<string[]>(systemConfig?.geoBlockCountries || ['CN', 'RU', 'KP']);

  // Audit Logs state
  const [logs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Telegram Bot state
  const [telegramForm, setTelegramForm] = useState({
    telegramBotToken: systemConfig?.telegramBotToken || '7182938491:AAH8s9f2kLk9901MNaK9',
    telegramChatId: systemConfig?.telegramChatId || '-1002938481920',
    enableTelegramAlerts: systemConfig?.enableTelegramAlerts !== false,
    alertOnNewOrder: systemConfig?.alertOnNewOrder !== false,
    alertOnNewDeposit: systemConfig?.alertOnNewDeposit !== false,
    alertOnNewUser: systemConfig?.alertOnNewUser !== false,
    alertOnTicket: systemConfig?.alertOnTicket !== false
  });

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemConfig(telegramForm);
    setSaveNotice('Đã lưu cấu hình Bot Telegram thông báo tự động!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSendTestTelegram = () => {
    setSaveNotice('🔔 [Security Telemetry] Đã gửi thông báo thử nghiệm tới Telegram Chat ID: ' + telegramForm.telegramChatId);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.adminUser.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.ipAddress.includes(logSearchTerm);
    const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const filteredIps = blockedList.filter(item => 
    (item.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.blockedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBlockedIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpInput.trim()) return;

    const newItem: BlockedIPItem = {
      id: `bip-${Date.now()}`,
      ipAddress: newIpInput.trim(),
      reason: newReasonInput.trim() || 'Chặn thủ công bởi Quản Trị Viên',
      type: newTypeInput,
      blockedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      blockedBy: 'Root_SuperAdmin',
      requestCountBlocked: 0
    };

    setBlockedList([newItem, ...blockedList]);
    setNewIpInput('');
    setNewReasonInput('');
    setSaveNotice(`Đã thêm IP/Dải IP "${newItem.ipAddress}" vào danh sách đen (Blacklist)!`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleUnblockIp = (item: BlockedIPItem) => {
    setIpToUnblock(item);
  };

  const confirmUnblockIp = () => {
    if (!ipToUnblock) return;
    setBlockedList(blockedList.filter(i => i.id !== ipToUnblock.id));
    setSaveNotice(`Đã mở khóa IP ${ipToUnblock.ipAddress} thành công!`);
    setIpToUnblock(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleToggleCountry = (code: string) => {
    let updated: string[];
    if (selectedCountries.includes(code)) {
      updated = selectedCountries.filter(c => c !== code);
    } else {
      updated = [...selectedCountries, code];
    }
    setSelectedCountries(updated);
    onUpdateSystemConfig({ geoBlockCountries: updated });
    setSaveNotice('Đã cập nhật danh sách quốc gia bị chặn GeoIP!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const countriesList = [
    { code: 'CN', name: 'Trung Quốc (China)', flag: '🇨🇳' },
    { code: 'RU', name: 'Nga (Russia)', flag: '🇷🇺' },
    { code: 'KP', name: 'Triều Tiên (North Korea)', flag: '🇰🇵' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷' },
    { code: 'US', name: 'Hoa Kỳ (United States)', flag: '🇺🇸' },
    { code: 'IN', name: 'Ấn Độ (India)', flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' }
  ];

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>TƯỜNG LỬA BẢO MẬT & BLOCK IP BLACKLIST ({blockedList.length} ĐANG CHẶN)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30">
              WAF Guard
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Ngăn chặn tấn công DDoS, tự động khóa IP Brute-Force mật khẩu, chặn dải IP Subnet CIDR và chặn theo Quốc Gia (GeoIP).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            systemConfig?.antiDdosMode ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-DDOS Shield: {systemConfig?.antiDdosMode ? 'BẬT (Active)' : 'TẮT'}</span>
          </span>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-rose-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setSubTab('blocked_ips')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'blocked_ips'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Danh Sách IP & Subnet Bị Khóa ({blockedList.length})</span>
        </button>

        <button
          onClick={() => setSubTab('country_block')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'country_block'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Chặn Theo Quốc Gia (GeoIP Block)</span>
        </button>

        <button
          onClick={() => setSubTab('firewall_settings')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'firewall_settings'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Cấu Hình Tường Lửa & Chống F12</span>
        </button>

        <button
          onClick={() => setSubTab('telegram_bot')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'telegram_bot'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Telegram Bot Cảnh Báo</span>
        </button>

        <button
          onClick={() => setSubTab('audit_logs')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'audit_logs'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Nhật Ký Kiểm Toán ({logs.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: BLOCKED IPS */}
      {subTab === 'blocked_ips' && (
        <div className="space-y-4">
          {/* Form Add IP */}
          <form onSubmit={handleAddBlockedIp} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-400" />
              <span>THÊM IP HOẶC DẢI SUBNET CIDR CẦN KHÓA VĨNH VIỄN</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <input
                  type="text"
                  required
                  value={newIpInput}
                  onChange={(e) => setNewIpInput(e.target.value)}
                  placeholder="VD: 103.149.130.80 hoặc 192.168.1.0/24"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs"
                >
                  <option value="manual_block">IP Đơn Lẻ (Single IP)</option>
                  <option value="subnet_cidr">Dải Mạng (Subnet CIDR /24)</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={newReasonInput}
                  onChange={(e) => setNewReasonInput(e.target.value)}
                  placeholder="Lý do khóa (VD: Spam nạp thẻ, hack API)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Khóa IP Này Ngay</span>
              </button>
            </div>
          </form>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm IP, lý do, người khóa..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase">
                  <th className="p-3">Địa Chỉ IP / CIDR</th>
                  <th className="p-3">Loại Khóa</th>
                  <th className="p-3">Lý Do Khóa & Nhật Ký</th>
                  <th className="p-3">Thời Gian Khóa</th>
                  <th className="p-3">Số Request Bị Chặn</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredIps.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-rose-400 font-mono flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-rose-500" />
                        <span>{item.ipAddress}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'subnet_cidr' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' : 'bg-slate-900 text-slate-300'
                      }`}>
                        {item.type === 'subnet_cidr' ? 'Dải Mạng CIDR' : item.type === 'auto_bruteforce' ? 'Tự Động Brute-Force' : 'Thủ Công'}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="text-slate-200">{item.reason}</div>
                      <div className="text-[10px] text-slate-500">Người khóa: {item.blockedBy}</div>
                    </td>

                    <td className="p-3 text-slate-400">
                      {item.blockedAt}
                    </td>

                    <td className="p-3 font-bold text-amber-400">
                      {item.requestCountBlocked?.toLocaleString() || 0} req
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleUnblockIp(item)}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300 font-bold cursor-pointer text-[10px]"
                      >
                        Mở Khóa IP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: COUNTRY BLOCK */}
      {subTab === 'country_block' && (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-rose-400" />
            <span>CHẶN TRUY CẬP THEO QUỐC GIA (GEO-IP BLACKLIST)</span>
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Người dùng từ các quốc gia được chọn sẽ bị từ chối truy cập ngay tại tầng Cloudflare/WAF với thông báo lỗi 403 Forbidden.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {countriesList.map((c) => {
              const isBlocked = selectedCountries.includes(c.code);
              return (
                <button
                  key={c.code}
                  onClick={() => handleToggleCountry(c.code)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isBlocked
                      ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-bold text-xs">{c.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isBlocked ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                    {isBlocked ? 'CHẶN' : 'CHO PHÉP'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: FIREWALL SETTINGS */}
      {subTab === 'firewall_settings' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>CẤU HÌNH TƯỜNG LỬA CHỐNG SPAM & BẢO MẬT GIAO DIỆN</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Bật Chế Độ Anti-DDOS Layer 7:</span>
                <input
                  type="checkbox"
                  checked={systemConfig?.antiDdosMode || false}
                  onChange={(e) => onUpdateSystemConfig({ antiDdosMode: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Tự động kích hoạt Challenge JavaScript nếu lưu lượng request tăng đột biến vượt ngưỡng an toàn.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Khóa Phím F12 & Chuột Phải:</span>
                <input
                  type="checkbox"
                  checked={systemConfig?.antiF12Inspect || false}
                  onChange={(e) => onUpdateSystemConfig({ antiF12Inspect: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Chống F12, Ctrl+U (View Source), Ctrl+Shift+I và vô hiệu hóa click chuột phải để chống copy mã nguồn.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Chặn Truy Cập Qua Proxy / VPN:</span>
                <input
                  type="checkbox"
                  checked={systemConfig?.antiProxyVpn || false}
                  onChange={(e) => onUpdateSystemConfig({ antiProxyVpn: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Kiểm tra IP Header và chặn các IP phát hiện là DataCenter / Tor / VPN ẩn danh nạp thẻ giả.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="font-bold text-white block">Giới Hạn Request Tối Đa / Phút:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={systemConfig?.maxRequestsPerMinute || 60}
                  onChange={(e) => onUpdateSystemConfig({ maxRequestsPerMinute: Number(e.target.value) })}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                />
                <span className="text-slate-400 font-bold">req / phút / IP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: TELEGRAM BOT ALERTS */}
      {subTab === 'telegram_bot' && (
        <form onSubmit={handleSaveTelegram} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs">CẤU HÌNH BOT TELEGRAM THÔNG BÁO TỨC THÌ (ZERO-DROP)</span>
            </div>
            <button
              type="button"
              onClick={handleSendTestTelegram}
              className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Bắn Test Thông Báo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-bold">Telegram Bot Token (@BotFather):</label>
              <input
                type="text"
                value={telegramForm.telegramBotToken}
                onChange={(e) => setTelegramForm({ ...telegramForm, telegramBotToken: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-bold">Telegram Chat ID / Group ID:</label>
              <input
                type="text"
                value={telegramForm.telegramChatId}
                onChange={(e) => setTelegramForm({ ...telegramForm, telegramChatId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono mt-1 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white uppercase">CÁC SỰ KIỆN GỬI THÔNG BÁO TỚI TELEGRAM:</div>
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
                <span className="text-white text-xs">Thông báo khi có Nạp Tiền VietQR / Auto Card</span>
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
                <span className="text-white text-xs">Thông báo khi có Ticket Khiếu Nại / Hỗ Trợ</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer transition-all"
            >
              Lưu Cấu Hình Telegram
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 5: AUDIT LOGS */}
      {subTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                placeholder="Tìm log theo quản trị viên, hành động hoặc IP..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-rose-500"
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
                  <th className="p-3">Phân Hệ</th>
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
      {/* CONFIRM UNBLOCK IP MODAL */}
      {ipToUnblock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Xác Nhận Mở Khóa IP</h3>
                <p className="text-xs text-slate-400">Gỡ địa chỉ IP này khỏi danh sách tường lửa chặn</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-100 font-mono font-bold text-sm text-emerald-400">
                {ipToUnblock.ipAddress}
              </div>
              <div className="text-slate-400 text-[11px]">
                Lý do chặn trước đó: <span className="text-slate-300">{ipToUnblock.reason}</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Thời gian khóa: <span className="text-slate-300">{ipToUnblock.blockedAt}</span> • Đã chặn: <span className="text-amber-400">{ipToUnblock.requestCountBlocked} request</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIpToUnblock(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={confirmUnblockIp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Mở Khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
