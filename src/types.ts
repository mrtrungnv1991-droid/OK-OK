export type ProductCategory = 
  | 'all' 
  | 'accounts' 
  | 'key_games' 
  | 'key_apps' 
  | 'topup_games' 
  | 'ai_tools' 
  | 'gaming' 
  | 'streaming' 
  | 'software' 
  | 'giftup_cards' 
  | 'vpn'
  | 'entertainment'
  | 'vpn_security'
  | 'education';

export type MainNavModule = 'all' | 'accounts' | 'key_games' | 'key_apps' | 'topup_games' | 'group_pools' | 'flash_sales';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selected: boolean;
  itemType: 'account' | 'key_game' | 'key_app' | 'giftup_card' | 'software' | 'topup' | 'other';
  addedAt: string;
}

export type DeliveryType = 'instant_key' | 'giftup_card' | 'account_invite' | 'activation_token' | 'direct_topup';

export type ProductPlatform = 
  | 'Steam' 
  | 'OpenAI' 
  | 'Midjourney' 
  | 'Netflix' 
  | 'Adobe' 
  | 'GiftUp' 
  | 'Spotify' 
  | 'Xbox' 
  | 'Anthropic' 
  | 'NordVPN' 
  | 'Garena' 
  | 'Hoyoverse' 
  | 'HoYoverse'
  | 'Riot' 
  | 'Roblox'
  | 'YouTube'
  | 'Canva'
  | 'EA Sports'
  | 'Windows'
  | 'Office'
  | 'Tonec IDM'
  | string;

export interface SellerInfo {
  id: string;
  name: string;
  avatar: string;
  badge: 'Tesla Verified' | 'SpaceX Master' | 'Cyber Escrow' | 'Top Merchant' | 'Official Partner';
  rating: number;
  totalDeals: number;
  completedPools: number;
  responseTime: string;
}

export interface DigitalKeyItem {
  id: string;
  code: string;
  giftUpCode?: string;
  pin?: string;
  assignedTo?: string;
  revealed?: boolean;
  status: 'available' | 'reserved' | 'claimed' | 'tested_valid';
}

export interface PoolParticipant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  txHash: string;
  slotNumber: number;
}

export interface GroupPool {
  id: string;
  productId: string;
  title: string;
  targetSlots: number;
  filledSlots: number;
  pricePerSlot: number;
  retailPrice: number;
  savingsPercent: number;
  expiresAt: string; // ISO date or formatted
  status: 'filling' | 'completed' | 'expired';
  participants: PoolParticipant[];
  keysVault: DigitalKeyItem[];
  hostName: string;
  isHot?: boolean;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
  likes?: number;
}

export interface ProductTranslationRecord {
  id: string; // `${productId}_${language}`
  productId: string;
  language: string; // 'vi' | 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'fr' | 'de' | 'es' | ...
  title: string;
  subtitle?: string;
  description: string;
  deliveryEstimate?: string;
  features?: string[];
  instructions?: string[];
  tags?: string[];
  status: 'translated' | 'pending' | 'original' | 'failed';
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  // Multi-language preservation fields
  title_original?: string;
  description_original?: string;
  original_language?: string;
  translations?: Record<string, {
    title: string;
    subtitle?: string;
    description: string;
    deliveryEstimate?: string;
    features?: string[];
    instructions?: string[];
    tags?: string[];
  }>;
  category: ProductCategory;
  bannerImg: string;
  platform: ProductPlatform;
  retailPrice: number;
  groupPrice: number;
  minSlots: number;
  deliveryType: DeliveryType;
  deliveryEstimate: string;
  description: string;
  features: string[];
  instructions: string[];
  seller: SellerInfo;
  activePools: GroupPool[];
  rating: number;
  reviewCount: number;
  userReviews?: ProductReview[];
  reviews?: ProductReview[];
  stockAvailable: number;
  tags: string[];
  fulfillmentType?: 'automatic' | 'manual';
  productType?: 'account' | 'key_game' | 'key_app' | 'gift_card' | 'topup' | 'topup_manual' | 'software' | 'other';
  subcategoryId?: string;
  discountPercent?: number; // Giảm giá riêng cho từng sản phẩm (%)
  originalPrice?: number;
  tierPrices?: {
    normal: number;
    ctv1: number;
    ctv2: number;
    vip: number;
  };
  isFlashSale?: boolean;
  flashSaleEnds?: string;
  flashSaleStockClaimed?: number;
  flashSaleTotalStock?: number;
}

