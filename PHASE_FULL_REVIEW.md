# PHASE: REVIEW + VERIFY TOÀN BỘ DỰ ÁN (Fix all findings)

Ngày: 2026-09-13
Remote: `https://github.com/mrtrungnv1991-droid/OK-OK` @ `a609de9`
Phương pháp: 3 subagent audit song song (backend security, frontend contracts, runtime integrity) → parent tự fix + tự verify runtime từng finding. Không sửa test cũ chỉ để pass.

---

## 1. Tổng quan

| Hạng mục | Kết quả |
|---|---|
| `npx tsc --noEmit` | PASS (0 lỗi) |
| Test suite `tests/{unit,integration,concurrency}` | 17/17 PASS |
| Production build `vite build` | PASS (4.47s) |
| Commit trong phase này | 22 (từ baseline `8984d87` → `eed90fd`) |
| Backend findings | 26/26 xử lý (5 CRITICAL, 10 MAJOR, 11 MINOR) |
| Frontend findings | 19/19 xử lý (8 CRITICAL, 7 MAJOR, 4 MINOR) |

Mọi fix tiền tệ (escrow, withdrawal, voucher, lucky wheel, card24h, momo) đều được **verify runtime bằng server thật** (boot PORT=3100, login admin/user, gọi API, đối chiếu số dư), không chỉ static review.

---

## 2. Các lỗi tiền tệ nghiêm trọng nhất đã sửa (verify runtime)

### 2.1 Escrow pool join không trừ tiền (`997ed79`)
- **Bug**: `ESCROW_LOCK` là case chết trong ledger, không nơi nào gọi → user join pool **miễn phí**, nhận key thật khi đủ nhóm; admin `forceRefundPool` hoàn tiền chưa từng thu → **mint tiền từ không khí**.
- **Fix**: `joinPoolLocked` khóa tiền thật qua `LedgerService` (ESCROW_LOCK, fail = reject join); `ESCROW_REFUND` chuyển thành double-entry đúng (balance+ và escrowLocked−).
- **Verify**: join khóa 720k (LOCK_OK), force-refund khôi phục đúng (REFUND_OK), thiếu số dư → 400 không trừ đồng nào (NO_CHARGE_ON_FAIL_OK), pool đủ người → LOCK+RELEASE net 0, balance trừ đúng (CHARGED_OK).

### 2.2 Withdrawal không có lifecycle (`3bbe01f`)
- **Bug**: `/wallet/withdraw` trừ ví ngay rồi báo "chờ duyệt" nhưng **không lưu request**, không có approve/reject, reject **không hoàn tiền** → user mất tiền vĩnh viễn.
- **Fix**: `db.withdrawals` + endpoint user/admin + approve/reject (reject = REFUND thật qua ledger); mount `AdminWithdrawalsTabContainer` vào panel.
- **Verify**: withdraw −100k → reject hoàn đúng → approve trừ đúng → double-approve 400 → unauth 401 → validation 400.

### 2.3 MoMo double-credit (`cf035f7`)
- **Bug**: IPN khóa theo `orderId`, verify thủ công khóa theo `transId` → cùng 1 giao dịch đi 2 đường = **credit 2 lần**.
- **Fix**: chuẩn hóa canonical `transId` cross-check cả 2 đường.

### 2.4 Card24h replay + double-credit (`5237ae7`)
- **Bug**: chữ ký `md5(partnerKey+code+serial)` không phủ `request_id`; idempotency chỉ theo `request_id` → resend với request_id mới = credit lại cùng thẻ. Sync path credit không commit record → async callback credit lần 2.
- **Fix**: idempotency theo danh tính thẻ (`code+serial`) + `trans_id`; sync path commit record.

