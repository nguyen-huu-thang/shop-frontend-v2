# Cập nhật backend cho frontend - 2026-06-25

> Backend vừa bổ sung loạt API mà frontend đang chờ (theo `backend/.claude/docs/viec-can-lam-cho-frontend.md`).
> File này liệt kê **những gì mới + shape chính xác** để frontend nối thẳng, và **những chỗ trong
> [`api-backend.md`](api-backend.md) đã lỗi thời** cần sửa lại.
>
> Quy ước không đổi: backend cổng **8088**, mọi route dưới `/api`, phản hồi trả thẳng dữ liệu (không
> bọc envelope), lỗi dạng `{errorKey, code, message}`. Auth: `Authorization: Bearer <accessToken>`.

---

## 1. User: đăng ký + hồ sơ + quản trị (MỚI - `user_controller`)

Trước đây KHÔNG có. Nay đã có đầy đủ. Mở được các trang: `register`, `account/profile`,
`account/address`, và phần quản lý user trong store manager.

### Công khai

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/api/register` | `{username, email, password, phone?, address?}` | `{message}` (201) |

- **KHÔNG auto-login.** Đăng ký xong backend chỉ trả `{message}`. Frontend tự chuyển sang `/login`
  để người dùng đăng nhập.
- Ràng buộc DTO: `username` 3-20 ký tự, `email` 3-255, `password` **>= 6 ký tự**, `phone` <= 15,
  `address` <= 255.
- Lỗi trùng: username -> `E1006` (409), email -> `E1001` (409). Hiển thị "đã tồn tại" cho người dùng.

### Cần đăng nhập (user tự thao tác)

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/api/me` | (Bearer) | `{id, username, email, phone, address, is_active}` |
| PUT | `/api/me` | `{email?, phone?, address?}` (cần >= 1 trường) | user đã cập nhật |
| GET | `/api/me/permissions` | (Bearer) | `string[]` - xem mục 4 |

- `/api/me` cho lấy **phone + address** mà JWT không có. Vẫn có thể giải mã JWT để lấy nhanh
  `uid/username/email`, nhưng muốn phone/address thì gọi `/api/me`.
- `PUT /api/me` đổi email trùng người khác -> `E1001`.

### Quản trị user (admin - theo quyền)

| Method | Path | Quyền | Body / Trả về |
|---|---|---|---|
| GET | `/api/users?page=&limit=` | `view_users` | `UserResponse[]` (gồm **cả user đang khóa**) |
| GET | `/api/users/count` | `view_users` | `{total}` |
| GET | `/api/users/{id}` | `view_user_details` | `UserResponse` |
| POST | `/api/users` | `create_user` | `{username, email, password, phone?, address?, isActive?}` -> `UserResponse` (201) |
| PUT | `/api/users/{id}` | `edit_user` hoặc chính chủ | mọi trường tùy chọn (cần >= 1) -> `UserResponse` |
| PATCH | `/api/users/{id}/active` | `activate_deactivate_user` | `{isActive}` -> `UserResponse` |
| DELETE | `/api/users/{id}` | `delete_user` | `{message}` |

- `UserResponse` = `{id, username, email, phone, address, is_active}`.
- DELETE chặn xóa tài khoản `admin`/`superadmin` -> `E10101`.
- Danh sách admin trả **cả user đang khóa** (khác bản PHP cũ chỉ trả active) để admin kích hoạt lại.

---

## 2. Phân trang: đã có endpoint đếm tổng (MỚI)

Trước đây list trả list thuần, không biết tổng số trang. Nay thêm endpoint `count` riêng (KHÔNG đổi
shape list cũ - không breaking). Frontend gọi **list + count** để vẽ số trang chính xác.

| Path | Quyền | Trả về |
|---|---|---|
| GET `/api/products/count` | công khai | `{total}` |
| GET `/api/orders/count` | `view_orders` | `{total}` |
| GET `/api/cart/count` | `view_carts` | `{total}` |
| GET `/api/files/count` | `view_files` | `{total}` |
| GET `/api/users/count` | `view_users` | `{total}` |

- `products/count` đếm sản phẩm chưa xóa mềm (khớp với `GET /api/products`).
- Số trang = `Math.ceil(total / limit)`.