export interface TopupTier {
  id: string;
  name: string;
  currencyAmount: string; // e.g. "6,480 Đá Sáng Thế + 1,600 Bonus"
  icon: string;
  retailPrice: number;
  groupPrice: number; // Gom đơn nạp sỉ
  popular?: boolean;
  badge?: string;
}

export interface GameItem {
  id: string;
  name: string;
  category: 'Mobile' | 'PC' | 'Console' | 'Other' | string;
  publisher: string;
  thumbnail: string;
  banner: string;
  uidLabel: string;
  uidPlaceholder: string;
  hasZoneId?: boolean;
  zonePlaceholder?: string;
  servers?: string[];
  requiresServer?: boolean;
  tiers: TopupTier[];
  activeGroupPools?: GroupPool[];
  description: string;
}

export interface TopupOrder {
  id: string;
  gameId: string;
  gameTitle: string;
  uid: string;
  zoneId?: string;
  server?: string;
  characterName: string;
  tierName: string;
  pricePaid: number;
  status: 'processing' | 'completed' | 'failed';
  txId: string;
  provider: 'Midasbuy API' | 'SmileOne Direct' | 'Garena Partner' | 'UniPin Gateway';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  orderId?: string;
  user?: string;
  userId?: string;
  subject: string;
  category: 'Key Issue' | 'Top-Up Delay' | 'Escrow Refund' | 'General Support';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved' | 'auto_replaced';
  createdAt: string;
  messages: {
    id: string;
    sender: 'user' | 'agent' | 'bot';
    text: string;
    timestamp: string;
    attachmentKey?: string;
  }[];
}

export interface SupplierApiConfig {
  id: string;
  providerName: string;
  apiUrl: string;
  apiKey: string;
  balance: number;
  status: 'connected' | 'syncing' | 'error';
  lastSync: string;
  autoCheckLive: boolean;
  supportedGames: string[];
}

export interface UserOrder {
  id: string;
  poolId?: string;
  productId: string;
  productTitle: string;
  platform: string;
  type: 'group_buy' | 'instant_single' | 'topup_game' | 'topup_direct' | 'topup_group';
  pricePaid: number;
  status: 'escrow_locked' | 'fulfilled' | 'refunded';
  createdAt: string;
  deliveredKey?: string;
  pinCode?: string;
  topupDetails?: {
    gameName?: string;
    uid: string;
    zoneId?: string;
    server?: string;
    characterName?: string;
    tierName?: string;
    tier?: string;
  };
  giftUpCard?: {
    cardNumber: string;
    pinCode: string;
    barcode: string;
    balance: number;
    currency: string;
    expiryDate: string;
    redeemUrl: string;
  };
  slotNumber?: number;
  txId: string;
}


export type CurrencyCode = 'VND' | 'USD' | 'USDT' | 'EUR' | 'JPY' | 'CNY' | 'KRW' | 'GBP';
export type LanguageCode = 'vi' | 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'fr' | 'de' | 'es';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  walletBalance: number;
  escrowLocked: number;
  currency: CurrencyCode;
  language?: LanguageCode;
  reputationScore: number;
  role: 'buyer' | 'seller_ctv' | 'admin';
  affiliateCode?: string;
  affiliateEarnings?: number;
  totalSpun?: number;
}

export interface TelcoCardSubmission {
  id: string;
  telco: 'VIETTEL' | 'VINAPHONE' | 'MOBIFONE' | 'ZING' | 'GARENA' | 'GATE';
  declaredAmount: number;
  actualAmount?: number;
  receivedAmount: number;
  feePercent: number;
  pin: string;
  serial: string;
  status: 'processing' | 'success' | 'wrong_amount' | 'invalid_card';
  createdAt: string;
  txId: string;
}

