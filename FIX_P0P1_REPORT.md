# CYBERPOOL FIX PHASE P0+P1 — BÁO CÁO SỬA LỖI

> Repo: `E:\project\OK-OK` (OK-OK / CYBERPOOL) · Ngày: 12/09/2026
> Nền: báo cáo review `REVIEW_REPORT.md` — nhóm P0 (bảo mật Critical) và P1 (luồng đứt gãy + hạ tầng test).
> Quy tắc: mỗi fix ghi file:line, mục tiêu bảo toàn hành vi hợp lệ, không sửa test cũ để pass.

---

## KẾT QUẢ VERIFY (chạy thật sau khi sửa)

| Kiểm tra | Trước | Sau |
|---|---|---|
| `npx tsc --noEmit` (npm run lint) | PASS sạch | ✅ PASS sạch |
| Unit tests (auth, encryption, escrow, ledger, webhook) | 15/15 pass | ✅ 17/17 pass |
| Integration + concurrency (checkout, race-condition) | Test pass **nhưng process treo vô hạn** (exit 143 sau timeout) | ✅ Pass + **process thoát sạch** (~0.7s) |

Kết luận: toàn bộ P0 + P1 đã sửa xong, compile sạch, không lỗi test, `npm test` giờ chạy được trong CI.

---

## P0 — BẢO MẬT (9 điểm)

### P0-1. 4 router admin không auth → chặn ADMIN-only
**Lỗ hổng:** `supplierHubRoutes`, `cronRoutes`, `sourceConnectorRoutes`, `sourceAutomationRoutes` được mount công khai (`server.ts:60-65`) với **0** `requireAuth` — user ẩn danh tạo/xóa supplier, trigger cron, sửa nguồn hàng được.

**Fix (server-side, router-level):**
- `server/routes/api/v1/supplierHubRoutes.ts:16` — `supplierHubRouter.use(requireAuth, requireRole('ADMIN'))`
- `server/routes/api/v1/cronRoutes.ts:11` — `cronRouter.use(requireAuth, requireRole('ADMIN'))`
- `server/routes/api/v1/sourceConnectorRoutes.ts:14` — `sourceConnectorRouter.use(requireAuth, requireRole('ADMIN'))`
- `server/routes/api/v1/sourceAutomationRoutes.ts:10` — `sourceAutomationRouter.use(requireAuth, requireRole('ADMIN'))`

**Fix đi kèm (frontend):** 6 file admin tab gọi các router này bằng raw `fetch()` không kèm token → sẽ 401.
- Tạo `src/api/authFetch.ts` — wrapper tự chèn `Authorization: Bearer <token>` từ `localStorage['cyberpool_auth_token']`.
- Thay toàn bộ 77 call site `fetch(` → `authFetch(` + import trong: `AdminSuppliersTab` (11), `AdminCronMonitor` (3), `AdminSourceConnectorTab` (16), `AdminSourceAutomationTab` (1), `AdminPaymentSystemTab` (26), `AdminOrderReliabilityTab` (20).

### P0-2. productRoutes mutation không auth → ADMIN-only
**Fix:** `POST /`, `PUT /:id`, `DELETE /:id`, `POST /auto-translate`, `POST /:id/translate` → thêm `requireAuth, requireRole('ADMIN')` (`server/routes/api/v1/productRoutes.ts:12,108,154,203,258`). GET giữ public.

### P0-3. paymentRoutes — IDOR + chi tiền trái phép
- `GET /:id` + `POST /:id/cancel` **không auth, không check owner** → thêm `requireAuth` + check `tx.user_id === user.id || role ADMIN/MODERATOR/FINANCE/SUPER_ADMIN` (`paymentRoutes.ts:171,203`).
- `POST /` cho phép user bất kỳ ra lệnh **chi tiền quỹ sàn** (recipient tùy ý, không trừ ví) → thêm `requireRole('ADMIN')` (`paymentRoutes.ts:25`) — endpoint vốn chỉ admin UI dùng.

### P0-4. Secret fallback hardcode → fail-closed production
- `server/utils/authSecurity.ts:5`: `JWT_SECRET` mặc định bịa → **production: `process.exit(1)` nếu thiếu env**; dev: random per-boot (session mất khi restart — chấp nhận cho dev, không lộ secret thật).
- `server/services/paymentSystem/security.ts:8`: `ENCRYPTION_KEY` tương tự (random per-boot dev, exit(1) production).

### P0-5. Seed admin password mặc định
- `server/db/store.ts:49`: production → seed SUPER_ADMIN bằng **password ngẫu nhiên log 1 lần** cho operator; dev giữ `Admin@CyberPool2026!`. Loại bỏ credential mặc định công khai khỏi production.

