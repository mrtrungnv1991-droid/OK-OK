import fs from 'fs';
import path from 'path';

// Complete dictionary for all 21 products across 9 languages
const products = {
  // 1. ChatGPT Plus
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

  // 2. Black Myth Wukong
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

  // 13. Cyberpunk 2077
  'prod-cyberpunk-phantom-liberty': {
    vi: {
      title: 'Steam CDKey: Cyberpunk 2077 + Phantom Liberty DLC (Global Key)',
      subtitle: 'Trọn bộ game gốc Cyberpunk 2077 kèm DLC Phantom Liberty kích hoạt Steam toàn cầu',
      deliveryEstimate: 'Mã CDKey tự động vào Vault ngay',
      description: 'Bản quyền trọn bộ Cyberpunk 2077 và bản mở rộng Phantom Liberty trên Steam. Trải nghiệm đồ hoạ Ray Tracing Overdrive đỉnh cao tại thành phố Night City.',
      features: ['Bao gồm game gốc + DLC Phantom Liberty', 'Kích hoạt tài khoản Steam chính chủ (Global)', 'Đồ hoạ Path Tracing đỉnh cao công nghệ', 'Bảo hành vĩnh viễn'],
      instructions: ['1. Nhận mã Steam CDKey trong Vault', '2. Mở Steam -> Add a Game -> Activate a Product on Steam', '3. Tải game và khám phá Night City'],
      tags: ['Steam', 'Cyberpunk', 'RPG', 'Global Key']
    },
    en: {
      title: 'Steam CDKey: Cyberpunk 2077 + Phantom Liberty DLC (Global Key)',
      subtitle: 'Complete Cyberpunk 2077 bundle with Phantom Liberty DLC for worldwide Steam activation',
      deliveryEstimate: 'CDKey automatically delivered to your Vault',
      description: 'Official Steam bundle including Cyberpunk 2077 base game and Phantom Liberty expansion. Experience state-of-the-art Ray Tracing Overdrive in Night City.',
      features: ['Includes base game + Phantom Liberty expansion', 'Activates directly on personal Steam account (Global)', 'Cutting-edge Path Tracing graphical fidelity', 'Lifetime warranty guarantee'],
      instructions: ['1. Retrieve your Steam CDKey from Vault', '2. Open Steam -> Games -> Activate a Product on Steam', '3. Download and explore Night City'],
      tags: ['Steam', 'Cyberpunk', 'RPG', 'Global Key']
    },
    zh: {
      title: 'Steam CDKey: 赛博朋克2077 + 往日之影 DLC 终极合集 (全球版)',
      subtitle: '包含本体及往日之影扩展包全球激活密钥，开启全景光追顶级视觉盛宴',
      deliveryEstimate: 'CDKey 即刻自动发放至保险库',
      description: 'Steam 官方正版全球激活《赛博朋克2077》本体 +《往日之影》大型剧情资料片。在夜之城畅享次世代光线追踪 Overdrive 沉浸式体验。',
      features: ['包含完整游戏本体及《往日之影》大型扩展包', '直接激活至个人 Steam 主账号（全球无锁区）', '支持全景光线追踪 Path Tracing 顶级视效', '终身质保保障，永不召回'],
      instructions: ['1. 在保险库中复制您的 Steam CDKey', '2. 打开 Steam 客户端 -> 游戏 -> 在 Steam 上激活产品', '3. 下载游戏尽情踏入夜之城冒险'],
      tags: ['Steam', '赛博朋克', '开放世界RPG', '全球Key']
    },
    ja: {
      title: 'Steam CDKey: サイバーパンク2077 ＋ 仮初めの自由 DLC (Global Key)',
      subtitle: '本編と大型拡張DLC「仮初めの自由」がセットになったグローバル版 Steam キー',
      deliveryEstimate: '購入後すぐに Vault へ CDKey を自動納品',
      description: 'Steam 版『サイバーパンク2077』本編と拡張パック『仮初めの自由』の正規セット。ナイトシティで最先端のパストレーシンググラフィックスを体験。',
      features: ['本編 ＋ 拡張パック「仮初めの自由」完全収録', '個人の Steam アカウントに直接登録可能（地域制限なし）', '超美麗なパストレーシング技術に対応', '永久保証付き'],
      instructions: ['1. Vault から Steam CDKey を取得', '2. Steam 起動 -> ゲーム -> Steam でアイテムを有効化', '3. ゲームをインストールしてナイトシティへ'],
      tags: ['Steam', 'サイバーパンク', 'オープンワールドRPG']
    },
    ko: {
      title: 'Steam CDKey: 사이버펑크 2077 + 팬텀 리버티 DLC (글로벌 키)',
      subtitle: '본편과 팬텀 리버티 확장팩이 포함된 Steam 글로벌 활성화 정품 CDKey',
      deliveryEstimate: '구매 즉시 Vault로 CDKey 자동 배정',
      description: 'Steam 공식 정품 사이버펑크 2077 본편 및 팬텀 리버티 DLC 통합 번들. 나이트 시티에서 최첨단 풀 레이 트레이싱 오버드라이브 그래픽을 경험하세요.',
      features: ['본편 게임 및 팬텀 리버티 확장팩 전체 포함', '개인 Steam 본계정 직접 활성화 (국가 제한 없음)', '초고화질 패스 트레이싱 그래픽 기술 지원', '영구 소장 정품 보증'],
      instructions: ['1. 볼트에서 Steam CDKey 복사', '2. Steam 실행 -> 게임 -> Steam에 제품 등록', '3. 다운로드 후 나이트 시티 모험 시작'],
      tags: ['Steam', '사이버펑크', 'RPG', '글로벌 키']
    },
    ru: {
      title: 'Steam CDKey: Cyberpunk 2077 + Phantom Liberty DLC (Global Key)',
      subtitle: 'Полный комплект игры с дополнением Phantom Liberty для активации в Steam по всему миру',
      deliveryEstimate: 'Ключ мгновенно поступает в Cyber Vault',
      description: 'Официальный комплект Cyberpunk 2077 и DLC Phantom Liberty. Наслаждайтесь трассировкой лучей в потрясающем городе Night City.',
      features: ['Игра + дополнение Phantom Liberty', 'Активация на личный аккаунт Steam (Global)', 'Графика Path Tracing нового поколения', 'Пожизненная гарантия'],
      instructions: ['1. Скопируйте ключ из Vault', '2. Steam -> Игры -> Активировать в Steam', '3. Скачайте игру и начните приключение'],
      tags: ['Steam', 'Cyberpunk', 'RPG', 'Global Key']
    },
    fr: {
      title: 'Clé Steam : Cyberpunk 2077 + DLC Phantom Liberty (Clé Globale)',
      subtitle: 'Bundle complet Cyberpunk 2077 avec DLC Phantom Liberty, activation mondiale sur Steam',
      deliveryEstimate: 'Clé CD envoyée automatiquement dans votre Vault',
      description: 'Pack officiel Steam comprenant Cyberpunk 2077 et son extension Phantom Liberty. Découvrez Night City avec le Ray Tracing Overdrive de nouvelle génération.',
      features: ['Jeu de base + extension Phantom Liberty', 'Activation directe sur compte Steam personnel', 'Technologie graphique avancée Path Tracing', 'Garantie à vie'],
      instructions: ['1. Récupérez votre clé Steam dans le Vault', '2. Ouvrez Steam -> Jeux -> Activer un produit sur Steam', '3. Téléchargez le jeu et explorez Night City'],
      tags: ['Steam', 'Cyberpunk', 'RPG', 'Clé Globale']
    },
    de: {
      title: 'Steam CDKey: Cyberpunk 2077 + Phantom Liberty DLC (Global Key)',
      subtitle: 'Komplettes Bundle aus Cyberpunk 2077 und Phantom Liberty DLC für weltweite Steam-Aktivierung',
      deliveryEstimate: 'CDKey wird sofort im Cyber Vault bereitgestellt',
      description: 'Offizielles Steam-Bundle inklusive Cyberpunk 2077 Basisspiel und Phantom Liberty Erweiterung. Erleben Sie Night City in wegweisender Path-Tracing-Grafik.',
      features: ['Hauptspiel + Phantom Liberty Erweiterung', 'Direkt auf eigenem Steam-Konto aktivierbar (Global)', 'Next-Gen Raytracing Overdrive Technologie', 'Lebenslange Garantie'],
      instructions: ['1. Steam-Key im Vault abrufen', '2. Steam öffnen -> Spiele -> Produkt bei Steam aktivieren', '3. Spiel herunterladen und Night City erkunden'],
      tags: ['Steam', 'Cyberpunk', 'RPG', 'Global Key']
    },
    es: {
      title: 'Steam CDKey: Cyberpunk 2077 + DLC Phantom Liberty (Global Key)',
      subtitle: 'Paquete completo con el juego base y la expansión Phantom Liberty para activación global en Steam',
      deliveryEstimate: 'CDKey entregado de inmediato en tu Cyber Vault',
      description: 'Paquete oficial de Steam con Cyberpunk 2077 y la expansión Phantom Liberty. Disfruta de Night City con la tecnología gráfica más puntera de Ray Tracing.',
      features: ['Incluye juego base + expansión Phantom Liberty', 'Activación directa en tu cuenta de Steam (Global)', 'Gráficos avanzados con trazado de rayos', 'Garantía de por vida'],
      instructions: ['1. Obtén tu CDKey de Steam en tu Vault', '2. Abre Steam -> Juegos -> Activar un producto en Steam', '3. Descarga el juego y explora Night City'],
      tags: ['Steam', 'Cyberpunk', 'RPG', 'Global Key']
    }
  },

  // 14. Elden Ring: Shadow of the Erdtree
  'prod-elden-ring-erdtree': {
    vi: {
      title: 'Steam CDKey: Elden Ring Shadow of the Erdtree Edition (Global)',
      subtitle: 'Siêu phẩm Game of the Year kèm DLC Shadow of the Erdtree kích hoạt Steam toàn cầu',
      deliveryEstimate: 'Mã CDKey tự động vào Vault ngay',
      description: 'Bản quyền Steam chính hãng Elden Ring kèm bản mở rộng Shadow of the Erdtree. Khám phá Vùng đất Bóng tối với đồ hoạ hùng vĩ và độ khó đỉnh cao.',
      features: ['Bao gồm Elden Ring + DLC Shadow of the Erdtree', 'Kích hoạt tài khoản Steam chính chủ (Global)', 'Game of the Year danh giá từ FromSoftware', 'Bảo hành vĩnh viễn'],
      instructions: ['1. Nhận mã Steam CDKey trong Vault', '2. Mở Steam -> Add a Game -> Activate a Product on Steam', '3. Tải game và chinh phục Vùng đất Bóng tối'],
      tags: ['Steam', 'Elden Ring', 'Soulslike', 'Global Key']
    },
    en: {
      title: 'Steam CDKey: Elden Ring Shadow of the Erdtree Edition (Global)',
      subtitle: 'Game of the Year masterpiece bundle with Shadow of the Erdtree DLC for worldwide Steam activation',
      deliveryEstimate: 'CDKey automatically delivered to your Vault',
      description: 'Official Steam license for Elden Ring including the acclaimed Shadow of the Erdtree expansion. Journey through the Land of Shadow with breathtaking visuals and epic bosses.',
      features: ['Includes Elden Ring + Shadow of the Erdtree DLC', 'Activates directly on personal Steam account (Global)', 'Legendary Game of the Year from FromSoftware', 'Lifetime warranty guarantee'],
      instructions: ['1. Retrieve your Steam CDKey from Vault', '2. Open Steam -> Games -> Activate a Product on Steam', '3. Download and conquer the Land of Shadow'],
      tags: ['Steam', 'Elden Ring', 'Soulslike', 'Global Key']
    },
    zh: {
      title: 'Steam CDKey: 艾尔登法环：黄金树幽影版 (全球版 Global Key)',
      subtitle: 'TGA 年度最佳巨作包含黄金树幽影 DLC 全球激活密钥，踏入幽影之地开启史诗冒险',
      deliveryEstimate: 'CDKey 即刻自动发放至保险库',
      description: 'Steam 官方正版《艾尔登法环》(ELDEN RING) 本体及《黄金树幽影》大型扩展资料片。由 FromSoftware 倾力打造的史诗级暗黑奇幻动作游戏。',
      features: ['包含完整游戏本体及《黄金树幽影》DLC', '直接激活至个人 Steam 主账号（全球无锁区）', 'FromSoftware 屡获殊荣的年度殿堂级神作', '终身质保保障，永不召回'],
      instructions: ['1. 在保险库中复制您的 Steam CDKey', '2. 打开 Steam 客户端 -> 游戏 -> 在 Steam 上激活产品', '3. 开启幽影之地的褪色者征途'],
      tags: ['Steam', '艾尔登法环', '魂类神作', '全球Key']
    },
    ja: {
      title: 'Steam CDKey: エルデンリング SHADOW OF THE ERDTREE 版 (Global)',
      subtitle: 'ゲーム・オブ・ザ・イヤー受賞作と大型DLC「SHADOW OF THE ERDTREE」の正規キー',
      deliveryEstimate: '購入後すぐに Vault へ CDKey を自動納品',
      description: 'Steam 版『ELDEN RING』本編と大型拡張DLC『SHADOW OF THE ERDTREE』の公式ライセンス。壮大な影の地を舞台にした圧倒的なダークファンタジー世界。',
      features: ['ELDEN RING 本編 ＋ 拡張DLC を完全同梱', '個人の Steam アカウントに直接登録可能（国制限なし）', 'FromSoftware による究極のアクションRPG', '永久保証付き'],
      instructions: ['1. Vault から Steam CDKey を取得', '2. Steam 起動 -> ゲーム -> Steam でアイテムを有効化', '3. 影の地へ旅立ち新たな脅威に挑む'],
      tags: ['Steam', 'エルデンリング', 'ソウルライク']
    },
    ko: {
      title: 'Steam CDKey: 엘든 링 황금 나무의 그림자 에디션 (글로벌 키)',
      subtitle: '올해의 게임 수상작 본편과 황금 나무의 그림자 DLC 통합 Steam 글로벌 정품 키',
      deliveryEstimate: '구매 즉시 Vault로 CDKey 자동 배정',
      description: 'Steam 공식 정품 엘든 링 본편 및 황금 나무의 그림자 확장팩 통합 패키지. FromSoftware가 선사하는 웅장한 다크 판타지 세계관과 압도적인 보스 전투.',
      features: ['엘든 링 본편 + 황금 나무의 그림자 DLC 포함', '개인 Steam 본계정 직접 활성화 (글로벌 무제한)', '전 세계 수많은 올해의 게임(GOTY) 수상작', '영구 소장 정품 보증'],
      instructions: ['1. 볼트에서 Steam CDKey 복사', '2. Steam 실행 -> 게임 -> Steam에 제품 등록', '3. 그림자의 땅으로 떠나는 빛바랜 자의 여정'],
      tags: ['Steam', '엘든링', '소울라이크', '글로벌 키']
    },
    ru: {
      title: 'Steam CDKey: Elden Ring Shadow of the Erdtree Edition (Global)',
      subtitle: 'Шедевр Game of the Year с дополнением Shadow of the Erdtree для глобальной активации в Steam',
      deliveryEstimate: 'Ключ мгновенно поступает в Cyber Vault',
      description: 'Официальный ключ Steam для Elden Ring и дополнения Shadow of the Erdtree. Исследуйте Земли Теней в эпической экшен-RPG от FromSoftware.',
      features: ['Игра + дополнение Shadow of the Erdtree', 'Активация на личный аккаунт Steam (Global)', 'Игра года от студии FromSoftware', 'Пожизненная гарантия'],
      instructions: ['1. Скопируйте ключ из Vault', '2. Steam -> Игры -> Активировать в Steam', '3. Отправляйтесь в Земли Теней'],
      tags: ['Steam', 'Elden Ring', 'Soulslike', 'Global Key']
    },
    fr: {
      title: 'Clé Steam : Elden Ring Édition Shadow of the Erdtree (Clé Globale)',
      subtitle: 'Chef-d’œuvre Jeu de l’Année avec l’extension Shadow of the Erdtree, activation Steam globale',
      deliveryEstimate: 'Clé CD envoyée automatiquement dans votre Vault',
      description: 'Licence officielle Steam pour Elden Ring incluant l’extension Shadow of the Erdtree. Parcourez le Royaume des Ombres dans ce chef-d’œuvre signé FromSoftware.',
      features: ['Comprend Elden Ring + DLC Shadow of the Erdtree', 'Activation directe sur compte Steam personnel', 'Jeu de l’Année légendaire de FromSoftware', 'Garantie à vie'],
      instructions: ['1. Récupérez votre clé Steam dans le Vault', '2. Ouvrez Steam -> Jeux -> Activer un produit sur Steam', '3. Téléchargez et partez à la conquête des ombres'],
      tags: ['Steam', 'Elden Ring', 'Soulslike', 'Clé Globale']
    },
    de: {
      title: 'Steam CDKey: Elden Ring Shadow of the Erdtree Edition (Global)',
      subtitle: 'Spiel des Jahres Meisterwerk inklusive Shadow of the Erdtree DLC für weltweite Steam-Aktivierung',
      deliveryEstimate: 'CDKey wird sofort im Cyber Vault bereitgestellt',
      description: 'Offizielle Steam-Lizenz für Elden Ring inklusive der gefeierten Shadow of the Erdtree Erweiterung. Erkunden Sie das Schattenland in dieser epischen FromSoftware-Welt.',
      features: ['Enthält Elden Ring + Shadow of the Erdtree DLC', 'Direkt auf eigenem Steam-Konto aktivierbar (Global)', 'Ausgezeichnetes Spiel des Jahres von FromSoftware', 'Lebenslange Garantie'],
      instructions: ['1. Steam-Key im Vault abrufen', '2. Steam öffnen -> Spiele -> Produkt bei Steam aktivieren', '3. Schattenland betreten und Herausforderungen meistern'],
      tags: ['Steam', 'Elden Ring', 'Soulslike', 'Global Key']
    },
    es: {
      title: 'Steam CDKey: Elden Ring Edición Shadow of the Erdtree (Global)',
      subtitle: 'Obra maestra ganadora del Juego del Año con el DLC Shadow of the Erdtree para Steam global',
      deliveryEstimate: 'CDKey entregado de inmediato en tu Cyber Vault',
      description: 'Licencia oficial de Steam para Elden Ring incluyendo la aclamada expansión Shadow of the Erdtree. Recorre las Tierras de las Sombras en este titán de FromSoftware.',
      features: ['Incluye Elden Ring + DLC Shadow of the Erdtree', 'Activación directa en tu cuenta de Steam (Global)', 'Juego del Año con combates legendarios', 'Garantía de por vida'],
      instructions: ['1. Obtén tu CDKey de Steam en tu Vault', '2. Abre Steam -> Juegos -> Activar un producto en Steam', '3. Descarga y adéntrate en las Tierras de las Sombras'],
      tags: ['Steam', 'Elden Ring', 'Soulslike', 'Global Key']
    }
  },

  // 15. EA SPORTS FC 25
  'prod-ea-fc-25': {
    vi: {
      title: 'EA SPORTS FC 25 (Standard Edition Steam / EA App Key)',
      subtitle: 'Game bóng đá đỉnh cao với công nghệ FC IQ và chế độ 5v5 Rush mới nhất',
      deliveryEstimate: 'Mã kích hoạt chuyển vào Vault tức thì',
      description: 'Bản quyền game bóng đá EA SPORTS FC 25 chính hãng. Đầy đủ bản quyền các giải đấu hàng đầu UEFA Champions League, Premier League, LaLiga.',
      features: ['Chiến thuật thông minh FC IQ & Chế độ 5v5 Rush', 'Đầy đủ giải đấu UEFA, Premier League, LaLiga', 'Chơi online Ultimate Team mượt mà', 'Bảo hành vĩnh viễn'],
      instructions: ['1. Lấy mã kích hoạt trong Vault', '2. Kích hoạt trên EA App hoặc Steam', '3. Tải game và bắt đầu trận đấu đỉnh cao'],
      tags: ['EA Sports', 'FC 25', 'Bóng đá', 'Ultimate Team']
    },
    en: {
      title: 'EA SPORTS FC 25 (Standard Edition Steam / EA App Key)',
      subtitle: 'The pinnacle of football gaming with FC IQ tactical system and new 5v5 Rush mode',
      deliveryEstimate: 'Activation code instantly delivered to Vault',
      description: 'Official EA SPORTS FC 25 game license for Steam / EA App. Complete authentic licenses for UEFA Champions League, Premier League, LaLiga, and Ultimate Team.',
      features: ['FC IQ tactical foundation & dynamic 5v5 Rush mode', 'Authentic UEFA, Premier League, and LaLiga licenses', 'Full online Ultimate Team & Clubs competition', 'Lifetime warranty guarantee'],
      instructions: ['1. Retrieve activation code from Vault', '2. Redeem in EA App or Steam client', '3. Download and kick off your match'],
      tags: ['EA Sports', 'FC 25', 'Football', 'Ultimate Team']
    },
    zh: {
      title: 'EA SPORTS FC 25 (标准版 Steam / EA App 激活密钥)',
      subtitle: '次世代绿茵足球巅峰巨作，搭载全新 FC IQ 战术引擎与 5v5 Rush 极速模式',
      deliveryEstimate: '激活码即刻自动发至保险库',
      description: '官方正版 EA SPORTS FC 25 游戏激活码。拥有欧冠联赛、英超、西甲等全球顶级赛事的完整真实授权，畅玩 Ultimate Team 与俱乐部模式。',
      features: ['全新 FC IQ 战术系统与 5v5 Rush 快节奏模式', '欧冠联赛、英超、西甲等官方正版授权', '流畅在线 Ultimate Team 梦幻球队对战', '终身质保保障，永不召回'],
      instructions: ['1. 在保险库中获取激活码', '2. 在 EA App 或 Steam 客户端中兑换产品', '3. 下载游戏即刻开球开战'],
      tags: ['EA Sports', 'FC 25', '足球游戏', 'Ultimate Team']
    },
    ja: {
      title: 'EA SPORTS FC 25 (Standard Edition Steam / EA App Key)',
      subtitle: '最新の FC IQ 戦術エンジンと 5v5 Rush モードを搭載した最高峰サッカーゲーム',
      deliveryEstimate: '有効化コードを Vault に即時納品',
      description: 'EA SPORTS FC 25 の公式ライセンスキー。UEFA チャンピオンズリーグ、プレミアリーグ、ラ・リーガなどの完全公式ライセンスを収録。',
      features: ['FC IQ 戦術システム＆スピーディーな 5v5 Rush', 'UEFA チャンピオンズリーグ・プレミアリーグ公式収録', 'Ultimate Team での快適なオンライン対戦', '永久保証付き'],
      instructions: ['1. Vault からアクティベーションコードを取得', '2. EA App または Steam でコードを引き換え', '3. ゲームをダウンロードしてキックオフ'],
      tags: ['EA Sports', 'FC 25', 'サッカー', 'Ultimate Team']
    },
    ko: {
      title: 'EA SPORTS FC 25 (스탠다드 에디션 Steam / EA App 키)',
      subtitle: 'FC IQ 전술 시스템과 혁신적인 5v5 Rush 모드를 탑재한 축구 게임의 정점',
      deliveryEstimate: '활성화 코드 즉시 볼트 발송',
      description: '공식 정품 EA SPORTS FC 25 게임 키. UEFA 챔피언스리그, 프리미어리그, 라리가 공식 라이선스 완벽 탑재 및 Ultimate Team 온라인 대전 지원.',
      features: ['혁신적인 FC IQ 전술 엔진 및 5v5 Rush 모드', 'UEFA, 프리미어리그, 라리가 공식 라이선스', 'Ultimate Team 및 클럽 모드 온라인 지원', '영구 소장 정품 보증'],
      instructions: ['1. 볼트에서 활성화 코드 복사', '2. EA App 또는 Steam에서 제품 등록', '3. 게임 설치 후 바로 킥오프'],
      tags: ['EA Sports', 'FC 25', '축구', 'Ultimate Team']
    },
    ru: {
      title: 'EA SPORTS FC 25 (Standard Edition Steam / EA App Key)',
      subtitle: 'Футбольный симулятор нового поколения с тактикой FC IQ и режимом 5v5 Rush',
      deliveryEstimate: 'Код активации мгновенно поступает в Vault',
      description: 'Официальный ключ EA SPORTS FC 25 для Steam / EA App. Лицензии UEFA Champions League, Premier League, LaLiga и режим Ultimate Team.',
      features: ['Тактическая система FC IQ и режим 5v5 Rush', 'Официальные турниры UEFA, Premier League, LaLiga', 'Полноценный онлайн в Ultimate Team и Клубах', 'Пожизненная гарантия'],
      instructions: ['1. Получите код в Vault', '2. Активируйте в EA App или Steam', '3. Скачайте игру и начните матч'],
      tags: ['EA Sports', 'FC 25', 'Футбол', 'Ultimate Team']
    },
    fr: {
      title: 'EA SPORTS FC 25 (Édition Standard Clé Steam / EA App)',
      subtitle: 'Le summum du football virtuel avec le système tactique FC IQ et le mode 5v5 Rush',
      deliveryEstimate: 'Code d’activation livré instantanément dans votre Vault',
      description: 'Licence officielle EA SPORTS FC 25 pour Steam ou EA App. Retrouvez les licences complètes de l’UEFA Champions League, la Premier League et LaLiga.',
      features: ['Système tactique FC IQ & mode 5v5 Rush dynamique', 'Licences authentiques UEFA, Premier League, LaLiga', 'Compétition en ligne Ultimate Team & Clubs', 'Garantie à vie'],
      instructions: ['1. Récupérez le code dans votre Vault', '2. Activez sur l’application EA ou Steam', '3. Téléchargez le jeu et donnez le coup d’envoi'],
      tags: ['EA Sports', 'FC 25', 'Football', 'Ultimate Team']
    },
    de: {
      title: 'EA SPORTS FC 25 (Standard Edition Steam / EA App Key)',
      subtitle: 'Das ultimative Fußballerlebnis mit taktischem FC IQ-System und neuem 5v5 Rush-Modus',
      deliveryEstimate: 'Aktivierungscode sofort im Vault verfügbar',
      description: 'Offizielle EA SPORTS FC 25 Lizenz für Steam / EA App. Authentische Lizenzen der UEFA Champions League, Premier League, Bundesliga, LaLiga und Ultimate Team.',
      features: ['FC IQ Taktiksystem & dynamischer 5v5 Rush Modus', 'Authentische Lizenzen von UEFA, Premier League & LaLiga', 'Vollwertiger Ultimate Team & Clubs Online-Modus', 'Lebenslange Garantie'],
      instructions: ['1. Code im Cyber Vault abrufen', '2. In EA App oder Steam aktivieren', '3. Spiel herunterladen und anstoßen'],
      tags: ['EA Sports', 'FC 25', 'Fußball', 'Ultimate Team']
    },
    es: {
      title: 'EA SPORTS FC 25 (Edición Estándar Clave Steam / EA App)',
      subtitle: 'El simulador de fútbol definitivo con sistema táctico FC IQ y nuevo modo 5v5 Rush',
      deliveryEstimate: 'Código de activación entregado al instante en tu Vault',
      description: 'Licencia oficial de EA SPORTS FC 25 para Steam / EA App. Licencias 100% auténticas de la UEFA Champions League, Premier League, LaLiga y Ultimate Team.',
      features: ['Sistema táctico FC IQ y modo dinámico 5v5 Rush', 'Licencias auténticas de UEFA, Premier League y LaLiga', 'Competencia online completa en Ultimate Team', 'Garantía de por vida'],
      instructions: ['1. Obtén tu código de activación en el Vault', '2. Canjea en EA App o cliente de Steam', '3. Descarga y sal al terreno de juego'],
      tags: ['EA Sports', 'FC 25', 'Fútbol', 'Ultimate Team']
    }
  },

  // 16. Windows 11 Pro Retail
  'prod-win11-pro-retail': {
    vi: {
      title: 'Windows 11 Pro Retail Key (Bản Quyền Vĩnh Viễn 1 PC)',
      subtitle: 'Key bản quyền kỹ thuật số Retail kích hoạt online trực tiếp từ Microsoft, hỗ trợ cài lại Win',
      deliveryEstimate: 'Mã kích hoạt hiển thị trong Vault ngay',
      description: 'Key bản quyền Windows 11 Pro Retail chính hãng từ Microsoft. Kích hoạt vĩnh viễn theo mainboard máy tính, cập nhật bảo mật trọn đời mà không bị nhả key.',
      features: ['Key Retail kích hoạt trực tiếp trên server Microsoft', 'Gắn liền phần cứng (hỗ trợ cài lại Win không mất bản quyền)', 'Đầy đủ tính năng BitLocker, Sandbox, Hyper-V', 'Bảo hành vĩnh viễn 1 đổi 1'],
      instructions: ['1. Vào Settings -> System -> Activation trên máy tính', '2. Chọn Change product key và dán mã key từ Vault', '3. Nhấn Activate để sở hữu Windows 11 Pro vĩnh viễn'],
      tags: ['Microsoft', 'Windows 11 Pro', 'Retail Key', 'Vĩnh viễn']
    },
    en: {
      title: 'Windows 11 Pro Retail Key (Lifetime Genuine 1 PC)',
      subtitle: 'Official digital Retail product key with direct Microsoft online activation, reinstall supported',
      deliveryEstimate: 'Product key displayed in Vault instantly',
      description: 'Genuine Microsoft Windows 11 Pro Retail product key. Permanently binds to your PC motherboard with lifetime automatic updates and no expiration.',
      features: ['Genuine Retail key activated directly with Microsoft', 'Hardware-bound (survives system reinstalls)', 'Full BitLocker, Windows Sandbox, and Hyper-V features', 'Lifetime replacement warranty guarantee'],
      instructions: ['1. Go to Settings -> System -> Activation on your PC', '2. Click Change product key and paste the key from Vault', '3. Click Activate to unlock Windows 11 Pro forever'],
      tags: ['Microsoft', 'Windows 11 Pro', 'Retail Key', 'Lifetime']
    },
    zh: {
      title: 'Windows 11 专业版零售密钥 (Retail Key 终身正版 1台电脑)',
      subtitle: '官方正版 Retail 零售密钥，直连微软服务器一键激活，支持重装系统绑定主板',
      deliveryEstimate: '密钥即刻自动展示在保险库中',
      description: '微软正版 Windows 11 Pro 零售版数字激活码。永久绑定电脑主板，支持无限次重装系统自动联网激活，尊享微软全生命周期安全更新。',
      features: ['官方正版 Retail 密钥直连微软激活', '永久数字权利绑定主板，重装不掉激活', '支持 BitLocker 加密、沙盒 Sandbox 与 Hyper-V', '终身质保保障，假一赔十'],
      instructions: ['1. 打开电脑 设置 -> 系统 -> 激活', '2. 点击“更改产品密钥”并粘贴保险库中的密钥', '3. 点击“激活”即可永久升级至 Windows 11 Pro'],
      tags: ['微软', 'Windows 11 Pro', '零售版密钥', '终身正版']
    },
    ja: {
      title: 'Windows 11 Pro Retail キー (永久ライセンス 1 PC)',
      subtitle: 'Microsoft サーバー直接オンライン認証、再インストール対応の公式 Retail キー',
      deliveryEstimate: '購入後すぐに Vault にプロダクトキーを表示',
      description: 'Microsoft 正規の Windows 11 Pro リテールプロダクトキー。マザーボードに恒久的に紐づき、OS再インストール後も自動認証されます。',
      features: ['Microsoft 公式サーバーで直接オンライン認証', 'マザーボード紐づけ（OS再インストール対応）', 'BitLocker、Sandbox、Hyper-V 完全対応', '永久ライセンス保証付き'],
      instructions: ['1. 設定 -> システム -> ライセンス認証を開く', '2.「プロダクトキーの変更」をクリックしキーを貼り付け', '3.「有効化」をクリックして完了'],
      tags: ['Microsoft', 'Windows 11 Pro', 'リテールキー', '永久版']
    },
    ko: {
      title: 'Windows 11 Pro 리테일 정품 키 (영구 소장 1 PC)',
      subtitle: '마이크로소프트 공식 온라인 인증, 포맷 및 윈도우 재설치 지원 정품 Retail 키',
      deliveryEstimate: '볼트에서 제품 키 즉시 확인',
      description: '마이크로소프트 정품 Windows 11 Pro 리테일 디지털 제품 키. 메인보드에 영구 귀속되는 디지털 라이선스로 포맷 후 재설치 시에도 자동 인증됩니다.',
      features: ['MS 공식 정품 리테일 온라인 즉시 인증', '메인보드 영구 귀속 (재설치 및 포맷 지원)', 'BitLocker 암호화, 샌드박스, Hyper-V 전체 지원', '평생 정품 1:1 교환 보증'],
      instructions: ['1. PC 설정 -> 시스템 -> 정품 인증 메뉴 이동', '2. 제품 키 변경 클릭 후 볼트의 키 입력', '3. 정품 인증 클릭으로 영구 활성화 완료'],
      tags: ['Microsoft', 'Windows 11 Pro', '리테일 키', '영구 라이선스']
    },
    ru: {
      title: 'Windows 11 Pro Retail Key (Бессрочная лицензия на 1 ПК)',
      subtitle: 'Официальный ключ Retail с онлайн-активацией на серверах Microsoft, с поддержкой переустановки',
      deliveryEstimate: 'Ключ продукта отображается в Vault мгновенно',
      description: 'Оригинальный ключ Windows 11 Pro Retail. Привязывается к материнской плате ПК с бессрочными обновлениями и поддержкой переустановки.',
      features: ['Retail ключ с онлайн-активацией в Microsoft', 'Привязка к железу (сохраняется при переустановке)', 'Полный функционал BitLocker, Sandbox и Hyper-V', 'Пожизненная гарантия'],
      instructions: ['1. Параметры -> Система -> Активация', '2. Нажмите «Изменить ключ» и вставьте ключ из Vault', '3. Нажмите «Активировать» для бессрочной лицензии'],
      tags: ['Microsoft', 'Windows 11 Pro', 'Retail Key', 'Бессрочно']
    },
    fr: {
      title: 'Clé Windows 11 Pro Retail (Licence à Vie 1 PC)',
      subtitle: 'Clé officielle Retail avec activation en ligne Microsoft, réinstallation supportée',
      deliveryEstimate: 'Clé de produit affichée immédiatement dans le Vault',
      description: 'Clé authentique Microsoft Windows 11 Pro Retail. Liée définitivement à la carte mère de votre PC avec mises à jour de sécurité à vie.',
      features: ['Clé Retail authentique activée chez Microsoft', 'Liée au matériel (persiste après réinstallation)', 'Fonctionnalités complètes BitLocker, Sandbox, Hyper-V', 'Garantie à vie'],
      instructions: ['1. Rendez-vous dans Paramètres -> Système -> Activation', '2. Cliquez sur Modifier la clé et collez la clé du Vault', '3. Cliquez sur Activer pour débloquer Windows 11 Pro'],
      tags: ['Microsoft', 'Windows 11 Pro', 'Clé Retail', 'À vie']
    },
    de: {
      title: 'Windows 11 Pro Retail Key (Lebenslange Lizenz 1 PC)',
      subtitle: 'Offizieller Retail-Produktschlüssel mit direkter Microsoft-Onlineaktivierung & Neuinstallations-Support',
      deliveryEstimate: 'Produktschlüssel sofort im Vault abrufbar',
      description: 'Originaler Microsoft Windows 11 Pro Retail Produktschlüssel. Dauerhafte Hardware-Bindung an das Mainboard mit lebenslangen Updates.',
      features: ['Originaler Retail-Schlüssel mit direkter Online-Aktivierung', 'Hardwaregebunden (übersteht Neuinstallationen)', 'Vollversion mit BitLocker, Sandbox & Hyper-V', 'Lebenslange Umtauschgarantie'],
      instructions: ['1. Auf dem PC Einstellungen -> System -> Aktivierung öffnen', '2. Produktschlüssel ändern wählen und Key aus dem Vault einfügen', '3. Auf Aktivieren klicken'],
      tags: ['Microsoft', 'Windows 11 Pro', 'Retail Key', 'Lebenslang']
    },
    es: {
      title: 'Clave Windows 11 Pro Retail (Licencia de por Vida 1 PC)',
      subtitle: 'Clave oficial Retail con activación online directa de Microsoft, compatible con reinstalaciones',
      deliveryEstimate: 'Clave de producto mostrada al instante en tu Vault',
      description: 'Clave genuina de Microsoft Windows 11 Pro Retail. Se vincula de forma permanente a la placa base de tu PC con actualizaciones continuas.',
      features: ['Clave Retail genuina con activación directa en Microsoft', 'Vinculada al hardware (se mantiene tras formatear)', 'Acceso completo a BitLocker, Sandbox y Hyper-V', 'Garantía de por vida'],
      instructions: ['1. Ve a Configuración -> Sistema -> Activación en tu PC', '2. Selecciona Cambiar clave de producto y pega la clave', '3. Haz clic en Activar para disfrutar de Windows 11 Pro'],
      tags: ['Microsoft', 'Windows 11 Pro', 'Clave Retail', 'De por vida']
    }
  },

  // 17. Office 2024 Pro Plus
  'prod-office-2024-pro': {
    vi: {
      title: 'Microsoft Office 2024 Pro Plus Key (Bản Quyền Vĩnh Viễn)',
      subtitle: 'Bộ ứng dụng văn phòng mới nhất Word, Excel, PowerPoint 2024 kích hoạt vĩnh viễn không cần gia hạn',
      deliveryEstimate: 'Mã key hiển thị trong Vault ngay',
      description: 'Bản quyền Microsoft Office 2024 Professional Plus mới nhất. Mua một lần sử dụng vĩnh viễn trọn đời trên 1 máy tính Windows.',
      features: ['Gồm Word, Excel, PowerPoint, Outlook, Access 2024', 'Kích hoạt vĩnh viễn không đóng phí hàng năm', 'Tương thích Windows 10 và Windows 11', 'Bảo hành trọn đời'],
      instructions: ['1. Tải bộ cài đặt Office 2024 chính hãng từ Microsoft', '2. Mở ứng dụng Word và nhập mã key bản quyền', '3. Kích hoạt online thành công'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', 'Vĩnh viễn']
    },
    en: {
      title: 'Microsoft Office 2024 Pro Plus Key (Lifetime Genuine License)',
      subtitle: 'Latest productivity suite with Word, Excel, PowerPoint 2024 permanent activation, no subscriptions',
      deliveryEstimate: 'Product key displayed in Vault instantly',
      description: 'Official Microsoft Office 2024 Professional Plus product key. One-time purchase for lifetime use on 1 Windows PC with full offline support.',
      features: ['Includes Word, Excel, PowerPoint, Outlook, Access 2024', 'Permanent lifetime activation with zero annual fees', 'Fully compatible with Windows 10 and Windows 11', 'Lifetime replacement warranty guarantee'],
      instructions: ['1. Download official Office 2024 installer from Microsoft', '2. Open Word and enter your genuine product key', '3. Complete online activation instantly'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', 'Lifetime']
    },
    zh: {
      title: 'Microsoft Office 2024 专业增强版 (Pro Plus 终身正版密钥)',
      subtitle: '最新一代办公套件 Word、Excel、PowerPoint 2024 终身买断制，无需按年付费',
      deliveryEstimate: '密钥即刻自动展示在保险库中',
      description: '微软正版 Office 2024 Professional Plus 最新版激活码。一次购买终身授权使用，包含 Word、Excel、PPT、Outlook 全套生产力套件。',
      features: ['包含 Word、Excel、PowerPoint、Outlook、Access 2024', '终身永久授权买断制，无后续订阅费用', '完美兼容 Windows 10 与 Windows 11 操作系统', '终身质保保障，官方正品保证'],
      instructions: ['1. 从微软官方通道下载 Office 2024 官方安装包', '2. 安装后打开 Word 输入保险库中的正版密钥', '3. 联网一键完成正版激活'],
      tags: ['微软', 'Office 2024', 'Word', 'Excel', '终身正版']
    },
    ja: {
      title: 'Microsoft Office 2024 Pro Plus キー (永久正規ライセンス)',
      subtitle: '最新版 Word・Excel・PowerPoint 2024 を収録したサブスクリプション不要の永久版',
      deliveryEstimate: '購入後すぐに Vault にプロダクトキーを表示',
      description: 'Microsoft 正規の Office 2024 Professional Plus プロダクトキー。1回のご購入で追加料金なく1台の Windows PC で永続的にご利用いただけます。',
      features: ['Word、Excel、PowerPoint、Outlook、Access 2024 収録', '月額・年額料金不要の完全買い切り永久版', 'Windows 10 および Windows 11 に完全対応', '永久ライセンス保証付き'],
      instructions: ['1. Microsoft 公式より Office 2024 をダウンロード', '2. Word を起動しプロダクトキーを入力', '3. オンライン認証を完了して利用開始'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', '永久版']
    },
    ko: {
      title: 'Microsoft Office 2024 프로 플러스 정품 키 (영구 소장 라이선스)',
      subtitle: '최신 Word, Excel, PowerPoint 2024 포함, 정기 구독료 없는 영구 소장용 정품 키',
      deliveryEstimate: '볼트에서 제품 키 즉시 확인',
      description: '마이크로소프트 최신 Office 2024 Professional Plus 정품 라이선스. 1회 구매로 추가 비용 없이 Windows PC 1대에서 평생 영구 사용 가능합니다.',
      features: ['Word, Excel, PowerPoint, Outlook, Access 2024 전체', '구독료 없는 1회 구매 영구 정품 라이선스', 'Windows 10 및 Windows 11 완벽 지원', '평생 정품 무상 AS 보증'],
      instructions: ['1. MS 공식 사이트에서 Office 2024 설치 파일 다운로드', '2. Word 실행 후 볼트에서 확인한 정품 키 입력', '3. 온라인 즉시 인증 완료'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', '영구 라이선스']
    },
    ru: {
      title: 'Microsoft Office 2024 Pro Plus Key (Бессрочная лицензия)',
      subtitle: 'Новейший офисный пакет Word, Excel, PowerPoint 2024 без ежемесячных подписок',
      deliveryEstimate: 'Ключ продукта отображается в Vault мгновенно',
      description: 'Оригинальный ключ Microsoft Office 2024 Professional Plus. Бессрочная активация для 1 ПК на Windows без абонентской платы.',
      features: ['Word, Excel, PowerPoint, Outlook, Access 2024', 'Бессрочная лицензия без ежегодных платежей', 'Совместимость с Windows 10 и Windows 11', 'Пожизненная гарантия'],
      instructions: ['1. Скачайте официальный дистрибутив Office 2024', '2. Откройте Word и введите лицензионный ключ', '3. Активируйте онлайн за 1 минуту'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', 'Бессрочно']
    },
    fr: {
      title: 'Clé Microsoft Office 2024 Pro Plus (Licence à Vie)',
      subtitle: 'Suite bureautique avec Word, Excel, PowerPoint 2024 sans abonnement mensuel',
      deliveryEstimate: 'Clé de produit affichée immédiatement dans le Vault',
      description: 'Clé authentique Microsoft Office 2024 Professional Plus. Achat unique pour une utilisation à vie sur 1 PC Windows.',
      features: ['Comprend Word, Excel, PowerPoint, Outlook, Access 2024', 'Licence permanente sans frais annuels', 'Compatible Windows 10 et Windows 11', 'Garantie à vie'],
      instructions: ['1. Téléchargez l’installateur officiel d’Office 2024', '2. Ouvrez Word et entrez votre clé de produit', '3. Finalisez l’activation en ligne'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', 'À vie']
    },
    de: {
      title: 'Microsoft Office 2024 Pro Plus Key (Lebenslange Lizenz)',
      subtitle: 'Neueste Office-Suite mit Word, Excel, PowerPoint 2024 ohne laufende Abokosten',
      deliveryEstimate: 'Produktschlüssel sofort im Vault abrufbar',
      description: 'Offizieller Microsoft Office 2024 Professional Plus Produktschlüssel. Einmalkauf für dauerhafte Nutzung auf 1 Windows-PC.',
      features: ['Enthält Word, Excel, PowerPoint, Outlook, Access 2024', 'Dauerhafte Dauerlizenz ohne jährliche Gebühren', 'Voll kompatibel mit Windows 10 und Windows 11', 'Lebenslange Umtauschgarantie'],
      instructions: ['1. Offizielles Office 2024 Setup von Microsoft herunterladen', '2. Word öffnen und Produktschlüssel eingeben', '3. Online-Aktivierung abschließen'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', 'Lebenslang']
    },
    es: {
      title: 'Clave Microsoft Office 2024 Pro Plus (Licencia de por Vida)',
      subtitle: 'Suite ofimática con Word, Excel, PowerPoint 2024 sin suscripciones mensuales',
      deliveryEstimate: 'Clave de producto mostrada al instante en tu Vault',
      description: 'Clave genuina de Microsoft Office 2024 Professional Plus. Compra única para uso vitalicio en 1 PC con Windows.',
      features: ['Incluye Word, Excel, PowerPoint, Outlook, Access 2024', 'Activación permanente sin cuotas recurrentes', 'Compatible con Windows 10 y Windows 11', 'Garantía de por vida'],
      instructions: ['1. Descarga el instalador oficial de Office 2024', '2. Abre Word e introduce tu clave de producto', '3. Completa la activación online al instante'],
      tags: ['Microsoft', 'Office 2024', 'Word', 'Excel', 'De por vida']
    }
  },

  // 18. IDM Lifetime
  'prod-idm-lifetime': {
    vi: {
      title: 'Internet Download Manager (IDM) 1 PC (Bản Quyền Vĩnh Viễn)',
      subtitle: 'Tăng tốc độ tải file lên gấp 5 lần, bắt link video tự động, cập nhật phần mềm trọn đời',
      deliveryEstimate: 'Mã key tự động cấp vào Vault ngay',
      description: 'Bản quyền phần mềm Internet Download Manager (IDM) chính hãng từ Tonec Inc. Kích hoạt vĩnh viễn trên 1 máy tính, thoải mái cập nhật phiên bản mới nhất.',
      features: ['Tăng tốc tải dữ liệu gấp 500%', 'Bắt link YouTube, video, MP3 tự động 1-click', 'Hỗ trợ cập nhật lên phiên bản mới trọn đời', 'Bảo hành vĩnh viễn 1 đổi 1'],
      instructions: ['1. Tải IDM từ trang chủ internetdownloadmanager.com', '2. Vào Registration -> Registration và nhập thông tin + key', '3. Thưởng thức tốc độ tải file tối đa'],
      tags: ['IDM', 'Download', 'Tăng tốc tải', 'Vĩnh viễn']
    },
    en: {
      title: 'Internet Download Manager (IDM) 1 PC (Lifetime Genuine License)',
      subtitle: 'Boost download speeds up to 5x, automated video stream grabber, lifetime updates',
      deliveryEstimate: 'Genuine license key dispatched instantly to Vault',
      description: 'Official Internet Download Manager (IDM) license from Tonec Inc. Permanent activation for 1 PC with unlimited lifetime version updates.',
      features: ['Accelerates download speeds by up to 500%', 'Automated 1-click video grabber for streaming sites', 'Lifetime free software version updates', 'Lifetime replacement warranty guarantee'],
      instructions: ['1. Download IDM from internetdownloadmanager.com', '2. Open Registration -> Registration and enter your key', '3. Enjoy maximum download speeds'],
      tags: ['IDM', 'Download', 'Speed Booster', 'Lifetime']
    },
    zh: {
      title: 'Internet Download Manager (IDM) 1台电脑 (终身正版授权)',
      subtitle: '多线程极速下载提速高达500%，智能嗅探抓取全网视频与音频，支持终身免费升级',
      deliveryEstimate: '正版序列号即刻展示在保险库中',
      description: '来自 Tonec Inc. 官方正版 IDM 下载神器终身授权。支持一键嗅探抓取网页视频、断点续传与多线程高速下载，终身免费在线升级。',
      features: ['多线程极速下载加速高达 500%', '智能一键嗅探抓取网页视频与 MP3', '支持终身无缝升级至官方最新版本', '终身质保保障，一机一码正版绑定'],
      instructions: ['1. 从 IDM 官网 internetdownloadmanager.com 下载客户端', '2. 打开菜单“注册” -> “注册”，填入姓名及保险库中的序列号', '3. 体验极致高速下载'],
      tags: ['IDM', '下载神器', '多线程加速', '终身正版']
    },
    ja: {
      title: 'Internet Download Manager (IDM) 1 PC (永久正規ライセンス)',
      subtitle: 'ダウンロード速度を最大5倍に高速化、動画・音声の自動キャプチャ、永久アップデート対応',
      deliveryEstimate: '購入後すぐに Vault にライセンスキーを表示',
      description: 'Tonec Inc. 公式の Internet Download Manager (IDM) 永久ライセンス。1台の PC で永続的に使用でき、最新バージョンへの無料アップデートに対応。',
      features: ['ダウンロード速度を最大 500% 高速化', '動画配信サイトのストリームを 1 クリック自動取得', '永久無料バージョンアップグレード', '永久ライセンス保証付き'],
      instructions: ['1. 公式サイト internetdownloadmanager.com よりダウンロード', '2. メニューの「登録」からライセンスキーを入力', '3. 最高速のダウンロードを開始'],
      tags: ['IDM', '高速ダウンロード', '永久版']
    },
    ko: {
      title: 'Internet Download Manager (IDM) 1 PC (평생 정품 라이선스)',
      subtitle: '다운로드 속도 최대 5배 가속, 스트리밍 동영상 원클릭 자동 추출, 평생 무상 업데이트',
      deliveryEstimate: '볼트에서 시리얼 키 즉시 확인',
      description: 'Tonec Inc. 공식 정품 IDM 다운로드 가속기 평생 라이선스. 1대 PC에 영구 등록되며 최신 버전으로 평생 무료 업데이트가 지원됩니다.',
      features: ['다운로드 속도 최대 500% 다중 스레드 가속', '웹 동영상 및 MP3 원클릭 자동 추출', '최신 버전 평생 무료 업데이트 지원', '평생 정품 1:1 교환 보증'],
      instructions: ['1. IDM 공식 홈페이지에서 프로그램 다운로드', '2. 등록 -> 등록 메뉴에서 볼트의 시리얼 키 입력', '3. 초고속 파일 다운로드 경험'],
      tags: ['IDM', '다운로드 가속', '평생 라이선스']
    },
    ru: {
      title: 'Internet Download Manager (IDM) 1 ПК (Бессрочная лицензия)',
      subtitle: 'Увеличение скорости скачивания до 5 раз, автоматический захват видео, пожизненные обновления',
      deliveryEstimate: 'Лицензионный ключ мгновенно выдается в Vault',
      description: 'Официальная лицензия Internet Download Manager (IDM) от Tonec Inc. Бессрочная активация на 1 ПК с поддержкой всех будущих обновлений.',
      features: ['Ускорение загрузки до 500%', 'Автоматический захват видео со страниц', 'Пожизненные бесплатные обновления версии', 'Пожизненная гарантия'],
      instructions: ['1. Скачайте IDM с internetdownloadmanager.com', '2. Откройте Меню -> Регистрация и введите ключ', '3. Качайте на максимальной скорости'],
      tags: ['IDM', 'Загрузка', 'Ускоритель', 'Бессрочно']
    },
    fr: {
      title: 'Internet Download Manager (IDM) 1 PC (Licence à Vie)',
      subtitle: 'Accélération des téléchargements jusqu’à 5x, capture automatique de vidéos, mises à jour à vie',
      deliveryEstimate: 'Clé de licence délivrée instantanément dans le Vault',
      description: 'Licence officielle Internet Download Manager (IDM) de Tonec Inc. Activation permanente sur 1 PC avec mises à jour illimitées.',
      features: ['Accélère les téléchargements jusqu’à 500%', 'Capture automatique de vidéos en 1 clic', 'Mises à jour gratuites à vie du logiciel', 'Garantie à vie'],
      instructions: ['1. Téléchargez IDM sur internetdownloadmanager.com', '2. Allez dans Enregistrement -> Enregistrement et entrez la clé', '3. Profitez de vitesses maximales'],
      tags: ['IDM', 'Téléchargement', 'Accélérateur', 'À vie']
    },
    de: {
      title: 'Internet Download Manager (IDM) 1 PC (Lebenslange Lizenz)',
      subtitle: 'Bis zu 5x schnellere Download-Geschwindigkeit, automatischer Video-Grabber, lebenslange Updates',
      deliveryEstimate: 'Lizenzschlüssel sofort im Cyber Vault abrufbar',
      description: 'Offizielle Internet Download Manager (IDM) Lizenz von Tonec Inc. Dauerhafte Aktivierung für 1 PC mit unbegrenzten Versions-Updates auf Lebenszeit.',
      features: ['Bis zu 500% schnellere Downloads', 'Automatischer 1-Klick Video-Grabber für Webseiten', 'Lebenslang kostenlose Versions-Updates', 'Lebenslange Umtauschgarantie'],
      instructions: ['1. IDM von internetdownloadmanager.com herunterladen', '2. Registrierung -> Registrieren wählen und Schlüssel eingeben', '3. Maximale Download-Raten genießen'],
      tags: ['IDM', 'Download-Manager', 'Lebenslang']
    },
    es: {
      title: 'Internet Download Manager (IDM) 1 PC (Licencia de por Vida)',
      subtitle: 'Multiplica la velocidad de descarga hasta por 5, captura automática de vídeos, actualizaciones de por vida',
      deliveryEstimate: 'Clave de licencia entregada al instante en tu Vault',
      description: 'Licencia oficial de Internet Download Manager (IDM) de Tonec Inc. Activación permanente para 1 PC con actualizaciones gratuitas ilimitadas.',
      features: ['Aumenta la velocidad de descarga hasta un 500%', 'Captura vídeos de la web automáticamente con 1 clic', 'Actualizaciones gratuitas de versión de por vida', 'Garantía de por vida'],
      instructions: ['1. Descarga IDM en internetdownloadmanager.com', '2. Abre Registro -> Registro e introduce tu clave', '3. Disfruta de la máxima velocidad de descarga'],
      tags: ['IDM', 'Descargas', 'Acelerador', 'De por vida']
    }
  },

  // 19. Arena of Valor / Lien Quan Topup
  'prod-topup-lienquan-1050': {
    vi: {
      title: 'Nạp 1.050 Quân Huy Liên Quân Mobile (Nạp Thẳng UID Tự Động 3s)',
      subtitle: 'Nạp Quân Huy chính hãng qua OpenID, nhận ngay quà nạp đầu, cộng dồn sự kiện & sổ sứ mệnh',
      deliveryEstimate: 'Hệ thống tự động nạp thành công trong 3 giây',
      description: 'Dịch vụ nạp Quân Huy Liên Quân Mobile trực tiếp vào tài khoản qua OpenID chính thống. Đảm bảo an toàn 100%, không cần đăng nhập mật khẩu.',
      features: ['Cộng trực tiếp 1.050 Quân Huy vào tài khoản', 'Không cần mật khẩu, chỉ cần nhập OpenID', 'Tính đầy đủ các mốc sự kiện & quà nạp đầu', 'Bảo hiểm sạch 100% qua Escrow'],
      instructions: ['1. Nhập OpenID tài khoản Liên Quân của bạn', '2. Xác nhận thanh toán qua ví Cyber Balance', '3. Mở game kiểm tra Quân Huy sau 3 giây'],
      tags: ['Liên Quân Mobile', 'Quân Huy', 'Nạp Game', 'Auto UID']
    },
    en: {
      title: 'Topup 1,050 Vouchers Arena of Valor (3s Auto UID Top-up)',
      subtitle: 'Official Voucher top-up via OpenID, counts towards first-recharge bonus & all active events',
      deliveryEstimate: 'Automated direct top-up completed within 3 seconds',
      description: 'Official Arena of Valor Voucher top-up directly via player OpenID. 100% secure, zero risk, no login password required.',
      features: ['Direct 1,050 Vouchers credited to in-game balance', 'No password required, OpenID only', 'Qualifies for first-recharge bonus & event milestones', '100% clean currency escrow guarantee'],
      instructions: ['1. Enter your Arena of Valor OpenID', '2. Confirm payment using your Cyber Wallet', '3. Open the game to verify your Vouchers in 3 seconds'],
      tags: ['Arena of Valor', 'Vouchers', 'Game Topup', 'Auto UID']
    },
    zh: {
      title: '传说对决 / 王者荣耀国际版 1050点券 (3秒自动 UID 直充)',
      subtitle: '官方正规渠道 OpenID 直充，秒到账，计入首充双倍返利与当期全部游戏运营活动',
      deliveryEstimate: '系统3秒内全自动秒级直充到账',
      description: '官方正版《传说对决 / Arena of Valor》点券直充服务。只需提供游戏 OpenID，无需提供账号密码，100% 安全不封号。',
      features: ['直接充值 1,050 点券至游戏账户', '无需账号密码，仅需提供 OpenID', '完美参与首充奖励、魔法水晶与限定抽奖活动', '全额保单质保，官方正规白卡充值'],
      instructions: ['1. 输入您的游戏 OpenID', '2. 使用账户余额确认支付', '3. 3秒后打开游戏查收点券'],
      tags: ['传说对决', '点券直充', '游戏充值', '自动UID']
    },
    ja: {
      title: 'Arena of Valor 1,050 バウチャー (3秒 UID 自動即時チャージ)',
      subtitle: '公式 OpenID 直接チャージ、初回リチャージボーナスおよび開催中イベントに完全反映',
      deliveryEstimate: '3秒以内にゲーム内アカウントへ即時チャージ完了',
      description: 'Arena of Valor 公式バウチャーチャージ。OpenID のみでパスワード不要。100% 安全・確実にお手元のアカウントへ反映されます。',
      features: ['1,050 バウチャーをゲーム内残高へ即座に加算', 'パスワード不要、OpenID のみで安全取引', '初回チャージ特典・イベント進行度に完全反映', '100% クリーン通貨保証'],
      instructions: ['1. ご自身の OpenID を入力', '2. ウォレット残高から決済を確認', '3. 3秒後にゲームを起動して残高を確認'],
      tags: ['Arena of Valor', 'バウチャー', 'ゲーム課金']
    },
    ko: {
      title: '아레나 오브 발러 1,050 바우처 (3초 자동 UID 즉시 충전)',
      subtitle: '공식 OpenID 직충전, 첫 충전 보너스 및 모든 진행 중인 게임 내 이벤트 100% 반영',
      deliveryEstimate: '3초 이내 인게임 계정으로 자동 충전 완료',
      description: 'Arena of Valor 공식 정품 바우처 직충전 서비스. 비밀번호 없이 OpenID만으로 100% 안전하게 충전됩니다.',
      features: ['게임 계정에 1,050 바우처 즉시 충전', '비밀번호 불필요, OpenID만으로 안전 처리', '첫 충전 보너스 및 시즌 이벤트 마일리지 적립', '정품 재화 에스크로 100% 보증'],
      instructions: ['1. 게임 내 OpenID 입력', '2. 사이버 지갑으로 결제 확인', '3. 3초 후 게임 접속하여 바우처 수령 확인'],
      tags: ['아레나오브발러', '바우처', '게임충전', '자동UID']
    },
    ru: {
      title: 'Пополнение 1 050 Ваучеров Arena of Valor (Авто UID 3 сек)',
      subtitle: 'Официальное пополнение по OpenID, засчитывается в бонусы первого пополнения и события',
      deliveryEstimate: 'Автоматическое зачисление за 3 секунды',
      description: 'Официальное пополнение ваучеров Arena of Valor по OpenID игрока. 100% безопасно, без передачи пароля.',
      features: ['1 050 ваучеров поступают на баланс', 'Без пароля, только OpenID', 'Засчитывается в бонусы и события', '100% гарантия чистой валюты'],
      instructions: ['1. Введите ваш OpenID в игре', '2. Подтвердите оплату с кошелька', '3. Откройте игру и проверьте баланс'],
      tags: ['Arena of Valor', 'Ваучеры', 'Донат', 'Авто UID']
    },
    fr: {
      title: 'Recharge 1 050 Vouchers Arena of Valor (Auto UID 3s)',
      subtitle: 'Recharge officielle via OpenID, éligible aux bonus de premier achat et à tous les événements',
      deliveryEstimate: 'Crédité automatiquement en moins de 3 secondes',
      description: 'Recharge officielle de Vouchers Arena of Valor directement via votre OpenID joueur. 100% sécurisé, aucun mot de passe requis.',
      features: ['1 050 Vouchers crédités instantanément', 'Aucun mot de passe requis, OpenID uniquement', 'Compte pour les bonus et récompenses d’événements', 'Garantie de devise légale à 100%'],
      instructions: ['1. Indiquez votre OpenID Arena of Valor', '2. Confirmez le règlement', '3. Lancez le jeu pour vérifier vos Vouchers'],
      tags: ['Arena of Valor', 'Vouchers', 'Recharge Jeu', 'Auto UID']
    },
    de: {
      title: 'Topup 1.050 Gutscheine Arena of Valor (3 Sek. Auto-UID Aufladung)',
      subtitle: 'Offizielle Aufladung per OpenID, zählt für Erstauflade-Boni und alle aktiven Events',
      deliveryEstimate: 'Automatische Gutschrift innerhalb von 3 Sekunden',
      description: 'Offizielle Arena of Valor Gutschein-Aufladung direkt über die Spieler-OpenID. 100% sicher, kein Login-Passwort erforderlich.',
      features: ['1.050 Gutscheine werden direkt im Spiel gutgeschrieben', 'Kein Passwort nötig, nur OpenID', 'Qualifiziert für Erstauflade-Bonus & Event-Meilensteine', '100% Treuhand-Sicherheit'],
      instructions: ['1. Arena of Valor OpenID eingeben', '2. Bezahlung über Wallet bestätigen', '3. Spiel nach 3 Sekunden öffnen und Guthaben prüfen'],
      tags: ['Arena of Valor', 'Gutscheine', 'Game Topup', 'Auto UID']
    },
    es: {
      title: 'Recarga 1.050 Vales Arena of Valor (Auto UID en 3s)',
      subtitle: 'Recarga oficial mediante OpenID, válida para el bono de primera compra y todos los eventos',
      deliveryEstimate: 'Recarga directa automática completada en 3 segundos',
      description: 'Servicio oficial de recarga de vales para Arena of Valor mediante OpenID de jugador. 100% seguro, sin contraseñas.',
      features: ['Acreditación directa de 1.050 vales en el juego', 'Sin contraseñas, solo necesitas tu OpenID', 'Válido para eventos de recarga y pases', 'Garantía 100% legal con Escrow'],
      instructions: ['1. Introduce tu OpenID de Arena of Valor', '2. Confirma el pago desde tu saldo', '3. Abre el juego y verifica tus vales en 3 segundos'],
      tags: ['Arena of Valor', 'Vales', 'Recarga de Juegos', 'Auto UID']
    }
  },

  // 20. Free Fire Topup
  'prod-topup-freefire-2180': {
    vi: {
      title: 'Nạp 2.180 Kim Cương Free Fire (Nạp ID In-game Tự Động 3s)',
      subtitle: 'Nạp Kim Cương chính hãng Garena qua ID nhân vật, nhận ngay trang phục sự kiện mới nhất',
      deliveryEstimate: 'Hệ thống tự động nạp thành công trong 3 giây',
      description: 'Nạp Kim Cương Free Fire trực tiếp qua Player ID. Đầy đủ ưu đãi nạp đầu x2, quay vòng quay may mắn và sự kiện thẻ vô cực.',
      features: ['Cộng trực tiếp 2.180 Kim Cương vào tài khoản', 'Chỉ cần Player ID, an toàn tuyệt đối', 'Hưởng đầy đủ quà nạp và sự kiện Garena', 'Bảo hiểm sạch 100% qua Escrow'],
      instructions: ['1. Nhập Player ID Free Fire', '2. Xác nhận thanh toán', '3. Nhận Kim Cương trong game sau 3 giây'],
      tags: ['Free Fire', 'Kim Cương', 'Garena', 'Auto ID']
    },
    en: {
      title: 'Topup 2,180 Diamonds Free Fire (3s In-game ID Instant Top-up)',
      subtitle: 'Official Garena Diamonds top-up via Player ID, instantly unlock newest event items',
      deliveryEstimate: 'Automated direct top-up completed within 3 seconds',
      description: 'Official Free Fire Diamonds direct top-up via Player ID. Fully qualifies for first-topup bonuses, Elite Pass, and lucky wheel draws.',
      features: ['Direct 2,180 Diamonds credited to in-game balance', 'Only Player ID required, 100% account security', 'Full eligibility for active Garena events and bonuses', '100% clean currency escrow guarantee'],
      instructions: ['1. Enter your Free Fire Player ID', '2. Confirm payment using your Cyber Wallet', '3. Open the game to verify your Diamonds in 3 seconds'],
      tags: ['Free Fire', 'Diamonds', 'Garena', 'Auto ID']
    },
    zh: {
      title: 'Free Fire 我要活下去 2180钻石 (3秒自动 Player ID 直充)',
      subtitle: '官方 Garena 钻石直充通道，秒到账，计入首充双倍与当期活动转盘抽奖',
      deliveryEstimate: '系统3秒内全自动秒级直充到账',
      description: 'Garena 官方正版 Free Fire 钻石直充服务。只需输入玩家 ID (Player ID)，无账号被盗风险，秒速到账。',
      features: ['2,180 钻石即刻入账游戏账户', '只需输入 Player ID，保障账号隐私安全', '完美触发首充双倍返利与精英通行证', '全额保单质保，官方正规渠道直充'],
      instructions: ['1. 输入您的 Free Fire 玩家 ID', '2. 使用账户余额确认支付', '3. 3秒后在游戏中确认钻石'],
      tags: ['Free Fire', '钻石直充', 'Garena', '自动ID']
    },
    ja: {
      title: 'Free Fire 2,180 ダイヤ (3秒 プレイヤーID 自動即時チャージ)',
      subtitle: 'Garena 公式ダイヤチャージ、初回リチャージ特典や最新イベントガチャに即座に対応',
      deliveryEstimate: '3秒以内にゲーム内アカウントへ即時チャージ完了',
      description: 'Free Fire 公式ダイヤ直チャージ。プレイヤーID のみでパスワード不要。安全かつスピーディーに残高が反映されます。',
      features: ['2,180 ダイヤをゲーム内へ即時加算', 'プレイヤーID のみで安全・迅速', '最新イベント・エリートパスに完全適用', '100% 正規通貨保証'],
      instructions: ['1. Free Fire プレイヤーID を入力', '2. 決済を確認', '3. 3秒後にゲーム内でダイヤ受領を確認'],
      tags: ['Free Fire', 'ダイヤ', 'Garena', '自動ID']
    },
    ko: {
      title: '프리 파이어 2,180 다이아몬드 (3초 플레이어 ID 자동 즉시 충전)',
      subtitle: 'Garena 공식 다이아몬드 직충전, 첫 충전 혜택 및 최신 이벤트 완벽 반영',
      deliveryEstimate: '3초 이내 인게임 계정으로 자동 충전 완료',
      description: 'Free Fire 공식 정품 다이아몬드 직충전 서비스. 비밀번호 없이 플레이어 ID만으로 안전하게 즉시 충전됩니다.',
      features: ['게임 계정에 2,180 다이아몬드 즉시 충전', '플레이어 ID만으로 안전하게 거래', '엘리트 패스 및 첫 충전 보너스 혜택 적용', '100% 정품 재화 에스크로 보증'],
      instructions: ['1. 프리 파이어 플레이어 ID 입력', '2. 결제 승인', '3. 3초 후 인게임 다이아몬드 충전 확인'],
      tags: ['Free Fire', '다이아몬드', 'Garena', '자동ID']
    },
    ru: {
      title: 'Пополнение 2 180 Алмазов Free Fire (Авто ID 3 сек)',
      subtitle: 'Официальное пополнение через Player ID, мгновенная доставка алмазов',
      deliveryEstimate: 'Автоматическое зачисление за 3 секунды',
      description: 'Официальное пополнение Free Fire по Player ID. Засчитывается в бонусы первого пополнения и пропуск Elite Pass.',
      features: ['2 180 алмазов на игровой аккаунт', 'Только Player ID, без пароля', 'Поддержка всех событий Garena', '100% гарантия'],
      instructions: ['1. Введите ваш Free Fire Player ID', '2. Подтвердите оплату', '3. Получите алмазы в игре за 3 секунды'],
      tags: ['Free Fire', 'Алмазы', 'Garena', 'Авто ID']
    },
    fr: {
      title: 'Recharge 2 180 Diamants Free Fire (Auto ID 3s)',
      subtitle: 'Recharge officielle Garena via Player ID, compatible pass élite et événements',
      deliveryEstimate: 'Crédité automatiquement en 3 secondes',
      description: 'Recharge directe de Diamants Free Fire via votre Player ID. 100% sécurisé et instantané.',
      features: ['2 180 Diamants crédités sur le compte', 'Player ID uniquement, sans mot de passe', 'Compatible avec le Pass Élite et les bonus', 'Garantie légale 100%'],
      instructions: ['1. Entrez votre Player ID Free Fire', '2. Validez le paiement', '3. Lancez le jeu pour profiter de vos Diamants'],
      tags: ['Free Fire', 'Diamants', 'Garena', 'Auto ID']
    },
    de: {
      title: 'Topup 2.180 Diamanten Free Fire (3 Sek. Auto-ID Aufladung)',
      subtitle: 'Offizielle Garena Diamanten-Aufladung per Player-ID, sofortige Gutschrift',
      deliveryEstimate: 'Automatische Gutschrift innerhalb von 3 Sekunden',
      description: 'Offizielle Free Fire Diamanten-Direktaufladung per Spieler-ID. Qualifiziert für Erstauflade-Bonus und Elite Pass.',
      features: ['2.180 Diamanten direkt im Spiel', 'Nur Spieler-ID erforderlich', 'Kompatibel mit allen Garena-Aktionen', '100% Treuhand-Sicherheit'],
      instructions: ['1. Free Fire Player-ID eingeben', '2. Zahlung bestätigen', '3. Spiel nach 3 Sekunden starten und Diamanten nutzen'],
      tags: ['Free Fire', 'Diamanten', 'Garena', 'Auto ID']
    },
    es: {
      title: 'Recarga 2.180 Diamantes Free Fire (Auto ID en 3s)',
      subtitle: 'Recarga oficial de diamantes Garena mediante Player ID, entrega instantánea',
      deliveryEstimate: 'Recarga directa automática completada en 3 segundos',
      description: 'Recarga oficial de diamantes de Free Fire mediante Player ID. Válido para bonus de primera recarga y pase élite.',
      features: ['2.180 diamantes acreditados al instante', 'Solo necesitas tu Player ID, sin contraseñas', 'Válido para eventos de Garena y pases élite', 'Garantía 100% legal con Escrow'],
      instructions: ['1. Introduce tu Player ID de Free Fire', '2. Confirma el pago', '3. Abre el juego y verifica tus diamantes en 3 segundos'],
      tags: ['Free Fire', 'Diamantes', 'Garena', 'Auto ID']
    }
  },

  // 21. Genshin Impact Topup
  'prod-topup-genshin-3280': {
    vi: {
      title: 'Nạp 3.280 Đá Sáng Thế Genshin Impact (Nạp Auto UID Global 3s)',
      subtitle: 'Nạp Genesis Crystals chính hãng qua UID và chọn Server (Asia / America / Europe / TW-HK-MO)',
      deliveryEstimate: 'Hệ thống tự động nạp thành công trong 3 giây',
      description: 'Dịch vụ nạp Đá Sáng Thế Genshin Impact chính hãng Hoyoverse qua UID. Tự động hưởng x2 lần đầu cho mỗi mốc nạp, an toàn 100%.',
      features: ['Cộng trực tiếp 3.280 Đá Sáng Thế vào game', 'Hưởng nhân đôi (x2 = 6.560 Đá) nếu chưa nạp mốc này', 'Chỉ cần UID và Server, không cần mật khẩu', 'Bảo hiểm sạch 100% qua Escrow'],
      instructions: ['1. Nhập UID và chọn Server game của bạn', '2. Xác nhận thanh toán qua ví Cyber', '3. Nhận Đá Sáng Thế trong game sau 3 giây'],
      tags: ['Genshin Impact', 'Hoyoverse', 'Genesis Crystals', 'Auto UID']
    },
    en: {
      title: 'Topup 3,280 Genesis Crystals Genshin Impact (Global Auto UID Top-up)',
      subtitle: 'Official Genesis Crystals top-up via UID and Server selection (Asia / America / Europe / TW-HK-MO)',
      deliveryEstimate: 'Automated direct top-up completed within 3 seconds',
      description: 'Official Hoyoverse Genshin Impact Genesis Crystals direct top-up via player UID. Automatically applies the 2x First-Time Top-up bonus if eligible.',
      features: ['Direct 3,280 Genesis Crystals credited to your account', 'Qualifies for 2x First-Time Bonus (6,560 Crystals)', 'Only UID & Server required, no password needed', '100% clean currency escrow guarantee'],
      instructions: ['1. Enter your Genshin Impact UID and select Server', '2. Confirm payment using your Cyber Wallet', '3. Open the game to verify your Crystals in 3 seconds'],
      tags: ['Genshin Impact', 'Hoyoverse', 'Genesis Crystals', 'Auto UID']
    },
    zh: {
      title: '原神 3280创世结晶 (全球服务器 3秒自动 UID 直充)',
      subtitle: '米哈游官方渠道直充，支持亚服/美服/欧服/港澳台服，享受首充双倍 6560 结晶',
      deliveryEstimate: '系统3秒内全自动秒级直充到账',
      description: 'Hoyoverse 米哈游官方正版《原神》(Genshin Impact) 创世结晶直充服务。只需输入游戏 UID 与所属服务器，享有官方首充双倍返利。',
      features: ['3,280 创世结晶即刻入账游戏账户', '若未曾充值过该档位，自动触发首充双倍 (6,560 结晶)', '仅需提供 UID 与服务器，100% 账号安全', '全额保单质保，官方正规白卡充值'],
      instructions: ['1. 输入您的原神 UID 并选择游戏服务器', '2. 使用账户余额确认支付', '3. 3秒后在游戏中查收创世结晶'],
      tags: ['原神', '米哈游', '创世结晶', '自动UID']
    },
    ja: {
      title: '原神 3,280 創世結晶 (グローバルサーバー 3秒 UID 自動即時チャージ)',
      subtitle: 'HoYoverse 公式創世結晶チャージ、Asia / America / Europe / TW-HK-MO 対応、初回2倍適用',
      deliveryEstimate: '3秒以内にゲーム内アカウントへ即時チャージ完了',
      description: '原神 (Genshin Impact) 公式創世結晶直チャージ。UID とサーバー選択のみで安全にチャージされ、初回2倍ボーナス（6,560結晶）も自動適用されます。',
      features: ['3,280 創世結晶をゲーム内へ即時加算', '未購入時は初回2倍ボーナス (6,560 結晶) 適用', 'UID とサーバーのみで安心・安全', '100% 正規通貨保証'],
      instructions: ['1. 原神 UID を入力しサーバーを選択', '2. 決済を確認', '3. 3秒後にゲーム内で創世結晶を確認'],
      tags: ['原神', 'HoYoverse', '創世結晶', '自動UID']
    },
    ko: {
      title: '원신 3,280 창세의 결정 (글로벌 서버 3초 자동 UID 즉시 충전)',
      subtitle: '호요버스 공식 창세의 결정 충전, 아시아/아메리카/유럽/TW-HK-MO 서버 지원, 첫 충전 2배 적용',
      deliveryEstimate: '3초 이내 인게임 계정으로 자동 충전 완료',
      description: '원신 (Genshin Impact) 공식 정품 창세의 결정 직충전 서비스. UID와 서버 선택만으로 비밀번호 없이 안전하게 충전되며 첫 충전 2배 혜택(6,560개)이 자동 적용됩니다.',
      features: ['게임 계정에 3,280 창세의 결정 즉시 충전', '미충전 시 첫 충전 2배 (6,560개) 자동 적용', 'UID와 서버만으로 안전하게 처리', '100% 정품 재화 에스크로 보증'],
      instructions: ['1. 원신 UID 입력 및 서버 선택', '2. 사이버 지갑으로 결제 확인', '3. 3초 후 인게임 창세의 결정 확인'],
      tags: ['원신', '호요버스', '창세의결정', '자동UID']
    },
    ru: {
      title: 'Пополнение 3 280 Камней Истока Genshin Impact (Авто UID 3 сек)',
      subtitle: 'Официальное пополнение Кристаллов Сотворения по UID и серверу (Asia / America / Europe)',
      deliveryEstimate: 'Автоматическое зачисление за 3 секунды',
      description: 'Официальное пополнение Genshin Impact по UID. Автоматически удваивается при первом пополнении (6 560 Кристаллов).',
      features: ['3 280 Кристаллов Сотворения на аккаунт', 'Бонус 2x при первом пополнении (6 560 Кристаллов)', 'Только UID и сервер, без пароля', '100% гарантия'],
      instructions: ['1. Введите UID и выберите сервер', '2. Подтвердите оплату', '3. Получите кристаллы в игре за 3 секунды'],
      tags: ['Genshin Impact', 'Кристаллы Сотворения', 'Hoyoverse', 'Авто UID']
    },
    fr: {
      title: 'Recharge 3 280 Cristaux Primaires Genshin Impact (Auto UID 3s)',
      subtitle: 'Recharge officielle de Cristaux Primaires via UID et Serveur (Asia / America / Europe)',
      deliveryEstimate: 'Crédité automatiquement en 3 secondes',
      description: 'Recharge directe Hoyoverse Genshin Impact via UID joueur. Bonus x2 appliqué automatiquement lors du premier achat (6 560 Cristaux).',
      features: ['3 280 Cristaux Primaires crédités instantanément', 'Bonus 2x au premier achat (6 560 Cristaux)', 'UID et serveur uniquement, sans mot de passe', 'Garantie légale 100%'],
      instructions: ['1. Entrez votre UID Genshin et choisissez le serveur', '2. Validez le paiement', '3. Lancez le jeu pour profiter de vos Cristaux'],
      tags: ['Genshin Impact', 'Cristaux Primaires', 'Hoyoverse', 'Auto UID']
    },
    de: {
      title: 'Topup 3.280 Schöpfungskristalle Genshin Impact (3 Sek. Auto-UID Aufladung)',
      subtitle: 'Offizielle Schöpfungskristalle per UID & Server-Auswahl (Asia / America / Europe / TW-HK-MO)',
      deliveryEstimate: 'Automatische Gutschrift innerhalb von 3 Sekunden',
      description: 'Offizielle Hoyoverse Genshin Impact Schöpfungskristall-Aufladung per Spieler-UID. 2x Erstauflade-Bonus wird automatisch angewendet (6.560 Kristalle).',
      features: ['3.280 Schöpfungskristalle direkt auf Ihr Konto', 'Qualifiziert für 2x Erstauflade-Bonus (6.560 Kristalle)', 'Nur UID & Server nötig, kein Passwort', '100% Treuhand-Sicherheit'],
      instructions: ['1. Genshin Impact UID eingeben und Server wählen', '2. Bezahlung über Wallet bestätigen', '3. Spiel nach 3 Sekunden öffnen und Kristalle nutzen'],
      tags: ['Genshin Impact', 'Schöpfungskristalle', 'Hoyoverse', 'Auto UID']
    },
    es: {
      title: 'Recarga 3.280 Cristales Génesis Genshin Impact (Auto UID en 3s)',
      subtitle: 'Recarga oficial de Cristales Génesis mediante UID y Servidor (Asia / America / Europe)',
      deliveryEstimate: 'Recarga directa automática completada en 3 segundos',
      description: 'Servicio oficial de recarga de Genshin Impact de Hoyoverse mediante UID de jugador. Aplica automáticamente el bono x2 de primera compra (6.560 Cristales).',
      features: ['3.280 Cristales Génesis acreditados al instante', 'Bono x2 en la primera recarga (6.560 Cristales)', 'Solo necesitas tu UID y Servidor, sin contraseñas', 'Garantía 100% legal con Escrow'],
      instructions: ['1. Introduce tu UID de Genshin Impact y elige el servidor', '2. Confirma el pago desde tu saldo', '3. Abre el juego y verifica tus cristales en 3 segundos'],
      tags: ['Genshin Impact', 'Cristales Génesis', 'Hoyoverse', 'Auto UID']
    }
  }
};

// Write out to src/i18n/catalogData/allProductsData.ts
const fileContent = `import { LocalizedProductData } from '../catalogTranslations';

export const ALL_PRODUCTS_DATA: Record<string, Record<string, LocalizedProductData>> = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/i18n/catalogData/allProductsData.ts'), fileContent, 'utf-8');
console.log('Saved src/i18n/catalogData/allProductsData.ts successfully!');