export interface WheelPrize {
  id: string;
  name: string;
  label?: string;
  type: 'key' | 'wallet_cash' | 'voucher' | 'game_diamonds' | 'giftup_card' | 'bad_luck';
  value: number;
  itemDescription?: string;
  deliveredCode?: string;
  color: string;
  probability: number;
}

export interface WheelSpinRecord {
  id: string;
  user: string;
  prizeName: string;
  prizeType: string;
  value: number;
  timestamp: string;
  txId: string;
}

export interface AffiliateTier {
  level: string;
  commissionRate: number;
  minMonthlySales: number;
  discountOnStore: number;
}

export interface TransactionRecord {
  id: string;
  type: 'deposit_qr' | 'deposit_card' | 'deposit_bank' | 'deposit_crypto' | 'deposit_momo' | 'buy_pool' | 'buy_instant' | 'topup_game' | 'escrow_refund' | 'affiliate_commission' | 'wheel_reward';
  description: string;
  amount: number;
  balanceAfter: number;
  status: 'completed' | 'processing' | 'cancelled';
  createdAt: string;
  txCode: string;
}

export interface MemberUser {
  id: string;
  username: string;
  email: string;
  role: 'member' | 'ctv_silver' | 'ctv_gold' | 'ctv_diamond' | 'admin';
  walletBalance: number;
  totalDeposited: number;
  totalOrders: number;
  status: 'active' | 'banned';
  createdAt: string;
  lastLogin: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  orderRef?: string;
  isQuickReply?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  messages: ChatMessage[];
  status: 'active' | 'closed';
}

export interface VoucherCoupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  status: 'active' | 'expired' | 'disabled';
}

export interface TopupInvoice {
  id: string;
  txCode: string;
  userId: string;
  userName: string;
  method: 'bank_vietqr' | 'telco_card' | 'momo' | 'crypto_usdt' | 'crypto_ltc' | 'binance_pay';
  amount: number;
  receivedAmount: number;
  fee: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  createdAt: string;
  cardInfo?: {
    telco: string;
    serial: string;
    pin: string;
  };
  bankInfo?: {
    bankName: string;
    accountNo: string;
    content: string;
  };
  cryptoInfo?: {
    coin: 'USDT' | 'LTC' | 'BINANCE_PAY';
    address?: string;
    binanceId?: string;
    txHash?: string;
    rate?: number;
  };
  note?: string;
}

export interface AuditLog {
  id: string;
  adminUser: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  module: 'products' | 'members' | 'banking' | 'orders' | 'security' | 'system' | 'vouchers';
}

export interface CategoryItem {
  id: string;
  slug: ProductCategory | string;
  name: string;
  parentId?: string | null; // null for root category, id for subcategory
  iconName: string;
  productCount: number;
  orderIndex: number;
  status: 'active' | 'hidden';
  fulfillmentType?: 'automatic' | 'manual';
  deliveryClassification?: 'account' | 'key_game' | 'gift_card' | 'topup_manual';
  description?: string;
}

// Manual Order Fulfillment Queue
export interface ManualOrder {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerContact?: string;
  productType: 'key_game' | 'gift_card' | 'topup_manual' | 'account';
  productId: string;
  productTitle: string;
  quantity: number;
  totalPrice: number;
  status: 'pending_process' | 'processing' | 'completed' | 'refunded';
  orderInputs: {
    uid?: string;
    zoneId?: string;
    server?: string;
    characterName?: string;
    notes?: string;
    emailDelivery?: string;
  };
  deliveredContent?: string; // Key, Account text, Topup confirmation tx
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

// CTV / Reseller System
export interface CTVTier {
  id: string;
  name: string;
  minMonthlySales: number;
  discountRate: number; // e.g. 5 = 5% off
  color: string;
}

export interface CTVUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  tier: 'ctv_level_1' | 'ctv_level_2' | 'ctv_vip_reseller';
  commissionRate: number;
  totalSales: number;
  commissionBalance: number;
  apiKey: string;
  childDomain?: string;
  childDomainStatus?: 'pending_dns' | 'active' | 'suspended';
  status: 'active' | 'locked';
  createdAt: string;
}

