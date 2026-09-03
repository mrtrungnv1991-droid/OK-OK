import fs from 'fs';
import path from 'path';

interface ProductTranslation {
  title: string;
  subtitle: string;
  description: string;
  deliveryEstimate: string;
  features: string[];
  instructions: string[];
  tags: string[];
  seller?: {
    responseTime?: string;
  };
  pools?: Record<string, string>;
}

// Translations for all 21 products in 9 languages
const PRODUCT_DATA: Record<string, Record<string, ProductTranslation>> = {
  'prod-chatgpt-plus': {
    'vi': {
      title: 'ChatGPT Plus & Codex Team Seat (30 Ngày)',
      subtitle: 'Slot riêng tư trong OpenAI Team Workspace, GPT-4o, Canvas & DALL·E 3 không giới hạn tốc độ',
      description: 'Mua chung gói OpenAI Business/Team Workspace bản quyền chính hãng. Mỗi người nhận một invite slot riêng biệt vào email cá nhân, bảo mật lịch sử chat 100%, không bị out tài khoản.',
      deliveryEstimate: 'Tự động duyệt ngay khi đủ 5 slot',
      features: [
        'Truy cập GPT-4o, GPT-4.5 Preview & o3-mini',
        'Code Interpreter, Advanced Voice Mode & Canvas',
        'Slot riêng tư (Private Workspace Member)',
        'Bảo hành trọn vẹn 30 ngày qua ví Escrow'
      ],
      instructions: [
        '1. Tham gia slot trong pool đang mở hoặc tạo pool mới',
        '2. Khi đủ 5/5 người, hệ thống tự động gửi link mời Workspace vào email của bạn',
        '3. Chấp nhận lời mời để kích hoạt ChatGPT Plus ngay lập tức'
      ],
      tags: ['OpenAI', 'GPT-4o', 'AI Tools', 'Team Workspace', 'Code Interpreter'],
      pools: {
        'pool-gpt-881': 'Nhóm OpenAI Team Pro Batch #881'
      }
    },
    'en': {
      title: 'ChatGPT Plus & Codex Team Seat (30 Days)',
      subtitle: 'Private seat in OpenAI Team Workspace, unlimited GPT-4o, Canvas & DALL·E 3 speed',
      description: 'Official OpenAI Business/Team Workspace group buy license. Each user receives a dedicated invite sent directly to their personal email with 100% private chat history and no logouts.',
      deliveryEstimate: 'Auto-dispatched immediately once 5 slots are filled',
      features: [
        'Full access to GPT-4o, GPT-4.5 Preview & o3-mini',
        'Code Interpreter, Advanced Voice Mode & Canvas',
        'Dedicated Private Workspace Member seat',
        'Full 30-day Escrow warranty protection'
      ],
      instructions: [
        '1. Join an open pool slot or create a new group pool',
        '2. When 5/5 members join, system sends the Workspace invite link to your email',
        '3. Accept the invite to activate ChatGPT Plus instantly'
      ],
      tags: ['OpenAI', 'GPT-4o', 'AI Tools', 'Team Workspace', 'Code Interpreter'],
      pools: {
        'pool-gpt-881': 'OpenAI Team Pro Batch #881'
      }
    },
    'zh': {
      title: 'ChatGPT Plus & Codex 团队席位 (30天)',
      subtitle: 'OpenAI Team 工作区独立席位，无限速 GPT-4o、Canvas 与 DALL·E 3',
      description: '官方正版 OpenAI Business/Team 团队拼团方案。每个成员通过个人邮箱接收专属邀请链接，对话记录100%独立私密，永不掉线。',
      deliveryEstimate: '满 5 人自动秒级发货',
      features: [
        '畅享 GPT-4o、GPT-4.5 Preview 及 o3-mini 模型',
        '代码解释器、高级语音模式与 Canvas 画布',
        '专属独立工作区成员席位 (Private Workspace)',
        '30 天 CyberPool 智能合约全额担保'
      ],
      instructions: [
        '1. 加入正在开放的拼团席位或发起新拼团',
        '2. 满员后系统自动将官方邀请链接发送至您的邮箱',
        '3. 点击接受邀请即可立即激活 ChatGPT Plus 权益'
      ],
      tags: ['OpenAI', 'GPT-4o', 'AI工具', '团队工作区', '代码解释器'],
      pools: {
        'pool-gpt-881': 'OpenAI Team Pro 拼团批次 #881'
      }
    },
    'ja': {
      title: 'ChatGPT Plus & Codex チームシート (30日間)',
      subtitle: 'OpenAI Team ワークスペース専用シート、GPT-4o・Canvas・DALL·E 3 高速無制限',
      description: 'OpenAI Business/Team Workspace の公式グループ購入プラン。個人メール宛に専用招待リンクが届き、チャット履歴は100%完全プライベートで保護されます。',
      deliveryEstimate: '5スロット満員時に自動即時納品',
      features: [
        'GPT-4o、GPT-4.5 Preview、o3-mini に完全対応',
        'Code Interpreter、高度音声モード、Canvas',
        '完全個別プライベートワークスペース席',
        'CyberPool エスクローによる30日間完全保証'
      ],
      instructions: [
        '1. 募集中のスロットに参加するか新規プールを作成',
        '2. 5/5名揃い次第、招待リンクがメールに自動送信されます',
        '3. 招待を承諾して即座に ChatGPT Plus を有効化'
      ],
      tags: ['OpenAI', 'GPT-4o', 'AIツール', 'チームワークスペース'],
      pools: {
        'pool-gpt-881': 'OpenAI Team Pro バッチ #881'
      }
    },
    'ko': {
      title: 'ChatGPT Plus & Codex 팀 시트 (30일권)',
      subtitle: 'OpenAI Team 워크스페이스 독립 시트, 무제한 GPT-4o, Canvas 및 DALL·E 3 속도',
      description: '공식 OpenAI Business/Team Workspace 공동 구매 라이선스. 개인 이메일로 전송되는 독립 초대 링크로 100% 프라이빗 대화 기록 보장 및 계정 튕김 없음.',
      deliveryEstimate: '5명 모집 완료 즉시 자동 발송',
      features: [
        'GPT-4o, GPT-4.5 Preview 및 o3-mini 풀 액세스',
        'Code Interpreter, 고급 음성 모드 및 Canvas',
        '독립 개인 워크스페이스 멤버 시트',
        '에스크로 스마트 컨트랙트 30일 완전 보증'
      ],
      instructions: [
        '1. 오픈된 풀에 참여하거나 새 그룹 풀 생성',
        '2. 5명 완료 시 이메일로 워크스페이스 초대 링크 자동 발송',
        '3. 초대 수락 후 즉시 ChatGPT Plus 활성화'
      ],
      tags: ['OpenAI', 'GPT-4o', 'AI 도구', '팀 워크스페이스'],
      pools: {
        'pool-gpt-881': 'OpenAI Team Pro 그룹 #881'
      }
    },
    'ru': {
      title: 'ChatGPT Plus & Codex Team Seat (30 дней)',
      subtitle: 'Персональный слот в OpenAI Team Workspace, безлимитный доступ к GPT-4o, Canvas и DALL·E 3',
      description: 'Официальная подписка OpenAI Team Workspace через групповую закупку. Приглашение отправляется на ваш личный e-mail, история диалогов на 100% приватна.',
      deliveryEstimate: 'Автодоставка сразу после набора 5 участников',
      features: [
        'Доступ к GPT-4o, GPT-4.5 Preview и o3-mini',
        'Интерпретатор кода, расширенный голосовой режим и Canvas',
        'Личный закрытый слот в Team Workspace',
        'Полная 30-дневная гарантия через Escrow'
      ],
      instructions: [
        '1. Присоединитесь к пулу или создайте новый',
        '2. После набора 5 участников инвайт-ссылка придет на почту',
        '3. Примите приглашение для мгновенной активации Plus'
      ],
      tags: ['OpenAI', 'GPT-4o', 'AI инструменты', 'Team Workspace'],
      pools: {
        'pool-gpt-881': 'OpenAI Team Pro Пул #881'
      }
    },
    'fr': {
      title: 'ChatGPT Plus & Codex Team Seat (30 Jours)',
      subtitle: 'Siège privé dans OpenAI Team Workspace, vitesse illimitée GPT-4o, Canvas & DALL·E 3',
      description: 'Licence officielle OpenAI Business/Team Workspace en achat groupé. Chaque membre reçoit une invitation directe sur son e-mail personnel, historique 100% privé.',
      deliveryEstimate: 'Attribution automatique dès que les 5 slots sont complets',
      features: [
        'Accès complet à GPT-4o, GPT-4.5 Preview & o3-mini',
        'Interpréteur de code, mode vocal avancé & Canvas',
        'Siège membre privé dédié (Private Workspace)',
        'Garantie totale 30 jours via séquestre Escrow'
      ],
      instructions: [
        '1. Rejoignez un slot ouvert ou créez un nouveau groupe',
        '2. Dès 5 participants, le lien d’invitation est envoyé par e-mail',
        '3. Acceptez l’invitation pour activer ChatGPT Plus instantanément'
      ],
      tags: ['OpenAI', 'GPT-4o', 'Outils IA', 'Espace Équipe'],
      pools: {
        'pool-gpt-881': 'Groupe OpenAI Team Pro #881'
      }
    },
    'de': {
      title: 'ChatGPT Plus & Codex Team Seat (30 Tage)',
      subtitle: 'Privater Platz im OpenAI Team Workspace, unbegrenztes Tempo für GPT-4o, Canvas & DALL·E 3',
      description: 'Offizielles OpenAI Business/Team Workspace Gruppenkauf-Abonnement. Jeder Nutzer erhält eine persönliche Einladung per E-Mail mit 100% privatem Chat-Verlauf.',
      deliveryEstimate: 'Automatische Zustellung sofort nach 5 Teilnehmern',
      features: [
        'Zugang zu GPT-4o, GPT-4.5 Preview & o3-mini',
        'Code Interpreter, Advanced Voice Mode & Canvas',
        'Eigener privater Workspace-Platz',
        'Volle 30 Tage Garantie über Escrow-Treuhand'
      ],
      instructions: [
        '1. Offenem Pool beitreten oder neuen Pool erstellen',
        '2. Bei 5 Teilnehmern wird der Einladungslink per E-Mail versendet',
        '3. Einladung annehmen und ChatGPT Plus sofort nutzen'
      ],
      tags: ['OpenAI', 'GPT-4o', 'KI-Tools', 'Team Workspace'],
      pools: {
        'pool-gpt-881': 'OpenAI Team Pro Gruppe #881'
      }
    },
    'es': {
      title: 'ChatGPT Plus & Codex Team Seat (30 Días)',
      subtitle: 'Espacio privado en OpenAI Team Workspace, velocidad ilimitada en GPT-4o, Canvas y DALL·E 3',
      description: 'Licencia oficial de compra grupal de OpenAI Business/Team Workspace. Cada usuario recibe una invitación a su correo personal con historial 100% privado.',
      deliveryEstimate: 'Entrega automática inmediata al completar los 5 slots',
      features: [
        'Acceso total a GPT-4o, GPT-4.5 Preview y o3-mini',
        'Intérprete de código, modo de voz avanzado y Canvas',
        'Espacio privado exclusivo (Private Workspace Member)',
        'Garantía total de 30 días mediante contrato Escrow'
      ],
      instructions: [
        '1. Únete a un slot disponible o crea un nuevo grupo',
        '2. Al completarse 5 miembros, el sistema envía la invitación a tu email',
        '3. Acepta la invitación para activar ChatGPT Plus al instante'
      ],
      tags: ['OpenAI', 'GPT-4o', 'Herramientas IA', 'Workspace'],
      pools: {
        'pool-gpt-881': 'Grupo OpenAI Team Pro #881'
      }
    }
  },

  'prod-black-myth-wukong': {
    'vi': {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Bản quyền Steam kích hoạt toàn cầu (Global Key), đồ hoạ đỉnh cao Unreal Engine 5',
      description: 'Chương trình gom sỉ Steam Key từ nhà phân phối uỷ quyền khu vực SEA. Khi gom đủ lốc 4 keys, giá chỉ còn một nửa so với giá niêm yết trên Steam Store.',
      deliveryEstimate: 'Bàn giao key tự động vào Cyber Vault ngay khi chốt deal',
      features: [
        'Kích hoạt trên tài khoản Steam chính chủ',
        'Chơi online, cloud save và thành tựu đầy đủ',
        'Không cần đổi vùng (VPN/Region-Free)',
        'Bảo hành vĩnh viễn không bị thu hồi'
      ],
      instructions: [
        '1. Tham gia nhóm gom key đang mở',
        '2. Khi đủ 4 người mua, Cyber Escrow tự động phân bổ mã key vào Vault',
        '3. Kích hoạt mã trên Steam Client: Games -> Activate a Product on Steam'
      ],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key', 'Game of the Year'],
      pools: {
        'pool-wukong-402': 'Gom sỉ Black Myth Wukong Lốc #402'
      }
    },
    'en': {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Global activation Steam CDKey with cutting-edge Unreal Engine 5 graphics',
      description: 'Wholesale group buy for Steam Keys from authorized SEA distributors. When a batch of 4 keys is completed, the price is cut in half compared to the official Steam Store retail price.',
      deliveryEstimate: 'Automated CDKey delivery to Cyber Vault upon deal completion',
      features: [
        'Activates directly on your personal Steam account',
        'Full online features, cloud saves, and Steam achievements',
        'Region-free global activation (no VPN required)',
        'Lifetime warranty against revocation'
      ],
      instructions: [
        '1. Join an open wholesale group pool',
        '2. When 4 buyers join, Cyber Escrow instantly issues your Steam key to your Vault',
        '3. Redeem in Steam Client: Games -> Activate a Product on Steam'
      ],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key', 'Game of the Year'],
      pools: {
        'pool-wukong-402': 'Black Myth: Wukong Group Pool Batch #402'
      }
    },
    'zh': {
      title: 'Steam CDKey: 黑神话：悟空 (全球版 Global Key)',
      subtitle: 'Steam 全球激活正版密钥，虚幻5引擎顶级视效国风动作巨作',
      description: '来自官方授权批发渠道的拼团批发方案。每团集齐4人即可享受半价折扣，相比 Steam 官方商店省去大笔费用。',
      deliveryEstimate: '成团后自动将 CDKey 存入 Cyber 保险库',
      features: [
        '直接激活至您本人的 Steam 个人主账号',
        '支持完整云存档、成就系统与在线内容',
        '全球无锁区激活（无需挂载任何 VPN）',
        '终身质保保障，永不召回'
      ],
      instructions: [
        '1. 加入正在拼团的席位或发起新团',
        '2. 满4人后 Cyber Escrow 智能合约自动将 CDKey 派发至您的保险库',
        '3. 打开 Steam 客户端 -> 游戏 -> 在 Steam 上激活产品'
      ],
      tags: ['Steam', '动作RPG', '虚幻5', '全球Key', '年度大作'],
      pools: {
        'pool-wukong-402': '黑神话：悟空 4人成团批次 #402'
      }
    },
    'ja': {
      title: 'Steam Key: 黒神話：悟空 (Global Key)',
      subtitle: 'Steam グローバル有効化対応、Unreal Engine 5 採用の超大作アクションRPG',
      description: '正規代理店卸売りによる Steam キー共同購入。4名のグループ成立で、Steam ストア定価の半額で入手可能です。',
      deliveryEstimate: '成約後すぐに Cyber Vault にキーを自動配信',
      features: [
        'ご自身の Steam 本アカウントに直接登録可能',
        'クラウドセーブ・実績機能・オンライン完全対応',
        '国・地域制限なし（VPN不要のグローバル版）',
        '無効化防止の永久保証付き'
      ],
      instructions: [
        '1. 進行中の共同購入プールに参加',
        '2. 4名揃った時点で Cyber Escrow が自動でキーを発行',
        '3. Steam クライアントを開き「ゲーム」→「Steam でアイテムを有効化」'
      ],
      tags: ['Steam', 'アクションRPG', 'Unreal Engine 5', 'Global Key'],
      pools: {
        'pool-wukong-402': '黒神話：悟空 グループ購入バッチ #402'
      }
    },
    'ko': {
      title: 'Steam Key: 검은 신화: 오공 (글로벌 키)',
      subtitle: '언리얼 엔진 5 기반 Steam 글로벌 활성화 정품 CDKey',
      description: '공식 유통사 도매 단체 구매 프로그램. 4인 그룹 완성 시 Steam 공식 스토어 정가 대비 50% 할인된 가격으로 제공됩니다.',
      deliveryEstimate: '그룹 달성 즉시 Cyber Vault로 CDKey 자동 지급',
      features: [
        '개인 Steam 본계정에 직접 등록 및 영구 소장',
        '클라우드 동기화, 업적 및 멀티플레이 완전 지원',
        '국가 제한 없는 글로벌 키 (VPN 불필요)',
        '회수 없는 평생 정품 보증'
      ],
      instructions: [
        '1. 진행 중인 도매 그룹에 참여',
        '2. 4명 모집 시 Cyber Escrow가 볼트로 키 자동 배정',
        '3. Steam 클라이언트 -> 게임 -> Steam에 제품 등록'
      ],
      tags: ['Steam', '액션RPG', 'Unreal Engine 5', '글로벌 키'],
      pools: {
        'pool-wukong-402': '검은 신화: 오공 도매 그룹 #402'
      }
    },
    'ru': {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Официальный ключ Steam без региональных ограничений на движке Unreal Engine 5',
      description: 'Оптовая закупка ключей у авторизованного дистрибьютора. При наборе 4 человек цена вдвое ниже, чем в официальном магазине Steam.',
      deliveryEstimate: 'Автоматическая выдача ключа в Cyber Vault сразу после завершения пула',
      features: [
        'Активация на ваш личный основной аккаунт Steam',
        'Облачные сохранения, достижения и онлайн',
        'Global Key без ограничений региона (VPN не требуется)',
        'Пожизненная гарантия от отзыва ключа'
      ],
      instructions: [
        '1. Присоединитесь к пулу оптовой закупки',
        '2. При наборе 4 участников ключ появится в вашем Vault',
        '3. Активируйте в Steam: Игры -> Активировать в Steam'
      ],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: {
        'pool-wukong-402': 'Black Myth Wukong Оптовый Пул #402'
      }
    },
    'fr': {
      title: 'Clé Steam : Black Myth Wukong (Clé Globale)',
      subtitle: 'Activation mondiale sur Steam, graphismes de pointe sous Unreal Engine 5',
      description: 'Achat groupé de clés Steam auprès d’un distributeur officiel. En complétant un groupe de 4 personnes, le prix est réduit de 50% par rapport au Steam Store.',
      deliveryEstimate: 'Attribution automatique de la clé dans votre Cyber Vault',
      features: [
        'Activation directe sur votre compte Steam personnel',
        'Sauvegardes dans le cloud, succès et fonctionnalités en ligne',
        'Clé mondiale sans restriction de région (sans VPN)',
        'Garantie à vie contre toute révocation'
      ],
      instructions: [
        '1. Rejoignez un groupe d’achat en cours',
        '2. Dès 4 participants, la clé est délivrée dans votre Vault',
        '3. Activez sur Steam : Jeux -> Activer un produit sur Steam'
      ],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: {
        'pool-wukong-402': 'Groupe d’achat Black Myth Wukong #402'
      }
    },
    'de': {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Weltweite Steam-Aktivierung, Next-Gen Grafik mit Unreal Engine 5',
      description: 'Großhandels-Sammelkauf für offizielle Steam-Keys. Bei 4 Teilnehmern halbiert sich der Preis im Vergleich zum regulären Steam Store.',
      deliveryEstimate: 'Sofortige automatische Schlüsselbereitstellung im Cyber Vault',
      features: [
        'Direkte Aktivierung auf dem eigenen Steam-Account',
        'Volle Cloud-Saves, Errungenschaften und Online-Funktionen',
        'Keine Regionalsperre (weltweit ohne VPN aktivierbar)',
        'Lebenslange Garantie gegen Deaktivierung'
      ],
      instructions: [
        '1. Offenem Großhandels-Pool beitreten',
        '2. Nach 4 Käufern wird der Key im Vault hinterlegt',
        '3. Im Steam-Client aktivieren: Spiele -> Produkt bei Steam aktivieren'
      ],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: {
        'pool-wukong-402': 'Black Myth Wukong Sammelgruppe #402'
      }
    },
    'es': {
      title: 'Steam Key: Black Myth Wukong (Global Key)',
      subtitle: 'Activación global en Steam, gráficos de última generación en Unreal Engine 5',
      description: 'Programa de compra mayorista de Steam Keys. Al completar un grupo de 4 personas, el precio se reduce a la mitad en comparación con la tienda de Steam.',
      deliveryEstimate: 'Entrega automática del CDKey a tu Cyber Vault al cerrar la compra',
      features: [
        'Activación directa en tu cuenta personal de Steam',
        'Guardado en la nube, logros y funciones online completas',
        'Clave global sin restricciones de región (sin VPN)',
        'Garantía de por vida contra revocación'
      ],
      instructions: [
        '1. Únete a un grupo de compra abierto',
        '2. Al completarse 4 miembros, el código se asigna a tu Vault',
        '3. Activa en Steam: Juegos -> Activar un producto en Steam'
      ],
      tags: ['Steam', 'Action RPG', 'Unreal Engine 5', 'Global Key'],
      pools: {
        'pool-wukong-402': 'Grupo Black Myth Wukong #402'
      }
    }
  }
};

export { PRODUCT_DATA };