### P0-6. VietQR auto-credit đứt vì case + sai prefix
- `src/components/DepositHubModal.tsx:83`: memo cũ `CYBER ${id.replace('user-','').toUpperCase()}` — prefix thật là `usr-` nên replace không khớp, memo thành `CYBER USR-BUYER-01` (IN HOA). Sửa: `transferCode = 'CYBER ' + user.id` (giữ nguyên lowercase).
- `server/routes/api/v1/webhookRoutes.ts:48-53`: lookup `db.users.has(match[1])` case-sensitive → thêm `.toLowerCase()` ở cả regex match lẫn tra cứu. Ngân hàng viết hoa nội dung cũng khớp.

### P0-7. 3 bug frontend thanh toán
- `src/components/CheckoutConfirmationModal.tsx:111-130`: đọc `response.order` trong khi `api.request` bọc response trong `response.data` → **luôn throw lỗi dù server đã trừ tiền + giao key**. Sửa: đọc `response.data.order` / `response.data.deliveredKey`.
- `src/components/TopupModal.tsx:120`: lấy token sai key `cyber_auth_token` (thật: `cyberpool_auth_token`) → luôn 401. Sửa ưu tiên key đúng, fallback key cũ.
- `src/components/WalletModal.tsx:74-88`: `handleConfirmDeposit` báo "NẠP TIỀN THÀNH CÔNG" trong khi server chỉ tạo intent PENDING (F01 — tiền cộng khi webhook đối soát) → **thông báo thành công giả**. Sửa: await thật `onDeposit`, báo "Yêu cầu đã ghi nhận — chờ đối soát (PENDING)" / lỗi khi fail.

### P0-8. BEP20 không verify địa chỉ nhận + số tiền
- `server/services/gatewayVerificationService.ts:338-386`: cũ chỉ check `gettxreceiptstatus` (giao dịch SUCCESS bất kỳ là được credit). Sửa: gọi `tokentx` của BSCScan, verify **contract USDT-BSC + `to` == ví shop + số tiền > 0**, rồi mới check receipt status. (Ngang mức chặt với nhánh TRC20.)

### P0-9. Credential Card24h hardcode
- `src/contexts/AdminContext.tsx:83-84`: partner key thật `bc329982...` xóa khỏi bundle client → chuỗi rỗng, admin nhập.
- `server/routes/api/v1/adminRoutes.ts:124-125`: fallback hardcode → chỉ đọc từ body/systemConfig/`CARD24H_PARTNER_ID`/`CARD24H_PARTNER_KEY` env.

---

## P1 — LUỒNG ĐỨT GÃY + HẠ TẦNG (8 điểm)

### P1-1. Chặn sinh key giả (F04 — chống hàng giả)
- `server/services/supplierHub/connectors/ApiSupplierConnector.ts:345` — supplier không trả key → trả `FAILED / SUPPLIER_NO_KEY` (không bịa `API-KEY-xxxx`).
- `:366` — không có endpoint createOrder → `FAILED / SUPPLIER_ENDPOINT_MISSING` (không bịa `API-AUTO-LICENSE`).
- `:379` — `getOrderStatus` không bịa key, trả `PENDING`.
- `server/services/escrowService.ts:112` — pool COMPLETED mà inventory hết key → tạo order `PENDING_STOCK` (khóa tiền, admin nhập kho/refund) thay vì key bịa `CYBER-...-AUTO`; bỏ `txHash` random giả.
- `src/contexts/OrdersContext.tsx:221` — bỏ tự bịa `CYBER-KEY-${random}` phía client.
- Thêm `'PENDING_STOCK'` vào `OrderStatus` (`server/types.ts`) và `'SUPPLIER_NO_KEY' | 'SUPPLIER_ENDPOINT_MISSING'` vào `SupplierErrorCode` (`server/services/supplierHub/types.ts`).

### P1-2. Sản phẩm Cyborg publish không bán được (đứt mapping)
- `server/services/supplierHub/services/SupplierManagerService.ts:849+` — thêm `upsertProductMappingForLocalProduct()` (tạo/update mapping + persist, có chỉnh giá, không đè manualPriceOverride).
- `server/services/sourceConnector/cyborgPipelineService.ts:558+` — sau khi publish vào `db.products`, gọi upsert mapping với supplier `sup_g2up_net_api`, supplierProductId từ scan, deliveryBranch `KEY`. Hết cảnh "khách mua → auto-refund hết hàng".

### P1-3. Escrow joinPool race oversell slot
- `server/services/escrowService.ts`: thêm mutex `inFlightPools: Set<string>` — claim trước khi await ledger, release trong `finally`. Hai request song song cùng pool: request 2 nhận "pool đang xử lý, thử lại". Tách logic cũ sang `joinPoolLocked`.

### P1-4. Idempotency instant-buy
- `server/types.ts` `ServerOrder.idempotencyKey?`, `orderService.ts` lưu khi tạo order, `orderRoutes.ts:58` check replay: cùng `buyerId + idempotencyKey` → trả order cũ, không trừ ví lần 2.

