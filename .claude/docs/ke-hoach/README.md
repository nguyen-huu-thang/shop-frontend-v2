# Kế hoạch code shop frontend (Next.js)

> Lập ngày 2026-06-25. Đọc cùng [`../api-backend.md`](../api-backend.md) (bản đồ API) và
> [`../../../CLAUDE.md`](../../../CLAUDE.md) (ngữ cảnh phiên).

## Bối cảnh

- `shop/frontend` **dựng mới** bằng Next.js (thư mục trước đó trống). Nguồn tham chiếu tính năng:
  bản React cũ `D:\code\JAVASCRIPT\Shop` (CRA + Redux + axios). Backend Python mới đã đổi nhiều API.
- **Stack** (theo các dự án anh em dental-clinic/spa...): Next 16 + React 19 + TypeScript +
  Tailwind v4 + shadcn/ui + react-hook-form + zod.
- **Quyết định riêng của shop (khác anh em):** KHÔNG dùng proxy. **Trình duyệt gọi thẳng backend**
  (`NEXT_PUBLIC_API_URL`). Next chỉ gọi backend phía server (`INTERNAL_API_URL`) cho **SEO/SSR** trang
  công khai. (Anh em đi qua `app/api/backend/[...path]` - shop bỏ lớp này.)
- **Mô hình token:** access token lưu RAM; refresh token là httpOnly cookie Path=`/api/refresh-token`
  trên domain backend. Lấy thông tin user bằng **giải mã JWT** (uid/username/email).

## Ba phần (theo yêu cầu)

| Phần | Mục tiêu | File |
|---|---|---|
| 1 | **Core** - hạ tầng, bảo mật, auth, tầng gọi API, làm cho khớp backend | [`phan-1-core.md`](phan-1-core.md) |
| 2 | **Tính năng** - port phần còn lại của frontend cũ + thêm tính năng mới backend đã có, khớp API | [`phan-2-tinh-nang.md`](phan-2-tinh-nang.md) |
| 3 | **Giao diện** - làm đẹp UI/UX, SEO hoàn chỉnh | [`phan-3-giao-dien.md`](phan-3-giao-dien.md) |

Thứ tự thực hiện: 1 → 2 → 3. Phần 1 xong mới chạy được phần 2.

## ⚠️ Khoảng trống / phụ thuộc backend (chốt trước khi tới bước liên quan)

1. **CORS + cookie cross-site (CHẶN phần auth no-proxy).** Backend hiện **chưa cấu hình CORS**, và
   `cookie.samesite="lax"`, `secure=false` (`resources/application.yml`). Trình duyệt gọi thẳng backend
   khác origin sẽ **không** gửi/nhận được cookie refresh. Cần backend: bật CORS (allow origin **cụ thể**
   của frontend + `allow_credentials=true`), đặt `cookie.samesite="none"` + `secure=true` (HTTPS).
   → Phối hợp với phía backend; tới Phần 1 bước 1.12 phải có trước khi auth chạy thật.
2. **Không có user_controller.** Backend thiếu: đăng ký (`register`), CRUD user, cập nhật profile/địa chỉ,
   lấy user hiện tại. → Trang `register`, sửa hồ sơ/địa chỉ, quản lý user (storemanager) **chưa có API**.
   Quyết định: chờ backend bổ sung, hay tạm ẩn các tính năng này. (Đổi mật khẩu/xác thực mật khẩu thì CÓ.)
3. **Phân trang thiếu tổng số.** API trả list thuần, không kèm `totalItems`. UI phân trang phải suy ra
   "hết trang" khi số phần tử `< limit`, hoặc đề nghị backend thêm endpoint đếm.
4. **Coupon không vào luồng đặt hàng.** `OrderCreateRequest` chỉ nhận `{cartIds, address, paymentMethod}`,
   không nhận coupon. Áp mã giảm giá lúc checkout chưa có API.
5. **Best-sell / special / suggest.** Bản cũ có các mục này (Redux slices + storemanager). Backend mới
   **không có endpoint riêng**; chỉ có `products.popularity`. Cần chốt nguồn dữ liệu cho các mục trang chủ.
6. **Quyền của client.** JWT không chứa danh sách quyền. Để gate UI admin: tạm dựa vào 403, hoặc đề nghị
   backend trả quyền khi đăng nhập.

## Quy ước khi code

- Giao tiếp tiếng Việt; comment code: tiếng Anh trên, tiếng Việt dưới.
- Không dùng gạch ngang dài (—) hay en dash (–); chỉ dùng dấu trừ (-).
- Bám sát hình dạng API trong [`../api-backend.md`](../api-backend.md). Khi nghi ngờ field, đọc lại
  `app/dto/**` của backend.
- Đánh dấu tiến độ bằng `[x]` trong từng file phần khi hoàn thành.
