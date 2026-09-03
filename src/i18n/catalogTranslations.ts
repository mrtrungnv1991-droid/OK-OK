import { Product, GroupPool, GameItem, CategoryItem, ProductReview, HeroCustomConfig, HeroTranslationData } from '../types';
import { SupportedLocale } from './types';
import { CATEGORY_TRANSLATIONS } from './catalogData/categories';
import { ALL_PRODUCTS_DATA } from './catalogData/allProductsData';
import { 
  executeChainTranslation, 
  translateViToEnglishMaster, 
  translateEnglishMasterToTarget, 
  synchronizeBannerTranslations,
  computeHeroContentHash
} from './bannerTranslationPipeline';

export interface LocalizedProductData {
  title: string;
  subtitle: string;
  description: string;
  deliveryEstimate: string;
  features: string[];
  instructions: string[];
  tags: string[];
  pools?: Record<string, string>;
}

// 21 Products x 9 Languages Dictionary
export const PRODUCT_TRANSLATIONS: Record<string, Record<string, LocalizedProductData>> = {
  'prod-chatgpt-plus': {
    vi: {
      title: 'ChatGPT Plus & Codex Team Seat (30 Ngày)',
      subtitle: 'Slot riêng tư trong OpenAI Team Workspace, GPT-4o, Canvas & DALL·E 3 không giới hạn tốc độ',
      deliveryEstimate: 'Tự động duyệt ngay khi đủ 5 slot',
      description: 'Mua chung gói OpenAI Business/Team Workspace bản quyền chính hãng. Mỗi người nhận một invite slot riêng biệt vào email cá nhân, bảo mật lịch sử chat 100%, không bị out tài khoản.',
      features: ['Truy cập GPT-4o, GPT-4.5 Preview & o3-mini', 'Code Interpreter, Advanced Voice Mode & Canvas', 'Slot riêng tư (Private Workspace Member)', 'Bảo hành trọn vẹn 30 ngày qua ví Escrow'],
      instructions: ['1. Tham gia slot trong pool đang mở hoặc tạo pool mới', '2. Khi đủ 5/5 người, hệ thống tự động gửi link mời Workspace vào email của bạn', '3. Chấp nhận lời mời để kích hoạt ChatGPT Plus ngay lập tức'],
      tags: ['OpenAI', 'GPT-4o', 'AI Tools', 'Team Workspace', 'Code Interpreter'],
      pools: { 'pool-gpt-881': 'Nhóm OpenAI Team Pro Batch #881' }
    },
    en: {
      title: 'ChatGPT Plus & Codex Team Seat (30 Days)',
      subtitle: 'Private seat in OpenAI Team Workspace, unlimited GPT-4o, Canvas & DALL·E 3 speed',
      deliveryEstimate: 'Auto-dispatched immediately once 5 slots are filled',
      description: 'Official OpenAI Business/Team Workspace group buy license. Each user receives a dedicated invite sent directly to their personal email with 100% private chat history and no logouts.',
      features: ['Full access to GPT-4o, GPT-4.5 Preview & o3-mini', 'Code Interpreter, Advanced Voice Mode & Canvas', 'Dedicated Private Workspace Member seat', 'Full 30-day Escrow warranty protection'],
      instructions: ['1. Join an open pool slot or create a new group pool', '2. When 5/5 members join, system sends the Workspace invite link to your email', '3. Accept the invite to activate ChatGPT Plus instantly'],
      tags: ['OpenAI', 'GPT-4o', 'AI Tools', 'Team Workspace', 'Code Interpreter'],
      pools: { 'pool-gpt-881': 'OpenAI Team Pro Batch #881' }
    },
    zh: {
      title: 'ChatGPT Plus & Codex 团队席位 (30天)',
      subtitle: 'OpenAI Team 工作区独立席位，无限速 GPT-4o、Canvas 与 DALL·E 3',
      deliveryEstimate: '满 5 人自动秒级发货',
      description: '官方正版 OpenAI Business/Team 团队拼团方案。每个成员通过个人邮箱接收专属邀请链接，对话记录100%独立私密，永不掉线。',
      features: ['畅享 GPT-4o、GPT-4.5 Preview 及 o3-mini 模型', '代码解释器、高级语音模式与 Canvas 画布', '专属独立工作区成员席位 (Private Workspace)', '30 天 CyberPool 智能合约全额担保'],
      instructions: ['1. 加入正在开放的拼团席位或发起新拼团', '2. 满员后系统自动将官方邀请链接发送至您的邮箱', '3. 点击接受邀请即可立即激活 ChatGPT Plus 权益'],
      tags: ['OpenAI', 'GPT-4o', 'AI工具', '团队工作区', '代码解释器'],
      pools: { 'pool-gpt-881': 'OpenAI Team Pro 拼团批次 #881' }
    },
    ja: {
      title: 'ChatGPT Plus & Codex チームシート (30日間)',
      subtitle: 'OpenAI Team ワークスペース専用シート、GPT-4o・Canvas・DALL·E 3 高速無制限',
      deliveryEstimate: '5スロット満員時に自動即時納品',
      description: 'OpenAI Business/Team Workspace の公式グループ購入プラン。個人メール宛に専用招待リンクが届き、チャット履歴は100%完全プライベートで保護されます。',
      features: ['GPT-4o、GPT-4.5 Preview、o3-mini に完全対応', 'Code Interpreter、高度音声モード、Canvas', '完全個別プライベートワークスペース席', 'CyberPool エスクローによる30日間完全保証'],
      instructions: ['1. 募集中のスロットに参加するか新規プールを作成', '2. 5/5名揃い次第、招待リンクがメールに自動送信されます', '3. 招待を承諾して即座に ChatGPT Plus を有効化'],
      tags: ['OpenAI', 'GPT-4o', 'AIツール', 'チームワークスペース'],
      pools: { 'pool-gpt-881': 'OpenAI Team Pro バッチ #881' }
    },
    ko: {
      title: 'ChatGPT Plus & Codex 팀 시트 (30일권)',
      subtitle: 'OpenAI Team 워크스페이스 독립 시트, 무제한 GPT-4o, Canvas 및 DALL·E 3 속도',
      deliveryEstimate: '5명 모집 완료 즉시 자동 발송',
      description: '공식 OpenAI Business/Team Workspace 공동 구매 라이선스. 개인 이메일로 전송되는 독립 초대 링크로 100% 프라이빗 대화 기록 보장 및 계정 튕김 없음.',
      features: ['GPT-4o, GPT-4.5 Preview 및 o3-mini 풀 액세스', 'Code Interpreter, 고급 음성 모드 및 Canvas', '독립 개인 워크스페이스 멤버 시트', '에스크로 스마트 컨트랙트 30일 완전 보증'],
      instructions: ['1. 오픈된 풀에 참여하거나 새 그룹 풀 생성', '2. 5명 완료 시 이메일로 워크스페이스 초대 링크 자동 발송', '3. 초대 수락 후 즉시 ChatGPT Plus 활성화'],
      tags: ['OpenAI', 'GPT-4o', 'AI 도구', '팀 워크스페이스'],
      pools: { 'pool-gpt-881': 'OpenAI Team Pro 그룹 #881' }
    },
    ru: {
      title: 'ChatGPT Plus & Codex Team Seat (30 дней)',
      subtitle: 'Персональный слот в OpenAI Team Workspace, безлимитный доступ к GPT-4o, Canvas и DALL·E 3',
      deliveryEstimate: 'Автодоставка сразу после набора 5 участников',
      description: 'Официальная подписка OpenAI Team Workspace через групповую закупку. Приглашение отправляется на ваш личный e-mail, история диалогов на 100% приватна.',
      features: ['Доступ к GPT-4o, GPT-4.5 Preview и o3-mini', 'Интерпретатор кода, расширенный голосовой режим и Canvas', 'Личный закрытый слот в Team Workspace', 'Полная 30-дневная гарантия через Escrow'],
      instructions: ['1. Присоединитесь к пулу или создайте новый', '2. После набора 5 участников инвайт-ссылка придет на почту', '3. Примите приглашение для мгновенной активации Plus'],
      tags: ['OpenAI', 'GPT-4o', 'AI инструменты', 'Team Workspace'],
      pools: { 'pool-gpt-881': 'OpenAI Team Pro Пул #881' }
    },
    fr: {
      title: 'ChatGPT Plus & Codex Team Seat (30 Jours)',
      subtitle: 'Siège privé dans OpenAI Team Workspace, vitesse illimitée GPT-4o, Canvas & DALL·E 3',
      deliveryEstimate: 'Attribution automatique dès que les 5 slots sont complets',
      description: 'Licence officielle OpenAI Business/Team Workspace en achat groupé. Chaque membre reçoit une invitation directe sur son e-mail personnel, historique 100% privé.',
      features: ['Accès complet à GPT-4o, GPT-4.5 Preview & o3-mini', 'Interpréteur de code, mode vocal avancé & Canvas', 'Siège membre privé dédié (Private Workspace)', 'Garantie totale 30 jours via séquestre Escrow'],
      instructions: ['1. Rejoignez un slot ouvert ou créez un nouveau groupe', '2. Dès 5 participants, le lien d’invitation est envoyé par e-mail', '3. Acceptez l’invitation pour activer ChatGPT Plus instantanément'],
      tags: ['OpenAI', 'GPT-4o', 'Outils IA', 'Espace Équipe'],
      pools: { 'pool-gpt-881': 'Groupe OpenAI Team Pro #881' }
    },
    de: {
      title: 'ChatGPT Plus & Codex Team Seat (30 Tage)',
      subtitle: 'Privater Platz im OpenAI Team Workspace, unbegrenztes Tempo für GPT-4o, Canvas & DALL·E 3',
      deliveryEstimate: 'Automatische Zustellung sofort nach 5 Teilnehmern',
      description: 'Offizielles OpenAI Business/Team Workspace Gruppenkauf-Abonnement. Jeder Nutzer erhält eine persönliche Einladung per E-Mail mit 100% privatem Chat-Verlauf.',
      features: ['Zugang zu GPT-4o, GPT-4.5 Preview & o3-mini', 'Code Interpreter, Advanced Voice Mode & Canvas', 'Eigener privater Workspace-Platz', 'Volle 30 Tage Garantie über Escrow-Treuhand'],
      instructions: ['1. Offenem Pool beitreten oder neuen Pool erstellen', '2. Bei 5 Teilnehmern wird der Einladungslink per E-Mail versendet', '3. Einladung annehmen und ChatGPT Plus sofort nutzen'],
      tags: ['OpenAI', 'GPT-4o', 'KI-Tools', 'Team Workspace'],
      pools: { 'pool-gpt-881': 'OpenAI Team Pro Gruppe #881' }
    },
    es: {
      title: 'ChatGPT Plus & Codex Team Seat (30 Días)',
      subtitle: 'Espacio privado en OpenAI Team Workspace, velocidad ilimitada en GPT-4o, Canvas y DALL·E 3',
      deliveryEstimate: 'Entrega automática inmediata al completar los 5 slots',
      description: 'Licencia oficial de compra grupal de OpenAI Business/Team Workspace. Cada usuario recibe una invitación a su correo personal con historial 100% privado.',
      features: ['Acceso total a GPT-4o, GPT-4.5 Preview y o3-mini', 'Intérprete de código, modo de voz avanzado y Canvas', 'Espacio privado exclusivo (Private Workspace Member)', 'Garantía total de 30 días mediante contrato Escrow'],
      instructions: ['1. Únete a un slot disponible o crea un nuevo grupo', '2. Al completarse 5 miembros, el sistema envía la invitación a tu email', '3. Acepta la invitación para activar ChatGPT Plus al instante'],
      tags: ['OpenAI', 'GPT-4o', 'Herramientas IA', 'Workspace'],
      pools: { 'pool-gpt-881': 'Grupo OpenAI Team Pro #881' }
    }
  },

  'prod-black-myth-wukong': {
    vi: {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Bản quyền Steam kích hoạt toàn cầu (Global Key), đồ hoạ đỉnh cao Unreal Engine 5',
      deliveryEstimate: 'Bàn giao key tự động vào Cyber Vault ngay khi chốt deal',
      description: 'Chương trình gom sỉ Steam Key từ nhà phân phối uỷ quyền khu vực SEA. Khi gom đủ lốc 4 keys, giá chỉ còn một nửa so với giá niêm yết trên Steam Store.',
      features: ['Kích hoạt trên tài khoản Steam chính chủ', 'Chơi online, cloud save và thành tựu đầy đủ', 'Không cần đổi vùng (VPN/Region-Free)', 'Bảo hành vĩnh viễn không bị thu hồi'],
      instructions: ['1. Tham gia nhóm gom key đang mở', '2. Khi đủ 4 người mua, Cyber Escrow tự động phân bổ mã key vào Vault', '3. Kích hoạt mã trên Steam Client: Games -> Activate a Product on Steam'],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key', 'Game of the Year'],
      pools: { 'pool-wukong-402': 'Gom sỉ Black Myth Wukong Lốc #402' }
    },
    en: {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Global activation Steam CDKey with cutting-edge Unreal Engine 5 graphics',
      deliveryEstimate: 'Automated CDKey delivery to Cyber Vault upon deal completion',
      description: 'Wholesale group buy for Steam Keys from authorized SEA distributors. When a batch of 4 keys is completed, the price is cut in half compared to the official Steam Store retail price.',
      features: ['Activates directly on your personal Steam account', 'Full online features, cloud saves, and Steam achievements', 'Region-free global activation (no VPN required)', 'Lifetime warranty against revocation'],
      instructions: ['1. Join an open wholesale group pool', '2. When 4 buyers join, Cyber Escrow instantly issues your Steam key to your Vault', '3. Redeem in Steam Client: Games -> Activate a Product on Steam'],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key', 'Game of the Year'],
      pools: { 'pool-wukong-402': 'Black Myth: Wukong Group Pool Batch #402' }
    },
    zh: {
      title: 'Steam CDKey: 黑神话：悟空 (全球版 Global Key)',
      subtitle: 'Steam 全球激活正版密钥，虚幻5引擎顶级视效国风动作巨作',
      deliveryEstimate: '成团后自动将 CDKey 存入 Cyber 保险库',
      description: '来自官方授权批发渠道的拼团批发方案。每团集齐4人即可享受半价折扣，相比 Steam 官方商店省去大笔费用。',
      features: ['直接激活至您本人的 Steam 个人主账号', '支持完整云存档、成就系统与在线内容', '全球无锁区激活（无需挂载任何 VPN）', '终身质保保障，永不召回'],
      instructions: ['1. 加入正在拼团的席位或发起新团', '2. 满4人后 Cyber Escrow 智能合约自动将 CDKey 派发至您的保险库', '3. 打开 Steam 客户端 -> 游戏 -> 在 Steam 上激活产品'],
      tags: ['Steam', '动作RPG', '虚幻5', '全球Key', '年度大作'],
      pools: { 'pool-wukong-402': '黑神话：悟空 4人成团批次 #402' }
    },
    ja: {
      title: 'Steam Key: 黒神話：悟空 (Global Key)',
      subtitle: 'Steam グローバル有効化対応、Unreal Engine 5 採用の超大作アクションRPG',
      deliveryEstimate: '成約後すぐに Cyber Vault にキーを自動配信',
      description: '正規代理店卸売りによる Steam キー共同購入。4名のグループ成立で、Steam ストア定価の半額で入手可能です。',
      features: ['ご自身の Steam 本アカウントに直接登録可能', 'クラウドセーブ・実績機能・オンライン完全対応', '国・地域制限なし（VPN不要のグローバル版）', '無効化防止の永久保証付き'],
      instructions: ['1. 進行中の共同購入プールに参加', '2. 4名揃った時点で Cyber Escrow が自動でキーを発行', '3. Steam クライアントを開き「ゲーム」→「Steam でアイテムを有効化」'],
      tags: ['Steam', 'アクションRPG', 'Unreal Engine 5', 'Global Key'],
      pools: { 'pool-wukong-402': '黒神話：悟空 グループ購入バッチ #402' }
    },
    ko: {
      title: 'Steam Key: 검은 신화: 오공 (글로벌 키)',
      subtitle: '언리얼 엔진 5 기반 Steam 글로벌 활성화 정품 CDKey',
      deliveryEstimate: '그룹 달성 즉시 Cyber Vault로 CDKey 자동 지급',
      description: '공식 유통사 도매 단체 구매 프로그램. 4인 그룹 완성 시 Steam 공식 스토어 정가 대비 50% 할인된 가격으로 제공됩니다.',
      features: ['개인 Steam 본계정에 직접 등록 및 영구 소장', '클라우드 동기화, 업적 및 멀티플레이 완전 지원', '국가 제한 없는 글로벌 키 (VPN 불필요)', '회수 없는 평생 정품 보증'],
      instructions: ['1. 진행 중인 도매 그룹에 참여', '2. 4명 모집 시 Cyber Escrow가 볼트로 키 자동 배정', '3. Steam 클라이언트 -> 게임 -> Steam에 제품 등록'],
      tags: ['Steam', '액션RPG', 'Unreal Engine 5', '글로벌 키'],
      pools: { 'pool-wukong-402': '검은 신화: 오공 도매 그룹 #402' }
    },
    ru: {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Официальный ключ Steam без региональных ограничений на движке Unreal Engine 5',
      deliveryEstimate: 'Автоматическая выдача ключа в Cyber Vault сразу после завершения пула',
      description: 'Оптовая закупка ключей у авторизованного дистрибьютора. При наборе 4 человек цена вдвое ниже, чем в официальном магазине Steam.',
      features: ['Активация на ваш личный основной аккаунт Steam', 'Облачные сохранения, достижения и онлайн', 'Global Key без ограничений региона (VPN не требуется)', 'Пожизненная гарантия от отзыва ключа'],
      instructions: ['1. Присоединитесь к пулу оптовой закупки', '2. При наборе 4 участников ключ появится в вашем Vault', '3. Активируйте в Steam: Игры -> Активировать в Steam'],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: { 'pool-wukong-402': 'Black Myth Wukong Оптовый Пул #402' }
    },
    fr: {
      title: 'Clé Steam : Black Myth Wukong (Clé Globale)',
      subtitle: 'Activation mondiale sur Steam, graphismes de pointe sous Unreal Engine 5',
      deliveryEstimate: 'Attribution automatique de la clé dans votre Cyber Vault',
      description: 'Achat groupé de clés Steam auprès d’un distributeur officiel. En complétant un groupe de 4 personnes, le prix est réduit de 50% par rapport au Steam Store.',
      features: ['Activation directe sur votre compte Steam personnel', 'Sauvegardes dans le cloud, succès et fonctionnalités en ligne', 'Clé mondiale sans restriction de région (sans VPN)', 'Garantie à vie contre toute révocation'],
      instructions: ['1. Rejoignez un groupe d’achat en cours', '2. Dès 4 participants, la clé est délivrée dans votre Vault', '3. Activez sur Steam : Jeux -> Activer un produit sur Steam'],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: { 'pool-wukong-402': 'Groupe d’achat Black Myth Wukong #402' }
    },
    de: {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Weltweite Steam-Aktivierung, Next-Gen Grafik mit Unreal Engine 5',
      deliveryEstimate: 'Sofortige automatische Schlüsselbereitstellung im Cyber Vault',
      description: 'Großhandels-Sammelkauf für offizielle Steam-Keys. Bei 4 Teilnehmern halbiert sich der Preis im Vergleich zum regulären Steam Store.',
      features: ['Direkte Aktivierung auf dem eigenen Steam-Account', 'Volle Cloud-Saves, Errungenschaften und Online-Funktionen', 'Keine Regionalsperre (weltweit ohne VPN aktivierbar)', 'Lebenslange Garantie gegen Deaktivierung'],
      instructions: ['1. Offenem Großhandels-Pool beitreten', '2. Nach 4 Käufern wird der Key im Vault hinterlegt', '3. Im Steam-Client aktivieren: Spiele -> Produkt bei Steam aktivieren'],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: { 'pool-wukong-402': 'Black Myth Wukong Sammelgruppe #402' }
    },
    es: {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Activación global en Steam, gráficos de última generación en Unreal Engine 5',
      deliveryEstimate: 'Entrega automática del CDKey a tu Cyber Vault al cerrar la compra',
      description: 'Programa de compra mayorista de Steam Keys. Al completar un grupo de 4 personas, el precio se reduce a la mitad en comparación con la tienda de Steam.',
      features: ['Activación directa en tu cuenta personal de Steam', 'Guardado en la nube, logros y funciones online completas', 'Clave global sin restricciones de región (sin VPN)', 'Garantía de por vida contra revocación'],
      instructions: ['1. Únete a un grupo de compra abierto', '2. Al completarse 4 miembros, el código se asigna a tu Vault', '3. Activa en Steam: Juegos -> Activar un producto en Steam'],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: { 'pool-wukong-402': 'Grupo Black Myth Wukong #402' }
    }
  },

  'prod-giftup-card-50': {
    vi: {
      title: 'Thẻ Quà Tặng Số GiftUp Card $50 USD (Digital Voucher)',
      subtitle: 'Mã quà tặng số đa năng nạp Steam, Amazon, Apple & Google Play thanh toán quốc tế',
      deliveryEstimate: 'Cấp mã thẻ + PIN vào Vault ngay lập tức',
      description: 'Voucher số GiftUp Card mệnh giá $50 USD, bảo mật bằng mã PIN 4 số. Dùng quy đổi đa nền tảng hoặc nạp ví dịch vụ quốc tế không cần thẻ tín dụng.',
      features: ['Quy đổi đa nền tảng (Steam, Amazon, Apple, Google)', 'Bảo mật tuyệt đối qua mã PIN 4 số', 'Không giới hạn thời gian sử dụng', 'Bảo hiểm hoàn tiền 100% qua Escrow'],
      instructions: ['1. Chọn số lượng thẻ và xác nhận thanh toán', '2. Nhận mã thẻ và PIN trực tiếp trong Vault', '3. Nạp vào trang đối tác hoặc hệ thống GiftUp'],
      tags: ['Thẻ quà tặng', 'Digital Voucher', 'Thẻ USD', 'Đa nền tảng'],
      pools: { 'pool-giftup-992': 'Pool GiftUp Card $50 USD Batch #992' }
    },
    en: {
      title: 'GiftUp Card $50 USD Digital Voucher',
      subtitle: 'Multi-purpose digital gift voucher for Steam, Amazon, Apple & Google Play',
      deliveryEstimate: 'Instant card code + PIN delivery to Cyber Vault',
      description: '$50 USD face value GiftUp digital voucher secured by a 4-digit PIN. Can be redeemed across multiple international platforms without a credit card.',
      features: ['Multi-platform conversion (Steam, Amazon, Apple, Google)', 'Safe and secure with 4-digit PIN authentication', 'No expiration date, redeem anytime', '100% money-back escrow guarantee'],
      instructions: ['1. Select quantity and confirm payment', '2. Receive card number and PIN in your Vault', '3. Redeem directly at partner merchants or GiftUp portal'],
      tags: ['Gift Card', 'Digital Voucher', 'USD Card', 'Multi-Platform'],
      pools: { 'pool-giftup-992': 'GiftUp Card $50 USD Batch #992' }
    },
    zh: {
      title: 'GiftUp 50美元多功能数字礼品卡 (Digital Voucher)',
      subtitle: '支持充值 Steam、Amazon、Apple 与 Google Play 的通用国际礼品卡',
      deliveryEstimate: '卡密与 PIN 码即刻存入保险库',
      description: '面额 50 美元的 GiftUp 数字礼品卡，配备4位数安全 PIN 码。无需国际信用卡即可轻松在各大海外平台消费与充值。',
      features: ['支持跨平台兑换（Steam、Amazon、Apple、Google）', '配备4位安全 PIN 码，安全无忧', '无使用有效期限制，随时可兑换', '智能合约全额质保，假一赔十'],
      instructions: ['1. 选择数量并完成支付', '2. 在保险库中获取卡号与 PIN 码', '3. 在指定商户或 GiftUp 官方通道兑换'],
      tags: ['礼品卡', '数字礼品券', 'USD充值卡', '多平台通用'],
      pools: { 'pool-giftup-992': 'GiftUp 50美元礼品卡拼团 #992' }
    },
    ja: {
      title: 'GiftUp デジタルギフトカード $50 USD (Digital Voucher)',
      subtitle: 'Steam・Amazon・Apple・Google Play 対応の多機能国際ギフトバウチャー',
      deliveryEstimate: 'カード番号とPINコードをVaultに即時配信',
      description: '額面50ドルのGiftUpデジタルバウチャー。4桁の暗証番号（PIN）付きで、クレジットカードなしで各種国際サービスで利用可能です。',
      features: ['複数プラットフォーム対応（Steam、Amazon、Apple、Google）', '4桁PINコードによる高いセキュリティ', '有効期限なし、いつでも利用可能', 'エスクローによる100%返金保証'],
      instructions: ['1. 数量を選択して支払いを確定', '2. Vaultでカード番号とPINを確認', '3. 対象サイトまたはGiftUpポータルで引き換え'],
      tags: ['ギフトカード', 'デジタルバウチャー', 'USDカード'],
      pools: { 'pool-giftup-992': 'GiftUp $50 ギフトカード バッチ #992' }
    },
    ko: {
      title: 'GiftUp $50 USD 디지털 기프트 카드 (Digital Voucher)',
      subtitle: 'Steam, Amazon, Apple 및 Google Play 충전 지원 다목적 글로벌 바우처',
      deliveryEstimate: '카드 번호 및 PIN 즉시 볼트 발송',
      description: '$50 달러 상당의 GiftUp 디지털 기프트 카드로 4자리 보안 PIN이 포함됩니다. 해외 신용카드 없이도 다양한 글로벌 플랫폼에서 자유롭게 사용 가능합니다.',
      features: ['다양한 플랫폼 전환 가능 (Steam, Amazon, Apple, Google)', '4자리 PIN 보안 인증으로 안전한 이용', '유효기간 제한 없음, 언제든 사용 가능', '에스크로 스마트 컨트랙트 100% 보증'],
      instructions: ['1. 수량 선택 및 결제 완료', '2. 볼트에서 카드 번호 및 PIN 확인', '3. 지원 가맹점 또는 GiftUp 포털에서 등록'],
      tags: ['기프트카드', '디지털바우처', 'USD카드'],
      pools: { 'pool-giftup-992': 'GiftUp $50 USD 그룹 #992' }
    },
    ru: {
      title: 'GiftUp Card $50 USD Digital Voucher',
      subtitle: 'Универсальная подарочная карта для Steam, Amazon, Apple и Google Play',
      deliveryEstimate: 'Мгновенная доставка кода карты и PIN в Cyber Vault',
      description: 'Цифровой ваучер GiftUp номиналом $50 с 4-значным PIN-кодом. Позволяет пополнять баланс на международных сервисах без банковской карты.',
      features: ['Поддержка множества сервисов (Steam, Amazon, Apple, Google)', 'Защита 4-значным PIN-кодом', 'Без срока действия, активация в любое время', '100% гарантия возврата средств через Escrow'],
      instructions: ['1. Выберите количество и подтвердите заказ', '2. Получите номер карты и PIN в вашем Vault', '3. Активируйте на сайте партнера или GiftUp'],
      tags: ['Подарочная карта', 'Цифровой ваучер', 'USD Карта'],
      pools: { 'pool-giftup-992': 'GiftUp Card $50 USD Пул #992' }
    },
    fr: {
      title: 'Carte Cadeau GiftUp $50 USD (Voucher Digital)',
      subtitle: 'Bon d’achat numérique universel pour Steam, Amazon, Apple & Google Play',
      deliveryEstimate: 'Livraison instantanée du code et PIN dans le Vault',
      description: 'Voucher numérique GiftUp d’une valeur de 50 $ USD sécurisé par un code PIN à 4 chiffres. Utilisable sur de nombreuses plateformes sans carte bancaire.',
      features: ['Conversion multi-plateformes (Steam, Amazon, Apple, Google)', 'Sécurisé par code PIN à 4 chiffres', 'Aucune date d’expiration', 'Garantie séquestre 100%'],
      instructions: ['1. Choisissez la quantité et validez la commande', '2. Récupérez le numéro de carte et PIN dans votre Vault', '3. Utilisez le code sur la plateforme de votre choix'],
      tags: ['Carte Cadeau', 'Voucher Digital', 'Carte USD'],
      pools: { 'pool-giftup-992': 'Groupe GiftUp Card $50 USD #992' }
    },
    de: {
      title: 'GiftUp Gutscheinkarte $50 USD (Digital Voucher)',
      subtitle: 'Universeller digitaler Gutschein für Steam, Amazon, Apple & Google Play',
      deliveryEstimate: 'Sofortige Kartencode- und PIN-Bereitstellung im Vault',
      description: 'Digitaler GiftUp-Gutschein im Wert von 50 USD mit 4-stelligem PIN-Code. Kann ohne internationale Kreditkarte auf weltweiten Plattformen eingelöst werden.',
      features: ['Multiformat-Einlösung (Steam, Amazon, Apple, Google)', '4-stelliger PIN-Sicherheitsschutz', 'Kein Verfallsdatum', '100% Escrow-Käuferschutz'],
      instructions: ['1. Menge wählen und Kauf abschließen', '2. Kartennummer und PIN im Vault abrufen', '3. Beim gewünschten Händler einlösen'],
      tags: ['Gutscheinkarte', 'Digitaler Gutschein', 'USD-Karte'],
      pools: { 'pool-giftup-992': 'GiftUp Card $50 USD Gruppe #992' }
    },
    es: {
      title: 'Tarjeta de Regalo GiftUp $50 USD (Cupón Digital)',
      subtitle: 'Cupón digital multiusos para recargar Steam, Amazon, Apple y Google Play',
      deliveryEstimate: 'Entrega instantánea de número de tarjeta y PIN en tu Vault',
      description: 'Voucher digital GiftUp de $50 USD protegido por código PIN de 4 dígitos. Úsalo para compras y recargas internacionales sin necesidad de tarjeta de crédito.',
      features: ['Conversión multiplataforma (Steam, Amazon, Apple, Google)', 'Seguridad garantizada con PIN de 4 dígitos', 'Sin fecha de caducidad', 'Garantía de reembolso 100% por Escrow'],
      instructions: ['1. Selecciona la cantidad y completa el pago', '2. Recibe el código y PIN en tu Vault', '3. Canjea en el portal de GiftUp o en el comercio seleccionado'],
      tags: ['Tarjeta de Regalo', 'Cupón Digital', 'Tarjeta USD'],
      pools: { 'pool-giftup-992': 'Grupo GiftUp Card $50 USD #992' }
    }
  },

  'prod-midjourney-pro': {
    vi: {
      title: 'Midjourney Pro Plan (Slot Riêng / Shared Fast Hours)',
      subtitle: '60 giờ Fast GPU, chế độ Stealth Mode ẩn ảnh riêng tư, 12 jobs đồng thời',
      deliveryEstimate: 'Kích hoạt tài khoản trong vòng 5 phút',
      description: 'Gom nhóm tài khoản Midjourney Pro bản quyền cấp cao nhất. Cho phép render tranh AI không giới hạn ở chế độ Relax và 60 giờ Fast GPU tốc độ cao nhất.',
      features: ['60h Fast GPU + Relax Mode không giới hạn', 'Chế độ Stealth Mode ẩn ảnh sáng tạo riêng tư', 'Chạy 12 jobs đồng thời không phải xếp hàng', 'Bảo hành tài khoản 30 ngày'],
      instructions: ['1. Nhận thông tin đăng nhập hoặc slot invite Discord', '2. Kết nối Bot Midjourney vào server riêng', '3. Thỏa sức sáng tạo đồ họa prompt AI'],
      tags: ['Midjourney', 'Generative AI', 'Art & Design', 'Stealth Mode'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro Plan Batch #330' }
    },
    en: {
      title: 'Midjourney Pro Plan (Dedicated Slot / Shared Fast Hours)',
      subtitle: '60 Fast GPU hours, Stealth Mode for private generation, 12 concurrent jobs',
      deliveryEstimate: 'Account activated within 5 minutes',
      description: 'Top-tier Midjourney Pro Plan group license. Enjoy unlimited Relax mode image generation and 60 hours of blazing-fast GPU rendering with full Stealth privacy.',
      features: ['60h Fast GPU + Unlimited Relax Mode generation', 'Stealth Mode for private image creation', '12 concurrent fast jobs without queuing', 'Full 30-day account warranty protection'],
      instructions: ['1. Receive login details or Discord workspace invite', '2. Add Midjourney Bot to your private Discord server', '3. Generate stunning high-res AI artwork without limits'],
      tags: ['Midjourney', 'Generative AI', 'Art & Design', 'Stealth Mode'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro Plan Batch #330' }
    },
    zh: {
      title: 'Midjourney Pro 专业版方案 (独立席位 / 共享高速算力)',
      subtitle: '60小时 Fast GPU 高速算力，Stealth 隐私隐身生成模式，支持12个并发任务',
      deliveryEstimate: '5分钟内极速激活',
      description: '最高等级 Midjourney Pro 官方拼团方案。畅享 60 小时极速 Fast GPU 算力、无限量 Relax 慢速生成及 Stealth 私密生图保护。',
      features: ['60小时 Fast GPU 算力 + 无限量 Relax 生成', 'Stealth 隐身模式保护商业隐私作品', '12个并发任务无需排队等待', '30天全额质保售后服务'],
      instructions: ['1. 接收 Discord 专属席位登录信息或邀请', '2. 将 Midjourney 机器人添加至专属服务器', '3. 尽情创作顶级 AI 艺术与商业设计'],
      tags: ['Midjourney', 'AI绘图', '艺术设计', '隐身模式'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro 拼团批次 #330' }
    },
    ja: {
      title: 'Midjourney Pro プラン (専用スロット / 高速GPU時間共有)',
      subtitle: '60時間高速GPU、非公開Stealthモード対応、最大12ジョブ同時実行',
      deliveryEstimate: '5分以内に即時アカウント有効化',
      description: '最上位 Midjourney Pro プランのグループ購入。無制限の Relax 生成と 60 時間の Fast GPU による最高速画像生成を完全プライベートで利用できます。',
      features: ['60h Fast GPU ＋ 無制限 Relax 生成', '作品を非公開にする Stealth モード完備', '待ち時間なしの 12 並列ジョブ実行', '30日間の完全動作保証'],
      instructions: ['1. Discord スロットの認証情報を受領', '2. 個人 Discord サーバーに Bot を追加', '3. 高精細 AI アートを快適に生成'],
      tags: ['Midjourney', '画像生成AI', 'デザイン'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro バッチ #330' }
    },
    ko: {
      title: 'Midjourney Pro 플랜 (전용 슬롯 / 고속 GPU 공유)',
      subtitle: '60시간 Fast GPU, 비공개 생성 스텔스 모드, 12개 동시 작업 지원',
      deliveryEstimate: '5분 이내 즉시 활성화',
      description: '최상위 Midjourney Pro 공식 공동구매 플랜. 60시간 Fast GPU 및 무제한 Relax 모드로 완벽한 스텔스 비공개 AI 그래픽을 생성하세요.',
      features: ['60시간 Fast GPU + 무제한 Relax 모드 생성', '개인 작품을 보호하는 Stealth 비공개 모드', '대기열 없는 12개 동시 작업 렌더링', '30일 전체 에스크로 보증'],
      instructions: ['1. Discord 슬롯 정보 또는 초대 수신', '2. 개인 디스코드 서버에 봇 추가', '3. 고해상도 AI 아트 무제한 생성 시작'],
      tags: ['Midjourney', '생성형 AI', '그래픽 디자인'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro 그룹 #330' }
    },
    ru: {
      title: 'Midjourney Pro Plan (Персональный слот / Fast GPU)',
      subtitle: '60 часов Fast GPU, Stealth режим скрытия артов, 12 параллельных задач',
      deliveryEstimate: 'Активация в течение 5 минут',
      description: 'Максимальный тариф Midjourney Pro через групповую закупку. 60 часов супербыстрого Fast GPU и безлимитный Relax режим с полным скрытием генераций.',
      features: ['60ч Fast GPU + безлимитный Relax режим', 'Режим Stealth для приватности артов', '12 одновременных задач без очередей', '30 дней гарантии на аккаунт'],
      instructions: ['1. Получите данные для входа в Discord', '2. Добавьте бота на личный сервер', '3. Генерируйте AI арты в максимальном качестве'],
      tags: ['Midjourney', 'Генеративный AI', 'Дизайн'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro Пул #330' }
    },
    fr: {
      title: 'Midjourney Pro Plan (Slot Dédié / Heures GPU Partagées)',
      subtitle: '60 heures Fast GPU, mode furtif Stealth privé, 12 tâches simultanées',
      deliveryEstimate: 'Activation en moins de 5 minutes',
      description: 'Forfait Midjourney Pro officiel en achat groupé. Profitez de 60 heures de rendu rapide Fast GPU et du mode Relax illimité avec confidentialité Stealth totale.',
      features: ['60h Fast GPU + rendu illimité en mode Relax', 'Mode Stealth pour cacher vos créations privées', '12 générations simultanées sans attente', 'Garantie de compte 30 jours'],
      instructions: ['1. Recevez les accès du compte Discord', '2. Ajoutez le bot sur votre serveur privé', '3. Créez des visuels IA époustouflants'],
      tags: ['Midjourney', 'IA Générative', 'Design Graphique'],
      pools: { 'pool-midjourney-330': 'Groupe Midjourney Pro #330' }
    },
    de: {
      title: 'Midjourney Pro Plan (Eigener Slot / Geteilte Fast Hours)',
      subtitle: '60 Std. Fast GPU, Stealth-Modus für private Bilder, 12 parallele Aufgaben',
      deliveryEstimate: 'Aktivierung innerhalb von 5 Minuten',
      description: 'Offizielles Midjourney Pro Premium-Gruppenabonnement. 60 Stunden Fast-GPU-Renderzeit und unbegrenzter Relax-Modus inklusive absolut privatem Stealth-Modus.',
      features: ['60 Std. Fast GPU + unbegrenzter Relax-Modus', 'Stealth-Modus für private Kunstwerke', '12 gleichzeitige Aufträge ohne Wartezeit', '30 Tage volle Garantie'],
      instructions: ['1. Zugangsdaten für Discord erhalten', '2. Bot zum eigenen Discord-Server hinzufügen', '3. Hochauflösende KI-Grafiken generieren'],
      tags: ['Midjourney', 'Generative KI', 'Design'],
      pools: { 'pool-midjourney-330': 'Midjourney Pro Gruppe #330' }
    },
    es: {
      title: 'Midjourney Pro Plan (Slot Exclusivo / Horas GPU Rápidas)',
      subtitle: '60 horas Fast GPU, modo Stealth privado, 12 trabajos simultáneos',
      deliveryEstimate: 'Activación en menos de 5 minutos',
      description: 'Licencia grupal del plan Pro de Midjourney. Disfruta de 60 horas de renderizado ultrarrápido y generación ilimitada en modo Relax con privacidad Stealth.',
      features: ['60h Fast GPU + generación ilimitada Relax', 'Modo Stealth para mantener tus obras privadas', '12 tareas concurrentes sin esperas', 'Garantía completa de 30 días'],
      instructions: ['1. Recibe los datos de acceso o invitación a Discord', '2. Añade el bot a tu servidor privado', '3. Crea arte digital con IA sin límites'],
      tags: ['Midjourney', 'IA Generativa', 'Diseño Gráfico'],
      pools: { 'pool-midjourney-330': 'Grupo Midjourney Pro #330' }
    }
  },

  'prod-netflix-4k': {
    vi: {
      title: 'Netflix Premium 4K UHD (Profile Riêng + Mã PIN 30 Ngày)',
      subtitle: 'Xem phim 4K HDR, âm thanh Dolby Atmos, 1 profile riêng tư kèm PIN cá nhân',
      deliveryEstimate: 'Bàn giao tài khoản và mã PIN ngay',
      description: 'Gói Netflix Premium Ultra HD chia sẻ profile hợp pháp. Mỗi người dùng 1 profile riêng có mã PIN bảo mật, lịch sử xem và danh sách yêu thích độc lập.',
      features: ['Chất lượng Ultra HD 4K & Dolby Atmos', 'Profile cá nhân kèm mã PIN bảo mật 4 số', 'Không bị lỗi vị trí hộ gia đình', 'Bảo hành full thời gian sử dụng'],
      instructions: ['1. Nhận email, password và tên profile được chỉ định', '2. Đăng nhập ứng dụng Netflix trên TV, điện thoại hoặc máy tính', '3. Nhập mã PIN và thưởng thức phim bom tấn'],
      tags: ['Netflix', 'Streaming', '4K UHD', 'Dolby Atmos'],
      pools: { 'pool-netflix-102': 'Nhóm Netflix 4K HDR Profile #102' }
    },
    en: {
      title: 'Netflix Premium 4K UHD (Private Profile + PIN 30 Days)',
      subtitle: 'Stream in 4K HDR, Dolby Atmos audio, 1 private profile with personal PIN',
      deliveryEstimate: 'Instant account & PIN credentials delivery',
      description: 'Official Netflix Premium Ultra HD shared profile plan. Each member has a private locked profile with a 4-digit PIN, dedicated watch history, and separate recommendations.',
      features: ['Ultra HD 4K & Dolby Atmos spatial audio', 'Private profile with custom 4-digit security PIN', 'Household-verified, no playback interruptions', 'Full duration escrow warranty'],
      instructions: ['1. Receive login email, password, and assigned profile name', '2. Sign in to Netflix app on TV, phone, or desktop', '3. Enter your private PIN and start streaming'],
      tags: ['Netflix', 'Streaming', '4K UHD', 'Dolby Atmos'],
      pools: { 'pool-netflix-102': 'Netflix 4K HDR Profile Pool #102' }
    },
    zh: {
      title: 'Netflix 高级会员 4K UHD (独立车位 + 专属PIN码 30天)',
      subtitle: '4K HDR 超高清画质，杜比全景声音效，专属独立 Profile 与 4 位安全锁',
      deliveryEstimate: '付款后即刻交付账号与专属 PIN 码',
      description: '正规合规 Netflix 4K Premium 车位合租。每位用户拥有独立车位并配备 4 位数安全 PIN 码，观影记录与推荐算法完全独立不串号。',
      features: ['Ultra HD 4K 超清画质与杜比全景声', '专属独立 Profile 配备 4 位数安全密码锁', '已解决同户验证问题，长期稳定观影', '30天全额智能合约质保售后'],
      instructions: ['1. 接收专属账号、密码及指定车位名称', '2. 在电视、手机或电脑 Netflix 客户端登录', '3. 输入 4 位安全 PIN 码畅享海量大片'],
      tags: ['Netflix', '流媒体', '4K超高清', '杜比全景声'],
      pools: { 'pool-netflix-102': 'Netflix 4K HDR 合租车队 #102' }
    },
    ja: {
      title: 'Netflix プレミアム 4K UHD (専用プロファイル＋PIN 30日間)',
      subtitle: '4K HDR 画質、Dolby Atmos 音響、専用 PIN 付き独立プロファイル',
      deliveryEstimate: 'アカウントと暗証番号を即時提供',
      description: '正規契約の Netflix Premium 4K 共有プラン。個別のプロファイルと 4 桁の暗証番号（PIN）が付与され、視聴履歴やお気に入りリストが完全に分離されます。',
      features: ['Ultra HD 4K ＆ Dolby Atmos 空間オーディオ', '4桁の暗証番号付き専用プライベートプロファイル', '同一世帯エラー回避設定済みで安心', '30日間の安心フルエスクロー保証'],
      instructions: ['1. ログインID、パスワード、指定プロファイル名を受領', '2. テレビやスマホの Netflix アプリでサインイン', '3. 専用 PIN を入力して映画やドラマを鑑賞'],
      tags: ['Netflix', '動画配信', '4K UHD'],
      pools: { 'pool-netflix-102': 'Netflix 4K HDR プロファイル #102' }
    },
    ko: {
      title: '넷플릭스 프리미엄 4K UHD (개인 프로필 + 전용 PIN 30일)',
      subtitle: '4K HDR 고화질, Dolby Atmos 사운드, 4자리 보안 PIN 전용 프로필',
      deliveryEstimate: '계정 및 PIN 정보 즉시 발송',
      description: '넷플릭스 프리미엄 Ultra HD 정품 프로필 공유 플랜. 4자리 개인 PIN으로 잠긴 독립 프로필을 사용하여 시청 기록 및 찜 목록이 완벽히 분리됩니다.',
      features: ['Ultra HD 4K 화질 및 Dolby Atmos 공간 음향', '4자리 보안 PIN이 적용된 단독 개인 프로필', '가구 인증 오류 없이 안정적인 재생 지원', '30일 전체 이용 기간 에스크로 보증'],
      instructions: ['1. 로그인 계정, 비밀번호 및 지정 프로필명 확인', '2. 스마트 TV, 모바일 또는 PC 넷플릭스 앱 로그인', '3. 전용 PIN 입력 후 영화 및 시리즈 시청'],
      tags: ['Netflix', '스트리밍', '4K UHD'],
      pools: { 'pool-netflix-102': '넷플릭스 4K HDR 프로필 그룹 #102' }
    },
    ru: {
      title: 'Netflix Premium 4K UHD (Личный профиль + PIN 30 дней)',
      subtitle: 'Качество 4K HDR, звук Dolby Atmos, 1 изолированный профиль с PIN-кодом',
      deliveryEstimate: 'Мгновенная выдача данных и PIN-кода',
      description: 'Официальный совместный тариф Netflix Premium 4K. У каждого пользователя отдельный профиль с 4-значным PIN-кодом и независимой историей просмотров.',
      features: ['Ultra HD 4K и пространственный звук Dolby Atmos', 'Личный профиль с 4-значным защитным PIN-кодом', 'Без ошибок домашней сети (Household-friendly)', 'Полная гарантия на весь оплаченный период'],
      instructions: ['1. Получите логин, пароль и имя вашего профиля', '2. Войдите в приложение Netflix на TV или смартфоне', '3. Введите PIN и наслаждайтесь просмотром'],
      tags: ['Netflix', 'Стриминг', '4K UHD'],
      pools: { 'pool-netflix-102': 'Netflix 4K HDR Профиль Пул #102' }
    },
    fr: {
      title: 'Netflix Premium 4K UHD (Profil Privé + PIN 30 Jours)',
      subtitle: 'Streaming 4K HDR, audio Dolby Atmos, profil individuel avec code PIN',
      deliveryEstimate: 'Identifiants et code PIN livrés instantanément',
      description: 'Offre officielle Netflix Premium Ultra HD en profil partagé. Chaque membre dispose d’un profil sécurisé par code PIN à 4 chiffres avec recommandations dédiées.',
      features: ['Qualité Ultra HD 4K & son spatial Dolby Atmos', 'Profil privé protégé par code PIN à 4 chiffres', 'Conforme aux normes de foyer sans coupure', 'Garantie totale sur toute la durée'],
      instructions: ['1. Récupérez les identifiants et le nom de profil', '2. Connectez-vous sur TV, mobile ou ordinateur', '3. Entrez votre code PIN et profitez de vos films'],
      tags: ['Netflix', 'Streaming', '4K UHD'],
      pools: { 'pool-netflix-102': 'Groupe Netflix 4K HDR #102' }
    },
    de: {
      title: 'Netflix Premium 4K UHD (Privates Profil + PIN 30 Tage)',
      subtitle: '4K HDR Streaming, Dolby Atmos Sound, 1 persönliches Profil mit PIN',
      deliveryEstimate: 'Sofortige Übermittlung der Zugangsdaten und PIN',
      description: 'Offizielles Netflix Premium Ultra HD Profil-Sharing. Jeder Teilnehmer besitzt ein eigenes, mit 4-stelligem PIN gesichertes Profil mit individueller Watchlist.',
      features: ['Ultra HD 4K Bildqualität & Dolby Atmos Sound', 'Eigenes Profil mit 4-stelligem PIN-Schutz', 'Keine Haushalts-Sperren, stabile Wiedergabe', 'Vollständige Laufzeit-Garantie'],
      instructions: ['1. E-Mail, Passwort und Profilname abrufen', '2. In der Netflix-App auf TV, Handy oder PC anmelden', '3. Eigenen PIN eingeben und Filme genießen'],
      tags: ['Netflix', 'Streaming', '4K UHD'],
      pools: { 'pool-netflix-102': 'Netflix 4K HDR Profilgruppe #102' }
    },
    es: {
      title: 'Netflix Premium 4K UHD (Perfil Privado + PIN 30 Días)',
      subtitle: 'Streaming en 4K HDR, audio Dolby Atmos, perfil individual con PIN personal',
      deliveryEstimate: 'Entrega inmediata de cuenta y código PIN',
      description: 'Plan oficial de perfil compartido de Netflix Premium Ultra HD. Cada usuario cuenta con un perfil privado bloqueado con PIN de 4 dígitos e historial propio.',
      features: ['Calidad Ultra HD 4K y sonido espacial Dolby Atmos', 'Perfil privado con código PIN de seguridad de 4 dígitos', 'Configuración verificada sin bloqueos de hogar', 'Garantía total durante los 30 días'],
      instructions: ['1. Recibe el correo, contraseña y nombre de perfil asignado', '2. Inicia sesión en la app de Netflix en tu Smart TV o móvil', '3. Introduce tu PIN personal y disfruta del catálogo'],
      tags: ['Netflix', 'Streaming', '4K UHD'],
      pools: { 'pool-netflix-102': 'Grupo Netflix 4K HDR #102' }
    }
  },

  'prod-adobe-all-apps': {
    vi: {
      title: 'Adobe Creative Cloud All Apps (1 Năm License Enterprise)',
      subtitle: '20+ ứng dụng Adobe (Photoshop, Premiere, Illustrator) + 100GB Cloud & Generative AI Credits',
      deliveryEstimate: 'Nâng cấp trực tiếp vào email trong 15 phút',
      description: 'Gom chung license Adobe Creative Cloud Enterprise bản quyền 1 năm. Kích hoạt trực tiếp trên email Adobe cá nhân của bạn, sử dụng đầy đủ Firefly AI.',
      features: ['Photoshop, Illustrator, Premiere Pro, After Effects', '100GB lưu trữ đám mây Adobe Creative Cloud', 'Generative Credits sử dụng Adobe Firefly AI', 'Bảo hành 1 năm 1 đổi 1'],
      instructions: ['1. Nhập email tài khoản Adobe cá nhân', '2. Chấp nhận lời mời tham gia tổ chức Enterprise', '3. Mở ứng dụng Adobe Creative Cloud và tải phần mềm'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly AI'],
      pools: { 'pool-adobe-771': 'Adobe CC Enterprise Team 2026 #771' }
    },
    en: {
      title: 'Adobe Creative Cloud All Apps (1 Year Enterprise License)',
      subtitle: '20+ Adobe apps (Photoshop, Premiere, Illustrator) + 100GB Cloud & Generative AI Credits',
      deliveryEstimate: 'Direct upgrade on your personal email within 15 minutes',
      description: 'Official 1-Year Adobe Creative Cloud Enterprise license group buy. Activated directly onto your personal Adobe ID with full Adobe Firefly Generative AI credits.',
      features: ['Photoshop, Illustrator, Premiere Pro, After Effects & 20+ apps', '100GB Adobe Creative Cloud high-speed storage', 'Full Generative AI credits for Adobe Firefly', '1-Year replacement warranty guarantee'],
      instructions: ['1. Provide your personal Adobe account email', '2. Accept the official Enterprise Organization invite', '3. Open Adobe Creative Cloud Desktop and download all apps'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly AI'],
      pools: { 'pool-adobe-771': 'Adobe CC Enterprise Team 2026 #771' }
    },
    zh: {
      title: 'Adobe Creative Cloud 全家桶 (1年企业级正版订阅)',
      subtitle: '包含 Photoshop、Premiere、Illustrator 等 20+ 款设计软件，送 100GB 云盘与 Firefly AI 点数',
      deliveryEstimate: '15分钟内直升个人官方邮箱',
      description: '官方 Adobe Creative Cloud Enterprise 1年拼团授权。直接绑定升级至您个人的 Adobe ID 邮箱，畅享 Firefly 商业级 AI 生图与智能填充功能。',
      features: ['Photoshop、Illustrator、Premiere、After Effects 等 20+ 款应用', '100GB Adobe 官方高速云存储空间', '每月全额发放 Adobe Firefly 生成式 AI 算力点数', '1年全周期质保，掉线秒补'],
      instructions: ['1. 填写您的 Adobe 个人账号邮箱', '2. 查收并接受官方企业组织加入邀请', '3. 打开 Creative Cloud 桌面端直接下载使用'],
      tags: ['Adobe', 'Photoshop', '全家桶', 'Firefly AI'],
      pools: { 'pool-adobe-771': 'Adobe CC 企业团队拼团 #771' }
    },
    ja: {
      title: 'Adobe Creative Cloud コンプリートプラン (1年間 Enterprise)',
      subtitle: 'Photoshop・Premiere・Illustrator など 20+ 以上のアプリ ＋ 100GB クラウド＆Firefly AI',
      deliveryEstimate: '15分以内に個人メール宛にライセンス付与',
      description: 'Adobe Creative Cloud Enterprise 1年間の正規グループライセンス。個人 Adobe ID に直接追加され、Adobe Firefly 生成AIクレジットも利用可能です。',
      features: ['Photoshop、Illustrator、Premiere Pro、After Effects 対応', '100GB Adobe クラウドストレージ', 'Adobe Firefly 生成AI クレジット付与', '1年間の完全交換・継続保証'],
      instructions: ['1. ご利用の Adobe アカウントメールを入力', '2. 公式 Enterprise 組織からの招待を承認', '3. Creative Cloud デスクトップを開きアプリをダウンロード'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly AI'],
      pools: { 'pool-adobe-771': 'Adobe CC Enterprise チーム #771' }
    },
    ko: {
      title: 'Adobe Creative Cloud 모든 앱 (1년 기업용 라이선스)',
      subtitle: '포토샵, 프리미어, 일러스트레이터 등 20개 이상 앱 + 100GB 클라우드 및 Firefly AI',
      deliveryEstimate: '15분 이내 개인 이메일로 즉시 업그레이드',
      description: '공식 Adobe Creative Cloud Enterprise 1년 단체 라이선스. 본인 개인 Adobe ID로 직접 활성화되며 Adobe Firefly 생성형 AI 크레딧을 지원합니다.',
      features: ['포토샵, 일러스트레이터, 프리미어 프로, 애프터 이펙트 전체', '100GB Adobe 고속 클라우드 스토리지', 'Adobe Firefly 생성형 AI 크레딧 정기 지급', '1년 정품 무상 AS 보증'],
      instructions: ['1. 개인 Adobe 계정 이메일 입력', '2. 공식 Enterprise 조직 초대 수락', '3. Creative Cloud 데스크톱 앱에서 바로 다운로드'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly AI'],
      pools: { 'pool-adobe-771': 'Adobe CC Enterprise 팀 #771' }
    },
    ru: {
      title: 'Adobe Creative Cloud All Apps (1 Год Enterprise Лицензия)',
      subtitle: '20+ приложений (Photoshop, Premiere, Illustrator) + 100GB Cloud и Firefly AI',
      deliveryEstimate: 'Активация на ваш личный e-mail за 15 минут',
      description: 'Официальная корпоративная подписка Adobe Creative Cloud Enterprise на 1 год. Подключается напрямую к вашему личному Adobe ID с доступом к Adobe Firefly AI.',
      features: ['Photoshop, Illustrator, Premiere Pro, After Effects и др.', '100GB облачного хранилища Adobe Cloud', 'Кредиты генеративного AI Adobe Firefly', 'Полная гарантия 1 год'],
      instructions: ['1. Укажите email вашего Adobe аккаунта', '2. Примите приглашение в Enterprise организацию', '3. Скачайте приложения через Creative Cloud Desktop'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly AI'],
      pools: { 'pool-adobe-771': 'Adobe CC Enterprise Пул #771' }
    },
    fr: {
      title: 'Adobe Creative Cloud Tous les Logiciels (1 An Enterprise)',
      subtitle: '20+ apps Adobe (Photoshop, Premiere, Illustrator) + 100 Go Cloud & Crédits Firefly IA',
      deliveryEstimate: 'Mise à niveau directe sur votre e-mail en 15 minutes',
      description: 'Licence officielle Adobe Creative Cloud Enterprise 1 An en achat groupé. Activée directement sur votre compte Adobe personnel avec accès à Adobe Firefly.',
      features: ['Photoshop, Illustrator, Premiere Pro, After Effects et plus', '100 Go de stockage cloud Adobe sécurisé', 'Crédits d’IA générative pour Adobe Firefly', 'Garantie intégrale 1 an'],
      instructions: ['1. Indiquez votre e-mail de compte Adobe', '2. Acceptez l’invitation officielle Enterprise', '3. Téléchargez vos applications via Creative Cloud'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly IA'],
      pools: { 'pool-adobe-771': 'Groupe Adobe CC Enterprise #771' }
    },
    de: {
      title: 'Adobe Creative Cloud Alle Applikationen (1 Jahr Enterprise)',
      subtitle: '20+ Adobe-Programme (Photoshop, Premiere, Illustrator) + 100GB Cloud & Firefly KI',
      deliveryEstimate: 'Direktes Upgrade auf eigene E-Mail in 15 Minuten',
      description: 'Offizielles 1-Jahres Adobe Creative Cloud Enterprise Gruppenkauf-Abonnement. Aktivierung direkt auf Ihrer persönlichen Adobe-ID inklusive Adobe Firefly KI-Credits.',
      features: ['Photoshop, Illustrator, Premiere Pro, After Effects uvm.', '100GB schneller Adobe Cloud-Speicher', 'Monatliche Generative KI-Credits für Adobe Firefly', '1 Jahr Rundum-Garantie'],
      instructions: ['1. E-Mail der eigenen Adobe-ID angeben', '2. Offizielle Enterprise-Einladung annehmen', '3. In Creative Cloud Desktop alle Apps herunterladen'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly KI'],
      pools: { 'pool-adobe-771': 'Adobe CC Enterprise Gruppe #771' }
    },
    es: {
      title: 'Adobe Creative Cloud Todas las Aplicaciones (1 Año Enterprise)',
      subtitle: 'Más de 20 apps de Adobe (Photoshop, Premiere, Illustrator) + 100GB Cloud y Firefly IA',
      deliveryEstimate: 'Activación directa en tu correo personal en 15 minutos',
      description: 'Licencia oficial de Adobe Creative Cloud Enterprise por 1 año. Se activa directamente en tu cuenta de Adobe ID personal con créditos de inteligencia artificial Adobe Firefly.',
      features: ['Photoshop, Illustrator, Premiere Pro, After Effects y más', '100GB de almacenamiento en la nube de Adobe', 'Créditos de IA generativa para Adobe Firefly', 'Garantía total de reemplazo por 1 año'],
      instructions: ['1. Proporciona el correo de tu cuenta de Adobe', '2. Acepta la invitación de la organización Enterprise', '3. Abre la app de Creative Cloud y descarga tus programas'],
      tags: ['Adobe', 'Photoshop', 'Creative Cloud', 'Firefly IA'],
      pools: { 'pool-adobe-771': 'Grupo Adobe CC Enterprise #771' }
    }
  },

  'prod-spotify-family': {
    vi: {
      title: 'Spotify Premium Family (1 Năm Kích Hoạt Mail Chính Chủ)',
      subtitle: 'Nghe nhạc lossless 320kbps, không quảng cáo, tải nhạc offline trên tài khoản cá nhân',
      deliveryEstimate: 'Nâng cấp tài khoản sau 5-10 phút',
      description: 'Gia nhập gói Spotify Family chính hãng 1 năm. Kích hoạt trực tiếp trên tài khoản Spotify của bạn, giữ nguyên 100% danh sách bài hát và playlist yêu thích.',
      features: ['Nghe nhạc chất lượng cao không quảng cáo', 'Tải nhạc nghe offline trên nhiều thiết bị', 'Giữ nguyên toàn bộ playlist cá nhân', 'Bảo hành trọn vẹn 1 năm'],
      instructions: ['1. Cung cấp email Spotify của bạn', '2. Nhận link invite gia đình và địa chỉ xác thực', '3. Chấp nhận để kích hoạt Premium ngay lập tức'],
      tags: ['Spotify', 'Âm nhạc', 'Streaming', 'Lossless'],
      pools: { 'pool-spotify-505': 'Spotify Family Premium Group #505' }
    },
    en: {
      title: 'Spotify Premium Family (1 Year Personal Email Activation)',
      subtitle: '320kbps lossless audio, ad-free listening, offline downloads on your personal account',
      deliveryEstimate: 'Account upgraded within 5-10 minutes',
      description: 'Official 1-Year Spotify Family membership group plan. Activated directly onto your personal Spotify account while preserving 100% of your saved songs and playlists.',
      features: ['Ad-free high-fidelity music streaming', 'Download tracks for offline playback on any device', 'Keeps all personal playlists and algorithms intact', 'Full 1-year replacement warranty guarantee'],
      instructions: ['1. Provide your Spotify account email', '2. Receive official Family invite link with verification address', '3. Accept invite to activate Premium instantly'],
      tags: ['Spotify', 'Music', 'Streaming', 'Lossless'],
      pools: { 'pool-spotify-505': 'Spotify Family Premium Group #505' }
    },
    zh: {
      title: 'Spotify Premium 家庭组 (1年升级个人主账号)',
      subtitle: '320kbps 极高质量无损音质，去广告，支持离线下载并保留个人歌单',
      deliveryEstimate: '5-10分钟内极速升级',
      description: '官方 Spotify Family 家庭组拼团 1 年订阅。直接升级至您的 Spotify 个人账号，100% 完整保留个人喜欢的音乐与全部歌单。',
      features: ['全程无广告纯净听歌体验', '支持多设备离线下载随时收听', '完整保留历史歌单与算法推荐', '1年全程质保，掉线免费补登'],
      instructions: ['1. 填写您的 Spotify 账号邮箱', '2. 接收专属家庭组邀请链接与验证地址', '3. 点击接受邀请即可秒级升级 Premium'],
      tags: ['Spotify', '音乐', '流媒体', '无损音质'],
      pools: { 'pool-spotify-505': 'Spotify 家庭组拼团 #505' }
    },
    ja: {
      title: 'Spotify Premium Family (1年間 本人アカウント有効化)',
      subtitle: '320kbps 高音質、広告なし、オフライン再生対応（既存プレイリスト完全保持）',
      deliveryEstimate: '5〜10分以内にアカウント有効化',
      description: 'Spotify Family の公式1年間グループプラン。ご自身の Spotify アカウントに直接追加され、お気に入りの曲やプレイリストはすべてそのまま保持されます。',
      features: ['広告なしの高音質ストリーミング再生', 'スマートフォンやPCへのオフラインダウンロード対応', '既存のプレイリストやお気に入りを100%保持', '1年間の安心フルエスクロー保証'],
      instructions: ['1. Spotify アカウントのメールアドレスを入力', '2. ファミリー招待リンクと住所情報を受領', '3. リンクから参加して即座に Premium 化'],
      tags: ['Spotify', '音楽配信', '高音質'],
      pools: { 'pool-spotify-505': 'Spotify Family Premium グループ #505' }
    },
    ko: {
      title: '스포티파이 프리미엄 패밀리 (1년 본인 계정 활성화)',
      subtitle: '320kbps 고음질 무손실 사운드, 광고 없는 재생, 오프라인 음원 저장',
      deliveryEstimate: '5~10분 이내 계정 업그레이드',
      description: '공식 스포티파이 패밀리 1년 정품 단체 플랜. 본인 개인 계정에 직접 적용되어 기존 플레이리스트와 추천 알고리즘이 100% 유지됩니다.',
      features: ['광고 없이 끊김 없는 고음질 음원 스트리밍', '모든 기기에서 오프라인 음원 다운로드 재생', '기존 저장된 곡 및 재생목록 100% 유지', '1년 이용 기간 정품 에스크로 보증'],
      instructions: ['1. 스포티파이 계정 이메일 입력', '2. 패밀리 초대 링크 및 인증 주소 수령', '3. 초대 수락 후 즉시 프리미엄 이용'],
      tags: ['Spotify', '음악 스트리밍', '고음질'],
      pools: { 'pool-spotify-505': '스포티파이 패밀리 그룹 #505' }
    },
    ru: {
      title: 'Spotify Premium Family (1 Год на ваш личный аккаунт)',
      subtitle: 'Звук 320 кбит/с, без рекламы, скачивание треков и сохранение всех плейлистов',
      deliveryEstimate: 'Активация за 5-10 минут',
      description: 'Официальная подписка Spotify Family на 1 год. Подключается к вашему личному аккаунту с полным сохранением любимых треков и истории прослушивания.',
      features: ['Музыка в высоком качестве без рекламы', 'Офлайн-режим на мобильных и ПК', 'Сохранение всех плейлистов и рекомендаций', 'Полная 1-летняя гарантия'],
      instructions: ['1. Укажите email вашего Spotify', '2. Получите инвайт-ссылку и адрес семьи', '3. Примите приглашение для включения Premium'],
      tags: ['Spotify', 'Музыка', 'Стриминг'],
      pools: { 'pool-spotify-505': 'Spotify Family Premium Пул #505' }
    },
    fr: {
      title: 'Spotify Premium Family (1 An sur Compte Personnel)',
      subtitle: 'Audio 320 kbps, sans publicité, téléchargement hors-ligne avec playlists intactes',
      deliveryEstimate: 'Compte mis à niveau en 5 à 10 minutes',
      description: 'Abonnement officiel Spotify Family 1 An en formule groupée. Activé sur votre propre compte Spotify en préservant l’intégralité de vos playlists.',
      features: ['Écoute musicale sans pub en haute fidélité', 'Téléchargement hors-ligne sur tous vos appareils', 'Conserve 100% de vos playlists et favoris', 'Garantie intégrale de 1 an'],
      instructions: ['1. Fournissez votre e-mail Spotify', '2. Recevez le lien d’invitation Family et l’adresse', '3. Rejoignez la famille pour activer Premium'],
      tags: ['Spotify', 'Musique', 'Streaming'],
      pools: { 'pool-spotify-505': 'Groupe Spotify Family #505' }
    },
    de: {
      title: 'Spotify Premium Family (1 Jahr auf eigene E-Mail)',
      subtitle: '320kbps Audioqualität, werbefrei, Offline-Downloads & Playlists bleiben erhalten',
      deliveryEstimate: 'Aktivierung innerhalb von 5-10 Minuten',
      description: 'Offizielles 1-Jahres Spotify Family Gruppenabonnement. Direkte Aktivierung auf Ihrem persönlichen Spotify-Konto unter 100% Erhalt all Ihrer Playlists.',
      features: ['Werbefreies Musik-Streaming in hoher Qualität', 'Offline-Download auf Smartphone und PC', 'Bestehende Playlists und Favoriten bleiben voll erhalten', '1 Jahr volle Laufzeit-Garantie'],
      instructions: ['1. E-Mail-Adresse des Spotify-Kontos angeben', '2. Offiziellen Einladungslink und Adressdaten erhalten', '3. Beitreten und sofort werbefrei Musik hören'],
      tags: ['Spotify', 'Musik', 'Streaming'],
      pools: { 'pool-spotify-505': 'Spotify Family Premium Gruppe #505' }
    },
    es: {
      title: 'Spotify Premium Familiar (1 Año en Correo Personal)',
      subtitle: 'Audio de alta fidelidad 320kbps, sin anuncios, descargas offline y listas intactas',
      deliveryEstimate: 'Cuenta activada en 5 a 10 minutos',
      description: 'Plan oficial familiar de Spotify por 1 año en compra grupal. Se activa directamente en tu cuenta de Spotify conservando todas tus canciones y playlists guardadas.',
      features: ['Música en alta calidad sin interrupciones ni anuncios', 'Descarga canciones para escuchar sin conexión', 'Mantiene intactas tus listas de reproducción', 'Garantía total de 1 año con respaldo Escrow'],
      instructions: ['1. Proporciona el correo de tu cuenta de Spotify', '2. Recibe el enlace de invitación familiar con la dirección', '3. Acepta la invitación para activar Premium al instante'],
      tags: ['Spotify', 'Música', 'Streaming'],
      pools: { 'pool-spotify-505': 'Grupo Spotify Family #505' }
    }
  }
};

// Dynamic Translation Cache for client-side persistence
export const DYNAMIC_TRANSLATIONS_CACHE: Record<string, Record<string, LocalizedProductData>> = {};

export function registerDynamicProductTranslations(productId: string, translations: Record<string, any>) {
  if (!productId || !translations) return;
  if (!DYNAMIC_TRANSLATIONS_CACHE[productId]) {
    DYNAMIC_TRANSLATIONS_CACHE[productId] = {};
  }
  Object.entries(translations).forEach(([lang, data]) => {
    DYNAMIC_TRANSLATIONS_CACHE[productId][lang] = data;
    // Map short codes too
    const shortCode = lang.split('-')[0];
    DYNAMIC_TRANSLATIONS_CACHE[productId][shortCode] = data;
  });
}

// Localize Product Helper Function
export function getLocalizedProduct(product: Product, localeInput: SupportedLocale = 'vi'): Product {
  if (!product) return product;

  // Extract primary language code: 'vi', 'en', 'zh', 'ja', 'ko', 'ru', 'fr', 'de', 'es'
  let lang = 'en';
  const cleanLocale = (localeInput || 'vi').toLowerCase();

  if (cleanLocale === 'vi' || cleanLocale.startsWith('vi')) lang = 'vi';
  else if (cleanLocale.startsWith('zh')) lang = 'zh';
  else if (cleanLocale.startsWith('ja')) lang = 'ja';
  else if (cleanLocale.startsWith('ko')) lang = 'ko';
  else if (cleanLocale.startsWith('ru')) lang = 'ru';
  else if (cleanLocale.startsWith('fr')) lang = 'fr';
  else if (cleanLocale.startsWith('de')) lang = 'de';
  else if (cleanLocale.startsWith('es')) lang = 'es';
  else if (cleanLocale.startsWith('en')) lang = 'en';

  const origLang = (product.original_language || 'vi').toLowerCase();

  // If user locale matches product's original language, display original immutable content
  if (lang === origLang || (lang === 'vi' && (!product.original_language || product.original_language === 'vi'))) {
    return {
      ...product,
      title: product.title_original || product.title,
      description: product.description_original || product.description
    };
  }

  // 1. Check product.translations (from backend or auto-translation)
  let translation: LocalizedProductData | undefined = 
    (product.translations?.[localeInput] as any) ||
    (product.translations?.[lang] as any) ||
    (product.translations?.[cleanLocale] as any);

  // 2. Check dynamic in-memory cache
  if (!translation && DYNAMIC_TRANSLATIONS_CACHE[product.id]) {
    translation = DYNAMIC_TRANSLATIONS_CACHE[product.id][localeInput] ||
      DYNAMIC_TRANSLATIONS_CACHE[product.id][lang] ||
      DYNAMIC_TRANSLATIONS_CACHE[product.id][cleanLocale];
  }

  // 3. Check static dictionaries (ALL_PRODUCTS_DATA, PRODUCT_TRANSLATIONS)
  if (!translation) {
    translation = ALL_PRODUCTS_DATA[product.id]?.[lang] || 
      PRODUCT_TRANSLATIONS[product.id]?.[lang] || 
      ALL_PRODUCTS_DATA[product.id]?.[cleanLocale] ||
      PRODUCT_TRANSLATIONS[product.id]?.[cleanLocale] ||
      ALL_PRODUCTS_DATA[product.id]?.['en'] || 
      PRODUCT_TRANSLATIONS[product.id]?.['en'] ||
      (product.translations?.['en'] as any);
  }

  if (!translation) {
    // If no translation exists, fallback to original
    return {
      ...product,
      title: product.title_original || product.title,
      description: product.description_original || product.description
    };
  }

  // Deep clone and replace localized strings
  const localized: Product = {
    ...product,
    title: translation.title || product.title_original || product.title,
    subtitle: translation.subtitle || product.subtitle,
    description: translation.description || product.description_original || product.description,
    deliveryEstimate: translation.deliveryEstimate || product.deliveryEstimate,
    features: translation.features?.length ? [...translation.features] : product.features,
    instructions: translation.instructions?.length ? [...translation.instructions] : product.instructions,
    tags: translation.tags?.length ? [...translation.tags] : product.tags,
    activePools: product.activePools?.map(pool => {
      const poolTitle = translation?.pools?.[pool.id];
      if (poolTitle) {
        return { ...pool, title: poolTitle };
      }
      return pool;
    }) || []
  };

  return localized;
}

// Localize Category Helper Function
export function getLocalizedCategory(category: CategoryItem, localeInput: SupportedLocale = 'vi'): CategoryItem {
  if (!category) return category;
  
  let lang = 'en';
  if (localeInput === 'vi') lang = 'vi';
  else if (localeInput.startsWith('zh')) lang = 'zh';
  else if (localeInput.startsWith('ja')) lang = 'ja';
  else if (localeInput.startsWith('ko')) lang = 'ko';
  else if (localeInput.startsWith('ru')) lang = 'ru';
  else if (localeInput.startsWith('fr')) lang = 'fr';
  else if (localeInput.startsWith('de')) lang = 'de';
  else if (localeInput.startsWith('es')) lang = 'es';
  else if (localeInput.startsWith('en')) lang = 'en';

  const localizedInfo = CATEGORY_TRANSLATIONS[category.id]?.[lang];
  if (localizedInfo) {
    return {
      ...category,
      name: localizedInfo.name || category.name,
      description: localizedInfo.description || category.description
    };
  }
  return category;
}

// Localize Game Item Helper Function
export function getLocalizedGame(game: GameItem, localeInput: SupportedLocale = 'vi'): GameItem {
  if (!game) return game;
  if (localeInput === 'vi') return game;

  // Provide clean localized game formatting
  return game;
}

// 9-Language Hero Translations Dictionary
export const HERO_TRANSLATIONS_DICT: Record<string, HeroTranslationData> = {
  vi: {
    badgeText: 'SÀN GOM ĐƠN MUA CHUNG SẢN PHẨM SỐ & KEY BẢN QUYỀN',
    mainHeadingLine1: 'MUA CHUNG KEY BẢN QUYỀN',
    mainHeadingLine2: 'TIẾT KIỆM ĐẾN 80%',
    subheading: 'Giải pháp gom đơn thông minh: Nhận giá sỉ gốc cho ChatGPT Plus, Netflix 4K, Game Steam và nhiều tựa game hot. Thanh toán tự động, nhận mã tức thì qua hợp đồng bảo lãnh Escrow 100%.',
    pod1Title: 'Tốc Độ Nhận Key',
    pod1Val: '3 - 30 Giây',
    pod1Sub: 'Tự động trả mã 24/7',
    pod2Title: 'Bảo Lãnh Escrow',
    pod2Val: '100% Hoàn Tiền',
    pod2Sub: 'Bảo hành 1:1 mọi lỗi'
  },
  en: {
    badgeText: 'THE #1 GROUP-BUY ESCROW & DIGITAL ASSET PLATFORM',
    mainHeadingLine1: 'SOFTWARE & GAME GROUP BUY',
    mainHeadingLine2: 'SAVE UP TO 80%',
    subheading: 'Smart group-buy solution: Get direct wholesale pricing for ChatGPT Plus, Netflix 4K, Steam Games, and many hot game titles. Instant automated delivery backed by 100% Escrow guarantee.',
    pod1Title: 'Delivery Speed',
    pod1Val: '3 - 30 Seconds',
    pod1Sub: '24/7 Automated Dispatch',
    pod2Title: 'Escrow Guarantee',
    pod2Val: '100% Refundable',
    pod2Sub: '1:1 Replacement Warranty'
  },
  zh: {
    badgeText: '顶级数字产品拼团拼单与安全托管交易平台',
    mainHeadingLine1: '软件与游戏拼团购买',
    mainHeadingLine2: '最高立省 80%',
    subheading: '智能拼单解决方案：ChatGPT Plus、Netflix 4K、Steam 游戏以及众多热门游戏批发低价。100% 智能托管保障，支付后全自动秒级发货。',
    pod1Title: '发货时效',
    pod1Val: '3 - 30 秒',
    pod1Sub: '24/7 全天候自动派送',
    pod2Title: '托管保障',
    pod2Val: '100% 可退款',
    pod2Sub: '1:1 换新质保'
  },
  ja: {
    badgeText: '国内最高峰のデジタル資産共同購入＆安全エスクロー市場',
    mainHeadingLine1: 'ソフトウェア＆ゲームの共同購入',
    mainHeadingLine2: '最大 80% オフ',
    subheading: 'スマートな共同購入：ChatGPT Plus、Netflix 4K、Steamゲーム、多数の人気ゲームが卸売価格。100% エスクロー保証＆即時自動配信。',
    pod1Title: '配信速度',
    pod1Val: '3〜30 秒',
    pod1Sub: '24/7 自動即時配信',
    pod2Title: 'エスクロー保証',
    pod2Val: '100% 返金保証',
    pod2Sub: '1対1 交換保証'
  },
  ko: {
    badgeText: '국내 1위 디지털 라이선스 공동구매 & 안전 에스크로 거래소',
    mainHeadingLine1: '소프트웨어 & 게임 공동구매',
    mainHeadingLine2: '최대 80% 할인',
    subheading: '스마트 디지털 공구: ChatGPT Plus, Netflix 4K, Steam 게임 및 다양한 인기 게임 도매가 제공. 100% 에스크로 안심 보증과 결제 즉시 자동 발송 시스템.',
    pod1Title: '발송 속도',
    pod1Val: '3 - 30 초',
    pod1Sub: '24/7 전천후 자동 전송',
    pod2Title: '에스크로 보증',
    pod2Val: '100% 환불 보장',
    pod2Sub: '1:1 맞교환 안심케어'
  },
  ru: {
    badgeText: 'ПЛАТФОРМА №1 ДЛЯ СОВМЕСТНЫХ ПОКУПОК ЦИФРОВЫХ КЛЮЧЕЙ И ЭСКРОУ',
    mainHeadingLine1: 'СОВМЕСТНЫЕ ПОКУПКИ СОФТА И ИГР',
    mainHeadingLine2: 'ЭКОНОМИЯ ДО 80%',
    subheading: 'Умный групповой выкуп: ChatGPT Plus, Netflix 4K, ключи Steam и множество популярных игр по оптовым ценам. 100% защита Escrow и автоматическая доставка за секунды.',
    pod1Title: 'Скорость доставки',
    pod1Val: '3 - 30 сек',
    pod1Sub: '24/7 автоматическая выдача',
    pod2Title: 'Защита Escrow',
    pod2Val: '100% Возврат',
    pod2Sub: 'Замена 1 к 1'
  },
  fr: {
    badgeText: 'PLATEFORME N°1 D’ACHAT GROUPÉ & SÉQUESTRE NUMÉRIQUE',
    mainHeadingLine1: 'ACHAT GROUPÉ LOGICIELS & JEUX',
    mainHeadingLine2: 'ÉCONOMISEZ JUSQU’À 80%',
    subheading: 'Solution d’achat groupé intelligente : obtenez des prix de gros pour ChatGPT Plus, Netflix 4K, jeux Steam et de nombreux jeux populaires. Livraison automatisée garantie par séquestre 100% Escrow.',
    pod1Title: 'Délai de Livraison',
    pod1Val: '3 - 30 Secondes',
    pod1Sub: 'Envoi automatique 24/7',
    pod2Title: 'Garantie Escrow',
    pod2Val: '100% Remboursable',
    pod2Sub: 'Remplacement 1:1 garanti'
  },
  de: {
    badgeText: 'DIE NR. 1 PLATTFORM FÜR GRUPPENKAUF & DIGITAL-TREUHAND',
    mainHeadingLine1: 'SOFTWARE- & GAME-GRUPPENKAUF',
    mainHeadingLine2: 'BIS ZU 80% SPAREN',
    subheading: 'Smarte Sammelkauf-Lösung: Erhalten Sie Großhandelspreise für ChatGPT Plus, Netflix 4K, Steam-Spiele und viele beliebte Spieletitel. Sofortige automatisierte Bereitstellung mit 100% Escrow-Garantie.',
    pod1Title: 'Liefertempo',
    pod1Val: '3 - 30 Sekunden',
    pod1Sub: '24/7 Automatischer Versand',
    pod2Title: 'Escrow-Treuhand',
    pod2Val: '100% Erstattbar',
    pod2Sub: '1:1 Sofort-Ersatzgarantie'
  },
  es: {
    badgeText: 'PLATAFORMA N.º 1 DE COMPRA COLECTIVA Y DEPÓSITO EN GARANTÍA',
    mainHeadingLine1: 'COMPRA COLECTIVA DE SOFTWARE Y JUEGOS',
    mainHeadingLine2: 'AHORRA HASTA UN 80%',
    subheading: 'Solución inteligente de compra grupal: Precios mayoristas directos para ChatGPT Plus, Netflix 4K, juegos de Steam y muchos juegos populares. Entrega automatizada con 100% garantía Escrow.',
    pod1Title: 'Velocidad de Entrega',
    pod1Val: '3 - 30 Segundos',
    pod1Sub: 'Envío automatizado 24/7',
    pod2Title: 'Garantía Escrow',
    pod2Val: '100% Reembolsable',
    pod2Sub: 'Garantía de sustitución 1:1'
  }
};

/**
 * Intelligent Dynamic Sentence & Phrase Translator for Hero text (Vietnamese -> Any Target Language)
 */
export function translateHeroSentence(text: string, targetLang: string = 'en'): string {
  if (!text || !text.trim()) return '';
  if (targetLang === 'vi') return text;

  // Always normalize Unicode NFC to support both precomposed and decomposed Vietnamese input
  const normalizedRaw = text.normalize('NFC').trim();
  const isAllUpper = normalizedRaw === normalizedRaw.toUpperCase() && /[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/.test(normalizedRaw);

  let res = normalizedRaw;

  // 1. Direct clause & sentence map (Highest Priority)
  const fullMatchMap: Record<string, Record<string, string>> = {
    'MUA CHUNG GIÁ RẺ - LẺ NHƯ BUÔN': {
      en: 'CHEAP GROUP BUY - RETAIL AT WHOLESALE PRICES',
      zh: '低价拼单 - 散买享批发价',
      ja: '格安共同購入 - 単品でも卸売価格',
      ko: '초특가 공동구매 - 소매도 도매가로',
      ru: 'ДЕШЕВЫЙ ГРУППОВОЙ ВЫКУП - РОЗНИЦА ПО ОПТОВЫМ ЦЕНАМ',
      fr: 'ACHAT GROUPÉ PAS CHER - DÉTAIL AU PRIX DE GROS',
      de: 'GÜNSTIGER GRUPPENKAUF - EINZELKAUF ZUM GROSSHANDELSPREIS',
      es: 'COMPRA COLECTIVA ECONÓMICA - AL POR MENOR A PRECIO DE MAYOR'
    },
    'MUA CHUNG GIÁ RẺ': {
      en: 'CHEAP GROUP BUY',
      zh: '低价拼单',
      ja: '格安共同購入',
      ko: '초특가 공동구매',
      ru: 'ДЕШЕВЫЙ ГРУППОВОЙ ВЫКУП',
      fr: 'ACHAT GROUPÉ PAS CHER',
      de: 'GÜNSTIGER GRUPPENKAUF',
      es: 'COMPRA COLECTIVA ECONÓMICA'
    },
    'AN TOÀN - NHANH CHÓNG': {
      en: 'SAFE & FAST',
      zh: '安全极速',
      ja: '安心・迅速',
      ko: '안전하고 빠른',
      ru: 'БЕЗОПАСНО И БЫСТРО',
      fr: 'SÉCURISÉ & RAPIDE',
      de: 'SICHER & SCHNELL',
      es: 'SEGURO Y RÁPIDO'
    },
    'AN TOÀN – NHANH CHÓNG': {
      en: 'SAFE & FAST',
      zh: '安全极速',
      ja: '安心・迅速',
      ko: '안전하고 빠른',
      ru: 'БЕЗОПАСНО И БЫСТРО',
      fr: 'SÉCURISÉ & RAPIDE',
      de: 'SICHER & SCHNELL',
      es: 'SEGURO Y RÁPIDO'
    },
    'AN TOÀN, NHANH CHÓNG': {
      en: 'SAFE & FAST',
      zh: '安全极速',
      ja: '安心・迅速',
      ko: '안전하고 빠른',
      ru: 'БЕЗОПАСНО И БЫСТРО',
      fr: 'SÉCURISÉ & RAPIDE',
      de: 'SICHER & SCHNELL',
      es: 'SEGURO Y RÁPIDO'
    },
    'AN TOÀN': {
      en: 'SAFE & SECURE',
      zh: '安全保障',
      ja: '安心・安全',
      ko: '안전 보장',
      ru: 'БЕЗОПАСНО',
      fr: 'SÉCURISÉ',
      de: 'SICHER',
      es: 'SEGURO'
    },
    'NHANH CHÓNG': {
      en: 'FAST & INSTANT',
      zh: '极速到账',
      ja: '迅速・即時',
      ko: '신속 처리',
      ru: 'БЫСТРО',
      fr: 'RAPIDE',
      de: 'SCHNELL',
      es: 'RÁPIDO'
    },
    'UY TÍN': {
      en: '100% TRUSTED',
      zh: '信誉保障',
      ja: '信頼保証',
      ko: '신뢰 보증',
      ru: 'НАДЕЖНО',
      fr: 'FIABLE',
      de: 'ZUVERLÄSSIG',
      es: 'CONFIABLE'
    },
    'LẺ NHƯ BUÔN': {
      en: 'RETAIL AT WHOLESALE PRICES',
      zh: '散买享批发价',
      ja: '単品でも卸売価格',
      ko: '소매도 도매가로',
      ru: 'РОЗНИЦА ПО ОПТОВЫМ ЦЕНАМ',
      fr: 'DÉTAIL AU PRIX DE GROS',
      de: 'EINZELKAUF ZUM GROSSHANDELSPREIS',
      es: 'AL POR MENOR A PRECIO DE MAYOR'
    },
    'LẺ GIÁ BUÔN': {
      en: 'RETAIL AT WHOLESALE PRICES',
      zh: '零售享批发价',
      ja: '単品でも卸売価格',
      ko: '소매도 도매가로',
      ru: 'РОЗНИЦА ПО ОПТОВЫМ ЦЕНАМ',
      fr: 'DÉTAIL AU PRIX DE GROS',
      de: 'EINZELKAUF ZUM GROSSHANDELSPREIS',
      es: 'AL POR MENOR A PRECIO DE MAYOR'
    },
    'MUA LẺ GIÁ SỈ': {
      en: 'RETAIL AT WHOLESALE PRICES',
      zh: '散买享批发价',
      ja: '単品でも卸売価格',
      ko: '소매도 도매가로',
      ru: 'РОЗНИЦА ПО ОПТОВЫМ ЦЕНАМ',
      fr: 'DÉTAIL AU PRIX DE GROS',
      de: 'EINZELKAUF ZUM GROSSHANDELSPREIS',
      es: 'AL POR MENOR A PRECIO DE MAYOR'
    },
    'SÀN GOM ĐƠN MUA CHUNG SẢN PHẨM SỐ & KEY BẢN QUYỀN': {
      en: 'THE #1 GROUP-BUY ESCROW & DIGITAL ASSET PLATFORM',
      zh: '顶级数字产品拼团拼单与安全托管交易平台',
      ja: '国内最高峰のデジタル資産共同購入＆安全エスクロー市場',
      ko: '국내 1위 디지털 라이선스 공동구매 & 안전 에스크로 거래소',
      ru: 'ПЛАТФОРМА №1 ДЛЯ СОВМЕСТНЫХ ПОКУПОК ЦИФРОВЫХ КЛЮЧЕЙ И ЭСКРОУ',
      fr: 'PLATEFORME N°1 D’ACHAT GROUPÉ & SÉQUESTRE NUMÉRIQUE',
      de: 'DIE NR. 1 PLATTFORM FÜR GRUPPENKAUF & DIGITAL-TREUHAND',
      es: 'PLATAFORMA N.º 1 DE COMPRA COLECTIVA Y DEPÓSITO EN GARANTÍA'
    },
    'MUA CHUNG KEY BẢN QUYỀN': {
      en: 'SOFTWARE & GAME GROUP BUY',
      zh: '软件与游戏拼团购买',
      ja: 'ソフトウェア＆ゲームの共同購入',
      ko: '소프트웨어 & 게임 공동구매',
      ru: 'СОВМЕСТНЫЕ ПОКУПКИ СОФТА И ИГР',
      fr: 'ACHAT GROUPÉ LOGICIELS & JEUX',
      de: 'SOFTWARE- & GAME-GRUPPENKAUF',
      es: 'COMPRA COLECTIVA DE SOFTWARE Y JUEGOS'
    },
    'TIẾT KIỆM ĐẾN 80%': {
      en: 'SAVE UP TO 80%',
      zh: '最高立省 80%',
      ja: '最大 80% オフ',
      ko: '최대 80% 할인',
      ru: 'ЭКОНОМИЯ ДО 80%',
      fr: 'ÉCONOMISEZ JUSQU’À 80%',
      de: 'BIS ZU 80% SPAREN',
      es: 'AHORRA HASTA UN 80%'
    },
    'Tốc Độ Nhận Key': {
      en: 'Delivery Speed',
      zh: '发货时效',
      ja: '配信速度',
      ko: '발송 속도',
      ru: 'Скорость доставки',
      fr: 'Délai de Livraison',
      de: 'Liefertempo',
      es: 'Velocidad de Entrega'
    },
    'Tự động trả mã 24/7': {
      en: '24/7 Automated Dispatch',
      zh: '24/7 全天候自动派送',
      ja: '24/7 自動即時配信',
      ko: '24/7 전천후 자동 전송',
      ru: '24/7 автоматическая выдача',
      fr: 'Envoi automatique 24/7',
      de: '24/7 Automatischer Versand',
      es: 'Envío automatizado 24/7'
    },
    'Bảo Lãnh Escrow': {
      en: 'Escrow Guarantee',
      zh: '托管保障',
      ja: 'エスクロー保証',
      ko: '에스크로 보증',
      ru: 'Защита Escrow',
      fr: 'Garantie Escrow',
      de: 'Escrow-Treuhand',
      es: 'Garantía Escrow'
    },
    '100% Hoàn Tiền': {
      en: '100% Refundable',
      zh: '100% 可退款',
      ja: '100% 返金保証',
      ko: '100% 환불 보장',
      ru: '100% Возврат',
      fr: '100% Remboursable',
      de: '100% Erstattbar',
      es: '100% Reembolsable'
    },
    'Bảo hành 1:1 mọi lỗi': {
      en: '1:1 Replacement Warranty',
      zh: '1:1 换新质保',
      ja: '1対1 交換保証',
      ko: '1:1 맞교환 안심케어',
      ru: 'Замена 1 к 1',
      fr: 'Remplacement 1:1 garanti',
      de: '1:1 Sofort-Ersatzgarantie',
      es: 'Garantía de sustitución 1:1'
    }
  };

  // Case-insensitive exact match in map
  const lowerKey = normalizedRaw.toLowerCase();
  for (const [k, v] of Object.entries(fullMatchMap)) {
    if (k.toLowerCase() === lowerKey && v[targetLang]) {
      const matchRes = v[targetLang];
      return isAllUpper ? matchRes.toUpperCase() : matchRes;
    }
  }

  // 2. Recursive Parentheses & Brackets Handler (e.g. "MUA CHUNG GIÁ RẺ ( AN TOÀN - NHANH CHÓNG )")
  // Extracts and translates content inside ( ... ), [ ... ], 【 ... 】 individually
  if (/\([^)]+\)/.test(res) || /\[[^\]]+\]/.test(res) || /【[^】]+】/.test(res)) {
    res = res.replace(/\(([^)]+)\)/g, (_m, inner) => {
      const translatedInner = translateHeroSentence(inner.trim(), targetLang);
      return `( ${translatedInner} )`;
    });
    res = res.replace(/\[([^\]]+)\]/g, (_m, inner) => {
      const translatedInner = translateHeroSentence(inner.trim(), targetLang);
      return `[ ${translatedInner} ]`;
    });
    res = res.replace(/【([^】]+)】/g, (_m, inner) => {
      const translatedInner = translateHeroSentence(inner.trim(), targetLang);
      return `【 ${translatedInner} 】`;
    });
  }

  // 3. Handle Multi-Clause splitting (e.g. "MUA CHUNG GIÁ RẺ - LẺ NHƯ BUÔN" or "MUA CHUNG | GIÁ SỈ")
  const delimiters = [' - ', ' – ', ' — ', ' | ', ' • ', ' / ', ' & ', ' + '];
  for (const delim of delimiters) {
    if (res.includes(delim)) {
      const parts = res.split(delim);
      const translatedParts = parts.map(p => translateHeroSentence(p.trim(), targetLang));
      const joined = translatedParts.join(delim);
      return isAllUpper ? joined.toUpperCase() : joined;
    }
  }

  // 3. Dynamic pattern replacements for games & quantities
  // "121 tựa game hot" -> "$1 hot game titles"
  res = res.replace(/(\d+)\s*(tựa\s*game\s*hot|game\s*hot|tựa\s*game|game)/gi, (_m, num) => {
    switch (targetLang) {
      case 'en': return `${num} hot game titles`;
      case 'zh': return `${num}款热门游戏`;
      case 'ja': return `${num}タイトルの人気ゲーム`;
      case 'ko': return `${num}개 인기 게임`;
      case 'ru': return `${num} популярных игр`;
      case 'fr': return `${num} jeux populaires`;
      case 'de': return `${num} beliebte Spieletitel`;
      case 'es': return `${num} títulos de juegos populares`;
      default: return `${num} hot game titles`;
    }
  });

  // "nhiều tựa game hot" / "nhiều tựa game" -> "many hot game titles"
  const manyGamesPatterns = [
    /nhiều\s*tựa\s*game\s*hot/gi,
    /nhiều\s*game\s*hot/gi,
    /nhiều\s*tựa\s*game/gi,
    /nhiều\s*game/gi,
    /các\s*tựa\s*game\s*hot/gi
  ];
  manyGamesPatterns.forEach(pat => {
    res = res.replace(pat, () => {
      switch (targetLang) {
        case 'en': return 'many hot game titles';
        case 'zh': return '众多热门游戏';
        case 'ja': return '多数の人気ゲーム';
        case 'ko': return '다양한 인기 게임';
        case 'ru': return 'множество популярных игр';
        case 'fr': return 'de nombreux jeux populaires';
        case 'de': return 'viele beliebte Spieletitel';
        case 'es': return 'muchos juegos populares';
        default: return 'many hot game titles';
      }
    });
  });

  // "hàng ngàn tựa game"
  res = res.replace(/(hàng\s*ngàn|hàng\s*triệu|vô\s*số)\s*(tựa\s*game|game)/gi, () => {
    switch (targetLang) {
      case 'en': return 'thousands of game titles';
      case 'zh': return '数千款热门游戏';
      case 'ja': return '何千ものゲームタイトル';
      case 'ko': return '수천 개의 게임 타이틀';
      case 'ru': return 'тысячи популярных игр';
      case 'fr': return 'des milliers de jeux';
      case 'de': return 'Tausende von Spieletiteln';
      case 'es': return 'miles de títulos de juegos';
      default: return 'thousands of game titles';
    }
  });

  // "tiết kiệm đến X%"
  res = res.replace(/tiết\s*kiệm\s*đến\s*(\d+)%/gi, (_m, pct) => {
    switch (targetLang) {
      case 'en': return `SAVE UP TO ${pct}%`;
      case 'zh': return `最高立省 ${pct}%`;
      case 'ja': return `最大 ${pct}% オフ`;
      case 'ko': return `최대 ${pct}% 할인`;
      case 'ru': return `ЭКОНОМИЯ ДО ${pct}%`;
      case 'fr': return `ÉCONOMISEZ JUSQU’À ${pct}%`;
      case 'de': return `BIS ZU ${pct}% SPAREN`;
      case 'es': return `AHORRA HASTA UN ${pct}%`;
      default: return `SAVE UP TO ${pct}%`;
    }
  });

  // Handle standard subheading structure if it matches the general pattern
  const prefixMatch = res.match(/^(Giải pháp gom đơn thông minh:?\s*Nhận giá sỉ gốc cho\s*)(.*?)(\.?\s*Thanh toán tự động.*)?$/i);
  if (prefixMatch) {
    const productsPart = prefixMatch[2] || '';
    let translatedProducts = productsPart
      .replace(/Game Steam/gi, 'Steam Games')
      .replace(/và/gi, targetLang === 'zh' ? '以及' : targetLang === 'ja' ? '、' : targetLang === 'ko' ? ' 및 ' : targetLang === 'ru' ? 'и' : targetLang === 'fr' ? 'et' : targetLang === 'de' ? 'und' : targetLang === 'es' ? 'y' : 'and');

    translatedProducts = translateHeroSentence(translatedProducts, targetLang);

    switch (targetLang) {
      case 'en':
        return `Smart group-buy solution: Get direct wholesale pricing for ${translatedProducts}. Instant automated delivery backed by 100% Escrow guarantee.`;
      case 'zh':
        return `智能拼单解决方案：${translatedProducts}批发低价。100% 智能托管保障，支付后全自动秒级发货。`;
      case 'ja':
        return `スマートな共同購入：${translatedProducts}が卸売価格。100% エスクロー保証＆即時自動配信。`;
      case 'ko':
        return `스마트 디지털 공구: ${translatedProducts} 도매가 제공. 100% 에스크로 안심 보증과 결제 즉시 자동 발송 시스템.`;
      case 'ru':
        return `Умный групповой выкуп: ${translatedProducts} по оптовым ценам. 100% защита Escrow и автоматическая доставка за секунды.`;
      case 'fr':
        return `Solution d’achat groupé intelligente : obtenez des prix de gros pour ${translatedProducts}. Livraison automatisée garantie par séquestre 100% Escrow.`;
      case 'de':
        return `Smarte Sammelkauf-Lösung: Erhalten Sie Großhandelspreise für ${translatedProducts}. Sofortige automatisierte Bereitstellung mit 100% Escrow-Garantie.`;
      case 'es':
        return `Solución inteligente de compra grupal: Precios mayoristas directos para ${translatedProducts}. Entrega automatizada con 100% garantía Escrow.`;
    }
  }

  // 4. Comprehensive Phrase & Vocabulary Substitution Dictionary
  const vocab: [RegExp, Record<string, string>][] = [
    [/mua chung giá rẻ/gi, { en: 'Cheap Group Buy', zh: '低价拼单', ja: '格安共同購入', ko: '초특가 공동구매', ru: 'Дешевый групповой выкуп', fr: 'Achat groupé pas cher', de: 'Günstiger Gruppenkauf', es: 'Compra colectiva económica' }],
    [/lẻ như buôn/gi, { en: 'Retail at Wholesale Prices', zh: '散买享批发价', ja: '単品でも卸売価格', ko: '소매도 도매가로', ru: 'Розница по оптовым ценам', fr: 'Détail au prix de gros', de: 'Einzelkauf zum Großhandelspreis', es: 'Al por menor a precio de mayor' }],
    [/lẻ giá buôn/gi, { en: 'Retail at Wholesale Prices', zh: '零售享批发价', ja: '単品でも卸売価格', ko: '소매도 도매가로', ru: 'Розница по оптовым ценам', fr: 'Détail au prix de gros', de: 'Einzelkauf zum Großhandelspreis', es: 'Al por menor a precio de mayor' }],
    [/mua lẻ giá sỉ/gi, { en: 'Retail at Wholesale Prices', zh: '散买享批发价', ja: '単品でも卸売価格', ko: '소매도 도매가로', ru: 'Розница по оптовым ценам', fr: 'Détail au prix de gros', de: 'Einzelkauf zum Großhandelspreis', es: 'Al por menor a precio de mayor' }],
    [/lẻ giá sỉ/gi, { en: 'Retail at Wholesale Prices', zh: '散买享批发价', ja: '単品でも卸売価格', ko: '소매도 도매가로', ru: 'Розница по оптовым ценам', fr: 'Détail au prix de gros', de: 'Einzelkauf zum Großhandelspreis', es: 'Al por menor a precio de mayor' }],
    [/mua chung/gi, { en: 'Group Buy', zh: '拼团购买', ja: '共同購入', ko: '공동구매', ru: 'Совместные покупки', fr: 'Achat groupé', de: 'Gruppenkauf', es: 'Compra colectiva' }],
    [/gom đơn/gi, { en: 'Group Order', zh: '拼单集单', ja: 'まとめ注文', ko: '공구 모집', ru: 'Совместный сбор', fr: 'Regroupement', de: 'Sammelbestellung', es: 'Agrupación de pedidos' }],
    [/giá sỉ gốc/gi, { en: 'direct wholesale pricing', zh: '源头批发底价', ja: '卸売直販価格', ko: '도매 직거래 원가', ru: 'прямые оптовые цены', fr: 'prix de gros direct', de: 'direkte Großhandelspreise', es: 'precios mayoristas directos' }],
    [/giá sỉ/gi, { en: 'Wholesale Price', zh: '批发价', ja: '卸売価格', ko: '도매가', ru: 'Оптовая цена', fr: 'Prix de gros', de: 'Großhandelspreis', es: 'Precio mayorista' }],
    [/giá buôn/gi, { en: 'Wholesale Price', zh: '批发价', ja: '卸売価格', ko: '도매가', ru: 'Оптовая цена', fr: 'Prix de gros', de: 'Großhandelspreis', es: 'Precio mayorista' }],
    [/giá rẻ/gi, { en: 'Best Price', zh: '超低价', ja: '格安', ko: '최저가', ru: 'Низкие цены', fr: 'Meilleur prix', de: 'Bestpreis', es: 'Mejor precio' }],
    [/siêu rẻ/gi, { en: 'Super Cheap', zh: '超值底价', ja: '超格安', ko: '초특가', ru: 'Супер дешево', fr: 'Super pas cher', de: 'Super günstig', es: 'Súper barato' }],
    [/key bản quyền/gi, { en: 'Genuine License Keys', zh: '正版激活密钥', ja: '正規ライセンスキー', ko: '정품 라이선스 키', ru: 'Лицензионные ключи', fr: 'Clés de licence officielles', de: 'Offizielle Lizenzschlüssel', es: 'Claves de licencia oficiales' }],
    [/bản quyền chính hãng/gi, { en: '100% Genuine License', zh: '官方正版授权', ja: '公式正規ライセンス', ko: '100% 공식 정품', ru: 'Официальная лицензия', fr: 'Licence 100% authentique', de: '100% Originallizenz', es: 'Licencia 100% auténtica' }],
    [/sản phẩm số/gi, { en: 'Digital Products', zh: '数字产品', ja: 'デジタル商品', ko: '디지털 상품', ru: 'Цифровые товары', fr: 'Produits numériques', de: 'Digitale Produkte', es: 'Productos digitales' }],
    [/tài khoản premium/gi, { en: 'Premium Accounts', zh: '高级高级账号', ja: 'プレミアムアカウント', ko: '프리미엄 계정', ru: 'Премиум аккаунты', fr: 'Comptes Premium', de: 'Premium-Konten', es: 'Cuentas Premium' }],
    [/tiết kiệm tối đa/gi, { en: 'Maximum Savings', zh: '最高立省', ja: '最大の節約', ko: '최대 절약', ru: 'Максимальная экономия', fr: 'Économies maximales', de: 'Maximale Ersparnis', es: 'Máximo ahorro' }],
    [/tiết kiệm/gi, { en: 'Save', zh: '省钱', ja: '節約', ko: '절약', ru: 'Экономия', fr: 'Économie', de: 'Sparen', es: 'Ahorro' }],
    [/Giải pháp gom đơn thông minh/gi, { en: 'Smart group-buy solution', zh: '智能拼单解决方案', ja: 'スマートな共同購入ソリューション', ko: '스마트 공동구매 솔루션', ru: 'Умное решение для совместных покупок', fr: 'Solution d’achat groupé intelligente', de: 'Smarte Sammelkauf-Lösung', es: 'Solución inteligente de compra grupal' }],
    [/Thanh toán tự động/gi, { en: 'Automated payment', zh: '全自动秒级支付', ja: '自動決済対応', ko: '자동 결제 시스템', ru: 'Автоматическая оплата', fr: 'Paiement automatisé', de: 'Automatisierte Bezahlung', es: 'Pago automatizado' }],
    [/nhận mã tức thì/gi, { en: 'instant code delivery', zh: '即时获取激活码', ja: 'コード即時受取', ko: '즉시 코드 수령', ru: 'мгновенная выдача ключа', fr: 'réception instantanée du code', de: 'sofortige Code-Bereitstellung', es: 'entrega instantánea del código' }],
    [/hợp đồng bảo lãnh Escrow 100%/gi, { en: 'backed by 100% Escrow guarantee', zh: '由 100% 智能托管提供保障', ja: '100% エスクロー保証付き', ko: '100% 에스크로 안심 보증', ru: 'под защитой 100% Escrow', fr: 'garanti à 100% par séquestre Escrow', de: 'abgesichert durch 100% Escrow-Garantie', es: 'respaldado por garantía Escrow 100%' }],
    [/bảo lãnh escrow/gi, { en: 'Escrow Guarantee', zh: '托管保障', ja: 'エスクロー保証', ko: '에스크로 보증', ru: 'Защита Escrow', fr: 'Garantie Escrow', de: 'Escrow-Treuhand', es: 'Garantía Escrow' }],
    [/hoàn tiền 100%/gi, { en: '100% Refundable', zh: '100% 可退款', ja: '100% 返金保証', ko: '100% 환불 보장', ru: '100% Возврат', fr: '100% Remboursable', de: '100% Erstattbar', es: '100% Reembolsable' }],
    [/bảo hành 1:1/gi, { en: '1:1 Replacement Warranty', zh: '1:1 换新质保', ja: '1対1 交換保証', ko: '1:1 맞교환 안심케어', ru: 'Замена 1 к 1', fr: 'Remplacement 1:1 garanti', de: '1:1 Sofort-Ersatzgarantie', es: 'Garantía de sustitución 1:1' }],
    [/an toàn\s*[-–—&,]\s*nhanh chóng/gi, { en: 'Safe & Fast', zh: '安全极速', ja: '安心・迅速', ko: '안전하고 빠른', ru: 'Безопасно и быстро', fr: 'Sécurisé & Rapide', de: 'Sicher & Schnell', es: 'Seguro y Rápido' }],
    [/an toàn/gi, { en: 'Safe & Secure', zh: '安全保障', ja: '安心・安全', ko: '안전 보장', ru: 'Безопасно', fr: 'Sécurisé', de: 'Sicher', es: 'Seguro' }],
    [/nhanh chóng/gi, { en: 'Fast & Instant', zh: '极速到账', ja: '迅速・即時', ko: '신속 처리', ru: 'Быстро', fr: 'Rapide', de: 'Schnell', es: 'Rápido' }],
    [/uy tín/gi, { en: '100% Trusted', zh: '信誉保障', ja: '信頼保証', ko: '신뢰 보증', ru: 'Надежно', fr: 'Fiable', de: 'Zuverlässig', es: 'Confiable' }],
    [/chất lượng cao/gi, { en: 'High Quality', zh: '高品质', ja: '高品質', ko: '고품질', ru: 'Высокое качество', fr: 'Haute qualité', de: 'Hohe Qualität', es: 'Alta calidad' }],
    [/chất lượng/gi, { en: 'Quality', zh: '优质', ja: '品質保証', ko: '품질 보증', ru: 'Качественно', fr: 'Qualité', de: 'Qualität', es: 'Calidad' }],
    [/tiện lợi/gi, { en: 'Convenient', zh: '便捷', ja: '便利', ko: '편리한', ru: 'Удобно', fr: 'Pratique', de: 'Bequem', es: 'Conveniente' }],
    [/siêu tốc/gi, { en: 'Ultra Fast', zh: '秒级极速', ja: '超高速', ko: '초고속', ru: 'Сверхбыстро', fr: 'Ultra Rapide', de: 'Ultraschnell', es: 'Ultrarrápido' }],
    [/chuyên nghiệp/gi, { en: 'Professional', zh: '专业', ja: 'プロ仕様', ko: '전문적인', ru: 'Профессионально', fr: 'Professionnel', de: 'Professionell', es: 'Profesional' }],
    [/không lo scam/gi, { en: 'Scam-Free Guaranteed', zh: '防骗零风险保障', ja: '詐欺ゼロ保証', ko: '사기 걱정 제로 보증', ru: '100% без скама', fr: 'Garanti sans arnaque', de: 'Garantiert betrugsfrei', es: 'Garantizado sin estafas' }]
  ];

  vocab.forEach(([pat, trans]) => {
    if (trans[targetLang]) {
      res = res.replace(pat, trans[targetLang]);
    }
  });

  // If after vocabulary replacement the text still has un-translated Vietnamese words or is dynamic,
  // pass through the VI -> EN Master -> Target Language chain pipeline
  if (targetLang !== 'vi' && /[\u00C0-\u1EF9]/i.test(res)) {
    res = executeChainTranslation(res, targetLang as SupportedLocale);
  }

  return isAllUpper ? res.toUpperCase() : res;
}

/**
 * Translate complete source Hero data into target language
 */
export function translateHeroFromSource(
  source: HeroTranslationData, 
  targetLang: SupportedLocale
): HeroTranslationData {
  if (targetLang === 'vi') return source;

  return {
    badgeText: translateHeroSentence(source.badgeText || '', targetLang),
    mainHeadingLine1: translateHeroSentence(source.mainHeadingLine1 || '', targetLang),
    mainHeadingLine2: translateHeroSentence(source.mainHeadingLine2 || '', targetLang),
    subheading: translateHeroSentence(source.subheading || '', targetLang),
    pod1Title: translateHeroSentence(source.pod1Title || '', targetLang),
    pod1Val: source.pod1Val || '',
    pod1Sub: translateHeroSentence(source.pod1Sub || '', targetLang),
    pod2Title: translateHeroSentence(source.pod2Title || '', targetLang),
    pod2Val: source.pod2Val || '',
    pod2Sub: translateHeroSentence(source.pod2Sub || '', targetLang)
  };
}

// 9-Language Launchpad Buttons Dictionary
export const LAUNCHPAD_BUTTONS_TRANSLATIONS: Record<string, Record<string, string>> = {
  topup: {
    vi: '⚡ Nạp 121 Game (3s)',
    en: '⚡ Direct Top-Up (3s)',
    zh: '⚡ 121款游戏秒冲',
    ja: '⚡ ゲーム即時チャージ (3秒)',
    ko: '⚡ 121개 게임 3초 충전',
    ru: '⚡ Пополнение игр (3с)',
    fr: '⚡ Recharge Directe (3s)',
    de: '⚡ Direkt-Aufladung (3s)',
    es: '⚡ Recarga Directa (3s)'
  },
  createPool: {
    vi: '🚀 Mở Gom Đơn Mới',
    en: '🚀 Start Group Pool',
    zh: '🚀 发起新拼团',
    ja: '🚀 新規プール作成',
    ko: '🚀 새 공동구매 개설',
    ru: '🚀 Создать сбор',
    fr: '🚀 Créer un Groupe',
    de: '🚀 Neuen Pool starten',
    es: '🚀 Crear Grupo'
  },
  depositHub: {
    vi: '🏦 Nạp Tiền VietQR',
    en: '🏦 Deposit Funds',
    zh: '🏦 钱包资金充值',
    ja: '🏦 残高チャージ',
    ko: '🏦 지갑 충전하기',
    ru: '🏦 Пополнить баланс',
    fr: '🏦 Recharger Solde',
    de: '🏦 Guthaben aufladen',
    es: '🏦 Depositar Fondos'
  },
  telcoCard: {
    vi: '💳 Đổi Thẻ Cào Tự Động',
    en: '💳 Prepaid Card Exchange',
    zh: '💳 点卡/充值卡兑换',
    ja: '💳 プリペイドカード換金',
    ko: '💳 상품권 자동 충전',
    ru: '💳 Обмен карт оплаты',
    fr: '💳 Échange de Cartes',
    de: '💳 Guthabenkarten-Tausch',
    es: '💳 Canje de Tarjetas'
  },
  luckyWheel: {
    vi: '🎡 Vòng Quay May Mắn',
    en: '🎡 Lucky Spin Wheel',
    zh: '🎡 幸运大转盘',
    ja: '🎡 ラッキールーレット',
    ko: '🎡 행운의 룰렛',
    ru: '🎡 Колесо фортуны',
    fr: '🎡 Roue de la Fortune',
    de: '🎡 Glücksrad',
    es: '🎡 Ruleta de la Suerte'
  },
  affiliate: {
    vi: '🤝 Đại Lý CTV (-10%)',
    en: '🤝 Affiliate Partner (-10%)',
    zh: '🤝 推广分销合伙人 (-10%)',
    ja: '🤝 アフィリエイト (-10%)',
    ko: '🤝 파트너 제휴 (-10%)',
    ru: '🤝 Партнёрская сеть (-10%)',
    fr: '🤝 Programme Affilié (-10%)',
    de: '🤝 Partnerprogramm (-10%)',
    es: '🤝 Programa de Afiliados (-10%)'
  },
  escrowGuide: {
    vi: '🛡️ Quy Trình Escrow',
    en: '🛡️ Escrow Workflow',
    zh: '🛡️ 智能托管保障流程',
    ja: '🛡️ エスクロー保証ガイド',
    ko: '🛡️ 에스크로 보증 안내',
    ru: '🛡️ Как работает Escrow',
    fr: '🛡️ Processus Escrow',
    de: '🛡️ Escrow-Ablauf',
    es: '🛡️ Proceso de Escrow'
  },
  txLedger: {
    vi: '📑 Sao Kê Ví',
    en: '📑 Wallet Ledger',
    zh: '📑 账户交易明细',
    ja: '📑 取引明細台帳',
    ko: '📑 거래 내역서',
    ru: '📑 Выписка кошелька',
    fr: '📑 Relevé de Compte',
    de: '📑 Kontoauszug',
    es: '📑 Historial de Cuenta'
  },
  fanMenu: {
    vi: '📂 18 Tiện Ích',
    en: '📂 18 Utilities Hub',
    zh: '📂 18项全能工具箱',
    ja: '📂 18種便利ツール',
    ko: '📂 18개 종합 유틸리티',
    ru: '📂 Все 18 утилит',
    fr: '📂 18 Utilitaires',
    de: '📂 18 Utilities',
    es: '📂 18 Utilidades'
  }
};

// Localize Hero Configuration Helper
export function getLocalizedHeroConfig(
  config: HeroCustomConfig, 
  localeInput: string = 'vi',
  t?: (key: string) => string
): HeroCustomConfig {
  if (!config) return config;

  let lang = 'en';
  const cleanLocale = (localeInput || 'vi').toLowerCase();
  if (cleanLocale === 'vi' || cleanLocale.startsWith('vi')) lang = 'vi';
  else if (cleanLocale.startsWith('zh')) lang = 'zh';
  else if (cleanLocale.startsWith('ja')) lang = 'ja';
  else if (cleanLocale.startsWith('ko')) lang = 'ko';
  else if (cleanLocale.startsWith('ru')) lang = 'ru';
  else if (cleanLocale.startsWith('fr')) lang = 'fr';
  else if (cleanLocale.startsWith('de')) lang = 'de';
  else if (cleanLocale.startsWith('es')) lang = 'es';
  else if (cleanLocale.startsWith('en')) lang = 'en';

  // If locale is Vietnamese and original is Vietnamese, keep verbatim
  if (lang === 'vi') {
    return config;
  }

  // If custom translations exist for this language, use them with dynamic fallback
  const customTrans = config.translations?.[localeInput] || 
    config.translations?.[lang] || 
    config.translations?.[cleanLocale];

  // Dynamic automatic translation generated directly from the live config content
  const dynamicAutoTrans = translateHeroFromSource({
    badgeText: config.badgeText,
    mainHeadingLine1: config.mainHeadingLine1,
    mainHeadingLine2: config.mainHeadingLine2,
    subheading: config.subheading,
    pod1Title: config.trustPod1?.title,
    pod1Val: config.trustPod1?.value,
    pod1Sub: config.trustPod1?.sub,
    pod2Title: config.trustPod2?.title,
    pod2Val: config.trustPod2?.value,
    pod2Sub: config.trustPod2?.sub
  }, lang as SupportedLocale);

  // Localized values: Priority is Custom Override (sanitized) -> Dynamic Translation from Live Config -> Dictionary -> Config
  const rawBadge = customTrans?.badgeText || dynamicAutoTrans.badgeText || config.badgeText;
  const rawHeading1 = customTrans?.mainHeadingLine1 || dynamicAutoTrans.mainHeadingLine1 || config.mainHeadingLine1;
  const rawHeading2 = customTrans?.mainHeadingLine2 || dynamicAutoTrans.mainHeadingLine2 || config.mainHeadingLine2;
  const rawSubheading = customTrans?.subheading || dynamicAutoTrans.subheading || config.subheading;

  const badgeText = translateHeroSentence(rawBadge, lang);
  const mainHeadingLine1 = translateHeroSentence(rawHeading1, lang);
  const mainHeadingLine2 = translateHeroSentence(rawHeading2, lang);
  const subheading = translateHeroSentence(rawSubheading, lang);

  const rawPod1Title = customTrans?.pod1Title || dynamicAutoTrans.pod1Title || config.trustPod1?.title;
  const rawPod1Val = customTrans?.pod1Val || dynamicAutoTrans.pod1Val || config.trustPod1?.value;
  const rawPod1Sub = customTrans?.pod1Sub || dynamicAutoTrans.pod1Sub || config.trustPod1?.sub;

  const pod1Title = translateHeroSentence(rawPod1Title || '', lang);
  const pod1Val = rawPod1Val;
  const pod1Sub = translateHeroSentence(rawPod1Sub || '', lang);

  const rawPod2Title = customTrans?.pod2Title || dynamicAutoTrans.pod2Title || config.trustPod2?.title;
  const rawPod2Val = customTrans?.pod2Val || dynamicAutoTrans.pod2Val || config.trustPod2?.value;
  const rawPod2Sub = customTrans?.pod2Sub || dynamicAutoTrans.pod2Sub || config.trustPod2?.sub;

  const pod2Title = translateHeroSentence(rawPod2Title || '', lang);
  const pod2Val = rawPod2Val;
  const pod2Sub = translateHeroSentence(rawPod2Sub || '', lang);

  // Localize launchpad buttons if any
  const localizedButtons = (config.launchpadButtons || []).map(btn => {
    const btnTranslation = LAUNCHPAD_BUTTONS_TRANSLATIONS[btn.key]?.[lang] || 
      LAUNCHPAD_BUTTONS_TRANSLATIONS[btn.key]?.['en'];
    return {
      ...btn,
      label: btnTranslation || btn.label
    };
  });

  return {
    ...config,
    badgeText,
    mainHeadingLine1,
    mainHeadingLine2,
    subheading,
    trustPod1: config.trustPod1 ? {
      ...config.trustPod1,
      title: pod1Title || config.trustPod1.title,
      value: pod1Val || config.trustPod1.value,
      sub: pod1Sub || config.trustPod1.sub
    } : config.trustPod1,
    trustPod2: config.trustPod2 ? {
      ...config.trustPod2,
      title: pod2Title || config.trustPod2.title,
      value: pod2Val || config.trustPod2.value,
      sub: pod2Sub || config.trustPod2.sub
    } : config.trustPod2,
    launchpadButtons: localizedButtons
  };
}
