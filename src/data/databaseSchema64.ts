export interface DatabaseTableInfo {
  name: string;
  category: 'core' | 'products' | 'topup' | 'orders' | 'users' | 'finance' | 'support' | 'marketing' | 'system' | 'logs';
  description: string;
  columnsCount: number;
  rowCount: number;
  engine: string;
  collation: string;
  primaryKey: string;
  indexes: string[];
  cleanStatus: 'Schema Preserved (Cleaned)' | 'System Config Seeded';
  sampleColumns: string[];
}

export const DATABASE_64_TABLES: DatabaseTableInfo[] = [
  // 1. Core Topup Engine (GameTopup)
  {
    name: 'games',
    category: 'topup',
    description: 'Danh mục 121 tựa game hỗ trợ nạp UID / Direct API (Genshin, Liên Quân, Valorant, Free Fire, Roblox, Steam...)',
    columnsCount: 15,
    rowCount: 121,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_status', 'idx_category'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'name', 'full_name', 'category', 'icon', 'image', 'uid_pattern', 'uid_help', 'currency_name', 'status', 'sort_order']
  },
  {
    name: 'topup_tiers',
    category: 'topup',
    description: '1.702 mức gói nạp (Gem, Kim Cương, VP, Robux, Pass tuần/tháng, All-pack combo)',
    columnsCount: 11,
    rowCount: 1702,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_game_type', 'idx_status_sort'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'game_id', 'type', 'label', 'amount', 'price', 'cost', 'provider_id', 'status', 'sort_order']
  },
  {
    name: 'topup_providers',
    category: 'topup',
    description: 'Cổng kết nối nhà cung cấp API tự động (Midasbuy, SmileOne, TheSieuRe, UniPin, Moogold, Mock Provider)',
    columnsCount: 18,
    rowCount: 6,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'slug_UNIQUE', 'idx_status_priority'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'name', 'slug', 'type', 'api_endpoint', 'api_key', 'api_secret', 'http_method', 'timeout_ms', 'fee_percent', 'status']
  },
  {
    name: 'topup_api_logs',
    category: 'logs',
    description: 'Nhật ký gọi API nạp game, thời gian phản hồi (duration_ms), payload request và response JSON',
    columnsCount: 8,
    rowCount: 3840,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_order', 'idx_created_at'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'order_id', 'game_id', 'request_data', 'response_data', 'status_code', 'duration_ms', 'created_at']
  },
  {
    name: 'game_servers',
    category: 'topup',
    description: 'Danh sách máy chủ của các tựa game phân vùng (Asia, America, Europe, VN, SEA)',
    columnsCount: 7,
    rowCount: 84,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_game_id'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'game_id', 'server_id', 'server_name', 'region_code', 'status', 'sort_order']
  },

  // 2. Product & Stock CMS
  {
    name: 'products',
    category: 'products',
    description: 'Danh mục sản phẩm bản quyền số, tài khoản MMO, phần mềm, key license',
    columnsCount: 22,
    rowCount: 48,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_category_id', 'idx_status', 'idx_slug'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'category_id', 'name', 'slug', 'price', 'cost', 'stock_count', 'sold_count', 'type', 'check_live_active', 'status']
  },
  {
    name: 'product_category',
    category: 'products',
    description: 'Danh mục nhóm sản phẩm đa cấp (AI Tools, Game Keys, Tài Khoản MMO, Streaming, Software)',
    columnsCount: 9,
    rowCount: 12,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_parent_id', 'idx_status'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'parent_id', 'name', 'slug', 'icon', 'image', 'sort_order', 'status']
  },
  {
    name: 'product_stock',
    category: 'products',
    description: 'Kho lưu trữ tài nguyên chưa bán theo định dạng User|Pass|2FA|Mail|Key',
    columnsCount: 10,
    rowCount: 1450,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_product_id', 'idx_status', 'idx_order_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'product_id', 'plan_id', 'extra_data', 'status', 'sold_at', 'order_id', 'created_at']
  },
  {
    name: 'product_plans',
    category: 'products',
    description: 'Các gói thời hạn sử dụng sản phẩm (1 Tháng, 3 Tháng, 1 Năm, Vĩnh viễn)',
    columnsCount: 9,
    rowCount: 64,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_product_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'product_id', 'name', 'duration_days', 'price', 'cost', 'status', 'sort_order']
  },
  {
    name: 'product_reviews',
    category: 'products',
    description: 'Đánh giá, chấm điểm sao và phản hồi từ khách hàng sau khi nhận hàng',
    columnsCount: 9,
    rowCount: 210,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_product_id', 'idx_user_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'product_id', 'rating', 'comment', 'images', 'is_verified', 'status', 'created_at']
  },

  // 3. Orders & Escrow
  {
    name: 'product_order',
    category: 'orders',
    description: 'Bảng tổng hợp tất cả đơn hàng (Key số, Nạp UID, Gom đơn Escrow Mua Chung)',
    columnsCount: 24,
    rowCount: 890,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_trans_id_UNIQUE', 'idx_buyer_id', 'idx_topup_status', 'idx_created_at'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'trans_id', 'buyer_id', 'product_id', 'topup_tier_id', 'topup_status', 'game_uid', 'provider_order_id', 'pay_amount', 'status']
  },
  {
    name: 'order_items',
    category: 'orders',
    description: 'Chi tiết từng mặt hàng và mã key bàn giao trong đơn hàng',
    columnsCount: 8,
    rowCount: 1240,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_order_id', 'idx_stock_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'order_id', 'stock_id', 'product_id', 'price', 'delivered_key', 'created_at']
  },
  {
    name: 'escrow_pools',
    category: 'orders',
    description: 'Nhóm gom đơn mua chung bảo lãnh (Target slots, filled slots, savings, deadline)',
    columnsCount: 14,
    rowCount: 32,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_product_id', 'idx_status'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'product_id', 'host_id', 'target_slots', 'filled_slots', 'price_per_slot', 'retail_price', 'status', 'expires_at']
  },
  {
    name: 'escrow_participants',
    category: 'orders',
    description: 'Danh sách thành viên tham gia giữ chỗ đặt cọc trong từng pool',
    columnsCount: 9,
    rowCount: 118,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_pool_id', 'idx_user_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'pool_id', 'user_id', 'slot_number', 'deposit_amount', 'tx_hash', 'is_claimed', 'joined_at']
  },

  // 4. Users & Access Control (RBAC)
  {
    name: 'users',
    category: 'users',
    description: 'Bảng tài khoản người dùng, phân cấp đại lý CTV (Silver, Gold, Diamond, Admin), số dư ví, 2FA',
    columnsCount: 26,
    rowCount: 450,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'username_UNIQUE', 'email_UNIQUE', 'idx_admin_role', 'idx_status'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'username', 'email', 'password', 'token', 'money', 'total_money', 'role', 'admin', 'banned', 'otp_secret', 'ip']
  },
  {
    name: 'admin_role',
    category: 'users',
    description: 'Quy định các vai trò quản trị viên và phân quyền chi tiết (Super Admin, Sales, Support, Finance)',
    columnsCount: 6,
    rowCount: 5,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'name', 'permissions_json', 'description', 'status', 'created_at']
  },
  {
    name: 'block_ip',
    category: 'users',
    description: 'Danh sách đen IP bị chặn truy cập hoặc hạn chế rate-limit chống tấn công brute-force',
    columnsCount: 6,
    rowCount: 12,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_ip_address'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'ip_address', 'reason', 'banned_by', 'expires_at', 'created_at']
  },

  // 5. Finance & Recharge Gateways
  {
    name: 'payment_bank',
    category: 'finance',
    description: 'Cấu hình tài khoản ngân hàng và lịch sử nạp VietQR tự động qua Webhook / Cron',
    columnsCount: 16,
    rowCount: 640,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_user_id', 'idx_trans_id', 'idx_status'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'trans_id', 'bank_code', 'account_no', 'amount', 'received_amount', 'status', 'created_at']
  },
  {
    name: 'payment_card',
    category: 'finance',
    description: 'Lịch sử đổi thẻ cào điện thoại (Viettel, Vina, Mobi, Zing, Garena, Gate) qua API đối tác TSR',
    columnsCount: 14,
    rowCount: 320,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_user_id', 'idx_pin_serial', 'idx_status'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'telco', 'declared_value', 'real_value', 'pin', 'serial', 'fee_percent', 'status', 'created_at']
  },
  {
    name: 'payment_crypto',
    category: 'finance',
    description: 'Giao dịch nạp tiền mã hóa USDT (TRC-20 / BEP-20) tự động đối soát Blockchain TxID',
    columnsCount: 12,
    rowCount: 85,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_tx_hash', 'idx_user_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'network', 'wallet_address', 'usdt_amount', 'vnd_equivalent', 'tx_hash', 'status', 'created_at']
  },
  {
    name: 'payment_paypal',
    category: 'finance',
    description: 'Cổng thanh toán quốc tế PayPal Checkout & IPN Webhook',
    columnsCount: 11,
    rowCount: 42,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_paypal_order_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'paypal_order_id', 'payer_email', 'usd_amount', 'vnd_amount', 'status', 'created_at']
  },
  {
    name: 'transactions',
    category: 'finance',
    description: 'Sổ cái đối soát biến động số dư tài chính (Tiền trước GD, Biến động +/-, Tiền sau GD, Lý do)',
    columnsCount: 10,
    rowCount: 4120,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_user_id', 'idx_created_at'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'amount_before', 'amount_change', 'amount_after', 'action_type', 'description', 'created_at']
  },

  // 6. Support & Live Communication
  {
    name: 'tickets',
    category: 'support',
    description: 'Phiếu yêu cầu hỗ trợ, khiếu nại đơn hàng, bảo hành key và tra soát nạp tiền',
    columnsCount: 10,
    rowCount: 78,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_user_id', 'idx_status_priority'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'order_id', 'subject', 'category', 'priority', 'status', 'last_reply_at', 'created_at']
  },
  {
    name: 'ticket_replies',
    category: 'support',
    description: 'Nội dung trao đổi, tin nhắn phản hồi giữa khách hàng và nhân viên hỗ trợ trong từng Ticket',
    columnsCount: 7,
    rowCount: 245,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_ticket_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'ticket_id', 'user_id', 'is_admin_reply', 'message_content', 'attachments', 'created_at']
  },
  {
    name: 'messages',
    category: 'support',
    description: 'Hộp thư tin nhắn trực tiếp 24/7 (Live Chat WebSocket / Long Polling)',
    columnsCount: 8,
    rowCount: 520,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_sender_receiver', 'idx_read_status'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'sender_id', 'receiver_id', 'message', 'is_read', 'session_id', 'created_at']
  },

  // 7. Marketing, Flash Sales, Affiliate & Minigame
  {
    name: 'flash_sales',
    category: 'marketing',
    description: 'Các chương trình khuyến mãi Flash Sale có hẹn giờ đếm ngược (Countdown Sale)',
    columnsCount: 9,
    rowCount: 6,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_time_range', 'idx_status'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'title', 'start_time', 'end_time', 'banner_url', 'discount_badge', 'status', 'created_at']
  },
  {
    name: 'flash_sale_products',
    category: 'marketing',
    description: 'Danh sách sản phẩm tham gia Flash Sale kèm giá giảm và giới hạn số lượng',
    columnsCount: 8,
    rowCount: 24,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_flash_sale_product'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'flash_sale_id', 'product_id', 'flash_price', 'limit_stock', 'sold_count', 'status']
  },
  {
    name: 'coupons',
    category: 'marketing',
    description: 'Mã giảm giá theo % hoặc tiền mặt, giới hạn số lần sử dụng và đơn tối thiểu',
    columnsCount: 11,
    rowCount: 18,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'code_UNIQUE', 'idx_status'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'code', 'discount_percent', 'discount_max', 'min_order', 'used_count', 'max_usage', 'expires_at', 'status']
  },
  {
    name: 'affiliate_history',
    category: 'marketing',
    description: 'Nhật ký hoa hồng tiếp thị liên kết (CTV Affiliate Referral Commission)',
    columnsCount: 9,
    rowCount: 310,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_referrer_id', 'idx_order_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'referrer_id', 'referred_user_id', 'order_id', 'commission_amount', 'rate_percent', 'status', 'created_at']
  },
  {
    name: 'lucky_wheel_rewards',
    category: 'marketing',
    description: 'Cấu hình các ô quà tặng Vòng Quay May Mắn (Tỷ lệ %, Phần thưởng, Mã code)',
    columnsCount: 9,
    rowCount: 8,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'label', 'reward_type', 'reward_value', 'probability_rate', 'color_hex', 'status']
  },
  {
    name: 'lucky_wheel_history',
    category: 'marketing',
    description: 'Lịch sử người chơi trúng thưởng Minigame và trạng thái trao thưởng tự động',
    columnsCount: 7,
    rowCount: 1420,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_user_id', 'idx_created_at'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'reward_id', 'reward_label', 'tx_id', 'is_claimed', 'created_at']
  },

  // 8. System Settings, Multi-Currency & Languages
  {
    name: 'settings',
    category: 'system',
    description: 'Cấu hình toàn hệ thống (Tên site, Logo, Hotline, Telegram, Tỷ giá, Phí Escrow, Maintenance)',
    columnsCount: 5,
    rowCount: 82,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'name_UNIQUE'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'name', 'value', 'description', 'updated_at']
  },
  {
    name: 'currencies',
    category: 'system',
    description: 'Bảng quản lý đa tiền tệ (VND, USD, USDT, EUR, JPY) và tỷ giá quy đổi động',
    columnsCount: 8,
    rowCount: 5,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'code_UNIQUE'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'code', 'name', 'symbol', 'exchange_rate', 'is_default', 'status']
  },
  {
    name: 'languages',
    category: 'system',
    description: 'Danh sách ngôn ngữ hỗ trợ (Tiếng Việt vi_VN, English en_US, Chinese zh_CN)',
    columnsCount: 7,
    rowCount: 3,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'code_UNIQUE'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'code', 'name', 'flag_icon', 'is_default', 'status']
  },
  {
    name: 'translate',
    category: 'system',
    description: 'Bộ từ điển đa ngôn ngữ (Localization dictionary i18n key-value)',
    columnsCount: 6,
    rowCount: 890,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_lang_key'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'lang_code', 'keyword', 'translation', 'updated_at']
  },
  {
    name: 'menu',
    category: 'system',
    description: 'Cấu hình thanh điều hướng Header & Footer navigation menu',
    columnsCount: 9,
    rowCount: 14,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_position_sort'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'parent_id', 'title', 'url', 'target', 'icon', 'position', 'sort_order', 'status']
  },
  {
    name: 'automations',
    category: 'system',
    description: 'Kịch bản tự động hóa Cronjob (Checklive account, Auto Escrow Release, Sync API stock)',
    columnsCount: 9,
    rowCount: 8,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'action_name_UNIQUE'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'action_name', 'cron_interval', 'last_run_at', 'status', 'retry_limit', 'created_at']
  },

  // 9. Logs & Queue Management
  {
    name: 'logs',
    category: 'logs',
    description: 'Nhật ký hoạt động của quản trị viên và thành viên trên hệ thống',
    columnsCount: 8,
    rowCount: 5600,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_user_id', 'idx_created_at'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'user_id', 'action', 'details', 'ip', 'user_agent', 'created_at']
  },
  {
    name: 'email_queue',
    category: 'logs',
    description: 'Hàng đợi gửi email thông báo đơn hàng và mã OTP (SMTP / SendGrid)',
    columnsCount: 9,
    rowCount: 45,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_status_retry'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'to_email', 'subject', 'body_html', 'attempts', 'status', 'sent_at', 'created_at']
  },
  {
    name: 'telegram_queue',
    category: 'logs',
    description: 'Hàng đợi thông báo Bot Telegram khi có đơn hàng mới hoặc có người nạp tiền',
    columnsCount: 8,
    rowCount: 120,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_status'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'chat_id', 'message_text', 'attempts', 'status', 'sent_at', 'created_at']
  },
  {
    name: 'bot_telegram_logs',
    category: 'logs',
    description: 'Nhật ký tương tác lệnh của Telegram Shop Bot (/start, /buy, /balance, /check)',
    columnsCount: 7,
    rowCount: 340,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_telegram_id'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'telegram_user_id', 'command', 'response_text', 'created_at']
  },
  {
    name: 'api_keys',
    category: 'system',
    description: 'Danh sách API Key cấp cho đối tác kết nối lấy hàng tự động (Reseller API)',
    columnsCount: 8,
    rowCount: 15,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'api_key_UNIQUE', 'idx_user_id'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'user_id', 'api_key', 'api_secret', 'ip_whitelist', 'rate_limit', 'status', 'created_at']
  },
  {
    name: 'api_logs',
    category: 'logs',
    description: 'Nhật ký tra cứu và mua hàng qua Reseller Webhook API',
    columnsCount: 9,
    rowCount: 8200,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_api_key_id', 'idx_created_at'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'api_key_id', 'endpoint', 'request_body', 'response_body', 'ip_address', 'status_code', 'created_at']
  },
  {
    name: 'blogs',
    category: 'marketing',
    description: 'Bài viết tin tức, hướng dẫn nạp game và mẹo mua sắm tiết kiệm',
    columnsCount: 12,
    rowCount: 28,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'slug_UNIQUE', 'idx_status'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'category_id', 'title', 'slug', 'thumbnail', 'summary', 'content_html', 'views', 'status', 'created_at']
  },
  {
    name: 'blog_category',
    category: 'marketing',
    description: 'Chuyên mục bài viết tin tức (Cẩm nang game, Cập nhật sự kiện, Bảo mật tài khoản)',
    columnsCount: 7,
    rowCount: 6,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'slug_UNIQUE'],
    cleanStatus: 'System Config Seeded',
    sampleColumns: ['id', 'name', 'slug', 'description', 'sort_order', 'status']
  },
  {
    name: 'search_logs',
    category: 'logs',
    description: 'Thống kê từ khóa tìm kiếm của khách hàng để tối ưu hóa SEO và nhập nguồn hàng',
    columnsCount: 6,
    rowCount: 1850,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_keyword'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'keyword', 'hits_count', 'user_ip', 'created_at']
  },
  {
    name: 'recycle_bin',
    category: 'system',
    description: 'Thùng rác lưu trữ các bản ghi đã xóa tạm thời (Soft Delete & Restore)',
    columnsCount: 8,
    rowCount: 14,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    primaryKey: 'id',
    indexes: ['PRIMARY', 'idx_table_record'],
    cleanStatus: 'Schema Preserved (Cleaned)',
    sampleColumns: ['id', 'table_name', 'record_id', 'deleted_data_json', 'deleted_by', 'deleted_at']
  }
];

export const SYSTEM_STATISTICS_OVERVIEW = {
  totalFiles: 18700,
  publicAssetsCount: 18000,
  svgCount: 9029,
  jsCount: 3691,
  pngCount: 2406,
  markdownAdminLTE: 1709,
  corePhpFiles: 388,
  databaseTablesCount: 64,
  totalGamesCatalog: 121,
  totalTopupTiers: 1702,
  adcpTotalActions: 45,
  adcpClonedActions: 35,
  cleanDatabaseSchema: 'gamewinn_topup / schema_clean.sql'
};
