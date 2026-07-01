# shop/frontend - Hướng dẫn phiên làm việc

Frontend của dự án **shop** (web bán hàng). **Dựng mới bằng Next.js** để tối ưu SEO, thay cho bản React
cũ. Đây là điểm vào ngữ cảnh - đọc trước khi code.

## Đang ở đâu

- ✅ **Phần 1 (core)** xong: khung Next 16, tầng `lib` (config/api-client/server-api/auth-context/
  jwt/types/format), mô hình không-proxy, token RAM + refresh cookie.
- ✅ **Phần 2 (tính năng)** xong: storefront đầy đủ + store manager `/admin`. Đã nối các cập nhật
  backend ngày 2026-06-25.
- ✅ **Phần 3 (giao diện) đợt 1** xong: theme xanh dương + sáng/tối, hero, product-card sống động,
  SEO (sitemap/robots/JSON-LD).
- ✅ **Phần 4 (đồng bộ backend) xong (2026-06-30):** đã nối toàn bộ tính năng backend mới. `tsc`
  sạch, `next build` OK (28 route). Kế hoạch + chi tiết:
  [`.claude/docs/ke-hoach/phan-4-dong-bo-backend.md`](.claude/docs/ke-hoach/phan-4-dong-bo-backend.md). Đã thêm:
  - **Checkout + thanh toán:** sổ địa chỉ (`/account`), viết lại `/checkout` (chọn địa chỉ, áp
    coupon, preview tổng tiền, COD/online), `/orders` + `/orders/[id]`, trang `/payment/mock`.
  - **Email bảo mật:** `/verify-email`, `/forgot-password`, `/reset-password`, khu OTP + badge xác
    minh trong `/account` (SMTP demo TẮT → lấy token từ log backend khi thử).
  - **Thông báo in-app:** chuông + badge unread trong header; broadcast admin (`/admin/notifications`).
  - **Gợi ý/cá nhân hóa:** widget thịnh hành / gợi ý cho bạn / đã xem gần đây (trang chủ) + hay mua
    cùng (trang chi tiết).
  - **Admin:** sản phẩm dùng `/products/managed`; coupon đủ field nâng cấp; đổi trạng thái giao đơn.
- ✅ **Phần 5 (đồng bộ đợt rà soát backend 2026-07-01) xong:** `tsc` sạch + `next build` OK (28 route).
  Đã nối các thay đổi backend từ đợt vá lỗi/hardening:
  - **Đơn online giữ chỗ tồn kho (Shopee-like):** `Order` type + `/orders/[id]` dùng
    `paymentProvider` để gate nút "Thanh toán ngay", hiện **hạn thanh toán** (`paymentDeadline`) và
    trạng thái **đã hủy quá hạn** (`cancelledAt`, ẩn nút trả). Cần backend mở rộng `OrderResponse`
    (thêm `paymentProvider/paymentDeadline/cancelledAt`).
  - **Đổi mật khẩu:** thêm ô tích "Đăng xuất tất cả phiên khác (giữ phiên hiện tại)" trong
    `/account` → gửi `logoutOtherSessions`.
  - **Logout dùng POST** (`auth-context`) - backend hỗ trợ cả POST lẫn GET.
  - Login/forgot/OTP: 429 rate-limit hiển thị `message` từ backend (không cần đổi); login unknown
    user nay trả E1005 chung (FE không special-case E1004 nên không ảnh hưởng).
  - Chi tiết: [`.claude/docs/dong-bo-backend-2026-07-01.md`](.claude/docs/dong-bo-backend-2026-07-01.md).
