import React, { useState } from 'react';
import { 
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
  EyeOff
} from 'lucide-react';
import { BlockedIPItem, SystemConfig } from '../../types';
import { INITIAL_BLOCKED_IPS } from '../../data/systemExtendedData';

interface AdminSecurityIpTabProps {
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (config: Partial<SystemConfig>) => void;
}

export const AdminSecurityIpTab: React.FC<AdminSecurityIpTabProps> = ({
  systemConfig = {} as SystemConfig,
  onUpdateSystemConfig = (_cfg?: Partial<SystemConfig>) => {}
}) => {
  const [subTab, setSubTab] = useState<'blocked_ips' | 'country_block' | 'firewall_settings'>('blocked_ips');
  const [blockedList, setBlockedList] = useState<BlockedIPItem[]>(INITIAL_BLOCKED_IPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIpInput, setNewIpInput] = useState('');
  const [newReasonInput, setNewReasonInput] = useState('');
  const [newTypeInput, setNewTypeInput] = useState<'manual_block' | 'subnet_cidr'>('manual_block');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Geo Block state
  const [selectedCountries, setSelectedCountries] = useState<string[]>(systemConfig?.geoBlockCountries || ['CN', 'RU', 'KP']);

  const filteredIps = blockedList.filter(item => 
    item.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.blockedBy.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleUnblockIp = (id: string, ip: string) => {
    if (!confirm(`Bạn có chắc muốn MỞ KHÓA cho IP ${ip}?`)) return;
    setBlockedList(blockedList.filter(i => i.id !== id));
    setSaveNotice(`Đã mở khóa IP ${ip} thành công!`);
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
                        onClick={() => handleUnblockIp(item.id, item.ipAddress)}
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
    </div>
  );
};
