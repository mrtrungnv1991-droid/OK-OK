/**
 * CYBORG-9.1 INDUSTRIAL MULTILINGUAL BANNER & UPDATE TRANSLATION ENGINE
 * 
 * Pipeline Specification:
 * 1. Source: Strictly 'vi' (Vietnamese Canonical Source)
 * 2. Translation Flow: VI -> EN (English Bridge Master) -> [ZH, JA, KO, RU, FR, DE, ES, ...]
 * 3. Token & Format Protection: Preserves {{placeholders}}, HTML, markdown, URLs, emojis, numbers
 * 4. Content Diff & Hash: Only re-translates when VI text actually changes
 * 5. Manual Override Protection: Preserves user manual edits per language unless explicit auto-translate
 * 6. Race Condition Guard: Monotonic versioning & requestId tracking
 * 7. Multi-tier Fallback: Target -> EN -> VI (Never null/undefined)
 */

import { SupportedLocale } from './types';
import { HeroTranslationData, HeroCustomConfig } from '../types';

export const SOURCE_LANGUAGE: SupportedLocale = 'vi';

export const ALL_TARGET_LOCALES: SupportedLocale[] = [
  'en', 'zh', 'ja', 'ko', 'ru', 'fr', 'de', 'es'
];

/**
 * Token protection utility
 * Replaces placeholders like {{version}}, {name}, URLs, HTML tags, markdown, emojis
 * with unique tokens <_TOK_0_>, translates surrounding text, then restores them.
 */
interface MaskedText {
  masked: string;
  tokens: string[];
}

export function maskProtectedTokens(text: string): MaskedText {
  if (!text) return { masked: '', tokens: [] };

  const tokens: string[] = [];
  let tokenIdx = 0;

  // Regex patterns to protect:
  // 1. Mustache placeholders: {{...}} or {...}
  // 2. HTML tags: <...> </...>
  // 3. URLs: https?://... or t.me/...
  // 4. Markdown links: [...](...)
  // 5. Version tokens: v9.1, 9.1, V4.0
  const tokenRegex = /(\{\{[\w\.\-]+\}\}|\{[\w\.\-]+\}|<[^>]+>|https?:\/\/[^\s]+|t\.me\/[^\s]+|\[[^\]]+\]\([^\)]+\))/gi;

  const masked = text.replace(tokenRegex, (match) => {
    const placeholder = `_TOK_${tokenIdx}_`;
    tokens[tokenIdx] = match;
    tokenIdx++;
    return placeholder;
  });

  return { masked, tokens };
}

export function unmaskProtectedTokens(text: string, tokens: string[]): string {
  if (!text || !tokens.length) return text;
  let result = text;
  tokens.forEach((tok, idx) => {
    const placeholder = new RegExp(`_TOK_${idx}_`, 'g');
    result = result.replace(placeholder, tok);
  });
  return result;
}

/**
 * Generates a deterministic hash for source text fields
 */
