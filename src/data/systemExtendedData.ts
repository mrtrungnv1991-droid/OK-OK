import { 
  CategoryItem, 
  ManualOrder, 
  CTVUser, 
  CTVWithdrawal, 
  CTVTier,
  BlockedIPItem, 
  CronJobItem, 
  CronExecutionLog, 
  BalanceLogItem, 
  LoginHistoryItem, 
  WebhookLogItem, 
  AdminRoleItem, 
  AdminStaffUser, 
  DepositPromotionRule,
  ThemeConfig 
} from '../types';

// ============================================================================
// 1. CHUYÊN MỤC NHÁNH CHÍNH & NHÁNH PHỤ (HIERARCHICAL CATEGORIES)
// ============================================================================
export const INITIAL_EXTENDED_CATEGORIES: CategoryItem[] = [
  // NHÁNH CHÍNH (ROOT CATEGORIES)
  {
    id: 'root-cat-1',
    slug: 'gaming_keys',
    name: 'Key Game & Bản Quyền Game (Thủ công & Auto)',
    parentId: null,
    iconName: 'Gamepad2',
    productCount: 42,
    orderIndex: 1,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'key_game',
    description: 'Bản quyền Steam, EA Play, Ubisoft, Battle.net giao thủ công hoặc tự động'
  },
  {
    id: 'root-cat-2',
    slug: 'gift_cards',
    name: 'Thẻ Quà Tặng E-Gift Card Quốc Tế',
    parentId: null,
    iconName: 'Gift',
    productCount: 28,
    orderIndex: 2,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'gift_card',
    description: 'Thẻ quà tặng Apple iTunes, Google Play, Steam Wallet, Amazon, Roblox Giftcard'
  },
  {
    id: 'root-cat-3',
    slug: 'topup_services',
    name: 'Dịch Vụ Nạp Game Trực Tiếp (Top Up UID / Server)',
    parentId: null,
    iconName: 'Zap',
    productCount: 121,
    orderIndex: 3,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'topup_manual',
    description: 'Nạp kim cương, đá quý, gói nạp qua Player ID / Server trực tiếp'
  },
  {
    id: 'root-cat-4',
    slug: 'accounts_auto',
    name: 'Tài Khoản Số Tự Động (Account Instant Delivery)',
    parentId: null,
    iconName: 'Sparkles',
    productCount: 35,
    orderIndex: 4,
    status: 'active',
    fulfillmentType: 'automatic',
    deliveryClassification: 'account',
    description: 'Tài khoản ChatGPT Plus, Midjourney, Netflix Premium, Spotify, Adobe VIP giao ngay'
  },
  {
    id: 'root-cat-5',
    slug: 'software_licenses',
    name: 'Phần Mềm & Tiện Ích Văn Phòng',
    parentId: null,
    iconName: 'Cpu',
    productCount: 19,
    orderIndex: 5,
    status: 'active',
    fulfillmentType: 'automatic',
    deliveryClassification: 'key_game',
    description: 'Windows 11 Pro, Office 365, Canva Pro, JetBrains, VPN bản quyền'
  },

  // NHÁNH PHỤ (SUBCATEGORIES)
  {
    id: 'sub-cat-101',
    slug: 'steam_cdkey',
    name: 'Steam CD-Keys / Global Keys',
    parentId: 'root-cat-1',
    iconName: 'Gamepad2',
    productCount: 18,
    orderIndex: 1,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'key_game',
    description: 'Key kích hoạt game Steam vĩnh viễn'
  },
  {
    id: 'sub-cat-102',
    slug: 'ea_ubisoft_keys',
    name: 'EA Play & Ubisoft Connect Keys',
    parentId: 'root-cat-1',
    iconName: 'Flame',
    productCount: 12,
    orderIndex: 2,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'key_game',
    description: 'Key game kích hoạt trên app EA / Ubisoft'
  },
  {
    id: 'sub-cat-201',
    slug: 'itunes_google_gift',
    name: 'Thẻ Apple iTunes & Google Play US/JP',
    parentId: 'root-cat-2',
    iconName: 'Gift',
    productCount: 14,
    orderIndex: 1,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'gift_card',
    description: 'Mã thẻ nạp App Store & Google Play'
  },
  {
    id: 'sub-cat-202',
    slug: 'steam_wallet_cards',
    name: 'Thẻ Nạp Steam Wallet USD / VNĐ / TL',
    parentId: 'root-cat-2',
    iconName: 'Wallet',
    productCount: 10,
    orderIndex: 2,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'gift_card',
    description: 'Code nạp tiền ví Steam chính hãng'
  },
  {
    id: 'sub-cat-301',
    slug: 'topup_genshin_honkai',
    name: 'Nạp Genshin Impact & Honkai Star Rail',
    parentId: 'root-cat-3',
    iconName: 'Sparkles',
    productCount: 38,
    orderIndex: 1,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'topup_manual',
    description: 'Nạp Đá Sáng Thế / Không Nguyệt Chúc Phúc qua UID'
  },
  {
    id: 'sub-cat-302',
    slug: 'topup_pubg_freefire',
    name: 'Nạp PUBG Mobile UC & Free Fire Kim Cương',
    parentId: 'root-cat-3',
    iconName: 'Zap',
    productCount: 45,
    orderIndex: 2,
    status: 'active',
    fulfillmentType: 'manual',
    deliveryClassification: 'topup_manual',
    description: 'Nạp UC PUBG Mobile & Kim Cương Free Fire trực tiếp qua UID'
  },
  {
    id: 'sub-cat-401',
    slug: 'ai_accounts',
    name: 'Tài Khoản AI (ChatGPT Plus / Claude / Midjourney)',
    parentId: 'root-cat-4',
    iconName: 'Sparkles',
    productCount: 16,
    orderIndex: 1,
    status: 'active',
    fulfillmentType: 'automatic',
    deliveryClassification: 'account',
    description: 'Tài khoản AI cao cấp cấp sẵn email + password + session token'
  },
  {
    id: 'sub-cat-402',
    slug: 'entertainment_accounts',
    name: 'Tài Khoản Netflix, Spotify, YouTube Premium',
    parentId: 'root-cat-4',
    iconName: 'Film',
    productCount: 19,
    orderIndex: 2,
    status: 'active',
    fulfillmentType: 'automatic',
    deliveryClassification: 'account',
    description: 'Tài khoản xem phim / nghe nhạc chất lượng cao bản quyền'
  }
];

