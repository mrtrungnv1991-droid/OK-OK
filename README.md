# CYBERPOOL // Enterprise Digital Marketplace & Escrow Platform

> **CYBERPOOL** là nền tảng thương mại điện tử sản phẩm số và dịch vụ tài nguyên điện toán đám mây cao cấp, tích hợp cơ chế mua chung ký quỹ tự động (Escrow Smart Pools), giao hàng tức thì (Instant Key Fulfillment), kế toán kép kiểm toán bất biến (Double-Entry Ledger Accounting) và hệ thống chấm điểm gian lận thời gian thực (Real-time Anti-Fraud Engine).

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

Hệ thống được thiết kế theo mô hình lai (hybrid full-stack) tối ưu hóa cho độ trễ thấp và khả năng mở rộng:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CYBERPOOL CLIENT SPA                          │
│               React 19 + TypeScript + Tailwind CSS + Lucide            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP / JSON API (Port 3000)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PRIMARY GATEWAY (Express + Vite)                   │
│  - Port 3000 (Reverse Proxy Ingress)                                   │
│  - JWT Authentication Middleware (HMAC-SHA256)                         │
│  - Double-Entry Ledger Engine (Atomic Balance Transfers)               │
│  - Inventory Mutex Lock Service (Zero-Overselling Concurrency)         │
│  - Escrow State Machine (Smart Pool Oracle & Milestone Release)        │
│  - AES-256-GCM Authenticated Encryption Vault                          │
│  - Webhook Gateway (VietQR & Telco HMAC-SHA256 Verification)           │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
                   │ Internal Analytics               │ Production SQL
                   ▼                                  ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  FASTAPI MICROSERVICE (Python 3.11)  │  │  POSTGRESQL ENTERPRISE DB    │
│  - Port 8000                         │  │  - 64+ Relational Tables     │
│  - Anti-Fraud & Risk Scoring API     │  │  - Double-Entry Ledger Logs  │
│  - Transaction Velocity Telemetry    │  │  - Strict Constraints & FKs  │
│  - Interactive OpenAPI Docs (/docs)  │  │  - `cyberpool_schema.sql`    │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Phân Định Trách Nhiệm Dịch Vụ
1. **Node.js / Express.js Core Gateway (`server.ts`, `/server`):**
   - Đảm nhiệm toàn bộ luồng nghiệp vụ giao dịch, xác thực người dùng, bảo vệ số dư ví, giữ chỗ kho hàng (concurrency locking), và xử lý webhook ngân hàng.
   - Lưu trữ trực tiếp trong bộ nhớ có cấu trúc giao dịch (`/server/db/store.ts`) phục vụ kiểm thử nhanh, đồng thời tương thích với cơ sở dữ liệu quan hệ sản xuất.
2. **Python FastAPI Microservice (`/backend_fastapi`):**
   - Độc lập chấm điểm rủi ro gian lận đơn hàng theo thời gian thực dựa trên tần suất thao tác (velocity), hạn mức giao dịch, và dấu vân tay thiết bị.
   - Cung cấp giao diện tài liệu chuẩn OpenAPI 3.0 tại `/docs` và `/redoc`.
3. **PostgreSQL Relational Schema (`/database/cyberpool_schema.sql`):**
   - Định nghĩa toàn bộ 64+ bảng dữ liệu quan hệ cho môi trường sản xuất (sổ cái kế toán kép `ledger_entries`, đơn hàng `orders`, nhóm ký quỹ `escrow_pools`, giấy phép bản quyền `license_keys`, lịch sử kiểm toán `audit_logs`).

---

## 🔒 Cơ Chế Bảo Mật & Phòng Thủ (Security Hardening)

### 1. Xác Thực Danh Tính & JWT Cryptographic Signatures
- **Loại bỏ hoàn toàn lỗ hổng giả mạo danh tính:** Loại bỏ cơ chế tin tưởng header thô `x-user-id` từ client.
- **Mã hóa mật khẩu:** Mật khẩu người dùng được băm an toàn bằng giải thuật `scrypt` với muối ngẫu nhiên (salt) chuẩn công nghiệp (định dạng `scrypt:salt:hash`).
- **Cryptographic JWT:** Mã thông báo được ký bằng giải thuật `HMAC-SHA256` với secret key bảo mật cao, thời hạn 7 ngày, kiểm tra tính toàn vẹn chữ ký bằng `crypto.timingSafeEqual` để chống tấn công Timing Attack.

