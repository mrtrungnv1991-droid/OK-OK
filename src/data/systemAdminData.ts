import { VoucherCoupon, TopupInvoice, AuditLog, CategoryItem, WheelPrize } from '../types';

export const INITIAL_VOUCHERS: VoucherCoupon[] = [
  {
    id: 'vouch-01',
    code: 'CYBER2026',
    discountType: 'percent',
    discountValue: 15,
    minOrderValue: 100000,
    maxDiscount: 50000,
    usageLimit: 500,
    usedCount: 142,
    expiresAt: '2026-12-31',
    status: 'active'
  },
  {
    id: 'vouch-02',
    code: 'GOMSI80',
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 200000,
    maxDiscount: 100000,
    usageLimit: 200,
    usedCount: 188,
    expiresAt: '2026-08-30',
    status: 'active'
  },
  {
    id: 'vouch-03',
    code: 'AITOOLSVIP',
    discountType: 'fixed',
    discountValue: 30000,
    minOrderValue: 150000,
    usageLimit: 100,
    usedCount: 45,
    expiresAt: '2026-09-15',
    status: 'active'
  },
  {
    id: 'vouch-04',
    code: 'NEWUSER50K',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderValue: 300000,
    usageLimit: 1000,
    usedCount: 620,
    expiresAt: '2026-12-31',
    status: 'active'
  },
  {
    id: 'vouch-05',
    code: 'FLASHMIDAS',
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 50000,
    maxDiscount: 25000,
    usageLimit: 50,
    usedCount: 50,
    expiresAt: '2026-02-01',
    status: 'expired'
  }
];