export interface CTVWithdrawal {
  id: string;
  ctvId: string;
  ctvName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountNo?: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  note?: string;
  userType?: 'ctv' | 'member' | 'admin';
  withdrawalType?: 'affiliate_commission' | 'wallet_balance';
  paymentMethod?: 'bank' | 'momo' | 'usdt' | 'ltc' | 'crypto_ltc' | 'binance_pay' | 'internal_wallet';
  txHash?: string;
  beneficiaryPhone?: string;
  network?: string;
  processedBy?: string;
}

// Block IP & Security System
export interface BlockedIPItem {
  id: string;
  ipAddress: string;
  reason: string;
  type: 'manual_block' | 'auto_bruteforce' | 'auto_ddos' | 'subnet_cidr';
  blockedAt: string;
  expiresAt?: string;
  blockedBy: string;
  requestCountBlocked?: number;
}

// Automation & Cron Jobs
export interface CronJobItem {
  id: string;
  name: string;
  taskType: 'bank_auto_sync' | 'telco_card_check' | 'order_auto_cancel' | 'low_stock_alert' | 'supplier_api_sync' | 'database_backup';
  frequency: string; // e.g. "Mỗi 10 giây", "Mỗi 1 phút", "Mỗi 1 giờ"
  intervalSeconds: number;
  lastRunTime: string;
  nextRunTime: string;
  lastStatus: 'success' | 'failed' | 'running';
  lastLogMessage: string;
  enabled: boolean;
  totalRuns: number;
}

export interface CronExecutionLog {
  id: string;
  jobId: string;
  jobName: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  executionTimeMs: number;
  timestamp: string;
}

// Comprehensive Logs
export interface BalanceLogItem {
  id: string;
  userId: string;
  username: string;
  balanceBefore: number;
  amountChanged: number; // positive = added, negative = deducted
  balanceAfter: number;
  actionType: 'deposit_bank' | 'deposit_card' | 'buy_product' | 'topup_game' | 'admin_adjust' | 'refund_order' | 'ctv_commission' | 'minigame_reward';
  description: string;
  referenceCode?: string;
  ipAddress: string;
  timestamp: string;
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  status: 'success' | 'failed_password' | 'blocked_ip';
  timestamp: string;
}

export interface WebhookLogItem {
  id: string;
  gateway: 'VietQR_MB' | 'TheSieuRe' | 'Doithe1s' | 'MoMo_IPN' | 'Binance_USDT' | 'Supplier_API';
  status: 'received' | 'processed' | 'rejected';
  payloadSummary: string;
  ipSender: string;
  timestamp: string;
  responseStatus: number;
}

// Admin Roles & Permissions (RBAC)
export interface AdminPermission {
  module: 'products' | 'categories' | 'manual_orders' | 'sold_orders' | 'banking' | 'ctv_reseller' | 'promotions' | 'members' | 'security_ip' | 'automation_cron' | 'logs' | 'settings' | 'roles';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AdminRoleItem {
  id: string;
  name: string;
  description: string;
  color: string;
  isSuperAdmin?: boolean;
  permissions: AdminPermission[];
  userCount: number;
}

export interface AdminStaffUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  avatar: string;
  status: 'active' | 'locked';
  lastLogin: string;
  createdAt: string;
}

// Deposit Promotions
export interface DepositPromotionRule {
  id: string;
  title: string;
  minDepositAmount: number;
  bonusPercent: number;
  badge: string;
  status: 'active' | 'disabled';
  startDate?: string;
  endDate?: string;
  isFirstDepositOnly?: boolean;
}

// Currency
export type Currency = 'VND' | 'USD' | 'USDT' | 'EUR' | 'JPY';

// Multi-Language & Multi-Currency
export type SupportedLanguage = 'vi' | 'en' | 'zh' | 'ja';
export type SupportedCurrency = 'VND' | 'USD' | 'USDT' | 'EUR' | 'JPY';