// ============================================================================
// 2. ĐƠN HÀNG THỦ CÔNG (MANUAL ORDERS QUEUE)
// ============================================================================
export const INITIAL_MANUAL_ORDERS: ManualOrder[] = [
  {
    id: 'MO-9901',
    orderCode: 'ORD-KEY-882194',
    customerId: 'MB-002',
    customerName: 'GamerPro99',
    customerContact: '0912345678 (Zalo)',
    productType: 'key_game',
    productId: 'prod-black-myth',
    productTitle: 'Black Myth: Wukong (Steam Digital Key)',
    quantity: 1,
    totalPrice: 1150000,
    status: 'pending_process',
    orderInputs: {
      emailDelivery: 'gamerpro99@gmail.com',
      notes: 'Gửi kèm hướng dẫn kích hoạt Region Global giúp mình nhé admin'
    },
    createdAt: '11:05 - 21/08/2026'
  },
  {
    id: 'MO-9902',
    orderCode: 'ORD-TOPUP-772183',
    customerId: 'user-0x889',
    customerName: 'CyberBuyer_Vn',
    customerContact: 'telegram: @cyberbuyer_vn',
    productType: 'topup_manual',
    productId: 'game-genshin',
    productTitle: 'Genshin Impact - Gói 6,480 Đá Sáng Thế',
    quantity: 1,
    totalPrice: 1650000,
    status: 'processing',
    orderInputs: {
      uid: '812938491',
      server: 'Asia',
      characterName: 'Lumine_Pro',
      notes: 'Nạp nhanh giúp mình đang chạy event banner nhân vật'
    },
    createdAt: '10:52 - 21/08/2026',
    processedBy: 'Root_SuperAdmin'
  },
  {
    id: 'MO-9903',
    orderCode: 'ORD-GIFT-661294',
    customerId: 'MB-003',
    customerName: 'SellerKing_AI',
    customerContact: '0988776655',
    productType: 'gift_card',
    productId: 'gift-apple-50',
    productTitle: 'Apple iTunes Gift Card $50 (US Store)',
    quantity: 2,
    totalPrice: 2450000,
    status: 'completed',
    orderInputs: {
      emailDelivery: 'sellerking.agency@gmail.com',
      notes: 'Cần mã thẻ quét scan code rõ nét'
    },
    deliveredContent: 'Code 1: XX98-LKA9-9912-MM81 | Code 2: PP81-8821-NN77-QK12\nẢnh Scan thẻ: https://i.imgur.com/giftup-card-scan-us50.jpg',
    adminNote: 'Đã check thẻ live 100% trước khi bàn giao',
    createdAt: '09:30 - 21/08/2026',
    processedAt: '09:34 - 21/08/2026',
    processedBy: 'Root_SuperAdmin'
  },
  {
    id: 'MO-9904',
    orderCode: 'ORD-TOPUP-551029',
    customerId: 'MB-004',
    customerName: 'CryptoWhale_88',
    customerContact: 'telegram: @whale88',
    productType: 'topup_manual',
    productId: 'game-pubgm',
    productTitle: 'PUBG Mobile - 8,100 UC Global Direct',
    quantity: 1,
    totalPrice: 2190000,
    status: 'completed',
    orderInputs: {
      uid: '5192837482',
      characterName: 'Shroud_VN',
      notes: 'Check đúng tên nhân vật hãy nạp nhé'
    },
    deliveredContent: 'Midasbuy Transaction ID: MID-883921094. Đã cộng 8,100 UC vào tài khoản.',
    adminNote: 'Giao dịch qua Midasbuy API thành công',
    createdAt: '08:15 - 21/08/2026',
    processedAt: '08:18 - 21/08/2026',
    processedBy: 'Root_SuperAdmin'
  }
];

