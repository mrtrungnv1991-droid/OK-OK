export type DeliveryBranch = 'ACCOUNT' | 'KEY' | 'LINK' | 'GIFTCARD';

export interface BranchConfig {
  branch: DeliveryBranch;
  label: string;
  shortLabel: string;
  description: string;
  outputFormat: string;
  outputTemplate: string;
  defaultDeliveryEstimate: string;
  productType: 'account' | 'key_game' | 'key_app' | 'gift_card' | 'software';
  deliveryType: 'account_invite' | 'instant_key' | 'activation_token' | 'giftup_card';
  badgeColor: string;
}

export const BRANCH_CONFIGS: Record<DeliveryBranch, BranchConfig> = {
  ACCOUNT: {
    branch: 'ACCOUNT',
    label: 'Tài Khoản (Account)',
    shortLabel: 'Account',
    description: 'Bàn giao thông tin đăng nhập tự động dạng user:pass:cookie hoặc email:pass:2fa',
    outputFormat: 'USER_PASS_COOKIE',
    outputTemplate: 'username|password|cookie',
    defaultDeliveryEstimate: 'Giao tài khoản tự động (User:Pass:Cookie)',
    productType: 'account',
    deliveryType: 'account_invite',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
  },
  KEY: {
    branch: 'KEY',
    label: 'Mã Bản Quyền (License Key)',
    shortLabel: 'Key',
    description: 'Bàn giao mã kích hoạt phần mềm, Steam CDKey, Windows/Office license',
    outputFormat: 'LICENSE_KEY',
    outputTemplate: 'XXXXX-XXXXX-XXXXX',
    defaultDeliveryEstimate: 'Giao mã bản quyền tức thì (Instant Key)',
    productType: 'key_game',
    deliveryType: 'instant_key',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/40'
  },
  LINK: {
    branch: 'LINK',
    label: 'Link Mời / Kích Hoạt (Invite Link)',
    shortLabel: 'Link',
    description: 'Bàn giao link mời gia nhập Family/Team (Canva, Spotify, YouTube Premium) hoặc redeem URL',
    outputFormat: 'REDEEM_LINK',
    outputTemplate: 'https://invite.link/example',
    defaultDeliveryEstimate: 'Link kích hoạt tức thì (Direct Invite Link)',
    productType: 'software',
    deliveryType: 'activation_token',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
  },
  GIFTCARD: {
    branch: 'GIFTCARD',
    label: 'Thẻ Quà Tặng / Nạp Tiền (Giftcard)',
    shortLabel: 'Giftcard',
    description: 'Bàn giao mã thẻ cào, voucher, thẻ ví điện tử kèm mã bí mật PIN',
    outputFormat: 'CARD_PIN',
    outputTemplate: 'Mã Thẻ: XXXXX | PIN: YYYY',
    defaultDeliveryEstimate: 'Mã thẻ & PIN quà tặng tức thì',
    productType: 'gift_card',
    deliveryType: 'giftup_card',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-500/40'
  }
};

/**
 * Tự động phân loại phân nhánh sản phẩm (Account, Key, Link, Giftcard)
 * dựa vào tên, mô tả, danh mục và metadata từ nguồn cung cấp.
 */
export function detectDeliveryBranch(item: {
  title?: string;
  description?: string;
  category?: string;
  metadata?: any;
}): DeliveryBranch {
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const fullText = `${title} ${desc} ${cat}`;

  // 1. LINK Check (Invite, family, join, gia hạn link, redeem link, canva, spotify family)
  if (
    fullText.includes('invite') ||
    fullText.includes('join link') ||
    fullText.includes('link mời') ||
    fullText.includes('link tham gia') ||
    fullText.includes('gia hạn qua link') ||
    fullText.includes('family link') ||
    fullText.includes('redeem link') ||
    fullText.includes('http://') ||
    fullText.includes('https://')
  ) {
    return 'LINK';
  }

  // 2. GIFTCARD Check (Giftcard, voucher, thẻ nạp, wallet card, gift code, pin code)
  if (
    fullText.includes('giftcard') ||
    fullText.includes('gift card') ||
    fullText.includes('giftup') ||
    fullText.includes('thẻ nạp') ||
    fullText.includes('thẻ cào') ||
    fullText.includes('thẻ game') ||
    fullText.includes('voucher') ||
    fullText.includes('wallet code') ||
    fullText.includes('mã thẻ') ||
    fullText.includes('card pin') ||
    fullText.includes('steam wallet') ||
    fullText.includes('itunes') ||
    fullText.includes('google play card')
  ) {
    return 'GIFTCARD';
  }

  // 3. KEY Check (License key, cdkey, cd-key, serial, bản quyền, active key)
  if (
    fullText.includes('cdkey') ||
    fullText.includes('cd-key') ||
    fullText.includes('license key') ||
    fullText.includes('product key') ||
    fullText.includes('serial key') ||
    fullText.includes('bản quyền vĩnh viễn') ||
    fullText.includes('key bản quyền') ||
    fullText.includes('active key') ||
    fullText.includes('kích hoạt key')
  ) {
    return 'KEY';
  }

  // 4. ACCOUNT Check (User:pass, cookie, tài khoản, acc, clone, via, mail, nick, blox fruit, godhuman)
  if (
    fullText.includes('user:pass') ||
    fullText.includes('cookie') ||
    fullText.includes('acc') ||
    fullText.includes('tài khoản') ||
    fullText.includes('nick') ||
    fullText.includes('clone') ||
    fullText.includes('via') ||
    fullText.includes('mail') ||
    fullText.includes('godhuman') ||
    fullText.includes('fruits') ||
    fullText.includes('max level') ||
    fullText.includes('roblox') ||
    fullText.includes('bảo hành') ||
    fullText.includes('warranty') ||
    fullText.includes('account')
  ) {
    return 'ACCOUNT';
  }

  // Fallback defaults
  if (fullText.includes('key') || fullText.includes('license')) {
    return 'KEY';
  }

  return 'ACCOUNT';
}

export function parseDeliveredOutput(text: string, branch: DeliveryBranch) {
  if (!text) return { raw: '', branch };

  if (branch === 'ACCOUNT') {
    // Check for user:pass:cookie or user|pass|cookie or username/password
    const parts = text.includes('|') ? text.split('|') : text.split(':');
    let username = '';
    let password = '';
    let cookie = '';
    let extra = '';

    if (parts.length >= 2) {
      username = parts[0].trim().replace(/^User:\s*/i, '').replace(/^Email:\s*/i, '');
      password = parts[1].trim().replace(/^Pass:\s*/i, '').replace(/^Password:\s*/i, '');
      if (parts.length >= 3) {
        cookie = parts.slice(2).join(text.includes('|') ? '|' : ':').trim().replace(/^Cookie:\s*/i, '');
      }
    } else {
      username = text.trim();
    }

    return {
      branch,
      raw: text,
      accountCredentials: {
        username,
        password,
        cookie,
        extra
      }
    };
  }

  if (branch === 'LINK') {
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    return {
      branch,
      raw: text,
      inviteLink: urlMatch ? urlMatch[0] : text.trim()
    };
  }

  if (branch === 'GIFTCARD') {
    const parts = text.split('|');
    const cardCode = parts[0]?.trim() || text.trim();
    const pin = parts[1]?.trim().replace(/^PIN:\s*/i, '') || '';
    return {
      branch,
      raw: text,
      cardCode,
      pinCode: pin
    };
  }

  // KEY
  return {
    branch,
    raw: text,
    licenseKey: text.trim()
  };
}