---

## 3. Review công khai theo sản phẩm (MỚI)

| Method | Path | Trả về |
|---|---|---|
| GET | `/api/reviews/product/{productId}?page=&limit=` | `ReviewResponse[]` |

- **Công khai, KHÔNG cần đăng nhập.** Chỉ trả review `is_approved=true` của sản phẩm, mới nhất trước,
  có phân trang. Dùng cho phần "đánh giá" trên trang chi tiết sản phẩm.
- Gửi đánh giá vẫn là `POST /api/reviews` (cần đăng nhập) `{productId, userId, rating, comment}`.
- `ReviewResponse` = `{id, product_id, user_id, rating, comment, is_approved}`.

---

## 4. Quyền hiệu lực của user (MỚI - thay cho dò 403)

| Method | Path | Trả về |
|---|---|---|
| GET | `/api/me/permissions` | `string[]` |

- Trả tên các quyền user hiện tại **thực sự có**, ví dụ `["create_product", "view_orders", ...]`.
- Dùng để **ẩn/hiện menu store manager** thay vì gọi thử rồi bắt `403 (E2021)`.
- JWT vẫn KHÔNG nhồi quyền (token gọn). Gọi 1 lần sau đăng nhập, cache phía client.

---

## 5. Cart item nay kèm tên + đơn giá (THAY ĐỔI shape)

`GET /api/cart` và `GET /api/cart/all` - mỗi item giờ trả thêm field:

```jsonc
{
  "id": 12,
  "userId": 3,
  "productId": 45,          // MỚI
  "productName": "Áo thun", // MỚI
  "productOptionId": 88,
  "price": 150000,          // MỚI - đơn giá option
  "quantity": 2,
  "subtotal": 300000,       // MỚI = price * quantity
  "optionValues": { "Size": "M", "Màu": "Đỏ" }
}
```

- Trang giỏ hàng hiển thị được tên/giá/thành tiền từng dòng + tự tính tạm tính client.
- Tổng cuối vẫn do backend chốt khi tạo đơn.
- `thumbnail` CHƯA có (phụ thuộc mục "ảnh trong product DTO" - xem phần Còn lại).

---

## 6. Wishlist list nay kèm id để xóa (THAY ĐỔI shape)

`GET /api/wishlist` nay trả:

```jsonc
[ { "wishlistId": 7, "productId": 45, "name": "Áo thun" } ]
```

- Xóa: `DELETE /api/wishlist/{wishlistId}` với `wishlistId` lấy từ list (trước đây list trả product
  id nên không xóa được).
- **Đính chính tài liệu cũ:** wishlist lưu theo **product**, `POST /api/wishlist` nhận `{productId}`
  (KHÔNG phải `productOptionId`). Không có lệch product/option.

---

## ⚠️ Cần sửa trong `api-backend.md` (đang lỗi thời)

- **Mục Auth (dòng 25):** bỏ cảnh báo "KHÔNG có /api/register, /api/users, /api/me" - nay đã có hết.
- **Quy ước phân trang (dòng 11):** nay có endpoint `count` riêng cho products/orders/cart/files/users.
- **Cart (dòng 57):** item shape có thêm `productId, productName, price, subtotal`.
- **Wishlist (dòng 68, 70):** list trả `[{wishlistId, productId, name}]`; POST nhận `{productId}`
  (không phải `productOptionId`).
- **Review (mục dòng 90):** thêm `GET /api/reviews/product/{productId}` (công khai).
- **Phân quyền (dòng 133):** nay đã có `GET /api/me/permissions` để gate UI - không cần dò 403 nữa.

---

## Còn lại CHƯA làm (frontend cứ để trống/ẩn)

- **Coupon trong đơn:** `POST /api/orders` vẫn chưa nhận `couponCode`. Chưa áp mã giảm giá lúc đặt.
- **Trang chủ best-sell/special/suggest:** chưa có endpoint. Để trống các section này.
- **Ảnh đại diện trong product DTO:** product list/detail chưa kèm ảnh. Vẫn lấy ảnh riêng qua
  `GET /api/files/product/{productId}`. Lưới sản phẩm + thumbnail giỏ hàng tạm chưa có ảnh.
