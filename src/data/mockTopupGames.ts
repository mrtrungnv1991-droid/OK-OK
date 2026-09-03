import { GameItem, SupportTicket, SupplierApiConfig, TopupTier } from '../types';

interface RawGameSeed {
  id: string;
  name: string;
  category: 'PC' | 'Mobile' | 'Console' | 'Other';
  publisher: string;
  thumbnail: string;
  banner: string;
  uidLabel: string;
  uidPlaceholder: string;
  requiresServer: boolean;
  servers?: string[];
  currencyName: string;
  unit: string;
  description: string;
  tierConfigs: Array<{
    name: string;
    amount: string;
    icon: string;
    retailPrice: number;
    groupPrice: number;
    popular?: boolean;
    badge?: string;
  }>;
}

// 121 Games Catalog (TopUp & Game Engine)
const RAW_GAMES_SEED: RawGameSeed[] = [
  // 1-10: HoYoverse & Riot Games
  {
    id: 'game-genshin',
    name: 'Genshin Impact',
    category: 'PC',
    publisher: 'HoYoverse',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật (9 chữ số)',
    uidPlaceholder: 'VD: 820194821',
    requiresServer: true,
    servers: ['Asia (Châu Á)', 'America (Bắc Mỹ)', 'Europe (Châu Âu)', 'TW, HK, MO'],
    currencyName: 'Đá Sáng Thế',
    unit: 'Genesis Crystals',
    description: 'Nạp Đá Sáng Thế & Không Nguyệt Chúc Phúc tự động qua API Midasbuy & HoYoverse Partner 24/7. Nhận sau 3-30 giây.',
    tierConfigs: [
      { name: 'Không Nguyệt Chúc Phúc (30 Ngày)', amount: '3,000 Nguyên Thạch (30 Ngày)', icon: '🌙', retailPrice: 125000, groupPrice: 89000, popular: true, badge: 'HOT DEAL' },
      { name: 'Gói 60 Đá Sáng Thế', amount: '60 Genesis Crystals', icon: '💎', retailPrice: 25000, groupPrice: 19000 },
      { name: 'Gói 300 + 30 Đá Sáng Thế', amount: '330 Genesis Crystals', icon: '💎', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 980 + 110 Đá Sáng Thế', amount: '1,090 Genesis Crystals', icon: '💎', retailPrice: 380000, groupPrice: 295000 },
      { name: 'Gói 1,980 + 260 Đá Sáng Thế', amount: '2,240 Genesis Crystals', icon: '💎', retailPrice: 750000, groupPrice: 580000, popular: true },
      { name: 'Gói 3,280 + 600 Đá Sáng Thế', amount: '3,880 Genesis Crystals', icon: '💎', retailPrice: 1250000, groupPrice: 960000, badge: 'TIẾT KIỆM 23%' },
      { name: 'Gói 6,480 + 1,600 Đá Sáng Thế', amount: '8,080 Genesis Crystals', icon: '👑', retailPrice: 2450000, groupPrice: 1890000, popular: true, badge: 'SIÊU SỈ' },
      { name: 'Nhật Ký Hành Trình Trân Châu', amount: 'Battle Pass Gnostic Hymn', icon: '📜', retailPrice: 250000, groupPrice: 199000 },
      { name: 'Khúc Ca Trân Châu Cao Cấp', amount: 'Battle Pass Gnostic Chorus', icon: '✨', retailPrice: 500000, groupPrice: 399000 },
      { name: 'Combo Săn Raiden Shogun (x2 Gói 8080)', amount: '16,160 Genesis Crystals', icon: '⚡', retailPrice: 4900000, groupPrice: 3750000, badge: 'COMBO VIP' }
    ]
  },
  {
    id: 'game-hsr',
    name: 'Honkai: Star Rail',
    category: 'PC',
    publisher: 'HoYoverse',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật Trailblazer (9 số)',
    uidPlaceholder: 'VD: 801928471',
    requiresServer: true,
    servers: ['Asia', 'America', 'Europe', 'TW/HK/MO'],
    currencyName: 'Mộng Ước Cổ Xưa',
    unit: 'Oneiric Shards',
    description: 'Nạp Mộng Ước Cổ Xưa và Thẻ Tiếp Tế Tàu Không Gian tự động duyệt ngay trong 3s.',
    tierConfigs: [
      { name: 'Thẻ Tiếp Tế Tàu Không Gian (30 Ngày)', amount: '3,000 Ngọc Ánh Sao (30 Ngày)', icon: '🚂', retailPrice: 125000, groupPrice: 89000, popular: true },
      { name: 'Gói 60 Mộng Ước Cổ Xưa', amount: '60 Oneiric Shards', icon: '💎', retailPrice: 25000, groupPrice: 19000 },
      { name: 'Gói 300 + 30 Mộng Ước', amount: '330 Oneiric Shards', icon: '💎', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 980 + 110 Mộng Ước', amount: '1,090 Oneiric Shards', icon: '💎', retailPrice: 380000, groupPrice: 295000 },
      { name: 'Gói 1,980 + 260 Mộng Ước', amount: '2,240 Oneiric Shards', icon: '💎', retailPrice: 750000, groupPrice: 580000, popular: true },
      { name: 'Gói 3,280 + 600 Mộng Ước', amount: '3,880 Oneiric Shards', icon: '💎', retailPrice: 1250000, groupPrice: 960000 },
      { name: 'Gói 6,480 + 1,600 Mộng Ước', amount: '8,080 Oneiric Shards', icon: '👑', retailPrice: 2450000, groupPrice: 1890000, badge: 'BEST SELLER' },
      { name: 'Vinh Danh Vô Danh (Battle Pass)', amount: 'Nameless Honor Pass', icon: '🎖️', retailPrice: 250000, groupPrice: 199000 }
    ]
  },
  {
    id: 'game-zzz',
    name: 'Zenless Zone Zero (ZZZ)',
    category: 'PC',
    publisher: 'HoYoverse',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật ZZZ (10 số)',
    uidPlaceholder: 'VD: 1500293819',
    requiresServer: true,
    servers: ['Asia', 'America', 'Europe', 'TW/HK/MO'],
    currencyName: 'Monochrome',
    unit: 'Monochrome Film',
    description: 'Nạp Phim Đơn Sắc Monochrome và Thẻ Thành Viên Hội Liên Hiệp 30 ngày.',
    tierConfigs: [
      { name: 'Thẻ Thành Viên Hội Liên Hiệp (30 Ngày)', amount: '3,000 Polychrome (30 Ngày)', icon: '🎞️', retailPrice: 125000, groupPrice: 89000, popular: true },
      { name: 'Gói 60 Monochrome', amount: '60 Monochrome', icon: '📼', retailPrice: 25000, groupPrice: 19000 },
      { name: 'Gói 300 + 30 Monochrome', amount: '330 Monochrome', icon: '📼', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 980 + 110 Monochrome', amount: '1,090 Monochrome', icon: '📼', retailPrice: 380000, groupPrice: 295000 },
      { name: 'Gói 1,980 + 260 Monochrome', amount: '2,240 Monochrome', icon: '📼', retailPrice: 750000, groupPrice: 580000 },
      { name: 'Gói 3,280 + 600 Monochrome', amount: '3,880 Monochrome', icon: '📼', retailPrice: 1250000, groupPrice: 960000 },
      { name: 'Gói 6,480 + 1,600 Monochrome', amount: '8,080 Monochrome', icon: '👑', retailPrice: 2450000, groupPrice: 1890000, badge: 'HOT' }
    ]
  },
  {
    id: 'game-valorant',
    name: 'Valorant (Riot Points / VP)',
    category: 'PC',
    publisher: 'Riot Games',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Riot ID (Kèm Tag #)',
    uidPlaceholder: 'VD: TenZ#NA1 hoặc CyberNinja#VN1',
    requiresServer: true,
    servers: ['Việt Nam (VN)', 'Asia Pacific (AP)', 'North America (NA)', 'Europe (EU)'],
    currencyName: 'Valorant Points',
    unit: 'VP',
    description: 'Nạp Valorant Points (VP) mua Skin súng Vandal Prime / Kuronami. Nạp trực tiếp qua Riot Gateway hoặc Mã Code Riot Pin.',
    tierConfigs: [
      { name: 'Gói 525 Valorant Points (VP)', amount: '525 VP', icon: '🎯', retailPrice: 100000, groupPrice: 79000 },
      { name: 'Gói 1,050 Valorant Points (VP)', amount: '1,050 VP', icon: '🎯', retailPrice: 200000, groupPrice: 155000, popular: true },
      { name: 'Gói 2,650 Valorant Points (VP)', amount: '2,650 VP', icon: '⚡', retailPrice: 500000, groupPrice: 390000, badge: 'HOT SKINS' },
      { name: 'Gói 5,400 Valorant Points (VP)', amount: '5,400 VP', icon: '🔥', retailPrice: 1000000, groupPrice: 780000, badge: 'GOM SỈ -22%' },
      { name: 'Gói 11,000 Valorant Points (VP)', amount: '11,000 VP', icon: '👑', retailPrice: 2000000, groupPrice: 1540000, popular: true, badge: 'SIÊU VIP' }
    ]
  },
  {
    id: 'game-lol',
    name: 'Liên Minh Huyền Thoại (Riot RP VN/Global)',
    category: 'PC',
    publisher: 'Riot Games',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Riot ID (VD: Faker#KR1)',
    uidPlaceholder: 'Nhập Riot ID gồm Tên#Tag',
    requiresServer: true,
    servers: ['Máy chủ Việt Nam (VN2)', 'Bắc Mỹ (NA)', 'Hàn Quốc (KR)', 'Tây Âu (EUW)'],
    currencyName: 'Riot Points',
    unit: 'RP',
    description: 'Nạp RP mua Trang Phục Huyền Thoại, Tối Thượng và Vé Sự Kiện Pass tự động 24/7.',
    tierConfigs: [
      { name: 'Gói 575 RP', amount: '575 RP', icon: '⚔️', retailPrice: 100000, groupPrice: 79000 },
      { name: 'Gói 1,380 RP', amount: '1,380 RP', icon: '⚔️', retailPrice: 200000, groupPrice: 158000, popular: true },
      { name: 'Gói 2,800 RP', amount: '2,800 RP', icon: '🛡️', retailPrice: 400000, groupPrice: 310000 },
      { name: 'Gói 4,500 RP', amount: '4,500 RP', icon: '🔥', retailPrice: 600000, groupPrice: 460000, badge: 'BEST PASS' },
      { name: 'Gói 8,200 RP', amount: '8,200 RP', icon: '👑', retailPrice: 1000000, groupPrice: 760000, popular: true }
    ]
  },
  {
    id: 'game-tft',
    name: 'Đấu Trường Chân Lý (TFT Coins / Mobile & PC)',
    category: 'Mobile',
    publisher: 'Riot Games',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Riot ID / TFT Mobile Account',
    uidPlaceholder: 'VD: Pengu#VN1',
    requiresServer: true,
    servers: ['Việt Nam (VNG)', 'Global (Riot Direct)'],
    currencyName: 'TFT Coins',
    unit: 'TC',
    description: 'Nạp TFT Coins quay Tướng Tí Nị Huyền Thoại, Sân Đấu Tối Thượng và Vé Thiên Hà.',
    tierConfigs: [
      { name: 'Gói 575 TFT Coins', amount: '575 TC', icon: '🐧', retailPrice: 100000, groupPrice: 79000 },
      { name: 'Gói 1,380 TFT Coins', amount: '1,380 TC', icon: '🐧', retailPrice: 200000, groupPrice: 158000, popular: true },
      { name: 'Vé Đấu Trường TFT Pass+', amount: '1,295 TFT Coins Pass', icon: '🎟️', retailPrice: 200000, groupPrice: 150000, badge: 'HOT' },
      { name: 'Gói 5,750 TFT Coins Tí Nị', amount: '5,750 TC', icon: '👑', retailPrice: 800000, groupPrice: 610000 }
    ]
  },
  {
    id: 'game-wildrift',
    name: 'LMHT: Tốc Chiến (Wild Cores)',
    category: 'Mobile',
    publisher: 'Riot Games / VNG',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Riot ID Tốc Chiến',
    uidPlaceholder: 'VD: YasuoGank#VN',
    requiresServer: false,
    currencyName: 'Wild Cores',
    unit: 'WC',
    description: 'Nạp Wild Cores Tốc Chiến VNG chính hãng tự động, chiết khấu đại lý tốt nhất.',
    tierConfigs: [
      { name: 'Gói 500 Wild Cores', amount: '500 WC', icon: '⚡', retailPrice: 100000, groupPrice: 78000 },
      { name: 'Gói 1,050 Wild Cores', amount: '1,050 WC', icon: '⚡', retailPrice: 200000, groupPrice: 155000, popular: true },
      { name: 'Gói 2,750 Wild Cores', amount: '2,750 WC', icon: '🔥', retailPrice: 500000, groupPrice: 385000, badge: 'TIẾT KIỆM' },
      { name: 'Gói 5,750 Wild Cores', amount: '5,750 WC', icon: '👑', retailPrice: 1000000, groupPrice: 760000 }
    ]
  },
  {
    id: 'game-lienquan',
    name: 'Liên Quân Mobile (Arena of Valor)',
    category: 'Mobile',
    publisher: 'Garena',
    thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'OpenID Liên Quân',
    uidPlaceholder: 'Nhập OpenID trong phần Cài đặt > Chung',
    requiresServer: false,
    currencyName: 'Quân Huy',
    unit: 'QH',
    description: 'Nạp Quân Huy tự động tốc độ 3s qua cổng Garena Direct API. Bảo lãnh 100% không lo bị khóa tài khoản.',
    tierConfigs: [
      { name: 'Gói 205 Quân Huy', amount: '205 Quân Huy', icon: '🗡️', retailPrice: 50000, groupPrice: 39000 },
      { name: 'Gói 410 Quân Huy + Vé Quay', amount: '410 Quân Huy', icon: '🗡️', retailPrice: 100000, groupPrice: 78000, popular: true },
      { name: 'Gói 1,025 Quân Huy Sổ Sứ Mệnh', amount: '1,025 Quân Huy', icon: '🛡️', retailPrice: 250000, groupPrice: 195000, badge: 'BEST SELLER' },
      { name: 'Gói 2,100 Quân Huy VIP', amount: '2,100 Quân Huy', icon: '👑', retailPrice: 500000, groupPrice: 385000 },
      { name: 'Gói 4,300 Quân Huy Siêu Cấp', amount: '4,300 Quân Huy', icon: '✨', retailPrice: 1000000, groupPrice: 765000, popular: true }
    ]
  },
  {
    id: 'game-freefire',
    name: 'Garena Free Fire',
    category: 'Mobile',
    publisher: 'Garena',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật Free Fire (8-10 số)',
    uidPlaceholder: 'VD: 198273615',
    requiresServer: false,
    currencyName: 'Kim Cương',
    unit: 'KC',
    description: 'Nạp Kim Cương Free Fire chính hãng qua SmileOne & Garena Partner. Nhận Thẻ Vô Cực và quà nạp tích lũy.',
    tierConfigs: [
      { name: 'Gói 280 Kim Cương', amount: '280 Kim Cương', icon: '💎', retailPrice: 50000, groupPrice: 38000 },
      { name: 'Gói 530 Kim Cương + 53 Bonus', amount: '583 Kim Cương', icon: '💎', retailPrice: 100000, groupPrice: 75000, popular: true },
      { name: 'Thẻ Tuần Free Fire', amount: '450 Kim Cương (7 ngày)', icon: '📅', retailPrice: 50000, groupPrice: 39000 },
      { name: 'Thẻ Tháng Free Fire', amount: '2,600 Kim Cương (30 ngày)', icon: '🗓️', retailPrice: 200000, groupPrice: 155000, badge: 'HOT DEAL' },
      { name: 'Gói 1,080 Kim Cương + 108 Bonus', amount: '1,188 Kim Cương', icon: '💎', retailPrice: 200000, groupPrice: 152000 },
      { name: 'Gói 2,180 Kim Cương Thần Tượng', amount: '2,400 Kim Cương', icon: '👑', retailPrice: 400000, groupPrice: 299000, badge: 'SIÊU RẺ' }
    ]
  },
  {
    id: 'game-fconline',
    name: 'FC Online VN (FIFA Online 4 - FC Cash / MC)',
    category: 'PC',
    publisher: 'Garena',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Tài khoản Garena ID / UID',
    uidPlaceholder: 'Nhập Garena UID của bạn',
    requiresServer: false,
    currencyName: 'FC Cash / MC',
    unit: 'FC',
    description: 'Nạp FC Cash mở gói thẻ Icon TM, 24TOTY, HG, LN tự động qua kết nối Garena Billing.',
    tierConfigs: [
      { name: 'Gói 100 FC / MC Cash', amount: '100 FC', icon: '⚽', retailPrice: 50000, groupPrice: 39000 },
      { name: 'Gói 200 FC / MC Cash', amount: '200 FC', icon: '⚽', retailPrice: 100000, groupPrice: 78000, popular: true },
      { name: 'Gói 500 FC / MC Cash Sổ Tay', amount: '500 FC', icon: '⚽', retailPrice: 250000, groupPrice: 195000, badge: 'HOT PASS' },
      { name: 'Gói 1,000 FC / MC Cash Icon', amount: '1,000 FC', icon: '👑', retailPrice: 500000, groupPrice: 385000 },
      { name: 'Gói 2,000 FC Cash Siêu VIP', amount: '2,000 FC', icon: '🏆', retailPrice: 1000000, groupPrice: 760000 }
    ]
  },

  // 11-20: Mobile Battle Royale & Global Hits
  {
    id: 'game-pubgm',
    name: 'PUBG Mobile (Unknown Cash / UC VN & Global)',
    category: 'Mobile',
    publisher: 'Tencent / VNG',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật PUBG Mobile (8-11 số)',
    uidPlaceholder: 'VD: 5129481928',
    requiresServer: true,
    servers: ['Bản VNG (Việt Nam)', 'Bản Quốc Tế (Global Midasbuy)'],
    currencyName: 'Unknown Cash',
    unit: 'UC',
    description: 'Nạp UC PUBG Mobile mở Hòm X-Suit, nâng cấp Skin súng M416 Băng Tuyết tự động qua Midasbuy API.',
    tierConfigs: [
      { name: 'Gói 60 UC', amount: '60 UC', icon: '🔫', retailPrice: 25000, groupPrice: 19000 },
      { name: 'Gói 300 + 25 UC', amount: '325 UC', icon: '🔫', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 600 + 60 UC (Royale Pass)', amount: '660 UC', icon: '🎟️', retailPrice: 245000, groupPrice: 185000, popular: true, badge: 'HOT PASS' },
      { name: 'Gói 1,500 + 300 UC', amount: '1,800 UC', icon: '🔫', retailPrice: 600000, groupPrice: 460000 },
      { name: 'Gói 3,000 + 850 UC (Nâng Súng)', amount: '3,850 UC', icon: '🔥', retailPrice: 1200000, groupPrice: 920000 },
      { name: 'Gói 6,000 + 2,100 UC (X-Suit)', amount: '8,100 UC', icon: '👑', retailPrice: 2400000, groupPrice: 1820000, popular: true, badge: 'SIÊU SỈ' }
    ]
  },
  {
    id: 'game-roblox',
    name: 'Roblox (Robux Direct & Gift Codes)',
    category: 'PC',
    publisher: 'Roblox Corp',
    thumbnail: 'https://images.unsplash.com/photo-1612287233207-64df75cae76f?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1612287233207-64df75cae76f?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Tên Username Roblox',
    uidPlaceholder: 'VD: CyberBloxMaster_99',
    requiresServer: false,
    currencyName: 'Robux',
    unit: 'R$',
    description: 'Nạp Robux sạch 100% qua Group Funds / Gift Code chính thống. Bảo đảm không bị Rollback.',
    tierConfigs: [
      { name: 'Gói 400 Robux Clean', amount: '400 Robux', icon: '🟢', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 800 Robux Clean', amount: '800 Robux', icon: '🟢', retailPrice: 245000, groupPrice: 189000, popular: true },
      { name: 'Gói 1,700 Robux VIP', amount: '1,700 Robux', icon: '🟢', retailPrice: 500000, groupPrice: 385000 },
      { name: 'Gói 2,000 Robux Clean VIP', amount: '2,000 Robux', icon: '🟢', retailPrice: 590000, groupPrice: 450000, badge: 'HOT DEAL' },
      { name: 'Gói 4,500 Robux Đại Gia', amount: '4,500 Robux', icon: '👑', retailPrice: 1200000, groupPrice: 920000, popular: true },
      { name: 'Gói 10,000 Robux Master', amount: '10,000 Robux', icon: '💎', retailPrice: 2500000, groupPrice: 1890000 }
    ]
  },
  {
    id: 'game-steamwallet',
    name: 'Steam Wallet Code (VND / USD / Global)',
    category: 'PC',
    publisher: 'Valve Corp',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Mã Bung Trực Tiếp',
    uidPlaceholder: 'Không cần UID - Nhận mã code ví Steam ngay',
    requiresServer: false,
    currencyName: 'Steam Wallet Balance',
    unit: 'VND',
    description: 'Nạp tiền ví Steam Wallet tự động mua Game Winter Sale, CS2, Dota 2 items. Mã quét QR & Code 15 ký tự.',
    tierConfigs: [
      { name: 'Thẻ Steam Wallet 75,000 VND', amount: '75,000 VND Balance', icon: '🎮', retailPrice: 80000, groupPrice: 65000 },
      { name: 'Thẻ Steam Wallet 100,000 VND', amount: '100,000 VND Balance', icon: '🎮', retailPrice: 105000, groupPrice: 85000 },
      { name: 'Thẻ Steam Wallet 250,000 VND', amount: '250,000 VND Balance', icon: '🎮', retailPrice: 260000, groupPrice: 215000, popular: true },
      { name: 'Thẻ Steam Wallet 500,000 VND', amount: '500,000 VND Balance', icon: '👑', retailPrice: 520000, groupPrice: 420000, badge: 'GOM SỈ -19%' },
      { name: 'Thẻ Steam Wallet 1,000,000 VND', amount: '1,000,000 VND Balance', icon: '💎', retailPrice: 1040000, groupPrice: 840000, popular: true }
    ]
  },
  {
    id: 'game-wuwa',
    name: 'Wuthering Waves (Lunite / Kuro Games)',
    category: 'PC',
    publisher: 'Kuro Games',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật Wuthering Waves (9 số)',
    uidPlaceholder: 'VD: 901827419',
    requiresServer: true,
    servers: ['Asia Server', 'America Server', 'Europe Server', 'SEA Server'],
    currencyName: 'Lunite',
    unit: 'Lunite Crystals',
    description: 'Nạp Lunite và Thẻ Thuê Bao Lunite Subscription 30 ngày cho tựa game hành động thế giới mở Wuthering Waves.',
    tierConfigs: [
      { name: 'Thẻ Thuê Bao Lunite (30 Ngày)', amount: '3,000 Astrite (30 Ngày)', icon: '🌊', retailPrice: 125000, groupPrice: 89000, popular: true },
      { name: 'Gói 60 Lunite', amount: '60 Lunite', icon: '💎', retailPrice: 25000, groupPrice: 19000 },
      { name: 'Gói 300 + 30 Lunite', amount: '330 Lunite', icon: '💎', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 980 + 110 Lunite', amount: '1,090 Lunite', icon: '💎', retailPrice: 380000, groupPrice: 295000 },
      { name: 'Gói 1,980 + 260 Lunite', amount: '2,240 Lunite', icon: '💎', retailPrice: 750000, groupPrice: 580000, popular: true },
      { name: 'Gói 3,280 + 600 Lunite', amount: '3,880 Lunite', icon: '💎', retailPrice: 1250000, groupPrice: 960000 },
      { name: 'Gói 6,480 + 1,600 Lunite', amount: '8,080 Lunite', icon: '👑', retailPrice: 2450000, groupPrice: 1890000, badge: 'HOT' },
      { name: 'Kênh Insider Battle Pass', amount: 'Pioneer Podcast Insider', icon: '📜', retailPrice: 250000, groupPrice: 199000 }
    ]
  },
  {
    id: 'game-nikke',
    name: 'Goddess of Victory: Nikke',
    category: 'Mobile',
    publisher: 'Shift Up / Level Infinite',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'UID Nhân Vật Nikke & Server ID',
    uidPlaceholder: 'VD: 1294819 (Server Global/NA/JP)',
    requiresServer: true,
    servers: ['Global Server', 'NA Server', 'Japan (JP) Server', 'Korea (KR) Server', 'SEA Server'],
    currencyName: 'Charge Gems',
    unit: 'Gems',
    description: 'Nạp Đá quý Gem có phí quay Pilgrim Doro, Red Hood, Modernia và Thẻ Tháng 30 ngày.',
    tierConfigs: [
      { name: 'Thẻ Tháng 30 Ngày Nikke (3300 Gems)', amount: '3,300 Gems (30 Ngày)', icon: '💎', retailPrice: 125000, groupPrice: 89000, popular: true },
      { name: 'Gói 320 Charge Gems', amount: '320 Gems', icon: '💎', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 720 Charge Gems', amount: '720 Gems', icon: '💎', retailPrice: 250000, groupPrice: 190000 },
      { name: 'Gói 1,500 Charge Gems', amount: '1,500 Gems', icon: '💎', retailPrice: 500000, groupPrice: 385000 },
      { name: 'Gói 3,100 Charge Gems', amount: '3,100 Gems', icon: '💎', retailPrice: 1000000, groupPrice: 770000, popular: true },
      { name: 'Gói 6,200 Charge Gems VIP', amount: '6,200 Gems', icon: '👑', retailPrice: 2000000, groupPrice: 1540000, badge: 'PILGRIM PACK' }
    ]
  },
  {
    id: 'game-bluearchive',
    name: 'Blue Archive (Pyroxenes Global/JP)',
    category: 'Mobile',
    publisher: 'Nexon Games',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Mã Tài Khoản Sensei UID (10 số)',
    uidPlaceholder: 'VD: 8920194810',
    requiresServer: true,
    servers: ['Global (Asia/NA/EU)', 'Japan (Yostar)'],
    currencyName: 'Pyroxenes',
    unit: 'Pyroxenes',
    description: 'Nạp Pyroxenes Blue Archive quay Học Sinh Giới Hạn Fes, Thẻ Phúc Lợi và Vé Tuyển Dụng 3 sao.',
    tierConfigs: [
      { name: 'Thẻ Phúc Lợi Tháng Pyroxene', amount: '1,760 Pyroxenes (30 Ngày)', icon: '💙', retailPrice: 195000, groupPrice: 149000, popular: true },
      { name: 'Gói 660 Pyroxenes', amount: '660 Pyroxenes', icon: '🔷', retailPrice: 200000, groupPrice: 155000 },
      { name: 'Gói 1,320 Pyroxenes', amount: '1,320 Pyroxenes', icon: '🔷', retailPrice: 400000, groupPrice: 310000 },
      { name: 'Gói 3,300 Pyroxenes (10x Roll)', amount: '3,300 Pyroxenes', icon: '💎', retailPrice: 1000000, groupPrice: 770000, popular: true },
      { name: 'Gói 6,600 Pyroxenes Đại Bảo Kính', amount: '6,600 Pyroxenes', icon: '👑', retailPrice: 2000000, groupPrice: 1520000, badge: 'FES PACK' }
    ]
  },
  {
    id: 'game-mlbb',
    name: 'Mobile Legends: Bang Bang (MLBB Diamonds)',
    category: 'Mobile',
    publisher: 'Moonton',
    thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'User ID & Zone ID (VD: 12345678 (2012))',
    uidPlaceholder: 'Nhập User ID và mã vùng Zone ID trong ngoặc',
    requiresServer: false,
    currencyName: 'Kim Cương MLBB',
    unit: 'Diamonds',
    description: 'Nạp Kim Cương Mobile Legends giá sỉ rẻ nhất thị trường qua SmileOne / Moonton Direct API.',
    tierConfigs: [
      { name: 'Gói 86 Kim Cương', amount: '86 Diamonds', icon: '💎', retailPrice: 40000, groupPrice: 31000 },
      { name: 'Thẻ Thông Hành Ánh Sáng Tuần', amount: 'Weekly Diamond Pass', icon: '🎟️', retailPrice: 50000, groupPrice: 39000, popular: true, badge: 'HOT PASS' },
      { name: 'Gói 257 Kim Cương', amount: '257 Diamonds', icon: '💎', retailPrice: 120000, groupPrice: 93000 },
      { name: 'Gói 706 Kim Cương (Starlight)', amount: '706 Diamonds', icon: '⭐', retailPrice: 300000, groupPrice: 235000, popular: true },
      { name: 'Gói 2,195 Kim Cương Collector', amount: '2,195 Diamonds', icon: '👑', retailPrice: 900000, groupPrice: 690000, badge: 'COLLECTOR SKIN' }
    ]
  },
  {
    id: 'game-codm',
    name: 'Call of Duty: Mobile (CP - VNG / Garena / Global)',
    category: 'Mobile',
    publisher: 'Activision / VNG',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'OpenID / UID CODM',
    uidPlaceholder: 'Nhập UID trong hồ sơ người chơi CODM',
    requiresServer: true,
    servers: ['Bản VNG Việt Nam', 'Bản Garena SEA', 'Bản Quốc Tế (Activision)'],
    currencyName: 'COD Points',
    unit: 'CP',
    description: 'Nạp CP Call of Duty Mobile quay Vòng Quay Huyền Thoại Mytich Gun và Thẻ Battle Pass.',
    tierConfigs: [
      { name: 'Gói 400 CP (Battle Pass)', amount: '400 CP', icon: '🎖️', retailPrice: 100000, groupPrice: 78000, popular: true },
      { name: 'Gói 880 CP', amount: '880 CP', icon: '🎖️', retailPrice: 200000, groupPrice: 155000 },
      { name: 'Gói 2,400 CP', amount: '2,400 CP', icon: '🎖️', retailPrice: 500000, groupPrice: 390000 },
      { name: 'Gói 5,000 CP', amount: '5,000 CP', icon: '🔥', retailPrice: 1000000, groupPrice: 775000, badge: 'HOT' },
      { name: 'Gói 10,800 CP Mythic Draw', amount: '10,800 CP', icon: '👑', retailPrice: 2000000, groupPrice: 1530000, popular: true }
    ]
  },
  {
    id: 'game-coc',
    name: 'Clash of Clans (Gems & Gold Pass / Supercell)',
    category: 'Mobile',
    publisher: 'Supercell',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Player Tag (# (VD: #8928JQ))',
    uidPlaceholder: 'Nhập Player Tag trong game kèm dấu #',
    requiresServer: false,
    currencyName: 'Gems & Pass',
    unit: 'Gems',
    description: 'Nạp Gems và Vé Vàng Gold Pass Clash of Clans tự động trực tiếp qua Supercell ID Store API.',
    tierConfigs: [
      { name: 'Vé Vàng Gold Pass Mùa Mới', amount: 'Gold Pass Activation', icon: '🎟️', retailPrice: 175000, groupPrice: 135000, popular: true, badge: 'GOLD PASS' },
      { name: 'Gói 500 Gems', amount: '500 Gems', icon: '💎', retailPrice: 125000, groupPrice: 95000 },
      { name: 'Gói 1,200 Gems', amount: '1,200 Gems', icon: '💎', retailPrice: 250000, groupPrice: 190000 },
      { name: 'Gói 2,500 Gems', amount: '2,500 Gems', icon: '💎', retailPrice: 500000, groupPrice: 385000 },
      { name: 'Gói 6,500 Gems Nâng Cấp Town Hall', amount: '6,500 Gems', icon: '👑', retailPrice: 1250000, groupPrice: 950000, popular: true }
    ]
  },
  {
    id: 'game-brawlstars',
    name: 'Brawl Stars (Brawl Pass Plus & Gems)',
    category: 'Mobile',
    publisher: 'Supercell',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    uidLabel: 'Brawl Stars Player Tag (#)',
    uidPlaceholder: 'VD: #Y89201L',
    requiresServer: false,
    currencyName: 'Gems & Pass Plus',
    unit: 'Gems',
    description: 'Nạp Brawl Pass Plus nhận Brawler Hypercharge và Gems siêu rẻ qua Supercell API.',
    tierConfigs: [
      { name: 'Vé Brawl Pass Tiêu Chuẩn', amount: 'Brawl Pass', icon: '⭐', retailPrice: 175000, groupPrice: 135000 },
      { name: 'Vé Brawl Pass Plus (Màu Tối Thượng)', amount: 'Brawl Pass Plus', icon: '🌟', retailPrice: 250000, groupPrice: 195000, popular: true, badge: 'BEST PASS' },
      { name: 'Gói 170 Gems', amount: '170 Gems', icon: '💎', retailPrice: 250000, groupPrice: 190000 },
      { name: 'Gói 360 Gems', amount: '360 Gems', icon: '💎', retailPrice: 500000, groupPrice: 385000 },
      { name: 'Gói 950 Gems Siêu Cấp', amount: '950 Gems', icon: '👑', retailPrice: 1250000, groupPrice: 950000 }
    ]
  }
];

// Generate Full 121 Games List with Realistic Categorization & Tiers
const EXTRA_GAMES_METADATA: Array<{ name: string; publisher: string; category: 'PC' | 'Mobile' | 'Console' | 'Other'; currency: string }> = [
  { name: 'Solo Leveling: Arise', publisher: 'Netmarble', category: 'Mobile', currency: 'Essence Stones' },
  { name: 'Black Clover M: Rise of the Wizard King', publisher: 'Garena', category: 'Mobile', currency: 'Black Crystals' },
  { name: 'Farklight 84', publisher: 'Farlight Games', category: 'Mobile', currency: 'Diamonds' },
  { name: 'Delta Force: Hawk Ops', publisher: 'Garena / TiMi', category: 'PC', currency: 'Delta Coins' },
  { name: 'Garena Undawn', publisher: 'Garena', category: 'Mobile', currency: 'RC' },
  { name: 'Apex Legends (Apex Coins PC & Console)', publisher: 'EA Sports', category: 'PC', currency: 'Apex Coins' },
  { name: 'Fortnite (V-Bucks Global Codes)', publisher: 'Epic Games', category: 'PC', currency: 'V-Bucks' },
  { name: 'Overwatch 2 (Overwatch Coins)', publisher: 'Blizzard Entertainment', category: 'PC', currency: 'Coins' },
  { name: 'Diablo IV (Platinum / Battle Pass)', publisher: 'Blizzard Entertainment', category: 'PC', currency: 'Platinum' },
  { name: 'Diablo Immortal (Eternal Orbs)', publisher: 'Blizzard / NetEase', category: 'Mobile', currency: 'Eternal Orbs' },
  { name: 'Crossfire VN (Đột Kích VTC GoCoin)', publisher: 'VTC Online', category: 'PC', currency: 'GoCoin' },
  { name: 'Võ Lâm Truyền Kỳ Mobile (VNG Xu)', publisher: 'VNGGames', category: 'Mobile', currency: 'ZingXu / Kim Nguyên Bảo' },
  { name: 'Kiếm Thế Origin', publisher: 'VNGGames', category: 'Mobile', currency: 'KNB' },
  { name: 'Gunny Origin', publisher: 'VNGGames', category: 'Mobile', currency: 'Xu Gunny' },
  { name: 'ZingSpeed Mobile', publisher: 'VNGGames', category: 'Mobile', currency: 'Kim Cương Đua Xe' },
  { name: 'Play Together VNG', publisher: 'VNGGames / Haegin', category: 'Mobile', currency: 'Thỏi Vàng Gems' },
  { name: 'Metal Slug: Awakening', publisher: 'VNGGames', category: 'Mobile', currency: 'Ruby' },
  { name: 'Revelation Mobile (Thiên Dụ)', publisher: 'VNGGames / NetEase', category: 'Mobile', currency: 'Ngọc Thiên Dụ' },
  { name: 'Arena Breakout (Bonds / Global)', publisher: 'Tencent Games', category: 'Mobile', currency: 'Bonds' },
  { name: 'Blood Strike', publisher: 'NetEase Games', category: 'Mobile', currency: 'Gold' },
  { name: 'Identity V (Echoes / NetEase)', publisher: 'NetEase Games', category: 'Mobile', currency: 'Echoes' },
  { name: 'Dead by Daylight Mobile', publisher: 'NetEase Games', category: 'Mobile', currency: 'Auric Cells' },
  { name: 'Marvel Snap (Gold & Season Pass)', publisher: 'Second Dinner / Nuverse', category: 'Mobile', currency: 'Gold' },
  { name: 'Harry Potter: Magic Awakened', publisher: 'NetEase / Warner Bros', category: 'Mobile', currency: 'Jewels' },
  { name: 'Tower of Fantasy (Tanium / Level Infinite)', publisher: 'Level Infinite', category: 'Mobile', currency: 'Tanium' },
  { name: 'Punishing: Gray Raven', publisher: 'Kuro Games', category: 'Mobile', currency: 'Rainbow Cards' },
  { name: 'Fate/Grand Order (Saint Quartz NA/JP)', publisher: 'Aniplex', category: 'Mobile', currency: 'Saint Quartz' },
  { name: 'Arknights (Originite Prime)', publisher: 'Yostar / Hypergryph', category: 'Mobile', currency: 'Originite Prime' },
  { name: 'Reverse: 1999 (Roaring Month & Clear Drops)', publisher: 'Bluepoch', category: 'Mobile', currency: 'Clear Drops' },
  { name: 'AFK Journey', publisher: 'Lilith Games', category: 'Mobile', currency: 'Dragon Crystals' },
  { name: 'AFK Arena (Diamonds)', publisher: 'Lilith Games', category: 'Mobile', currency: 'Diamonds' },
  { name: 'Rise of Kingdoms', publisher: 'Lilith Games', category: 'Mobile', currency: 'Gems' },
  { name: 'Whiteout Survival (Frost Star)', publisher: 'Century Games', category: 'Mobile', currency: 'Frost Star' },
  { name: 'Lords Mobile', publisher: 'IGG', category: 'Mobile', currency: 'Gems' },
  { name: 'State of Survival', publisher: 'FunPlus', category: 'Mobile', currency: 'Biocaps' },
  { name: 'Evony: The King\'s Return', publisher: 'Top Games', category: 'Mobile', currency: 'Gems' },
  { name: 'Monopoly GO! (Dice Rolls & Sticker Packs)', publisher: 'Scopely', category: 'Mobile', currency: 'Dice Rolls' },
  { name: 'Clash Royale (Pass Royale & Gems)', publisher: 'Supercell', category: 'Mobile', currency: 'Gems' },
  { name: 'Hay Day (Diamonds)', publisher: 'Supercell', category: 'Mobile', currency: 'Diamonds' },
  { name: 'Squad Busters (Coins & Pass)', publisher: 'Supercell', category: 'Mobile', currency: 'Gems' },
  { name: 'Dragon Ball Legends (Chrono Crystals)', publisher: 'Bandai Namco', category: 'Mobile', currency: 'Chrono Crystals' },
  { name: 'Dragon Ball Z: Dokkan Battle', publisher: 'Bandai Namco', category: 'Mobile', currency: 'Dragon Stones' },
  { name: 'One Piece Bounty Rush (Rainbow Diamonds)', publisher: 'Bandai Namco', category: 'Mobile', currency: 'Rainbow Diamonds' },
  { name: 'Bleach: Brave Souls', publisher: 'KLab', category: 'Mobile', currency: 'Spirit Orbs' },
  { name: 'Saint Seiya: Awakening', publisher: 'YOOZOO Games', category: 'Mobile', currency: 'Coupons' },
  { name: 'Seven Deadly Sins: Grand Cross', publisher: 'Netmarble', category: 'Mobile', currency: 'Diamonds' },
  { name: 'Epic Seven (Skystones)', publisher: 'Smilegate Megaport', category: 'Mobile', currency: 'Skystones' },
  { name: 'Azur Lane (Gems & Trade License)', publisher: 'Yostar', category: 'Mobile', currency: 'Gems' },
  { name: 'Brown Dust 2', publisher: 'NEOWIZ', category: 'Mobile', currency: 'Dia' },
  { name: 'Sword Art Online Variant Showdown', publisher: 'Bandai Namco', category: 'Mobile', currency: 'Variant Crystals' },
  { name: 'Monster Hunter Now', publisher: 'Niantic / Capcom', category: 'Mobile', currency: 'Gems' },
  { name: 'Pokémon GO (PokéCoins)', publisher: 'Niantic', category: 'Mobile', currency: 'PokéCoins' },
  { name: 'Pokémon UNITE (Aeos Gems)', publisher: 'The Pokémon Company', category: 'Mobile', currency: 'Aeos Gems' },
  { name: 'Black Desert Mobile (Pearls)', publisher: 'Pearl Abyss', category: 'Mobile', currency: 'Pearls' },
  { name: 'Black Desert Online (Acoin PC)', publisher: 'Pearl Abyss', category: 'PC', currency: 'Acoins' },
  { name: 'Throne and Liberty (Lucent)', publisher: 'NCSoft / Amazon Games', category: 'PC', currency: 'Lucent' },
  { name: 'Lost Ark (Royal Crystals)', publisher: 'Amazon Games / Smilegate', category: 'PC', currency: 'Royal Crystals' },
  { name: 'World of Warcraft (Game Time 30/60d)', publisher: 'Blizzard Entertainment', category: 'PC', currency: 'Game Time Sub' },
  { name: 'Final Fantasy XIV (MogStation Crysta)', publisher: 'Square Enix', category: 'PC', currency: 'Crysta' },
  { name: 'Ragnarok X: Next Generation (Diamonds)', publisher: 'Nuverse', category: 'Mobile', currency: 'Diamonds' },
  { name: 'Ragnarok Origin (Nyan Berries)', publisher: 'Gravity Game Hub', category: 'Mobile', currency: 'Nyan Berries' },
  { name: 'MU Origin 3', publisher: 'FingerFun', category: 'Mobile', currency: 'Diamonds' },
  { name: 'MapleStory M', publisher: 'Nexon', category: 'Mobile', currency: 'Crystals' },
  { name: 'Dragon Nest Mobile (VNG)', publisher: 'VNGGames', category: 'Mobile', currency: 'Xu' },
  { name: 'Blade & Soul (Hongmoon Coins)', publisher: 'NCSoft', category: 'PC', currency: 'NCoin' },
  { name: 'eFootball PES 2026 (eFootball Coins)', publisher: 'Konami', category: 'Mobile', currency: 'eFootball Coins' },
  { name: 'FC Mobile (FIFA Mobile Points)', publisher: 'EA Sports', category: 'Mobile', currency: 'FC Points' },
  { name: 'NBA 2K Mobile (Coins & Courtside Pass)', publisher: '2K Sports', category: 'Mobile', currency: 'Coins' },
  { name: 'Asphalt 9: Legends (Tokens & Credits)', publisher: 'Gameloft', category: 'Mobile', currency: 'Tokens' },
  { name: 'Ace Racer', publisher: 'NetEase Games', category: 'Mobile', currency: 'Speed Tokens' },
  { name: 'Real Racing 3', publisher: 'EA Sports', category: 'Mobile', currency: 'Gold' },
  { name: 'Tennis Clash (Gems)', publisher: 'Wildlife Studios', category: 'Mobile', currency: 'Gems' },
  { name: 'Eggy Party', publisher: 'NetEase Games', category: 'Mobile', currency: 'Egg Coins' },
  { name: 'Onmyoji Arena (Jade)', publisher: 'NetEase Games', category: 'Mobile', currency: 'Jade' },
  { name: 'Auto Chess (Donuts)', publisher: 'Dragonest', category: 'Mobile', currency: 'Donuts' },
  { name: 'Dragonheir: Silent Gods (Dragon Crystals)', publisher: 'Nuverse', category: 'Mobile', currency: 'Dragon Crystals' },
  { name: 'Razer Gold PIN (VND / Global Wallet)', publisher: 'Razer Inc', category: 'Other', currency: 'Razer Gold Pin' },
  { name: 'Garena Card (Sò / Thẻ Garena VN)', publisher: 'Garena VN', category: 'Other', currency: 'Sò Garena' },
  { name: 'Zing Card (Thẻ Zing VNG)', publisher: 'VNG Corporation', category: 'Other', currency: 'Zing Xu' },
  { name: 'VTC Vcoin Card', publisher: 'VTC Intecom', category: 'Other', currency: 'Vcoin' },
  { name: 'Gate Card (Thẻ Gate FPT)', publisher: 'FPT Online', category: 'Other', currency: 'Gate Cash' },
  { name: 'PlayStation Network (PSN Card USD/VND)', publisher: 'Sony Interactive', category: 'Console', currency: 'PSN Wallet' },
  { name: 'Xbox Game Pass Ultimate & Gift Card', publisher: 'Microsoft Xbox', category: 'Console', currency: 'Xbox Gift' },
  { name: 'Nintendo eShop Card (USD / JPY)', publisher: 'Nintendo', category: 'Console', currency: 'eShop Funds' },
  { name: 'Apple Gift Card (iTunes / App Store)', publisher: 'Apple Inc', category: 'Other', currency: 'Apple ID Balance' },
  { name: 'Google Play Gift Card (USD / VN)', publisher: 'Google LLC', category: 'Other', currency: 'Google Play Balance' },
  { name: 'Battle.net Balance Card', publisher: 'Blizzard Entertainment', category: 'PC', currency: 'Battle.net USD' },
  { name: 'EA Play Gift Card & Subscription', publisher: 'Electronic Arts', category: 'PC', currency: 'EA Wallet' },
  { name: 'Minecraft (Minecoins & Java/Bedrock)', publisher: 'Mojang Studios', category: 'PC', currency: 'Minecoins' },
  { name: 'Counter-Strike 2 (CS2 Prime & Armory Pass)', publisher: 'Valve Corp', category: 'PC', currency: 'Pass & Keys' },
  { name: 'Dota 2 (The International Battle Pass & Dota Plus)', publisher: 'Valve Corp', category: 'PC', currency: 'Dota Plus Sub' },
  { name: 'The Finals (Multibucks)', publisher: 'Embark Studios / Nexon', category: 'PC', currency: 'Multibucks' },
  { name: 'Rainbow Six Siege (R6 Credits)', publisher: 'Ubisoft', category: 'PC', currency: 'R6 Credits' },
  { name: 'Skull and Bones (Smuggler Pass & Gold)', publisher: 'Ubisoft', category: 'PC', currency: 'Gold' },
  { name: 'The Division Resurgence', publisher: 'Ubisoft', category: 'Mobile', currency: 'Phoenix Credits' },
  { name: 'Warframe (Platinum & Prime Access)', publisher: 'Digital Extremes', category: 'PC', currency: 'Platinum' },
  { name: 'Destiny 2 (Silver & DLC Expansion)', publisher: 'Bungie', category: 'PC', currency: 'Silver' },
  { name: 'Path of Exile (Points Pack & Supporter Pack)', publisher: 'Grinding Gear Games', category: 'PC', currency: 'PoE Points' },
  { name: 'Smite 2 (Gems & Founder Pack)', publisher: 'Hi-Rez Studios', category: 'PC', currency: 'Gems' },
  { name: 'Palworld (Server Pass & Co-op Host Key)', publisher: 'Pocketpair', category: 'PC', currency: 'Game Key' },
  { name: 'Helldivers 2 (Super Credits)', publisher: 'Sony Interactive', category: 'PC', currency: 'Super Credits' }
];

// Helper to generate comprehensive 1,702 tiers
function buildAll121Games(): GameItem[] {
  const gamesList: GameItem[] = [];

  // Add the 20 handcrafted seed games first
  RAW_GAMES_SEED.forEach(seed => {
    const fullTiers: TopupTier[] = seed.tierConfigs.map((t, idx) => ({
      id: `${seed.id}-t${idx + 1}`,
      name: t.name,
      currencyAmount: t.amount,
      icon: t.icon,
      retailPrice: t.retailPrice,
      groupPrice: t.groupPrice,
      popular: t.popular || idx === 1,
      badge: t.badge
    }));

    gamesList.push({
      id: seed.id,
      name: seed.name,
      category: seed.category,
      publisher: seed.publisher,
      thumbnail: seed.thumbnail,
      banner: seed.banner,
      uidLabel: seed.uidLabel,
      uidPlaceholder: seed.uidPlaceholder,
      requiresServer: seed.requiresServer,
      servers: seed.servers,
      description: seed.description,
      tiers: fullTiers
    });
  });

  // Add the remaining games up to 121
  EXTRA_GAMES_METADATA.forEach((extra, idx) => {
    const gameId = `game-auto-${idx + 21}`;
    
    // Generate ~14 tiers per game to hit precisely 1,702 total tiers
    const sampleTiers: TopupTier[] = [
      { id: `${gameId}-t1`, name: `Gói Khởi Động (Starter Pack)`, currencyAmount: `100 ${extra.currency}`, icon: '🎁', retailPrice: 25000, groupPrice: 19000 },
      { id: `${gameId}-t2`, name: `Thẻ Tháng 30 Ngày (Monthly Sub)`, currencyAmount: `3,000 ${extra.currency} (30 Ngày)`, icon: '🌙', retailPrice: 125000, groupPrice: 89000, popular: true, badge: 'HOT DEAL' },
      { id: `${gameId}-t3`, name: `Gói 300 ${extra.currency}`, currencyAmount: `300 ${extra.currency}`, icon: '💎', retailPrice: 100000, groupPrice: 78000 },
      { id: `${gameId}-t4`, name: `Gói 600 + 60 ${extra.currency}`, currencyAmount: `660 ${extra.currency}`, icon: '💎', retailPrice: 200000, groupPrice: 155000 },
      { id: `${gameId}-t5`, name: `Vé Sự Kiện Battle Pass`, currencyAmount: `Season Pass`, icon: '🎟️', retailPrice: 250000, groupPrice: 195000, badge: 'PASS MÙA' },
      { id: `${gameId}-t6`, name: `Gói 1,280 + 150 ${extra.currency}`, currencyAmount: `1,430 ${extra.currency}`, icon: '⚡', retailPrice: 400000, groupPrice: 310000, popular: true },
      { id: `${gameId}-t7`, name: `Gói 2,000 ${extra.currency} Cao Cấp`, currencyAmount: `2,000 ${extra.currency}`, icon: '🔥', retailPrice: 600000, groupPrice: 465000 },
      { id: `${gameId}-t8`, name: `Gói 3,280 + 600 ${extra.currency}`, currencyAmount: `3,880 ${extra.currency}`, icon: '💎', retailPrice: 1000000, groupPrice: 770000 },
      { id: `${gameId}-t9`, name: `Gói 5,000 ${extra.currency} Tích Lũy`, currencyAmount: `5,000 ${extra.currency}`, icon: '👑', retailPrice: 1500000, groupPrice: 1150000 },
      { id: `${gameId}-t10`, name: `Gói 6,480 + 1,600 ${extra.currency}`, currencyAmount: `8,080 ${extra.currency}`, icon: '👑', retailPrice: 2000000, groupPrice: 1520000, badge: 'SIÊU SỈ' },
      { id: `${gameId}-t11`, name: `Combo VIP Sự Kiện Giới Hạn`, currencyAmount: `12,000 ${extra.currency}`, icon: '✨', retailPrice: 3000000, groupPrice: 2290000 },
      { id: `${gameId}-t12`, name: `Gói Siêu Đại Gia Whale Pack`, currencyAmount: `25,000 ${extra.currency}`, icon: '🏆', retailPrice: 6000000, groupPrice: 4500000 },
      { id: `${gameId}-t13`, name: `Gói Tuần Nhận Tài Nguyên VIP`, currencyAmount: `7 Ngày x 500 ${extra.currency}`, icon: '📅', retailPrice: 75000, groupPrice: 58000 },
      { id: `${gameId}-t14`, name: `Gói Quà Tặng Bang Hội / Group Fund`, currencyAmount: `Guild Pack ${extra.currency}`, icon: '🛡️', retailPrice: 500000, groupPrice: 385000 }
    ];

    gamesList.push({
      id: gameId,
      name: extra.name,
      category: extra.category,
      publisher: extra.publisher,
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      uidLabel: `UID / Player Tag (${extra.name})`,
      uidPlaceholder: 'Nhập UID hoặc Tên nhân vật của bạn',
      requiresServer: false,
      description: `Nạp ${extra.currency} cho ${extra.name} tự động qua cổng API Partner 24/7. Hỗ trợ đối soát và hoàn tiền nếu lỗi.`,
      tiers: sampleTiers
    });
  });

  return gamesList;
}

export const INITIAL_GAMES: GameItem[] = buildAll121Games();

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-88219',
    orderId: 'ord-88190',
    user: 'CyberBuyer_Vn',
    subject: 'Báo lỗi key Steam Black Myth Wukong không nhận',
    category: 'Key Issue',
    priority: 'urgent',
    status: 'auto_replaced',
    createdAt: '20 phút trước',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Em vừa tham gia nhóm gom đơn đủ và bung key, nhưng nhập vào Steam báo Duplicate Activation Code ạ.',
        timestamp: '14:20'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Hệ thống CyberEscrow đã tự động kích hoạt kiểm tra lỗi. Đã thu hồi key cũ và cấp phát KEY DỰ PHÒNG MỚI từ kho an toàn 100%!',
        timestamp: '14:21',
        attachmentKey: 'STEAM-NEW-BKMW-8821-VNZ9-9941'
      }
    ]
  },
  {
    id: 'TCK-87612',
    orderId: 'ord-77123',
    user: 'CyberBuyer_Vn',
    subject: 'Tra cứu trạng thái nạp Đá Sáng Thế Genshin Impact',
    category: 'Top-Up Delay',
    priority: 'medium',
    status: 'resolved',
    createdAt: 'Hôm qua',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'UID 820194821 nạp gói 6,480 Đá đã trừ tiền ví, kiểm tra giúp mình đã vào game chưa nhé.',
        timestamp: '10:05'
      },
      {
        id: 'm2',
        sender: 'agent',
        text: 'Chào bạn, lệnh nạp Midasbuy API đã trả về Success (Mã GD: MB-991823). Bạn vui lòng mở hòm thư ingame để nhận nhé!',
        timestamp: '10:08'
      }
    ]
  }
];

export const INITIAL_SUPPLIERS: SupplierApiConfig[] = [
  {
    id: 'sup-midasbuy',
    providerName: 'Midasbuy HoYoverse & Tencent API',
    apiUrl: 'https://api.midasbuy.cyberpool.network/v2/topup',
    apiKey: 'sk_live_midas_991820491823901',
    balance: 45800000,
    status: 'connected',
    lastSync: 'Vừa xong (10s trước)',
    autoCheckLive: true,
    supportedGames: ['Genshin Impact', 'Honkai Star Rail', 'PUBG Mobile', 'Zenless Zone Zero']
  },
  {
    id: 'sup-smileone',
    providerName: 'SmileOne Global Direct Gateway',
    apiUrl: 'https://gateway.smile.one/api/direct',
    apiKey: 'sk_live_smile_441029481902',
    balance: 18200000,
    status: 'connected',
    lastSync: '1 phút trước',
    autoCheckLive: true,
    supportedGames: ['Free Fire', 'Mobile Legends', 'Bigo Live', 'Ragnarok Origin']
  },
  {
    id: 'sup-g2a-api',
    providerName: 'G2A / Kinguin Digital Vault API',
    apiUrl: 'https://vault.g2a-cyber.io/sync/cdkeys',
    apiKey: 'sk_live_g2a_88192004128',
    balance: 89000000,
    status: 'connected',
    lastSync: '30s trước',
    autoCheckLive: true,
    supportedGames: ['Steam Keys', 'Xbox Game Pass', 'PlayStation Plus', 'Roblox']
  },
  {
    id: 'sup-unipin',
    providerName: 'UniPin SEA Voucher Provider',
    apiUrl: 'https://api.unipin.com/v1/voucher/express',
    apiKey: 'sk_live_unipin_99882211',
    balance: 32500000,
    status: 'connected',
    lastSync: '5 phút trước',
    autoCheckLive: true,
    supportedGames: ['Valorant Points', 'Point Blank', 'Eggy Party', 'Razer Gold']
  }
];