export const INITIAL_INVOICES: TopupInvoice[] = [
  {
    id: 'INV-10992',
    txCode: 'VQR-MB-992144',
    userId: 'user-0x889',
    userName: 'CyberBuyer_Vn',
    method: 'bank_vietqr',
    amount: 500000,
    receivedAmount: 500000,
    fee: 0,
    status: 'completed',
    createdAt: '10:45 - 21/08/2026',
    bankInfo: {
      bankName: 'MB Bank Quân Đội',
      accountNo: '0988889999',
      content: 'NAP TIEN CYBERBUYER VN'
    },
    note: 'Webhook MBBank tự động khớp sau 4s'
  },
  {
    id: 'INV-10991',
    txCode: 'TSR-CARD-849201',
    userId: 'MB-002',
    userName: 'GamerPro99',
    method: 'telco_card',
    amount: 200000,
    receivedAmount: 168000,
    fee: 32000,
    status: 'completed',
    createdAt: '10:20 - 21/08/2026',
    cardInfo: {
      telco: 'VIETTEL',
      serial: '10004928194',
      pin: '849201948201'
    },
    note: 'TheSieuRe API gạch thẻ thành công'
  },
  {
    id: 'INV-10990',
    txCode: 'MOMO-883921',
    userId: 'MB-003',
    userName: 'SellerKing_AI',
    method: 'momo',
    amount: 1000000,
    receivedAmount: 1000000,
    fee: 0,
    status: 'completed',
    createdAt: '09:15 - 21/08/2026',
    bankInfo: {
      bankName: 'MoMo E-Wallet',
      accountNo: '0988889999',
      content: 'NAP 1000000 VND SELLERKING'
    },
    note: 'MoMo Business IPN tự động'
  },
  {
    id: 'INV-10989',
    txCode: 'USDT-TRC20-0x9f1a',
    userId: 'MB-004',
    userName: 'CryptoWhale_88',
    method: 'crypto_usdt',
    amount: 1270000,
    receivedAmount: 1270000,
    fee: 0,
    status: 'completed',
    createdAt: '08:30 - 21/08/2026',
    note: '50 USDT Network TRC20 confirmed 19 block'
  },
  {
    id: 'INV-10988',
    txCode: 'VQR-MB-992080',
    userId: 'MB-005',
    userName: 'SpamAbuser',
    method: 'bank_vietqr',
    amount: 100000,
    receivedAmount: 0,
    fee: 0,
    status: 'cancelled',
    createdAt: '07:10 - 21/08/2026',
    note: 'Hết hạn thanh toán QR 15 phút không nhận được tiền'
  },
  {
    id: 'INV-10987',
    txCode: 'TSR-CARD-119283',
    userId: 'MB-002',
    userName: 'GamerPro99',
    method: 'telco_card',
    amount: 100000,
    receivedAmount: 0,
    fee: 0,
    status: 'failed',
    createdAt: '06:45 - 21/08/2026',
    cardInfo: {
      telco: 'ZING',
      serial: 'ZNG992819',
      pin: '992819283'
    },
    note: 'Thẻ đã qua sử dụng trước đó (TheSieuRe Code 402)'
  }
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    slug: 'ai_tools',
    name: 'Trí Tuệ Nhân Tạo (AI Tools)',
    iconName: 'Sparkles',
    productCount: 14,
    orderIndex: 1,
    status: 'active'
  },
  {
    id: 'cat-2',
    slug: 'gaming',
    name: 'Bản Quyền Game Steam / AAA',
    iconName: 'Gamepad2',
    productCount: 18,
    orderIndex: 2,
    status: 'active'
  },
  {
    id: 'cat-3',
    slug: 'software',
    name: 'Phần Mềm & Bản Quyền Office/Windows',
    iconName: 'Cpu',
    productCount: 12,
    orderIndex: 3,
    status: 'active'
  },
  {
    id: 'cat-4',
    slug: 'giftup_cards',
    name: 'E-Gift Card Đa Quốc Gia (GiftUp)',
    iconName: 'Gift',
    productCount: 16,
    orderIndex: 4,
    status: 'active'
  },
  {
    id: 'cat-5',
    slug: 'topup_games',
    name: 'Nạp Game Mobile & Gói Sỉ Direct',
    iconName: 'Zap',
    productCount: 121,
    orderIndex: 5,
    status: 'active'
  },
  {
    id: 'cat-6',
    slug: 'streaming',
    name: 'Giải Trí Streaming (Netflix / Spotify)',
    iconName: 'Film',
    productCount: 8,
    orderIndex: 6,
    status: 'active'
  },
  {
    id: 'cat-7',
    slug: 'vpn',
    name: 'Bảo Mật VPN & Proxy / VPS Cloud',
    iconName: 'Shield',
    productCount: 7,
    orderIndex: 7,
    status: 'active'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-881',
    adminUser: 'Root_SuperAdmin',
    action: 'CẬP NHẬT TỶ LỆ CHIẾT KHẤU THE',
    details: 'Đổi chiết khấu thẻ Viettel từ 18% xuống 16% qua TheSieuRe API',
    ipAddress: '113.161.72.19',
    timestamp: '10:48:12 - 21/08/2026',
    module: 'banking'
  },
  {
    id: 'LOG-880',
    adminUser: 'Root_SuperAdmin',
    action: 'CỘNG SỐ DƯ THÀNH VIÊN',
    details: 'Cộng +500,000đ cho ID user-0x889 (Lý do: Khớp hóa đơn nạp VietQR thủ công)',
    ipAddress: '113.161.72.19',
    timestamp: '10:45:00 - 21/08/2026',
    module: 'members'
  },
  {
    id: 'LOG-879',
    adminUser: 'Root_SuperAdmin',
    action: 'NHẬP KHO BULK STOCK',
    details: 'Nạp +50 Key cho sản phẩm ChatGPT Plus Team Seat',
    ipAddress: '113.161.72.19',
    timestamp: '09:30:15 - 21/08/2026',
    module: 'products'
  },
  {
    id: 'LOG-878',
    adminUser: 'Root_SuperAdmin',
    action: 'DUYỆT TICKET BẢO HÀNH',
    details: 'Đổi mã key 1:1 cho Ticket #TCK-001 (Windows 11 Pro Retail)',
    ipAddress: '113.161.72.19',
    timestamp: '09:12:44 - 21/08/2026',
    module: 'orders'
  },
  {
    id: 'LOG-877',
    adminUser: 'SecurityGuard_Bot',
    action: 'CHẶN IP BẤT THƯỜNG',
    details: 'Phát hiện quét URL admin liên tục từ IP 45.154.255.80 (Đã đưa vào Blacklist)',
    ipAddress: '45.154.255.80',
    timestamp: '08:05:22 - 21/08/2026',
    module: 'security'
  },
  {
    id: 'LOG-876',
    adminUser: 'Root_SuperAdmin',
    action: 'TẠO MÃ GIẢM GIÁ MỚI',
    details: 'Khởi tạo mã VOUCHER [GOMSI80] giảm 20% tối đa 100,000đ',
    ipAddress: '113.161.72.19',
    timestamp: '07:50:10 - 21/08/2026',
    module: 'vouchers'
  }
];

export const INITIAL_WHEEL_PRIZES: WheelPrize[] = [
  { id: '1', name: 'Key ChatGPT Plus 1 Tháng', type: 'key', value: 105000, color: '#06b6d4', probability: 5, deliveredCode: 'OPENAI-PLUS-LUCKY-2026-X889' },
  { id: '2', name: '+20.000đ Tiền Ví', type: 'wallet_cash', value: 20000, color: '#10b981', probability: 25 },
  { id: '3', name: 'Chúc Bạn May Mắn', type: 'bad_luck', value: 0, color: '#64748b', probability: 30 },
  { id: '4', name: 'Voucher Giảm 50%', type: 'voucher', value: 50000, color: '#f59e0b', probability: 10, deliveredCode: 'LUCKY-WHEEL-50PCT' },
  { id: '5', name: '+50.000đ Tiền Ví', type: 'wallet_cash', value: 50000, color: '#8b5cf6', probability: 10 },
  { id: '6', name: 'E-Gift Card Steam $5', type: 'giftup_card', value: 125000, color: '#ec4899', probability: 3, deliveredCode: 'STEAM-GIFT-LUCKY-WHEEL-99' },
  { id: '7', name: '+10.000đ Tiền Ví', type: 'wallet_cash', value: 10000, color: '#0ea5e9', probability: 15 },
  { id: '8', name: 'Thêm 1 Lượt Quay', type: 'voucher', value: 0, color: '#f43f5e', probability: 2 }
];