// ============================================================================
// 3. CTV / ĐẠI LÝ RESELLER (TIERS, USERS, WITHDRAWALS)
// ============================================================================
export const INITIAL_CTV_TIERS: CTVTier[] = [
  {
    id: 'tier-1',
    name: 'Cộng Tác Viên (Cấp 1)',
    minMonthlySales: 0,
    discountRate: 5, // Giảm 5% khi mua sỉ
    color: '#06b6d4' // Cyan
  },
  {
    id: 'tier-2',
    name: 'Đại Lý Bán Lẻ (Cấp 2)',
    minMonthlySales: 10000000, // 10 triệu/tháng
    discountRate: 10, // Giảm 10%
    color: '#8b5cf6' // Purple
  },
  {
    id: 'tier-3',
    name: 'Tổng Đại Lý / VIP Reseller',
    minMonthlySales: 50000000, // 50 triệu/tháng
    discountRate: 15, // Giảm 15% + Kết nối API Bán Lại
    color: '#f59e0b' // Amber/Gold
  }
];

export const INITIAL_CTV_USERS: CTVUser[] = [
  {
    id: 'ctv-01',
    username: 'daily_hanoigame',
    fullName: 'Nguyễn Văn Hùng (Hà Nội Game Shop)',
    email: 'hung.hanoigame@gmail.com',
    phone: '0912.888.999',
    tier: 'ctv_vip_reseller',
    commissionRate: 15,
    totalSales: 84500000,
    commissionBalance: 6420000,
    apiKey: 'reseller_live_sk_99a81f9e8a01bc772183',
    childDomain: 'shopgamehanoi.vn',
    childDomainStatus: 'active',
    status: 'active',
    createdAt: '15/01/2026'
  },
  {
    id: 'ctv-02',
    username: 'ctv_saigonkey',
    fullName: 'Trần Minh Đức',
    email: 'duc.sgkey@gmail.com',
    phone: '0988.112.233',
    tier: 'ctv_level_2',
    commissionRate: 10,
    totalSales: 24800000,
    commissionBalance: 1850000,
    apiKey: 'reseller_live_sk_55b23d81f10992a881',
    childDomain: 'saigonkeyshop.com',
    childDomainStatus: 'pending_dns',
    status: 'active',
    createdAt: '02/03/2026'
  },
  {
    id: 'ctv-03',
    username: 'ctv_danang_digital',
    fullName: 'Lê Hoàng Long',
    email: 'long.dn@gmail.com',
    phone: '0977.334.455',
    tier: 'ctv_level_1',
    commissionRate: 5,
    totalSales: 4500000,
    commissionBalance: 225000,
    apiKey: 'reseller_live_sk_11c88e9921448820',
    status: 'active',
    createdAt: '10/06/2026'
  }
];

