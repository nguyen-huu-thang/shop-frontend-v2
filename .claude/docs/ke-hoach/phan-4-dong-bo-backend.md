# Phần 4 - Đồng bộ frontend với backend (2026-06-30)

> Backend đã thêm nhiều tính năng (checkout/thanh toán, email bảo mật, thông báo in-app, gợi ý/cá
> nhân hóa, coupon nâng cấp, products/managed) mà frontend **chưa nối**. Tài liệu này là kế hoạch
> chi tiết để nâng frontend cho khớp. Tiếp nối [`README.md`](README.md) (Phần 1-3 đã xong).

## Bối cảnh & quyết định

- Backend: `D:\code\Monolithic\shop\backend` - đã code đầy đủ (xem `backend/CLAUDE.md` mục "Trạng thái").
- Mô hình FE **không proxy**: browser gọi thẳng backend qua `NEXT_PUBLIC_API_URL`; SSR công khai
  dùng `INTERNAL_API_URL`. Token access ở RAM, refresh là httpOnly cookie.
- Response thành công trả thẳng dữ liệu; lỗi `{errorKey, code, message}`. Casing JSON **trộn** theo
  từng endpoint - xem ghi chú trong [`types.ts`](../../src/lib/types.ts).
- Thứ tự thực hiện: **Phase 0 → F tuần tự**. Ưu tiên cao nhất: **Checkout+Thanh toán (A)** và
  **Email bảo mật (B)**.
- Email: SMTP backend đang TẮT (username/password trống). Phase B build UI đầy đủ; lấy token demo
  từ log backend / bảng `auth_tokens` để chạy thử luồng.

---

## Bản đồ endpoint backend cần nối (đã xác minh DTO)

| Nhóm | Endpoint | Shape (đã đọc DTO) |
|---|---|---|
| Địa chỉ | `GET/POST/PUT/DELETE /api/addresses`, `PUT /api/addresses/{id}/default` | req alias `recipientName/recipientPhone/isDefault`; res camelCase |
| Checkout | `POST /api/orders/preview` | req `{cartIds, addressId?, couponCode?}` → res `{subtotal, shippingFee, productDiscount, shipDiscount, total, couponApplied, couponCode}` |
| Đặt hàng | `POST /api/orders` | req `{cartIds, addressId, couponCode?, paymentProvider:"cod"\|"mock_online"}` → `Order` |
| Thanh toán | `POST /api/orders/{id}/pay` → `{orderId, paymentRef, mockUrl}`; `POST /api/payments/mock/callback` `{paymentRef, success}` |
| Đổi giao hàng | `PUT /api/orders/{id}/shipping-status` `{status}` |
| Email | `POST /api/verify-email {token}`, `/verify-email/resend`, `/forgot-password {email}`, `/reset-password {token, newPassword}`, `/otp/request`, `/otp/verify {otp}` |
| Thông báo | `GET /api/notifications/me?page&limit`, `/me/unread-count`, `PATCH /me/read-all`, `PATCH /{id}/read`, `POST /broadcast {title,message,link}` |
| Gợi ý | `GET /api/recommendations/{recently-viewed,trending,for-you}?limit`, `GET /api/products/{id}/related?limit` → mảng product DTO (camelCase như `Product`) |
| Admin SP | `GET /api/products/managed?page&limit`, `/managed/count` |
| Coupon (đã đủ field) | create/update nhận `discountType,maxDiscount,minOrderAmount,appliesTo,usageLimit,perUserOnce`; res lộ đủ |

> Coupon DTO backend ĐÃ có đủ field mới → **không cần sửa backend**.

---

## Phase 0 - Nền tảng (types + lib/api)

**Mục tiêu:** có sẵn type + hàm gọi API cho mọi tính năng mới, để các phase sau chỉ dựng UI.

- [`types.ts`](../../src/lib/types.ts):
  - Sửa `OrderCreatePayload` → `{cartIds:number[]; addressId:number; couponCode?:string; paymentProvider:"cod"|"mock_online"}`.
  - Thêm `OrderPreviewPayload`, `OrderPreview`, `PaymentInit`, `Address`, `AddressPayload`.
  - Mở rộng `Coupon` (+`discount_type,max_discount,min_order_amount,applies_to,usage_limit,used_count,per_user_once`) và `CouponPayload` (camelCase aliases).
  - Thêm `link?` vào `Notification`.
