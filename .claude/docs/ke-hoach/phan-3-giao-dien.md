# Phần 3 - Giao diện (làm đẹp UI/UX + SEO hoàn chỉnh)

> 🔄 **ĐỢT 1 XONG 2026-06-25** (`tsc` sạch, `next build` OK - 21 route). Phong cách đã chốt:
> **primary xanh dương**, **sáng + nút chuyển tối** (next-themes), **thương mại sống động**.
> Đã làm: design system (token màu xanh + dark), `ThemeProvider` + `ThemeToggle` ở header, hero
> gradient trang chủ, chip danh mục màu nhấn, product-card (giá nhấn + badge giảm + giá gạch + hover),
> header admin. **SEO:** `app/sitemap.ts`, `app/robots.ts` (chặn /admin + trang riêng tư), JSON-LD
> Product ở trang chi tiết, metadata/OG đã có từ trước.
>
> **Còn lại (đợt sau, tinh chỉnh dần):** skeleton/empty states đồng bộ, `next/image` cho ảnh /media,
> rà responsive + a11y toàn site, polish sâu cart/checkout/account/admin tables, JSON-LD
> BreadcrumbList/Organization. Khi backend có ảnh trong DTO (#8) thì bật ảnh ở lưới + thumbnail giỏ.

**Mục tiêu:** Sau khi chức năng đã khớp backend (Phần 2), trau chuốt giao diện đẹp, nhất quán, responsive,
và hoàn thiện SEO - đúng động lực chuyển sang Next.js.

> Chưa chốt định hướng thẩm mỹ ở phiên này (người dùng nói "bước này chưa cần nghĩ tới UI"). Khi tới đây,
> hỏi người dùng về phong cách (màu thương hiệu, tham chiếu, sáng/tối) trước khi dựng design system.

## A. Design system

- [ ] **3.1** Token màu/typography/spacing (Tailwind v4 + biến CSS), chế độ sáng/tối (next-themes).
- [ ] **3.2** Bộ component dùng chung hoàn chỉnh (button, input, form, dialog, table, card, badge, tabs,
  sheet, dropdown, skeleton, toast) theo shadcn; thống nhất trạng thái loading/empty/error.

## B. Storefront

- [ ] **3.3** Header: logo, thanh tìm kiếm, icon giỏ (số lượng), menu tài khoản, điều hướng danh mục.
- [ ] **3.4** Footer + các widget (liên hệ, mạng xã hội) theo bản cũ.
- [ ] **3.5** Trang chủ: hero/banner (carousel), các mục sản phẩm, danh mục nổi bật.
- [ ] **3.6** Thẻ sản phẩm + lưới + bộ lọc + phân trang (suy "hết trang" theo `limit`).
- [ ] **3.7** Trang chi tiết: gallery ảnh, chọn thuộc tính mượt, giá/tồn cập nhật, review + đánh giá sao.
- [ ] **3.8** Giỏ hàng + checkout: bố cục rõ ràng, tóm tắt đơn, trạng thái thanh toán/giao hàng.

## C. Store manager

- [ ] **3.9** Khung admin (sidebar + topbar) theo mẫu anh em (`components/admin` của dental-clinic).
- [ ] **3.10** Bảng dữ liệu, form dialog, xác nhận xóa, phân trang nhất quán cho mọi module quản trị.

## D. Trải nghiệm & chất lượng

- [ ] **3.11** Responsive toàn site (mobile-first), kiểm tra a11y cơ bản (label, focus, contrast).
- [ ] **3.12** Skeleton/loading, empty state, thông báo lỗi thân thiện (map từ `errorKey`).
- [ ] **3.13** `next/image` cho ảnh qua `/media` (cấu hình `remotePatterns` cho domain backend).

## E. SEO (lý do chính chuyển Next)

- [ ] **3.14** `metadata` tĩnh + `generateMetadata` động cho trang sản phẩm/danh mục (title, description,
  canonical, Open Graph, Twitter card).
- [ ] **3.15** `app/sitemap.ts` + `app/robots.ts` (lấy SP/danh mục qua `serverFetch`).
- [ ] **3.16** JSON-LD (`Product`, `BreadcrumbList`, `Organization`).
- [ ] **3.17** Tận dụng SSR/ISR ở trang công khai; đặt `revalidate` hợp lý; kiểm tra Lighthouse.

## Đầu ra Phần 3

Giao diện đẹp, nhất quán, responsive; SEO đầy đủ (metadata/sitemap/JSON-LD/SSR). Sản phẩm sẵn sàng demo.