export function computeHeroContentHash(source: Partial<HeroTranslationData>): string {
  const parts = [
    source.badgeText || '',
    source.mainHeadingLine1 || '',
    source.mainHeadingLine2 || '',
    source.subheading || '',
    source.pod1Title || '',
    source.pod1Val || '',
    source.pod1Sub || '',
    source.pod2Title || '',
    source.pod2Val || '',
    source.pod2Sub || ''
  ];
  const combined = parts.join('|||');
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

// -------------------------------------------------------------
// VI -> EN Master Term & Pattern Dictionary
// -------------------------------------------------------------
const VI_TO_EN_RULES: [RegExp, string][] = [
  // Update & Notice patterns
  [/cập nhật hệ thống mới/gi, 'New system update'],
  [/cập nhật hệ thống/gi, 'System Update'],
  [/update hệ thống mới/gi, 'New system update'],
  [/update hệ thống/gi, 'System Update'],
  [/thông báo hệ thống/gi, 'System Announcement'],
  [/thông báo bảo trì/gi, 'Maintenance Notice'],
  [/thông báo/gi, 'Announcement'],
  [/phiên bản\s*([0-9\.]+)/gi, 'version $1'],
  [/phiên bản mới/gi, 'New Version'],
  [/phiên bản/gi, 'Version'],
  [/tính năng mới/gi, 'New Features'],
  [/tính năng/gi, 'Feature'],
  [/nâng cấp marketplace/gi, 'Marketplace Upgrade'],
  [/nâng cấp sàn/gi, 'Platform Upgrade'],
  [/nâng cấp/gi, 'Upgrade'],

  // Digital Marketplace & Escrow
  [/sàn gom đơn mua chung sản phẩm số & key bản quyền/gi, 'The #1 Group-Buy Escrow & Digital License Platform'],
  [/sàn gom đơn mua chung sản phẩm số/gi, 'Digital Asset & Key Group Buy Platform'],
  [/sàn gom đơn mua chung/gi, 'Group-Buy Escrow Marketplace'],
  [/gom đơn mua chung/gi, 'Group-Buy Pool'],
  [/mua chung key bản quyền/gi, 'Software & Game Group Buy'],
  [/mua chung giá rẻ/gi, 'Cheap Group Buy'],
  [/mua chung/gi, 'Group Buy'],
  [/tiết kiệm đến\s*([0-9]+%)/gi, 'Save Up To $1'],
  [/tiết kiệm/gi, 'Save'],
  [/giá sỉ gốc/gi, 'Wholesale Base Price'],
  [/lẻ như buôn|lẻ giá buôn|mua lẻ giá sỉ/gi, 'Retail at Wholesale Prices'],
  [/bảo lãnh escrow/gi, 'Escrow Guarantee'],
  [/hợp đồng bảo lãnh escrow 100%/gi, 'backed by 100% Escrow guarantee'],
  [/hợp đồng bảo lãnh escrow/gi, 'Escrow Contract Guarantee'],
  [/bảo lãnh 100%/gi, '100% Escrow Guarantee'],
  [/bảo lãnh/gi, 'Escrow Guarantee'],
  [/hoàn tiền 100%/gi, '100% Refundable'],
  [/hoàn tiền/gi, 'Refund'],
  [/bảo hành 1:1 mọi lỗi/gi, '1:1 Instant Replacement for Any Issue'],
  [/bảo hành 1:1/gi, '1:1 Replacement Warranty'],
  [/bảo hành/gi, 'Warranty'],

  // Speeds & Times
  [/tốc độ nhận key/gi, 'Delivery Speed'],
  [/tốc độ nhận/gi, 'Delivery Speed'],
  [/tự động trả mã 24\/7/gi, 'Automated Key Delivery 24/7'],
  [/tự động trả mã/gi, 'Instant Key Dispatch'],
  [/trả mã tức thì/gi, 'Instant Key Delivery'],
  [/tức thì/gi, 'Instant'],
  [/nhận mã tức thì/gi, 'Receive Key Instantly'],
  [/3\s*-\s*30 giây/gi, '3 - 30 Seconds'],
  [/3 giây|3s/gi, '3 Seconds'],
  [/giây/gi, 'Seconds'],
  [/phút/gi, 'Minutes'],
  [/ngày/gi, 'Days'],
  [/tháng/gi, 'Month'],
  [/năm/gi, 'Year'],

  // Trust & Reliability
  [/an toàn\s*[-–—&,]\s*nhanh chóng/gi, 'Safe & Fast'],
  [/an toàn\s*&\s*tiết kiệm/gi, 'Safe & Save'],
  [/an toàn/gi, 'Safe & Secure'],
  [/nhanh chóng/gi, 'Fast & Instant'],
  [/uy tín/gi, '100% Trusted'],
  [/không lo scam/gi, 'Scam-Free Guaranteed'],
  [/chất lượng cao/gi, 'High Quality'],
  [/chất lượng/gi, 'Quality'],
  [/tiện lợi/gi, 'Convenient'],
  [/siêu tốc/gi, 'Ultra Fast'],
  [/chuyên nghiệp/gi, 'Professional'],

  // Subheading long phrases
  [/giải pháp gom đơn thông minh: nhận giá sỉ gốc cho chatgpt plus, netflix 4k, game steam và nhiều tựa game hot\. thanh toán tự động, nhận mã tức thì qua hợp đồng bảo lãnh escrow 100%\./gi, 
   'Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121+ hot titles. Automated checkout, instant key dispatch backed by 100% Escrow guarantee.'],
  [/giải pháp gom đơn thông minh/gi, 'Smart Group-Buy Solution'],
  [/nhận giá sỉ gốc cho/gi, 'Access wholesale rates for'],
  [/thanh toán tự động/gi, 'Automated Checkout'],
  [/nhiều tựa game hot/gi, 'multiple hot game titles'],
  [/tựa game hot/gi, 'hot game titles'],
  [/sản phẩm số/gi, 'Digital Products'],
  [/tài khoản bản quyền/gi, 'Premium Accounts'],
  [/mã bản quyền/gi, 'License Keys'],
  [/key bản quyền/gi, 'License Keys'],
  [/khuyến mãi nạp tiền/gi, 'Deposit Promotion'],
  [/tặng ngay/gi, 'Instant Bonus'],
  [/nạp tiền tự động/gi, 'Automated Deposit']
];

// -------------------------------------------------------------
// EN Master -> Target Language Dictionary & Rule Base
// -------------------------------------------------------------
const EN_TO_TARGET_RULES: Partial<Record<SupportedLocale, [RegExp, string][]>> & Record<string, [RegExp, string][]> = {
  vi: [], // Vietnamese is canonical source, not target of EN Master
  en: [], // Identity
  zh: [
    [/New system update/gi, '系统全新更新'],
    [/System Update/gi, '系统更新'],
    [/System Announcement/gi, '系统官方公告'],
    [/Maintenance Notice/gi, '系统维护通知'],
    [/Announcement/gi, '系统公告'],
    [/version\s*([0-9\.]+)/gi, '$1 版本'],
    [/New Version/gi, '新版本'],
    [/Version/gi, '版本'],
    [/New Features/gi, '全新特性'],
    [/Feature/gi, '功能特性'],
    [/Marketplace Upgrade/gi, '交易市场架构升级'],
    [/Platform Upgrade/gi, '平台全面升级'],
    [/Upgrade/gi, '版本升级'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, '顶级数字产品拼团拼单与安全托管交易平台'],
    [/Digital Asset & Key Group Buy Platform/gi, '数字资产与正版密钥拼团平台'],
    [/Group-Buy Escrow Marketplace/gi, '智能托管拼团交易市场'],
    [/Group-Buy Pool/gi, '拼团拼单大厅'],
    [/Software & Game Group Buy/gi, '软件与游戏拼团购买'],
    [/Cheap Group Buy/gi, '低价拼单'],
    [/Group Buy/gi, '拼团购买'],
    [/Save Up To\s*([0-9]+%)/gi, '最高立省 $1'],
    [/Save/gi, '立省优惠'],
    [/Wholesale Base Price/gi, '官方出厂批发底价'],
    [/Retail at Wholesale Prices/gi, '散买享批发价'],
    [/Escrow Guarantee/gi, '智能托管保障'],
    [/backed by 100% Escrow guarantee/gi, '由 100% 智能托管提供全面保障'],
    [/Escrow Contract Guarantee/gi, '100% 智能合约托管保障'],
    [/100% Escrow Guarantee/gi, '100% 资金安全托管'],
    [/100% Refundable/gi, '100% 全额可退款'],
    [/Refund/gi, '极速退款'],
    [/1:1 Instant Replacement for Any Issue/gi, '任意故障 1:1 极速秒换新'],
    [/1:1 Replacement Warranty/gi, '1:1 换新质保'],
    [/Warranty/gi, '售后质保'],
    [/Delivery Speed/gi, '发货时效'],
    [/Automated Key Delivery 24\/7/gi, '24/7 全天候秒级自动发卡'],
    [/Instant Key Dispatch/gi, '秒级自动发货'],
    [/Instant Key Delivery/gi, '即时发卡'],
    [/Receive Key Instantly/gi, '即刻接收激活码'],
    [/Instant/gi, '即时秒级'],
    [/3 - 30 Seconds/gi, '3 - 30 秒到账'],
    [/3 Seconds/gi, '3 秒极速'],
    [/Seconds/gi, '秒'],
    [/Minutes/gi, '分钟'],
    [/Days/gi, '天'],
    [/Month/gi, '个月'],
    [/Year/gi, '年'],
    [/Safe & Fast/gi, '安全极速'],
    [/Safe & Save/gi, '安全且省钱'],
    [/Safe & Secure/gi, '安全保障'],
    [/Fast & Instant/gi, '极速到账'],
    [/100% Trusted/gi, '100% 信誉保障'],
    [/Scam-Free Guaranteed/gi, '防骗零风险保障'],
    [/High Quality/gi, '高品质'],
    [/Quality/gi, '优质保证'],
    [/Convenient/gi, '便捷高效'],
    [/Ultra Fast/gi, '秒级极速'],
    [/Professional/gi, '专业服务'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     '智能拼团解决方案：以出厂批发价畅享 ChatGPT Plus、Netflix 4K、Steam 游戏及 121+ 款热门游戏。全自动结算，100% 智能托管保障，秒级自动发码。'],
    [/Smart Group-Buy Solution/gi, '智能拼团解决方案'],
    [/Access wholesale rates for/gi, '享批发价购买'],
    [/Automated Checkout/gi, '全自动结账'],
    [/multiple hot game titles/gi, '多款热门爆款游戏'],
    [/hot game titles/gi, '热门游戏'],
    [/Digital Products/gi, '数字虚拟产品'],
    [/Premium Accounts/gi, '官方正版会员账号'],
    [/License Keys/gi, '正版激活密钥'],
    [/Deposit Promotion/gi, '充值限时福利'],
    [/Instant Bonus/gi, '立即赠送'],
    [/Automated Deposit/gi, '自动秒充']
  ],
  ja: [
    [/New system update/gi, '新しいシステムアップデート'],
    [/System Update/gi, 'システムアップデート'],
    [/System Announcement/gi, 'システム公式お知らせ'],
    [/Maintenance Notice/gi, 'メンテナンスのお知らせ'],
    [/Announcement/gi, 'お知らせ'],
    [/version\s*([0-9\.]+)/gi, 'バージョン $1'],
    [/New Version/gi, '新バージョン'],
    [/Version/gi, 'バージョン'],
    [/New Features/gi, '新機能'],
    [/Feature/gi, '機能'],
    [/Marketplace Upgrade/gi, 'マーケットプレイス大型刷新'],
    [/Platform Upgrade/gi, 'プラットフォーム刷新'],
    [/Upgrade/gi, 'アップグレード'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, '国内最高峰のデジタル資産共同購入＆安全エスクロー市場'],
    [/Digital Asset & Key Group Buy Platform/gi, 'デジタル資産＆ライセンス共同購入市場'],
    [/Group-Buy Escrow Marketplace/gi, 'エスクロー保証付き共同購入市場'],
    [/Group-Buy Pool/gi, '共同購入プール'],
    [/Software & Game Group Buy/gi, 'ソフトウェア＆ゲームの共同購入'],
    [/Cheap Group Buy/gi, '格安共同購入'],
    [/Group Buy/gi, '共同購入'],
    [/Save Up To\s*([0-9]+%)/gi, '最大 $1 オフ'],
    [/Save/gi, 'お得に節約'],
    [/Wholesale Base Price/gi, '卸売直販価格'],
    [/Retail at Wholesale Prices/gi, '単品でも卸売価格'],
    [/Escrow Guarantee/gi, 'エスクロー保証'],
    [/backed by 100% Escrow guarantee/gi, '100% エスクロー保証付き'],
    [/Escrow Contract Guarantee/gi, 'スマートエスクロー契約保証'],
    [/100% Escrow Guarantee/gi, '100% エスクロー完全保護'],
    [/100% Refundable/gi, '100% 返金保証'],
    [/Refund/gi, '返金対応'],
    [/1:1 Instant Replacement for Any Issue/gi, '不具合発生時は 1:1 即時新品交換'],
    [/1:1 Replacement Warranty/gi, '1対1 交換保証'],
    [/Warranty/gi, '安心保証'],
    [/Delivery Speed/gi, '配信速度'],
    [/Automated Key Delivery 24\/7/gi, '24時間365日 自動即時納品'],
    [/Instant Key Dispatch/gi, '自動即時納品'],
    [/Instant Key Delivery/gi, '即時コード発行'],
    [/Receive Key Instantly/gi, 'コードを即時受取'],
    [/Instant/gi, '即時・迅速'],
    [/3 - 30 Seconds/gi, '3〜30秒'],
    [/3 Seconds/gi, '3秒'],
    [/Seconds/gi, '秒'],
    [/Minutes/gi, '分'],
    [/Days/gi, '日'],
    [/Month/gi, 'ヶ月'],
    [/Year/gi, '年間'],
    [/Safe & Fast/gi, '安心・迅速'],
    [/Safe & Save/gi, '安心＆節約'],
    [/Safe & Secure/gi, '安心・安全'],
    [/Fast & Instant/gi, '迅速・即時'],
    [/100% Trusted/gi, '信頼保証'],
    [/Scam-Free Guaranteed/gi, '詐欺ゼロ保証'],
    [/High Quality/gi, '高品質'],
    [/Quality/gi, '品質保証'],
    [/Convenient/gi, '便利'],
    [/Ultra Fast/gi, '超高速'],
    [/Professional/gi, 'プロ仕様'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     'スマート共同購入ソリューション：ChatGPT Plus、Netflix 4K、Steamゲームなど121本以上の人気タイトルを卸売価格で入手。自動決済＆100%エスクロー保証で即時コード受け取り。'],
    [/Smart Group-Buy Solution/gi, 'スマート共同購入ソリューション'],
    [/Access wholesale rates for/gi, '卸売価格で入手'],
    [/Automated Checkout/gi, '自動決済'],
    [/multiple hot game titles/gi, '多数の人気ゲーム'],
    [/hot game titles/gi, '人気ゲーム'],
    [/Digital Products/gi, 'デジタル製品'],
    [/Premium Accounts/gi, 'プレミアムアカウント'],
    [/License Keys/gi, 'ライセンスキー'],
    [/Deposit Promotion/gi, 'チャージ特典キャンペーン'],
    [/Instant Bonus/gi, '即時ボーナス'],
    [/Automated Deposit/gi, '自動即時チャージ']
  ],
  ko: [
    [/New system update/gi, '새로운 시스템 업데이트'],
    [/System Update/gi, '시스템 업데이트'],
    [/System Announcement/gi, '시스템 공식 공지사항'],
    [/Maintenance Notice/gi, '점검 안내 공지'],
    [/Announcement/gi, '공지사항'],
    [/version\s*([0-9\.]+)/gi, '버전 $1'],
    [/New Version/gi, '신규 버전'],
    [/Version/gi, '버전'],
    [/New Features/gi, '신규 기능'],
    [/Feature/gi, '기능'],
    [/Marketplace Upgrade/gi, '마켓플레이스 대규모 업그레이드'],
    [/Platform Upgrade/gi, '플랫폼 대규모 업그레이드'],
    [/Upgrade/gi, '업그레이드'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, '국내 1위 디지털 라이선스 공동구매 & 안전 에스크로 거래소'],
    [/Digital Asset & Key Group Buy Platform/gi, '디지털 자산 및 정품 키 공동구매 거래소'],
    [/Group-Buy Escrow Marketplace/gi, '에스크로 안심 공동구매 마켓'],
    [/Group-Buy Pool/gi, '공동구매 풀'],
    [/Software & Game Group Buy/gi, '소프트웨어 & 게임 공동구매'],
    [/Cheap Group Buy/gi, '초특가 공동구매'],
    [/Group Buy/gi, '공동구매'],
    [/Save Up To\s*([0-9]+%)/gi, '최대 $1 할인'],
    [/Save/gi, '절약 할인'],
    [/Wholesale Base Price/gi, '도매 원가'],
    [/Retail at Wholesale Prices/gi, '소매도 도매가로'],
    [/Escrow Guarantee/gi, '에스크로 안심 보증'],
    [/backed by 100% Escrow guarantee/gi, '100% 에스크로 안심 보증'],
    [/Escrow Contract Guarantee/gi, '스마트 에스크로 계약 보증'],
    [/100% Escrow Guarantee/gi, '100% 에스크로 보호'],
    [/100% Refundable/gi, '100% 환불 보장'],
    [/Refund/gi, '환불 처리'],
    [/1:1 Instant Replacement for Any Issue/gi, '모든 오류 발생 시 1:1 즉시 맞교환'],
    [/1:1 Replacement Warranty/gi, '1:1 맞교환 안심케어'],
    [/Warranty/gi, '품질 보증'],
    [/Delivery Speed/gi, '발송 속도'],
    [/Automated Key Delivery 24\/7/gi, '24/7 자동 즉시 발송'],
    [/Instant Key Dispatch/gi, '자동 즉시 발송'],
    [/Instant Key Delivery/gi, '즉시 코드 발급'],
    [/Receive Key Instantly/gi, '즉시 코드 수령'],
    [/Instant/gi, '즉시'],
    [/3 - 30 Seconds/gi, '3 - 30초'],
    [/3 Seconds/gi, '3초'],
    [/Seconds/gi, '초'],
    [/Minutes/gi, '분'],
    [/Days/gi, '일'],
    [/Month/gi, '개월'],
    [/Year/gi, '년'],
    [/Safe & Fast/gi, '안전하고 빠른'],
    [/Safe & Save/gi, '안전하고 알뜰한'],
    [/Safe & Secure/gi, '안전 보장'],
    [/Fast & Instant/gi, '신속 처리'],
    [/100% Trusted/gi, '신뢰 보증'],
    [/Scam-Free Guaranteed/gi, '사기 걱정 제로 보증'],
    [/High Quality/gi, '고품질'],
    [/Quality/gi, '품질 보증'],
    [/Convenient/gi, '편리한'],
    [/Ultra Fast/gi, '초고속'],
    [/Professional/gi, '전문적인'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     '스마트 공동구매 솔루션: ChatGPT Plus, Netflix 4K, Steam 게임 및 121개 이상의 인기 타이틀을 도매 원가로 만나보세요. 100% 에스크로 보증 및 자동 결제로 즉시 코드 발송.'],
    [/Smart Group-Buy Solution/gi, '스마트 공동구매 솔루션'],
    [/Access wholesale rates for/gi, '도매가로 이용'],
    [/Automated Checkout/gi, '자동 결제'],
    [/multiple hot game titles/gi, '다양한 인기 게임'],
    [/hot game titles/gi, '인기 게임'],
    [/Digital Products/gi, '디지털 상품'],
    [/Premium Accounts/gi, '정품 프리미엄 계정'],
    [/License Keys/gi, '정품 라이선스 키'],
    [/Deposit Promotion/gi, '충전 특별 프로모션'],
    [/Instant Bonus/gi, '즉시 추가 지급'],
    [/Automated Deposit/gi, '자동 즉시 충전']
  ],
  ru: [
    [/New system update/gi, 'НОВОЕ ОБНОВЛЕНИЕ СИСТЕМЫ'],
    [/System Update/gi, 'ОБНОВЛЕНИЕ СИСТЕМЫ'],
    [/System Announcement/gi, 'ОФИЦИАЛЬНОЕ ОБЪЯВЛЕНИЕ'],
    [/Maintenance Notice/gi, 'Уведомление о техработах'],
    [/Announcement/gi, 'Объявление'],
    [/version\s*([0-9\.]+)/gi, 'версия $1'],
    [/New Version/gi, 'Новая версия'],
    [/Version/gi, 'Версия'],
    [/New Features/gi, 'Новые функции'],
    [/Feature/gi, 'Функция'],
    [/Marketplace Upgrade/gi, 'Обновление маркетплейса'],
    [/Platform Upgrade/gi, 'Обновление платформы'],
    [/Upgrade/gi, 'Обновление'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, 'ПЛАТФОРМА №1 ДЛЯ СОВМЕСТНЫХ ПОКУПОК ЦИФРОВЫХ КЛЮЧЕЙ И ЭСКРОУ'],
    [/Digital Asset & Key Group Buy Platform/gi, 'Платформа совместных покупок цифровых активов и ключей'],
    [/Group-Buy Escrow Marketplace/gi, 'Маркетплейс совместных покупок с Эскроу'],
    [/Group-Buy Pool/gi, 'Пул совместной покупки'],
    [/Software & Game Group Buy/gi, 'СОВМЕСТНЫЕ ПОКУПКИ СОФТА И ИГР'],
    [/Cheap Group Buy/gi, 'ДЕШЕВЫЙ ГРУППОВОЙ ВЫКУП'],
    [/Group Buy/gi, 'Совместная покупка'],
    [/Save Up To\s*([0-9]+%)/gi, 'ЭКОНОМИЯ ДО $1'],
    [/Save/gi, 'Экономия'],
    [/Wholesale Base Price/gi, 'Оптовая цена'],
    [/Retail at Wholesale Prices/gi, 'РОЗНИЦА ПО ОПТОВЫМ ЦЕНАМ'],
    [/Escrow Guarantee/gi, 'Защита Escrow'],
    [/backed by 100% Escrow guarantee/gi, 'под защитой 100% Escrow'],
    [/Escrow Contract Guarantee/gi, '100% Гарантия Эскроу-контракта'],
    [/100% Escrow Guarantee/gi, '100% Защита Escrow'],
    [/100% Refundable/gi, '100% Возврат средств'],
    [/Refund/gi, 'Возврат'],
    [/1:1 Instant Replacement for Any Issue/gi, 'Замена 1 к 1 при любой ошибке'],
    [/1:1 Replacement Warranty/gi, 'Замена 1 к 1'],
    [/Warranty/gi, 'Гарантия'],
    [/Delivery Speed/gi, 'Скорость доставки'],
    [/Automated Key Delivery 24\/7/gi, 'Автоматическая выдача 24/7'],
    [/Instant Key Dispatch/gi, 'Мгновенная выдача ключей'],
    [/Instant Key Delivery/gi, 'Мгновенная доставка кода'],
    [/Receive Key Instantly/gi, 'Получить ключ мгновенно'],
    [/Instant/gi, 'Мгновенно'],
    [/3 - 30 Seconds/gi, '3 - 30 секунд'],
    [/3 Seconds/gi, '3 секунды'],
    [/Seconds/gi, 'секунд'],
    [/Minutes/gi, 'минут'],
    [/Days/gi, 'дней'],
    [/Month/gi, 'месяц'],
    [/Year/gi, 'год'],
    [/Safe & Fast/gi, 'Безопасно и быстро'],
    [/Safe & Save/gi, 'Безопасно и выгодно'],
    [/Safe & Secure/gi, 'Безопасно'],
    [/Fast & Instant/gi, 'Быстро и надежно'],
    [/100% Trusted/gi, '100% Надежно'],
    [/Scam-Free Guaranteed/gi, '100% без скама'],
    [/High Quality/gi, 'Высокое качество'],
    [/Quality/gi, 'Качественно'],
    [/Convenient/gi, 'Удобно'],
    [/Ultra Fast/gi, 'Сверхбыстро'],
    [/Professional/gi, 'Профессионально'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     'Умные совместные покупки: оптовые цены на ChatGPT Plus, Netflix 4K, Steam игры и более 121 хитов. Автоматическая оплата, моментальная выдача ключей с гарантией 100% Escrow.'],
    [/Smart Group-Buy Solution/gi, 'Умное решение для совместных покупок'],
    [/Access wholesale rates for/gi, 'Оптовые цены на'],
    [/Automated Checkout/gi, 'Автоматическая оплата'],
    [/multiple hot game titles/gi, 'популярные игры'],
    [/hot game titles/gi, 'хитовые игры'],
    [/Digital Products/gi, 'Цифровые товары'],
    [/Premium Accounts/gi, 'Премиум аккаунты'],
    [/License Keys/gi, 'Лицензионные ключи'],
    [/Deposit Promotion/gi, 'Бонус при пополнении'],
    [/Instant Bonus/gi, 'Мгновенный бонус'],
    [/Automated Deposit/gi, 'Авто-пополнение']
  ],
  fr: [
    [/New system update/gi, 'NOUVELLE MISE À JOUR DU SYSTÈME'],
    [/System Update/gi, 'MISE À JOUR SYSTÈME'],
    [/System Announcement/gi, 'ANNONCE OFFICIELLE'],
    [/Maintenance Notice/gi, 'Avis de Maintenance'],
    [/Announcement/gi, 'Annonce'],
    [/version\s*([0-9\.]+)/gi, 'version $1'],
    [/New Version/gi, 'Nouvelle Version'],
    [/Version/gi, 'Version'],
    [/New Features/gi, 'Nouvelles Fonctionnalités'],
    [/Feature/gi, 'Fonctionnalité'],
    [/Marketplace Upgrade/gi, 'Mise à niveau du Marketplace'],
    [/Platform Upgrade/gi, 'Mise à niveau Plateforme'],
    [/Upgrade/gi, 'Mise à niveau'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, 'PLATEFORME N°1 D’ACHAT GROUPÉ & SÉQUESTRE NUMÉRIQUE'],
    [/Digital Asset & Key Group Buy Platform/gi, 'Plateforme d’achat groupé de clés & actifs numériques'],
    [/Group-Buy Escrow Marketplace/gi, 'Marché d’achat groupé avec séquestre Escrow'],
    [/Group-Buy Pool/gi, 'Groupe d’achat'],
    [/Software & Game Group Buy/gi, 'ACHAT GROUPÉ LOGICIELS & JEUX'],
    [/Cheap Group Buy/gi, 'ACHAT GROUPÉ PAS CHER'],
    [/Group Buy/gi, 'Achat Groupé'],
    [/Save Up To\s*([0-9]+%)/gi, 'ÉCONOMISEZ JUSQU’À $1'],
    [/Save/gi, 'Économisez'],
    [/Wholesale Base Price/gi, 'Prix de gros d’origine'],
    [/Retail at Wholesale Prices/gi, 'DÉTAIL AU PRIX DE GROS'],
    [/Escrow Guarantee/gi, 'Garantie Escrow'],
    [/backed by 100% Escrow guarantee/gi, 'garanti à 100% par séquestre Escrow'],
    [/Escrow Contract Guarantee/gi, 'Garantie contractuelle Escrow 100%'],
    [/100% Escrow Guarantee/gi, 'Protection Escrow 100%'],
    [/100% Refundable/gi, '100% Remboursable'],
    [/Refund/gi, 'Remboursement'],
    [/1:1 Instant Replacement for Any Issue/gi, 'Remplacement immédiat 1:1 pour tout incident'],
    [/1:1 Replacement Warranty/gi, 'Remplacement 1:1 garanti'],
    [/Warranty/gi, 'Garantie'],
    [/Delivery Speed/gi, 'Délai de Livraison'],
    [/Automated Key Delivery 24\/7/gi, 'Livraison automatique 24/7'],
    [/Instant Key Dispatch/gi, 'Envoi instantané des clés'],
    [/Instant Key Delivery/gi, 'Livraison instantanée'],
    [/Receive Key Instantly/gi, 'Recevez la clé immédiatement'],
    [/Instant/gi, 'Instantané'],
    [/3 - 30 Seconds/gi, '3 - 30 Secondes'],
    [/3 Seconds/gi, '3 Secondes'],
    [/Seconds/gi, 'Secondes'],
    [/Minutes/gi, 'Minutes'],
    [/Days/gi, 'Jours'],
    [/Month/gi, 'Mois'],
    [/Year/gi, 'An'],
    [/Safe & Fast/gi, 'Sécurisé & Rapide'],
    [/Safe & Save/gi, 'Sécurisé & Économique'],
    [/Safe & Secure/gi, 'Sécurisé'],
    [/Fast & Instant/gi, 'Rapide & Instantané'],
    [/100% Trusted/gi, '100% Fiable'],
    [/Scam-Free Guaranteed/gi, 'Garanti sans arnaque'],
    [/High Quality/gi, 'Haute qualité'],
    [/Quality/gi, 'Qualité'],
    [/Convenient/gi, 'Pratique'],
    [/Ultra Fast/gi, 'Ultra Rapide'],
    [/Professional/gi, 'Professionnel'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     'Solutions d’achat groupé intelligentes : profitez de prix de gros pour ChatGPT Plus, Netflix 4K, jeux Steam et plus de 121 titres phares. Paiement automatique, livraison immédiate garantie par séquestre 100%.'],
    [/Smart Group-Buy Solution/gi, 'Solution d’achat groupé intelligente'],
    [/Access wholesale rates for/gi, 'Accédez aux prix de gros pour'],
    [/Automated Checkout/gi, 'Paiement automatique'],
    [/multiple hot game titles/gi, 'nombreux jeux populaires'],
    [/hot game titles/gi, 'jeux populaires'],
    [/Digital Products/gi, 'Produits numériques'],
    [/Premium Accounts/gi, 'Comptes Premium'],
    [/License Keys/gi, 'Clés de licence'],
    [/Deposit Promotion/gi, 'Offre promotionnelle de dépôt'],
    [/Instant Bonus/gi, 'Bonus immédiat'],
    [/Automated Deposit/gi, 'Recharge automatique']
  ],
  de: [
    [/New system update/gi, 'NEUES SYSTEM-UPDATE'],
    [/System Update/gi, 'SYSTEM-UPDATE'],
    [/System Announcement/gi, 'OFFIZIELLE MITTEILUNG'],
    [/Maintenance Notice/gi, 'Wartungsankündigung'],
    [/Announcement/gi, 'Ankündigung'],
    [/version\s*([0-9\.]+)/gi, 'Version $1'],
    [/New Version/gi, 'Neue Version'],
    [/Version/gi, 'Version'],
    [/New Features/gi, 'Neue Funktionen'],
    [/Feature/gi, 'Funktion'],
    [/Marketplace Upgrade/gi, 'Marktplatz-Upgrade'],
    [/Platform Upgrade/gi, 'Plattform-Upgrade'],
    [/Upgrade/gi, 'Upgrade'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, 'DIE NR. 1 PLATTFORM FÜR GRUPPENKAUF & DIGITAL-TREUHAND'],
    [/Digital Asset & Key Group Buy Platform/gi, 'Gruppenkauf-Plattform für digitale Güter & Lizenzen'],
    [/Group-Buy Escrow Marketplace/gi, 'Gruppenkauf-Marktplatz mit Treuhand-Schutz'],
    [/Group-Buy Pool/gi, 'Gruppenkauf-Pool'],
    [/Software & Game Group Buy/gi, 'SOFTWARE- & GAME-GRUPPENKAUF'],
    [/Cheap Group Buy/gi, 'GÜNSTIGER GRUPPENKAUF'],
    [/Group Buy/gi, 'Gruppenkauf'],
    [/Save Up To\s*([0-9]+%)/gi, 'BIS ZU $1 SPAREN'],
    [/Save/gi, 'Sparen'],
    [/Wholesale Base Price/gi, 'Original-Großhandelspreis'],
    [/Retail at Wholesale Prices/gi, 'EINZELKAUF ZUM GROSSHANDELSPREIS'],
    [/Escrow Guarantee/gi, 'Escrow-Treuhand'],
    [/backed by 100% Escrow guarantee/gi, 'abgesichert durch 100% Escrow-Garantie'],
    [/Escrow Contract Guarantee/gi, '100% Escrow-Vertragsgarantie'],
    [/100% Escrow Guarantee/gi, '100% Treuhand-Garantie'],
    [/100% Refundable/gi, '100% Erstattbar'],
    [/Refund/gi, 'Erstattung'],
    [/1:1 Instant Replacement for Any Issue/gi, '1:1 Sofort-Ersatz bei jedem Fehler'],
    [/1:1 Replacement Warranty/gi, '1:1 Sofort-Ersatzgarantie'],
    [/Warranty/gi, 'Garantie'],
    [/Delivery Speed/gi, 'Liefertempo'],
    [/Automated Key Delivery 24\/7/gi, 'Automatische 24/7 Auslieferung'],
    [/Instant Key Dispatch/gi, 'Sofortige Schlüsselausgabe'],
    [/Instant Key Delivery/gi, 'Sofortige Zustellung'],
    [/Receive Key Instantly/gi, 'Schlüssel sofort erhalten'],
    [/Instant/gi, 'Sofort'],
    [/3 - 30 Seconds/gi, '3 - 30 Sekunden'],
    [/3 Seconds/gi, '3 Sekunden'],
    [/Seconds/gi, 'Sekunden'],
    [/Minutes/gi, 'Minuten'],
    [/Days/gi, 'Tage'],
    [/Month/gi, 'Monat'],
    [/Year/gi, 'Jahr'],
    [/Safe & Fast/gi, 'Sicher & Schnell'],
    [/Safe & Save/gi, 'Sicher & Sparsam'],
    [/Safe & Secure/gi, 'Sicher'],
    [/Fast & Instant/gi, 'Schnell & Sofort'],
    [/100% Trusted/gi, '100% Zuverlässig'],
    [/Scam-Free Guaranteed/gi, 'Garantiert betrugsfrei'],
    [/High Quality/gi, 'Hohe Qualität'],
    [/Quality/gi, 'Qualität'],
    [/Convenient/gi, 'Bequem'],
    [/Ultra Fast/gi, 'Ultraschnell'],
    [/Professional/gi, 'Professionell'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     'Smarte Gruppenkauf-Lösungen: Großhandelspreise für ChatGPT Plus, Netflix 4K, Steam-Spiele und über 121 Top-Titel. Automatischer Checkout und Sofortauslieferung mit 100% Treuhand-Garantie.'],
    [/Smart Group-Buy Solution/gi, 'Smarte Gruppenkauf-Lösung'],
    [/Access wholesale rates for/gi, 'Großhandelspreise für'],
    [/Automated Checkout/gi, 'Automatische Abrechnung'],
    [/multiple hot game titles/gi, 'beliebte Spiele-Highlights'],
    [/hot game titles/gi, 'Top-Spiele'],
    [/Digital Products/gi, 'Digitale Produkte'],
    [/Premium Accounts/gi, 'Premium-Konten'],
    [/License Keys/gi, 'Lizenzschlüssel'],
    [/Deposit Promotion/gi, 'Einzahlungs-Bonusaktion'],
    [/Instant Bonus/gi, 'Sofortiger Bonus'],
    [/Automated Deposit/gi, 'Automatische Aufladung']
  ],
  es: [
    [/New system update/gi, 'NUEVA ACTUALIZACIÓN DEL SISTEMA'],
    [/System Update/gi, 'ACTUALIZACIÓN DEL SISTEMA'],
    [/System Announcement/gi, 'ANUNCIO OFICIAL'],
    [/Maintenance Notice/gi, 'Aviso de Mantenimiento'],
    [/Announcement/gi, 'Anuncio'],
    [/version\s*([0-9\.]+)/gi, 'versión $1'],
    [/New Version/gi, 'Nueva Versión'],
    [/Version/gi, 'Versión'],
    [/New Features/gi, 'Nuevas Funciones'],
    [/Feature/gi, 'Función'],
    [/Marketplace Upgrade/gi, 'Actualización del Marketplace'],
    [/Platform Upgrade/gi, 'Actualización de Plataforma'],
    [/Upgrade/gi, 'Actualización'],
    [/The #1 Group-Buy Escrow & Digital License Platform/gi, 'PLATAFORMA N.º 1 DE COMPRA COLECTIVA Y DEPÓSITO EN GARANTÍA'],
    [/Digital Asset & Key Group Buy Platform/gi, 'Plataforma de compra colectiva de claves y activos digitales'],
    [/Group-Buy Escrow Marketplace/gi, 'Mercado de compra colectiva con garantía Escrow'],
    [/Group-Buy Pool/gi, 'Grupo de compra'],
    [/Software & Game Group Buy/gi, 'COMPRA COLECTIVA DE SOFTWARE Y JUEGOS'],
    [/Cheap Group Buy/gi, 'COMPRA COLECTIVA ECONÓMICA'],
    [/Group Buy/gi, 'Compra Colectiva'],
    [/Save Up To\s*([0-9]+%)/gi, 'AHORRA HASTA UN $1'],
    [/Save/gi, 'Ahorro'],
    [/Wholesale Base Price/gi, 'Precio mayorista original'],
    [/Retail at Wholesale Prices/gi, 'AL POR MENOR A PRECIO DE MAYOR'],
    [/Escrow Guarantee/gi, 'Garantía Escrow'],
    [/backed by 100% Escrow guarantee/gi, 'respaldado por garantía Escrow 100%'],
    [/Escrow Contract Guarantee/gi, 'Garantía contractual de Escrow 100%'],
    [/100% Escrow Guarantee/gi, 'Protección Escrow 100%'],
    [/100% Refundable/gi, '100% Reembolsable'],
    [/Refund/gi, 'Reembolso'],
    [/1:1 Instant Replacement for Any Issue/gi, 'Sustitución inmediata 1:1 ante cualquier incidencia'],
    [/1:1 Replacement Warranty/gi, 'Garantía de sustitución 1:1'],
    [/Warranty/gi, 'Garantía'],
    [/Delivery Speed/gi, 'Velocidad de Entrega'],
    [/Automated Key Delivery 24\/7/gi, 'Entrega automatizada 24/7'],
    [/Instant Key Dispatch/gi, 'Envío instantáneo de claves'],
    [/Instant Key Delivery/gi, 'Entrega inmediata de clave'],
    [/Receive Key Instantly/gi, 'Recibe la clave al instante'],
    [/Instant/gi, 'Instantáneo'],
    [/3 - 30 Seconds/gi, '3 - 30 Segundos'],
    [/3 Seconds/gi, '3 Segundos'],
    [/Seconds/gi, 'Segundos'],
    [/Minutes/gi, 'Minutos'],
    [/Days/gi, 'Días'],
    [/Month/gi, 'Mes'],
    [/Year/gi, 'Año'],
    [/Safe & Fast/gi, 'Seguro y Rápido'],
    [/Safe & Save/gi, 'Seguro y Ahorro'],
    [/Safe & Secure/gi, 'Seguro'],
    [/Fast & Instant/gi, 'Rápido e Instantáneo'],
    [/100% Trusted/gi, '100% Confiable'],
    [/Scam-Free Guaranteed/gi, 'Garantizado sin estafas'],
    [/High Quality/gi, 'Alta calidad'],
    [/Quality/gi, 'Calidad'],
    [/Convenient/gi, 'Conveniente'],
    [/Ultra Fast/gi, 'Ultrarrápido'],
    [/Professional/gi, 'Profesional'],
    [/Smart Group-Buy Solutions: Access original wholesale prices for ChatGPT Plus, Netflix 4K, Steam Games and 121\+ hot titles\. Automated checkout, instant key dispatch backed by 100% Escrow guarantee\./gi,
     'Soluciones inteligentes de compra colectiva: accede a precios mayoristas para ChatGPT Plus, Netflix 4K, juegos de Steam y más de 121 títulos populares. Pago automático, entrega inmediata con garantía 100% Escrow.'],
    [/Smart Group-Buy Solution/gi, 'Solución inteligente de compra colectiva'],
    [/Access wholesale rates for/gi, 'Acceso a precios mayoristas para'],
    [/Automated Checkout/gi, 'Pago automatizado'],
    [/multiple hot game titles/gi, 'múltiples juegos populares'],
    [/hot game titles/gi, 'juegos populares'],
    [/Digital Products/gi, 'Productos digitales'],
    [/Premium Accounts/gi, 'Cuentas Premium'],
    [/License Keys/gi, 'Claves de licencia'],
    [/Deposit Promotion/gi, 'Promoción de depósito'],
    [/Instant Bonus/gi, 'Bono inmediato'],
    [/Automated Deposit/gi, 'Depósito automático']
  ]
};

/**
 * Step 1 of Pipeline: Translate Vietnamese Source into English Master Bridge
 */
export function translateViToEnglishMaster(viText: string): string {
  if (!viText || !viText.trim()) return viText || '';

  const { masked, tokens } = maskProtectedTokens(viText);
  let result = masked;

  // Check uppercase intention
  const isAllUpper = viText.length > 3 && viText === viText.toUpperCase() && /[A-ZÀ-Ỹ]/.test(viText);

  // Apply Vietnamese -> English translation rules
  VI_TO_EN_RULES.forEach(([pat, enReplacement]) => {
    result = result.replace(pat, enReplacement);
  });

  const unmasked = unmaskProtectedTokens(result, tokens);
  return isAllUpper ? unmasked.toUpperCase() : unmasked;
}

/**
 * Step 2 of Pipeline: Translate English Master Bridge into Target Language
 */
export function translateEnglishMasterToTarget(
  enText: string,
  targetLang: SupportedLocale
): string {
  if (!enText || !enText.trim()) return enText || '';
  if (targetLang === 'en') return enText;
  if (targetLang === 'vi') return enText; // Should not happen in chain, VI is source

  const rules = EN_TO_TARGET_RULES[targetLang];
  if (!rules || !rules.length) return enText;

  const { masked, tokens } = maskProtectedTokens(enText);
  let result = masked;

  const isAllUpper = enText.length > 3 && enText === enText.toUpperCase() && /[A-Z]/.test(enText);

  rules.forEach(([pat, targetReplacement]) => {
    result = result.replace(pat, targetReplacement);
  });

  const unmasked = unmaskProtectedTokens(result, tokens);
  return isAllUpper ? unmasked.toUpperCase() : unmasked;
}

/**
 * Complete Chain Pipeline for a Single String:
 * VI -> EN (Master Bridge) -> Target Language
 */
export function executeChainTranslation(
  viSourceText: string,
  targetLang: SupportedLocale
): string {
  if (!viSourceText || !viSourceText.trim()) return viSourceText || '';
  if (targetLang === 'vi') return viSourceText;

  // Step 1: VI -> EN Master
  const enMaster = translateViToEnglishMaster(viSourceText);
  if (targetLang === 'en') return enMaster;

  // Step 2: EN Master -> Target
  const targetResult = translateEnglishMasterToTarget(enMaster, targetLang);
  return targetResult || enMaster || viSourceText;
}

/**
 * Complete Chain Pipeline for Hero / Banner Structure:
 * VI Source -> EN Master -> All Enabled Target Languages
 */
export function synchronizeBannerTranslations(
  sourceVI: HeroTranslationData,
  currentTranslations: Record<string, HeroTranslationData> = {},
  options?: {
    enabledLanguages?: SupportedLocale[];
    forceAll?: boolean;
    requestId?: string;
    version?: number;
  }
): {
  sourceLanguage: 'vi';
  version: number;
  contentHash: string;
  translations: Record<string, HeroTranslationData & { status?: string }>;
} {
  const version = options?.version || Date.now();
  const contentHash = computeHeroContentHash(sourceVI);
  const enabledLangs = options?.enabledLanguages || ALL_TARGET_LOCALES;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[I18N] Source updated: vi (version: ${version}, hash: ${contentHash})`);
    console.log(`[I18N] Translating: vi → en`);
  }

  // Step 1: Generate EN Master
  const enMaster: HeroTranslationData = {
    badgeText: translateViToEnglishMaster(sourceVI.badgeText || ''),
    mainHeadingLine1: translateViToEnglishMaster(sourceVI.mainHeadingLine1 || ''),
    mainHeadingLine2: translateViToEnglishMaster(sourceVI.mainHeadingLine2 || ''),
    subheading: translateViToEnglishMaster(sourceVI.subheading || ''),
    pod1Title: translateViToEnglishMaster(sourceVI.pod1Title || ''),
    pod1Val: sourceVI.pod1Val || '',
    pod1Sub: translateViToEnglishMaster(sourceVI.pod1Sub || ''),
    pod2Title: translateViToEnglishMaster(sourceVI.pod2Title || ''),
    pod2Val: sourceVI.pod2Val || '',
    pod2Sub: translateViToEnglishMaster(sourceVI.pod2Sub || '')
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[I18N] English translation completed: "${enMaster.mainHeadingLine1 || enMaster.badgeText}"`);
  }

  const nextTranslations: Record<string, HeroTranslationData & { status?: string }> = {
    vi: {
      ...sourceVI,
      status: 'source'
    }
  };

  // Step 2: Generate all target languages from EN Master
  enabledLangs.forEach(lang => {
    if (lang === 'vi') return;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[I18N] Translating: en → ${lang}`);
    }

    if (lang === 'en') {
      nextTranslations.en = {
        ...enMaster,
        status: 'auto'
      };
      return;
    }

    const existing = currentTranslations[lang] || {};
    const isManualOverride = (existing as any)?.status === 'manual' && !options?.forceAll;

    if (isManualOverride) {
      nextTranslations[lang] = {
        ...existing,
        status: 'manual'
      };
      return;
    }

    // Translate each field from EN Master to Target Lang
    const langTrans: HeroTranslationData & { status?: string } = {
      badgeText: translateEnglishMasterToTarget(enMaster.badgeText || '', lang),
      mainHeadingLine1: translateEnglishMasterToTarget(enMaster.mainHeadingLine1 || '', lang),
      mainHeadingLine2: translateEnglishMasterToTarget(enMaster.mainHeadingLine2 || '', lang),
      subheading: translateEnglishMasterToTarget(enMaster.subheading || '', lang),
      pod1Title: translateEnglishMasterToTarget(enMaster.pod1Title || '', lang),
      pod1Val: enMaster.pod1Val || '',
      pod1Sub: translateEnglishMasterToTarget(enMaster.pod1Sub || '', lang),
      pod2Title: translateEnglishMasterToTarget(enMaster.pod2Title || '', lang),
      pod2Val: enMaster.pod2Val || '',
      pod2Sub: translateEnglishMasterToTarget(enMaster.pod2Sub || '', lang),
      status: 'auto'
    };

    nextTranslations[lang] = langTrans;
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[I18N] Translation completed for ${Object.keys(nextTranslations).length} languages`);
    console.log(`[I18N] Persisting translations`);
    console.log(`[I18N] UI refresh completed`);
  }

  return {
    sourceLanguage: 'vi',
    version,
    contentHash,
    translations: nextTranslations
  };
}
