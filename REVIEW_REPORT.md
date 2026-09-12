# BÁO CÁO REVIEW DỰ ÁN CYBERPOOL (OK-OK)

> Repo: https://github.com/mrtrungnv1991-droid/OK-OK · Commit review: `83d2cbe` · 259 files, ~62k dòng TS/TSX
> Phương pháp: đọc tĩnh toàn bộ code (4 luồng song song) + chạy thật `tsc --noEmit` và test suite. Các phát hiện Critical đã được verify trực tiếp trên mã nguồn.

---

## TỔNG QUAN KIẾN TRÚC THỰC TẾ (khác README)

README mô tả "PostgreSQL 64+ bảng, FastAPI anti-fraud microservice, Double-Entry Ledger". **Thực tế:**

| Thành phần README tuyên bố | Thực tế trong code |
|---|---|
| PostgreSQL 64+ bảng (`database/schema.sql`) | ❌ Không có dependency `pg` trong package.json. Toàn bộ users/wallet/orders/ledger/inventory là **Map in-memory** (`server/db/store.ts:19-41`). Restart = mất sạch tiền & đơn hàng. Postgres trong docker-compose là trang trí |
| FastAPI Anti-Fraud microservice (port 8000) | ❌ Code chết — không có lời gọi nào từ Node server tới `:8000`. `fraudService.ts` phía Node cũng không được route nào import (chỉ file định nghĩa) |
| Double-Entry Ledger | ⚠️ Danh xưng sai — `LedgerService` chỉ ghi 1 bút toán trên ví user, không có tài khoản đối ứng. `ESCROW_RELEASE` làm tiền "bay hơi" không vào túi ai. `SELLER_PAYOUT` định nghĩa nhưng không nơi nào dùng |
| Node/Express gateway | ✅ Là backend thật duy nhất (`dev: tsx server.ts`, Dockerfile CMD `node dist/server.cjs`) |

**Kết quả chạy thật:**
- `npm run lint` (tsc --noEmit): ✅ PASS sạch, 0 lỗi type
- Unit tests (auth, encryption, escrow, ledger, webhook): ✅ 15/15 PASS
- Integration test checkout: ✅ assertions PASS **nhưng process treo không thoát** (exit 143 sau timeout) — vì import `OrderService` kéo theo các worker tự khởi động `setInterval` (`paymentSystem/workers.ts:396,421,430`, `reconciliationWorker.ts:48`, `notificationQueueService.ts:14`, `distributedLock.ts:19`). `npm test` vì thế **không bao giờ kết thúc** — CI cũng sẽ treo.

**Đánh giá chung:** đây là một prototype/demo rất công phu — nhiều lớp phòng vệ được mô phỏng đúng tên gọi (state machine, circuit breaker, DLQ, AES-256-GCM vault, HMAC webhook) — nhưng chưa phải hệ thống chạy production: tiền nằm trên RAM, quỹ provider là seed giả, và tồn tại nhiều lỗ hổng bảo mật Critical.

---

## 1. PHẦN THANH TOÁN — ĐÚNG LÀ CHƯA HOÀN CHỈNH

### 🔴 Critical

1. **`POST /api/v1/payments` cho phép user đã đăng nhập ra lệnh chi tiền từ QUỸ SÀN tới `recipient` tùy ý, KHÔNG trừ ví user, KHÔNG check số dư** (`paymentRoutes.ts:25-166` — không import LedgerService). Với provider seed ACTIVE, routingEngine chọn được account nguồn và worker thực thi. Đây là lỗ hổng rút tiền nghiêm trọng nhất. *(Đã verify trực tiếp)*
2. **IDOR không cần auth**: `GET /payments/:id` (`:171`) và `POST /payments/:id/cancel` (`:203`) **không có `requireAuth`**, không check owner — ai cũng đọc/hủy payment của người khác. *(Đã verify)*
3. **Luồng auto-credit VietQR đứt hoàn toàn vì bug case + sai prefix:**
   - Frontend sinh memo: `user.id.replace('user-','')` (`DepositHubModal.tsx:83`) — nhưng id thật dạng `usr-buyer-01` (prefix `usr-` ≠ `user-`) → replace không khớp → memo thành `CYBER USR-BUYER-01` (IN HOA).
   - Webhook match regex case-insensitive nhưng tra `db.users.has('USR-BUYER-01')` **case-sensitive** (`webhookRoutes.ts:48-53`) → không bao giờ khớp → mọi deposit thật rơi vào `pendingUnmappedDeposits`, mà **không có endpoint admin nào để resolve** (chỉ GET liệt kê). *(Đã verify)*