export const INITIAL_CTV_WITHDRAWALS: CTVWithdrawal[] = [
  {
    id: 'WD-883',
    ctvId: 'ctv-01',
    ctvName: 'Nguyễn Văn Hùng (Hà Nội Game Shop)',
    amount: 4300000,
    bankName: 'Litecoin Core Mainnet',
    accountNumber: 'LZeE2hL9qHSmV7gJ2wH7QG9Z2C81uYyX3w',
    accountName: 'LTC_ESCROW_NODE',
    paymentMethod: 'crypto_ltc',
    withdrawalType: 'affiliate_commission',
    status: 'pending',
    createdAt: '11:15 - 21/08/2026',
    note: 'Rút hoa hồng qua Litecoin LTC về ví lạnh Ledger'
  },
  {
    id: 'WD-882',
    ctvId: 'user-0x889',
    ctvName: 'CyberBuyer_Vn',
    amount: 2540000,
    bankName: 'Binance Pay / UID',
    accountNumber: '582910384',
    accountName: 'CYBER_TRADER_VN',
    paymentMethod: 'binance_pay',
    withdrawalType: 'wallet_balance',
    status: 'pending',
    createdAt: '10:45 - 21/08/2026',
    note: 'Rút số dư ví chính sang Binance Pay UID nhận 100 USDT tức thì'
  },
  {
    id: 'WD-881',
    ctvId: 'ctv-01',
    ctvName: 'Nguyễn Văn Hùng (Hà Nội Game Shop)',
    amount: 5000000,
    bankName: 'MB Bank Quân Đội',
    accountNumber: '0912888999',
    accountName: 'NGUYEN VAN HUNG',
    paymentMethod: 'bank',
    withdrawalType: 'affiliate_commission',
    status: 'pending',
    createdAt: '10:30 - 21/08/2026',
    note: 'Yêu cầu rút hoa hồng doanh thu tuần 3 tháng 8'
  },
  {
    id: 'WD-880',
    ctvId: 'ctv-02',
    ctvName: 'Trần Minh Đức',
    amount: 1500000,
    bankName: 'Vietcombank',
    accountNumber: '1018899201',
    accountName: 'TRAN MINH DUC',
    paymentMethod: 'bank',
    withdrawalType: 'affiliate_commission',
    status: 'approved',
    createdAt: '08:00 - 20/08/2026',
    processedAt: '08:25 - 20/08/2026',
    note: 'Đã chuyển khoản qua Vietcombank số GD #99281'
  }
];

// ============================================================================
// 4. BLOCK IP & AN NINH TƯỜNG LỬA (FIREWALL BLACKLIST)
// ============================================================================
export const INITIAL_BLOCKED_IPS: BlockedIPItem[] = [
  {
    id: 'bip-1',
    ipAddress: '45.154.255.80',
    reason: 'Spam Flood Request Login hơn 200 req/s (Brute Force)',
    type: 'auto_bruteforce',
    blockedAt: '10:14 - 21/08/2026',
    expiresAt: '28/08/2026',
    blockedBy: 'Cyber WAF Guard',
    requestCountBlocked: 4892
  },
  {
    id: 'bip-2',
    ipAddress: '194.38.20.11',
    reason: 'Quét lỗ hổng SQL Injection / Directory Traversal',
    type: 'auto_ddos',
    blockedAt: '09:00 - 21/08/2026',
    blockedBy: 'Anti-DDOS Shield Layer 7',
    requestCountBlocked: 1240
  },
  {
    id: 'bip-3',
    ipAddress: '103.149.130.0/24',
    reason: 'Dải IP Proxy vớ vẩn botnet chuyên tạo nick ảo nạp thẻ giả',
    type: 'subnet_cidr',
    blockedAt: '18/08/2026',
    blockedBy: 'Root_SuperAdmin',
    requestCountBlocked: 3410
  }
];

