import { LanguageCode, CurrencyCode } from '../types';
import { getCurrencyRate, BASELINE_RATES } from './rateOracle';

export interface LanguageOption {
  code: LanguageCode;
  displayCode: 'VI' | 'US' | 'CN' | 'JP' | 'KR' | 'RU' | 'FR' | 'DE' | 'ES';
  name: string;
  nativeName: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  aiEngineStatus: 'active' | 'neural' | 'optimized';
}

export interface CurrencyOption {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rateToVnd: number; // 1 Unit = X VND
  format: (val: number) => string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'vi',
    displayCode: 'VI',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    defaultCurrency: 'VND',
    aiEngineStatus: 'neural'
  },
  {
    code: 'en',
    displayCode: 'US',
    name: 'English (US)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    aiEngineStatus: 'neural'
  },
  {
    code: 'zh',
    displayCode: 'CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    defaultCurrency: 'CNY',
    aiEngineStatus: 'optimized'
  },
  {
    code: 'ja',
    displayCode: 'JP',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    defaultCurrency: 'JPY',
    aiEngineStatus: 'neural'
  },
  {
    code: 'ko',
    displayCode: 'KR',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    defaultCurrency: 'KRW',
    aiEngineStatus: 'optimized'
  },
  {
    code: 'ru',
    displayCode: 'RU',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    defaultCurrency: 'USDT',
    aiEngineStatus: 'neural'
  },
  {
    code: 'fr',
    displayCode: 'FR',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    defaultCurrency: 'EUR',
    aiEngineStatus: 'neural'
  },
  {
    code: 'de',
    displayCode: 'DE',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    defaultCurrency: 'EUR',
    aiEngineStatus: 'neural'
  },
  {
    code: 'es',
    displayCode: 'ES',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    defaultCurrency: 'USD',
    aiEngineStatus: 'neural'
  }
];