// Theme & Appearance CMS
export interface ThemeConfig {
  presetColor: 'cyan' | 'purple' | 'emerald' | 'gold' | 'red';
  colorMode: 'dark' | 'light';
  primaryHex: string;
  siteLogo: string;
  siteFavicon: string;
  bannerImages: {
    id: string;
    url: string;
    title: string;
    subtitle: string;
    buttonText?: string;
    buttonLink?: string;
    active: boolean;
  }[];
  noticeMarquee: string;
  showMarquee: boolean;
  decorationEffect: 'none' | 'snow' | 'cherry_blossom' | 'fireworks' | 'starfield';
  footerCopyright: string;
  footerCustomHtml?: string;
}

export interface SystemConfig {
  siteName: string;
  siteTitle: string;
  slogan: string;
  siteSlogan?: string;
  logoUrl: string;
  hotline: string;
  supportHotline?: string;
  telegramSupport: string;
  supportTelegram?: string;
  zaloSupport: string;
  facebookFanpage: string;
  supportFacebook?: string;
  copyrightText?: string;
  homeAnnouncement: string;
  showAnnouncementPopup: boolean;
  usdToVndRate: number;
  usdExchangeRate?: number;
  usdtToVndRate?: number;
  eurToVndRate?: number;
  jpyToVndRate?: number;
  platformFeePercent: number;
  maintenanceMode: boolean;
  autoEscrowRelease: boolean;
  cronCheckLiveActive: boolean;
  
  // Banking / API Integrations
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  vietQrApiToken: string;
  sepayApiToken?: string;
  web2mApiToken?: string;
  mbbankApiPassword?: string;
  vcbApiPassword?: string;
  acbApiPassword?: string;
  bankCronInterval?: number;
  
  // Telco Card Charging Gateways (TheSieuRe, Doithe1s, Pay247, Autothe)
  telcoProvider?: 'thesieure' | 'doithe1s' | 'pay247' | 'autothe';
  telcoPartnerId: string;
  telcoPartnerKey: string;
  telcoCallbackUrl?: string;
  telcoFeeViettel?: number;
  telcoFeeVinaphone?: number;
  telcoFeeMobifone?: number;
  telcoFeeVietnamobile?: number;
  telcoFeeZing?: number;
  telcoFeeGarena?: number;
  telcoFeeGate?: number;
  
  // Crypto & MoMo & ZaloPay & Binance Pay
  cryptoUsdtAddress: string;
  cryptoNetwork?: 'TRC20' | 'BEP20' | 'ERC20' | 'BINANCE_PAY';
  cryptoLtcAddress?: string;
  cryptoLtcRate?: number;
  cryptoLtcConfirmations?: number;
  binancePayId?: string;
  binanceUid?: string;
  binanceNickname?: string;
  binanceApiKey?: string;
  binanceSecretKey?: string;
  momoPhone: string;
  momoName: string;
  momoApiToken?: string;
  zalopayPhone?: string;
  zalopayName?: string;
  
  // Deposit Bonus Rules
  depositPromotions?: DepositPromotionRule[];
  firstDepositBonusPercent?: number;

  // Telegram Bot & Alerts
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegramAlerts?: boolean;
  alertOnNewOrder?: boolean;
  alertOnNewDeposit?: boolean;
  alertOnNewUser?: boolean;
  alertOnTicket?: boolean;
  alertOnManualOrder?: boolean;

  // Security & Anti-DDOS & Block IP
  antiDdosMode?: boolean;
  antiF12Inspect?: boolean;
  antiProxyVpn?: boolean;
  maxRequestsPerMinute?: number;
  ipBlacklist?: string[];
  geoBlockCountries?: string[];

  // Minigame Lucky Wheel Config
  luckyWheelActive?: boolean;
  luckyWheelCost?: number;
  
  // SMTP Email Server
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFromName?: string;
  emailOrderTemplate?: string;
  smtpConfig?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    fromName?: string;
    fromEmail?: string;
    encryption?: 'tls' | 'ssl' | 'none';
  };

  // Custom Header/Footer Scripts & SEO
  metaKeywords?: string;
  metaDescription?: string;
  customHeaderScript?: string;
  customFooterScript?: string;

  // Theme Config
  theme?: ThemeConfig;
  themeSettings?: {
    presetColor?: string;
    customHex?: string;
    siteLogo?: string;
    bannerImage?: string;
    holidayEffect?: string;
  };

  // Hero & Web Layout Proportion Configuration
  heroConfig?: HeroCustomConfig;
  uiLayoutConfig?: UiLayoutConfig;
}