### 2.5 Voucher contract gãy end-to-end (`63bb5f3`)
- **Bug**: client hardcode mã/% không khớp server (CYBER2026 client 10% vs server 15%, ESCROW50/VIP10/SUPER5 không tồn tại, **mã bất kỳ = 5% miễn phí**); server đọc `v.active/v.type/v.discount` nhưng seed dùng `status/discountType/discountValue` → **không voucher nào từng được áp**; coupon giỏ hàng rớt mất ở checkout; bulk discount tính trên tổng món thay vì quantity từng dòng.
- **Fix**: endpoint `POST /orders/vouchers/validate` (auth) validate theo db.vouchers thật; `src/utils/pricing.ts` (priceSingleItem/computeCartTotals) nhân bản đúng công thức server, dùng chung Cart/InstantBuy/Checkout; voucher lưu trong CartContext chảy vào checkout; `usedCount` tăng sau khi trừ tiền (usageLimit có hiệu lực).
- **Verify**: unauth 401; CYBER2026 @1M → 50000 (15% cap 50k); @200k → 30000; @50k dưới min → 400; 'FREESHIP' bịa → 404; instant-buy retail 520000 → thu 470000.

### 2.6 Lucky Wheel 100% bịa (`51f6795`)
- **Bug**: prize chọn bằng `Math.random` client, phí quay không bao giờ bị trừ, `deliveredCode` hardcode giả trong bundle công khai, fake winners, banner "100% WIN".
- **Fix**: `POST /wallet/wheel/spin` server-authoritative — trừ 20k qua ledger (type WHEEL_SPIN mới), chọn prize bằng `crypto.randomInt` trên bảng server (`systemConfig.wheelPrizes` hoặc default trung thực: cash/voucher/bad_luck), key prize chỉ giao từ **inventory thật** (thiếu = refund lượt quay), ghi `db.wheelSpins`.
- **Verify**: spin 8 lần trừ đúng 160k, prize credit thật, ledger có 8 WHEEL_SPIN, recent winners là record thật.

### 2.7 Topup group mode thu sai giá (`51f6795`)
- **Bug**: UI hiển thị `groupPrice` nhưng server luôn thu `retailPrice` → **thu nhiều hơn số hiển thị**.
- **Fix**: gửi `mode` lên server, server chọn giá. **Verify**: instant_direct thu 125000, group_topup thu 89000 (đúng giá hiển thị).

---

## 3. Bảo mật (backend audit)

