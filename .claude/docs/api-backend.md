# Bản đồ API backend (shop/backend - Python/Xime)

> ⚠️ **Đã có cập nhật 2026-06-25:** xem [`cap-nhat-backend-2026-06-25.md`](cap-nhat-backend-2026-06-25.md)
> (user_controller, count endpoints, review theo SP, me/permissions, cart/wishlist shape mới). File
> này đã được chỉnh theo các thay đổi đó.
>
> Nguồn: đọc trực tiếp `app/controller/*.py` + `app/dto/**` ngày 2026-06-25.
> Backend chạy cổng **8088**. Mọi route dưới tiền tố `/api` (trừ `/media`).
> Phản hồi thành công: trả **thẳng** dữ liệu (dict/list), KHÔNG bọc envelope `{success,...}`.
> Phản hồi lỗi: `{ "errorKey": "E2025", "code": 2025, "message": "..." }` kèm đúng HTTP status.
> Lỗi validation Pydantic: `errorKey = E10711` (kèm `details`).

## Quy ước chung

- **Phân trang:** query `page` (mặc định 1) + `limit` (mặc định 10). List trả **list thuần**; tổng số lấy qua endpoint `count` riêng (`/api/products/count`, `/api/orders/count`, `/api/cart/count`, `/api/files/count`, `/api/users/count` → `{total}`). `/search/products` trả dict có sẵn `total`.
- **Auth:** header `Authorization: Bearer <accessToken>`. Không có header = ẩn danh (controller tự chặn bằng `require_login` → lỗi `E2025` nếu cần đăng nhập).
- **camelCase** ở hầu hết response (userId, totalAmount, productOptionId...). Request nhận cả camelCase lẫn snake_case (alias).

## Auth / Security (`/api`)

| Method | Path | Body / Query | Trả về | Ghi chú |
|---|---|---|---|---|
| POST | `/api/login` | `{username, password}` | `{accessToken}` | Đặt refresh token vào **httpOnly cookie** `refreshToken`, Path=`/api/refresh-token` |
| POST | `/api/refresh-token` | (cookie refresh) | `{accessToken}` | Đọc cookie, xoay refresh mới, trả access mới |
| GET | `/api/logout` | (Bearer) | `{message}` | Blacklist access + xóa cookie refresh |
| POST | `/api/change-password` | `{currentPassword, newPassword}` | `{message}` | Cần đăng nhập |
| POST | `/api/verify-password` | `{password}` | `{message}` | Cần đăng nhập |

> ✅ **Đã có `user_controller`** (cập nhật 2026-06-25): `POST /api/register` (công khai → `{message}`,
> không auto-login), `GET/PUT /api/me`, `GET /api/me/permissions`, và CRUD `/api/users` (admin). Chi
> tiết shape: [`cap-nhat-backend-2026-06-25.md`](cap-nhat-backend-2026-06-25.md) mục 1+4.
> Thông tin nhanh vẫn có thể lấy từ JWT (`uid`, `username`, `email`); phone/address phải gọi `/api/me`.

## User / Account (`/api`)

| Method | Path | Quyền | Body / Trả về |
|---|---|---|---|
| POST | `/api/register` | công khai | `{username, email, password, phone?, address?}` → `{message}` (201). Trùng: username E1006, email E1001 |
| GET | `/api/me` | đăng nhập | → `{id, username, email, phone, address, is_active}` |
| PUT | `/api/me` | đăng nhập | `{email?, phone?, address?}` (≥1 trường) → user |
| GET | `/api/me/permissions` | đăng nhập | → `string[]` quyền hiệu lực (gate UI admin) |
| GET | `/api/users?page=&limit=` | `view_users` | `UserResponse[]` (gồm cả user bị khóa) |
| GET | `/api/users/count` | `view_users` | `{total}` |
| GET | `/api/users/{id}` | `view_user_details` | `UserResponse` |
| POST | `/api/users` | `create_user` | `{username, email, password, phone?, address?, isActive?}` → `UserResponse` |
| PUT | `/api/users/{id}` | `edit_user`/chính chủ | mọi trường tùy chọn → `UserResponse` |
| PATCH | `/api/users/{id}/active` | `activate_deactivate_user` | `{isActive}` → `UserResponse` |
| DELETE | `/api/users/{id}` | `delete_user` | `{message}` (chặn xóa admin/superadmin - E10101) |

> `UserResponse` = `{id, username, email, phone, address, is_active}` (snake_case).

## Product (`/api/products`)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/products?page=&limit=` | Danh sách phân trang |
| GET | `/api/products/{id}` | Chi tiết SP |
| GET | `/api/products/by-category/{categoryId}` | SP theo danh mục |
| GET | `/api/products/{id}/option-default` | Option mặc định (giá + tồn) |
| POST | `/api/products/{id}/find-option` | Body = tổ hợp giá trị lựa chọn → `{id, price, stock}` |
| GET | `/api/products/options/{optionId}` | Giá trị của 1 option |
| POST | `/api/products` | Tạo (quyền `create_product`). Body: `name, locationAddress, description?, categoryId?, discountPercentage?, price?, stock, attribute?` |
| PUT | `/api/products/{id}` | Sửa (quyền `edit_product`) |
| DELETE | `/api/products/{id}` | Xóa (quyền `delete_product`) |
| POST | `/api/products/{id}/attribute` | Cập nhật thuộc tính + option (SKU). Body: `{attribute: [...], value: [[[attr_values],[price,stock]], ...]}` |