- ✅ **Phần 6 (rà soát + nâng cấp frontend 2026-07-01) xong:** `tsc` sạch + `next build` OK (28 route).
  Kế hoạch + phân công đầy đủ: [`.claude/docs/ra-soat-frontend-2026-07-01.md`](.claude/docs/ra-soat-frontend-2026-07-01.md).
  - **Lỗi đã sửa:** decode JWT UTF-8 (hết hỏng tên/email có dấu); nhãn tiếng Việt + badge trạng thái
    tổng hợp + nút trả nhanh + đếm ngược ở danh sách đơn (`lib/order-status.ts` dùng chung); returnUrl
    khi đăng nhập; chặn số lượng theo tồn kho + badge tồn kho; coupon có `busy` + bỏ áp mềm khi hết
    hợp lệ; cart-context giữ item khi refresh lỗi; chỉ nhận `n.link` là path nội bộ.
  - **Giao diện:** `next/image` (hết `<img>`), gallery thumbnail chọn được + sticky cột ảnh,
    skeleton + empty state (cart/wishlist/search/orders), timeline đơn + đồng hồ đếm ngược hạn thanh
    toán, header mobile hamburger, dialog xác nhận hành động phá hủy.
  - **File mới:** `lib/order-status.ts`, `components/site/payment-countdown.tsx`,
    `components/site/order-timeline.tsx`, `components/ui/confirm-dialog.tsx`.
  - **Chờ user/backend:** nghi giá lệch card vs chi tiết (#5, cần xác nhận dữ liệu thật), hủy đơn
    chủ động + thông báo realtime (cần endpoint backend), QA thủ công + Lighthouse/A11y.
- ⏭️ **Tiếp theo:** editor thuộc tính/biến thể (SKU) sản phẩm. Phần còn chờ backend đã nêu ở Phần 6.
- Dọn dẹp: `src/components/auth/auth-demo.tsx` là widget thử Phần 1, không còn dùng - có thể xóa.
- Để chạy thử: bật backend cổng 8088 rồi `npm run dev` (xem `.env.local`). Tài khoản: `admin`/`Admin@123`,
  demo `Demo@123`. Coupon demo: `WELCOME10`/`SALE50K`/`FREESHIP`/`BIGSALE20`.

## Đọc gì khi bắt đầu

1. **Kế hoạch (3 phần)** → [`.claude/docs/ke-hoach/README.md`](.claude/docs/ke-hoach/README.md)
   - [`phan-1-core.md`](.claude/docs/ke-hoach/phan-1-core.md) - hạ tầng, auth, tầng API (làm trước)
   - [`phan-2-tinh-nang.md`](.claude/docs/ke-hoach/phan-2-tinh-nang.md) - port trang cũ + tính năng mới
   - [`phan-3-giao-dien.md`](.claude/docs/ke-hoach/phan-3-giao-dien.md) - làm đẹp UI + SEO
2. **Bản đồ API backend** → [`.claude/docs/api-backend.md`](.claude/docs/api-backend.md)
3. **Cập nhật backend mới nhất (gợi ý/cá nhân hóa, /products/managed, vá IDOR) - 2026-06-30** →
   [`.claude/docs/cap-nhat-backend-2026-06-30.md`](.claude/docs/cap-nhat-backend-2026-06-30.md)
   (tiếp nối bản 2026-06-25)

## Nguồn tham chiếu

| Cần gì | Đường dẫn |
|---|---|
| Backend (Python/Xime, đã code đầy đủ) | `D:\code\Monolithic\shop\backend` (controller dưới `app/controller`, DTO `app/dto`) |
| Frontend cũ (React CRA + Redux) - nguồn tính năng | `D:\code\JAVASCRIPT\Shop\src` |
| Khuôn mẫu Next.js anh em (stack + lib + admin shell) | `D:\code\Monolithic\dental-clinic\frontend` (và spa/auto-garage...) |

## Quyết định kiến trúc đã chốt

- **Stack:** Next 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + react-hook-form + zod
  (theo các dự án anh em).
- **KHÔNG dùng proxy** (khác anh em): trình duyệt **gọi thẳng backend** qua `NEXT_PUBLIC_API_URL`. Next
  chỉ gọi backend phía server qua `INTERNAL_API_URL` cho **SEO/SSR** trang công khai.
- **Token:** access token lưu **RAM**; refresh token là **httpOnly cookie** Path=`/api/refresh-token`
  do backend đặt. Thông tin user lấy bằng **giải mã JWT** (`uid/username/email`).
- Backend chạy cổng **8088**. Phản hồi thành công trả thẳng dữ liệu; lỗi dạng
  `{errorKey, code, message}`. Phân trang `page`+`limit`, **không** trả tổng số.

## ⚠️ Khoảng trống/phụ thuộc backend (đọc trước khi làm phần liên quan)

> Cập nhật 2026-06-30: nhiều mục cũ ĐÃ ĐƯỢC LẤP. Xem chi tiết hai bản cập nhật:
> [`cap-nhat-backend-2026-06-25.md`](.claude/docs/cap-nhat-backend-2026-06-25.md) và
> [`cap-nhat-backend-2026-06-30.md`](.claude/docs/cap-nhat-backend-2026-06-30.md).

ĐÃ LẤP:

- **CORS** đã cấu hình ở backend (`configure_cors`); vẫn đọc lưu ý cookie cross-site:
  [`../backend/.claude/docs/luu-y-cau-hinh-cors.md`](../backend/.claude/docs/luu-y-cau-hinh-cors.md).
- **user_controller** đã có: đăng ký, `/me`, sửa hồ sơ, CRUD user (bản 2026-06-25).
- **Endpoint đếm tổng** cho phân trang đã có (`.../count`).
- **best-sell / special / suggest** đã có qua nhóm `recommendations` + `/products/{id}/related` (bản 2026-06-30).
- **Checkout + thanh toán + coupon-trong-đơn + sổ địa chỉ + Email + thông báo in-app**: backend đã
  code và frontend ĐÃ NỐI (Phần 4, 2026-06-30). Xem
  [`.claude/docs/ke-hoach/phan-4-dong-bo-backend.md`](.claude/docs/ke-hoach/phan-4-dong-bo-backend.md).

ĐÃ LẤP (2026-06-30, đợt sửa ảnh + danh mục):

- **Ảnh trong product DTO** đã có: backend trả `imageUrl` (file_path ảnh đại diện, batch trong
  `ProductService._to_dtos`); `product-card` render qua `mediaUrl(product.imageUrl)`. Trang chi tiết
  vẫn lấy đủ gallery qua `/api/files/product/{id}`.
- **Trang chủ "Danh mục nổi bật"** chỉ hiện danh mục cấp 1 (tối đa 8) + link "Xem tất cả" → `/categories`
  (trang này liệt kê đầy đủ).
- Vá bug tiềm ẩn: `wishlist_service.get_user_wishlist_detail` bỏ qua sản phẩm đã soft-delete thay vì
  vỡ cả wishlist (get_product_by_id raise E10200).

CÒN TRỐNG:

- **Quyền không nằm trong JWT** → lấy quyền hiệu lực qua `GET /api/me/permissions`.
- **Editor thuộc tính/biến thể (SKU)** sản phẩm trong admin chưa làm (tạo/sửa mới quản lý option mặc định).
- **Email demo:** SMTP backend đang TẮT (username/password trống) → các luồng verify/reset/OTP gọi được
  nhưng email không gửi thật; lấy token/OTP từ log backend hoặc bảng `auth_tokens` để thử.

## Quy ước

- Giao tiếp tiếng Việt; comment code: tiếng Anh trên, tiếng Việt dưới.
- Không dùng gạch ngang dài (—) hay en dash (–); chỉ dùng dấu trừ (-).
- Khi nghi ngờ hình dạng dữ liệu API, đọc lại `app/dto/**` của backend.
- Cài thêm package phải hỏi người dùng trước.