| # | Finding | Fix | Commit |
|---|---|---|---|
| 1 | Escrow join không trừ tiền | ESCROW_LOCK thật + double-entry refund | `997ed79` |
| 2 | Toàn bộ game router không auth (bulk-adjust reprice cả catalog) | `gameRouter.use(requireAuth, requireRole('ADMIN'))` cho mutation; GET public giữ nguyên | `5237ae7` |
| 3 | Key bản quyền đã bán lộ ra public (`/escrow/pools`, `/products/:id`) | sanitize: strip `deliveredKey`/`keysVault`/PII khỏi response public | `5237ae7` |
| 4 | Telegram callback không auth → trigger order actions | HMAC secret verify | `5237ae7` |
| 5 | Card24h replay/double-credit | idempotency theo danh tính thẻ | `5237ae7` |
| 6 | Prod seed ship tài khoản cá nhân + mật khẩu hardcode | skip demo users khi NODE_ENV=production | `46518fa` |
| 7 | Welcome gift 200k không giới hạn + không rate limit | gift=0 ở prod; rate limit login (10/15p) + register (5/h) | `eb8b56a` |
| 8 | `/admin/users` trả `passwordHash` | strip trước khi respond | `7e5d17f` |
| 9 | MoMo double-credit | canonical transId | `cf035f7` |
| 10 | Provider webhook fail-open ngoài production | fail-closed mọi env | `61ec3ca` |
| 11 | Encryption key fallback hardcode (encryptionUtils + keyVault) | fail-closed exit(1) ở prod | `9ca3fcb`, `46518fa` |
| 12 | Affiliate/notification router không auth + IDOR (client userId) | requireAuth + chỉ dùng req.user.id; claim chuyển tiền thật qua Ledger | `46518fa` |
| 13 | `/wallet/admin/adjust` không validate (NaN làm hỏng ví) | Number.isFinite + check user tồn tại | `46518fa` |
| 14 | Reliable-order create tin giá client + không trừ tiền | ADMIN-only + tra giá server-side từ catalog | `5237ae7` |
| 15 | `acquireUserLock`/`acquireInventoryLock` là no-op | FIFO promise-queue mutex thật | `80fe1d6` |
| 16 | Withdrawal không có payout record/refund path | (gộp vào #2 lifecycle withdrawal) | `3bbe01f` |
| 17 | Idempotency instant-buy scan-then-create có await giữa → race | in-flight key lock (IdempotencyService.acquireLock) | `46518fa` |
| 18 | Voucher không mark used, không per-user limit, discount không range-check | usage tracking + clamp + minOrder | `63bb5f3` |
| 19 | Rating không bound (nhận 999/−5) | clamp 1–5 + reject NaN | `61ec3ca` |
| 20 | Webhook secret hardcode cho NODE_ENV=test | bỏ secret tĩnh, test dùng env riêng | `61ec3ca` |
| 21 | TRC20 không enforce confirmations; MoMo nhận resultCode 9000 | min confirmations (default 19) + chỉ nhận resultCode 0 | `7e5d17f` |
| 22 | `/cron.php` redirect vào ping ADMIN-gated → external cron 401 | trả 200 ack | `61ec3ca` |
| 23 | forgot-password no-op luôn báo thành công | trả thông báo trung thực (chưa có reset flow) | `61ec3ca` |
| 24 | `/admin/users/:id/role` ghi role không validate | whitelist theo ROLE_HIERARCHY | `46518fa` |
| 25 | system-config merge `{...req.body}` không giới hạn + echo plaintext secrets | field whitelist + mask secrets | `80fe1d6` |
| 26 | reliable-order ownership check pass khi order undefined | `!isAdmin && (!order || ...)` → 404 | `7e5d17f` |

**Verified OK (không cần sửa)**: JWT middleware (Bearer-only, re-fetch user, không tin x-user-id); authSecurity/paymentSystem security (scrypt + timingSafeEqual, AES-256-GCM, fail-closed); VietQR webhook (HMAC mọi env, idempotency transactionId-only persist disk); instant-buy pricing server-side; payment worker reservation/settle/release accounting.

---

## 4. Frontend audit

| # | Finding | Fix | Commit |
|---|---|---|---|
| 1 | Hardcoded admin creds auto-login mọi visitor thành admin | gate `import.meta.env.DEV`; production bundle = 0 occurrences (verified) | `3180d2f` |
| 2 | `refreshUserProfile` override balance server bằng giá trị client cũ + INITIAL_BOOT_USER 50M | dùng `mapped.walletBalance`/`escrowLocked` từ server | `3180d2f` |
| 3 | `handleConfirmJoinPool` 100% client-side (fake txHash, bịa key) | gọi `joinPoolServer` (API thật) + `fetchCatalog()` | `3180d2f` |
| 4 | WalletModal mount không có `onRequestWithdrawal` → toast thành công giả | wire + gate toast theo kết quả server | `51f6795` |
| 5 | Lucky Wheel fake (xem 2.6) | server-authoritative | `51f6795` |
| 6 | Deposit targets fallback placeholder (bank/MoMo/USDT) → tiền thật vào địa chỉ chết | fail-closed blank + guard "Chưa Được Cấu Hình" | `51f6795` |
| 7 | Topup group mode hiển thị groupPrice, thu retailPrice (xem 2.7) | gửi mode, server chọn giá | `51f6795` |
| 8 | Voucher contract gãy (xem 2.5) | server validate + shared pricing | `63bb5f3` |
| 9 | TopupModal raw fetch + fallback token giả `'token_cyber_user'` | `ordersApi.topupGame` | `3180d2f` |
| 10 | InstantBuyModal `deliveredKey: ... || 'DELIVERED'` bịa key | status 'fulfilled' chỉ khi server COMPLETED + key thật | `3180d2f` |
| 11 | Không gửi idempotencyKey → double-charge; checkout throw giữa loop sau khi đã trừ tiền | stable key per item + per-item failure tracking + partial-success report | `51f6795` |
| 12 | Fallback txId bịa `TX-TOPUP-<ts>` + fake 400ms "verification" | server txHash/id only; relabel format-check | `51f6795` |
| 13 | WalletContext fake ledger fallback (1M deposit, invoice 0388999999) render như dữ liệu thật | `import.meta.env.PROD` → empty | `51f6795` |
| 14 | Fake reseller API key `cp_live_sec_...` copy được | thông báo trung thực "chưa triển khai" | `51f6795` |
| 15 | `vietQrApiToken: 'CYBER_API_TOKEN'` placeholder secret trong default config | empty default | `51f6795` |
| 16 | 3 tab admin mồ côi (SourceConnector/SourceAutomation/AuditSecurity) không mount được | mount vào panel + RBAC level 3; verify 7 endpoints = 200 | `a609de9` |
| 17 | `forceEscrowAction` fake (bịa 'CYBER-FORCE-RELEASE-KEY', không gọi server) + `apiClient.ts` duplicate 0 importer | nút Force Refund thật (POST /escrow/admin/refund); xóa fake + dead file | `48e1c81` |
| 18 | FlashSale "SĂN NGAY" là `<span>` chết, `onInstantBuy` không bao giờ gọi | button thật + stopPropagation + onInstantBuy | `48e1c81` |
| 19 | AdminSettingsTab hardcode Telegram chat ID '-1008892182019' | blank + placeholder | `48e1c81` |

---

## 5. Vận hành / hạ tầng

- `4a23973`: ngừng track `server/data/supplier_hub/` (runtime state cron ghi 60s/lần; từng gây churn 2591 dòng/commit + lộ credential blob mã hóa bằng dev key). App tự seed lại khi thiếu file (`seedDefaultSuppliers` khi `suppliers.size === 0`).
- `server.ts`: PORT đọc từ env (test song song không giẫm chân).
- `80fe1d6`: system-config PUT whitelist field + mask secrets (GET/PUT/audit-log đều mask).
- `eb8b56a`: rate limiter in-process (sliding window, không dep mới, auto-cleanup bucket). **Lưu ý scale**: 1 instance; nhiều instance → chuyển Redis.

---

## 6. Giới hạn còn lại (trung thực, chưa sửa)

1. ~~**Systemic — in-memory store**~~ → **ĐÃ SỬA** (`468347b`): snapshot persistence
   `server/data/db_snapshot.json` (atomic write, 10s + flush shutdown, load-on-boot,
   skip khi test). Verify runtime: adjust +1000 → restart → balance khôi phục đúng.
   Lưu ý: đây vẫn là JSON snapshot 1 instance — production đa instance cần
   PostgreSQL/Redis (roadmap P4).
2. **Rate limit 1 instance**: xem mục 5.
3. **g2up/cmsnt API key dùng chung** hardcode trong connector (`885e5...`) — là key nền tảng công khai có chủ đích (không phải secret thanh toán), xóa sẽ phá connector out-of-box. **Flag, không tự xóa.**
4. **Forgot-password** vẫn chưa có reset flow thật (chỉ trả thông báo trung thực thay vì báo thành công giả).
5. **Chưa test giao dịch tiền thật** với Binance/MoMo/Card24h/USDT/LTC (không có credential thật) — chỉ verify được fail-closed, chữ ký, cấu trúc request, logic nội bộ (đúng như đã thống nhất từ trước).
6. **Reliable-orders `escrow_locked=true` không đi qua ledger** — sau khi xem kỹ:
   đây là **pipeline mô phỏng vận hành** (tham số `simulateTimeout`,
   `simulateInsufficientBalance`; chỉ ADMIN gọi được sau fix #14, không UI khách
   nào dùng). Nối vào ledger thật sẽ sai nghiệp vụ (admin không "mua hàng" —
   họ đang test pipeline giao hàng nguồn). Giữ nguyên cờ mô phỏng, đã ADMIN-gated
   + giá tra server-side. Nếu sau này reliable-orders thành checkout khách thật
   thì BẮT BUỘC nối ledger như escrowService đã làm.

## 6b. Các fix bổ sung sau audit (cùng phase)

| Fix | Commit | Verify |
|---|---|---|
| DB snapshot persistence (systemic #1) | `468347b` | restart giữ balance 2.451.000đ ✅ |
| AuthGate — màn hình đăng nhập/đăng ký thật (regression guard sau khi bỏ auto-login) | `468347b` | tsc + build ✅ |
| GUEST_USER thay boot user SuperAdmin/50M; isAuthenticated theo token thật; dead token → xóa + về guest | `468347b` | tsc ✅ |
| Security headers + CORS whitelist (không dep mới) | `eed90fd` | headers có đủ; evil.com blocked; preflight 403 ✅ |

---

## 7. Bằng chứng verify (chọn lọc)

```
# Escrow money flow (verify_escrow*.py)
LOCK_OK: balance −720000, escrow +720000 (join chưa hoàn tất)
REFUND_OK: force-refund khôi phục balance+escrow chính xác
NO_CHARGE_ON_FAIL_OK: thiếu số dư → 400, không trừ đồng nào
CHARGED_OK: pool đủ người → balance trừ đúng, escrow net 0

# Withdrawal lifecycle (verify_withdraw.py)
withdraw −100k → reject hoàn đúng → approve trừ đúng
double-approve 400 → unauth 401 → validation 400

# Voucher (verify_voucher.py)
CAP_50K_OK=True DISCOUNT_15PCT_OK=True MIN_ORDER_OK=True
BOGUS_REJECTED=True SERVER_CHARGES_DISCOUNTED=True

# Lucky Wheel (verify_wheel.py)
8 spins trừ đúng 160k, 8 ledger WHEEL_SPIN, prize credit thật

# Rate limit (curl loop)
login: attempt 1-10 → 401, attempt 11-12 → 429
register: attempt 1-5 → 201, attempt 6-7 → 429

# Source connector endpoints (tab mồ côi vừa mount)
6/6 GET → 200; POST /source-automation/test-telegram → 200

# tsc + tests + build
TSC_EXIT_0 · # tests 17 # pass 17 # fail 0 · vite build ✓ 4.47s
# Production bundle: grep 'Admin@CyberPool2026' dist/ → 0 occurrences
```

---

## 8. Commit list (phase này)

```
eed90fd feat(security): hardening middleware — security headers + CORS whitelist
468347b fix(core): DB snapshot persistence + real login gate (AuthGate)
6e9f0aa docs: PHASE_FULL_REVIEW.md
a609de9 feat(admin): mount 3 orphan tabs into panel (frontend audit #16)
eb8b56a feat(security): in-process rate limiting for login/register (backend audit #7)
48e1c81 fix(ui): real force-refund button, live flash-sale hunt button, drop fake escrow client code
63bb5f3 fix(pricing): end-to-end voucher contract — server validate endpoint, shared pricing math
51f6795 fix(frontend): server-authoritative Lucky Wheel, wire withdrawal UI, kill placeholder deposit targets
80fe1d6 fix(concurrency+config): real FIFO mutex for ledger locks + system-config whitelist/secret masking
46518fa fix(security): prod seed hygiene, keyVault fail-closed, affiliate/notification IDOR, adjust validation
5237ae7 fix(security): game catalog auth, key-material leak, Telegram callback HMAC, Card24h replay
3180d2f fix(frontend): kill fake admin auto-login, client-side pool join, fabricated keys
61ec3ca fix(security): webhook fail-closed, rating clamp, no static test secrets, cron ack
7e5d17f fix(security): strip passwordHash from /admin/users + MoMo strict resultCode + USDT confirmations
cf035f7 fix(momo): close double-credit hole between IPN and manual verify
997ed79 fix(escrow): CRITICAL — pool join now actually locks user funds
4a23973 chore: stop tracking server/data/supplier_hub runtime state
3bbe01f fix(withdrawals): full lifecycle — server store, admin approve/reject with REAL refund
9ca3fcb fix(security): sourceConnector encryption fail-closed in production
bc4f5ca fix(admin): remove dead duplicate tab ids + mount AdminSoldOrdersTab
d6d3485 fix(categories): wire Danh Mục tab end-to-end — server CRUD + persistence
e07ea29 fix(payments): full fail-closed for USDT/LTC/Binance + real API creds & connection tests in admin
```
