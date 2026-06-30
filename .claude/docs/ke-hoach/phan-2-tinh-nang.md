# Phần 2 - Tính năng (port frontend cũ + thêm tính năng mới, khớp backend)

> ✅ **HOÀN TẤT 2026-06-25** (`tsc` sạch, `next build` OK - 19 route).
>
> **Phần A - Storefront:** home, products (phân trang count), categories + [id], product detail
> (chọn option/giỏ/wishlist/ảnh + **liệt kê review** + form đánh giá), search (lọc giá + phân trang),
> cart (**tên/đơn giá/tạm tính**), checkout, wishlist (**xóa được**), account (**hồ sơ** + đơn hàng +
> đổi mật khẩu), login, register (đã chạy thật).
>
> **Phần B - Store manager (`/admin`):** shell riêng (tách qua `ConditionalShell`) + guard
> (`RequireAuth` + `PermissionsProvider` ẩn menu theo `/api/me/permissions`). Trang: dashboard,
> products (CRUD cơ bản - **editor SKU/thuộc tính để sau**), categories, coupons, orders (xem/xóa),
> reviews (duyệt), users (tạo/khóa/xóa).
>
> **Đã nối các cập nhật backend** (`cap-nhat-backend-2026-06-25.md`): user_controller, count endpoints,
> review theo SP, me/permissions, cart/wishlist shape mới.
>
> **Còn chờ backend (để trống/ẩn):** coupon trong đơn (#4), mục trang chủ best-sell/special/suggest
> (#5), ảnh trong product DTO (#8 - lưới + thumbnail giỏ chưa có ảnh). **Còn để sau:** editor
> thuộc tính/biến thể (SKU) của sản phẩm; đổi trạng thái giao/thanh toán đơn (backend chỉ cho sửa địa chỉ).

**Mục tiêu:** Dựng lại các trang/luồng của bản React cũ trên nền Next + tầng API ở Phần 1, **sửa cho khớp
API mới**, đồng thời bổ sung các tính năng backend mới có mà bản cũ chưa làm. Ưu tiên **đúng chức năng**,
chưa cần đẹp (Phần 3 lo UI).

> Map nguồn cũ: `D:\code\JAVASCRIPT\Shop\src` (pages/, components/, redux/, api/). Bỏ toàn bộ cây
> `components/test/*` (chỉ là bàn thử API). Redux → thay bằng state cục bộ + context (cart/auth), hoặc
> React Query nếu muốn (chốt khi làm).

## A. Storefront (khách hàng) - ưu tiên SEO, render server khi có thể

- [ ] **2.1 Trang chủ** (`home`): banner + các mục sản phẩm. ⚠️ best-sell/special/suggest chưa có endpoint
  riêng (khoảng trống #5) → tạm dùng `GET /api/products` hoặc theo `popularity`; chốt nguồn trước.
- [ ] **2.2 Danh mục** (`category`): `GET /api/categories` (cây cha-con qua `hierarchyPath`) +
  `GET /api/products/by-category/{id}`. Lọc/sort theo `filter.js` cũ.
- [ ] **2.3 Chi tiết sản phẩm** (`details`): SSR `GET /api/products/{id}` (cho SEO). Chọn thuộc tính →
  `POST /api/products/{id}/find-option` lấy `{price, stock}`; ảnh `GET /api/files/product/{id}` hiển thị
  qua `/media/{key}`; review của SP. Nút thêm giỏ/wishlist theo **productOptionId**.
- [ ] **2.4 Tìm kiếm** (`searchResult`): `GET /api/search/products?keywords=&min_price=&max_price=&page=&limit=`
  (trả dict). Lưu ý đường dẫn/định dạng khác bản cũ (cũ check `status==="success"`, mới trả thẳng).
- [ ] **2.5 Giỏ hàng** (`cart`): `GET/POST/PUT/DELETE /api/cart`. Item mới có `optionValues`. Tính tiền,
  sửa số lượng, xóa. Thay `cartSlice`.
- [ ] **2.6 Yêu thích** (`love`): `GET/POST/DELETE /api/wishlist`. Thay `loveSlice`.
- [ ] **2.7 Đặt hàng / thanh toán** (`payments`): `POST /api/orders {cartIds, address, paymentMethod}`.
  ⚠️ Không truyền coupon (khoảng trống #4). `paymentStatus` là boolean, `shippingStatus` chuỗi.
- [ ] **2.8 Tài khoản** (`account`): lịch sử mua `GET /api/orders`; đổi mật khẩu
  `POST /api/change-password`; xác thực mật khẩu `POST /api/verify-password`. ⚠️ Sửa hồ sơ/địa chỉ
  (`changeprofile`, `addressdata`) **chưa có API** (khoảng trống #2) → tạm ẩn/chờ backend.
- [ ] **2.9 Đăng nhập** (`login`): dùng `auth-context.login`. ⚠️ **Đăng ký** (`register`) **chưa có API**
  → tạm ẩn hoặc chờ backend bổ sung.

## B. Store manager (quản trị) - `app/admin`, dùng `authFetch`

- [ ] **2.10 Sản phẩm**: list/tạo/sửa/xóa `(/api/products...)`; quản lý thuộc tính + option (SKU) qua
  `POST /api/products/{id}/attribute`. Map từ `storemanager/{addproduct,editproduct,attributes,...}`.
- [ ] **2.11 Danh mục**: CRUD + cây (`treemapCategories`, `treeSelect` cũ) → `/api/categories`.
- [ ] **2.12 Coupon**: CRUD `/api/coupons` (tính năng mới so với UI cũ).
- [ ] **2.13 Duyệt review**: `/api/reviews` + `PATCH approve|disapprove` (mới).
- [ ] **2.14 Đơn hàng**: `GET /api/orders/all`, xem chi tiết, sửa/xóa.
- [ ] **2.15 File/Media**: upload multipart `POST /api/files`; quản lý list/inactive; hiển thị `/media/{key}`.
- [ ] **2.16 Thông báo**: `/api/notifications` (list, unread, đánh dấu đã đọc, xóa) (mới).
- [ ] **2.17 Dashboard**: `GET /api/dashboard/stats` (mới).
- [ ] **2.18 Phân quyền (nâng cao, tùy chọn)**: group, group-member, group/user-permission, danh sách
  quyền `GET /api/permission`. Map từ `groupApi`, `groupMemberApi`, `groupPermissionApi`,
  `userPermissionApi` cũ.

## C. Tính năng mới backend đã thêm (đảm bảo có UI)

- [ ] **2.19** Lọc giá khi tìm kiếm (`min_price`/`max_price`); duyệt review; coupon; wishlist;
  notifications (unread + đánh dấu đọc); dashboard stats; phục vụ ảnh qua `/media` (Range/ETag).

## Đầu ra Phần 2

Toàn bộ storefront + store manager chạy đúng nghiệp vụ, khớp API mới; các khoảng trống backend được đánh
dấu rõ (ẩn hoặc chờ). Chưa trau chuốt UI.