### 2. Két Lưu Trữ Thông Tin Nhạy Cảm (AES-256-GCM Vault)
- Nâng cấp từ AES-CBC lên **AES-256-GCM** (Authenticated Encryption with Associated Data).
- Mỗi bản ghi được mã hóa với IV ngẫu nhiên 12 byte và xác thực toàn vẹn bằng Authentication Tag 16 byte.
- Mọi hành vi can thiệp vào ciphertext hoặc tag đều bị phát hiện ngay lập tức (`[DECRYPTION_INTEGRITY_FAILED]`), ngăn chặn triệt để Padding Oracle Attack và Bit-flipping Attack.
- Bắt buộc khai báo `ENCRYPTION_KEY` và `SOURCE_CONNECTOR_SECRET_KEY` trong môi trường sản xuất (`NODE_ENV=production`).

### 3. Cổng Webhook Ngân Hàng & Thẻ Cào (VietQR & Telco)
- **Bắt buộc xác thực chữ ký HMAC-SHA256 trên mọi môi trường:** Chữ ký `x-vietqr-signature` được so sánh bằng phương thức an toàn thời gian cố định. Mọi chữ ký sai lệch sẽ bị từ chối với mã HTTP 401 và ghi log kiểm toán bảo mật.
- **Khắc phục triệt để gán cứng tài khoản (No Hardcoded User):** Hệ thống tự động phân tích cú pháp nội dung chuyển khoản (Memo) hoặc tham số webhook để đối soát chính xác tài khoản người dùng (`usr-*`, email, số điện thoại).
- **Hàng đợi đối soát thủ công (Unmapped Reconciliation):** Các giao dịch nạp tiền không nhận diện được người thụ hưởng sẽ tự động chuyển vào hàng đợi `pendingUnmappedDeposits` để quản trị viên đối soát an toàn.
- **Persistent Idempotency Cache:** Lưu trữ vết xử lý giao dịch bằng khóa `transactionId` duy nhất, ngăn chặn hoàn toàn việc cộng tiền trùng lặp (Double-Credit Attack).

### 4. An Toàn Đa Tác Vụ & Chống Bán Quá Số Lượng (Concurrency Mutex)
- Dịch vụ kho `InventoryService` sử dụng hàng đợi khóa đồng bộ (Mutex lock queue) cho từng mã sản phẩm (SKU).
- Khi có nhiều yêu cầu mua hàng đồng thời cùng một thời điểm, chỉ duy nhất một phiên giao dịch được cấp phát tài nguyên thành công; các phiên còn lại nhận thông báo hết hàng mà không gây sai lệch dữ liệu kho.

---

## 🧪 Bộ Kiểm Thử Tự Động (Automated Test Suite)

Toàn bộ **17 bài kiểm thử** tự động được xây dựng trực tiếp trên Node.js Native Test Runner (`node:test` + `node:assert/strict`), không phụ thuộc thư viện bên ngoài:

```bash
# Chạy toàn bộ test suite (Unit, Integration, Security, Concurrency)
npm test
```

### Danh Sách Test Suites Đạt Chuẩn 100% Pass:
1. **Concurrency & Race-Condition Defense Suite (`tests/concurrency/race_condition.test.ts`):**
   - Kiểm tra 5 yêu cầu đồng thời tranh chấp 1 mã key duy nhất — đảm bảo đúng 1 giao dịch thành công.
2. **End-to-End Instant Checkout Integration (`tests/integration/checkout.test.ts`):**
   - Kiểm tra chu trình thanh toán ví, trừ số dư nguyên tử, và bàn giao mã kích hoạt kỹ thuật số.
3. **Auth & Cryptographic Security Suite (`tests/unit/auth.test.ts`):**
   - Kiểm tra băm và xác thực mật khẩu qua `scrypt`.
   - Kiểm tra tạo và xác thực token JWT HMAC-SHA256.
   - Phát hiện và từ chối token bị giả mạo payload / chữ ký hoặc sai định dạng.