4. **`CheckoutConfirmationModal.tsx:101-113` đọc `response.order` trong khi `api.request` bọc trong `response.data`** (`api/client.ts:89-93`) → throw lỗi **ngay cả khi server đã trừ tiền và giao key thành công**. Khách bị trừ tiền + thấy báo lỗi đặt hàng. (InstantBuyModal đọc `res.data?.order` đúng — 2 modal 2 kiểu.) *(Đã verify)*
5. **Secret fallback hardcode**: `JWT_SECRET`/`ENCRYPTION_KEY` có default trong code, production chỉ `console.warn` chứ không exit (`authSecurity.ts:5-9`, `paymentSystem/security.ts:8-12`). Repo public → forge được token SUPER_ADMIN → toàn quyền `/wallet/admin/adjust`. Kèm seed admin `admin@cyberpool.vn / Admin@CyberPool2026!` (`store.ts:49-81`) không buộc đổi.

### 🟠 Major

6. **Không có tuyến "chi tiền ra ngoài" nào thật**: `ApiSourceAdapter` fallback endpoint bịa `api.partner-<id>.net`; `BrowserSourceAdapter` chờ `BROWSER_WORKER_URL` — không có worker daemon nào trong repo; 6 tài khoản nguồn seed credential + số dư giả (`paymentSystem/store.ts:144-393`). Chiều **thu tiền vào** (Binance Pay, MoMo, USDT-TRC20/LTC, Card24h trong `gatewayVerificationService.ts`) là code gọi API thật, viết chuẩn — phần đáng tin nhất.
7. **BEP20 không verify địa chỉ nhận/số tiền** (`gatewayVerificationService.ts:342-353`) — nộp txHash của giao dịch BSC bất kỳ là được credit. (TRC20 thì verify chặt — không nhất quán.)
8. **Tiền treo vô thời hạn**: nhánh `MANUAL_REVIEW`/`WAITING_FOR_BALANCE` của worker không refund không timeout (`workers.ts:270-341`); escrow pool hết hạn 48h không có cron nào xử lý (`escrowService.ts:46`); refund worker fail-final là fire-and-forget `.catch(console)` — lỗi refund là mất tiền im lặng.
9. **Withdraw nửa vời**: `/wallet/withdraw` trừ ví ngay, transaction COMPLETED, nhưng **không có endpoint admin duyệt/giải ngân** (AdminWithdrawalsTab tồn tại nhưng là file mồ côi không được mount).
10. **Idempotency không đều**: webhook có (tốt); nhưng instant-buy nhận `idempotencyKey` từ client rồi bỏ qua (`api/orders.ts:23`), escrow/ledger callers không truyền → retry mạng = mua đôi.
11. **Escrow joinPool race thật**: check `filledSlots < targetSlots` → `await` → mới tăng slot (`escrowService.ts:57-89`) — 2 request song song oversell slot. `db.acquireUserLock` là lock giả (chỉ `Set.add`, `store.ts:226-233`); may mắn Node single-thread che được phần lớn, nhưng Docker scale-out sẽ vỡ mọi tuyên bố "distributed lock".
12. **Bug UI nhỏ nhưng chết luồng**: `TopupModal.tsx:120` lấy token sai key `cyber_auth_token` (thật là `cyberpool_auth_token`) → gọi `/orders/topup-game` luôn 401; `WalletModal.tsx:78-83` báo "Đã nạp thành công" trong khi server trả PENDING (thông báo thành công giả); client tự tính bulk discount 3%/7% nhưng server không có logic này → giá hiển thị ≠ giá trừ.

### Điểm tốt nên giữ

- Khung `paymentSystem/*` (state machine, routing, reservation, circuit breaker, retry/backoff, DLQ) viết chỉn chu.
- `OrderService.createInstantPurchase`: trình tự reserve inventory → trừ ví qua ledger → giao key → refund nếu lỗi là đúng và atomic trong 1 process — backend hoàn chỉnh nhất.
- Webhook HMAC `timingSafeEqual`, fail-closed khi thiếu secret ở production, idempotency persist file, server tự tính giá không tin `finalTotal`, credential AES-256-GCM.

