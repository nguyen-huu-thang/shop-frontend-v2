# Kiến trúc

## Tổng thể

Next.js App Router (React 19, TypeScript). Trang công khai render phía server (SSR) cho SEO; thao tác
cần đăng nhập chạy phía client.

```text
src/app/        route (App Router)
src/components/  thành phần UI (site / account / admin / ui)
src/lib/         tầng tích hợp + state (api, auth, cart, config, types)
```

## Mô hình không proxy

Khác nhiều dự án dùng Next làm proxy, shop cho **trình duyệt gọi thẳng backend**:

```text
Trình duyệt ──(data + auth API, JSON)──►  Backend  (NEXT_PUBLIC_API_URL / apiBase)
Next (server) ──(SSR trang công khai)───►  Backend  (INTERNAL_API_URL)
Trình duyệt ──(/media/* ảnh)──► Next ──rewrite──►  Backend /media/*
```

- **Data/auth**: gọi thẳng từ trình duyệt. Trong dev, `apiBase()` tự suy host theo trình duyệt đang
  mở (localhost hoặc IP LAN) + cổng backend, nên không phải sửa env khi đổi giữa localhost và IP LAN.
- **SSR**: Server Component dùng `server-api.ts` với `INTERNAL_API_URL`.
- **Ảnh**: chỉ `/media/:path*` được rewrite qua Next (ảnh first-party, ẩn cổng backend, hợp next/image).

Biến môi trường: xem bảng trong [README](../README.md#biến-môi-trường).

## Xác thực (token)

```text
login ─► backend trả accessToken (body) + đặt refresh httpOnly cookie (Path=/api/refresh-token)
       │
       ├─ accessToken  → lưu RAM (state/ref trong auth-context), KHÔNG localStorage
       └─ refresh      → cookie httpOnly, JS không đọc; chỉ gửi tới /api/refresh-token

authFetch(path) ─► gắn Bearer accessToken
                  └─ nếu 401 → gọi /api/refresh-token một lần → thử lại
mở app ─► gọi /api/refresh-token để khôi phục phiên (nếu cookie còn hạn)
```

- Thông tin người dùng (`uid/username/email`) lấy bằng **giải mã JWT** ở client.
- Quyền không nằm trong JWT - lấy qua `GET /api/me/permissions` (để ẩn/hiện menu admin).

## Tầng `lib/`

| File / thư mục | Vai trò |
|---|---|
| `config.ts` | `NEXT_PUBLIC_*` + `apiBase()` (suy host khi dev) |
| `api-client.ts` | `publicFetch` - gọi endpoint công khai (browser) |
| `auth-context.tsx` | token RAM, `login/logout`, `authFetch` (Bearer + auto refresh) |
| `cart-context.tsx` | trạng thái giỏ hàng theo người dùng |
| `permissions-context.tsx` | nạp quyền hiệu lực để gate UI admin |
| `server-api.ts` | gọi backend phía server cho SSR |
| `api/` | gọi backend theo nhóm: `catalog`, `account`, `admin`, `address`, `notifications`, `recommendations`, `auth-email`, `payments` |
| `types.ts` | type TypeScript khớp DTO backend (lưu ý casing trộn) |
| `format.ts` | định dạng giá/ngày, `mediaUrl()` dựng URL ảnh |

## Server vs Client Component

- **Server Component** (mặc định): trang công khai SSR (chủ, danh mục, sản phẩm) - gọi `server-api.ts`.
- **Client Component** (`"use client"`): phần tương tác/đăng nhập (giỏ, checkout, tài khoản, admin,
  chuông thông báo) - gọi `publicFetch`/`authFetch`.

## Khu quản trị

`/admin` bọc trong `AdminShell` (RequireAuth + PermissionsProvider). Menu sidebar ẩn/hiện theo quyền
hiệu lực; nhưng **backend mới là nơi thực thi** - người không quyền có vào được layout cũng không gọi
được API.

## Điều hướng theo vai trò

Sau đăng nhập, frontend gọi `GET /api/me/permissions`:

- Có quyền (danh sách không rỗng) -> chuyển `/admin`.
- Khách hàng thường (rỗng) -> chuyển trang chủ.
