# BÁO CÁO PHASE — ADMIN PANEL RESTRUCTURE + PRODUCT/ESCOROW VERIFY

> Repo `E:\project\OK-OK` · 12/09/2026
> Nội dung: (1) Sắp xếp lại Admin Panel theo nhóm logic, (2) Verify Product input→output, (3) Verify Gom đơn admin↔user.

---

## 1. ADMIN PANEL — SẮP XẾP THEO NHÓM (thư mục to + nhánh con)

**Trước**: 22 tab dàn phẳng một danh sách dài — "Vouchers" cạnh "Tường Lửa WAF" cạnh "Database SQL Schema", không có phân nhóm nào.

**Sau** (`src/components/AdminPanelModal.tsx`): sidebar gom thành **6 nhóm**, mỗi nhóm có tiêu đề (thư mục to), tab con nằm trong nhánh:

| Nhóm (thư mục to) | Nhánh con |
|---|---|
| **TỔNG QUAN** | Dashboard |
| **KINH DOANH** | Sản Phẩm & Sửa Giá · Danh Mục · Game Topup & Bulk Giá · Vouchers & Coupons · Đơn Hàng (Queue) · GiftUp Cards |
| **TÀI CHÍNH** | Nạp Tiền/Banking · Cổng Thanh Toán API · Escrow Pools · Đơn Hàng Đáng Tin & Key Vault |
| **NGUỒN HÀNG & TỰ ĐỘNG** | Nhà Cung Cấp & Kết Nối Nguồn · Cron Jobs & Auto Sync · Hero Layout & Banner |
| **KHÁCH HÀNG & HỖ TRỢ** | Tài Khoản/Profile · Support Hub · Đại Lý / Reseller API |
| **HỆ THỐNG & BẢO MẬT** | Roles & Sub-Admin · WAF, IP & Bảo Mật · System Logs · Settings · Database SQL Schema |

**Nguyên tắc tôn trọng logic gốc:**
- **22 tab giữ nguyên 100% chức năng** — không xóa/mount lại component nào, chỉ thay đổi *cách hiển thị* nav (mảng `navTabs` phẳng → `navGroups` lồng nhau, render loop tương ứng).
- Badge (số lượng sản phẩm/đơn/khách...) giữ nguyên trên từng tab.
- Mobile vẫn hiển thị dạng cuộn ngang từng nhóm.

---

## 2. PRODUCT INPUT→OUTPUT — ĐÃ RÕ RÀNG ✅

**Live verify (chạy server thật, dùng API):**

| Bước | Kết quả |
|---|---|
| **CREATE** product (kèm `discountPercent: 25`) | ✅ `{"success":true, product:{...discountPercent:25}}` |
| **UPDATE** giá 100k→150k + `discountPercent: 40` | ✅ PUT merge đúng, trả giá mới + discount mới |
| **GET** verify | ✅ `retailPrice: 150000 | discountPercent: 40` |
| **DELETE** | ✅ `"Đã xóa sản phẩm thành công"` — GET lại → `Product not found` |

**UI Admin Products** đã có đủ (xác nhận code):
- **Thêm sản phẩm** — form tạo mới kèm giá + `discountPercent` (`AdminProductsTab.tsx:313-318`)
- **Sửa** — edit inline: tên, giá sỉ, giá lẻ, giá CTV (`:762-792`) + quản lý 9 ngôn ngữ
- **Xóa** — confirm modal trước khi xóa (`:97-106`)
- **Giảm giá** — nút "Bật Sale & Set %" + input % trực tiếp + tắt flash sale (`:956-994`)
- **Kho** — input số + nhanh ±1 (`:996-1019`)

---

## 3. GOM ĐƠN (ESCOWR) ADMIN ↔ USER — THÔNG SUỐT ✅

**Live verify (2 chiều thật):**
1. **User** `POST /escrow/join` pool `pool-gpt-881` (4/5) → contract `COMPLETED 5/5`, `filledSlots: 5`.
2. **User nhận order** `GROUP_POOL | COMPLETED` kèm **key thật** `CYBER-OPENAI-3072-3814-8411` (không phải key giả — đúng sau fix F04).
3. **Admin** đọc lại `GET /escrow/pools` → thấy `status: COMPLETED | filled: 5/5 | participants: 5` — dữ liệu 2 chiều khớp nhau (cùng nguồn `db.escrowContracts`).

Server API:
- `GET /escrow/pools` — công khai (danh sách contract cho admin + user xem tiến độ)
- `POST /escrow/join` — requireAuth, có **mutex chống oversell slot** (fix P1 trước đó) + idempotency
- `POST /escrow/admin/refund` — ADMIN force refund

Admin UI `AdminEscrowPoolsTab` hiển thị pool + tiến độ (% đủ slot), số tiền khóa, nút force action.

---

## VERIFY TỔNG THỂ

- `npx tsc --noEmit` — ✅ PASS
- Test suite — ✅ 17/17 pass, thoát sạch
- Boot server + curl live — ✅ đã mô tả trên

## FILE CHẠM TỚI

```
src/components/AdminPanelModal.tsx   (navGroups — duy nhất cho phần 1)
```

Phần 2 & 3 **không cần sửa code** — chỉ verify; mọi thứ đã hoạt động đúng sau các fix P0/P1 trước.

## LƯU Ý CÒN LẠI (không thuộc phase này)

- `AdminEscrowPoolsTab` đọc pool từ `products[].activePools` (client catalog) — nếu admin mở tab ngay sau khi user join mà chưa refresh trang, dữ liệu client có thể cũ vài giây. Server (`/escrow/pools`) luôn chính xác. Nên cân nhắc cho tab này fetch từ API trực tiếp (gom vào phase tái cấu trúc admin sâu hơn).
- Admin UI vẫn chưa có RBAC client-side (tab ẩn theo role) — thuộc P2.