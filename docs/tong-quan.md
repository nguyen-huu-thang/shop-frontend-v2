# Tổng quan

## Shop Frontend là gì?

Shop Frontend là **tầng giao diện** của ứng dụng thương mại điện tử shop, dựng bằng **Next.js + React**.
Nó hiển thị catalog, xử lý luồng mua hàng/thanh toán, tài khoản, thông báo và khu quản trị - nhưng
**không chứa nghiệp vụ hay cơ sở dữ liệu**. Mọi dữ liệu đến từ REST API của backend.

```text
Người dùng ─► Frontend (Next.js) ─► REST API ─► Backend (Python/XIME) ─► PostgreSQL
```

## Quan hệ với backend

| | |
|---|---|
| Backend | [nguyen-huu-thang/xime-shop-example](https://github.com/nguyen-huu-thang/xime-shop-example) |
| Vai trò frontend | Trình bày + tương tác; gọi thẳng API backend |
| Dữ liệu | 100% từ backend (không có DB riêng) |
| Triển khai | Độc lập với backend (chỉ cần trỏ đúng URL API) |

Frontend **cần backend chạy kèm**. Trong dev, backend mặc định ở cổng `8088`.

## Vì sao Next.js

- **SEO/SSR**: trang công khai (chủ, danh mục, sản phẩm) render phía server để máy tìm kiếm đọc được
  nội dung và tải nhanh.
- **App Router + React 19**: tổ chức route rõ ràng, Server/Client Component tách bạch.
- **Hệ sinh thái UI**: Tailwind v4 + shadcn/ui cho giao diện nhất quán, dễ mở rộng.

## Nguyên tắc chính

- **Không proxy dữ liệu**: trình duyệt gọi thẳng backend (xem [Kiến trúc](kien-truc.md)). Chỉ ảnh
  `/media` đi qua Next để là ảnh first-party.
- **Bảo mật token**: access token ở RAM, refresh token là httpOnly cookie do backend đặt - JS không
  đọc được.
- **Backend là nơi thực thi quyền**: frontend chỉ ẩn/hiện UI theo quyền; mọi kiểm tra thật ở backend.

## Đọc tiếp

- [Kiến trúc](kien-truc.md)
- [Tính năng](tinh-nang.md)
- [Tích hợp backend](tich-hop-backend.md)
