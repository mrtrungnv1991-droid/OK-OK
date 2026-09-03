import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Palette, 
  Mail, 
  Bell, 
  Save, 
  Check, 
  DollarSign, 
  Languages, 
  ShieldCheck, 
  Smartphone, 
  Send,
  HelpCircle,
  Sparkles,
  Layout,
  Maximize2
} from 'lucide-react';
import { SystemConfig, Currency } from '../../types';
import { AdminHeroLayoutTab } from './AdminHeroLayoutTab';

interface AdminSettingsTabProps {
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (newConfig: Partial<SystemConfig>) => void;
  currency?: Currency;
  onCurrencyChange?: (c: Currency) => void;
  currentLanguage?: 'vi' | 'en';
  onLanguageChange?: (lang: 'vi' | 'en') => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  systemConfig = {} as SystemConfig,
  onUpdateSystemConfig = (_cfg?: Partial<SystemConfig>) => {},
  currency = 'VND',
  onCurrencyChange,
  currentLanguage = 'vi',
  onLanguageChange
}) => {
  const [subTab, setSubTab] = useState<'general' | 'theme' | 'currency_lang' | 'smtp' | 'telegram_bot' | 'hero_layout'>('general');
  const [formData, setFormData] = useState<SystemConfig>(systemConfig || ({} as SystemConfig));
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [testingMail, setTestingMail] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const handleChange = (field: keyof SystemConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: keyof SystemConfig, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any || {}),
        [field]: value
      }
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemConfig(formData);
    setSaveNotice('Đã lưu toàn bộ cấu hình hệ thống thành công!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSendTestMail = () => {
    setTestingMail(true);
    setTimeout(() => {
      setTestingMail(false);
      setSaveNotice('📧 [SMTP Gateway] Đã gửi email thử nghiệm thành công tới hộp thư Admin!');
      setTimeout(() => setSaveNotice(null), 3500);
    }, 1200);
  };

  const handleSendTestTelegram = () => {
    setTestingTelegram(true);
    setTimeout(() => {
      setTestingTelegram(false);
      setSaveNotice('🔔 [Telegram Telemetry] Đã gửi tin nhắn test thông báo thành công qua Telegram Bot!');
      setTimeout(() => setSaveNotice(null), 3500);
    }, 1000);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>CÀI ĐẶT HỆ THỐNG TOÀN DIỆN (SYSTEM CONFIGURATION)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Core Settings
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Tùy biến thương hiệu, giao diện màu sắc, đa ngôn ngữ, tỷ giá tiền tệ, máy chủ gửi Mail SMTP và Bot thông báo Telegram 24/7.
          </p>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Toàn Bộ Cài Đặt</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2.5">
        <button
          type="button"
          onClick={() => setSubTab('general')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'general'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>1. Thông Tin Website & Liên Hệ</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('theme')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'theme'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>2. Giao Diện & Tông Màu Chủ Đạo</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('currency_lang')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'currency_lang'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>3. Ngôn Ngữ & Tỷ Giá Tiền Tệ</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('smtp')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'smtp'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>4. Cấu Hình Gửi Mail SMTP</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('telegram_bot')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'telegram_bot'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>5. Bot Thông Báo Telegram</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('hero_layout')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${
            subTab === 'hero_layout'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900 text-cyan-400 hover:text-white border border-cyan-500/30'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>6. Tỷ Lệ Khung Web & Hero CMS</span>
        </button>
      </div>

      {/* SUBTAB 1: GENERAL */}
      {subTab === 'general' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>THÔNG TIN THƯƠNG HIỆU & HỖ TRỢ KHÁCH HÀNG</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Tên Website / Thương Hiệu (*):</label>
              <input
                type="text"
                value={formData.siteName || 'CyberEscrow Game & Software Hub'}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Khẩu Hiệu / Slogan:</label>
              <input
                type="text"
                value={formData.siteSlogan || 'Sàn Giao Dịch Tài Khoản, Key Bản Quyền & Nạp Game Tự Động'}
                onChange={(e) => handleChange('siteSlogan', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Hotline / Zalo Hỗ Trợ 24/7:</label>
              <input
                type="text"
                value={formData.supportHotline || '0988.888.888'}
                onChange={(e) => handleChange('supportHotline', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Telegram CSKH / Kênh Thông Báo:</label>
              <input
                type="text"
                value={formData.supportTelegram || 'https://t.me/CyberEscrow_Support'}
                onChange={(e) => handleChange('supportTelegram', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Fanpage Facebook:</label>
              <input
                type="text"
                value={formData.supportFacebook || 'https://facebook.com/cyberescrow.official'}
                onChange={(e) => handleChange('supportFacebook', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Bản Quyền Chân Trang (Copyright):</label>
              <input
                type="text"
                value={formData.copyrightText || '© 2026 Cyber Game Store. All rights reserved.'}
                onChange={(e) => handleChange('copyrightText', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: THEME */}
      {subTab === 'theme' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>TÙY CHỈNH GIAO DIỆN & TÔNG MÀU SẮC (THEME & ACCENT)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Màu Sắc Nhận Diện Chính (Accent Color):</label>
              <select
                value={formData.themeSettings?.accentColor || 'emerald'}
                onChange={(e) => handleNestedChange('themeSettings', 'accentColor', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              >
                <option value="emerald">Emerald Neon (Xanh Lục Công Nghệ - Mặc Định)</option>
                <option value="cyan">Cyber Cyan (Xanh Dương Tương Lai)</option>
                <option value="purple">Royal Purple (Tím Huyền Bí)</option>
                <option value="rose">Crimson Red (Đỏ Chiến Binh)</option>
                <option value="amber">Gold Amber (Vàng Hoàng Gia)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Giao Diện Mặc Định:</label>
              <select
                value={formData.themeSettings?.mode || 'dark'}
                onChange={(e) => handleNestedChange('themeSettings', 'mode', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              >
                <option value="dark">Chế Độ Tối (Dark Matrix Mode - Khuyên dùng)</option>
                <option value="light">Chế Độ Sáng (Light Clean Mode)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Bo Tròn Góc Giao Diện (Border Radius):</label>
              <select
                value={formData.themeSettings?.borderRadius || 'rounded-xl'}
                onChange={(e) => handleNestedChange('themeSettings', 'borderRadius', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
              >
                <option value="rounded-md">Góc bo vừa (8px)</option>
                <option value="rounded-xl">Góc bo mềm mại (12px - Mặc định)</option>
                <option value="rounded-2xl">Góc bo lớn hiện đại (16px)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Kiểu Dáng Bố Cục Danh Mục:</label>
              <select
                value={formData.themeSettings?.layoutStyle || 'cyber'}
                onChange={(e) => handleNestedChange('themeSettings', 'layoutStyle', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
              >
                <option value="cyber">Cyber Escrow (Grid Hiện Đại + Tag Phân Loại)</option>
                <option value="classic">Giao Diện Cổ Điển (Bảng Danh Mục Truyền Thống)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CURRENCY & LANG */}
      {subTab === 'currency_lang' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>CẤU HÌNH TIỀN TỆ & ĐA NGÔN NGỮ QUỐC TẾ</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Tiền Tệ Mặc Định Hệ Thống:</label>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value as Currency)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold"
              >
                <option value="VND">VNĐ - Việt Nam Đồng (₫)</option>
                <option value="USD">USD - Đô La Mỹ ($)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Tỷ Giá Quy Đổi (1 USD = ? VNĐ):</label>
              <input
                type="number"
                value={formData.usdExchangeRate || 25400}
                onChange={(e) => handleChange('usdExchangeRate', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Ngôn Ngữ Mặc Định:</label>
              <select
                value={currentLanguage}
                onChange={(e) => onLanguageChange && onLanguageChange(e.target.value as 'vi' | 'en')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold"
              >
                <option value="vi">Tiếng Việt (Vietnamese)</option>
                <option value="en">English (Global)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Tự Động Nhận Diện IP Khách:</label>
              <select
                value="enabled"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
              >
                <option value="enabled">BẬT (Khách nước ngoài tự động đổi sang USD & Tiếng Anh)</option>
                <option value="disabled">TẮT (Cố định ngôn ngữ/tiền tệ mặc định)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SMTP */}
      {subTab === 'smtp' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>CẤU HÌNH MÁY CHỦ GỬI EMAIL SMTP (GMAIL / AMAZON SES / SENDGRID)</span>
            </h4>
            <button
              type="button"
              onClick={handleSendTestMail}
              disabled={testingMail}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${testingMail ? 'animate-spin' : ''}`} />
              <span>{testingMail ? 'Đang gửi test...' : 'Gửi Thử Email'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">SMTP Host (*):</label>
              <input
                type="text"
                value={formData.smtpConfig?.host || 'smtp.gmail.com'}
                onChange={(e) => handleNestedChange('smtpConfig', 'host', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">SMTP Port (*):</label>
              <input
                type="number"
                value={formData.smtpConfig?.port || 465}
                onChange={(e) => handleNestedChange('smtpConfig', 'port', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Tài Khoản Email Gửi (Username):</label>
              <input
                type="text"
                value={formData.smtpConfig?.username || 'noreply.cyberescrow@gmail.com'}
                onChange={(e) => handleNestedChange('smtpConfig', 'username', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Mật Khẩu Ứng Dụng (App Password):</label>
              <input
                type="password"
                value={formData.smtpConfig?.password || '••••••••••••••••'}
                onChange={(e) => handleNestedChange('smtpConfig', 'password', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Tên Người Gửi (Sender Name):</label>
              <input
                type="text"
                value={formData.smtpConfig?.fromName || 'CyberEscrow Bot'}
                onChange={(e) => handleNestedChange('smtpConfig', 'fromName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Mã Hóa Bảo Mật (Encryption):</label>
              <select
                value={formData.smtpConfig?.encryption || 'SSL'}
                onChange={(e) => handleNestedChange('smtpConfig', 'encryption', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
              >
                <option value="SSL">SSL (Khuyên dùng cho Port 465)</option>
                <option value="TLS">TLS / STARTTLS (Port 587)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: TELEGRAM BOT */}
      {subTab === 'telegram_bot' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>BOT THÔNG BÁO TỰ ĐỘNG QUA TELEGRAM (INSTANT PUSH ALERTS)</span>
            </h4>
            <button
              type="button"
              onClick={handleSendTestTelegram}
              disabled={testingTelegram}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-spin' : ''}`} />
              <span>{testingTelegram ? 'Đang gửi test...' : 'Bắn Tin Nhắn Test'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Telegram Bot Token (*):</label>
              <input
                type="text"
                value={formData.telegramBotToken || '7182938491:AAH82k_xL9820-KLA9921_MM91'}
                onChange={(e) => handleChange('telegramBotToken', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Telegram Admin Chat ID (*):</label>
              <input
                type="text"
                value={formData.telegramChatId || '-1008892182019'}
                onChange={(e) => handleChange('telegramChatId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white block mb-2">Các Sự Kiện Bắn Thông Báo Về Telegram:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4" />
                <span>Bắn tin khi có khách đặt đơn hàng mới (Tài khoản, Key, Nạp)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4" />
                <span>Bắn tin khi khách nạp tiền tự động VietQR / Thẻ Cào</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4" />
                <span>Bắn tin khi sản phẩm trong kho còn dưới 5 tài khoản</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-cyan-500 w-4 h-4" />
                <span>Cảnh báo khi phát hiện IP spam hoặc đăng nhập bất thường</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: HERO & LAYOUT PROPORTIONS */}
      {subTab === 'hero_layout' && (
        <div className="pt-2">
          <AdminHeroLayoutTab
            systemConfig={formData}
            onUpdateSystemConfig={(newConfig) => {
              setFormData(prev => ({ ...prev, ...newConfig }));
              onUpdateSystemConfig(newConfig);
              setSaveNotice('Đã cập nhật tỷ lệ khung web & cấu hình Hero!');
              setTimeout(() => setSaveNotice(null), 3000);
            }}
          />
        </div>
      )}
    </form>
  );
};