export const EXCHANGE_RATES: Record<string, number> = {
  VND: 1,
  USD: 25420,
  USDT: 25440,
  EUR: 27580,
  JPY: 165.4,
  CNY: 3525,
  KRW: 18.65,
  GBP: 32310
};

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  {
    code: 'VND',
    name: 'Việt Nam Đồng',
    symbol: '₫',
    flag: '🇻🇳',
    rateToVnd: 1,
    format: (val) => `${new Intl.NumberFormat('vi-VN').format(Math.round(val))} ₫`
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateToVnd: 25420,
    format: (val) => {
      const rate = getCurrencyRate('USD');
      return `$${(val / rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  },
  {
    code: 'USDT',
    name: 'Tether Crypto (TRC20/BEP20)',
    symbol: '₮',
    flag: '🌐',
    rateToVnd: 25440,
    format: (val) => {
      const rate = getCurrencyRate('USDT');
      return `${(val / rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    }
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateToVnd: 27580,
    format: (val) => {
      const rate = getCurrencyRate('EUR');
      return `€${(val / rate).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    rateToVnd: 165.4,
    format: (val) => {
      const rate = getCurrencyRate('JPY');
      return `¥${new Intl.NumberFormat('ja-JP').format(Math.round(val / rate))}`;
    }
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    rateToVnd: 3525,
    format: (val) => {
      const rate = getCurrencyRate('CNY');
      return `¥${(val / rate).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    rateToVnd: 18.65,
    format: (val) => {
      const rate = getCurrencyRate('KRW');
      return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(val / rate))}`;
    }
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    rateToVnd: 32310,
    format: (val) => {
      const rate = getCurrencyRate('GBP');
      return `£${(val / rate).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
];

export function convertAmountFromVnd(amountVnd: number, targetCurrency: CurrencyCode): number {
  const rate = getCurrencyRate(targetCurrency) || 1;
  return amountVnd / rate;
}

export function convertAmountToVnd(amount: number, sourceCurrency: CurrencyCode): number {
  const rate = getCurrencyRate(sourceCurrency) || 1;
  return amount * rate;
}

export function formatWithCurrency(amountVnd: number, currency: CurrencyCode | string = 'VND'): string {
  const cleanCode = (currency || 'VND').toString().trim().toUpperCase();
  const currOption = SUPPORTED_CURRENCIES.find(c => c.code.toUpperCase() === cleanCode);
  if (currOption) {
    return currOption.format(amountVnd);
  }
  return `${new Intl.NumberFormat('vi-VN').format(amountVnd)} ₫`;
}

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  vi: {
    // Header & Brand
    app_brand_sub: 'Sàn Gom Đơn Mua Chung & Cổng Nạp Game Tự Động',
    nav_folder_btn: 'Thư Mục',
    nav_create_pool: 'Mở Gom Đơn',
    nav_key_vault: 'Kho Key',
    nav_deposit: '+ Nạp Tiền',
    nav_deposit_short: '+ Nạp',
    nav_language_currency: 'Ngôn Ngữ & Tiền Tệ',
    nav_wallet_manage: 'Quản Lý Ví',
    nav_available: 'Khả Dụng',
    nav_escrow: 'Ký Quỹ',
    nav_role_admin: 'ADMIN',
    nav_role_vip: 'VIP SỈ',

    // Hero
    hero_badge: 'SÀN GOM ĐƠN MUA CHUNG SẢN PHẨM SỐ & KEY BẢN QUYỀN',
    hero_title_1: 'MUA CHUNG KEY BẢN QUYỀN',
    hero_title_save: 'TIẾT KIỆM ĐẾN 80%',
    hero_desc: 'Giải pháp gom đơn thông minh: Nhận giá sỉ gốc cho ChatGPT Plus, Netflix 4K, Game Steam và 121 tựa game hot. Thanh toán tự động, nhận mã tức thì qua hợp đồng bảo lãnh Escrow 100%.',
    hero_speed_label: 'Tốc Độ Nhận Key',
    hero_speed_val: '3 - 30 Giây',
    hero_speed_sub: 'Tự động trả mã 24/7',
    hero_escrow_label: 'Bảo Lãnh Escrow',
    hero_escrow_val: '100% Hoàn Tiền',
    hero_escrow_sub: 'Bảo hành 1:1 mọi lỗi',

    // Search & Filter
    search_placeholder: 'Tìm kiếm theo tên game, ChatGPT, Netflix, Adobe, Spotify, Steam Key...',
    clear_btn: 'XÓA',
    sort_label: 'Sắp xếp:',
    sort_savings: 'Giảm giá nhiều nhất (% cao)',
    sort_ending_soon: 'Sắp đủ slot (Chốt nhanh)',
    sort_price_low: 'Giá thấp nhất',
    sort_price_high: 'Giá cao nhất',
    sort_popular: 'Phổ biến nhất (Nhiều người gom)',

    // Categories
    cat_all: 'Tất Cả Sản Phẩm',
    cat_topup_games: '⚡ Nạp 121 Game Trực Tiếp',
    cat_ai_tools: 'AI & ChatGPT Plus',
    cat_gaming: 'Key Game Steam / Epic',
    cat_giftup_cards: 'GiftUp E-Vouchers',
    cat_streaming: 'Netflix 4K & Phim',
    cat_software: 'Adobe & Công Cụ Bản Quyền',
    cat_vpn: 'VPN & An Toàn Số',

    // Product Card
    prod_pool_status: 'Tiến độ gom',
    prod_last_slot: '⚡ Chỉ còn 1 slot cuối!',
    prod_need: 'Cần thêm',
    prod_slots_left: 'slot nữa',
    prod_no_pool: 'Chưa có nhóm gom mở sẵn',
    prod_retail: 'Giá lẻ gốc',
    prod_group_price: 'Giá gom sỉ',
    prod_join_pool: 'GOM ĐƠN NGAY',
    prod_instant_buy: 'Mua Lẻ Ngay',

    // Active Pools Showcase
    showcase_title: 'DANH SÁCH NHÓM GOM ĐANG HOẠT ĐỘNG',
    showcase_items: 'Mục',
    showcase_escrow_note: 'Mã bản quyền & E-Gift Card giải phóng tự động qua hợp đồng Escrow bảo lãnh 100%',
    showcase_tab_all: 'Tất cả',
    showcase_tab_almost_full: 'Sắp đủ slot',
    showcase_tab_ai: 'AI Tools',
    showcase_tab_gaming: 'Game Steam',
    showcase_tab_giftup: 'GiftUp Card',
    showcase_scroll_mode: 'Cuộn Ngang',
    showcase_grid_mode: 'Lưới Grid',

    // Active Pools & Products
    pools_title: 'CÁC KÈO GOM ĐƠN ĐANG DIỄN RA',
    pools_subtitle: 'Tham gia mua chung cùng cộng đồng để nhận mức giá sỉ rẻ nhất thị trường',
    pool_slots_left: 'còn lại',
    pool_join_btn: 'Tham Gia Gom',
    pool_retail_price: 'Giá gốc',
    pool_save_tag: 'Tiết kiệm',
    pool_status_filling: 'Đang gom slot',
    pool_status_completed: 'Đã hoàn tất',

    // AI Language Modal
    modal_title: 'BỘ CHUYỂN ĐỔI NGÔN NGỮ & TIỀN TỆ AI',
    modal_subtitle: 'Hệ thống tự động dịch thuật theo ngữ cảnh và quy đổi tỷ giá thời gian thực',
    tab_language: 'Ngôn Ngữ AI',
    tab_currency: 'Tiền Tệ & Tỷ Giá',
    tab_oracle: 'Cron Tỷ Giá & Oracle',
    tab_presets: 'Gợi Ý Nhanh',
    ai_status_badge: '⚡ Động Cơ Dịch Thuật Neural AI Đang Kích Hoạt',
    ai_auto_pair_label: 'Tự động khớp tiền tệ tương ứng theo ngôn ngữ',
    select_language_title: 'Chọn Ngôn Ngữ Giao Diện',
    select_currency_title: 'Chọn Đồng Tiền Hiển Thị',
    exchange_calc_title: 'Máy Tính Quy Đổi Trực Tiếp (Real-Time)',
    live_rates_title: 'Bảng Tỷ Giá Hệ Thống CyberPool',
    apply_btn: 'ÁP DỤNG THAY ĐỔI',
    reset_btn: 'Đặt lại mặc định',
    ai_translated_live: 'Tất cả giá tiền, số dư ví và nhãn giao diện sẽ tự động cập nhật ngay lập tức.',

    // Oracle & Cron
    oracle_cron_status: 'Trạng Thái Cron Hàng Giờ',
    oracle_cron_active: '⚡ TỰ ĐỘNG CHẠY MỖI GIỜ (0 * * * *)',
    oracle_next_sync: 'Lần chạy Cron tiếp theo trong',
    oracle_manual_sync: 'Cập Nhật Tỷ Giá Ngay',
    oracle_slippage_protection: 'Bảo Hiểm Trượt Giá (0% Slippage)',
    oracle_slippage_desc: 'Khóa tỷ giá cố định 60 phút khi khớp đơn, bảo vệ tuyệt đối quyền lợi giữa người mua và người bán.',
    oracle_sources: 'Nguồn Dữ Liệu Oracle:',
    oracle_history_logs: 'Nhật Ký Chạy Cron Hàng Giờ',
    oracle_cron_expression: 'Biểu Thức Cron Tỷ Giá'
  },

  en: {
    // Header & Brand
    app_brand_sub: 'Group-Buying Pool & Instant Game Top-Up Exchange',
    nav_folder_btn: 'Utilities',
    nav_create_pool: 'Create Pool',
    nav_key_vault: 'Key Vault',
    nav_deposit: '+ Deposit',
    nav_deposit_short: '+ Add Funds',
    nav_language_currency: 'Language & Currency',
    nav_wallet_manage: 'Wallet Settings',
    nav_available: 'Available',
    nav_escrow: 'Escrow Locked',
    nav_role_admin: 'ADMIN',
    nav_role_vip: 'WHOLESALE VIP',

    // Hero
    hero_badge: 'ZERO-HOLDING GROUP-BUYING & DIGITAL LICENSES EXCHANGE',
    hero_title_1: 'GROUP-BUY SOFTWARE & KEYS',
    hero_title_save: 'SAVE UP TO 80%',
    hero_desc: 'Smart group-buying solution: Unlock wholesale pricing for ChatGPT Plus, Netflix 4K, Steam Keys, and 121 top games. Automated checkout, instant key delivery backed by 100% Escrow Guarantee.',
    hero_speed_label: 'Delivery Speed',
    hero_speed_val: '3 - 30 Seconds',
    hero_speed_sub: '24/7 Automated Dispatch',
    hero_escrow_label: 'Escrow Guarantee',
    hero_escrow_val: '100% Refundable',
    hero_escrow_sub: '1:1 Replacement Warranty',

    // Search & Filter
    search_placeholder: 'Search by game title, ChatGPT, Netflix, Adobe, Spotify, Steam Key...',
    clear_btn: 'CLEAR',
    sort_label: 'Sort by:',
    sort_savings: 'Highest Discount (%)',
    sort_ending_soon: 'Almost Full (Fast Match)',
    sort_price_low: 'Lowest Price',
    sort_price_high: 'Highest Price',
    sort_popular: 'Most Popular (Highest Pools)',

    // Categories
    cat_all: 'All Digital Products',
    cat_topup_games: '⚡ Instant Direct Top-Up (121 Games)',
    cat_ai_tools: 'AI & ChatGPT Plus',
    cat_gaming: 'Steam & Epic Game Keys',
    cat_giftup_cards: 'GiftUp E-Vouchers',
    cat_streaming: 'Netflix 4K & Streaming',
    cat_software: 'Adobe & License Tools',
    cat_vpn: 'VPN & Digital Security',

    // Product Card
    prod_pool_status: 'Pool Progress',
    prod_last_slot: '⚡ Only 1 slot left!',
    prod_need: 'Need',
    prod_slots_left: 'more slots',
    prod_no_pool: 'No active pool currently open',
    prod_retail: 'Retail Price',
    prod_group_price: 'Wholesale Price',
    prod_join_pool: 'JOIN POOL',
    prod_instant_buy: 'Buy Retail Now',

    // Active Pools Showcase
    showcase_title: 'ACTIVE GROUP-BUYING POOLS',
    showcase_items: 'Items',
    showcase_escrow_note: 'Keys and digital vouchers are dispatched automatically with 100% Escrow buyer protection',
    showcase_tab_all: 'All Pools',
    showcase_tab_almost_full: 'Almost Full',
    showcase_tab_ai: 'AI Tools',
    showcase_tab_gaming: 'Steam Games',
    showcase_tab_giftup: 'GiftUp Card',
    showcase_scroll_mode: 'Carousel',
    showcase_grid_mode: 'Grid View',

    // Active Pools & Products
    pools_title: 'ACTIVE GROUP-BUYING POOLS',
    pools_subtitle: 'Join community pools to lock in the lowest wholesale prices available anywhere',
    pool_slots_left: 'slots left',
    pool_join_btn: 'Join Pool',
    pool_retail_price: 'Retail',
    pool_save_tag: 'Save',
    pool_status_filling: 'Filling Slots',
    pool_status_completed: 'Completed',

    // AI Language Modal
    modal_title: 'AI LANGUAGE & CURRENCY LOCALIZATION HUB',
    modal_subtitle: 'Contextual AI machine translation paired with real-time multi-currency FX engine',
    tab_language: 'AI Language',
    tab_currency: 'Currency & Rates',
    tab_oracle: 'Hourly Cron & Oracle',
    tab_presets: 'Quick Presets',
    ai_status_badge: '⚡ Neural AI Translation Engine is Active',
    ai_auto_pair_label: 'Auto-sync regional currency when changing language',
    select_language_title: 'Select User Interface Language',
    select_currency_title: 'Select Display Currency',
    exchange_calc_title: 'Live FX Currency Converter',
    live_rates_title: 'CyberPool Official Exchange Rates Table',
    apply_btn: 'APPLY SETTINGS',
    reset_btn: 'Reset to Default',
    ai_translated_live: 'All prices, wallet balance, and UI labels will immediately adapt to your chosen locale.',

    // Oracle & Cron
    oracle_cron_status: 'Hourly Cron Status',
    oracle_cron_active: '⚡ ACTIVE HOURLY CRON (0 * * * *)',
    oracle_next_sync: 'Next Scheduled Cron Sync in',
    oracle_manual_sync: 'Sync Rates Now',
    oracle_slippage_protection: 'Zero Slippage Guarantee',
    oracle_slippage_desc: 'Locks FX rate for 60 minutes when joining pools to prevent any discrepancy between buyers and sellers.',
    oracle_sources: 'Oracle Feed Sources:',
    oracle_history_logs: 'Recent Hourly Cron Sync Logs',
    oracle_cron_expression: 'Cron Schedule Expression'
  },

  zh: {
    app_brand_sub: '数字商品拼团采购与游戏自动直充交易所',
    nav_folder_btn: '工具箱',
    nav_create_pool: '发起拼团',
    nav_key_vault: '卡密保险库',
    nav_deposit: '+ 充值',
    nav_deposit_short: '+ 充值',
    nav_language_currency: '多语言与多币种',
    nav_wallet_manage: '钱包管理',
    nav_available: '可用余额',
    nav_escrow: '托管冻结',
    nav_role_admin: '管理员',
    nav_role_vip: '批发VIP',

    hero_badge: '零压资模式 • 拼团正版卡密与游戏服务',
    hero_title_1: '正版卡密拼团直购',
    hero_title_save: '最高立省 80%',
    hero_desc: '智能拼团直购系统：以批发底价获取 ChatGPT Plus、Netflix 4K、Steam 正版游戏及 121 款热门游戏充值。全自动出码，100% Escrow 担保资金安全。',
    hero_speed_label: '出卡速度',
    hero_speed_val: '3 - 30 秒',
    hero_speed_sub: '24/7 全自动发货',
    hero_escrow_label: 'Escrow 担保',
    hero_escrow_val: '100% 赔付退款',
    hero_escrow_sub: '1:1 质保售后',

    search_placeholder: '搜索游戏名称、ChatGPT、Netflix、Adobe、Spotify、Steam 卡密...',
    clear_btn: '清除',
    sort_label: '排序方式:',
    sort_savings: '折扣最高 (%)',
    sort_ending_soon: '即将成团 (快速拼成)',
    sort_price_low: '价格从低到高',
    sort_price_high: '价格从高到低',
    sort_popular: '最受欢迎 (热门拼团)',

    cat_all: '全部数字产品',
    cat_topup_games: '⚡ 121 款游戏全自动直充',
    cat_ai_tools: 'AI 工具与 ChatGPT Plus',
    cat_gaming: 'Steam / Epic 游戏激活码',
    cat_giftup_cards: 'GiftUp 电子礼品卡',
    cat_streaming: 'Netflix 4K 与流媒体',
    cat_software: 'Adobe 与正版生产力软件',
    cat_vpn: 'VPN 与网络安全服务',

    prod_pool_status: '拼团进度',
    prod_last_slot: '⚡ 仅剩最后1席!',
    prod_need: '还需',
    prod_slots_left: '席成团',
    prod_no_pool: '暂无进行中的拼团',
    prod_retail: '原价零售',
    prod_group_price: '拼团批发价',
    prod_join_pool: '立即参团',
    prod_instant_buy: '原价直购',

    showcase_title: '进行中的热门拼团',
    showcase_items: '件商品',
    showcase_escrow_note: '正版卡密与电子礼品卡由 Escrow 资金托管协议自动结算并 100% 保障',
    showcase_tab_all: '全部拼团',
    showcase_tab_almost_full: '即将成团',
    showcase_tab_ai: 'AI 工具',
    showcase_tab_gaming: 'Steam 游戏',
    showcase_tab_giftup: 'GiftUp 礼品卡',
    showcase_scroll_mode: '横向滚动',
    showcase_grid_mode: '网格视图',

    pools_title: '进行中的热门拼团',
    pools_subtitle: '与社区玩家拼单以锁定市场最低批发特惠价',
    pool_slots_left: '剩余名额',
    pool_join_btn: '立即参团',
    pool_retail_price: '原价',
    pool_save_tag: '立省',
    pool_status_filling: '正在成团',
    pool_status_completed: '已满员发货',

    modal_title: 'AI 多语言与实时货币转换中心',
    modal_subtitle: '基于神经网络上下文翻译与实时外汇汇率换算引擎',
    tab_language: 'AI 语言设置',
    tab_currency: '货币与实时汇率',
    tab_oracle: '每小时 Cron 汇率与预言机',
    tab_presets: '快捷预设',
    ai_status_badge: '⚡ Neural AI 智能翻译引擎已生效',
    ai_auto_pair_label: '切换语言时自动关联对应国家货币',
    select_language_title: '选择界面显示语言',
    select_currency_title: '选择账户显示币种',
    exchange_calc_title: '实时汇率计算器',
    live_rates_title: 'CyberPool 官方基准汇率表',
    apply_btn: '保存并应用',
    reset_btn: '重置为默认',
    ai_translated_live: '所有商品价格、钱包余额及界面标签已根据当前币种即时换算。',

    oracle_cron_status: '每小时定时汇率状态',
    oracle_cron_active: '⚡ 每小时自动执行 (0 * * * *)',
    oracle_next_sync: '距离下次定时同步还有',
    oracle_manual_sync: '立即同步汇率',
    oracle_slippage_protection: '零滑点保障 (Zero Slippage)',
    oracle_slippage_desc: '参团时锁定 60 分钟固定汇率，杜绝买家与卖家之间的汇率滑点与差价。',
    oracle_sources: '预言机数据源:',
    oracle_history_logs: '最近定时同步日志',
    oracle_cron_expression: 'Cron 调度表达式'
  },

  ja: {
    app_brand_sub: 'デジタル商品共同購入＆ゲーム自動即時チャージ取引所',
    nav_folder_btn: 'ツール一覧',
    nav_create_pool: '共同購入作成',
    nav_key_vault: 'キー保管庫',
    nav_deposit: '+ チャージ',
    nav_deposit_short: '+ 入金',
    nav_language_currency: '言語＆通貨設定',
    nav_wallet_manage: 'ウォレット管理',
    nav_available: '利用可能額',
    nav_escrow: 'エスクロー担保',
    nav_role_admin: '管理者',
    nav_role_vip: '卸売VIP',

    hero_badge: 'デジタルライセンス共同購入＆即時納品取引所',
    hero_title_1: '正規ライセンス共同購入',
    hero_title_save: '最大 80% オフ',
    hero_desc: 'ChatGPT Plus、Netflix 4K、Steam キー、および 121 の人気ゲームを卸売価格で共同購入。自動決済と 100% エスクロー保証付きの即時納品。',
    hero_speed_label: '納品スピード',
    hero_speed_val: '3 〜 30 秒',
    hero_speed_sub: '24時間年中無休の自動納品',
    hero_escrow_label: 'エスクロー保証',
    hero_escrow_val: '100% 返金保証',
    hero_escrow_sub: '1対1の交換保証',

    search_placeholder: 'ゲーム名、ChatGPT、Netflix、Adobe、Spotify、Steam キーを検索...',
    clear_btn: 'クリア',
    sort_label: '並び替え:',
    sort_savings: '割引率が高い順 (%)',
    sort_ending_soon: '締切間近 (高速完了)',
    sort_price_low: '価格が安い順',
    sort_price_high: '価格が高い順',
    sort_popular: '人気順 (参加者多数)',

    cat_all: '全商品一覧',
    cat_topup_games: '⚡ 121 ゲーム即時ダイレクトチャージ',
    cat_ai_tools: 'AI ＆ ChatGPT Plus',
    cat_gaming: 'Steam / Epic ゲームキー',
    cat_giftup_cards: 'GiftUp ギフトカード',
    cat_streaming: 'Netflix 4K ＆ 配信サービス',
    cat_software: 'Adobe ＆ 正規ソフトウェア',
    cat_vpn: 'VPN ＆ セキュリティ',

    prod_pool_status: '募集進捗',
    prod_last_slot: '⚡ 残り1枠のみ!',
    prod_need: 'あと',
    prod_slots_left: '枠で成立',
    prod_no_pool: '現在開催中のグループはありません',
    prod_retail: '通常価格',
    prod_group_price: '共同購入価格',
    prod_join_pool: '共同購入に参加',
    prod_instant_buy: '通常購入',

    showcase_title: '現在進行中の共同購入プール',
    showcase_items: '件',
    showcase_escrow_note: '正規キーおよび電子ギフト券は 100% エスクロー保護により即時自動納品されます',
    showcase_tab_all: 'すべて',
    showcase_tab_almost_full: '締切間近',
    showcase_tab_ai: 'AI ツール',
    showcase_tab_gaming: 'Steam ゲーム',
    showcase_tab_giftup: 'GiftUp カード',
    showcase_scroll_mode: 'カルーセル',
    showcase_grid_mode: 'グリッド表示',

    pools_title: '現在進行中の共同購入プール',
    pools_subtitle: 'コミュニティと共同購入して業界最安値の卸売価格をゲット',
    pool_slots_left: '残り枠',
    pool_join_btn: '参加する',
    pool_retail_price: '定価',
    pool_save_tag: 'お得',
    pool_status_filling: '募集中',
    pool_status_completed: '完了',

    modal_title: 'AI 言語＆通貨ローカリゼーションハブ',
    modal_subtitle: 'コンテキスト対応 AI 翻訳とリアルタイム為替レート換算エンジン',
    tab_language: 'AI 言語選択',
    tab_currency: '通貨＆為替レート',
    tab_oracle: '毎時 Cron 為替オラクル',
    tab_presets: 'クイック設定',
    ai_status_badge: '⚡ ニューラル AI 翻訳エンジンが稼働中',
    ai_auto_pair_label: '言語変更時に該当地域の通貨を自動設定',
    select_language_title: 'UI 表示言語を選択',
    select_currency_title: '表示通貨を選択',
    exchange_calc_title: 'リアルタイム為替計算機',
    live_rates_title: 'CyberPool 公式為替レート表',
    apply_btn: '設定を適用',
    reset_btn: '初期設定に戻す',
    ai_translated_live: 'すべての価格、残高、UI テキストが選択した言語と通貨に即座に適応されます。',

    oracle_cron_status: '毎時 Cron レート状態',
    oracle_cron_active: '⚡ 毎時自動更新中 (0 * * * *)',
    oracle_next_sync: '次回の自動更新まで',
    oracle_manual_sync: '今すぐレート更新',
    oracle_slippage_protection: 'スリッページゼロ保証 (0% Slippage)',
    oracle_slippage_desc: '共同購入参加時に為替レートを60分間固定し、買い手と売り手の間の為替差損を完全に防ぎます。',
    oracle_sources: 'オラクルソース:',
    oracle_history_logs: '最新の Cron 実行ログ',
    oracle_cron_expression: 'Cron スケジュール式'
  },

  ko: {
    app_brand_sub: '디지털 라이선스 공동구매 및 게임 즉시 자동 충전소',
    nav_folder_btn: '유틸리티',
    nav_create_pool: '공동구매 생성',
    nav_key_vault: '키 보관함',
    nav_deposit: '+ 충전하기',
    nav_deposit_short: '+ 충전',
    nav_language_currency: '언어 및 통화 설정',
    nav_wallet_manage: '지갑 관리',
    nav_available: '사용 가능 잔액',
    nav_escrow: '에스크로 락업',
    nav_role_admin: '관리자',
    nav_role_vip: '도매 VIP',

    hero_badge: '디지털 라이선스 및 게임 상품 공동구매 거래소',
    hero_title_1: '정품 키 & 소프트웨어 공동구매',
    hero_title_save: '최대 80% 할인',
    hero_desc: '스마트 공동구매 플랫폼: ChatGPT Plus, Netflix 4K, Steam 게임 키 및 121개 인기 게임을 최저 도매가로 구매하세요. 100% 에스크로 보호로 안전하고 빠른 즉시 발급.',
    hero_speed_label: '발급 속도',
    hero_speed_val: '3 - 30 초',
    hero_speed_sub: '24/7 자동 발급 시스템',
    hero_escrow_label: '에스크로 보증',
    hero_escrow_val: '100% 환불 보장',
    hero_escrow_sub: '1:1 완벽 무상 교환',

    search_placeholder: '게임 제목, ChatGPT, Netflix, Adobe, Spotify, Steam 키 검색...',
    clear_btn: '지우기',
    sort_label: '정렬 기준:',
    sort_savings: '할인율 높은 순 (%)',
    sort_ending_soon: '마감 임박 (빠른 매칭)',
    sort_price_low: '낮은 가격순',
    sort_price_high: '높은 가격순',
    sort_popular: '인기순 (참여자 많은 순)',

    cat_all: '전체 상품',
    cat_topup_games: '⚡ 121개 게임 다이렉트 즉시 충전',
    cat_ai_tools: 'AI 및 ChatGPT Plus',
    cat_gaming: 'Steam / Epic 정품 게임 키',
    cat_giftup_cards: 'GiftUp 모바일 상품권',
    cat_streaming: 'Netflix 4K 및 스트리밍',
    cat_software: 'Adobe 및 정품 라이선스',
    cat_vpn: 'VPN 및 개인정보 보안',

    prod_pool_status: '모집 현황',
    prod_last_slot: '⚡ 단 1자리 남음!',
    prod_need: '추가',
    prod_slots_left: '자리 필요',
    prod_no_pool: '개설된 공구 없음',
    prod_retail: '정상 소비자 가격',
    prod_group_price: '공동구매 도매가',
    prod_join_pool: '공구 참여하기',
    prod_instant_buy: '단품 바로구매',

    showcase_title: '현재 진행 중인 공동구매 풀',
    showcase_items: '개 품목',
    showcase_escrow_note: '정품 키 및 기프트카드는 100% 에스크로 보증 계약을 통해 자동 발급됩니다',
    showcase_tab_all: '전체 공구',
    showcase_tab_almost_full: '마감 임박',
    showcase_tab_ai: 'AI 도구',
    showcase_tab_gaming: '스팀 게임',
    showcase_tab_giftup: 'GiftUp 카드',
    showcase_scroll_mode: '가로 스크롤',
    showcase_grid_mode: '그리드 뷰',

    pools_title: '현재 진행 중인 공동구매 풀',
    pools_subtitle: '커뮤니티와 함께 구매하여 시장 최저가 혜택을 누리세요',
    pool_slots_left: '자리 남음',
    pool_join_btn: '공동구매 참여',
    pool_retail_price: '정가',
    pool_save_tag: '절약',
    pool_status_filling: '모집 중',
    pool_status_completed: '완료됨',

    modal_title: 'AI 다국어 및 통화 현지화 허브',
    modal_subtitle: '신경망 컨텍스트 기반 번역과 실시간 외환 환율 엔진',
    tab_language: 'AI 언어 설정',
    tab_currency: '통화 및 환율',
    tab_oracle: '매시간 Cron 환율 오라클',
    tab_presets: '빠른 프리셋',
    ai_status_badge: '⚡ Neural AI 자동 번역 엔진 활성화됨',
    ai_auto_pair_label: '언어 변경 시 해당 국가 통화로 자동 맞춤',
    select_language_title: '사용자 인터페이스 언어 선택',
    select_currency_title: '표시 통화 선택',
    exchange_calc_title: '실시간 통화 환율 계산기',
    live_rates_title: 'CyberPool 공식 기준 환율표',
    apply_btn: '설정 적용하기',
    reset_btn: '기본값 초기화',
    ai_translated_live: '모든 상품 가격, 지갑 잔액 및 UI 문구가 즉시 선택한 언어와 통화로 반영됩니다.',

    oracle_cron_status: '매시간 Cron 환율 상태',
    oracle_cron_active: '⚡ 매시간 자동 실행 중 (0 * * * *)',
    oracle_next_sync: '다음 Cron 동기화까지',
    oracle_manual_sync: '지금 환율 즉시 동기화',
    oracle_slippage_protection: '슬리피지 0% 보장 (Zero Slippage)',
    oracle_slippage_desc: '공동구매 참여 시 60분간 고정 환율을 적용하여 구매자와 판매자 간의 환율 변동 손실을 완벽히 방지합니다.',
    oracle_sources: '오라클 데이터 소스:',
    oracle_history_logs: '최근 정기 Cron 실행 로그',
    oracle_cron_expression: 'Cron 스케줄 식'
  },

  ru: {
    app_brand_sub: 'Биржа совместных покупок цифровых товаров и авто-пополнения игр',
    nav_folder_btn: 'Утилиты',
    nav_create_pool: 'Создать пул',
    nav_key_vault: 'Склад ключей',
    nav_deposit: '+ Пополнить',
    nav_deposit_short: '+ Баланс',
    nav_language_currency: 'Язык и Валюта',
    nav_wallet_manage: 'Кошелек',
    nav_available: 'Доступно',
    nav_escrow: 'В эскроу',
    nav_role_admin: 'АДМИН',
    nav_role_vip: 'ОПТОВЫЙ VIP',

    hero_badge: 'СОВМЕСТНЫЕ ПОКУПКИ ЦИФРОВЫХ КЛЮЧЕЙ И ЛИЦЕНЗИЙ',
    hero_title_1: 'СОВМЕСТНАЯ ПОКУПКА КЛЮЧЕЙ',
    hero_title_save: 'СКИДКИ ДО 80%',
    hero_desc: 'Умный групповой выкуп по оптовым ценам: ChatGPT Plus, Netflix 4K, Steam ключи и 121 популярная игра. Мгновенная выдача и 100% гарантия Escrow.',
    hero_speed_label: 'Скорость выдачи',
    hero_speed_val: '3 - 30 сек',
    hero_speed_sub: 'Автовыдача 24/7',
    hero_escrow_label: 'Гарантия Escrow',
    hero_escrow_val: '100% Возврат',
    hero_escrow_sub: 'Замена 1:1 при любой проблеме',

    search_placeholder: 'Поиск игр, ChatGPT, Netflix, Adobe, Spotify, Steam ключей...',
    clear_btn: 'СБРОС',
    sort_label: 'Сортировка:',
    sort_savings: 'Макс. скидка (%)',
    sort_ending_soon: 'Скоро завершится',
    sort_price_low: 'Сначала дешевые',
    sort_price_high: 'Сначала дорогие',
    sort_popular: 'Популярные',

    cat_all: 'Все товары',
    cat_topup_games: '⚡ Прямой донат в 121 игру',
    cat_ai_tools: 'AI и ChatGPT Plus',
    cat_gaming: 'Ключи Steam / Epic',
    cat_giftup_cards: 'GiftUp карты оплаты',
    cat_streaming: 'Netflix 4K и кино',
    cat_software: 'Adobe и софт',
    cat_vpn: 'VPN и безопасность',

    prod_pool_status: 'Прогресс пула',
    prod_last_slot: '⚡ Осталось 1 место!',
    prod_need: 'Нужно еще',
    prod_slots_left: 'мест',
    prod_no_pool: 'Нет активных пулов',
    prod_retail: 'Розница',
    prod_group_price: 'Оптовая цена',
    prod_join_pool: 'ВСТУПИТЬ В ПУЛ',
    prod_instant_buy: 'Купить сразу',

    showcase_title: 'АКТИВНЫЕ ПУЛЫ СОВМЕСТНЫХ ПОКУПОК',
    showcase_items: 'товаров',
    showcase_escrow_note: 'Ключи и промокоды выдаются автоматически под 100% защитой Escrow',
    showcase_tab_all: 'Все пулы',
    showcase_tab_almost_full: 'Почти собраны',
    showcase_tab_ai: 'AI сервисы',
    showcase_tab_gaming: 'Steam игры',
    showcase_tab_giftup: 'GiftUp карты',
    showcase_scroll_mode: 'Карусель',
    showcase_grid_mode: 'Сетка',

    pools_title: 'АКТИВНЫЕ ПУЛЫ СОВМЕСТНЫХ ПОКУПОК',
    pools_subtitle: 'Покупайте вместе с сообществом по минимальным оптовым ценам',
    pool_slots_left: 'мест осталось',
    pool_join_btn: 'Вступить в пул',
    pool_retail_price: 'Розница',
    pool_save_tag: 'Выгода',
    pool_status_filling: 'Набор участников',
    pool_status_completed: 'Завершен',

    modal_title: 'AI ЛОКАЛИЗАЦИЯ И МУЛЬТИВАЛЮТНЫЙ ХАБ',
    modal_subtitle: 'Контекстный нейросетевой перевод интерфейса и конвертер валют в реальном времени',
    tab_language: 'AI Язык',
    tab_currency: 'Валюта и Курсы',
    tab_oracle: 'Ежечасный Cron и Оракул',
    tab_presets: 'Быстрые пресеты',
    ai_status_badge: '⚡ Нейросетевой движок AI активен',
    ai_auto_pair_label: 'Автоматически синхронизировать валюту при смене языка',
    select_language_title: 'Выберите язык интерфейса',
    select_currency_title: 'Выберите валюту отображения',
    exchange_calc_title: 'Калькулятор валют в реальном времени',
    live_rates_title: 'Официальные обменные курсы CyberPool',
    apply_btn: 'ПРИМЕНИТЬ',
    reset_btn: 'Сбросить',
    ai_translated_live: 'Все цены, баланс кошелька и тексты интерфейса мгновенно пересчитаны.',

    oracle_cron_status: 'Статус ежечасного Cron',
    oracle_cron_active: '⚡ ЕЖЕЧАСНЫЙ АВТО-CRON (0 * * * *)',
    oracle_next_sync: 'Следующий запуск Cron через',
    oracle_manual_sync: 'Обновить курсы сейчас',
    oracle_slippage_protection: 'Защита от проскальзывания (0% Slippage)',
    oracle_slippage_desc: 'Фиксация курса на 60 минут при участии в пуле исключает любые курсовые расхождения между покупателем и продавцом.',
    oracle_sources: 'Источники Оракула:',
    oracle_history_logs: 'Логи выполнения Cron',
    oracle_cron_expression: 'Cron расписание'
  },

  fr: {
    app_brand_sub: 'Bourse d\'achat groupé de clés numériques & recharge automatique de jeux',
    nav_folder_btn: 'Outils',
    nav_create_pool: 'Créer un Pool',
    nav_key_vault: 'Coffre de Clés',
    nav_deposit: '+ Déposer',
    nav_deposit_short: '+ Créditer',
    nav_language_currency: 'Langue & Devise',
    nav_wallet_manage: 'Mon Portefeuille',
    nav_available: 'Disponible',
    nav_escrow: 'En Séquestre',
    nav_role_admin: 'ADMIN',
    nav_role_vip: 'VIP GROS',

    hero_badge: 'ACHAT GROUPÉ ZÉRO CAPITAL & LICENCES NUMÉRIQUES SÉCURISÉES',
    hero_title_1: 'ACHAT GROUPÉ DE LOGICIELS & CLÉS',
    hero_title_save: 'ÉCONOMISEZ JUSQU\'À 80%',
    hero_desc: 'Tarifs de gros imbattables pour ChatGPT Plus, Netflix 4K, jeux Steam et 121 jeux mobiles. Livraison instantanée sous garantie Escrow 100%.',
    hero_speed_label: 'Vitesse de Livraison',
    hero_speed_val: '3 à 30 Secondes',
    hero_speed_sub: 'Distribution 24/7 automatique',
    hero_escrow_label: 'Garantie Escrow',
    hero_escrow_val: '100% Remboursable',
    hero_escrow_sub: 'Garantie de remplacement 1:1',

    search_placeholder: 'Rechercher un jeu, ChatGPT, Netflix, Adobe, Spotify, Clé Steam...',
    clear_btn: 'EFFACER',
    sort_label: 'Trier par:',
    sort_savings: 'Meilleure remise (%)',
    sort_ending_soon: 'Bientôt complet',
    sort_price_low: 'Prix croissant',
    sort_price_high: 'Prix décroissant',
    sort_popular: 'Populaire',

    cat_all: 'Tous les Produits',
    cat_topup_games: '⚡ Recharge Directe (121 Jeux)',
    cat_ai_tools: 'IA & ChatGPT Plus',
    cat_gaming: 'Clés Steam & Epic',
    cat_giftup_cards: 'Cartes GiftUp',
    cat_streaming: 'Netflix 4K & Séries',
    cat_software: 'Adobe & Logiciels Pro',
    cat_vpn: 'VPN & Cyber Sécurité',

    prod_pool_status: 'Progression du Pool',
    prod_last_slot: '⚡ Plus qu\'1 place restante!',
    prod_need: 'Encore',
    prod_slots_left: 'places',
    prod_no_pool: 'Aucun pool ouvert pour le moment',
    prod_retail: 'Prix Public',
    prod_group_price: 'Prix de Gros',
    prod_join_pool: 'REJOINDRE LE POOL',
    prod_instant_buy: 'Acheter Direct',

    showcase_title: 'POOLS D\'ACHAT GROUPÉ ACTIFS',
    showcase_items: 'articles',
    showcase_escrow_note: 'Livraison automatisée de codes avec protection acheteur Escrow à 100%',
    showcase_tab_all: 'Tous les Pools',
    showcase_tab_almost_full: 'Bientôt Complets',
    showcase_tab_ai: 'Outils IA',
    showcase_tab_gaming: 'Jeux Steam',
    showcase_tab_giftup: 'Cartes Cadeaux',
    showcase_scroll_mode: 'Carrousel',
    showcase_grid_mode: 'Grille',

    pools_title: 'POOLS D\'ACHAT GROUPÉ ACTIFS',
    pools_subtitle: 'Rejoignez la communauté pour bénéficier des prix de gros les plus bas',
    pool_slots_left: 'places restantes',
    pool_join_btn: 'Rejoindre',
    pool_retail_price: 'Prix public',
    pool_save_tag: 'Économie',
    pool_status_filling: 'Remplissage',
    pool_status_completed: 'Complété',

    modal_title: 'CENTRE DE LOCALISATION IA & MULTI-DEVISES',
    modal_subtitle: 'Traduction automatique neuronale et conversion de taux de change en direct',
    tab_language: 'Langue IA',
    tab_currency: 'Devises & Taux',
    tab_oracle: 'Cron Horaire & Oracle',
    tab_presets: 'Raccourcis',
    ai_status_badge: '⚡ Moteur de Traduction Neuronale Actif',
    ai_auto_pair_label: 'Associer automatiquement la devise au changement de langue',
    select_language_title: 'Sélectionner la Langue',
    select_currency_title: 'Sélectionner la Devise d\'Affichage',
    exchange_calc_title: 'Convertisseur de Devises en Direct',
    live_rates_title: 'Taux de Change CyberPool Officiels',
    apply_btn: 'APPLIQUER',
    reset_btn: 'Par Défaut',
    ai_translated_live: 'Tous les prix et le solde s\'adaptent immédiatement à votre devise.',

    oracle_cron_status: 'Statut du Cron Horaire',
    oracle_cron_active: '⚡ CRON HORAIRE ACTIF (0 * * * *)',
    oracle_next_sync: 'Prochaine synchronisation dans',
    oracle_manual_sync: 'Actualiser les taux',
    oracle_slippage_protection: 'Garantie Zéro Glissement (0% Slippage)',
    oracle_slippage_desc: 'Verrouillage du taux pendant 60 min lors de la participation à un pool pour éliminer tout écart entre acheteur et vendeur.',
    oracle_sources: 'Sources Oracle:',
    oracle_history_logs: 'Historique des Exécutions Cron',
    oracle_cron_expression: 'Expression Cron'
  },

  de: {
    app_brand_sub: 'Digitale Sammelkauf-Börse & Automatische Gaming-Guthaben-Plattform',
    nav_folder_btn: 'Dienstprogramme',
    nav_create_pool: 'Pool Erstellen',
    nav_key_vault: 'Schlüsselsafe',
    nav_deposit: '+ Einzahlen',
    nav_deposit_short: '+ Guthaben',
    nav_language_currency: 'Sprache & Währung',
    nav_wallet_manage: 'Wallet Verwalten',
    nav_available: 'Verfügbar',
    nav_escrow: 'Im Treuhand',
    nav_role_admin: 'ADMIN',
    nav_role_vip: 'GROSSHANDEL VIP',

    hero_badge: 'SAMMELKAUF OHNE KAPITALBINDUNG & DIGITALE LIZENZEN',
    hero_title_1: 'SOFTWARE & KEYS IM SAMMELKAUF',
    hero_title_save: 'BIS ZU 80% SPAREN',
    hero_desc: 'Großhandelspreise für ChatGPT Plus, Netflix 4K, Steam-Keys und 121 Spiele. Sofortige automatisierte Schlüsselausgabe mit 100% Treuhandschutz.',
    hero_speed_label: 'Liefergeschwindigkeit',
    hero_speed_val: '3 - 30 Sekunden',
    hero_speed_sub: '24/7 Automatische Auslieferung',
    hero_escrow_label: 'Escrow-Garantie',
    hero_escrow_val: '100% Rückerstattung',
    hero_escrow_sub: '1:1 Ersatzgarantie bei Fehlern',

    search_placeholder: 'Spiele, ChatGPT, Netflix, Adobe, Spotify, Steam-Keys suchen...',
    clear_btn: 'LÖSCHEN',
    sort_label: 'Sortieren:',
    sort_savings: 'Höchster Rabatt (%)',
    sort_ending_soon: 'Fast voll',
    sort_price_low: 'Günstigste zuerst',
    sort_price_high: 'Teuerste zuerst',
    sort_popular: 'Beliebt',

    cat_all: 'Alle Produkte',
    cat_topup_games: '⚡ Direktaufladung (121 Spiele)',
    cat_ai_tools: 'KI & ChatGPT Plus',
    cat_gaming: 'Steam & Epic Keys',
    cat_giftup_cards: 'GiftUp Gutscheine',
    cat_streaming: 'Netflix 4K & Streaming',
    cat_software: 'Adobe & Software',
    cat_vpn: 'VPN & Sicherheit',

    prod_pool_status: 'Pool-Fortschritt',
    prod_last_slot: '⚡ Nur noch 1 Platz frei!',
    prod_need: 'Noch',
    prod_slots_left: 'Plätze nötig',
    prod_no_pool: 'Derzeit kein offener Pool',
    prod_retail: 'UVP / Einzelpreis',
    prod_group_price: 'Großhandelspreis',
    prod_join_pool: 'POOL BEITRETEN',
    prod_instant_buy: 'Sofort Kaufen',

    showcase_title: 'AKTIVE SAMMELKAUF-POOLS',
    showcase_items: 'Artikel',
    showcase_escrow_note: 'Lizenzschlüssel und Gutscheine werden automatisch mit 100% Escrow-Schutz bereitgestellt',
    showcase_tab_all: 'Alle Pools',
    showcase_tab_almost_full: 'Fast Voll',
    showcase_tab_ai: 'KI-Tools',
    showcase_tab_gaming: 'Steam Spiele',
    showcase_tab_giftup: 'Geschenkkarten',
    showcase_scroll_mode: 'Karussell',
    showcase_grid_mode: 'Rasteransicht',

    pools_title: 'AKTIVE SAMMELKAUF-POOLS',
    pools_subtitle: 'Gemeinsam mit der Community kaufen und die besten Großhandelspreise sichern',
    pool_slots_left: 'Plätze frei',
    pool_join_btn: 'Beitreten',
    pool_retail_price: 'Regulär',
    pool_save_tag: 'Ersparnis',
    pool_status_filling: 'Füllen',
    pool_status_completed: 'Abgeschlossen',

    modal_title: 'KI-LOKALISIERUNG & MULTI-WÄHRUNGS-HUB',
    modal_subtitle: 'Kontextuelle KI-Übersetzung kombiniert mit Echtzeit-Wechselkursumrechnung',
    tab_language: 'KI-Sprache',
    tab_currency: 'Währungen & Kurse',
    tab_oracle: 'Stündlicher Cron & Orakel',
    tab_presets: 'Schnellwahl',
    ai_status_badge: '⚡ Neuronale KI-Übersetzung Aktiv',
    ai_auto_pair_label: 'Währung bei Sprachwechsel automatisch anpassen',
    select_language_title: 'Benutzeroberflächensprache Wählen',
    select_currency_title: 'Anzeigewährung Wählen',
    exchange_calc_title: 'Live-Währungsrechner',
    live_rates_title: 'CyberPool Offizielle Wechselkurstabelle',
    apply_btn: 'ANWENDEN',
    reset_btn: 'Standard',
    ai_translated_live: 'Alle Preise und Wallet-Guthaben passen sich sofort an.',

    oracle_cron_status: 'Stündlicher Cron-Status',
    oracle_cron_active: '⚡ STÜNDLICHER CRON AKTIV (0 * * * *)',
    oracle_next_sync: 'Nächste Cron-Ausführung in',
    oracle_manual_sync: 'Kurse jetzt synchronisieren',
    oracle_slippage_protection: 'Null-Slippage-Garantie (0% Slippage)',
    oracle_slippage_desc: '60 Minuten Kursfixierung beim Pool-Beitritt zum Schutz vor Währungsschwankungen zwischen Käufern und Verkäufern.',
    oracle_sources: 'Orakel-Datenquellen:',
    oracle_history_logs: 'Stündliche Cron-Logs',
    oracle_cron_expression: 'Cron-Ausdruck'
  },

  es: {
    app_brand_sub: 'Bolsa de compra grupal de licencias digitales y recarga de juegos',
    nav_folder_btn: 'Utilidades',
    nav_create_pool: 'Crear Pool',
    nav_key_vault: 'Bóveda de Claves',
    nav_deposit: '+ Depositar',
    nav_deposit_short: '+ Recargar',
    nav_language_currency: 'Idioma y Moneda',
    nav_wallet_manage: 'Mi Billetera',
    nav_available: 'Disponible',
    nav_escrow: 'En Fideicomiso',
    nav_role_admin: 'ADMIN',
    nav_role_vip: 'VIP MAYORISTA',

    hero_badge: 'COMPRA GRUPAL SIN CAPITAL RETENIDO & LICENCIAS GARANTIZADAS',
    hero_title_1: 'COMPRA GRUPAL DE SOFTWARE Y CLAVES',
    hero_title_save: 'AHORRA HASTA UN 80%',
    hero_desc: 'Precios mayoristas directos para ChatGPT Plus, Netflix 4K, juegos de Steam y 121 títulos móviles. Entrega automática e instantánea con garantía Escrow del 100%.',
    hero_speed_label: 'Velocidad de Entrega',
    hero_speed_val: '3 a 30 Segundos',
    hero_speed_sub: 'Despacho automatizado 24/7',
    hero_escrow_label: 'Garantía Escrow',
    hero_escrow_val: '100% Reembolsable',
    hero_escrow_sub: 'Garantía de reposición 1:1',

    search_placeholder: 'Buscar juegos, ChatGPT, Netflix, Adobe, Spotify, Clave Steam...',
    clear_btn: 'LIMPIAR',
    sort_label: 'Ordenar por:',
    sort_savings: 'Mayor descuento (%)',
    sort_ending_soon: 'Casi lleno',
    sort_price_low: 'Precio más bajo',
    sort_price_high: 'Precio más alto',
    sort_popular: 'Más popular',

    cat_all: 'Todos los Productos',
    cat_topup_games: '⚡ Recarga Directa (121 Juegos)',
    cat_ai_tools: 'IA & ChatGPT Plus',
    cat_gaming: 'Claves Steam y Epic',
    cat_giftup_cards: 'Tarjetas GiftUp',
    cat_streaming: 'Netflix 4K y Series',
    cat_software: 'Adobe y Software Pro',
    cat_vpn: 'VPN y Seguridad',

    prod_pool_status: 'Progreso del Pool',
    prod_last_slot: '⚡ ¡Solo queda 1 cupo!',
    prod_need: 'Faltan',
    prod_slots_left: 'cupos',
    prod_no_pool: 'No hay grupo abierto actualmente',
    prod_retail: 'Precio Normal',
    prod_group_price: 'Precio Mayorista',
    prod_join_pool: 'UNIRSE AL POOL',
    prod_instant_buy: 'Comprar Directo',

    showcase_title: 'POOLS DE COMPRA GRUPAL ACTIVOS',
    showcase_items: 'artículos',
    showcase_escrow_note: 'Claves y tarjetas digitales emitidas automáticamente con garantía de protección 100% Escrow',
    showcase_tab_all: 'Todos los Pools',
    showcase_tab_almost_full: 'Casi Llenos',
    showcase_tab_ai: 'Herramientas IA',
    showcase_tab_gaming: 'Juegos Steam',
    showcase_tab_giftup: 'Tarjetas de Regalo',
    showcase_scroll_mode: 'Carrusel',
    showcase_grid_mode: 'Vista Cuadrícula',

    pools_title: 'POOLS DE COMPRA GRUPAL ACTIVOS',
    pools_subtitle: 'Compra en comunidad y obtén los mejores precios mayoristas del mercado',
    pool_slots_left: 'cupos restantes',
    pool_join_btn: 'Unirse',
    pool_retail_price: 'Minorista',
    pool_save_tag: 'Ahorro',
    pool_status_filling: 'Llenando',
    pool_status_completed: 'Completado',

    modal_title: 'CENTRO DE LOCALIZACIÓN IA Y MULTIMONEDA',
    modal_subtitle: 'Traducción neuronal inteligente combinada con conversor de divisas en tiempo real',
    tab_language: 'Idioma IA',
    tab_currency: 'Monedas y Tipos',
    tab_oracle: 'Cron Horario & Oráculo',
    tab_presets: 'Preajustes',
    ai_status_badge: '⚡ Motor de Traducción Neuronal Activo',
    ai_auto_pair_label: 'Sincronizar moneda regional automáticamente al cambiar idioma',
    select_language_title: 'Seleccionar Idioma de la Interfaz',
    select_currency_title: 'Seleccionar Moneda de Visualización',
    exchange_calc_title: 'Conversor de Moneda en Vivo',
    live_rates_title: 'Tabla de Tipos de Cambio Oficiales de CyberPool',
    apply_btn: 'APLICAR CAMBIOS',
    reset_btn: 'Restablecer',
    ai_translated_live: 'Todos los precios y el saldo se adaptan al instante a su configuración regional.',

    oracle_cron_status: 'Estado del Cron Horario',
    oracle_cron_active: '⚡ CRON HORARIO ACTIVO (0 * * * *)',
    oracle_next_sync: 'Próxima ejecución de Cron en',
    oracle_manual_sync: 'Sincronizar tasas ahora',
    oracle_slippage_protection: 'Garantía Cero Deslizamiento (0% Slippage)',
    oracle_slippage_desc: 'Bloqueo del tipo de cambio por 60 min al unirse a pools para evitar discrepancias de precios entre compradores y vendedores.',
    oracle_sources: 'Fuentes del Oráculo:',
    oracle_history_logs: 'Historial de Cron Horario',
    oracle_cron_expression: 'Expresión Cron'
  }
};

import { translate, LOCALE_DICTIONARIES } from '../i18n';

export function getTranslation(key: string, lang: LanguageCode | string = 'vi'): string {
  const code = (lang || 'vi') as LanguageCode;
  
  // 1. Check in modern namespaced dictionary first
  const modernVal = translate(key, code as any);
  if (modernVal && modernVal !== key) {
    return modernVal;
  }

  // 2. Check in legacy flat dictionary
  const dict = TRANSLATIONS[code] || TRANSLATIONS.vi;
  if (dict && dict[key]) {
    return dict[key];
  }
  if (TRANSLATIONS.vi && TRANSLATIONS.vi[key]) {
    return TRANSLATIONS.vi[key];
  }

  return key;
}

