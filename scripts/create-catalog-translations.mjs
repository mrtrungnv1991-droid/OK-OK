import fs from 'fs';
import path from 'path';

// Let's create dictionaries for all 21 products in 9 languages:
// vi, en, zh, ja, ko, ru, fr, de, es

const catalog = {
  'prod-chatgpt-plus': {
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
  }
};

// Write catalog out
fs.writeFileSync(path.join(process.cwd(), 'scripts/catalog-base.json'), JSON.stringify(catalog, null, 2));
console.log('Successfully written catalog-base.json');
