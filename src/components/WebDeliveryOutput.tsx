import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Link as LinkIcon, 
  Gift, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { DeliveryBranch } from '../types';

interface WebDeliveryOutputProps {
  branch?: DeliveryBranch | string;
  rawKey?: string;
  accountCredentials?: {
    username?: string;
    password?: string;
    cookie?: string;
    extra?: string;
  };
  inviteLink?: string;
  giftCardInfo?: {
    cardNumber?: string;
    pinCode?: string;
    balance?: number;
    currency?: string;
  };
  productTitle?: string;
  className?: string;
}

export const detectDeliveryBranch = (
  explicitBranch?: DeliveryBranch | string,
  productTitle: string = '',
  rawKeyInput: string = '',
  options?: { hasInviteLink?: boolean; hasGiftCard?: boolean; hasCredentials?: boolean }
): DeliveryBranch => {
  if (explicitBranch === 'ACCOUNT' || explicitBranch === 'KEY' || explicitBranch === 'LINK' || explicitBranch === 'GIFTCARD') {
    return explicitBranch as DeliveryBranch;
  }
  const title = (productTitle || '').toLowerCase();
  const rawKey = (rawKeyInput || '').trim();
  const t = `${title} ${rawKey.toLowerCase()}`;
  if (options?.hasInviteLink || rawKey.startsWith('http://') || rawKey.startsWith('https://') || t.includes('link') || t.includes('invite')) {
    return 'LINK';
  }
  if (options?.hasGiftCard || t.includes('gift') || t.includes('thẻ') || t.includes('card') || t.includes('pin:')) {
    return 'GIFTCARD';
  }
  if (options?.hasCredentials || t.includes('user:') || t.includes('cookie') || rawKey.includes(':') || rawKey.includes('|') || t.includes('acc') || t.includes('tài khoản') || t.includes('blox')) {
    return 'ACCOUNT';
  }
  return 'KEY';
};