---

## 2. ADMIN PANEL — ĐÚNG LÀ LỘN XỘN

**Quy mô:** 32 file `src/components/admin/*.tsx`, ~25.184 dòng; container `AdminPanelModal.tsx` 502 dòng với **~46 props/callback** prop-drilling từ App.tsx.

### 🔴 Critical

13. **4 router admin-level KHÔNG có bất kỳ auth nào** (grep `requireAuth|requireRole` = 0), mount công khai tại `server.ts:60-65`: `supplierHubRoutes` (tạo/xóa supplier, sync), `cronRoutes` (`/cron/trigger` chạy job tùy ý), `sourceConnectorRoutes`, `sourceAutomationRoutes` → **user ẩn danh gọi được endpoint quản trị**. `productRoutes` cũng gần như trần (POST/PUT/DELETE sản phẩm không cần auth) → ai cũng sửa được catalog. *(Đã verify)*
14. **Frontend zero RBAC**: 22 tab (kể cả Security IP, Roles, Database Schema, Payment System) lộ cho mọi ai mở được panel; gate duy nhất là check client-side `user.role === 'admin'` ở Navbar. Server có RBAC 8 role đúng chuẩn (`authMiddleware.ts:11-20`) nhưng client không dùng; `AdminRolesTab` chỉ là mock state cục bộ không nối backend.

### 🟠 Major — chồng chéo & code chết

15. **Tab trùng lặp chức năng:**
    - `suppliers` ≡ `source_automation`: cùng render **một component** `AdminSuppliersTab` (`AdminPanelModal.tsx:445-463`)
    - `security_ip` ≡ `audit_security`: cùng render `AdminSecurityIpTab`
    - **Orders x4 màn hình** từ 4 nguồn dữ liệu khác nhau: ManualOrders, EscrowPools, OrderReliability, + SoldOrders (mồ côi)
    - **Tiền x2**: BankingTopups vs PaymentSystem (2 hệ giao dịch song song)
    - **Suppliers x3 thế hệ backend**: supplierHub vs sourceConnector vs sourceAutomation — 3 router riêng cho cùng nghiệp vụ "kết nối nguồn hàng"
    - Hero Layout x2 (tab riêng + subTab trong Settings); CronMonitor embed 2 chỗ
16. **7/32 file component mồ côi** (~7.000 dòng không được container import): AdminSoldOrdersTab, AdminWithdrawalsTab, AdminAuditSecurityTab, AdminSourceConnectorTab, AdminSourceAutomationTab, AdminCyborgPipelineStation, AdminTicketsTab/LiveChatTab.
17. **25 tab id khai báo, sidebar render 22, dàn phẳng hoàn toàn** — không group nào; "Vouchers" cạnh "Tường lửa WAF" cạnh "Database SQL Schema".
18. **Data layer vô tổ chức**: chỉ 4/32 tab dùng `src/api/*`; **8 tab raw `fetch()` trần ~40 call sites không gắn header Authorization** → sẽ nhận 401 trên backend thật (route yêu cầu Bearer). `AdminContext` tồn tại nhưng container không dùng (2 cơ chế state song song), lại chứa mock data hardcode. GMV dashboard cộng số giả `+142.850.000` ngay trong container (`AdminPanelModal.tsx:205-208`).
19. **11 file >1.000 dòng** (lớn nhất 1.940); audit log chỉ RAM cap 2000 entries (`auditService.ts:32-36`); partner key Card24h hardcode (`adminRoutes.ts:125`).

### Đề xuất tái cấu trúc (đã nêu chi tiết ở §5)

---

## 3. PRODUCT INPUT → OUTPUT — ĐÚNG LÀ KHÔNG XUYÊN SUỐT

**6 nguồn sản phẩm song song, chỉ 2 là thật lúc runtime:**

