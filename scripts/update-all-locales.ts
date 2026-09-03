import fs from 'fs';
import path from 'path';

// Load existing files or definitions
import { vi } from '../src/i18n/locales/vi';
import { en } from '../src/i18n/locales/en';
import { zh } from '../src/i18n/locales/zh';
import { ja } from '../src/i18n/locales/ja';
import { ko } from '../src/i18n/locales/ko';
import { ru } from '../src/i18n/locales/ru';
import { fr } from '../src/i18n/locales/fr';
import { de } from '../src/i18n/locales/de';
import { es } from '../src/i18n/locales/es';

const additions: Record<string, Record<string, any>> = {
  vi: {
    modal_title: 'Cài Đặt Ngôn Ngữ & Tiền Tệ',
    modal_subtitle: 'Tùy chỉnh giao diện CyberPool theo quốc gia & tỷ giá tiền tệ mong muốn',
    tab_presets: 'Gói Cài Đặt Nhanh',
    tab_language: 'Chọn Ngôn Ngữ',
    tab_currency: 'Chọn Tiền Tệ',
    tab_oracle: 'Tỷ Giá & Oracle',
    select_language_title: 'Chọn Ngôn Ngữ Hiển Thị',
    ai_auto_pair_label: 'Tự động đồng bộ tiền tệ đề xuất',
    currency_title: 'Tiền tệ mặc định',
    ai_status_badge: 'AI Tự Động',
    select_currency_title: 'Chọn Đơn Vị Tiền Tệ Thanh Toán',
    oracle_cron_status: 'Trạng Thái Oracle Tự Động',
    oracle_next_sync: 'Lần đồng bộ tiếp theo',
    oracle_manual_sync: 'Đồng Bộ Thủ Công',
    oracle_slippage_protection: 'Bảo Vệ Trượt Giá (Slippage)',
    oracle_slippage_desc: 'Cố định tỷ giá quy đổi trong suốt phiên giao dịch của bạn',
    oracle_history_logs: 'Nhật Ký Biến Động Tỷ Giá',
    exchange_calc_title: 'Máy Tính Quy Đổi Nhanh',
    ai_translated_live: 'Dịch thuật trực tiếp bởi Hệ Thống CyberPool AI',
    reset_btn: 'Đặt Lại Mặc Định',
    apply_btn: 'Áp Dụng & Lưu Thay Đổi',
    app_brand_sub: 'Sàn Gom Đơn Mua Chung & Cổng Nạp Game Tự Động',

    common: {
      free: 'Miễn Phí',
      security: 'Bảo Mật & Ký Quỹ Escrow',
      amount: 'Số Tiền',
      balance: 'Số Dư Khả Dụng',
      scroll: 'Cuộn xem thêm',
      from: 'Từ',
      prev: 'Trước',
      next: 'Tiếp'
    },

    modal: {
      close: 'Đóng',
      cancel: 'Hủy Bỏ',
      confirm: 'Xác Nhận'
    },

    nav: {
      account_profile: 'Hồ Sơ Tài Khoản',
      admin_panel: 'Bảng Quản Trị Admin',
      affiliate: 'Đại Lý CTV (-10%)',
      banking_topup: 'Nạp Tiền VietQR/Ngân Hàng',
      categories: 'Danh Mục Sản Phẩm',
      escrow_pools: 'Gom Đơn Mua Chung',
      flash_sales: 'Flash Sale Giảm Sốc',
      game_topup: 'Cổng Nạp Game Tự Động',
      orders: 'Đơn Hàng Của Tôi',
      products: 'Sản Phẩm & Bản Quyền',
      reseller_api: 'API Tích Hợp Đại Lý',
      support_hub: 'Trung Tâm Khiếu Nại',
      topup: 'Nạp Tiền Nhanh',
      vault: 'Kho Key & License',
      wallet: 'Ví Điện Tử'
    },

    hero: {
      title: 'SÀN GOM ĐƠN MUA CHUNG & DIGITAL ASSETS SỐ 1'
    },

    announcement: {
      title: 'Thông Báo Hệ Thống CyberPool',
      welcome_desc: 'Chào mừng bạn đến với sàn thương mại điện tử gom đơn mua chung tài khoản số & digital keys lớn nhất!'
    },

    flash_sale: {
      title: 'FLASH SALE SIÊU TỐC',
      deals_count: '{{count}} Deal Hấp Dẫn',
      limited_time_slots: 'Số lượng suất có hạn',
      ends_in: 'Kết Thúc Sau',
      grid_view: 'Xem Lưới 4 Ô',
      carousel_view: 'Xem Cuộn Ngang',
      claimed_progress: 'Đã gom {{percent}}%',
      few_left: 'Chỉ còn {{left}} suất!',
      hunt_btn: 'Săn Ngay',
      badge: 'GIẢM ĐẾN -{{discount}}%',
      scroll_hint: 'Cuộn ngang để khám phá thêm nhiều deal sốc'
    },

    showcase: {
      title: 'SẢN PHẨM NỔI BẬT & GOM ĐƠN HOT',
      items_count: '{{count}} sản phẩm',
      grid_mode: 'Chế Độ Lưới',
      scroll_mode: 'Chế Độ Cuộn',
      scroll_hint: 'Kéo sang phải để xem tiếp',
      escrow_note: '100% Giao dịch bảo đảm an toàn qua Smart Escrow'
    },

    create_pool: {
      title: 'Mở Gom Đơn Mua Chung Mới',
      subtitle: 'Tạo nhóm gom đơn nhận giá sỉ cực rẻ, hệ thống tự động hoàn tiền nếu không đủ người',
      select_product: 'Chọn Sản Phẩm Cần Gom Đơn',
      target_slots: 'Số Suất Cần Gom (Người tham gia)',
      pool_title: 'Tiêu Đề Nhóm Gom Đơn',
      duration: 'Thời Gian Gom (Giờ)',
      submit_btn: 'Tạo & Mở Ký Quỹ Gom Đơn'
    },

    escrow: {
      auto_refund: 'Tự Động Hoàn Tiền 100%',
      auto_refund_desc: 'Nếu nhóm gom không đủ số lượng thành viên khi hết giờ, 100% số tiền cọc sẽ được hoàn lại ngay vào ví',
      instant_delivery: 'Phát Key / Tài Khoản Tự Động 24/7',
      instant_delivery_desc: 'Ngay khi nhóm đủ người, hệ thống tự động cấp phát tài khoản/key vào Kho Key của bạn trong 3 giây',
      step1_title: '1. Tham Gia Hoặc Mở Gom Đơn',
      step1_desc: 'Chọn sản phẩm mong muốn, vào nhóm có sẵn hoặc tự tạo nhóm gom với giá sỉ cực tốt',
      step2_title: '2. Ký Quỹ Escrow An Toàn',
      step2_desc: 'Số tiền của bạn được giữ an toàn tại Quỹ Escrow thông minh của hệ thống, không chuyển cho người bán trước',
      step3_title: '3. Nhận Hàng Hoặc Hoàn Tiền Tức Thì',
      step3_desc: 'Khi nhóm đủ người nhận tài khoản tự động trong 3s; nếu không đủ người được hoàn tiền 100% lập tức',
      guarantee_title: 'Cam Kết Bảo Vệ Quyền Lợi Người Mua CyberPool',
      warranty: 'Bảo Hành 1 Đổi 1 Suốt Thời Gian Dùng',
      warranty_desc: 'Hỗ trợ đổi mới hoặc hoàn tiền ngay lập tức nếu phát sinh lỗi trong quá trình sử dụng'
    },

    product: {
      retail_price: 'Giá Mua Lẻ',
      group_price: 'Giá Gom Mua Chung',
      reviews_count: '{{count}} Đánh Giá',
      reviews_tab: 'Đánh Giá & Nhận Xét',
      delivery: 'Giao Hàng Tự Động 24/7',
      features: 'Tính Năng Nổi Bật',
      instant_buy: 'Mua Ngay (Không Cần Gom)'
    },

    pools: {
      expires_in: 'Hết hạn sau',
      slots: 'Suất',
      pool_price: 'Giá Gom Mua Chung',
      save_percent: 'Tiết kiệm {{percent}}%',
      need_more: 'Còn thiếu {{count}} người',
      full: 'Đã đủ thành viên',
      join_btn: 'Góp Quỹ Tham Gia Ngay'
    },

    cart: {
      total_label: 'Tổng Tiền Thanh Toán',
      voucher_discount: 'Mã Giảm Giá Voucher',
      enter_voucher: 'Nhập mã voucher (nếu có)...',
      apply_btn: 'Áp Dụng'
    },

    deposit: {
      title: 'Nạp Tiền Vào Ví CyberPool',
      subtitle: 'Hỗ trợ VietQR quét mã tự động cộng tiền sau 3 giây, USDT Crypto và Thẻ Cào'
    },

    wallet: {
      deposit_modal_title: 'Cổng Nạp Tiền Tự Động',
      bank_transfer: 'VietQR / Chuyển Khoản Ngân Hàng',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: 'Ví Điện Tử MoMo',
      balance: 'Số Dư Ví',
      balance_available: 'Số Dư Khả Dụng',
      topup_btn: 'Nạp Thêm Tiền',
      no_transactions: 'Chưa có lịch sử giao dịch nào'
    },

    topup: {
      amount: 'Mệnh Giá Nạp',
      choose_method: 'Chọn Phương Thức Thanh Toán'
    },

    key_vault: {
      title: 'Kho Key & Tài Khoản Của Bạn',
      subtitle: 'Nơi lưu trữ an toàn các key bản quyền, tài khoản và license đã mua thành công',
      search_placeholder: 'Tìm kiếm key, tên sản phẩm hoặc mã đơn...',
      no_keys: 'Kho Key Đang Trống',
      no_keys_desc: 'Bạn chưa có key hoặc tài khoản nào. Hãy tham gia gom đơn hoặc mua sắm ngay!',
      copy_key: 'Sao Chép Key',
      copy: 'Sao Chép',
      copied: 'Đã Sao Chép!',
      status_fulfilled: 'Đã Cấp Phát',
      status_locked: 'Tạm Khóa'
    },

    key_tools: {
      title: 'Bộ Công Cụ Key & Bản Quyền Số',
      subtitle: 'Kiểm tra key trực tuyến, chia nhỏ danh sách và chuyển đổi định dạng tài khoản'
    },

    lucky_wheel: {
      title: 'Vòng Quay May Mắn May Rủi'
    },

    telco: {
      title: 'Cổng Đổi Thẻ Cào Điện Thoại'
    },

    tickets: {
      center_title: 'Trung Tâm Hỗ Trợ & Khiếu Nại 24/7',
      center_desc: 'Gửi yêu cầu hỗ trợ hoặc báo lỗi bảo hành, đội ngũ CSKH phản hồi trong 5 phút',
      ticket_list: 'Danh Sách Phiếu Hỗ Trợ',
      new_ticket: '+ Tạo Phiếu Yêu Cầu Mới'
    },

    affiliate: {
      current_tier: 'Hạng Đại Lý Hiện Tại',
      commission_available: 'Hoa Hồng Khả Dụng',
      invited_count: 'Số Thành Viên Đã Giới Thiệu',
      referral_code: 'Mã Giới Thiệu Của Bạn',
      referral_link: 'Liên Kết Giới Thiệu',
      description: 'Nhận chiết khấu lên đến 15% trọn đời cho mỗi giao dịch từ người được giới thiệu',
      tab_overview: 'Tổng Quan & Thu Nhập',
      tab_tiers: 'Chính Sách Hạng Cấp',
      tab_history: 'Lịch Sử Nhận Thưởng',
      tab_api: 'Tích Hợp API Đại Lý'
    },

    categories: {
      almost_full: 'Sắp Đủ Người'
    },

    products: {
      no_products_found: 'Không tìm thấy sản phẩm nào phù hợp'
    },

    currency_oracle: {
      currency_title: 'Tỷ Giá Ngoại Tệ & Crypto',
      hourly_cron_active: 'Oracle Tự Động Cập Nhật Mỗi 1 Giờ'
    }
  },

  en: {
    modal_title: 'Language & Currency Settings',
    modal_subtitle: 'Customize CyberPool interface according to your preferred country & currency exchange rate',
    tab_presets: 'Quick Presets',
    tab_language: 'Select Language',
    tab_currency: 'Select Currency',
    tab_oracle: 'Rates & Oracle',
    select_language_title: 'Select Display Language',
    ai_auto_pair_label: 'Auto-sync recommended currency',
    currency_title: 'Default currency',
    ai_status_badge: 'AI Automated',
    select_currency_title: 'Select Payment Currency',
    oracle_cron_status: 'Automated Oracle Status',
    oracle_next_sync: 'Next synchronization in',
    oracle_manual_sync: 'Sync Now',
    oracle_slippage_protection: 'Slippage Protection',
    oracle_slippage_desc: 'Lock conversion rate throughout your active checkout session',
    oracle_history_logs: 'Rate Fluctuation Logs',
    exchange_calc_title: 'Quick Converter Calculator',
    ai_translated_live: 'Live translated by CyberPool AI Engine',
    reset_btn: 'Reset to Default',
    apply_btn: 'Apply & Save Settings',
    app_brand_sub: 'Group-Buy Pool & Automated Game Top-up Platform',

    common: {
      free: 'Free',
      security: 'Security & Escrow Vault',
      amount: 'Amount',
      balance: 'Available Balance',
      scroll: 'Scroll for more',
      from: 'From',
      prev: 'Previous',
      next: 'Next'
    },

    modal: {
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm'
    },

    nav: {
      account_profile: 'Account Profile',
      admin_panel: 'Admin Dashboard',
      affiliate: 'Affiliate & Reseller (-10%)',
      banking_topup: 'VietQR / Bank Deposit',
      categories: 'Product Categories',
      escrow_pools: 'Group-Buy Pools',
      flash_sales: 'Flash Sales Deals',
      game_topup: 'Auto Game Top-up',
      orders: 'My Orders',
      products: 'Digital Products & Keys',
      reseller_api: 'Reseller API Integration',
      support_hub: 'Support & Tickets',
      topup: 'Quick Deposit',
      vault: 'Key Vault & Licenses',
      wallet: 'Digital Wallet'
    },

    hero: {
      title: 'THE #1 GROUP-BUY ESCROW & DIGITAL ASSET PLATFORM'
    },

    announcement: {
      title: 'CyberPool System Announcement',
      welcome_desc: 'Welcome to the largest group-buying digital license & gaming assets marketplace!'
    },

    flash_sale: {
      title: 'LIGHTNING FLASH SALES',
      deals_count: '{{count}} Hot Deals',
      limited_time_slots: 'Limited slots available',
      ends_in: 'Ends In',
      grid_view: '4-Grid View',
      carousel_view: 'Horizontal Carousel',
      claimed_progress: '{{percent}}% Claimed',
      few_left: 'Only {{left}} slots left!',
      hunt_btn: 'Claim Now',
      badge: 'UP TO -{{discount}}%',
      scroll_hint: 'Scroll horizontally to discover more exclusive flash deals'
    },

    showcase: {
      title: 'FEATURED PRODUCTS & HOT GROUP POOLS',
      items_count: '{{count}} products',
      grid_mode: 'Grid Mode',
      scroll_mode: 'Scroll Mode',
      scroll_hint: 'Scroll right to view more',
      escrow_note: '100% Transactions secured by Smart Escrow'
    },

    create_pool: {
      title: 'Start a New Group-Buy Pool',
      subtitle: 'Create a group pool to unlock wholesale discounts, auto-refunded if quorum is not reached',
      select_product: 'Select Product for Pool',
      target_slots: 'Required Participants (Slots)',
      pool_title: 'Group Pool Title',
      duration: 'Pool Duration (Hours)',
      submit_btn: 'Create & Escrow Pool'
    },

    escrow: {
      auto_refund: '100% Automatic Refund',
      auto_refund_desc: 'If the pool does not reach full capacity before the timer expires, 100% of your deposit is instantly refunded to your wallet',
      instant_delivery: '24/7 Instant Auto-Dispatch',
      instant_delivery_desc: 'As soon as the pool fills up, the system automatically delivers your license key/account into your Vault in 3 seconds',
      step1_title: '1. Join or Create a Pool',
      step1_desc: 'Pick your desired digital item, enter an existing group pool or launch your own to secure wholesale rates',
      step2_title: '2. Secured in Smart Escrow',
      step2_desc: 'Your funds remain protected in our smart escrow vault and are never transferred to the seller until fulfillment',
      step3_title: '3. Instant Dispatch or Full Refund',
      step3_desc: 'Receive your verified credentials in 3 seconds upon completion, or get 100% refunded if quorum fails',
      guarantee_title: 'CyberPool Buyer Protection Guarantee',
      warranty: '100% 1-to-1 Replacement Guarantee',
      warranty_desc: 'Instant replacement or full refund if any credentials fail during the active warranty period'
    },

    product: {
      retail_price: 'Retail Price',
      group_price: 'Group-Buy Price',
      reviews_count: '{{count}} Reviews',
      reviews_tab: 'Reviews & Feedback',
      delivery: 'Instant 24/7 Delivery',
      features: 'Key Features',
      instant_buy: 'Buy Single (Instant)'
    },

    pools: {
      expires_in: 'Expires in',
      slots: 'Slots',
      pool_price: 'Group Price',
      save_percent: 'Save {{percent}}%',
      need_more: 'Need {{count}} more',
      full: 'Quorum Reached',
      join_btn: 'Join & Escrow Deposit'
    },

    cart: {
      total_label: 'Total Payment',
      voucher_discount: 'Voucher Discount',
      enter_voucher: 'Enter coupon code (if any)...',
      apply_btn: 'Apply'
    },

    deposit: {
      title: 'Deposit Funds to CyberPool Wallet',
      subtitle: 'Supports VietQR 3-second auto-credit, USDT Crypto and Telco Scratch Cards'
    },

    wallet: {
      deposit_modal_title: 'Automated Deposit Gateway',
      bank_transfer: 'VietQR / Bank Wire Transfer',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: 'MoMo E-Wallet',
      balance: 'Wallet Balance',
      balance_available: 'Available Balance',
      topup_btn: 'Deposit Funds',
      no_transactions: 'No transactions found'
    },

    topup: {
      amount: 'Top-up Denomination',
      choose_method: 'Choose Payment Method'
    },

    key_vault: {
      title: 'Your Key Vault & Digital Assets',
      subtitle: 'Securely stored license keys, credentials, and digital assets purchased on CyberPool',
      search_placeholder: 'Search keys, product title or order ID...',
      no_keys: 'Your Key Vault is Empty',
      no_keys_desc: 'You have not purchased any keys yet. Join a group pool or buy now to populate your vault!',
      copy_key: 'Copy Key',
      copy: 'Copy',
      copied: 'Copied!',
      status_fulfilled: 'Delivered',
      status_locked: 'Locked'
    },

    key_tools: {
      title: 'Digital Key & License Tools',
      subtitle: 'Validate keys online, split batch credentials and convert account formats'
    },

    lucky_wheel: {
      title: 'Lucky Cyber Wheel'
    },

    telco: {
      title: 'Telco Scratch Card Gateway'
    },

    tickets: {
      center_title: '24/7 Support & Dispute Center',
      center_desc: 'Submit support requests or warranty claims, our support agents respond within 5 minutes',
      ticket_list: 'Support Tickets List',
      new_ticket: '+ Open New Ticket'
    },

    affiliate: {
      current_tier: 'Current Affiliate Tier',
      commission_available: 'Available Commission',
      invited_count: 'Referred Members',
      referral_code: 'Your Referral Code',
      referral_link: 'Your Referral Link',
      description: 'Earn up to 15% lifetime recurring commission on all transactions from your invited users',
      tab_overview: 'Overview & Earnings',
      tab_tiers: 'Tier Benefits',
      tab_history: 'Payout History',
      tab_api: 'Developer API'
    },

    categories: {
      almost_full: 'Almost Full'
    },

    products: {
      no_products_found: 'No matching products found'
    },

    currency_oracle: {
      currency_title: 'Fiat & Crypto Exchange Oracle',
      hourly_cron_active: 'Automated Rate Synchronization Active (Hourly)'
    }
  },

  zh: {
    modal_title: '语言与货币设置',
    modal_subtitle: '根据您偏好的国家与汇率自定义 CyberPool 界面',
    tab_presets: '快捷预设',
    tab_language: '选择语言',
    tab_currency: '选择货币',
    tab_oracle: '汇率与预言机',
    select_language_title: '选择显示语言',
    ai_auto_pair_label: '自动同步推荐货币',
    currency_title: '默认货币',
    ai_status_badge: 'AI 自动适配',
    select_currency_title: '选择支付结算货币',
    oracle_cron_status: '自动预言机状态',
    oracle_next_sync: '下次同步时间',
    oracle_manual_sync: '立即同步',
    oracle_slippage_protection: '滑点保护',
    oracle_slippage_desc: '在您的结账会话期间锁定汇率',
    oracle_history_logs: '汇率波动日志',
    exchange_calc_title: '快速汇率计算器',
    ai_translated_live: '由 CyberPool AI 引擎实时翻译',
    reset_btn: '恢复默认设置',
    apply_btn: '应用并保存设置',
    app_brand_sub: '拼团拼单平台与游戏自动充值门户',

    common: {
      free: '免费',
      security: '安全与智能托管保障',
      amount: '金额',
      balance: '可用余额',
      scroll: '滑动查看更多',
      from: '起',
      prev: '上一页',
      next: '下一页'
    },

    modal: {
      close: '关闭',
      cancel: '取消',
      confirm: '确认'
    },

    nav: {
      account_profile: '账户资料',
      admin_panel: '管理控制台',
      affiliate: '分销代理 (-10%)',
      banking_topup: '银行 / 扫码充值',
      categories: '商品分类',
      escrow_pools: '拼团拼单',
      flash_sales: '限时秒杀',
      game_topup: '游戏自动充值',
      orders: '我的订单',
      products: '数字产品与密钥',
      reseller_api: '代理 API 接口',
      support_hub: '客服工单中心',
      topup: '快捷充值',
      vault: '卡密库与授权',
      wallet: '电子钱包'
    },

    hero: {
      title: '顶级数字产品拼团拼单与安全托管交易平台'
    },

    announcement: {
      title: 'CyberPool 系统公告',
      welcome_desc: '欢迎来到最大的数字账号与卡密拼团交易市场！'
    },

    flash_sale: {
      title: '限时极速秒杀',
      deals_count: '{{count}} 款热卖特惠',
      limited_time_slots: '名额有限',
      ends_in: '距结束仅剩',
      grid_view: '四宫格视图',
      carousel_view: '横向滚动视图',
      claimed_progress: '已拼 {{percent}}%',
      few_left: '仅剩 {{left}} 个名额！',
      hunt_btn: '立即抢购',
      badge: '低至 -{{discount}}%',
      scroll_hint: '向右滑动发现更多超值限时秒杀'
    },

    showcase: {
      title: '热门推荐与热门拼团',
      items_count: '{{count}} 件商品',
      grid_mode: '网格模式',
      scroll_mode: '滚动模式',
      scroll_hint: '向右滑动查看更多',
      escrow_note: '100% 智能托管保障交易安全'
    },

    create_pool: {
      title: '发起新拼团',
      subtitle: '发起拼团享受超低批发价，未成团系统自动全额退款',
      select_product: '选择拼团商品',
      target_slots: '成团人数（名额）',
      pool_title: '拼团标题',
      duration: '拼团时长（小时）',
      submit_btn: '创建并托管拼团'
    },

    escrow: {
      auto_refund: '100% 自动全额退款',
      auto_refund_desc: '若倒计时结束未达拼团人数，已支付款项将立即全额原路退回您的钱包',
      instant_delivery: '24/7 全天候秒级自动发货',
      instant_delivery_desc: '拼团成功后，系统将在3秒内自动将账号/卡密分发至您的卡密库',
      step1_title: '1. 加入或发起拼团',
      step1_desc: '挑选心仪的数字商品，加入现有拼团或自发开团享批发低价',
      step2_title: '2. 智能托管资金保障',
      step2_desc: '资金安全锁定在平台智能托管中心，发货前绝不结算给卖家',
      step3_title: '3. 秒级发货或全额退款',
      step3_desc: '满员3秒自动交付卡密，若拼团失败立即100%全额退款',
      guarantee_title: 'CyberPool 买家安全权益保障承诺',
      warranty: '质保期内 100% 换新质保',
      warranty_desc: '使用期间如遇异常问题，支持立即更换或退款'
    },

    product: {
      retail_price: '单独零售价',
      group_price: '拼团批发价',
      reviews_count: '{{count}} 条评价',
      reviews_tab: '用户评价',
      delivery: '24/7 自动秒发',
      features: '产品特色',
      instant_buy: '直接单买（无需拼团）'
    },

    pools: {
      expires_in: '剩余时间',
      slots: '名额',
      pool_price: '拼团价',
      save_percent: '立省 {{percent}}%',
      need_more: '还差 {{count}} 人',
      full: '已成团',
      join_btn: '参与拼团并托管支付'
    },

    cart: {
      total_label: '结算总额',
      voucher_discount: '优惠券折扣',
      enter_voucher: '输入优惠码（如有）...',
      apply_btn: '应用'
    },

    deposit: {
      title: '充值到 CyberPool 钱包',
      subtitle: '支持银行扫码秒到账、USDT 加密货币以及话费卡充值'
    },

    wallet: {
      deposit_modal_title: '自动充值通道',
      bank_transfer: '银行扫码 / 转账',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: '电子钱包',
      balance: '钱包余额',
      balance_available: '可用余额',
      topup_btn: '立即充值',
      no_transactions: '暂无交易记录'
    },

    topup: {
      amount: '充值面额',
      choose_method: '选择支付方式'
    },

    key_vault: {
      title: '您的卡密库与数字资产',
      subtitle: '安全存储您在 CyberPool 购买的所有正版密钥与账号凭证',
      search_placeholder: '搜索密钥、产品名称或订单号...',
      no_keys: '卡密库暂无内容',
      no_keys_desc: '您尚未购买任何卡密。立即参与拼团或选购商品吧！',
      copy_key: '复制密钥',
      copy: '复制',
      copied: '已复制！',
      status_fulfilled: '已发货',
      status_locked: '已锁定'
    },

    key_tools: {
      title: '卡密与授权工具箱',
      subtitle: '在线检测密钥有效性、批量分割文本与格式转换'
    },

    lucky_wheel: {
      title: '幸运大转盘'
    },

    telco: {
      title: '点卡与电话卡兑换'
    },

    tickets: {
      center_title: '24/7 客户支持与售后中心',
      center_desc: '提交咨询或售后工单，专属客服将在5分钟内响应',
      ticket_list: '工单列表',
      new_ticket: '+ 创建新工单'
    },

    affiliate: {
      current_tier: '当前分销等级',
      commission_available: '可提现佣金',
      invited_count: '已邀请会员数',
      referral_code: '您的专属邀请码',
      referral_link: '您的专属推广链接',
      description: '享受受邀用户每笔消费高达 15% 的终身永久返佣',
      tab_overview: '概览与收益',
      tab_tiers: '等级权益',
      tab_history: '奖励明细',
      tab_api: '开发者 API'
    },

    categories: {
      almost_full: '即将成团'
    },

    products: {
      no_products_found: '未找到相关商品'
    },

    currency_oracle: {
      currency_title: '法币与加密货币预言机',
      hourly_cron_active: '全自动每小时汇率同步已激活'
    }
  },

  ja: {
    modal_title: '言語と通貨の設定',
    modal_subtitle: '国や通貨レートに合わせて CyberPool インターフェースをカスタマイズ',
    tab_presets: 'クイックプリセット',
    tab_language: '言語の選択',
    tab_currency: '通貨の選択',
    tab_oracle: '為替レートとオラクル',
    select_language_title: '表示言語の選択',
    ai_auto_pair_label: '推奨通貨を自動同期',
    currency_title: 'デフォルト通貨',
    ai_status_badge: 'AI 自動適応',
    select_currency_title: '決済通貨の選択',
    oracle_cron_status: '自動オラクル稼働状況',
    oracle_next_sync: '次回同期まで',
    oracle_manual_sync: '今すぐ同期',
    oracle_slippage_protection: 'スリッページ保護',
    oracle_slippage_desc: 'チェックアウト中の為替レート変動を固定保護',
    oracle_history_logs: '為替変動ログ',
    exchange_calc_title: 'クイック為替計算機',
    ai_translated_live: 'CyberPool AI エンジンによるリアルタイム翻訳',
    reset_btn: 'デフォルトに戻す',
    apply_btn: '設定を適用して保存',
    app_brand_sub: '共同購入グループバイ＆ゲーム自動チャージポータル',

    common: {
      free: '無料',
      security: 'セキュリティとエスクロー保証',
      amount: '金額',
      balance: '利用可能残高',
      scroll: 'スクロールして表示',
      from: '〜',
      prev: '前へ',
      next: '次へ'
    },

    modal: {
      close: '閉じる',
      cancel: 'キャンセル',
      confirm: '確認'
    },

    nav: {
      account_profile: 'アカウント設定',
      admin_panel: '管理者ダッシュボード',
      affiliate: 'アフィリエイト・代理店 (-10%)',
      banking_topup: '銀行・QR入金',
      categories: '商品カテゴリー',
      escrow_pools: '共同購入プール',
      flash_sales: 'タイムセール',
      game_topup: 'ゲーム自動チャージ',
      orders: '注文履歴',
      products: 'デジタル製品＆キー',
      reseller_api: 'API連携',
      support_hub: 'サポートセンター',
      topup: 'クイック入金',
      vault: 'キー保管庫',
      wallet: 'ウォレット'
    },

    hero: {
      title: '国内最高峰のデジタル資産共同購入＆安全エスクロー市場'
    },

    announcement: {
      title: 'CyberPool システムお知らせ',
      welcome_desc: '最大規模のデジタルキー＆アカウント共同購入マーケットへようこそ！'
    },

    flash_sale: {
      title: '超速フラッシュセール',
      deals_count: '{{count}} 件の注目セール',
      limited_time_slots: '数量限定',
      ends_in: '終了まで',
      grid_view: '4グリッド表示',
      carousel_view: '横スクロール表示',
      claimed_progress: '{{percent}}% 達成',
      few_left: '残りわずか {{left}} 枠！',
      hunt_btn: '今すぐ獲得',
      badge: '最大 -{{discount}}%',
      scroll_hint: '右へスクロールして限定セールをチェック'
    },

    showcase: {
      title: '注目の製品と人気グループプール',
      items_count: '{{count}} 件のアイテム',
      grid_mode: 'グリッド表示',
      scroll_mode: 'スクロール表示',
      scroll_hint: '右にスクロールしてさらに表示',
      escrow_note: 'スマートエスクローにより100%安全取引保証'
    },

    create_pool: {
      title: '新規共同購入グループを開設',
      subtitle: '共同購入で卸売価格を適用。人数未達の場合は全額自動返金されます',
      select_product: '共同購入する製品を選択',
      target_slots: '目標参加人数（枠数）',
      pool_title: 'グループ名',
      duration: '募集期間（時間）',
      submit_btn: '開設してエスクロー預託'
    },

    escrow: {
      auto_refund: '100% 自動全額返金',
      auto_refund_desc: '制限時間内に目標人数に達しなかった場合、お支払い金額は即時にウォレットへ全額返金されます',
      instant_delivery: '24時間365日 自動即時配信',
      instant_delivery_desc: '達成と同時に、システムが3秒以内にアカウントやキーを保管庫へ自動配信します',
      step1_title: '1. グループに参加または開設',
      step1_desc: '欲しいデジタル商品を選び、既存の共同購入に参加するか新規開設して卸売価格を獲得',
      step2_title: '2. 安全なスマートエスクロー保管',
      step2_desc: '納品完了まで資金はプラットフォームのエスクローで保護され、出品者へ直接渡りません',
      step3_title: '3. 即時受け取りまたは全額返金',
      step3_desc: '満員成立で3秒納品、不成立時は手数料なしで即座に100%全額返金',
      guarantee_title: 'CyberPool 購入者保護保証プログラム',
      warranty: '期間中 100% 保証・交換対応',
      warranty_desc: '保証期間内の不具合は即時交換または全額返金いたします'
    },

    product: {
      retail_price: '単品通常価格',
      group_price: '共同購入価格',
      reviews_count: '{{count}} 件のレビュー',
      reviews_tab: 'レビュー＆評価',
      delivery: '24時間365日 即時納品',
      features: '主な特長',
      instant_buy: '単品購入（即時）'
    },

    pools: {
      expires_in: '残り時間',
      slots: '枠',
      pool_price: '共同価格',
      save_percent: '{{percent}}% お得',
      need_more: 'あと {{count}} 人',
      full: '満員成立',
      join_btn: '参加してエスクロー預託'
    },

    cart: {
      total_label: 'お支払い合計',
      voucher_discount: 'クーポン割引',
      enter_voucher: 'クーポンコードを入力...',
      apply_btn: '適用'
    },

    deposit: {
      title: 'CyberPool ウォレットへチャージ',
      subtitle: 'QR決済、USDT 暗号資産、ギフトカードチャージに対応'
    },

    wallet: {
      deposit_modal_title: '自動入金ゲートウェイ',
      bank_transfer: '銀行振込 / QR決済',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: '電子マネー',
      balance: 'ウォレット残高',
      balance_available: '利用可能残高',
      topup_btn: 'チャージする',
      no_transactions: '取引履歴はありません'
    },

    topup: {
      amount: 'チャージ金額',
      choose_method: '支払い方法を選択'
    },

    key_vault: {
      title: 'キー保管庫と保有資産',
      subtitle: '購入したすべてのライセンスキーとアカウント情報が安全に保管されます',
      search_placeholder: 'キー、製品名、注文番号で検索...',
      no_keys: 'キー保管庫は空です',
      no_keys_desc: 'まだ購入したキーがありません。共同購入に参加してみましょう！',
      copy_key: 'キーをコピー',
      copy: 'コピー',
      copied: 'コピー完了！',
      status_fulfilled: '配信済み',
      status_locked: 'ロック中'
    },

    key_tools: {
      title: 'デジタルキー・ライセンスツール',
      subtitle: 'キー有効性のオンライン確認、一括分割、フォーマット変換'
    },

    lucky_wheel: {
      title: 'ラッキーサイバーホイール'
    },

    telco: {
      title: 'ギフトカード換金・交換'
    },

    tickets: {
      center_title: '24時間 サポート＆異議申し立てセンター',
      center_desc: 'サポートや保証申請を送信してください。担当者が5分以内に対応します',
      ticket_list: 'チケット一覧',
      new_ticket: '+ 新規チケット作成'
    },

    affiliate: {
      current_tier: '現在のランク',
      commission_available: '受取可能報酬',
      invited_count: '招待人数',
      referral_code: 'あなたの招待コード',
      referral_link: '紹介リンク',
      description: '招待ユーザーの取引ごとに最大15%の生涯永続コミッションを獲得',
      tab_overview: '概要・収益',
      tab_tiers: 'ランク特典',
      tab_history: '付与履歴',
      tab_api: '開発者 API'
    },

    categories: {
      almost_full: 'まもなく満員'
    },

    products: {
      no_products_found: '該当する製品が見つかりません'
    },

    currency_oracle: {
      currency_title: '法定通貨・暗号資産オラクル',
      hourly_cron_active: '1時間ごとの為替自動同期が有効です'
    }
  },

  ko: {
    modal_title: '언어 및 통화 설정',
    modal_subtitle: '선호하는 국가 및 환율에 맞춰 CyberPool 인터페이스를 맞춤 설정하세요',
    tab_presets: '빠른 프리셋',
    tab_language: '언어 선택',
    tab_currency: '통화 선택',
    tab_oracle: '환율 및 오라클',
    select_language_title: '표시 언어 선택',
    ai_auto_pair_label: '추천 통화 자동 동기화',
    currency_title: '기본 통화',
    ai_status_badge: 'AI 자동화',
    select_currency_title: '결제 통화 선택',
    oracle_cron_status: '자동 오라클 상태',
    oracle_next_sync: '다음 동기화까지',
    oracle_manual_sync: '지금 동기화',
    oracle_slippage_protection: '슬리피지 보호',
    oracle_slippage_desc: '결제 세션 동안 환율 변동을 고정 보호합니다',
    oracle_history_logs: '환율 변동 로그',
    exchange_calc_title: '빠른 환율 계산기',
    ai_translated_live: 'CyberPool AI 엔진 실시간 번역',
    reset_btn: '기본값으로 재설정',
    apply_btn: '설정 적용 및 저장',
    app_brand_sub: '디지털 공동구매 & 게임 자동 충전 포털',

    common: {
      free: '무료',
      security: '보안 및 에스크로 보증',
      amount: '금액',
      balance: '사용 가능 잔액',
      scroll: '스크롤하여 더보기',
      from: '~부터',
      prev: '이전',
      next: '다음'
    },

    modal: {
      close: '닫기',
      cancel: '취소',
      confirm: '확인'
    },

    nav: {
      account_profile: '계정 프로필',
      admin_panel: '관리자 대시보드',
      affiliate: '리셀러 및 파트너 (-10%)',
      banking_topup: '계좌이체 / QR 충전',
      categories: '상품 카테고리',
      escrow_pools: '공동구매 풀',
      flash_sales: '타임세일 특가',
      game_topup: '게임 자동 충전',
      orders: '주문 내역',
      products: '디지털 상품 및 키',
      reseller_api: 'API 연동',
      support_hub: '고객지원 센터',
      topup: '빠른 충전',
      vault: '키 보관함',
      wallet: '전자지갑'
    },

    hero: {
      title: '국내 1위 디지털 라이선스 공동구매 & 안전 에스크로 거래소'
    },

    announcement: {
      title: 'CyberPool 시스템 공지사항',
      welcome_desc: '국내 최대 디지털 계정 및 라이선스 공동구매 마켓에 오신 것을 환영합니다!'
    },

    flash_sale: {
      title: '번개 타임세일',
      deals_count: '{{count}}개 특가 상품',
      limited_time_slots: '한정 수량',
      ends_in: '종료까지',
      grid_view: '4분할 그리드 뷰',
      carousel_view: '가로 스크롤 뷰',
      claimed_progress: '{{percent}}% 달성',
      few_left: '단 {{left}}자리 남음!',
      hunt_btn: '지금 구매하기',
      badge: '최대 -{{discount}}%',
      scroll_hint: '오른쪽으로 스크롤하여 더 많은 특가를 확인하세요'
    },

    showcase: {
      title: '추천 상품 및 인기 공동구매 풀',
      items_count: '{{count}}개 상품',
      grid_mode: '그리드 모드',
      scroll_mode: '스크롤 모드',
      scroll_hint: '오른쪽으로 스크롤하여 더보기',
      escrow_note: '스마트 에스크로 100% 안전거래 보장'
    },

    create_pool: {
      title: '새 공동구매 그룹 열기',
      subtitle: '공동구매로 도매가 혜택을 받으세요. 인원 미달 시 전액 자동 환불됩니다',
      select_product: '공동구매 상품 선택',
      target_slots: '모집 인원 (슬롯)',
      pool_title: '그룹 제목',
      duration: '모집 시간 (시간)',
      submit_btn: '그룹 생성 및 에스크로 예치'
    },

    escrow: {
      auto_refund: '100% 자동 전액 환불',
      auto_refund_desc: '제한 시간 내에 목표 인원에 도달하지 못하면 예치금이 지갑으로 즉시 100% 자동 환불됩니다',
      instant_delivery: '24/7 무인 자동 즉시 발송',
      instant_delivery_desc: '성공 즉시 시스템이 3초 내에 계정/키를 보관함으로 자동 전송합니다',
      step1_title: '1. 그룹 참여 또는 개설',
      step1_desc: '원하는 디지털 상품을 선택하고 기존 풀에 참여하거나 새로 개설하여 도매가 적용',
      step2_title: '2. 안전한 스마트 에스크로 예치',
      step2_desc: '상품 수령 전까지 자금은 플랫폼 에스크로에 안전하게 보관되며 판매자에게 전달되지 않습니다',
      step3_title: '3. 3초 즉시 수령 또는 전액 환불',
      step3_desc: '인원 충족 시 3초 만에 발송되며, 미달 시 100% 즉시 전액 환불됩니다',
      guarantee_title: 'CyberPool 구매자 안심 보호 보증',
      warranty: '보증 기간 내 100% 1:1 교환',
      warranty_desc: '사용 중 문제 발생 시 즉시 교환 또는 전액 환불을 보장합니다'
    },

    product: {
      retail_price: '일반 개별가',
      group_price: '공동구매 특가',
      reviews_count: '{{count}}개 리뷰',
      reviews_tab: '구매 후기',
      delivery: '24시간 무인 즉시 발송',
      features: '주요 특징',
      instant_buy: '개별 즉시 구매'
    },

    pools: {
      expires_in: '남은 시간',
      slots: '자리',
      pool_price: '공구가격',
      save_percent: '{{percent}}% 절약',
      need_more: '{{count}}명 남음',
      full: '모집 완료',
      join_btn: '참여 및 예치하기'
    },

    cart: {
      total_label: '최종 결제 금액',
      voucher_discount: '쿠폰 할인',
      enter_voucher: '할인 쿠폰 입력...',
      apply_btn: '적용'
    },

    deposit: {
      title: 'CyberPool 지갑 잔액 충전',
      subtitle: '실시간 계좌이체/QR 3초 자동 충전, USDT 암호화폐 및 상품권 지원'
    },

    wallet: {
      deposit_modal_title: '자동 충전 게이트웨이',
      bank_transfer: '계좌이체 / QR 충전',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: '간편 결제',
      balance: '지갑 잔액',
      balance_available: '사용 가능 잔액',
      topup_btn: '충전하기',
      no_transactions: '거래 내역이 없습니다'
    },

    topup: {
      amount: '충전 금액',
      choose_method: '결제 수단 선택'
    },

    key_vault: {
      title: '나의 키 보관함 및 디지털 자산',
      subtitle: 'CyberPool에서 구매한 모든 정품 라이선스 키와 계정 정보를 안전하게 보관합니다',
      search_placeholder: '키, 제품명 또는 주문번호 검색...',
      no_keys: '보관함이 비어 있습니다',
      no_keys_desc: '아직 구매한 키가 없습니다. 지금 공동구매에 참여해보세요!',
      copy_key: '키 복사',
      copy: '복사',
      copied: '복사 완료!',
      status_fulfilled: '발송 완료',
      status_locked: '잠김'
    },

    key_tools: {
      title: '디지털 키 & 라이선스 도구',
      subtitle: '온라인 키 유효성 검사, 대량 텍스트 분할 및 포맷 변환'
    },

    lucky_wheel: {
      title: '행운의 사이버 룰렛'
    },

    telco: {
      title: '상품권 및 기프티콘 교환'
    },

    tickets: {
      center_title: '24/7 고객센터 및 분쟁 해결',
      center_desc: '문의사항이나 보증 신청을 남겨주시면 상담원이 5분 내에 답변드립니다',
      ticket_list: '문의 내역',
      new_ticket: '+ 새 문의 작성'
    },

    affiliate: {
      current_tier: '현재 파트너 등급',
      commission_available: '출금 가능 커미션',
      invited_count: '추천 가입 회원수',
      referral_code: '나의 추천인 코드',
      referral_link: '추천 링크',
      description: '추천 가입자의 모든 거래에 대해 최대 15% 평생 커미션 지급',
      tab_overview: '개요 및 수익',
      tab_tiers: '등급별 혜택',
      tab_history: '지급 내역',
      tab_api: '개발자 API'
    },

    categories: {
      almost_full: '마감 임박'
    },

    products: {
      no_products_found: '일치하는 상품이 없습니다'
    },

    currency_oracle: {
      currency_title: '법정화폐 및 암호화폐 오라클',
      hourly_cron_active: '1시간 주기 자동 환율 동기화 활성화됨'
    }
  },

  ru: {
    modal_title: 'Настройки языка и валюты',
    modal_subtitle: 'Настройте интерфейс CyberPool под вашу страну и курсы валют',
    tab_presets: 'Быстрые пресеты',
    tab_language: 'Выбор языка',
    tab_currency: 'Выбор валюты',
    tab_oracle: 'Курсы и Оракул',
    select_language_title: 'Выберите язык интерфейса',
    ai_auto_pair_label: 'Автосинхронизация рекомендованной валюты',
    currency_title: 'Валюта по умолчанию',
    ai_status_badge: 'ИИ Автоматизация',
    select_currency_title: 'Выберите валюту оплаты',
    oracle_cron_status: 'Статус авто-оракула',
    oracle_next_sync: 'Следующая синхронизация через',
    oracle_manual_sync: 'Синхронизировать сейчас',
    oracle_slippage_protection: 'Защита от проскальзывания',
    oracle_slippage_desc: 'Фиксация курса конвертации на время оформления заказа',
    oracle_history_logs: 'История изменений курса',
    exchange_calc_title: 'Быстрый калькулятор валют',
    ai_translated_live: 'Мгновенный перевод на базе CyberPool AI',
    reset_btn: 'Сбросить по умолчанию',
    apply_btn: 'Применить и сохранить',
    app_brand_sub: 'Платформа совместных покупок и автопополнения игр',

    common: {
      free: 'Бесплатно',
      security: 'Безопасность и Смарт-Эскроу',
      amount: 'Сумма',
      balance: 'Доступный баланс',
      scroll: 'Прокрутите для просмотра',
      from: 'От',
      prev: 'Назад',
      next: 'Вперед'
    },

    modal: {
      close: 'Закрыть',
      cancel: 'Отмена',
      confirm: 'Подтвердить'
    },

    nav: {
      account_profile: 'Профиль аккаунта',
      admin_panel: 'Панель администратора',
      affiliate: 'Партнерская программа (-10%)',
      banking_topup: 'Банковский перевод / QR',
      categories: 'Категории товаров',
      escrow_pools: 'Совместные пулы',
      flash_sales: 'Flash-распродажи',
      game_topup: 'Автопополнение игр',
      orders: 'Мои заказы',
      products: 'Цифровые товары и ключи',
      reseller_api: 'API для реселлеров',
      support_hub: 'Центр поддержки',
      topup: 'Быстрое пополнение',
      vault: 'Хранилище ключей',
      wallet: 'Кошелек'
    },

    hero: {
      title: 'ПЛАТФОРМА №1 ДЛЯ СОВМЕСТНЫХ ПОКУПОК ЦИФРОВЫХ КЛЮЧЕЙ И ЭСКРОУ'
    },

    announcement: {
      title: 'Системное объявление CyberPool',
      welcome_desc: 'Добро пожаловать на крупнейшую торговую площадку совместных покупок цифровых лицензий!'
    },

    flash_sale: {
      title: 'МОЛНИЕНОСНАЯ FLASH-РАСПРОДАЖА',
      deals_count: '{{count}} горячих предложений',
      limited_time_slots: 'Количество мест ограничено',
      ends_in: 'Заканчивается через',
      grid_view: 'Сетка 4 товара',
      carousel_view: 'Горизонтальная лента',
      claimed_progress: 'Собрано {{percent}}%',
      few_left: 'Осталось всего {{left}} мест!',
      hunt_btn: 'Забрать сейчас',
      badge: 'СКИДКИ ДО -{{discount}}%',
      scroll_hint: 'Листайте вправо, чтобы увидеть все выгодные предложения'
    },

    showcase: {
      title: 'ПОПУЛЯРНЫЕ ТОВАРЫ И ГОРЯЧИЕ ПУЛЫ',
      items_count: '{{count}} товаров',
      grid_mode: 'Режим сетки',
      scroll_mode: 'Режим ленты',
      scroll_hint: 'Листайте вправо для просмотра',
      escrow_note: '100% сделок защищены Смарт-Эскроу'
    },

    create_pool: {
      title: 'Открыть новый пул совместной покупки',
      subtitle: 'Создайте пул для оптовой цены. Если участники не наберутся, средства вернутся на 100%',
      select_product: 'Выберите товар для совместной покупки',
      target_slots: 'Необходимое количество участников',
      pool_title: 'Название группы',
      duration: 'Длительность сбора (часов)',
      submit_btn: 'Создать пул с эскроу-депозитом'
    },

    escrow: {
      auto_refund: '100% Автоматический возврат',
      auto_refund_desc: 'Если группа не наберется до истечения таймера, 100% средств мгновенно возвращаются на ваш баланс',
      instant_delivery: 'Автовыдача ключей 24/7 за 3 секунды',
      instant_delivery_desc: 'Как только пул заполнен, система автоматически доставляет ключ/аккаунт в ваше Хранилище',
      step1_title: '1. Присоединяйтесь или создайте пул',
      step1_desc: 'Выберите нужный цифровой продукт и объединитесь с другими для оптовой цены',
      step2_title: '2. Защита смарт-эскроу',
      step2_desc: 'Ваши средства заморожены на защищенном смарт-счете и не передаются продавцу до выдачи товара',
      step3_title: '3. Мгновенное получение или возврат',
      step3_desc: 'Получите проверенный ключ за 3 секунды или мгновенный 100% возврат средств',
      guarantee_title: 'Гарантия защиты покупателей CyberPool',
      warranty: '100% Гарантия замены 1-в-1',
      warranty_desc: 'Мгновенная замена или возврат в случае неисправности в течение гарантийного срока'
    },

    product: {
      retail_price: 'Розничная цена',
      group_price: 'Оптовая цена в пуле',
      reviews_count: '{{count}} отзывов',
      reviews_tab: 'Отзывы покупателей',
      delivery: 'Автодоставка 24/7',
      features: 'Ключевые преимущества',
      instant_buy: 'Купить сразу (без пула)'
    },

    pools: {
      expires_in: 'Истекает через',
      slots: 'Мест',
      pool_price: 'Цена в пуле',
      save_percent: 'Экономия {{percent}}%',
      need_more: 'Нужно еще {{count}} чел.',
      full: 'Пул укомплектован',
      join_btn: 'Вступить и внести депозит'
    },

    cart: {
      total_label: 'Итого к оплате',
      voucher_discount: 'Скидка по промокоду',
      enter_voucher: 'Введите промокод...',
      apply_btn: 'Применить'
    },

    deposit: {
      title: 'Пополнение баланса CyberPool',
      subtitle: 'Поддержка банковских карт, QR-платежей, USDT Crypto и подарочных карт'
    },

    wallet: {
      deposit_modal_title: 'Автоматический шлюз пополнения',
      bank_transfer: 'Банковский перевод / QR',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: 'Электронный кошелек',
      balance: 'Баланс кошелька',
      balance_available: 'Доступный баланс',
      topup_btn: 'Пополнить баланс',
      no_transactions: 'История транзакций пуста'
    },

    topup: {
      amount: 'Сумма пополнения',
      choose_method: 'Выберите способ оплаты'
    },

    key_vault: {
      title: 'Ваше Хранилище ключей и лицензий',
      subtitle: 'Безопасное хранение всех приобретенных лицензионных ключей и аккаунтов',
      search_placeholder: 'Поиск по ключу, названию или номеру заказа...',
      no_keys: 'Хранилище пусто',
      no_keys_desc: 'У вас пока нет купленных ключей. Примите участие в совместном пуле прямо сейчас!',
      copy_key: 'Копировать ключ',
      copy: 'Копировать',
      copied: 'Скопировано!',
      status_fulfilled: 'Выдан',
      status_locked: 'Заблокирован'
    },

    key_tools: {
      title: 'Инструменты для работы с ключами',
      subtitle: 'Онлайн проверка валидности ключей, пакетное разделение и конвертация'
    },

    lucky_wheel: {
      title: 'Кибер-колесо удачи'
    },

    telco: {
      title: 'Обмен подарочных карт и кодов'
    },

    tickets: {
      center_title: 'Круглосуточный центр поддержки 24/7',
      center_desc: 'Создайте тикет по гарантии или вопросу, операторы отвечают в течение 5 минут',
      ticket_list: 'Список обращений',
      new_ticket: '+ Создать новый тикет'
    },

    affiliate: {
      current_tier: 'Текущий партнерский уровень',
      commission_available: 'Доступно к выводу',
      invited_count: 'Приглашено участников',
      referral_code: 'Ваш реферальный код',
      referral_link: 'Реферальная ссылка',
      description: 'Получайте до 15% пожизненной комиссии со всех покупок приглашенных пользователей',
      tab_overview: 'Обзор и доходы',
      tab_tiers: 'Уровни и привилегии',
      tab_history: 'История выплат',
      tab_api: 'API разработчика'
    },

    categories: {
      almost_full: 'Почти заполнен'
    },

    products: {
      no_products_found: 'Товары не найдены'
    },

    currency_oracle: {
      currency_title: 'Оракул курсов валют и криптовалют',
      hourly_cron_active: 'Автоматическая ежечасная синхронизация курсов активна'
    }
  },

  fr: {
    modal_title: 'Paramètres de langue et devise',
    modal_subtitle: 'Personnalisez l’interface CyberPool selon votre pays et vos taux de change',
    tab_presets: 'Préréglages rapides',
    tab_language: 'Choisir la langue',
    tab_currency: 'Choisir la devise',
    tab_oracle: 'Taux & Oracle',
    select_language_title: 'Sélectionnez la langue d’affichage',
    ai_auto_pair_label: 'Synchroniser la devise recommandée',
    currency_title: 'Devise par défaut',
    ai_status_badge: 'IA Automatique',
    select_currency_title: 'Sélectionnez la devise de paiement',
    oracle_cron_status: 'État de l’Oracle Automatisé',
    oracle_next_sync: 'Prochaine synchronisation dans',
    oracle_manual_sync: 'Synchroniser maintenant',
    oracle_slippage_protection: 'Protection contre le glissement',
    oracle_slippage_desc: 'Verrouillage du taux de change pendant toute votre session de commande',
    oracle_history_logs: 'Historique des taux',
    exchange_calc_title: 'Calculateur de conversion rapide',
    ai_translated_live: 'Traduit en direct par le moteur CyberPool AI',
    reset_btn: 'Réinitialiser par défaut',
    apply_btn: 'Appliquer et enregistrer',
    app_brand_sub: 'Plateforme d’achat groupé et de recharge de jeux automatisée',

    common: {
      free: 'Gratuit',
      security: 'Sécurité & Escrow Garanti',
      amount: 'Montant',
      balance: 'Solde disponible',
      scroll: 'Faire défiler',
      from: 'À partir de',
      prev: 'Précédent',
      next: 'Suivant'
    },

    modal: {
      close: 'Fermer',
      cancel: 'Annuler',
      confirm: 'Confirmer'
    },

    nav: {
      account_profile: 'Profil du compte',
      admin_panel: 'Panneau d’administration',
      affiliate: 'Affiliation & Revendeurs (-10%)',
      banking_topup: 'Virement bancaire / QR',
      categories: 'Catégories',
      escrow_pools: 'Achats groupés',
      flash_sales: 'Ventes flash',
      game_topup: 'Recharge de jeux',
      orders: 'Mes commandes',
      products: 'Produits numériques & Clés',
      reseller_api: 'API Revendeur',
      support_hub: 'Centre de support',
      topup: 'Recharge rapide',
      vault: 'Coffre-fort de clés',
      wallet: 'Portefeuille'
    },

    hero: {
      title: 'LA PLATEFORME N°1 D’ACHATS GROUPÉS ET D’ESCROW DE CLÉS NUMÉRIQUES'
    },

    announcement: {
      title: 'Annonce système CyberPool',
      welcome_desc: 'Bienvenue sur la plus grande place de marché d’achat groupé de clés et licences numériques !'
    },

    flash_sale: {
      title: 'VENTES FLASH ÉCLAIR',
      deals_count: '{{count}} Offres Chaudes',
      limited_time_slots: 'Places limitées',
      ends_in: 'Se termine dans',
      grid_view: 'Vue Grille 4',
      carousel_view: 'Vue Défilement',
      claimed_progress: '{{percent}}% Rempli',
      few_left: 'Plus que {{left}} places !',
      hunt_btn: 'Profiter maintenant',
      badge: 'JUSQU’À -{{discount}}%',
      scroll_hint: 'Faites défiler vers la droite pour découvrir d’autres offres'
    },

    showcase: {
      title: 'PRODUITS EN VEDETTE & GROUPES POPULAIRES',
      items_count: '{{count}} produits',
      grid_mode: 'Mode Grille',
      scroll_mode: 'Mode Défilement',
      scroll_hint: 'Glisser vers la droite pour voir plus',
      escrow_note: '100% des transactions sécurisées par Smart Escrow'
    },

    create_pool: {
      title: 'Créer un nouveau groupe d’achat',
      subtitle: 'Profitez de tarifs de gros imbattables. Remboursement automatique à 100% si non atteint',
      select_product: 'Sélectionner le produit',
      target_slots: 'Nombre de participants requis',
      pool_title: 'Titre du groupe',
      duration: 'Durée (Heures)',
      submit_btn: 'Créer et déposer les fonds Escrow'
    },

    escrow: {
      auto_refund: 'Remboursement automatique à 100%',
      auto_refund_desc: 'Si le groupe n’atteint pas le quota avant la fin du compte à rebours, 100% des fonds sont restitués instantanément',
      instant_delivery: 'Livraison automatique 24/7 en 3 secondes',
      instant_delivery_desc: 'Dès que le groupe est complet, vos clés et accès sont générés dans votre coffre en 3s',
      step1_title: '1. Rejoindre ou créer un groupe',
      step1_desc: 'Choisissez votre produit numérique et achetez en gros avec la communauté',
      step2_title: '2. Protection Smart Escrow',
      step2_desc: 'Vos fonds sont protégés sous séquestre intelligent et ne sont libérés qu’à la livraison',
      step3_title: '3. Réception en 3s ou remboursement',
      step3_desc: 'Recevez vos identifiants immédiatement ou bénéficiez d’un remboursement intégral garanti',
      guarantee_title: 'Garantie de protection acheteur CyberPool',
      warranty: 'Garantie de remplacement 100% 1 pour 1',
      warranty_desc: 'Remplacement immédiat ou remboursement en cas de dysfonctionnement durant la garantie'
    },

    product: {
      retail_price: 'Prix unitaire',
      group_price: 'Prix achat groupé',
      reviews_count: '{{count}} Avis',
      reviews_tab: 'Avis et évaluations',
      delivery: 'Livraison instantanée 24/7',
      features: 'Points forts',
      instant_buy: 'Acheter seul (Immédiat)'
    },

    pools: {
      expires_in: 'Expire dans',
      slots: 'Places',
      pool_price: 'Prix groupé',
      save_percent: 'Économisez {{percent}}%',
      need_more: 'Encore {{count}} pers.',
      full: 'Groupe complet',
      join_btn: 'Rejoindre et déposer'
    },

    cart: {
      total_label: 'Total à payer',
      voucher_discount: 'Remise code promo',
      enter_voucher: 'Entrez un code promo...',
      apply_btn: 'Appliquer'
    },

    deposit: {
      title: 'Recharger le portefeuille CyberPool',
      subtitle: 'Supporte les virements instantanés QR, USDT Crypto et cartes prépayées'
    },

    wallet: {
      deposit_modal_title: 'Passerelle de dépôt automatisée',
      bank_transfer: 'Virement bancaire / QR',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: 'Portefeuille électronique',
      balance: 'Solde du portefeuille',
      balance_available: 'Solde disponible',
      topup_btn: 'Recharger',
      no_transactions: 'Aucune transaction pour le moment'
    },

    topup: {
      amount: 'Montant de recharge',
      choose_method: 'Choisir le mode de paiement'
    },

    key_vault: {
      title: 'Votre coffre-fort de clés et licences',
      subtitle: 'Stockage sécurisé de l’ensemble de vos clés officielles et identifiants achetés',
      search_placeholder: 'Rechercher par clé, nom ou n° de commande...',
      no_keys: 'Votre coffre-fort est vide',
      no_keys_desc: 'Vous n’avez pas encore de clés. Rejoignez un achat groupé dès maintenant !',
      copy_key: 'Copier la clé',
      copy: 'Copier',
      copied: 'Copié !',
      status_fulfilled: 'Délivré',
      status_locked: 'Verrouillé'
    },

    key_tools: {
      title: 'Boîte à outils de licences numériques',
      subtitle: 'Validation en ligne des clés, découpage par lots et conversion de format'
    },

    lucky_wheel: {
      title: 'Roue de la fortune Cyber'
    },

    telco: {
      title: 'Échange de cartes cadeaux et recharges'
    },

    tickets: {
      center_title: 'Centre de support 24/7 & Réclamations',
      center_desc: 'Ouvrez un ticket de support ou de garantie, nos agents vous répondent en moins de 5 minutes',
      ticket_list: 'Liste des tickets',
      new_ticket: '+ Nouveau ticket'
    },

    affiliate: {
      current_tier: 'Niveau affilié actuel',
      commission_available: 'Commissions disponibles',
      invited_count: 'Membres parrainés',
      referral_code: 'Votre code de parrainage',
      referral_link: 'Lien de parrainage',
      description: 'Gagnez jusqu’à 15% de commission à vie sur tous les achats de vos filleuls',
      tab_overview: 'Vue d’ensemble & Gains',
      tab_tiers: 'Avantages par niveau',
      tab_history: 'Historique des gains',
      tab_api: 'API Développeur'
    },

    categories: {
      almost_full: 'Presque complet'
    },

    products: {
      no_products_found: 'Aucun produit correspondant'
    },

    currency_oracle: {
      currency_title: 'Oracle de change devises & crypto',
      hourly_cron_active: 'Synchronisation horaire automatisée active'
    }
  },

  de: {
    modal_title: 'Sprach- & Währungseinstellungen',
    modal_subtitle: 'Passen Sie die CyberPool-Oberfläche an Ihre Region und Wechselkurse an',
    tab_presets: 'Schnell-Voreinstellungen',
    tab_language: 'Sprache wählen',
    tab_currency: 'Währung wählen',
    tab_oracle: 'Kurse & Orakel',
    select_language_title: 'Anzeigesprache auswählen',
    ai_auto_pair_label: 'Empfohlene Währung automatisch koppeln',
    currency_title: 'Standardwährung',
    ai_status_badge: 'KI-Automatisiert',
    select_currency_title: 'Zahlungswährung auswählen',
    oracle_cron_status: 'Status des automatischen Orakels',
    oracle_next_sync: 'Nächste Synchronisierung in',
    oracle_manual_sync: 'Jetzt synchronisieren',
    oracle_slippage_protection: 'Slippage-Schutz',
    oracle_slippage_desc: 'Sichert den Wechselkurs während des gesamten Bezahlvorgangs ab',
    oracle_history_logs: 'Kursverlaufsprotokoll',
    exchange_calc_title: 'Schnell-Währungsrechner',
    ai_translated_live: 'Live übersetzt durch die CyberPool AI Engine',
    reset_btn: 'Auf Standard zurücksetzen',
    apply_btn: 'Anwenden & Speichern',
    app_brand_sub: 'Plattform für Gruppenkäufe & automatisierte Gaming-Aufladungen',

    common: {
      free: 'Kostenlos',
      security: 'Sicherheit & Treuhand-Garantie',
      amount: 'Betrag',
      balance: 'Verfügbares Guthaben',
      scroll: 'Scrollen für mehr',
      from: 'Ab',
      prev: 'Zurück',
      next: 'Weiter'
    },

    modal: {
      close: 'Schließen',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen'
    },

    nav: {
      account_profile: 'Kontoprofil',
      admin_panel: 'Admin-Dashboard',
      affiliate: 'Partnerprogramm & Reseller (-10%)',
      banking_topup: 'Banküberweisung / QR',
      categories: 'Produktkategorien',
      escrow_pools: 'Gruppenkauf-Pools',
      flash_sales: 'Flash-Sales',
      game_topup: 'Automatische Spielaufladung',
      orders: 'Meine Bestellungen',
      products: 'Digitale Produkte & Keys',
      reseller_api: 'Reseller-API',
      support_hub: 'Support-Zentrum',
      topup: 'Schnelle Aufladung',
      vault: 'Key-Tresor',
      wallet: 'Digitale Wallet'
    },

    hero: {
      title: 'DIE NR. 1 PLATTFORM FÜR GRUPPENKÄUFE & TREUHAND-GESICHERTE DIGITALE KEYS'
    },

    announcement: {
      title: 'CyberPool Systemankündigung',
      welcome_desc: 'Willkommen auf dem führenden Marktplatz für Gruppenkäufe von Software-Lizenzen und Spiele-Keys!'
    },

    flash_sale: {
      title: 'BLITZ-FLASH-SALES',
      deals_count: '{{count}} Top-Angebote',
      limited_time_slots: 'Begrenzte Plätze',
      ends_in: 'Endet in',
      grid_view: '4er-Gitteransicht',
      carousel_view: 'Horizontales Karussell',
      claimed_progress: '{{percent}}% Erreicht',
      few_left: 'Nur noch {{left}} Plätze!',
      hunt_btn: 'Jetzt sichern',
      badge: 'BIS ZU -{{discount}}%',
      scroll_hint: 'Nach rechts wischen, um weitere Angebote zu sehen'
    },

    showcase: {
      title: 'BELIEBTE PRODUKTE & TOP-GRUPPENKÄUFE',
      items_count: '{{count}} Produkte',
      grid_mode: 'Gitter-Modus',
      scroll_mode: 'Scroll-Modus',
      scroll_hint: 'Nach rechts scrollen für mehr',
      escrow_note: '100% der Transaktionen durch Smart-Escrow geschützt'
    },

    create_pool: {
      title: 'Neuen Gruppenkauf starten',
      subtitle: 'Erstellen Sie eine Gruppe für Großhandelspreise. Automatische Rückerstattung bei Nichtzustandekommen',
      select_product: 'Produkt für Gruppenkauf auswählen',
      target_slots: 'Erforderliche Teilnehmer',
      pool_title: 'Titel der Gruppe',
      duration: 'Dauer (Stunden)',
      submit_btn: 'Erstellen & Treuhand-Betrag hinterlegen'
    },

    escrow: {
      auto_refund: '100% Automatische Rückerstattung',
      auto_refund_desc: 'Wird die Zielgröße vor Ablauf des Timers nicht erreicht, wird Ihr Betrag sofort zu 100% auf Ihr Wallet erstattet',
      instant_delivery: '24/7 Automatische Sofortauslieferung',
      instant_delivery_desc: 'Sobald die Gruppe voll ist, erhalten Sie Ihren Lizenzschlüssel innerhalb von 3 Sekunden in Ihren Tresor',
      step1_title: '1. Gruppe beitreten oder erstellen',
      step1_desc: 'Wählen Sie das gewünschte Produkt und sichern Sie sich gemeinsam unschlagbare Großhandelspreise',
      step2_title: '2. Gesichert im Smart-Escrow',
      step2_desc: 'Ihr Geld bleibt im Plattform-Treuhandkonto geschützt und wird erst nach erfolgreicher Lieferung ausgezahlt',
      step3_title: '3. Sofortige Lieferung oder Rückerstattung',
      step3_desc: 'Erhalten Sie Ihre Lizenz in 3 Sekunden oder eine garantierte 100%ige Rückerstattung',
      guarantee_title: 'CyberPool Käuferschutz-Garantie',
      warranty: '100% 1-zu-1 Ersatzgarantie',
      warranty_desc: 'Sofortiger Ersatz oder Rückerstattung bei Fehlern während der Garantiezeit'
    },

    product: {
      retail_price: 'Einzelpreis',
      group_price: 'Gruppenkauf-Preis',
      reviews_count: '{{count}} Bewertungen',
      reviews_tab: 'Kundenbewertungen',
      delivery: 'Sofortige 24/7 Lieferung',
      features: 'Produktmerkmale',
      instant_buy: 'Sofort einzeln kaufen'
    },

    pools: {
      expires_in: 'Läuft ab in',
      slots: 'Plätze',
      pool_price: 'Gruppenpreis',
      save_percent: '{{percent}}% sparen',
      need_more: 'Noch {{count}} Personen',
      full: 'Gruppe voll',
      join_btn: 'Beitreten & hinterlegen'
    },

    cart: {
      total_label: 'Gesamtbetrag',
      voucher_discount: 'Gutscheinrabatt',
      enter_voucher: 'Gutscheincode eingeben...',
      apply_btn: 'Anwenden'
    },

    deposit: {
      title: 'CyberPool Wallet aufladen',
      subtitle: 'Unterstützt Banküberweisungen / QR, USDT Krypto und Gutscheinkarten'
    },

    wallet: {
      deposit_modal_title: 'Automatisiertes Einzahlungs-Gateway',
      bank_transfer: 'Banküberweisung / QR',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: 'E-Wallet',
      balance: 'Wallet-Guthaben',
      balance_available: 'Verfügbares Guthaben',
      topup_btn: 'Guthaben aufladen',
      no_transactions: 'Bisher keine Transaktionen'
    },

    topup: {
      amount: 'Aufladebetrag',
      choose_method: 'Zahlungsmethode wählen'
    },

    key_vault: {
      title: 'Ihr Key-Tresor & Digitale Lizenzen',
      subtitle: 'Sichere Aufbewahrung aller gekauften Lizenzschlüssel und Zugangsdaten',
      search_placeholder: 'Nach Schlüssel, Produktname oder Bestellnummer suchen...',
      no_keys: 'Ihr Tresor ist leer',
      no_keys_desc: 'Sie haben noch keine Schlüssel erworben. Nehmen Sie jetzt an einem Gruppenkauf teil!',
      copy_key: 'Key kopieren',
      copy: 'Kopieren',
      copied: 'Kopiert!',
      status_fulfilled: 'Geliefert',
      status_locked: 'Gesperrt'
    },

    key_tools: {
      title: 'Lizenzschlüssel- & Token-Werkzeuge',
      subtitle: 'Online-Schlüsselvalidierung, Batch-Aufteilung und Formatkonvertierung'
    },

    lucky_wheel: {
      title: 'Cyber-Glücksrad'
    },

    telco: {
      title: 'Gutscheinkarten- & Guthabentausch'
    },

    tickets: {
      center_title: '24/7 Support- & Reklamationszentrum',
      center_desc: 'Eröffnen Sie ein Support- oder Garantieticket. Unsere Mitarbeiter antworten innerhalb von 5 Minuten',
      ticket_list: 'Ticket-Übersicht',
      new_ticket: '+ Neues Ticket erstellen'
    },

    affiliate: {
      current_tier: 'Aktuelle Partnerstufe',
      commission_available: 'Verfügbare Provision',
      invited_count: 'Geworbene Mitglieder',
      referral_code: 'Ihr Empfehlungscode',
      referral_link: 'Ihr Empfehlungslink',
      description: 'Verdienen Sie bis zu 15% lebenslange Provision auf alle Käufe Ihrer geworbenen Nutzer',
      tab_overview: 'Übersicht & Einnahmen',
      tab_tiers: 'Stufen-Vorteile',
      tab_history: 'Auszahlungsverlauf',
      tab_api: 'Entwickler-API'
    },

    categories: {
      almost_full: 'Fast voll'
    },

    products: {
      no_products_found: 'Keine passenden Produkte gefunden'
    },

    currency_oracle: {
      currency_title: 'Währungs- & Krypto-Orakel',
      hourly_cron_active: 'Stündliche automatische Kurssynchronisation aktiv'
    }
  },

  es: {
    modal_title: 'Configuración de idioma y moneda',
    modal_subtitle: 'Personalice la interfaz de CyberPool según su país y tasas de cambio preferidas',
    tab_presets: 'Ajustes predefinidos',
    tab_language: 'Seleccionar idioma',
    tab_currency: 'Seleccionar moneda',
    tab_oracle: 'Tipos de cambio y Oráculo',
    select_language_title: 'Seleccionar idioma de visualización',
    ai_auto_pair_label: 'Sincronizar moneda recomendada automáticamente',
    currency_title: 'Moneda predeterminada',
    ai_status_badge: 'Automatizado por IA',
    select_currency_title: 'Seleccionar moneda de pago',
    oracle_cron_status: 'Estado del oráculo automático',
    oracle_next_sync: 'Próxima sincronización en',
    oracle_manual_sync: 'Sincronizar ahora',
    oracle_slippage_protection: 'Protección contra deslizamiento',
    oracle_slippage_desc: 'Fija el tipo de cambio durante toda su sesión de compra',
    oracle_history_logs: 'Historial de tasas de cambio',
    exchange_calc_title: 'Calculadora de conversión rápida',
    ai_translated_live: 'Traducido en vivo por el motor CyberPool AI',
    reset_btn: 'Restablecer valores predeterminados',
    apply_btn: 'Aplicar y guardar cambios',
    app_brand_sub: 'Plataforma de compras conjuntas y recarga de juegos automatizada',

    common: {
      free: 'Gratis',
      security: 'Seguridad y custodia Smart Escrow',
      amount: 'Importe',
      balance: 'Saldo disponible',
      scroll: 'Desplazar para ver más',
      from: 'Desde',
      prev: 'Anterior',
      next: 'Siguiente'
    },

    modal: {
      close: 'Cerrar',
      cancel: 'Cancelar',
      confirm: 'Confirmar'
    },

    nav: {
      account_profile: 'Perfil de cuenta',
      admin_panel: 'Panel de administración',
      affiliate: 'Afiliados y distribuidores (-10%)',
      banking_topup: 'Transferencia bancaria / QR',
      categories: 'Categorías de productos',
      escrow_pools: 'Grupos de compra conjunta',
      flash_sales: 'Ofertas Flash',
      game_topup: 'Recarga de juegos automática',
      orders: 'Mis pedidos',
      products: 'Productos digitales y claves',
      reseller_api: 'API para distribuidores',
      support_hub: 'Centro de soporte',
      topup: 'Recarga rápida',
      vault: 'Bóveda de claves',
      wallet: 'Billetera digital'
    },

    hero: {
      title: 'LA PLATAFORMA Nº 1 DE COMPRAS CONJUNTAS Y ESCROW DE ACTIVOS DIGITALES'
    },

    announcement: {
      title: 'Aviso del sistema CyberPool',
      welcome_desc: '¡Bienvenido al mayor mercado de compra conjunta de claves y licencias digitales!'
    },

    flash_sale: {
      title: 'OFERTAS FLASH RELÁMPAGO',
      deals_count: '{{count}} Ofertas Destacadas',
      limited_time_slots: 'Cupos limitados',
      ends_in: 'Termina en',
      grid_view: 'Vista Cuadrícula 4',
      carousel_view: 'Vista Carrusel Horizontal',
      claimed_progress: '{{percent}}% Completado',
      few_left: '¡Solo quedan {{left}} cupos!',
      hunt_btn: 'Reclamar ahora',
      badge: 'HASTA -{{discount}}%',
      scroll_hint: 'Deslice hacia la derecha para descubrir más ofertas flash'
    },

    showcase: {
      title: 'PRODUCTOS DESTACADOS Y GRUPOS POPULARES',
      items_count: '{{count}} productos',
      grid_mode: 'Modo Cuadrícula',
      scroll_mode: 'Modo Desplazamiento',
      scroll_hint: 'Deslice a la derecha para ver más',
      escrow_note: '100% de transacciones aseguradas con Smart Escrow'
    },

    create_pool: {
      title: 'Iniciar nuevo grupo de compra',
      subtitle: 'Compre en grupo con precios de mayorista. Reembolso 100% automático si no se llena el grupo',
      select_product: 'Seleccionar producto para el grupo',
      target_slots: 'Participantes requeridos (Cupos)',
      pool_title: 'Título del grupo',
      duration: 'Duración (Horas)',
      submit_btn: 'Crear y depositar fondos en Escrow'
    },

    escrow: {
      auto_refund: '100% Reembolso automático',
      auto_refund_desc: 'Si el grupo no alcanza el cupo antes del tiempo límite, el 100% de su dinero se devuelve al instante a su billetera',
      instant_delivery: 'Entrega automática 24/7 en 3 segundos',
      instant_delivery_desc: 'En cuanto el grupo se completa, el sistema entrega su clave o cuenta en su bóveda en 3s',
      step1_title: '1. Unirse o crear un grupo',
      step1_desc: 'Elija el producto digital deseado y compre en conjunto con precios mayoristas',
      step2_title: '2. Protección Smart Escrow',
      step2_desc: 'Sus fondos permanecen protegidos en la custodia inteligente y no se transfieren al vendedor hasta la entrega',
      step3_title: '3. Entrega en 3s o reembolso total',
      step3_desc: 'Reciba sus claves en 3 segundos al completarse el grupo o reciba un reembolso del 100% garantizado',
      guarantee_title: 'Garantía de protección al comprador CyberPool',
      warranty: 'Garantía de reemplazo 100% 1 a 1',
      warranty_desc: 'Reemplazo inmediato o reembolso total si surge algún inconveniente durante el periodo de garantía'
    },

    product: {
      retail_price: 'Precio individual',
      group_price: 'Precio en grupo',
      reviews_count: '{{count}} Valoraciones',
      reviews_tab: 'Opiniones de compradores',
      delivery: 'Entrega instantánea 24/7',
      features: 'Características principales',
      instant_buy: 'Comprar individual (Inmediato)'
    },

    pools: {
      expires_in: 'Expira en',
      slots: 'Cupos',
      pool_price: 'Precio en grupo',
      save_percent: 'Ahorro {{percent}}%',
      need_more: 'Faltan {{count}} pers.',
      full: 'Grupo lleno',
      join_btn: 'Unirse y depositar'
    },

    cart: {
      total_label: 'Total a pagar',
      voucher_discount: 'Descuento cupón',
      enter_voucher: 'Introducir código de descuento...',
      apply_btn: 'Aplicar'
    },

    deposit: {
      title: 'Recargar saldo en CyberPool',
      subtitle: 'Admite transferencias bancarias / QR, USDT Crypto y tarjetas de regalo'
    },

    wallet: {
      deposit_modal_title: 'Pasarela de recarga automática',
      bank_transfer: 'Transferencia bancaria / QR',
      crypto_usdt: 'USDT (TRC20 / BEP20)',
      momo_wallet: 'Billetera electrónica',
      balance: 'Saldo de billetera',
      balance_available: 'Saldo disponible',
      topup_btn: 'Recargar saldo',
      no_transactions: 'No hay transacciones todavía'
    },

    topup: {
      amount: 'Monto de recarga',
      choose_method: 'Seleccionar método de pago'
    },

    key_vault: {
      title: 'Su bóveda de claves y licencias',
      subtitle: 'Almacenamiento seguro de todas las claves de licencia y cuentas adquiridas en CyberPool',
      search_placeholder: 'Buscar por clave, nombre de producto o pedido...',
      no_keys: 'Su bóveda está vacía',
      no_keys_desc: 'Aún no tiene claves compradas. ¡Únase a una compra conjunta ahora mismo!',
      copy_key: 'Copiar clave',
      copy: 'Copiar',
      copied: '¡Copiado!',
      status_fulfilled: 'Entregado',
      status_locked: 'Bloqueado'
    },

    key_tools: {
      title: 'Herramientas de claves y licencias',
      subtitle: 'Validación en línea de claves, división por lotes y conversión de formatos'
    },

    lucky_wheel: {
      title: 'Ruleta de la suerte Cyber'
    },

    telco: {
      title: 'Canje de tarjetas de regalo y saldo'
    },

    tickets: {
      center_title: 'Centro de atención y soporte 24/7',
      center_desc: 'Abra un ticket de soporte o garantía, nuestros agentes responden en menos de 5 minutos',
      ticket_list: 'Lista de tickets',
      new_ticket: '+ Crear nuevo ticket'
    },

    affiliate: {
      current_tier: 'Nivel actual de afiliado',
      commission_available: 'Comisión disponible',
      invited_count: 'Miembros referidos',
      referral_code: 'Su código de referido',
      referral_link: 'Enlace de referido',
      description: 'Gane hasta un 15% de comisión de por vida en todas las compras de sus usuarios referidos',
      tab_overview: 'Resumen y ganancias',
      tab_tiers: 'Beneficios por nivel',
      tab_history: 'Historial de pagos',
      tab_api: 'API para desarrolladores'
    },

    categories: {
      almost_full: 'Casi lleno'
    },

    products: {
      no_products_found: 'No se encontraron productos coincidentes'
    },

    currency_oracle: {
      currency_title: 'Oráculo de divisas fiduciarias y cripto',
      hourly_cron_active: 'Sincronización horaria automática activa'
    }
  }
};

function deepMerge(target: any, source: any) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

const existingLocales: Record<string, any> = {
  vi, en, zh, ja, ko, ru, fr, de, es
};

for (const [code, extra] of Object.entries(additions)) {
  const base = existingLocales[code];
  const merged = deepMerge(JSON.parse(JSON.stringify(base)), extra);
  const outPath = path.join(process.cwd(), `src/i18n/locales/${code}.ts`);
  const content = `export const ${code} = ${JSON.stringify(merged, null, 2)};\n`;
  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`Updated locale file: src/i18n/locales/${code}.ts`);
}

console.log('Successfully updated all 9 locales!');