// ============================================================================
// 5. TỰ ĐỘNG HÓA & CRON JOBS (AUTOMATION ENGINES)
// ============================================================================
export const INITIAL_CRON_JOBS: CronJobItem[] = [
  {
    id: 'cron-01',
    name: 'Auto Sync Giao Dịch Ngân Hàng VietQR (MB, VCB, ACB)',
    taskType: 'bank_auto_sync',
    frequency: 'Mỗi 10 giây',
    intervalSeconds: 10,
    lastRunTime: '11:07:50 - 21/08/2026',
    nextRunTime: '11:08:00 - 21/08/2026',
    lastStatus: 'success',
    lastLogMessage: 'Quét 0 giao dịch mới phát sinh, duy trì kết nối MBBank API bình thường',
    enabled: true,
    totalRuns: 18420
  },
  {
    id: 'cron-02',
    name: 'Auto Kiểm Tra Trạng Thái Đổi Thẻ Cào (TheSieuRe, Doithe1s)',
    taskType: 'telco_card_check',
    frequency: 'Mỗi 30 giây',
    intervalSeconds: 30,
    lastRunTime: '11:07:30 - 21/08/2026',
    nextRunTime: '11:08:00 - 21/08/2026',
    lastStatus: 'success',
    lastLogMessage: 'Đã check 2 thẻ đang chờ kết quả từ TSR Gateway',
    enabled: true,
    totalRuns: 6140
  },
  {
    id: 'cron-03',
    name: 'Auto Hủy Đơn Quá Hạn & Hoàn Tiền Escrow Gom Đơn',
    taskType: 'order_auto_cancel',
    frequency: 'Mỗi 5 phút',
    intervalSeconds: 300,
    lastRunTime: '11:05:00 - 21/08/2026',
    nextRunTime: '11:10:00 - 21/08/2026',
    lastStatus: 'success',
    lastLogMessage: 'Không có đơn gom mua chung nào quá hạn cần hoàn trả ví',
    enabled: true,
    totalRuns: 610
  },
  {
    id: 'cron-04',
    name: 'Auto Quét Cảnh Báo Tồn Kho Key Thấp Về Telegram Bot',
    taskType: 'low_stock_alert',
    frequency: 'Mỗi 15 phút',
    intervalSeconds: 900,
    lastRunTime: '11:00:00 - 21/08/2026',
    nextRunTime: '11:15:00 - 21/08/2026',
    lastStatus: 'success',
    lastLogMessage: 'Cảnh báo 2 sản phẩm tồn kho < 5 key đã được gửi về Telegram Group CSKH',
    enabled: true,
    totalRuns: 204
  },
  {
    id: 'cron-05',
    name: 'Auto Đồng Bộ Giá & Tồn Kho Nhà Cung Cấp (API Suppliers)',
    taskType: 'supplier_api_sync',
    frequency: 'Mỗi 1 giờ',
    intervalSeconds: 3600,
    lastRunTime: '10:00:00 - 21/08/2026',
    nextRunTime: '12:00:00 - 21/08/2026',
    lastStatus: 'success',
    lastLogMessage: 'Đồng bộ 4 đối tác API (Midasbuy, SmileOne, Garena, UniPin) hoàn tất',
    enabled: true,
    totalRuns: 51
  },
  {
    id: 'cron-06',
    name: 'Auto Backup Cơ Sở Dữ Liệu SQL & Tồn Kho Hàng',
    taskType: 'database_backup',
    frequency: 'Mỗi 12 giờ',
    intervalSeconds: 43200,
    lastRunTime: '00:00:00 - 21/08/2026',
    nextRunTime: '12:00:00 - 21/08/2026',
    lastStatus: 'success',
    lastLogMessage: 'Đã xuất file backup system_backup_2026_08_21.sql (24.8 MB) lên Cloud Storage',
    enabled: true,
    totalRuns: 12
  }
];

