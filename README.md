# Shop Frontend (Next.js)

> Giao diện web cho ứng dụng thương mại điện tử **shop**, dựng bằng **Next.js + React**. Đây là tầng
> trình bày: nó gọi thẳng REST API của backend, không chứa nghiệp vụ hay cơ sở dữ liệu.

```text
Trình duyệt
   │
   ▼
Shop Frontend (Next.js)
   │  gọi thẳng REST API (JSON) + JWT  ─────────────►  Shop Backend
   │  riêng ảnh /media được rewrite qua Next        (Python / XIME)
   ▼
HTML render sẵn (SSR cho trang công khai, tốt cho SEO)
```

---

## Hệ sinh thái dự án

| Thành phần | Repo |
|---|---|
| **Frontend (repo này)** | [nguyen-huu-thang/shop-frontend-v2](https://github.com/nguyen-huu-thang/shop-frontend-v2) |
| **Backend (Python / XIME)** | [nguyen-huu-thang/xime-shop-example](https://github.com/nguyen-huu-thang/xime-shop-example) |
| Bản gốc React (frontend) | [nguyen-huu-thang/shop-frontend](https://github.com/nguyen-huu-thang/shop-frontend) |
| Bản gốc PHP/Symfony (backend) | [nguyen-huu-thang/shop-backend](https://github.com/nguyen-huu-thang/shop-backend) |

> Frontend này **cần backend chạy kèm** để hoạt động. Toàn bộ dữ liệu (sản phẩm, đơn hàng, người
> dùng...) đến từ API của backend. Bản đồ endpoint và mô hình tích hợp xem
> [`docs/tich-hop-backend.md`](docs/tich-hop-backend.md) và repo backend bên trên.

---

## Tính năng

- **Storefront**: trang chủ, danh mục, danh sách + chi tiết sản phẩm (ảnh, biến thể/SKU, đánh giá),
  tìm kiếm.
- **Giỏ hàng - Yêu thích - Đánh giá** theo người dùng đăng nhập.
- **Thanh toán**: sổ địa chỉ, áp mã giảm giá, xem trước tổng tiền, đặt hàng (COD / online giả lập),
  trang thanh toán mô phỏng, lịch sử + chi tiết đơn.
- **Tài khoản**: hồ sơ, đổi mật khẩu, xác minh email, quên/đặt lại mật khẩu, OTP.
- **Thông báo in-app**: chuông + badge chưa đọc trong header.
- **Gợi ý cá nhân hóa**: "thịnh hành", "gợi ý cho bạn", "đã xem gần đây", "hay mua cùng".
- **Khu quản trị (`/admin`)**: sản phẩm, danh mục, mã giảm giá, đơn hàng (đổi trạng thái giao), đánh
  giá, người dùng, gửi thông báo broadcast, dashboard thống kê. Menu ẩn/hiện theo quyền.

Chi tiết từng mảng xem [`docs/tinh-nang.md`](docs/tinh-nang.md).

---

## Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Ngôn ngữ | TypeScript |
| Giao diện | Tailwind CSS v4 + shadcn/ui + lucide-react |
| Form / validate | react-hook-form + zod |
| Theme | next-themes (sáng/tối) |
| Toast | sonner |

---

## Quyết định kiến trúc

- **Mô hình không proxy**: trình duyệt **gọi thẳng** backend qua `NEXT_PUBLIC_API_URL`. Next chỉ gọi
  backend phía server (`INTERNAL_API_URL`) cho **SSR/SEO** trang công khai. Riêng ảnh `/media` được
  rewrite qua Next để là ảnh first-party.
- **Token**: access token lưu **RAM** (không localStorage/cookie JS); refresh token là **httpOnly
  cookie** path-scoped do backend đặt. Thông tin người dùng lấy từ giải mã JWT.
- **Điều hướng theo vai trò sau đăng nhập**: có quyền quản trị -> `/admin`, khách hàng -> trang chủ.

Chi tiết: [`docs/kien-truc.md`](docs/kien-truc.md).

---

## Bắt đầu nhanh

### Yêu cầu

- Node.js 20+
- Backend đang chạy ở cổng `8088` (xem repo backend)

### Cài đặt và chạy

```bash
npm install
cp .env.example .env.local   # chỉnh nếu backend khác cổng/host
npm run dev                  # http://localhost:3000
```

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8088` | Base URL backend cho production (browser gọi thẳng) |
| `NEXT_PUBLIC_API_PORT` | `8088` | Cổng backend khi dev tự suy host theo trình duyệt |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL public của site (sitemap/robots/canonical/OG) |
| `INTERNAL_API_URL` | `http://localhost:8088` | Base URL backend cho SSR + rewrite `/media` (phía server) |

### Build production

```bash
npm run build
npm start
```

---

## Cấu trúc thư mục

```text
src/
├── app/                # App Router: route công khai + /admin + route động
│   ├── (storefront)    # trang chủ, products, categories, cart, checkout, orders...
│   ├── account/        # tài khoản, sổ địa chỉ, bảo mật email
│   └── admin/          # khu quản trị
├── components/
│   ├── site/           # header (chuông thông báo), footer, product-card, gợi ý...
│   ├── account/        # sổ địa chỉ, bảo mật email
│   ├── admin/          # admin shell
│   └── ui/             # shadcn/ui primitives
└── lib/
    ├── api/            # gọi backend theo nhóm (catalog, account, admin, address...)
    ├── auth-context.tsx# token RAM + refresh + authFetch
    ├── cart-context.tsx# giỏ hàng
    ├── config.ts       # NEXT_PUBLIC_* + apiBase()
    ├── server-api.ts   # gọi backend phía server (SSR)
    └── types.ts        # type khớp DTO backend
```

---

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [Tổng quan](docs/tong-quan.md) | Frontend làm gì, quan hệ với backend |
| [Kiến trúc](docs/kien-truc.md) | App Router, tầng lib, mô hình không proxy, token |
| [Tính năng](docs/tinh-nang.md) | Storefront, checkout, tài khoản, thông báo, gợi ý, admin |
| [Tích hợp backend](docs/tich-hop-backend.md) | Cách gọi API, endpoint dùng, ảnh /media, env |

---

## Giấy phép

MIT
