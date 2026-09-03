import fs from 'fs';
import path from 'path';

// Let's write the remaining product translations
const moreProducts: Record<string, Record<string, any>> = {
  'prod-nordvpn-dedicated': {
    vi: {
      title: 'NordVPN 2 Năm Dedicated IP & CyberSec Shield',
      subtitle: 'Bảo vệ 6 thiết bị, mã hoá quân đội 256-bit, máy chủ tốc độ cao 10Gbps tại 111 quốc gia',
      deliveryEstimate: 'Giao tài khoản NordVPN qua Vault tức thì',
      description: 'Mua chung gói NordVPN 2 năm kèm bảo vệ chống mã độc và chặn quảng cáo CyberSec. Hỗ trợ kết nối đồng thời trên Windows, Mac, iOS, Android và Android TV.',
      features: ['Dedicated IP & Double VPN mã hoá cao cấp', 'Chặn quảng cáo & mã độc Threat Protection', 'Tốc độ 10Gbps tại hơn 111 quốc gia', 'Bảo hành 2 năm trọn đời dịch vụ'],
      instructions: ['1. Mở app NordVPN trên thiết bị của bạn', '2. Đăng nhập bằng email và mật khẩu được cấp', '3. Chọn máy chủ quốc gia và bật bảo vệ 1-click'],
      tags: ['NordVPN', 'VPN', 'Bảo mật', 'Dedicated IP'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec Meshnet #201' }
    },
    en: {
      title: 'NordVPN 2 Years Dedicated IP & CyberSec Shield',
      subtitle: '6 devices protected, 256-bit military-grade encryption, 10Gbps ultra-fast servers across 111 countries',
      deliveryEstimate: 'Instant NordVPN account credentials delivery to Vault',
      description: 'Group buy 2-year NordVPN subscription with CyberSec anti-malware and ad-blocking shield. Supports simultaneous connections on Windows, Mac, iOS, Android, and TV.',
      features: ['Dedicated IP & high-security Double VPN', 'Threat Protection malware & ad blocking', '10Gbps ultra-fast servers in 111+ countries', 'Full 2-year duration escrow warranty'],
      instructions: ['1. Open NordVPN app on your device', '2. Log in with the provided email and password credentials', '3. Choose server location and connect with 1-click'],
      tags: ['NordVPN', 'VPN', 'Security', 'Dedicated IP'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec Meshnet #201' }
    },
    zh: {
      title: 'NordVPN 2年独立IP与 CyberSec 安全盾 (Dedicated IP)',
      subtitle: '支持6台设备同时在线，256位军工级加密，覆盖111个国家 10Gbps 超高速节点',
      deliveryEstimate: '账号凭证即刻发至保险库',
      description: 'NordVPN 2年拼团正版订阅，含 Threat Protection 恶意软件与广告拦截盾。全平台兼容 Windows、Mac、iOS、Android 及智能电视。',
      features: ['独享 Dedicated IP 与 Double VPN 双重加密', 'Threat Protection 拦截恶意软件与追踪', '111+ 国家 10Gbps 极速专线节点', '2年全程质保，稳定不掉线'],
      instructions: ['1. 在设备上下载并打开 NordVPN 客户端', '2. 使用提供的专属账号密码登录', '3. 选择目标国家节点，一键开启安全保护'],
      tags: ['NordVPN', 'VPN', '网络安全', '独享IP'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec 车队 #201' }
    },
    ja: {
      title: 'NordVPN 2年間 Dedicated IP＆CyberSec シールド',
      subtitle: '最大6台同時保護、軍用級256bit暗号化、111カ国 10Gbps 超高速サーバー',
      deliveryEstimate: 'Vaultに即時アカウント情報を納品',
      description: 'NordVPN 2年間の正規共同購入プラン。悪意ある広告やマルウェアを遮断する Threat Protection 付き。Windows、Mac、iOS、Android、Android TV に対応。',
      features: ['専用 Dedicated IP ＆ Double VPN 暗号化', 'マルウェア・広告ブロック機能搭載', '111カ国以上の 10Gbps 超高速サーバー', '2年間の完全継続保証'],
      instructions: ['1. お手持ちの端末で NordVPN アプリを起動', '2. 提供されたログイン情報でサインイン', '3. 接続したい国を選択して 1 クリックで保護開始'],
      tags: ['NordVPN', 'VPN', 'セキュリティ'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec メッシュ #201' }
    },
    ko: {
      title: 'NordVPN 2년 단독 전용 IP 및 CyberSec 실드',
      subtitle: '기기 6대 동시 보호, 256비트 군사급 암호화, 111개국 10Gbps 초고속 서버망',
      deliveryEstimate: '볼트로 NordVPN 계정 즉시 전달',
      description: 'NordVPN 2년 공식 공동구매 플랜. 악성코드 및 광고를 완벽 차단하는 Threat Protection 탑재. Windows, Mac, iOS, Android, 스마트 TV 완벽 지원.',
      features: ['전용 Dedicated IP 및 Double VPN 이중 암호화', 'Threat Protection 악성코드 및 광고 차단', '111개국 이상의 10Gbps 초고속 서버', '2년 전체 이용 기간 정품 에스크로 보증'],
      instructions: ['1. 기기에서 NordVPN 앱 실행', '2. 지급받은 이메일 및 비밀번호로 로그인', '3. 원하는 국가 서버를 선택하여 원클릭 연결'],
      tags: ['NordVPN', 'VPN', '보안'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec 그룹 #201' }
    },
    ru: {
      title: 'NordVPN 2 Года Dedicated IP и защита CyberSec',
      subtitle: 'Защита 6 устройств, военное 256-битное шифрование, серверы 10 Гбит/с в 111 странах',
      deliveryEstimate: 'Мгновенная выдача аккаунта в Vault',
      description: 'Совместная 2-летняя подписка NordVPN с защитой Threat Protection против вирусов и рекламы. Поддерживает Windows, Mac, iOS, Android и Android TV.',
      features: ['Выделенный IP и двойное Double VPN шифрование', 'Блокировка рекламы и угроз Threat Protection', 'Серверы 10 Гбит/с в 111+ странах', 'Полная гарантия на 2 года'],
      instructions: ['1. Откройте приложение NordVPN', '2. Войдите с выданными логином и паролем', '3. Выберите страну и подключитесь в 1 клик'],
      tags: ['NordVPN', 'VPN', 'Безопасность'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec Пул #201' }
    },
    fr: {
      title: 'NordVPN 2 Ans IP Dédiée & Bouclier CyberSec',
      subtitle: 'Protection 6 appareils, chiffrement militaire 256 bits, serveurs 10 Gbps dans 111 pays',
      deliveryEstimate: 'Identifiants NordVPN délivrés instantanément dans le Vault',
      description: 'Abonnement groupé NordVPN 2 Ans avec protection anti-malware et blocage des publicités CyberSec. Compatible Windows, Mac, iOS, Android et TV.',
      features: ['IP dédiée & Double VPN hautement sécurisé', 'Blocage des menaces et pubs Threat Protection', 'Serveurs 10 Gbps ultra-rapides dans 111+ pays', 'Garantie totale 2 ans'],
      instructions: ['1. Ouvrez l’application NordVPN', '2. Connectez-vous avec les identifiants fournis', '3. Sélectionnez un pays et connectez-vous en 1 clic'],
      tags: ['NordVPN', 'VPN', 'Sécurité'],
      pools: { 'pool-nordvpn-201': 'Groupe NordVPN CyberSec #201' }
    },
    de: {
      title: 'NordVPN 2 Jahre Dedizierte IP & CyberSec Schutz',
      subtitle: '6 Geräte gleichzeitig, 256-Bit-Militärverschlüsselung, 10Gbps-Server in 111 Ländern',
      deliveryEstimate: 'Sofortige Übermittlung der NordVPN-Daten im Vault',
      description: '2-Jahres NordVPN Gruppen-Abonnement inklusive CyberSec Bedrohungsschutz gegen Malware und Tracker. Für Windows, Mac, iOS, Android und TV.',
      features: ['Eigene Dedizierte IP & Double-VPN Verschlüsselung', 'Threat Protection Werbe- und Malwareschutz', '10Gbps Hochgeschwindigkeit in 111+ Ländern', 'Volle 2-Jahres Laufzeit-Garantie'],
      instructions: ['1. NordVPN App auf dem Gerät öffnen', '2. Mit den erhaltenen Zugangsdaten einloggen', '3. Wunschland auswählen und mit 1 Klick verbinden'],
      tags: ['NordVPN', 'VPN', 'Sicherheit'],
      pools: { 'pool-nordvpn-201': 'NordVPN CyberSec Gruppe #201' }
    },
    es: {
      title: 'NordVPN 2 Años IP Dedicada y Escudo CyberSec',
      subtitle: 'Protege 6 dispositivos, cifrado militar de 256 bits, servidores de 10 Gbps en 111 países',
      deliveryEstimate: 'Credenciales de NordVPN entregadas al instante en tu Vault',
      description: 'Suscripción de 2 años de NordVPN en compra grupal con protección contra malware y anuncios CyberSec. Compatible con Windows, Mac, iOS, Android y TV.',
      features: ['IP dedicada y doble cifrado Double VPN', 'Bloqueo de amenazas y anuncios Threat Protection', 'Servidores de 10 Gbps en más de 111 países', 'Garantía total durante los 2 años'],
      instructions: ['1. Abre la aplicación de NordVPN en tu dispositivo', '2. Inicia sesión con el correo y contraseña facilitados', '3. Selecciona el país y activa la protección en 1 clic'],
      tags: ['NordVPN', 'VPN', 'Seguridad'],
      pools: { 'pool-nordvpn-201': 'Grupo NordVPN CyberSec #201' }
    }
  },

  'prod-claude-35-sonnet': {
    vi: {
      title: 'Claude 3.5 Sonnet & Opus Team Workspace (30 Ngày)',
      subtitle: 'Tài khoản Anthropic Team, Artifacts tương tác, dung lượng context 200K tokens',
      deliveryEstimate: 'Cấp tài khoản hoặc link mời sau 3 phút',
      description: 'Gói tài khoản Anthropic Claude Team Workspace bản quyền. Trải nghiệm mô hình AI lập trình và phân tích số 1 thế giới Claude 3.5 Sonnet với tốc độ tối đa.',
      features: ['Mô hình Claude 3.5 Sonnet & Opus', 'Cửa sổ Context 200K tokens siêu rộng', 'Tính năng Artifacts tương tác trực tiếp', 'Bảo hành tài khoản 30 ngày'],
      instructions: ['1. Nhận email mời tham gia Claude Team', '2. Chấp nhận lời mời trên trang claude.ai', '3. Bắt đầu lập trình và xử lý văn bản với Claude 3.5'],
      tags: ['Anthropic', 'Claude 3.5', 'AI Lập trình', 'Artifacts'],
      pools: { 'pool-claude-910': 'Claude 3.5 Sonnet Team Cluster #910' }
    },
    en: {
      title: 'Claude 3.5 Sonnet & Opus Team Workspace (30 Days)',
      subtitle: 'Anthropic Team account, interactive Artifacts, massive 200K token context window',
      deliveryEstimate: 'Account or workspace invite dispatched within 3 minutes',
      description: 'Official Anthropic Claude Team Workspace group buy. Experience the world-leading coding and reasoning AI model Claude 3.5 Sonnet at peak speed without throttles.',
      features: ['Claude 3.5 Sonnet & Opus flagship models', 'Massive 200K token context capacity', 'Live interactive Artifacts code preview', 'Full 30-day escrow warranty protection'],
      instructions: ['1. Receive your official Claude Team invite email', '2. Accept the invitation on claude.ai', '3. Start coding and analyzing with maximum speed'],
      tags: ['Anthropic', 'Claude 3.5', 'AI Coding', 'Artifacts'],
      pools: { 'pool-claude-910': 'Claude 3.5 Sonnet Team Cluster #910' }
    },
    zh: {
      title: 'Claude 3.5 Sonnet & Opus 团队工作区 (30天)',
      subtitle: 'Anthropic 官方团队版，支持交互式 Artifacts 与 200K 超大上下文窗口',
      deliveryEstimate: '3分钟内秒级发货邀请',
      description: '官方正版 Anthropic Claude Team Workspace 拼团授权。畅享全球顶尖编程与逻辑推理大模型 Claude 3.5 Sonnet，最高速度不限流。',
      features: ['Claude 3.5 Sonnet 与 Opus 旗舰大模型', '200K 超长上下文 Token 吞吐处理', '原生交互式 Artifacts 前端代码即时预览', '30天全额质保售后无忧'],
      instructions: ['1. 查收发送至邮箱的 Claude 团队邀请', '2. 在 claude.ai 官网确认加入组织', '3. 开启超快编程、学术研究与商业分析'],
      tags: ['Anthropic', 'Claude 3.5', '编程AI', 'Artifacts'],
      pools: { 'pool-claude-910': 'Claude 3.5 团队拼团 #910' }
    },
    ja: {
      title: 'Claude 3.5 Sonnet & Opus チームワークスペース (30日間)',
      subtitle: 'Anthropic Team 正規プラン、インタラクティブ Artifacts、200K トークン文脈対応',
      deliveryEstimate: '3分以内に招待リンクを即時発行',
      description: 'Anthropic Claude Team Workspace の公式グループ購入。世界トップクラスのコーディング・推論AIモデル Claude 3.5 Sonnet を最高速・無制限で体感。',
      features: ['Claude 3.5 Sonnet ＆ Opus 最上位モデル', '200K トークンの広大なコンテキスト枠', 'リアルタイム動的 Artifacts プレビュー機能', '30日間の完全動作保証'],
      instructions: ['1. Claude Team 招待メールを受信', '2. claude.ai で招待を承認', '3. 最高峰のAIアシスタントで作業効率化'],
      tags: ['Anthropic', 'Claude 3.5', 'プログラミングAI'],
      pools: { 'pool-claude-910': 'Claude 3.5 Sonnet チーム #910' }
    },
    ko: {
      title: 'Claude 3.5 Sonnet & Opus 팀 워크스페이스 (30일권)',
      subtitle: 'Anthropic Team 공식 계정, 대화형 Artifacts, 200K 대용량 컨텍스트 윈도우',
      deliveryEstimate: '3분 이내 계정 초대 링크 발송',
      description: '공식 Anthropic Claude Team Workspace 공동구매. 전 세계 코딩 및 추론 1위 AI 모델 Claude 3.5 Sonnet을 최대 속도로 쾌적하게 활용하세요.',
      features: ['Claude 3.5 Sonnet 및 Opus 최신 플래그십', '200K 토큰 대용량 프롬프트 처리', '실시간 인터랙티브 Artifacts 코드 프리뷰', '30일 전체 에스크로 보증'],
      instructions: ['1. 수신된 이메일에서 Claude Team 초대장 확인', '2. claude.ai 공식 웹에서 초대 수락', '3. 즉시 초고속 AI 코딩 및 문서 분석 시작'],
      tags: ['Anthropic', 'Claude 3.5', '코딩 AI'],
      pools: { 'pool-claude-910': 'Claude 3.5 Sonnet 팀 그룹 #910' }
    },
    ru: {
      title: 'Claude 3.5 Sonnet & Opus Team Workspace (30 дней)',
      subtitle: 'Официальный Anthropic Team, интерактивные Artifacts, окно контекста 200K токенов',
      deliveryEstimate: 'Приглашение в воркспейс за 3 минуты',
      description: 'Групповая подписка Anthropic Claude Team Workspace. Доступ к лучшей нейросети для программирования Claude 3.5 Sonnet на максимальной скорости.',
      features: ['Модели Claude 3.5 Sonnet и Opus', 'Контекстное окно 200K токенов', 'Интерактивные окна Artifacts', '30 дней гарантии через Escrow'],
      instructions: ['1. Получите инвайт на claude.ai', '2. Примите приглашение в Team Workspace', '3. Работайте с AI на максимальной скорости'],
      tags: ['Anthropic', 'Claude 3.5', 'AI Кодинг'],
      pools: { 'pool-claude-910': 'Claude 3.5 Sonnet Пул #910' }
    },
    fr: {
      title: 'Claude 3.5 Sonnet & Opus Espace Équipe (30 Jours)',
      subtitle: 'Compte Anthropic Team, Artifacts interactifs, immense fenêtre contextuelle 200K tokens',
      deliveryEstimate: 'Invitation envoyée en moins de 3 minutes',
      description: 'Abonnement groupé officiel Anthropic Claude Team Workspace. Profitez du modèle d’IA numéro 1 en programmation Claude 3.5 Sonnet à vitesse maximale.',
      features: ['Modèles de pointe Claude 3.5 Sonnet & Opus', 'Contexte massif de 200K tokens', 'Prévisualisation dynamique via Artifacts', 'Garantie intégrale 30 jours'],
      instructions: ['1. Recevez l’e-mail d’invitation Claude Team', '2. Acceptez l’invitation sur claude.ai', '3. Développez et analysez à toute vitesse'],
      tags: ['Anthropic', 'Claude 3.5', 'IA Code'],
      pools: { 'pool-claude-910': 'Groupe Claude 3.5 Sonnet #910' }
    },
    de: {
      title: 'Claude 3.5 Sonnet & Opus Team Workspace (30 Tage)',
      subtitle: 'Anthropic Team-Konto, interaktive Artifacts, riesiges 200K-Token-Kontextfenster',
      deliveryEstimate: 'Workspace-Einladung innerhalb von 3 Minuten',
      description: 'Offizieller Anthropic Claude Team Workspace Gruppenkauf. Nutzen Sie das weltweit führende KI-Modell für Programmierung Claude 3.5 Sonnet mit maximaler Geschwindigkeit.',
      features: ['Claude 3.5 Sonnet & Opus Spitzenmodelle', 'Riesiges 200K Token Kontextvolumen', 'Interaktive Live-Vorschau mit Artifacts', 'Volle 30 Tage Treuhandgarantie'],
      instructions: ['1. Einladungsmail für Claude Team erhalten', '2. Auf claude.ai die Einladung annehmen', '3. Sofort mit Höchstgeschwindigkeit programmieren'],
      tags: ['Anthropic', 'Claude 3.5', 'Coding KI'],
      pools: { 'pool-claude-910': 'Claude 3.5 Sonnet Team Gruppe #910' }
    },
    es: {
      title: 'Claude 3.5 Sonnet & Opus Team Workspace (30 Días)',
      subtitle: 'Cuenta Anthropic Team, Artifacts interactivos, ventana de contexto gigante de 200K tokens',
      deliveryEstimate: 'Invitación al workspace enviada en menos de 3 minutos',
      description: 'Compra grupal oficial de Anthropic Claude Team Workspace. Disfruta del modelo de IA líder en programación y análisis Claude 3.5 Sonnet a máxima velocidad.',
      features: ['Modelos insignia Claude 3.5 Sonnet y Opus', 'Capacidad masiva de 200K tokens de contexto', 'Previsualización de código con Artifacts', 'Garantía total de 30 días con Escrow'],
      instructions: ['1. Recibe el correo de invitación a Claude Team', '2. Acepta la invitación en claude.ai', '3. Empieza a programar y redactar a toda velocidad'],
      tags: ['Anthropic', 'Claude 3.5', 'IA Programación'],
      pools: { 'pool-claude-910': 'Grupo Claude 3.5 Sonnet #910' }
    }
  },

  'prod-spotify-1y': {
    vi: {
      title: 'Spotify Premium Individual (1 Năm Nâng Cấp Email Chính Chủ)',
      subtitle: 'Gói cá nhân 12 tháng nghe nhạc không quảng cáo, tải offline 320kbps',
      deliveryEstimate: 'Kích hoạt hoàn tất trong 5 phút',
      description: 'Nâng cấp Spotify Premium 1 năm chính chủ trực tiếp trên tài khoản cá nhân. Không bị đổi mật khẩu, không mất playlist cá nhân.',
      features: ['Nghe nhạc không quảng cáo', 'Tải nhạc offline 320kbps', 'Chính chủ 100% không đổi pass', 'Bảo hành 12 tháng'],
      instructions: ['1. Nhập email Spotify', '2. Duyệt nâng cấp qua email', '3. Thưởng thức âm nhạc trọn vẹn'],
      tags: ['Spotify', 'Individual', '1 Year', 'Music']
    },
    en: {
      title: 'Spotify Premium Individual (1 Year Personal Email Upgrade)',
      subtitle: '12-month individual plan with ad-free music, 320kbps offline downloads',
      deliveryEstimate: 'Activation completed within 5 minutes',
      description: 'Direct 1-Year Spotify Premium upgrade on your personal account. No password sharing, 100% personal ownership, keeps all playlists intact.',
      features: ['Ad-free music streaming', 'High-quality 320kbps offline downloads', '100% personal account ownership', 'Full 12-month warranty'],
      instructions: ['1. Enter your Spotify email', '2. Approve the upgrade link', '3. Enjoy premium audio anywhere'],
      tags: ['Spotify', 'Individual', '1 Year', 'Music']
    },
    zh: {
      title: 'Spotify Premium 个人版 (1年直升个人邮箱)',
      subtitle: '12个月个人独享会员，无广告纯净听歌，支持320kbps离线下载',
      deliveryEstimate: '5分钟内极速升级',
      description: '正规 1 年期 Spotify Premium 个人独立订阅，直接绑定至您的个人账号。无需交出密码，完整保留全部个人歌单与推荐。',
      features: ['全程无广告干扰', '320kbps高品质离线下载', '100%个人专属独立账号', '12个月完整售后质保'],
      instructions: ['1. 提供您的 Spotify 邮箱', '2. 点击邮件确认升级', '3. 畅享全球顶级高品质音乐'],
      tags: ['Spotify', '个人版', '1年订阅', '音乐']
    },
    ja: {
      title: 'Spotify Premium 個人プラン (1年間 本人メールアップグレード)',
      subtitle: '12ヶ月個人専用プラン、広告なし、320kbpsオフライン再生対応',
      deliveryEstimate: '5分以内にアクティベーション完了',
      description: 'ご自身の Spotify アカウントに直接1年間の Premium 権限を付与。パスワードの変更不要で、お気に入りのプレイリストもそのまま。',
      features: ['広告なしの高音質再生', '320kbps オフライン楽曲保存', '100% 本人所有アカウント', '12ヶ月間の安心保証'],
      instructions: ['1. Spotify の登録メールを入力', '2. 届いた確認メールを承認', '3. プレミアム音楽体験を開始'],
      tags: ['Spotify', '個人プラン', '1年間', '音楽']
    },
    ko: {
      title: '스포티파이 프리미엄 개인 플랜 (1년 본인 이메일 업그레이드)',
      subtitle: '12개월 개인 전용 멤버십, 광고 없는 감상, 320kbps 오프라인 다운로드',
      deliveryEstimate: '5분 이내 활성화 완료',
      description: '본인 개인 계정에 직접 적용되는 스포티파이 프리미엄 1년 정품 플랜. 비밀번호 공유 없이 기존 플레이리스트 그대로 안전하게 유지됩니다.',
      features: ['광고 없는 무손실 음원 재생', '320kbps 고음질 오프라인 저장', '100% 개인 본인 계정 유지', '12개월 무상 보증'],
      instructions: ['1. 스포티파이 이메일 입력', '2. 이메일 링크로 승인', '3. 무제한 음악 스트리밍 즐기기'],
      tags: ['Spotify', '개인 플랜', '1년권', '음악']
    },
    ru: {
      title: 'Spotify Premium Individual (1 Год на ваш e-mail)',
      subtitle: 'Индивидуальная подписка на 12 месяцев, без рекламы, офлайн 320 кбит/с',
      deliveryEstimate: 'Активация за 5 минут',
      description: 'Официальное продление Spotify Premium на 1 год на ваш личный аккаунт. Без передачи пароля, с полным сохранением плейлистов.',
      features: ['Музыка без рекламы', 'Скачивание треков 320 кбит/с', '100% личный аккаунт', 'Гарантия на 12 месяцев'],
      instructions: ['1. Укажите email от Spotify', '2. Подтвердите активацию по ссылке', '3. Слушайте музыку без ограничений'],
      tags: ['Spotify', 'Individual', '1 Год', 'Музыка']
    },
    fr: {
      title: 'Spotify Premium Individuel (1 An sur E-mail Personnel)',
      subtitle: 'Forfait 12 mois individuel sans publicité, téléchargements hors-ligne 320 kbps',
      deliveryEstimate: 'Activation effectuée en 5 minutes',
      description: 'Mise à niveau officielle Spotify Premium 1 An sur votre propre compte. Aucun mot de passe requis, playlists 100% préservées.',
      features: ['Streaming musical sans pub', 'Téléchargements 320 kbps', 'Compte personnel dédié', 'Garantie 12 mois'],
      instructions: ['1. Saisissez votre e-mail Spotify', '2. Validez le lien d’activation', '3. Profitez de votre musique'],
      tags: ['Spotify', 'Individuel', '1 An', 'Musique']
    },
    de: {
      title: 'Spotify Premium Individual (1 Jahr auf eigene E-Mail)',
      subtitle: '12 Monate Einzel-Abonnement ohne Werbung, 320kbps Offline-Downloads',
      deliveryEstimate: 'Aktivierung innerhalb von 5 Minuten',
      description: 'Direktes 1-Jahres Spotify Premium Upgrade auf Ihr persönliches Konto. Kein Passwort erforderlich, Playlists bleiben 100% erhalten.',
      features: ['Werbefreier Musikgenuss', '320kbps Offline-Downloads', '100% persönliches Konto', '12 Monate Garantie'],
      instructions: ['1. Spotify-E-Mail eingeben', '2. Bestätigungslink aktivieren', '3. Musik überall genießen'],
      tags: ['Spotify', 'Individual', '1 Jahr', 'Musik']
    },
    es: {
      title: 'Spotify Premium Individual (1 Año en Correo Personal)',
      subtitle: 'Plan individual de 12 meses sin publicidad, descargas offline a 320kbps',
      deliveryEstimate: 'Activación completada en 5 minutos',
      description: 'Actualización oficial de Spotify Premium por 1 año en tu cuenta personal. Sin compartir contraseña y conservando todas tus canciones.',
      features: ['Música sin anuncios', 'Descargas offline en 320kbps', 'Cuenta 100% propia', 'Garantía de 12 meses'],
      instructions: ['1. Introduce tu correo de Spotify', '2. Acepta el enlace de activación', '3. Disfruta de la mejor música'],
      tags: ['Spotify', 'Individual', '1 Año', 'Música']
    }
  },

  'prod-youtube-premium-1y': {
    vi: {
      title: 'YouTube Premium & Music (1 Năm Gia Hạn Email Cá Nhân)',
      subtitle: 'Xem YouTube không quảng cáo, chạy trong nền khi tắt màn hình, bao gồm YouTube Music',
      deliveryEstimate: 'Gia hạn hoàn tất sau 5-10 phút',
      description: 'Đăng ký YouTube Premium 1 năm chính hãng trên email Google cá nhân. Chặn 100% quảng cáo trên TV, điện thoại, máy tính, tặng kèm YouTube Music Premium.',
      features: ['Không quảng cáo trên mọi thiết bị', 'Phát trong nền khi tắt màn hình', 'Bao gồm YouTube Music Premium', 'Bảo hành 1 năm chính hãng'],
      instructions: ['1. Nhập email tài khoản Google/YouTube', '2. Xác nhận link mời gia đình', '3. Mở YouTube xem không quảng cáo'],
      tags: ['YouTube', 'Premium', 'YouTube Music', 'Không quảng cáo']
    },
    en: {
      title: 'YouTube Premium & Music (1 Year Personal Email Extension)',
      subtitle: 'Ad-free YouTube, background playback with screen locked, includes YouTube Music Premium',
      deliveryEstimate: 'Extension completed within 5-10 minutes',
      description: 'Official 1-Year YouTube Premium membership on your personal Google email. Eliminates 100% of ads across Smart TVs, phones, tablets, and desktops with YouTube Music included.',
      features: ['Ad-free videos on all screens and Smart TVs', 'Background play with screen locked', 'Full YouTube Music Premium included', 'Full 1-year escrow warranty guarantee'],
      instructions: ['1. Enter your personal Google/YouTube email', '2. Accept the family invite verification link', '3. Open YouTube and enjoy ad-free streaming'],
      tags: ['YouTube', 'Premium', 'YouTube Music', 'Ad-Free']
    },
    zh: {
      title: 'YouTube Premium & Music (1年升级个人谷歌邮箱)',
      subtitle: '全平台无广告看视频，支持锁屏后台播放，赠送 YouTube Music Premium',
      deliveryEstimate: '5-10分钟内极速升级',
      description: '正规 1 年期 YouTube Premium 官方订阅，直升个人 Google 邮箱。在电视、手机、iPad 与电脑上畅享 100% 零广告视频体验。',
      features: ['全设备电视手机彻底告别广告', '手机锁屏支持后台画中画播放', '畅享 YouTube Music 高品质音乐库', '1年全周期智能合约质保'],
      instructions: ['1. 填写您的 Google/YouTube 邮箱', '2. 查收并确认官方家庭邀请链接', '3. 开启沉浸式无广告观影体验'],
      tags: ['YouTube', 'Premium', 'YouTube Music', '无广告']
    },
    ja: {
      title: 'YouTube Premium & Music (1年間 本人Googleメール更新)',
      subtitle: '全端末で広告なし動画再生、画面オフ時のバックグラウンド再生、YouTube Music 付属',
      deliveryEstimate: '5〜10分以内に更新完了',
      description: 'ご自身の Google アカウントで YouTube Premium 1年間を正規利用。テレビやスマホでの完全広告ブロックと YouTube Music Premium が利用可能。',
      features: ['TV・スマホ・PC 全てで完全広告なし', '画面ロック時のバックグラウンド再生', 'YouTube Music Premium を無料同梱', '1年間の安心エスクロー保証'],
      instructions: ['1. Google / YouTube のメールアドレスを入力', '2. 届いたファミリー招待を承認', '3. 広告なしで YouTube を快適視聴'],
      tags: ['YouTube', 'Premium', 'YouTube Music', '広告なし']
    },
    ko: {
      title: '유튜브 프리미엄 & 뮤직 (1년 본인 구글 이메일 연장)',
      subtitle: '모든 기기 광고 없는 시청, 화면 꺼짐 백그라운드 재생, YouTube Music 포함',
      deliveryEstimate: '5~10분 이내 연장 완료',
      description: '개인 구글 계정에 직접 적용되는 정품 유튜브 프리미엄 1년 플랜. 스마트 TV, 스마트폰, PC에서 100% 광고 없이 시청 가능하며 유튜브 뮤직이 기본 포함됩니다.',
      features: ['스마트 TV 및 모바일 전체 무광고 시청', '화면을 꺼도 지속되는 백그라운드 재생', 'YouTube Music Premium 기본 포함', '1년 정품 에스크로 보증'],
      instructions: ['1. 구글 / 유튜브 계정 이메일 입력', '2. 수신된 패밀리 초대 링크 승인', '3. 광고 없는 쾌적한 유튜브 시청'],
      tags: ['YouTube', '프리미엄', '유튜브뮤직', '광고제거']
    },
    ru: {
      title: 'YouTube Premium & Music (1 Год на ваш Google аккаунт)',
      subtitle: 'Видео без рекламы, фоновое воспроизведение с выключенным экраном, YouTube Music',
      deliveryEstimate: 'Продление за 5-10 минут',
      description: 'Официальная подписка YouTube Premium на 1 год на ваш личный Google аккаунт. Полное отключение рекламы на TV, смартфонах и ПК плюс доступ к YouTube Music.',
      features: ['Без рекламы на всех устройствах и Smart TV', 'Воспроизведение в фоне с выключенным экраном', 'Полный доступ к YouTube Music Premium', 'Гарантия 1 год'],
      instructions: ['1. Укажите Google email', '2. Примите приглашение в семью', '3. Смотрите YouTube без рекламы'],
      tags: ['YouTube', 'Premium', 'YouTube Music', 'Без рекламы']
    },
    fr: {
      title: 'YouTube Premium & Music (1 An sur E-mail Google)',
      subtitle: 'Vidéos sans pub, lecture en arrière-plan écran verrouillé, YouTube Music inclus',
      deliveryEstimate: 'Mise à niveau en 5 à 10 minutes',
      description: 'Abonnement YouTube Premium 1 An officiel sur votre compte Google. Supprime 100% des publicités sur Smart TV, téléphones et ordinateurs, avec YouTube Music.',
      features: ['Aucune pub sur TV, mobile et PC', 'Lecture en arrière-plan écran éteint', 'YouTube Music Premium inclus', 'Garantie intégrale 1 an'],
      instructions: ['1. Entrez votre e-mail Google/YouTube', '2. Acceptez l’invitation famille', '3. Profitez de YouTube sans interruption'],
      tags: ['YouTube', 'Premium', 'YouTube Music', 'Sans pub']
    },
    de: {
      title: 'YouTube Premium & Music (1 Jahr auf eigene Google-Mail)',
      subtitle: 'Werbefreie Videos, Hintergrundwiedergabe bei gesperrtem Bildschirm, inklusive YouTube Music',
      deliveryEstimate: 'Upgrade innerhalb von 5-10 Minuten',
      description: 'Offizielles 1-Jahres YouTube Premium Abonnement auf Ihrer Google-E-Mail. 100% werbefrei auf Smart-TVs, Smartphones und PCs inklusive YouTube Music Premium.',
      features: ['Völlig werbefrei auf allen Geräten und Smart-TVs', 'Hintergrundwiedergabe bei ausgeschaltetem Display', 'Voller Zugriff auf YouTube Music Premium', '1 Jahr Rundum-Garantie'],
      instructions: ['1. Google / YouTube-E-Mail angeben', '2. Familien-Einladungslink annehmen', '3. Videos werbefrei genießen'],
      tags: ['YouTube', 'Premium', 'YouTube Music', 'Werbefrei']
    },
    es: {
      title: 'YouTube Premium & Music (1 Año en Correo de Google)',
      subtitle: 'Videos sin publicidad, reproducción en segundo plano con pantalla apagada, incluye YouTube Music',
      deliveryEstimate: 'Activación en 5 a 10 minutos',
      description: 'Suscripción oficial de 1 año de YouTube Premium en tu cuenta de Google. Elimina todos los anuncios en Smart TVs, móviles y PC, con YouTube Music Premium incluido.',
      features: ['Sin publicidad en televisores, móviles y PC', 'Reproducción en segundo plano con pantalla bloqueada', 'Acceso total a YouTube Music Premium', 'Garantía completa de 1 año'],
      instructions: ['1. Proporciona tu correo de Google/YouTube', '2. Acepta el enlace de invitación familiar', '3. Disfruta de YouTube sin anuncios'],
      tags: ['YouTube', 'Premium', 'YouTube Music', 'Sin Anuncios']
    }
  },

  'prod-canva-pro-lifetime': {
    vi: {
      title: 'Canva Pro Edu / Enterprise (Bản Quyền Vĩnh Viễn Email Cá Nhân)',
      subtitle: 'Hơn 100 triệu ảnh, video stock, xoá phông nền AI 1-click & Brand Kit không giới hạn',
      deliveryEstimate: 'Link kích hoạt vào email ngay',
      description: 'Nâng cấp Canva Pro chính chủ vĩnh viễn trên email cá nhân của bạn. Không giới hạn dung lượng tải về thiết kế chất lượng cao SVG, PNG trong suốt.',
      features: ['Magic Eraser & Background Remover AI', '100M+ ảnh mẫu & đồ hoạ cao cấp', 'Brand Kit & phông chữ tiếng Việt đầy đủ', 'Bảo hành vĩnh viễn'],
      instructions: ['1. Nhập email tài khoản Canva', '2. Nhận link tham gia Canva Pro Team', '3. Bắt đầu thiết kế không giới hạn'],
      tags: ['Canva', 'Design', 'AI Eraser', 'Lifetime']
    },
    en: {
      title: 'Canva Pro Edu / Enterprise (Lifetime License Personal Email)',
      subtitle: '100M+ stock photos, videos, 1-click AI Background Remover & unlimited Brand Kits',
      deliveryEstimate: 'Instant activation link sent to your email',
      description: 'Permanent Canva Pro upgrade linked directly to your personal email. Unlimited downloads in high-res vector SVG and transparent PNG formats.',
      features: ['Magic Eraser & AI Background Remover', '100M+ premium templates, photos & graphics', 'Full Brand Kit & custom font uploads', 'Lifetime license warranty'],
      instructions: ['1. Enter your Canva account email', '2. Accept the Canva Pro Team invite link', '3. Start designing with unlimited pro tools'],
      tags: ['Canva', 'Design', 'AI Eraser', 'Lifetime']
    },
    zh: {
      title: 'Canva 可画 Pro 终身版 (直升个人官方邮箱)',
      subtitle: '1亿+ 高清素材与商用模版，一键 AI 智能抠图去背景，无限量 Brand Kit 品牌套件',
      deliveryEstimate: '秒级发送官方团队激活链接',
      description: '直接升级至您本人的 Canva 个人邮箱，终身畅享 Pro 权益。支持无限制导出超清矢量 SVG 与透明底 PNG 设计稿。',
      features: ['一键 AI 智能消除笔与抠图换背景', '1亿+ 官方正版商用模板与矢量插画', '支持自定义品牌色盘与海量中文字体', '终身质保保障，稳定安全'],
      instructions: ['1. 输入您的 Canva 账号邮箱', '2. 查收并点击加入 Canva Pro 团队', '3. 开启无拘无束的专业视觉设计'],
      tags: ['Canva', '平面设计', 'AI抠图', '终身正版']
    },
    ja: {
      title: 'Canva Pro Edu / Enterprise (個人メール永久ライセンス)',
      subtitle: '1億点以上の写真・動画素材、ワンクリック AI 背景透過、無制限のブランドキット',
      deliveryEstimate: 'メール宛にアクティベーション招待を即時送信',
      description: 'ご自身の Canva アカウントに永久 Pro 権限を適用。高解像度ベクター SVG や背景透過 PNG の無制限ダウンロードに対応。',
      features: ['ワンクリック AI 背景リムーバー＆マジック消しゴム', '1億点以上のプレミアムテンプレート＆素材', 'ブランドキット＆日本語フォント完全対応', '永久ライセンス保証'],
      instructions: ['1. Canva 登録メールアドレスを入力', '2. 届いた Canva Pro チーム招待に参加', '3. プロ仕様のデザインツールで制作開始'],
      tags: ['Canva', 'デザイン', 'AI透過', '永久版']
    },
    ko: {
      title: 'Canva Pro 에듀 / 엔터프라이즈 (개인 이메일 평생 라이선스)',
      subtitle: '1억 개 이상의 고화질 스톡 사진·영상, 원클릭 AI 누끼 제거, 무제한 브랜드 키트',
      deliveryEstimate: '이메일로 초대 링크 즉시 발송',
      description: '본인 개인 Canva 계정에 적용되는 평생 Pro 라이선스. 투명 배경 PNG 및 초고화질 벡터 SVG 무제한 다운로드를 지원합니다.',
      features: ['매직 지우개 및 원클릭 AI 배경 누끼 제거', '1억 개 이상의 프리미엄 템플릿과 디자인 소스', '브랜드 키트 및 전용 한글 폰트 자유 활용', '평생 정품 라이선스 보증'],
      instructions: ['1. Canva 계정 이메일 입력', '2. Canva Pro 팀 참여 링크 수락', '3. 모든 유료 디자인 기능 무제한 사용'],
      tags: ['Canva', '디자인', 'AI누끼', '평생권']
    },
    ru: {
      title: 'Canva Pro Edu / Enterprise (Бессрочная лицензия на ваш e-mail)',
      subtitle: '100M+ стоковых фото и видео, удаление фона AI в 1 клик, Brand Kit',
      deliveryEstimate: 'Ссылка на активацию приходит мгновенно',
      description: 'Бессрочное подключение Canva Pro к вашему личному аккаунту. Скачивание файлов в векторном формате SVG и прозрачном PNG без ограничений.',
      features: ['AI ластик и удаление фона в 1 клик', '100M+ премиум шаблонов и графики', 'Brand Kit и загрузка собственных шрифтов', 'Пожизненная гарантия'],
      instructions: ['1. Укажите ваш email в Canva', '2. Примите приглашение в Pro Team', '3. Создавайте дизайны без ограничений'],
      tags: ['Canva', 'Дизайн', 'AI Ластик', 'Lifetime']
    },
    fr: {
      title: 'Canva Pro Edu / Enterprise (Licence à Vie sur E-mail Personnel)',
      subtitle: '100M+ photos et vidéos, détourage AI en 1 clic & Kits de marque illimités',
      deliveryEstimate: 'Lien d’activation envoyé instantanément',
      description: 'Mise à niveau Canva Pro à vie liée à votre e-mail personnel. Téléchargements illimités en haute résolution SVG et PNG transparent.',
      features: ['Gomme magique & détourage AI en 1 clic', '100M+ modèles et illustrations premium', 'Kit de marque complet & polices personnalisées', 'Garantie à vie'],
      instructions: ['1. Indiquez votre e-mail Canva', '2. Acceptez l’invitation dans l’équipe Pro', '3. Créez des designs pro sans limite'],
      tags: ['Canva', 'Design', 'Détourage IA', 'À vie']
    },
    de: {
      title: 'Canva Pro Edu / Enterprise (Lebenslange Lizenz auf eigene E-Mail)',
      subtitle: '100M+ Fotos & Videos, 1-Klick KI-Hintergrundentferner & unbegrenzte Markenunterlagen',
      deliveryEstimate: 'Sofortiger Aktivierungslink per E-Mail',
      description: 'Dauerhaftes Canva Pro Upgrade direkt auf Ihrer persönlichen E-Mail. Unbegrenzte Downloads im hochauflösenden Vektor-SVG- und transparenten PNG-Format.',
      features: ['Magischer Radierer & KI-Freisteller mit 1 Klick', 'Über 100 Mio. Premium-Vorlagen und Grafiken', 'Vollständiges Brand Kit & Schriftarten-Upload', 'Lebenslange Lizenzgarantie'],
      instructions: ['1. Canva-E-Mail-Adresse angeben', '2. Einladungslink zum Pro-Team annehmen', '3. Professionell ohne Einschränkungen gestalten'],
      tags: ['Canva', 'Design', 'KI-Freisteller', 'Lebenslang']
    },
    es: {
      title: 'Canva Pro Edu / Enterprise (Licencia de por Vida en Correo)',
      subtitle: 'Más de 100M de fotos y vídeos, borrador de fondos por IA en 1 clic y kit de marca ilimitado',
      deliveryEstimate: 'Enlace de activación enviado de inmediato',
      description: 'Actualización permanente a Canva Pro vinculada a tu correo personal. Descargas ilimitadas en formatos vectoriales SVG y PNG transparente.',
      features: ['Borrador mágico y eliminación de fondos con IA', 'Más de 100 millones de plantillas y recursos premium', 'Kit de marca y subida de fuentes ilimitadas', 'Garantía de por vida'],
      instructions: ['1. Introduce tu correo de Canva', '2. Acepta el enlace de invitación al equipo Pro', '3. Diseña sin límites con todas las herramientas'],
      tags: ['Canva', 'Diseño', 'Borrador IA', 'De por vida']
    }
  }
};

// Now read existing catalogTranslations.ts, inject moreProducts, and write it
console.log('Appending more products...');
fs.writeFileSync(path.join(process.cwd(), 'scripts/more-products.json'), JSON.stringify(moreProducts, null, 2));
console.log('Saved more-products.json');
