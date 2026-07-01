# Tích hợp backend

Frontend gọi thẳng REST API của [backend](https://github.com/nguyen-huu-thang/xime-shop-example).
Tài liệu này mô tả cách gọi, quy ước dữ liệu và các nhóm endpoint sử dụng.

## Hai kiểu gọi API

| Kiểu | Hàm | Dùng cho |
|---|---|---|
| Công khai (browser) | `publicFetch` (`lib/api-client.ts`) | endpoint không cần đăng nhập |
| Có đăng nhập (browser) | `authFetch` (`lib/auth-context.tsx`) | gắn `Bearer` + tự refresh khi 401 |
| Phía server (SSR) | `lib/server-api.ts` | render trang công khai (dùng `INTERNAL_API_URL`) |

Mọi fetch đặt `credentials: "include"` để cookie refresh cross-site hoạt động.

## Quy ước dữ liệu (theo backend)

- **Thành công**: backend trả thẳng dữ liệu (không bọc `{data}`).
- **Lỗi**: body `{ errorKey, code, message }` -> frontend bắt qua `ApiError` (`lib/api-error.ts`),
  hiển thị `message`, xử lý theo `code` (401 thử refresh; 403 báo không có quyền).
- **Phân trang**: `?page=&limit=`; tổng số lấy qua endpoint `.../count`.
- **Casing trộn**: phần lớn camelCase; một số nhóm snake_case (category, review, coupon, notification,
  file, user). `types.ts` ghi rõ casing theo từng type.

## Token và phiên

```text
login            → accessToken (RAM) + refresh (httpOnly cookie do backend đặt)
authFetch        → Authorization: Bearer <accessToken>
   nếu 401       → POST /api/refresh-token (gửi cookie) → accessToken mới → thử lại
mở app           → POST /api/refresh-token để khôi phục phiên
```

Refresh token nằm ở cookie path-scoped `/api/refresh-token`, JS không đọc được và không gửi kèm các
API khác.

## Ảnh sản phẩm

- DTO sản phẩm trả `imageUrl` (đường dẫn `file_path`); frontend dựng URL bằng `mediaUrl()` ->
  `/media/<file_path>`.
- `/media/*` được Next **rewrite** sang `INTERNAL_API_URL/media/*` (ảnh first-party). Khác với API
  dữ liệu/auth (gọi thẳng backend), ảnh đi qua Next.

## Các module `lib/api/`

| Module | Nhóm endpoint |
|---|---|
| `catalog.ts` | sản phẩm, danh mục, option/SKU, ảnh, tìm kiếm, review công khai |
| `account.ts` | đơn của tôi, preview/tạo/thanh toán đơn, đổi mật khẩu, wishlist, review, quyền của tôi |
| `address.ts` | sổ địa chỉ (CRUD + đặt mặc định) |
| `auth-email.ts` | xác minh email, quên/đặt lại mật khẩu, OTP |
| `payments.ts` | callback cổng thanh toán giả lập |
| `notifications.ts` | hộp thư, đếm chưa đọc, đánh dấu đọc, broadcast |
| `recommendations.ts` | trending / for-you / recently-viewed / related |
| `admin.ts` | sản phẩm (managed), danh mục, coupon, đơn (đổi trạng thái giao), user, dashboard |

Danh sách endpoint đầy đủ + quyền: xem [API](https://github.com/nguyen-huu-thang/xime-shop-example/blob/main/docs/api.md)
ở repo backend.

## Cấu hình kết nối

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL backend cho production (browser gọi thẳng) |
| `NEXT_PUBLIC_API_PORT` | Cổng backend khi dev tự suy host theo trình duyệt |
| `INTERNAL_API_URL` | Base URL backend cho SSR + rewrite `/media` (phía server) |

Trong dev không cần đổi env khi chuyển giữa `localhost` và IP LAN: `apiBase()` tự dùng host của trình
duyệt + cổng backend.

## Lưu ý self-service vs quản trị

- Thao tác trên dữ liệu của chính mình (giỏ, wishlist, đặt đơn, đánh giá) chỉ cần đăng nhập.
- Truy cập dữ liệu toàn hệ thống/của người khác cần quyền tương ứng; người không quyền nhận 403.
- Trang chi tiết đơn/giỏ/wishlist gửi token và xử lý 401/403 (chống IDOR ở backend).