| # | Nguồn | Trạng thái |
|---|---|---|
| 1 | Mock seed `INITIAL_PRODUCTS` (25 sp) → `db.products` | ✅ Thật — lõi catalog lúc boot |
| 2 | Supplier Hub sync (G2UP/dummyjson, cron 60s, persist JSON) | ✅ Thật — nguồn động chính (~968 sp synced) |
| 3 | Cyborg pipeline publish `prod_g2up_*` | ⚠️ Chạy được nhưng **không bán được** (Critical #20) + không persist |
| 4 | Manual admin (POST /products, bulk-stock) | ✅ Thật nhưng in-memory |
| 5 | Source Connector cũ (Map riêng `this.products`) | ❌ Đảo dữ liệu — không ghi vào `db.products`, restart mất |
| 6 | `scripts/generate-catalog-data.ts` + `catalog-base.json` | ❌ Chết — không ai import |

### 🔴 Critical — đứt gãy giao hàng

20. **Sản phẩm G2UP publish qua Cyborg KHÔNG BÁN ĐƯỢC**: `executeStep4Publish` ghi `db.products` với `source_info` nhưng **không tạo productMapping** bên SupplierManagerService. Khi khách mua: `orderService.ts:86` thấy `source_info` → coi là supplier product → bỏ kho nội bộ → `dispatchSupplierOrder` không tìm thấy mapping → `isSupplierProduct:false` → `deliveredKey` rỗng → khối F04 hoàn tiền + báo "hết hàng". **Sản phẩm hiển thị vĩnh viễn nhưng không thể giao** — tiền khách trừ rồi hoàn.
21. **Connector fallback TỰ BỊA KEY khi supplier không trả key**: `ApiSupplierConnector.createOrder` sinh `API-KEY-{id}-{random}` (`:345`), `API-AUTO-LICENSE-...` (`:366`), `getOrderStatus` luôn COMPLETED + key giả (`:374-380`). Khách trả tiền thật nhận key không tồn tại — **vi phạm chính nguyên tắc F04 mà code tuyên bố** ("CHẶN FALLBACK SINH HÀNG GIẢ", `orderService.ts:186`).
22. **4 hệ giao hàng song song, mỗi hệ một kiểu:**
    - **A. Instant-buy** — đường thật duy nhất: inventory keyCode (seed là key GIẢ `CYBER-PLATFORM-xxxx`, key thật chỉ từ admin bulk-add) hoặc supplier connector → `order.deliveredData` → WebDeliveryOutput/KeyVaultModal. Key nằm **plaintext in-memory**.
    - **B. Reliable Orders + KeyVault AES-256** — hệ mô phỏng self-contained: orders Map riêng, key tự sinh `CYBER-MUA-XXXXXX`, "delivery" là ghi record giả. **Không có luồng mua nào của khách đi qua đây** — cả tầng mã hóa là sân khấu demo.
    - **C. Escrow pool** — server fallback key giả `CYBER-...-AUTO-xxxx` (`escrowService.ts:112`); tệ hơn **client tự bịa key phía frontend** `CYBER-KEY-${random}` (`OrdersContext.tsx:221`).
    - **D. Source Automation** — `pendingOrders` hardcode, đối soát đếm `+5` bịa.
23. `G2upConnector.purchase()` (mua live thật từ G2UP, đã viết đầy đủ) **không có caller nào** — công tắc `liveBuyEnabled` điều khiển một đường dây không nối.

**Pipeline thật duy nhất:** supplier-hub sync → `db.products` → instant-buy → (inventory | connector) → `deliveredData` → UI. Ba chỗ đứt nặng: Cyborg không mapping, connector bịa key, tầng KeyVault tách rời.

---

## 4. BỐ TRÍ SẮP XẾP SẢN PHẨM — ĐÚNG LÀ CHƯA GẮN KẾT, THIẾU LOGIC

### 🔴 Critical

24. **4 taxonomy song song không khớp nhau:**
    - Type `ProductCategory`: 15 slug (`types.ts:1-16`)
    - Pills Marketplace (App.tsx:840-850): 10 slug hardcode
    - Pills HeroTelemetry: 7 slug **khác** (`gaming`, `streaming`, `giftup_cards`, `vpn`...)
    - `INITIAL_EXTENDED_CATEGORIES` "chuẩn admin" (systemExtendedData.ts): slug hoàn toàn khác (`gaming_keys`, `gift_cards`, `topup_services`...) — **thiết kế đúng (id/parentId/orderIndex/status) nhưng storefront không dùng ở đâu cả**
    - Hậu quả: pill `entertainment`/`vpn_security`/`education` **lọc ra 0 sản phẩm** (trang rỗng); `gaming` (Hero) vs `key_games` (Marketplace) cùng ý nhưng 2 slug; App.tsx phải viết logic OR chắp vá **trùng lặp 2 lần** (`:589-611`) vì mỗi sản phẩm mang 2 trường phân loại chồng chéo (`category` + `productType`). CartContext lại có mapping thứ 4, FanMenuModal taxonomy thứ 5.
25. **AdminCategoriesTab mất kết nối hoàn toàn (dead wiring)**: nhận props `onAddCategory/onUpdate/onDelete` nhưng **không bao giờ gọi** (grep = 0) — mọi sửa đổi chỉ vào state cục bộ rồi bốc hơi khi đóng modal. Kể cả nối lại thì storefront cũng không đọc `categories` để render pills → tab là trang trí. *(Đã verify)*
26. **Thứ tự & sự tồn tại của 8 section trang chủ hardcode trong JSX App.tsx** (`:639-931`); `SectionsHeaderConfig` chỉ sửa được chữ/font của đúng 4 section (`types.ts:901-906`) — không có trường bật/tắt, thứ tự, tiêu chí chọn sản phẩm. AdminHeroLayoutTab **không điều khiển được layout** như tên gọi.

### 🟠 Major

27. **3 card renderer cho cùng 1 entity**: ProductCard (Marketplace + ActivePools) vs FlashSalesSection tự vẽ card riêng 2 lần vs TopupSection dùng `GameItem` shape hoàn toàn khác (121 game tách rời catalog, bộ lọc riêng, chỉ lọc được 10 NXB do `.slice(0,10)`).
28. **4 cơ chế search/filter/sort độc lập**: Marketplace (5 sort), TopupSection (riêng), ActivePools (filter cục bộ + dead code `allActivePools`), HeroTelemetry (search/sort **code chết** — App không truyền handler nên cả khối bị ẩn; sort `savings/ending_soon` khai báo không nơi nào xử lý). Cùng nhãn `topup_games`: ở Hero bấm **mở modal**, ở Marketplace bấm **lọc grid** — 2 hành vi.
29. **`Product` type phình ~40 field, 6 trục phân loại** (`category/productType/deliveryType/deliveryBranch/fulfillmentType/subcategoryId`), field đôi (`reviews` vs `userReviews`), field ma (`flashSaleEnds` trong type vs `flashSaleEndsIn` Context ghi — không tồn tại trong type).
30. **Dịch phân mảnh**: 25 sản phẩm nhưng `ALL_PRODUCTS_DATA` phủ 11, `PRODUCT_TRANSLATIONS` phủ 7, chuỗi fallback 8 nhánh khó lường.
31. `selectedPlatform` filter chết (không UI nào set); countdown FlashSale là đồng hồ giả lặp vô hạn; `moduleCounts` fallback hardcode; LiveTelemetryStream 5 sự kiện giả dạng string không liên kết ID.

### Đề xuất mô hình thống nhất (tóm tắt)

**Nguyên tắc: 1 entity — 1 taxonomy — 1 nguồn — section = view config.**
- (a) Một `Product` type duy nhất: `categoryId` (FK duy nhất) + `kind: 'key'|'account'|'topup'|'giftcard'|'software'` (1 trục kỹ thuật thay 6); i18n gộp vào `title: I18nText`; `GameItem` → `Product` với `kind:'topup'` + `variants: TopupTier[]`.
- (b) Một nguồn category duy nhất — **dùng chính `INITIAL_EXTENDED_CATEGORIES` đang bị bỏ rơi** (đã có id/parentId/orderIndex/status); render pills từ `categories.filter(active).sort(orderIndex)`; migration map slug cũ → chuẩn (`gaming→key_games`, `giftup_cards→gift_cards`...); nối lại callback AdminCategoriesTab (~6 dòng).
- (c) Section = `HomeSectionConfig` lưu SystemConfig: `{key, enabled, order, query{kinds,categoryIds,flags}, sort, limit, renderer, header}` → App.tsx render `homeSections.sort(order).map(cfg => <CatalogSectionView/>)`; **một ProductCard cho mọi section**; 1 selector `filterProducts(query, sort, searchTerm)` dùng chung.

---

## 5. LỘ TRÌNH SỬA ĐỀ XUẤT (rủi ro thấp → cao)

### P0 — Bảo mật (làm ngay, ~1 ngày)
1. Thêm `requireAuth + requireRole('ADMIN')` vào `supplierHubRoutes`, `cronRoutes`, `sourceConnectorRoutes`, `sourceAutomationRoutes`; thêm auth cho POST/PUT/DELETE `productRoutes`; thêm `requireAuth` + owner-check cho `GET /payments/:id`, `POST /payments/:id/cancel`.
2. `POST /api/v1/payments`: thêm trừ ví user qua LedgerService + check số dư, hoặc restrict `requireRole('ADMIN')` cho tới khi có quy trình thật.
3. Secret: bỏ fallback hardcode, production **exit(1)** khi thiếu `JWT_SECRET`/`ENCRYPTION_KEY`; buộc đổi seed password; xóa partner key Card24h hardcode.
4. BEP20: verify địa chỉ nhận + số tiền như nhánh TRC20.

### P1 — Sửa các luồng đứt (~2-3 ngày)
5. VietQR memo: sửa `replace('user-','')` → `replace('usr-','')` ở DepositHubModal **và** lowercase cả 2 phía ở webhookRoutes; thêm endpoint admin resolve `pendingUnmappedDeposits`.
6. `CheckoutConfirmationModal`: đọc `response.data.order`; xóa bulk discount client-side hoặc thêm logic server tương ứng.
7. `TopupModal`: sửa key localStorage `cyberpool_auth_token`; `WalletModal`: hiển thị PENDING thay vì "thành công".
8. Chặn fallback key bịa: `ApiSupplierConnector` trả FAILED khi supplier không có key (đúng tinh thần F04); `escrowService` bỏ sinh key giả; `OrdersContext` bỏ bịa key client-side.
9. Cyborg `executeStep4Publish`: tạo productMapping kèm theo khi publish.
10. Test hang: unref các `setInterval` worker hoặc export hàm start/stop để test không tự khởi động worker → `npm test` chạy được trong CI.

### P2 — Tái cấu trúc Admin (~1 tuần)
11. Gom 22 tab phẳng → 5 nhóm: Tổng quan · Kinh doanh · Tài chính · Nguồn hàng · Hệ thống & Bảo mật.
12. Merge: Orders x4 → 1 module sub-tab theo trạng thái; Banking+PaymentSystem; xóa tab id `source_automation`/`audit_security` trùng component; gộp HeroLayout vào Settings.
13. Quyết số phận 7 file mồ côi (~7.000 dòng): mount (Withdrawals, SoldOrders) hoặc xóa.
14. Mọi tab gọi qua `src/api/*` (ApiClient có sẵn Bearer) — sửa luôn bug 401; container nhận data qua AdminContext thay vì 46 props; thêm permission map `tab → minimumRole` phía client.
15. Chọn 1 hệ supplier duy nhất (Supplier Hub — hệ đang thật) và khai tử sourceConnector cũ + sourceAutomation mock.

### P3 — Thống nhất catalog (~1-2 tuần)
16. Migration taxonomy về 1 `categoryId` + `kind`; nối AdminCategoriesTab; render pills từ categories.
17. Section → `HomeSectionConfig`; 1 ProductCard; 1 filter selector; gộp GameItem vào Product variants.
18. Thu gọn `Product` type (bỏ 6 trục phân loại, field đôi, field ma).

### P4 — Nền tảng production (điều kiện tiên quyết để go-live)
19. **Persistence thật**: nối PostgreSQL (schema.sql đã có sẵn 64 bảng) — thay Map in-memory bằng repository; hoặc tối thiểu persist JSON toàn bộ như supplier_hub đang làm.
20. Ledger kép thật: tài khoản đối ứng platform/seller/escrow-holding; nối `SELLER_PAYOUT`.
21. Auto-refund: cron xử lý pool hết hạn, timeout cho MANUAL_REVIEW/WAITING_FOR_BALANCE, quy trình duyệt withdrawal (mount AdminWithdrawalsTab + endpoint giải ngân).
22. Nối fraudService vào các route tiền (hoặc xóa cả 2 hệ fraud chết); đối soát thật với sao kê provider.

---

*Chi tiết đầy đủ từng luồng (bảng bằng chứng file:line, sơ đồ pipeline dạng text, đề xuất code mẫu) đã được verify và tổng hợp trong báo cáo này. Các claim Critical (#1,2,3,4,13,25) đã được kiểm tra trực tiếp trên mã nguồn lần hai, độc lập với phân tích ban đầu.*