export interface LaunchpadButtonConfig {
  id: string;
  key: string;
  label: string;
  icon: string;
  colorScheme: 'cyan' | 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'slate';
  active: boolean;
}

export interface HeroTranslationData {
  badgeText?: string;
  mainHeadingLine1?: string;
  mainHeadingLine2?: string;
  subheading?: string;
  pod1Title?: string;
  pod1Val?: string;
  pod1Sub?: string;
  pod2Title?: string;
  pod2Val?: string;
  pod2Sub?: string;
  status?: 'source' | 'auto' | 'manual' | 'failed';
  updatedAt?: string;
}

export interface HeroCustomConfig {
  badgeText: string;
  badgeActive: boolean;
  badgeColor: 'cyan' | 'emerald' | 'purple' | 'amber' | 'red';
  mainHeadingLine1: string;
  mainHeadingLine2: string;
  mainHeadingGradient: 'cyan_blue' | 'gold_amber' | 'purple_rose' | 'emerald_teal' | 'fire_red';
  subheading: string;
  containerMaxWidth: 'max-w-6xl' | 'max-w-7xl' | 'max-w-[1440px]' | 'max-w-[1600px]' | 'max-w-full';
  contentAlignment: 'left' | 'center' | 'balanced_split';
  verticalPadding: 'compact' | 'standard' | 'generous';
  heroBackground: 'cyber_grid' | 'neon_glow' | 'aurora' | 'minimal_dark';
  showTrustPods: boolean;
  trustPod1: {
    title: string;
    value: string;
    sub: string;
    icon: 'zap' | 'shield' | 'clock' | 'sparkles';
    color: 'cyan' | 'emerald' | 'amber' | 'purple';
    active: boolean;
  };
  trustPod2: {
    title: string;
    value: string;
    sub: string;
    icon: 'shield_check' | 'lock' | 'award' | 'star';
    color: 'emerald' | 'cyan' | 'amber' | 'purple';
    active: boolean;
  };
  showLaunchpad: boolean;
  launchpadLayout: 'wrap_grid' | 'scrollable_row';
  launchpadButtons: LaunchpadButtonConfig[];
  sourceLanguage?: 'vi';
  original_language?: string;
  version?: number;
  contentHash?: string;
  translations?: Record<string, HeroTranslationData>;
}

export interface UiLayoutConfig {
  siteContainerWidth: 'max-w-7xl' | 'max-w-[1440px]' | 'max-w-[1600px]' | 'max-w-6xl' | 'max-w-full';
  cardBorderRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl';
  enableCyberGrid: boolean;
  enableGlowEffects: boolean;
}

export type SystemConfiguration = SystemConfig;

// ================= PHƯƠNG ÁN B: TỰ ĐỘNG HÓA NGUỒN TÀI KHOẢN & TELEGRAM ALERT =================

export interface SourceAccountConfig {
  id: string;
  sourceName: string; // e.g. "Muakey.com"
  sourceUrl: string; // e.g. "https://muakey.com"
  accountUsername: string;
  sessionToken: string; // Bearer token / Cookie / Session
  balance: number;
  currency: CurrencyCode;
  minThreshold: number; // Ngưỡng cảnh báo số dư, ví dụ: 200,000 VND
  status: 'ONLINE' | 'LOW_BALANCE' | 'SESSION_EXPIRING' | 'OFFLINE';
  lastChecked: string;
  autoReconcile: boolean;
  notes?: string;
}

export interface TelegramZeroDropConfig {
  botToken: string;
  chatId: string;
  backupChatId?: string;
  enabled: boolean;
  retryAttempts: number; // Mặc định 10 lần retry
  sendThresholdAlerts: boolean;
  sendOrderPurchaseAlerts: boolean;
  inlineButtonsEnabled: boolean;
}