export const INITIAL_CRON_LOGS: CronExecutionLog[] = [
  {
    id: 'clog-01',
    jobId: 'cron-01',
    jobName: 'Bank Auto Sync VietQR',
    status: 'success',
    message: 'Khớp thành công 1 GD +500,000đ từ MBBank (user-0x889)',
    executionTimeMs: 142,
    timestamp: '10:45:02 - 21/08/2026'
  },
  {
    id: 'clog-02',
    jobId: 'cron-02',
    jobName: 'Telco Card Check TSR',
    status: 'success',
    message: 'Nhận callback gạch thẻ Viettel 200k thành công (Thực nhận 168k)',
    executionTimeMs: 88,
    timestamp: '10:20:15 - 21/08/2026'
  },
  {
    id: 'clog-03',
    jobId: 'cron-04',
    jobName: 'Low Stock Alert',
    status: 'warning',
    message: 'Sản phẩm ChatGPT Plus 1 Tháng chỉ còn 2 key trong kho',
    executionTimeMs: 210,
    timestamp: '10:00:00 - 21/08/2026'
  }
];

// ============================================================================
// 6. LỊCH SỬ TOÀN DIỆN (BALANCE LOGS, LOGIN HISTORY, WEBHOOKS)
// ============================================================================
export const INITIAL_BALANCE_LOGS: BalanceLogItem[] = [
  {
    id: 'BLOG-991',
    userId: 'user-0x889',
    username: 'CyberBuyer_Vn',
    balanceBefore: 1250000,
    amountChanged: 500000,
    balanceAfter: 1750000,
    actionType: 'deposit_bank',
    description: 'Nạp tiền tự động qua VietQR MB Bank (#VQR-MB-992144)',
    referenceCode: 'INV-10992',
    ipAddress: '113.161.72.19',
    timestamp: '10:45:00 - 21/08/2026'
  },
  {
    id: 'BLOG-990',
    userId: 'user-0x889',
    username: 'CyberBuyer_Vn',
    balanceBefore: 1750000,
    amountChanged: -1650000,
    balanceAfter: 100000,
    actionType: 'topup_game',
    description: 'Mua gói Genshin Impact 6480 Đá Sáng Thế (Đơn #ORD-TOPUP-772183)',
    referenceCode: 'MO-9902',
    ipAddress: '113.161.72.19',
    timestamp: '10:52:10 - 21/08/2026'
  },
  {
    id: 'BLOG-989',
    userId: 'MB-002',
    username: 'GamerPro99',
    balanceBefore: 450000,
    amountChanged: 168000,
    balanceAfter: 618000,
    actionType: 'deposit_card',
    description: 'Đổi thẻ cào Viettel 200,000đ (Chiết khấu 16% = 168k)',
    referenceCode: 'INV-10991',
    ipAddress: '14.241.120.44',
    timestamp: '10:20:00 - 21/08/2026'
  },
  {
    id: 'BLOG-988',
    userId: 'ctv-01',
    username: 'daily_hanoigame',
    balanceBefore: 5820000,
    amountChanged: 600000,
    balanceAfter: 6420000,
    actionType: 'ctv_commission',
    description: 'Cộng hoa hồng 15% từ đơn hàng website con shopgamehanoi.vn',
    referenceCode: 'COMM-9921',
    ipAddress: '118.70.190.82',
    timestamp: '09:50:00 - 21/08/2026'
  }
];

export const INITIAL_LOGIN_LOGS: LoginHistoryItem[] = [
  {
    id: 'LLOG-101',
    userId: 'admin-01',
    username: 'Root_SuperAdmin',
    ipAddress: '113.161.72.19',
    location: 'Hà Nội, Việt Nam (VNPT)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    deviceType: 'Desktop',
    status: 'success',
    timestamp: '11:00:15 - 21/08/2026'
  },
  {
    id: 'LLOG-102',
    userId: 'user-0x889',
    username: 'CyberBuyer_Vn',
    ipAddress: '113.161.72.19',
    location: 'Hà Nội, Việt Nam',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Mobile/Safari',
    deviceType: 'Mobile',
    status: 'success',
    timestamp: '10:40:12 - 21/08/2026'
  },
  {
    id: 'LLOG-103',
    userId: 'unknown',
    username: 'admin',
    ipAddress: '45.154.255.80',
    location: 'Frankfurt, Đức (Hosting/VPN)',
    userAgent: 'Python-requests/2.31.0',
    deviceType: 'Desktop',
    status: 'failed_password',
    timestamp: '10:14:00 - 21/08/2026'
  }
];