4. **AES-256-GCM Vault Integrity Suite (`tests/unit/encryption.test.ts`):**
   - Kiểm tra mã hóa và giải mã chính xác chuỗi bí mật.
   - Kiểm tra phát hiện can thiệp byte ciphertext / authentication tag.
5. **Escrow Oracle & Group Buying Smart Flow (`tests/unit/escrow.test.ts`):**
   - Kiểm tra danh sách pool đang hoạt động và chuyển trạng thái khóa ký quỹ nguyên tử.
6. **Ledger & Double-Entry Accounting Suite (`tests/unit/ledger.test.ts`):**
   - Kiểm tra hạch toán cộng/trừ số dư và bảo vệ chống rút quá số dư ví (Insufficient balance).
   - Kiểm tra tính bất biến (Idempotency) khi gửi lại cùng một `idempotencyKey`.
7. **Webhook & Signature Verification Suite (`tests/unit/webhook.test.ts`):**
   - Kiểm tra tính toán và xác thực chữ ký HMAC-SHA256 chuẩn xác.
   - Kiểm tra cơ chế chống lặp lệnh nạp tiền ngân hàng bằng bộ đệm giao dịch đã xử lý.

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Getting Started)

### Yêu Cầu Môi Trường
- **Node.js:** v20.x hoặc v22.x
- **Python:** v3.10+ (cho microservice phân tích chống gian lận)
- **NPM:** v10.x+

### 1. Khởi Động Core Application (Node.js + Express + Vite)
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Cấu hình biến môi trường từ mẫu
cp .env.example .env

# 3. Kiểm tra kiểu dữ liệu TypeScript
npm run lint

# 4. Chạy kiểm thử tự động
npm test

# 5. Khởi động môi trường phát triển (Port 3000)
npm run dev
```

### 2. Khởi Động FastAPI Microservice (Tùy Chọn)
```bash
# 1. Cài đặt thư viện Python
pip install fastapi uvicorn pydantic

# 2. Khởi chạy máy chủ FastAPI (Port 8000)
uvicorn backend_fastapi.app.main:app --host 0.0.0.0 --port 8000 --reload

# Truy cập tài liệu API:
# http://localhost:8000/docs
```

### 3. Build & Chạy Bản Sản Xuất (Production Build)
```bash
# Đóng gói frontend Vite và biên dịch backend CommonJS
npm run build

# Khởi chạy ứng dụng sản xuất
npm start
```

---

## 📋 Biến Môi Trường Cần Thiết (.env)

| Biến Môi Trường | Mô Tả | Mặc Định / Ví Dụ |
| :--- | :--- | :--- |
| `PORT` | Cổng dịch vụ Express/Vite | `3000` |
| `NODE_ENV` | Môi trường chạy (`development`, `production`, `test`) | `development` |
| `JWT_SECRET` | Secret ký chữ ký số JWT HMAC-SHA256 (Tối thiểu 32 ký tự) | `cyberpool-jwt-secret-2026!` |
| `ENCRYPTION_KEY` | Khóa mã hóa két AES-256-GCM | `cyberpool-vault-key-32b-min!` |
| `SOURCE_CONNECTOR_SECRET_KEY` | Khóa mã hóa cookie & session connector | `cyberpool-connector-key!` |
| `VIETQR_WEBHOOK_SECRET` | Secret xác thực chữ ký Webhook ngân hàng VietQR | `CYBER_VIETQR_SECRET_KEY!` |
| `TELCO_WEBHOOK_SECRET` | Secret xác thực callback thẻ cào viễn thông | `CYBER_TELCO_SECRET_KEY!` |
| `CORS_ORIGINS` | Danh sách nguồn được phép gọi tới FastAPI | `http://localhost:3000` |

---

## 🚀 Kiểm Tra & Giám Sát Liên Tục (CI/CD)

Hệ thống được tích hợp quy trình kiểm thử tự động tại `.github/workflows/ci.yml`:
- Tự động chạy TypeScript Typecheck (`npm run lint`).
- Tự động chạy toàn bộ Test Suite (`npm test`).
- Tự động đóng gói ứng dụng sản xuất (`npm run build`).