- `lib/api/` mới: `address.ts`, `notifications.ts`, `recommendations.ts`.
- Cập nhật [`account.ts`](../../src/lib/api/account.ts): `previewOrder`, `createOrder` (shape mới), `payOrder`; email-flow helpers (`verifyEmail/resendVerify/forgotPassword/resetPassword/requestOtp/verifyOtp`).
- Cập nhật [`admin.ts`](../../src/lib/api/admin.ts): `getManagedProducts(+count)`, coupon CRUD full-field, `updateShippingStatus`, `broadcastNotification`, `rebuildCooccurrence`.

## Phase A - Checkout + Thanh toán (ưu tiên)

- **Sổ địa chỉ:** component CRUD trong `/account` (list + thêm/sửa/xóa + đặt mặc định).
- **Viết lại [`/checkout`](../../src/app/checkout/page.tsx):**
  1. Chọn địa chỉ từ sổ (nếu trống → nhắc thêm địa chỉ); 2. nhập coupon → gọi `/orders/preview`
  hiện breakdown; 3. chọn `cod`/`mock_online`; 4. đặt hàng (`POST /orders`).
  - `cod`: xong → `/orders/{id}`. `mock_online`: gọi `/orders/{id}/pay` → điều hướng `mockUrl`.
- **Trang `/payment/mock`:** đọc `?ref=`, nút "Thanh toán thành công/thất bại" → `/payments/mock/callback` → quay lại đơn.
- **Trang đơn:** `/orders` (lịch sử của tôi) + `/orders/[id]` (chi tiết; gửi token; bắt 401/403 IDOR).
- Dọn: link "đặt hàng xong" hiện trỏ `/account?order=` → đổi sang `/orders/{id}`.

## Phase B - Email bảo mật (ưu tiên)

- `/verify-email` (đọc `?token=` → POST verify → thông báo kết quả).
- `/forgot-password` (nhập email) + `/reset-password` (`?token=` + mật khẩu mới).
- Trong `/account`: badge "email đã/chưa xác minh" + nút gửi lại; (tùy chọn) khu OTP.
- Vì SMTP tắt: thêm ghi chú UI/doc cách lấy token demo từ log backend hoặc bảng `auth_tokens`.

## Phase C - Thông báo in-app

- Chuông trong [`site-header.tsx`](../../src/components/site/site-header.tsx): badge unread-count (poll nhẹ / refetch khi mở), dropdown `/me`, click → đánh dấu đọc `/{id}/read` + điều hướng `link`, nút "đọc tất cả" `/me/read-all`. Chỉ hiện khi đăng nhập.
- Admin: form broadcast (`/broadcast`).

## Phase D - Gợi ý / cá nhân hóa

- Trang chủ [`page.tsx`](../../src/app/page.tsx): "Thịnh hành" (công khai) + "Gợi ý cho bạn" (đăng nhập, fallback trending), "Đã xem gần đây" (đăng nhập).
- Chi tiết SP [`product-detail.tsx`](../../src/components/site/product-detail.tsx): "Sản phẩm hay mua cùng" (`/products/{id}/related`).
- Dùng lại `product-card`. Backend tự ghi tín hiệu → FE không gọi API log. Có empty-state.

## Phase E - Nâng cấp Admin

- SP admin [`admin/products`](../../src/app/admin/products/page.tsx) → `GET /products/managed` (+count).
- Coupon admin [`admin/coupons`](../../src/app/admin/coupons/page.tsx): thêm 6 field mới vào form.
- Đơn admin [`admin/orders`](../../src/app/admin/orders/page.tsx): chọn trạng thái giao → `PUT /{id}/shipping-status`.
- (Tùy chọn) nút rebuild co-occurrence; panel email status/test (`/api/email/status|test`).

## Phase F - Dọn dẹp & đồng bộ tài liệu

- Rà order/wishlist/cart detail: gửi token, bắt 401 (`E2025`)/403 (`E2021`) với thông báo phù hợp.
- Xóa [`auth-demo.tsx`](../../src/components/auth/auth-demo.tsx) (hỏi trước).
- Cập nhật `frontend/CLAUDE.md` mục "Khoảng trống" (checkout/email/notify/recommend đã làm).
- Kiểm tra `tsc --noEmit` sạch + `next build` OK.

---

## Kiểm thử mỗi phase

- `npx tsc --noEmit` sau mỗi phase; `next build` ở Phase F.
- Chạy thử thật: backend cổng 8088 (đã có seed catalog demo) + `npm run dev`. Tài khoản: `admin`/`Admin@123`, demo `Demo@123`. Coupon demo: `WELCOME10/SALE50K/FREESHIP/BIGSALE20`.
