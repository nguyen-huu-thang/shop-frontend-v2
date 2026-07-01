# Tính năng

Mô tả các màn hình/luồng chính phía frontend. Dữ liệu đến từ backend (xem
[Tích hợp backend](tich-hop-backend.md)).

## Storefront (công khai)

| Trang | Đường dẫn | Ghi chú |
|---|---|---|
| Trang chủ | `/` | Hero, danh mục nổi bật (cấp 1, tối đa 8) + "Xem tất cả", lưới sản phẩm, các khối gợi ý |
| Danh mục | `/categories`, `/categories/[id]` | Liệt kê đầy đủ danh mục; sản phẩm theo danh mục |
| Sản phẩm | `/products`, `/products/[id]` | Lưới có ảnh; chi tiết: gallery, chọn biến thể (SKU), đánh giá, "hay mua cùng" |
| Tìm kiếm | `/search` | Tìm theo từ khóa |

- Card sản phẩm hiển thị ảnh đại diện (từ `imageUrl` của backend); trang chi tiết có đầy đủ gallery.
- Trang công khai render phía server (SSR) cho SEO; có sitemap/robots/JSON-LD.

## Mua hàng

| Trang | Đường dẫn | Ghi chú |
|---|---|---|
| Giỏ hàng | `/cart` | Sửa số lượng, xóa dòng (cần đăng nhập) |
| Yêu thích | `/wishlist` | Thêm/xóa theo sản phẩm |
| Thanh toán | `/checkout` | Chọn địa chỉ, áp coupon, xem trước tổng tiền, chọn COD / online |
| Thanh toán mô phỏng | `/payment/mock` | Trang cổng giả lập (nhận `ref`) |
| Đơn hàng | `/orders`, `/orders/[id]` | Lịch sử + chi tiết; bắt lỗi 401/403 |

Luồng checkout:

```text
Giỏ ─► chọn địa chỉ (sổ địa chỉ) ─► nhập coupon ─► preview tổng tiền
     ─► chọn COD / online ─► đặt hàng
            ├─ COD     → /orders/{id}
            └─ online  → /payment/mock → quay lại đơn (đã thanh toán)
```

## Tài khoản

Trang `/account` gồm: hồ sơ (email/phone/địa chỉ), **sổ địa chỉ** (CRUD + đặt mặc định), lịch sử đơn,
đổi mật khẩu, và **bảo mật email** (trạng thái xác minh, gửi lại email xác minh, OTP).

Luồng email bảo mật (trang riêng, công khai):

| Trang | Đường dẫn |
|---|---|
| Xác minh email | `/verify-email?token=...` |
| Quên mật khẩu | `/forgot-password` |
| Đặt lại mật khẩu | `/reset-password?token=...` |

> Khi backend chưa cấu hình SMTP, các luồng này gọi được nhưng email không gửi thật; trang vẫn hiển
> thị và cho dán token để thử.

## Thông báo in-app

Chuông ở header (chỉ khi đăng nhập): badge số chưa đọc (poll nhẹ), dropdown hộp thư, bấm để đánh dấu
đã đọc và điều hướng theo `link`, nút "đọc tất cả".

## Gợi ý / cá nhân hóa

| Khối | Vị trí | Nguồn |
|---|---|---|
| Thịnh hành | Trang chủ (cả khách) | `/api/recommendations/trending` |
| Gợi ý cho bạn | Trang chủ (đăng nhập) | `/api/recommendations/for-you` |
| Đã xem gần đây | Trang chủ (đăng nhập) | `/api/recommendations/recently-viewed` |
| Hay mua cùng | Trang chi tiết SP | `/api/products/{id}/related` |

Backend tự ghi tín hiệu khi user tương tác - frontend không gọi API ghi log. Khối rỗng thì tự ẩn.

## Khu quản trị (`/admin`)

| Trang | Chức năng |
|---|---|
| Tổng quan | Dashboard thống kê |
| Sản phẩm | Danh sách theo mảng phụ trách (`/products/managed`), tạo/sửa/xóa |
| Danh mục | CRUD danh mục |
| Mã giảm giá | CRUD coupon với đầy đủ trường nâng cấp (loại %/tiền, trần, đơn tối thiểu, phạm vi, giới hạn lượt, 1 lần/người) |
| Đơn hàng | Xem, đổi trạng thái giao hàng (backend tự thông báo cho chủ đơn) |
| Đánh giá | Duyệt/bỏ duyệt, xóa |
| Người dùng | Quản trị người dùng |
| Thông báo | Gửi broadcast tới mọi người dùng |

Menu ẩn/hiện theo quyền hiệu lực; backend vẫn thực thi quyền thật.
