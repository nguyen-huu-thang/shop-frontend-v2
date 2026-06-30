# Cập nhật backend cho frontend - 2026-06-30

> Tiếp nối [`cap-nhat-backend-2026-06-25.md`](cap-nhat-backend-2026-06-25.md). Ghi các thay đổi backend
> từ 25/06 → 30/06 để phiên frontend sau đồng bộ. Backend ở `D:\code\Monolithic\shop\backend`
> (repo riêng). Phản hồi thành công trả thẳng dữ liệu; lỗi `{errorKey, code, message}`.

## TL;DR - cần làm gì ở frontend

1. **Gợi ý sản phẩm (MỚI)** - đã có endpoint cho "đã xem gần đây / thịnh hành / gợi ý cho bạn /
   mua cùng". Lấp đúng khoảng trống best-sell/special/suggest mà CLAUDE.md frontend đang treo.
2. **Trang quản trị sản phẩm:** dùng `GET /api/products/managed` (lọc theo mảng nhân viên) thay vì
   list công khai khi vào khu admin.
3. **Bảo mật (THAY ĐỔI hành vi):** các trang chi tiết đơn / wishlist / cart **bắt buộc đăng nhập +
   đúng chủ**; gọi thiếu token hoặc không phải chủ sẽ nhận 403/401. Đảm bảo gửi auth.
4. Không có thay đổi shape DTO sản phẩm (tối ưu N+1 chỉ chạy ngầm). Ảnh trong product DTO **vẫn chưa có**.

---

## 1. Endpoint gợi ý / cá nhân hóa (MỚI - `recommendation_controller`)

Tất cả trả về **mảng product DTO** (cùng shape với list sản phẩm thường: id, name, price, stock,
attribute, categoryId, discountPercentage...). Tham số `limit` (mặc định 10).

| Method | Path | Quyền | Dùng cho |
|---|---|---|---|
| GET | `/api/recommendations/recently-viewed?limit=` | đăng nhập | Widget "Đã xem gần đây" |
| GET | `/api/recommendations/trending?limit=` | công khai | "Thịnh hành / Bán chạy" (kiêm fallback khách mới) |
| GET | `/api/recommendations/for-you?limit=` | đăng nhập | "Gợi ý cho bạn" (cold-start → tự trả trending) |
| GET | `/api/products/{id}/related?limit=` | công khai | "Sản phẩm hay mua cùng" ở trang chi tiết |
| POST | `/api/recommendations/admin/rebuild-cooccurrence` | `manage_recommendations` | Nút admin dựng lại "mua cùng" (tùy chọn) |

**Ghi tín hiệu là TỰ ĐỘNG ở backend** - frontend KHÔNG phải gọi API ghi log. Khi user **đã đăng nhập**:
xem chi tiết sản phẩm, thêm giỏ, thêm wishlist, đặt hàng → backend tự ghi để dựng gợi ý. Khách chưa
đăng nhập thì chưa cá nhân hóa (chỉ thấy trending/related công khai).

> Lưu ý: `for-you` và `recently-viewed` chỉ có dữ liệu sau khi user đăng nhập + có tương tác. Trang
> mới tinh có thể rỗng → nên có empty-state hoặc fallback sang trending.

## 2. Danh sách sản phẩm cho quản trị (MỚI)

| Method | Path | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/products/managed?page=&limit=` | đăng nhập | Chỉ sản phẩm thuộc **mảng category nhân viên phụ trách**; superadmin thấy tất cả |
| GET | `/api/products/managed/count` | đăng nhập | Tổng cho phân trang trang admin |

Storefront công khai `GET /api/products` **giữ nguyên** (không lọc). Khu `/admin` quản lý sản phẩm
nên chuyển sang `/managed` để nhân viên chỉ thấy phần mình phụ trách.

## 3. Bảo mật chi tiết (THAY ĐỔI hành vi - vá IDOR)

Các endpoint chi tiết sau giờ **bắt buộc đăng nhập** và **chỉ chủ sở hữu** (hoặc người có quyền tương
ứng) mới xem được; trước đây lỏng hơn:

- `GET /api/orders/{id}` - chủ đơn hoặc quyền `view_order_details`.
- `GET /api/wishlist/{id}` - chủ wishlist hoặc quyền `view_wishlists`.
- `GET /api/cart/{id}` - chủ giỏ hoặc quyền `view_carts`.

→ Frontend phải gửi access token cho các trang này; người lạ truy cập id không phải của mình sẽ nhận
**403 (`E2021`)** hoặc **401 (`E2025`)** nếu chưa đăng nhập. Hiển thị thông báo phù hợp.

## 4. Quyền mới

- `manage_recommendations` - chỉ dùng cho nút admin rebuild co-occurrence (mục 1). Quyền hiệu lực của
  user vẫn lấy qua `GET /api/me/permissions` như cũ.

## 5. Ngầm, không ảnh hưởng frontend (chỉ để biết)

- **Tối ưu N+1 product/variant:** list sản phẩm nhanh hơn nhiều, **shape DTO không đổi**.
- **Phân quyền nâng cấp:** scope theo nhánh category, deny-overrides - tác động phía backend.
- **Scheduler:** backend tự dựng lại "mua cùng" mỗi đêm; frontend không cần làm gì.

## Vẫn CHƯA có (frontend tiếp tục để trống/ẩn)

- **Ảnh trong product DTO** - vẫn phải lấy ảnh riêng qua `/api/files/product/{product_id}` (như cũ).
- **Coupon trong luồng đặt hàng** - chưa nối.
- **Trang thanh toán (checkout/payment) + Email** - backend **chưa thiết kế**; frontend chờ.

## Cần sửa trong `api-backend.md`

Bổ sung nhóm endpoint **recommendations** + `/api/products/managed` + `/api/products/{id}/related`;
ghi chú thay đổi auth ở 3 endpoint chi tiết (order/wishlist/cart). Cập nhật mục "khoảng trống":
best-sell/special/suggest **đã có** (dùng recommendations).