export const INITIAL_WEBHOOK_LOGS: WebhookLogItem[] = [
  {
    id: 'WH-5501',
    gateway: 'VietQR_MB',
    status: 'processed',
    payloadSummary: '{"accountNo":"0988889999","amount":500000,"content":"NAP TIEN CYBERBUYER VN","txId":"992144"}',
    ipSender: '103.28.36.19',
    timestamp: '10:45:01 - 21/08/2026',
    responseStatus: 200
  },
  {
    id: 'WH-5502',
    gateway: 'TheSieuRe',
    status: 'processed',
    payloadSummary: '{"status":1,"declared_value":200000,"real_value":200000,"amount":168000,"pin":"849201948201"}',
    ipSender: '103.56.160.20',
    timestamp: '10:20:14 - 21/08/2026',
    responseStatus: 200
  }
];

// ============================================================================
// 7. PHÂN QUYỀN ADMIN & NHÂN VIÊN (RBAC ROLES)
// ============================================================================
export const INITIAL_ADMIN_ROLES: AdminRoleItem[] = [
  {
    id: 'role-superadmin',
    name: 'Quản Trị Viên Tối Cao (Super Admin)',
    description: 'Toàn quyền truy cập mọi phân hệ, cấu hình hệ thống, tài chính và phân quyền',
    color: '#ef4444', // Red
    isSuperAdmin: true,
    userCount: 1,
    permissions: [
      { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'categories', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'manual_orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'sold_orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'banking', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'ctv_reseller', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'promotions', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'members', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'security_ip', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'automation_cron', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'logs', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'roles', canView: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    id: 'role-stock-manager',
    name: 'Quản Lý Kho Hàng & Sản Phẩm (Stock Manager)',
    description: 'Quản lý sản phẩm, chuyên mục, nhập key, xử lý duyệt đơn thủ công',
    color: '#06b6d4', // Cyan
    userCount: 2,
    permissions: [
      { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'categories', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'manual_orders', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { module: 'sold_orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'banking', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'ctv_reseller', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'promotions', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'members', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'security_ip', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'automation_cron', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'logs', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'roles', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'role-support-agent',
    name: 'Nhân Viên Hỗ Trợ & CSKH (Support Agent)',
    description: 'Chat hỗ trợ trực tuyến 24/7, tiếp nhận ticket bảo hành và tra cứu đơn hàng',
    color: '#10b981', // Emerald
    userCount: 3,
    permissions: [
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'categories', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'manual_orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'sold_orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'banking', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'ctv_reseller', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'promotions', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'members', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'security_ip', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'automation_cron', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'logs', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'roles', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'role-finance',
    name: 'Kế Toán & Duyệt Nạp Rút (Finance Billing)',
    description: 'Quản lý cổng nạp, duyệt hóa đơn nạp tiền, xử lý yêu cầu rút hoa hồng CTV',
    color: '#eab308', // Yellow
    userCount: 1,
    permissions: [
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'categories', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'manual_orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'sold_orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'banking', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'ctv_reseller', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { module: 'promotions', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'members', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { module: 'security_ip', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'automation_cron', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'logs', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'roles', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  }
];

export const INITIAL_ADMIN_STAFF: AdminStaffUser[] = [
  {
    id: 'staff-01',
    username: 'Root_SuperAdmin',
    fullName: 'Lê Hoàng Long (Quản Trị Tối Cao)',
    email: 'admin.cybergame@gmail.com',
    roleId: 'role-superadmin',
    roleName: 'Quản Trị Viên Tối Cao',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    lastLogin: '11:00:15 - 21/08/2026',
    createdAt: '01/01/2026'
  },
  {
    id: 'staff-02',
    username: 'khohang_an',
    fullName: 'Nguyễn Bình An (Trưởng Kho Key)',
    email: 'an.stock@gmail.com',
    roleId: 'role-stock-manager',
    roleName: 'Quản Lý Kho Hàng',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    lastLogin: '10:45:00 - 21/08/2026',
    createdAt: '15/02/2026'
  },
  {
    id: 'staff-03',
    username: 'cskh_mai',
    fullName: 'Hoàng Thị Mai (CSKH 24/7)',
    email: 'mai.support@gmail.com',
    roleId: 'role-support-agent',
    roleName: 'Nhân Viên CSKH',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    lastLogin: '10:50:00 - 21/08/2026',
    createdAt: '01/03/2026'
  }
];

// ============================================================================
// 8. KHUYẾN MÃI NẠP TIỀN (DEPOSIT BONUS PROMOTIONS)
// ============================================================================
export const INITIAL_DEPOSIT_PROMOTIONS: DepositPromotionRule[] = [
  {
    id: 'dep-promo-1',
    title: 'Thưởng Nạp Đầu Tiên Thành Viên Mới',
    minDepositAmount: 50000,
    bonusPercent: 10, // +10%
    badge: 'Tặng +10% Lần Đầu',
    status: 'active',
    isFirstDepositOnly: true
  },
  {
    id: 'dep-promo-2',
    title: 'Khuyến Mãi Nạp Từ 200,000đ',
    minDepositAmount: 200000,
    bonusPercent: 5, // +5%
    badge: 'Thưởng +5%',
    status: 'active'
  },
  {
    id: 'dep-promo-3',
    title: 'Khuyến Mãi Nạp Lớn Từ 1,000,000đ',
    minDepositAmount: 1000000,
    bonusPercent: 10, // +10%
    badge: 'Thưởng +10%',
    status: 'active'
  },
  {
    id: 'dep-promo-4',
    title: 'Khuyến Mãi Nạp Sỉ Đại Lý Từ 5,000,000đ',
    minDepositAmount: 5000000,
    bonusPercent: 15, // +15%
    badge: 'VIP +15%',
    status: 'active'
  }
];

// ============================================================================
// 9. CẤU HÌNH GIAO DIỆN MẶC ĐỊNH (THEME CONFIG)
// ============================================================================
export const INITIAL_THEME_CONFIG: ThemeConfig = {
  presetColor: 'cyan',
  colorMode: 'dark',
  primaryHex: '#06b6d4',
  siteLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  siteFavicon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&auto=format&fit=crop&q=80',
  bannerImages: [
    {
      id: 'banner-01',
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
      title: 'HỆ THỐNG PHẦN MỀM & GAME SỐ TỰ ĐỘNG',
      subtitle: 'Sàn Gom Đơn Escrow Mua Chung Bản Quyền - Rẻ Hơn Tới 80%',
      buttonText: 'Khám Phá Ngay',
      buttonLink: '#products',
      active: true
    },
    {
      id: 'banner-02',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
      title: 'NẠP GAME MOBILE TỰ ĐỘNG 24/7',
      subtitle: '121 Tựa Game & 1.702 Gói Nạp - Chiết Khấu Đại Lý Cực Sốc',
      buttonText: 'Nạp Game Ngay',
      buttonLink: '#games',
      active: true
    }
  ],
  noticeMarquee: '🔥 CHÀO MỪNG BẠN ĐẾN VỚI HỆ THỐNG GAME SỐ - NẠP TIỀN TỰ ĐỘNG QUA VIETQR TẶNG THÊM 5-15% - HỖ TRỢ CSKH 24/7 TRỰC TUYẾN 🔥',
  showMarquee: true,
  decorationEffect: 'snow',
  footerCopyright: '© 2026 Cyber Gaming Engine. Powered by Escrow & Anti-DDOS Shield.'
};

// ============================================================================
// 10. VOUCHERS / COUPONS
// ============================================================================
export const INITIAL_VOUCHERS = [
  {
    id: 'vouch-01',
    code: 'CYBER2026',
    discountType: 'percent' as const,
    discountValue: 15,
    minOrderValue: 50000,
    maxDiscount: 100000,
    usageLimit: 500,
    usedCount: 142,
    expiresAt: '2026-12-31',
    status: 'active' as const
  },
  {
    id: 'vouch-02',
    code: 'NEWUSER50K',
    discountType: 'fixed' as const,
    discountValue: 50000,
    minOrderValue: 200000,
    usageLimit: 200,
    usedCount: 88,
    expiresAt: '2026-12-31',
    status: 'active' as const
  },
  {
    id: 'vouch-03',
    code: 'VIPPOOL30',
    discountType: 'percent' as const,
    discountValue: 30,
    minOrderValue: 100000,
    maxDiscount: 150000,
    usageLimit: 100,
    usedCount: 95,
    expiresAt: '2026-09-30',
    status: 'active' as const
  }
];

