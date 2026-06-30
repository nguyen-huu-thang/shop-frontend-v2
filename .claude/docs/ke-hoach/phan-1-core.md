# Phần 1 - Core (hạ tầng, bảo mật, khớp backend)

> ✅ **HOÀN TẤT 2026-06-25.** Khung Next 16 dựng xong, `npm install` OK, `tsc --noEmit` sạch,
> `next build` thành công. Backend đã bật CORS + cookie cross-site (dev lax, prod none/secure).
> Trang chủ tạm (`app/page.tsx`) + widget `AuthDemo` để smoke-test SSR và đăng nhập gọi thẳng backend
> (sẽ thay ở Phần 2). Bước tiếp theo: **Phần 2**.

**Mục tiêu:** Dựng khung Next.js + tầng gọi API + xác thực **khớp đúng backend Python**, theo mô hình
**không proxy** (trình duyệt gọi thẳng backend, Next SSR cho SEO). Xong phần này, mỗi tính năng ở Phần 2
chỉ còn việc dựng trang + gọi hàm API có sẵn.

> Tham chiếu: [`../api-backend.md`](../api-backend.md), mẫu lib của dental-clinic
> (`D:\code\Monolithic\dental-clinic\frontend\src\lib`). Lưu ý: mẫu anh em **có proxy**, shop phải
> chỉnh tầng client gọi thẳng backend.

## A. Khởi tạo dự án

- [x] **1.1** Tạo app Next 16 + TS theo cấu hình anh em. Copy & chỉnh: `package.json`, `tsconfig.json`,
  `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `.gitignore`,
  `AGENTS.md`. (⚠️ Cài package - xin phép người dùng trước khi `npm install`.)
- [x] **1.2** Khởi tạo Tailwind v4 + shadcn/ui; thêm các component cơ sở dùng tới (button, input, form,
  dialog, table, card, select, sonner, skeleton...).
- [x] **1.3** Cấu trúc thư mục: `src/app` (routes), `src/components/{ui,site,admin}`, `src/lib`.
- [x] **1.4** `.env.local` + `.env.example`:
  - `NEXT_PUBLIC_API_URL` - base backend cho **trình duyệt** (vd `https://shop.scime.click` hoặc dev
    `http://localhost:8088`).
  - `INTERNAL_API_URL` - base backend cho **SSR** (vd `http://localhost:8088`).
  - `NEXT_PUBLIC_SITE_URL` - URL public của site (sitemap/canonical/OG).

## B. Cấu hình & tiện ích nền

- [x] **1.5** `lib/config.ts`: export `NEXT_PUBLIC_API_URL` (client), `INTERNAL_API_URL` (server),
  `SITE_URL`, `IS_PROD`. (Bỏ các hằng cookie proxy của anh em - shop không tự quản cookie.)
- [x] **1.6** `lib/api-error.ts`: lớp `ApiError(status, body)` đọc `{errorKey, code, message}`; helper
  lấy message hiển thị + nhận diện validation `E10711` (kèm `details`).
- [x] **1.7** `lib/jwt.ts`: `decodeJwt(token)` → `{uid, username, email, exp}` (chỉ giải mã, không verify).
- [x] **1.8** `lib/types.ts`: kiểu TS khớp DTO backend: `Product`, `ProductOption`, `OptionValue`,
  `Category` (có `hierarchyPath`), `CartItem`, `Order`/`OrderDetail`, `Review`, `Coupon`, `FileItem`,
  `Notification`. Bám camelCase trong [`../api-backend.md`](../api-backend.md).

## C. Tầng gọi API

- [x] **1.9** `lib/server-api.ts` (chỉ dùng trong Server Component / SSR): `serverFetch` gọi
  `INTERNAL_API_URL` cho dữ liệu **công khai** phục vụ SEO: danh sách/chi tiết sản phẩm, danh mục,
  search, review/ảnh công khai. Có `revalidate` (ISR) + `serverFetchOrNull` (404 → `notFound()`).
- [x] **1.10** `lib/api-client.ts` (trình duyệt): `publicFetch<T>(path, init)` gọi **thẳng**
  `NEXT_PUBLIC_API_URL` (KHÔNG qua `/api/backend`). Luôn đặt `credentials: "include"` để cookie refresh
  cross-site hoạt động. Parse lỗi → `ApiError`.

## D. Xác thực (mô hình không proxy)

- [x] **1.11** `lib/auth-context.tsx` (chỉnh từ mẫu anh em, bỏ route handler proxy):
  - Access token giữ trong RAM (`useRef` + state), KHÔNG localStorage/cookie.
  - `login(username,password)` → `POST {NEXT_PUBLIC_API_URL}/api/login` với `credentials:"include"`;
    lưu `accessToken`; `decodeJwt` ra user. Backend tự Set-Cookie refresh (httpOnly) trên domain backend.
  - `requestRefresh()` → `POST {NEXT_PUBLIC_API_URL}/api/refresh-token` với `credentials:"include"`
    (trình duyệt tự gửi cookie refresh vì path khớp). Trả access mới hoặc null.
  - `logout()` → `GET {NEXT_PUBLIC_API_URL}/api/logout` kèm Bearer; xóa token RAM.
  - `authFetch<T>(path, init)`: gắn `Authorization: Bearer`, `credentials:"include"`; gặp **401** thì
    refresh **một lần** rồi gọi lại; thất bại → đăng xuất.
  - Khôi phục phiên khi mount: gọi `requestRefresh()` 1 lần.
- [x] **1.12** ⚠️ **Phối hợp backend (CHẶN auth thật):** backend phải bật CORS (allow origin cụ thể của
  frontend + `allow_credentials`), `cookie.samesite="none"` + `secure=true`. Xem
  [`luu-y-cau-hinh-cors.md`](../../../backend/.claude/docs/luu-y-cau-hinh-cors.md). Dev có thể tạm test
  same-origin/localhost, nhưng luồng refresh cross-site chỉ đúng khi backend chỉnh xong.
- [x] **1.13** Guard phía client: `useAuth()` + component bảo vệ route (chuyển hướng `/login` khi chưa
  đăng nhập). Gate UI admin tạm theo 403 (xem khoảng trống #6 trong README).

## E. Khung layout & provider

- [x] **1.14** `app/layout.tsx`: bọc `AuthProvider`, `Toaster` (sonner), theme. Tách layout công khai
  (storefront) và `app/admin` (store manager).
- [x] **1.15** Trang kiểm thử nhanh: 1 trang gọi `serverFetch` lấy danh sách sản phẩm (xác minh SSR +
  `INTERNAL_API_URL`) và 1 nút login (xác minh `NEXT_PUBLIC_API_URL` + token RAM).

## Đầu ra Phần 1

Khung Next chạy được; `serverFetch`/`publicFetch`/`authFetch` sẵn sàng; đăng nhập/đăng xuất/refresh khớp
backend (sau khi backend bật CORS); kiểu dữ liệu khớp DTO. Sẵn sàng dựng tính năng ở Phần 2.