### P1-5. Hàng đợi unmapped deposits không có đường xử lý
- `server/routes/api/v1/webhookRoutes.ts:558+` — thêm `POST /webhooks/unmapped-deposits/:id/resolve` (ADMIN): resolve theo userId (hoặc REJECT), credit qua LedgerService, chống trùng bằng `IdempotencyService` (isProcessed + acquireLock + commit), cập nhật `processedWebhooks`.

### P1-6. Deposit intent không được lưu
- `server/routes/api/v1/walletRoutes.ts:33+` — lưu `depositIntent` vào `db.depositIntents` (Map mới trong `store.ts`) thay vì tạo xong vứt đi — webhook và admin có dữ liệu đối soát kỳ vọng.

### P1-7. Bulk discount client ≠ server (khách trả cao hơn hiển thị)
- `server/services/orderService.ts:55-66` — server áp **cùng quy tắc** UI: `qty>=5 → -7%`, `qty>=2 → -3%` trước voucher. Hết cảnh hiển thị giảm giá nhưng trừ đủ tiền.

### P1-8. `npm test` treo vô hạn (CI sẽ treo)
**Nguyên nhân:** import `OrderService`/services kéo theo các worker khởi động `setInterval` ở module-level, giữ event loop → test runner không bao giờ thoát.

**Fix:** thêm `.unref()` cho mọi background interval (vẫn chạy bình thường khi server Express giữ event loop):
- `paymentSystem/workers.ts:396,421,430` (balance check, reservation GC, reconciliation)
- `cronService.ts:88` · `distributedLock.ts:19` · `notificationQueueService.ts:14` · `reconciliationWorker.ts:48`

---

## HẠN CHẾ / PHẦN CHƯA LÀM (đúng phạm vi P0+P1)

Nhóm P2-P4 giữ nguyên theo `REVIEW_REPORT.md` (cần phase riêng, rủi ro cao hơn):
- **P2 Admin tái cấu trúc:** gom 22 tab phẳng → 5 nhóm, merge Orders x4 / Banking+Payments, xóa 7 file mồ côi (~7.000 dòng), RBAC client-side, tách file >1.000 dòng.
- **P3 Catalog thống nhất:** 1 Product type, 1 taxonomy (`categoryId` + `kind`), section = `HomeSectionConfig`, gộp GameItem + FlashSales card renderer, nối lại AdminCategoriesTab wiring.
- **P4 Persistence + ledger kép thật:** PostgreSQL (schema.sql có sẵn) thay Map in-memory; tài khoản đối ứng double-entry + `SELLER_PAYOUT`; cron auto-refund (pool hết hạn, MANUAL_REVIEW timeout, quy trình duyệt withdrawal); nối fraudService (Node + FastAPI — hiện chết); đối soát thật theo sao kê.
- **Chưa xử lý trong phase này (đã ghi nhận):** `acquireInventoryLock` timeout vẫn đi tiếp (Minor, `store.ts:211-219`); escrow forceRefund chỉ áp dụng FILLING; `KeyVaultService` tách rời đơn thật (thiết kế lại mới giải quyết — thuộc P4).

## FILE CHẠM TỚI (35)

```
server/db/store.ts                server/routes/api/v1/webhookRoutes.ts
server/types.ts                   server/services/cronService.ts
server/routes/api/v1/orderRoutes.ts
server/routes/api/v1/paymentRoutes.ts    server/services/orderService.ts
server/routes/api/v1/productRoutes.ts    server/services/escrowService.ts
server/routes/api/v1/walletRoutes.ts     server/services/gatewayVerificationService.ts
server/routes/api/v1/supplierHubRoutes.ts
server/routes/api/v1/sourceConnectorRoutes.ts
server/routes/api/v1/sourceAutomationRoutes.ts
server/routes/api/v1/cronRoutes.ts       server/utils/authSecurity.ts
src/api/authFetch.ts (mới)               server/services/paymentSystem/security.ts
src/components/CheckoutConfirmationModal.tsx  server/services/paymentSystem/workers.ts
src/components/DepositHubModal.tsx        server/services/orderProcessing/distributedLock.ts
src/components/TopupModal.tsx             server/services/orderProcessing/notificationQueueService.ts
src/components/WalletModal.tsx            server/services/orderProcessing/reconciliationWorker.ts
src/contexts/OrdersContext.tsx            server/services/supplierHub/connectors/ApiSupplierConnector.ts
src/contexts/AdminContext.tsx             server/services/supplierHub/types.ts
server/services/supplierHub/services/SupplierManagerService.ts
server/services/sourceConnector/cyborgPipelineService.ts
server/routes/api/v1/adminRoutes.ts
+ 6 file admin tab (authFetch refactor)
```

## CÁCH CHẠY LẠI VERIFY

```bash
cd E:\project\OK-OK
npm run lint          # tsc --noEmit — PASS
npm test              # 17/17 pass, thoát sạch (không hang)
```