export const WebDeliveryOutput: React.FC<WebDeliveryOutputProps> = ({
  branch: explicitBranch,
  rawKey = '',
  accountCredentials,
  inviteLink: explicitInviteLink,
  giftCardInfo,
  productTitle = '',
  className = ''
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-detect branch if not explicitly provided
  const activeBranch = detectDeliveryBranch(explicitBranch, productTitle, rawKey, {
    hasInviteLink: !!explicitInviteLink,
    hasGiftCard: !!giftCardInfo,
    hasCredentials: !!(accountCredentials?.username || accountCredentials?.password)
  });

  const handleCopy = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Helper parser for raw string if structured fields aren't pre-filled
  const parseRawAccount = () => {
    if (accountCredentials?.username || accountCredentials?.password) {
      return accountCredentials;
    }
    const str = rawKey || '';
    const parts = str.includes('|') ? str.split('|') : str.split(':');
    let username = '';
    let password = '';
    let cookie = '';
    
    if (parts.length >= 2) {
      username = parts[0].trim().replace(/^User:\s*/i, '').replace(/^Email:\s*/i, '');
      password = parts[1].trim().replace(/^Pass:\s*/i, '').replace(/^Password:\s*/i, '');
      if (parts.length >= 3) {
        cookie = parts.slice(2).join(str.includes('|') ? '|' : ':').trim().replace(/^Cookie:\s*/i, '');
      }
    } else {
      username = str.trim();
    }
    return { username, password, cookie };
  };

  // 1. ACCOUNT BRANCH OUTPUT
  if (activeBranch === 'ACCOUNT') {
    const creds = parseRawAccount();
    const fullFormatted = [creds.username, creds.password, creds.cookie].filter(Boolean).join(':');

    return (
      <div className={`space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 ${className}`}>
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <User className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Phân Nhánh: Tài Khoản (Account)
              </span>
              <p className="text-xs text-slate-300">Định dạng chuẩn: Tên đăng nhập / Mật khẩu / Cookie</p>
            </div>
          </div>
          <button
            onClick={() => handleCopy(rawKey || fullFormatted, 'all')}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            {copiedField === 'all' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedField === 'all' ? 'Đã sao chép cả bộ' : 'Sao chép tất cả'}</span>
          </button>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Username / Email Field */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300">Tên Đăng Nhập / Email</span>
              <button
                onClick={() => handleCopy(creds.username, 'user')}
                className="text-[11px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {copiedField === 'user' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedField === 'user' ? 'Đã chép' : 'Chép'}
              </button>
            </div>
            <div className="font-mono text-sm text-white select-all break-all font-semibold">
              {creds.username || '(Không có)'}
            </div>
          </div>

          {/* Password Field */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300">Mật Khẩu (Password)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-300 hover:text-white"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleCopy(creds.password, 'pass')}
                  className="text-[11px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {copiedField === 'pass' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedField === 'pass' ? 'Đã chép' : 'Chép'}
                </button>
              </div>
            </div>
            <div className="font-mono text-sm text-white select-all font-semibold">
              {creds.password ? (showPassword ? creds.password : '••••••••••••') : '(Trống)'}
            </div>
          </div>
        </div>

        {/* Cookie / 2FA / Extra Field (if exists) */}
        {creds.cookie && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300">Mã Cookie / 2FA / Token Đăng Nhập</span>
              <button
                onClick={() => handleCopy(creds.cookie, 'cookie')}
                className="text-[11px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {copiedField === 'cookie' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedField === 'cookie' ? 'Đã chép' : 'Chép Cookie'}
              </button>
            </div>
            <div className="font-mono text-xs text-slate-300 max-h-20 overflow-y-auto break-all bg-slate-950/60 p-2 rounded border border-slate-800">
              {creds.cookie}
            </div>
          </div>
        )}

        {/* Account Safety Guidance */}
        <div className="flex items-start gap-2 rounded-lg bg-emerald-950/50 border border-emerald-500/20 p-3 text-xs text-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium text-emerald-300">Lưu ý bảo hành tài khoản</p>
            <p className="text-slate-300">Vui lòng đăng nhập kiểm tra tài khoản ngay sau khi nhận. Không đổi Email trong 24 giờ đầu để đảm bảo quyền lợi bảo hành 10 ngày từ nhà cung cấp.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. KEY BRANCH OUTPUT
  if (activeBranch === 'KEY') {
    const licenseKey = rawKey.trim();

    return (
      <div className={`space-y-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 ${className}`}>
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Key className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Phân Nhánh: Mã Bản Quyền (License Key)
              </span>
              <p className="text-xs text-slate-300">Mã kích hoạt phần mềm / Game CDKey bản quyền</p>
            </div>
          </div>
        </div>

        {/* License Key Box */}
        <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-4 text-center space-y-3">
          <div className="text-xs font-medium text-slate-300">MÃ KÍCH HOẠT SẢN PHẨM</div>
          <div className="font-mono text-base md:text-lg font-bold tracking-wider text-amber-300 bg-slate-950/80 py-3 px-4 rounded-lg border border-slate-800 select-all break-all">
            {licenseKey || 'CYBER-KEY-XXXX-XXXX-XXXX'}
          </div>
          <button
            onClick={() => handleCopy(licenseKey, 'key')}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            {copiedField === 'key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedField === 'key' ? 'Đã sao chép mã Key thành công!' : 'Sao Chép Mã Key'}</span>
          </button>
        </div>

        {/* Activation Guide */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-950/50 border border-amber-500/20 p-3 text-xs text-amber-200">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium text-amber-300">Hướng dẫn kích hoạt</p>
            <p className="text-slate-300">Mở ứng dụng hoặc trang chủ của nhà phát hành (Steam, Microsoft, Adobe,...), tìm mục "Kích hoạt sản phẩm" hoặc "Redeem Product Code" và dán mã trên vào.</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. LINK BRANCH OUTPUT
  if (activeBranch === 'LINK') {
    const linkUrl = explicitInviteLink || (rawKey.startsWith('http') ? rawKey : `https://${rawKey}`);

    return (
      <div className={`space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 ${className}`}>
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <LinkIcon className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Phân Nhánh: Link Mời / Kích Hoạt (Invite Link)
              </span>
              <p className="text-xs text-slate-300">Link gia nhập nhóm Family, Canva Team hoặc nhận bản quyền</p>
            </div>
          </div>
        </div>

        {/* Action Button & Link Box */}
        <div className="rounded-xl border border-indigo-500/40 bg-slate-900/90 p-4 space-y-3">
          <div className="text-xs font-medium text-slate-300">LIÊN KẾT KÍCH HOẠT TRỰC TIẾP</div>
          
          <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <span className="font-mono text-xs text-indigo-300 truncate flex-1 select-all">
              {linkUrl}
            </span>
            <button
              onClick={() => handleCopy(linkUrl, 'link')}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 shrink-0"
            >
              {copiedField === 'link' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedField === 'link' ? 'Đã chép' : 'Chép link'}</span>
            </button>
          </div>

          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            <span>Truy Cập Link Kích Hoạt / Gia Nhập Ngay</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Invite Guide */}
        <div className="flex items-start gap-2 rounded-lg bg-indigo-950/50 border border-indigo-500/20 p-3 text-xs text-indigo-200">
          <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium text-indigo-300">Hướng dẫn nhận bản quyền</p>
            <p className="text-slate-300">Đăng nhập tài khoản cá nhân của bạn trên trình duyệt trước, sau đó bấm nút "Truy Cập Link" ở trên để tự động nhận bản quyền hoặc tham gia nhóm.</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. GIFTCARD BRANCH OUTPUT
  const cardCode = giftCardInfo?.cardNumber || rawKey.split('|')[0]?.trim() || rawKey;
  const pinCode = giftCardInfo?.pinCode || rawKey.split('|')[1]?.trim().replace(/^PIN:\s*/i, '') || '9854';

  return (
    <div className={`space-y-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 ${className}`}>
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Phân Nhánh: Thẻ Quà Tặng / Nạp Tiền (Giftcard)
            </span>
            <p className="text-xs text-slate-300">Mã thẻ cào điện tử & mã bí mật PIN</p>
          </div>
        </div>
        <button
          onClick={() => handleCopy(`${cardCode} | PIN: ${pinCode}`, 'all_gift')}
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-all"
        >
          {copiedField === 'all_gift' ? <Check className="h-3.5 w-3.5 text-rose-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedField === 'all_gift' ? 'Đã sao chép' : 'Sao chép cả thẻ & PIN'}</span>
        </button>
      </div>

      {/* Giftcard Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card Number */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-300">Mã Thẻ (Card Number)</span>
            <button
              onClick={() => handleCopy(cardCode, 'card')}
              className="text-[11px] flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
            >
              {copiedField === 'card' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedField === 'card' ? 'Đã chép' : 'Chép'}
            </button>
          </div>
          <div className="font-mono text-sm font-bold text-white select-all">
            {cardCode}
          </div>
        </div>

        {/* PIN Code */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-300">Mã PIN Bí Mật</span>
            <button
              onClick={() => handleCopy(pinCode, 'pin')}
              className="text-[11px] flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
            >
              {copiedField === 'pin' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedField === 'pin' ? 'Đã chép' : 'Chép'}
            </button>
          </div>
          <div className="font-mono text-sm font-bold text-rose-300 select-all">
            {pinCode}
          </div>
        </div>
      </div>

      {/* Redemption Guide */}
      <div className="flex items-start gap-2 rounded-lg bg-rose-950/50 border border-rose-500/20 p-3 text-xs text-rose-200">
        <Sparkles className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-medium text-rose-300">Hướng dẫn nạp thẻ</p>
          <p className="text-slate-300">Vào mục Nạp thẻ / Redeem Gift Card trên nền tảng (Steam, Google Play, iTunes, Roblox,...), nhập Mã thẻ và Mã PIN tương ứng để nhận số dư ví.</p>
        </div>
      </div>
    </div>
  );
};