export interface TelegramQueueItem {
  id: string;
  orderId?: string;
  chatId: string;
  messageText: string;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'RETRYING' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  deliveredAt?: string;
  httpStatus?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface SourcePendingOrder {
  id: string;
  orderCode: string;
  customerName: string;
  productTitle: string;
  productType: 'key_game' | 'account' | 'topup_manual' | 'gift_card';
  retailPrice: number;
  sourceEstimatedCost: number;
  sourceName: string;
  idempotencyKey: string;
  status: 'AWAITING_FUNDS' | 'PURCHASING_SOURCE' | 'KEY_EXTRACTED' | 'COMMITTED_VAULT' | 'FULFILLED' | 'MANUAL_SUPPORT';
  sourceAccountBalance: number;
  fundsNeeded: number;
  telegramAlertSent: boolean;
  deliveredContent?: string;
  accountDetails?: {
    uid?: string;
    emailDelivery?: string;
    accountNote?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DualStreamChatMessage {
  id: string;
  orderId: string;
  stream: 'CUSTOMER' | 'SOURCE_PROVIDER';
  sender: 'CUSTOMER' | 'ADMIN' | 'PROVIDER_SUPPORT';
  senderName: string;
  text: string;
  timestamp: string;
  isForwarded?: boolean;
}

// SOURCE ACCOUNT CONNECTOR & SCAN ENGINE TYPES
export interface SourceAccountRecord {
  id: string;
  name: string;
  domain: string;
  username: string;
  maskedUsername: string;
  hasPassword: boolean;
  hasSession: boolean;
  browser_profile_id: string;
  connector_type: 'BROWSER' | 'API' | 'HYBRID';
  scanner_profile: string;
  status: 'ONLINE' | 'DEGRADED' | 'SESSION_EXPIRED' | 'LOGIN_FAILED' | 'SOURCE_UNAVAILABLE' | 'REAUTH_REQUIRED' | 'BLOCKED' | 'DISABLED';
  balance: number;
  currency: string;
  low_balance_threshold: number;
  is_active: boolean;
  concurrency_limit: number;
  request_delay_ms: number;
  last_login_at?: string;
  last_scan_at?: string;
  last_successful_scan_at?: string;
  last_purchase_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SourceProductItem {
  id: string;
  source_account_id: string;
  source_product_id: string;
  source_url: string;
  title: string;
  description?: string;
  category_raw?: string;
  original_price: number;
  original_currency: string;
  stock: number;
  source_status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'DISABLED' | 'UNKNOWN' | 'SOURCE_REMOVED';
  is_sync_ignored: boolean;
  missing_scan_count: number;
  price_override?: number;
  markup_percent?: number;
  fixed_markup?: number;
  auto_sync_price: boolean;
  first_seen_at: string;
  last_seen_at: string;
  last_synced_at: string;
}

export interface SourceScanJobRecord {
  id: string;
  source_account_id: string;
  source_account_name?: string;
  scan_type: 'FULL' | 'INCREMENTAL' | 'PRODUCT';
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  progress: number;
  total_categories: number;
  processed_categories: number;
  total_products: number;
  processed_products: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  current_step?: string;
  correlation_id: string;
  started_at?: string;
  finished_at?: string;
  error_message?: string;
  created_at: string;
}

export interface SourceOfferItem {
  id: string;
  internal_product_id: string;
  source_account_id: string;
  source_product_id: string;
  source_name: string;
  source_price: number;
  currency: string;
  calculated_final_price: number;
  stock: number;
  priority: number;
  status: 'ACTIVE' | 'INSUFFICIENT_FUNDS' | 'OUT_OF_STOCK' | 'OFFLINE';
  last_verified_at: string;
}

export interface ScannerProfileItem {
  profileId: string;
  name: string;
  domainPattern: string;
  loginUrl: string;
  categoryListUrl: string;
  categorySelector: string;
  paginationStrategy: 'PAGE' | 'LOAD_MORE' | 'INFINITE_SCROLL' | 'CURSOR';
  maxPagesSafetyLimit: number;
  productCardSelector: string;
  titleSelector: string;
  priceSelector: string;
  stockSelector: string;
  statusSelector: string;
  politenessDelayMs: number;
}