> **Cơ chế option (SKU):** SP có nhiều `attribute` (size, màu...), mỗi attribute nhiều giá trị. Chọn đủ mỗi hàng 1 giá trị → 1 `product_option` (giá + tồn). SP không lựa chọn → vẫn có 1 option mặc định. Giỏ hàng/đơn hàng làm việc theo **productOptionId**, không theo product.

## Category (`/api/categories`)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/categories` | Tất cả (kèm `hierarchyPath`, `hierarchyPathById`) |
| GET | `/api/categories/{id}` | Chi tiết |
| GET | `/api/categories/{id}/subcategories` | Danh mục con |
| POST/PUT/DELETE | `/api/categories[/{id}]` | CRUD (quyền create/edit/delete_category). Cây cha-con qua `parentId` |

## Cart (`/api/cart`) - cần đăng nhập

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/cart` | Giỏ của user. Item: `{id, userId, productId, productName, productOptionId, price, quantity, subtotal, optionValues}` |
| GET | `/api/cart/count` | Tổng số item (quyền `view_carts`) → `{total}` |
| GET | `/api/cart/all?page=&limit=` | Tất cả (quyền `view_carts`) |
| GET | `/api/cart/{id}` | 1 item (chủ sở hữu hoặc quyền) |
| POST | `/api/cart` | Thêm. Body `{productOptionId, quantity}` (quyền `create_cart`) |
| PUT | `/api/cart/{id}` | Sửa số lượng `{quantity}` |
| DELETE | `/api/cart/{id}` | Xóa |

## Wishlist (`/api/wishlist`) - cần đăng nhập

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/wishlist` | Wishlist của user `[{wishlistId, productId, name}]` |
| GET | `/api/wishlist/all` | Tất cả (quyền `view_wishlists`) |
| POST | `/api/wishlist` | Thêm `{productId}` (wishlist theo **product**) |
| DELETE | `/api/wishlist/{wishlistId}` | Xóa theo `wishlistId` lấy từ list |

## Order (`/api/orders`) - cần đăng nhập

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/orders` | Đơn của user. Item: `{id, userId, address, totalAmount, paymentMethod, shippingStatus, paymentStatus(bool), details:[{id,name,price,quantity,url}]}` |
| GET | `/api/orders/all?page=&limit=` | Tất cả (quyền `view_orders`) |
| GET | `/api/orders/{id}` | Chi tiết |
| POST | `/api/orders` | Tạo. Body `{cartIds:[...], address, paymentMethod}` → đặt từ các item giỏ |
| PUT | `/api/orders/{id}` | Sửa địa chỉ `{address}` |
| DELETE | `/api/orders/{id}` | Xóa (quyền `delete_order`) |

> ⚠️ `OrderCreateRequest` **không nhận coupon**. Entity có `coupon_id` nullable nhưng luồng áp mã giảm giá lúc đặt hàng chưa có API.

## Coupon (`/api/coupons`) - quyền quản trị

CRUD `{code, discount, startDate, endDate, isActive}`. GET list/detail cần `view_coupons`.

## Review (`/api/reviews`)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/reviews/product/{productId}?page=&limit=` | **Công khai** - review đã duyệt của SP (mới nhất trước) |
| GET | `/api/reviews` | Tất cả (quyền `view_reviews`) |
| GET | `/api/reviews/{id}` | Chi tiết |
| POST | `/api/reviews` | Tạo (cần đăng nhập) `{productId, userId, rating, comment}` |
| PUT | `/api/reviews/{id}` | Sửa |
| PATCH | `/api/reviews/{id}/approve` · `/disapprove` | Duyệt (quyền `approve_disapprove_review`) |
| DELETE | `/api/reviews/{id}` | Xóa |

## Search (`/api/search`)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/search/products?keywords=&min_price=&max_price=&page=&limit=` | Trả **dict** (có cấu trúc, lọc giá) |
| GET | `/api/search/all` · `/users` · `/groups` · `/orders` · `/cart` · `/products/category` | Trả list. `keywords` bắt buộc (rỗng → E10711) |

## File / Media

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/api/files` | Upload **multipart**: `file`, `description?`, `sort?`, `isActive?`, `productId?`, `reviewId?` → `{message,id,file}` |
| GET | `/api/files/product/{productId}` | Ảnh theo SP (public) |
| GET | `/api/files/review/{reviewId}` | Ảnh theo review (public) |
| GET | `/api/files[/all|/inactive|/{id}|/user/{id}]` | Quản trị (quyền `view_files`) |
| PUT/DELETE | `/api/files/{id}` | Sửa thông tin / xóa |
| GET | `/media/{key:path}` | **Phục vụ ảnh công khai** (hỗ trợ HTTP Range/ETag). `key` = cột `file_path` dạng `aa/bb/rest.ext` |

## Notification (`/api/notifications`) - cần đăng nhập

GET `` (quyền `view_notifications`), GET `/unread`, GET `/{id}`, POST `` (tạo), PATCH `/{id}/read`, PATCH `/read-all`, DELETE `/read`, DELETE `/{id}`.

## Dashboard (`/api/dashboard`)

GET `/stats` → `DashboardStats` (quyền `access_admin_dashboard`).

## Phân quyền (admin nâng cao)

- GET `/api/permission` → `list[str]` tên quyền (quyền `view_permissions`).
- `/api/group` (CRUD nhóm), `/api/group-member/*` (add/remove/check, lấy nhóm của user, user trong nhóm).
- `/api/group-permissions` và `/api/user-permissions` (assign/update/delete/check quyền cho nhóm/user).

> ✅ Để gate UI admin, dùng `GET /api/me/permissions` (trả `string[]` quyền hiệu lực) thay vì dò 403.
> Gọi 1 lần sau đăng nhập, cache phía client. JWT vẫn không nhồi quyền.
