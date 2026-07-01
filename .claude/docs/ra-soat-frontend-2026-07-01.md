# Rà soát & kế hoạch nâng cấp frontend (2026-07-01)

> Kết quả đọc toàn bộ tầng lõi (`lib/*`), context (auth/cart/permissions), các trang chính
> (checkout, cart, product-detail, orders, account, login, payment) + cấu hình. Tài liệu này là
> **kế hoạch** (phát hiện lỗi/logic tiềm ẩn + cơ hội nâng cấp chức năng/giao diện) và **bảng phân
> công** ai làm phần nào.

## ✅ Trạng thái thực hiện (2026-07-01, đợt sau)

Đã làm xong **toàn bộ phần không phụ thuộc kiểm tra thủ công**. `tsc --noEmit` sạch, `next build`
OK (28 route).

**Lỗi đã sửa:** #1 (decode JWT UTF-8), #2/#3 (nhãn tiếng Việt + badge trạng thái tổng hợp + nút
trả nhanh + đếm ngược ở `/orders`, `/account`, `/orders/[id]`), #4 (returnUrl khi đăng nhập),
#6 (chặn số lượng theo tồn kho + badge tồn kho ở trang chi tiết), #7/#8 (coupon có `busy` + bỏ áp
mềm khi mã hết hợp lệ + sửa deps effect preview), #9 (cart-context giữ item khi refresh lỗi),
#10 (chỉ nhận `n.link` là path nội bộ).

**Giao diện đã nâng:** `next/image` (product-card + gallery), gallery thumbnail chọn được, sticky
cột ảnh (desktop), skeleton + empty state (cart/wishlist/search/orders), timeline trạng thái đơn +
đồng hồ đếm ngược hạn thanh toán, header mobile (hamburger), dialog xác nhận cho hành động phá hủy
(xóa giỏ, bỏ wishlist).

**File mới:** `lib/order-status.ts`, `components/site/payment-countdown.tsx`,
`components/site/order-timeline.tsx`, `components/ui/confirm-dialog.tsx`.

## ✅ Đợt bổ sung (sau QA thủ công của user)

- **Nút con mắt xem/ẩn mật khẩu:** `components/ui/password-input.tsx` dùng ở login, register, đổi
  mật khẩu (`/account`), reset-password.
- **Giá "Từ ..." khi chưa chọn phân loại:** trang chi tiết hiện giá thấp nhất (`product.price`,
  khớp card ngoài lưới) trước khi chọn đủ biến thể.
- **#5 GIÁ (user chọn "áp giảm giá thật"):** phát hiện `discount_percentage` chỉ có trong DTO/entity,
  KHÔNG áp ở `pricing.py`/checkout -> card quảng cáo mức giảm không được trừ. Đã **sửa backend áp
  giảm thật**: `pricing.apply_percent_discount()`; áp vào `_subtotal_from_cart` (preview),
  `create_order` (giá dòng + subtotal, lưu vào order_detail), `product_service.get_cart_item_detail`
  (giá giỏ). Frontend product-detail hiện giá đã giảm + gạch giá gốc. Khách trả đúng giá đã giảm.
  Backend 166 test pass.
- **Hủy đơn chủ động:** backend `order_service.cancel_order` + `POST /api/orders/{id}/cancel` (chủ
  đơn hủy đơn online chưa trả -> hoàn kho + nhả coupon); frontend nút "Hủy đơn" + ConfirmDialog ở
  `/orders/[id]`.
- **Thông báo realtime:** quyết định KHÔNG làm (giữ poll 30s) - SSE/WebSocket quá nặng cho scope +
  mô hình no-proxy cross-origin. Giảm interval nếu cần.

**Còn lại (chờ bạn):** QA thủ công Phần 2 (gồm thử hủy đơn + sản phẩm có discount>0) + Lighthouse/A11y.

> Lưu ý: `npm run lint` báo lỗi `react-hooks/set-state-in-effect` ở khắp codebase (admin, checkout,
> theme-toggle, cart-context, related-products...) - quy tắc nghiêm ngặt CÓ SẴN, không chặn
> `next build`. File mới thêm theo đúng pattern đang dùng.

---

---

## Phần 1 - Vấn đề đã phát hiện (ưu tiên xác nhận + sửa)

| # | Mức | Vị trí | Vấn đề | Hệ quả |
|---|---|---|---|---|
| 1 | **Cao** | `lib/jwt.ts:19-21` | `atob()` giải base64 ra chuỗi latin1, `JSON.parse` đọc sai byte UTF-8 | Username/email **có dấu tiếng Việt bị hỏng** ở header + trang tài khoản. Cần `decodeURIComponent(escape(...))` hoặc `TextDecoder` |
| 2 | **Cao** | `app/orders/page.tsx:62`, `app/account/page.tsx:69-73` | Danh sách đơn hiện `paymentMethod`/`shippingStatus` **thô** (mã tiếng Anh), không map nhãn như trang chi tiết | Người dùng thấy "pending", "mock_online"... khó hiểu; không đồng bộ với `orders/[id]` |
| 3 | **Cao** | `app/orders/page.tsx`, `app/account/page.tsx` (OrdersSection) | Đơn **online chưa trả / đã hủy quá hạn** không phân biệt trong danh sách (thiếu badge hủy + nhắc hạn + nút trả nhanh) | Đơn đã hủy trông như đơn thường; user không biết cần thanh toán gấp trước khi hết hạn hoàn kho |
| 4 | **Trung bình** | `components/auth/require-auth.tsx:22-25` | Redirect `/login` **không kèm returnUrl**; sau đăng nhập về `/` hoặc `/admin` | Bấm trang cần login khi chưa đăng nhập -> mất trang đích, phải tự bấm lại |
| 5 | **Trung bình** | `components/site/product-card.tsx:14-17` vs `components/site/product-detail.tsx:87-89` | Card tự tính `price*(1-discount/100)`, trang chi tiết lấy `option.price` trực tiếp | **Nghi giá lệch** giữa lưới và chi tiết (tùy backend đã áp giảm vào price chưa). Cần test đối chiếu |
| 6 | **Trung bình** | `product-detail.tsx:224-233`, `cart/page.tsx:90-96` | Số lượng **không chặn theo tồn kho** phía client (nút + vô hạn) | User tăng quá tồn rồi mới nhận lỗi backend -> trải nghiệm rời rạc |
| 7 | **Thấp** | `checkout/page.tsx:88-108` | `applyCoupon` không có trạng thái `busy`; đổi địa chỉ/số lượng làm coupon hết hợp lệ -> `catch -> setPreview(null)` | Double-click áp mã; preview biến mất thay vì báo "mã không còn áp dụng" |
| 8 | **Thấp** | `checkout/page.tsx:86` | Effect preview phụ thuộc `items.length` (đã disable eslint) thay vì nội dung `cartIds` | Latent: đổi item mà giữ nguyên số phần tử -> preview cũ |
| 9 | **Thấp** | `lib/cart-context.tsx:45-51` | `refresh()` nuốt mọi lỗi -> giỏ trống | Backend lỗi tạm thời -> user tưởng mất hàng trong giỏ |
| 10 | **Thấp** | `components/site/notification-bell.tsx:134-145` | `n.link` (do admin broadcast nhập) nhét thẳng vào `<Link href>` | Nên chặn link không phải path nội bộ (phòng `javascript:`/redirect ngoài) |

---

## Phần 2 - Kế hoạch kiểm thử theo luồng (QA thủ công)

Bật backend cổng 8088 + `npm run dev`. Tài khoản `admin/Admin@123`, `demo/Demo@123`.
Coupon demo: `WELCOME10`/`SALE50K`/`FREESHIP`/`BIGSALE20`.

### A. Xác thực & phiên
- Đăng nhập đúng/sai; sai 5 lần (kiểm 429 rate-limit hiện message); quên mật khẩu; reset; verify email; OTP.
- Reload giữa phiên (khôi phục qua refresh cookie); để tab lâu rồi thao tác (auto refresh khi 401).
- Đổi mật khẩu **có/không tích** "đăng xuất phiên khác": mở 2 trình duyệt, xác nhận phiên hiện tại giữ, phiên kia bị đá.
- Đăng xuất (POST) -> giỏ về rỗng, header đổi trạng thái.
- Đăng nhập tài khoản có/không quyền admin -> điều hướng `/admin` vs `/`.

### B. Duyệt sản phẩm / SEO
- Trang chủ, `/products` (phân trang biên: page=0, vượt max, page chữ), `/categories`, `/categories/[id]`, `/search` (từ khóa rỗng, có dấu, ký tự đặc biệt).
- Chi tiết: chọn thiếu/đủ phân loại, tổ hợp không tồn tại, sản phẩm không biến thể, hết hàng, không ảnh (placeholder), gallery nhiều ảnh.
- Kiểm ảnh `/media/*` load qua rewrite; **đối chiếu giá card vs giá chi tiết** (mục #5).

### C. Giỏ - Checkout - Thanh toán (trọng tâm, gồm logic giữ chỗ tồn kho kiểu Shopee)
- Thêm/sửa/xóa giỏ; tăng quá tồn kho; giỏ nhiều item.
- Checkout: chưa có địa chỉ, thêm địa chỉ, chọn mặc định; áp coupon hợp lệ/không hợp lệ/hết hạn/min_order; đổi số lượng sau khi áp coupon (mục #7).
- **COD:** đặt -> kho trừ ngay -> đơn hiện đúng.
- **Online:** đặt -> trang mock -> (a) thành công, (b) hủy/thất bại, (c) **bỏ ngang không trả** rồi đợi/kích job hết hạn -> đơn `cancelledAt`, kho hoàn, coupon nhả lại.
- Vào lại `/orders/[id]` đơn online chưa trả: nút "Thanh toán ngay" + nhắc hạn hiện; đơn đã hủy -> ẩn nút + báo hủy; COD/đã trả -> không nút.
- Race: 2 tab cùng đặt sản phẩm sắp hết -> 1 thành công, 1 báo hết hàng.

### D. Wishlist / Đánh giá / Thông báo
- Thêm/xóa wishlist; wishlist chứa sản phẩm đã ẩn.
- Gửi review (chờ duyệt); xem review đã duyệt.
- Chuông: badge unread, poll 30s, đọc 1/đọc tất cả, click link điều hướng, mở/đóng ngoài vùng.

### E. Admin (`/admin/*`: products, categories, coupons, orders, reviews, users, notifications)
- Vào `/admin` bằng tài khoản không quyền -> phải bị chặn (gate UI + backend 403).
- CRUD từng mục; phân trang; đổi trạng thái giao đơn; broadcast thông báo.

---

## Phần 3 - Kiểm thử kỹ thuật (công cụ)

- `npx tsc --noEmit`; `npm run lint` (soát các `eslint-disable` rải rác); `npm run build` (28 route).
- Console/Network: bắt lỗi 4xx/5xx bị nuốt (mục #9), request lặp thừa (preview, permissions mỗi lần login).
- Responsive: mobile (nav ẩn ở `md`, header chật khi có ô search + nhiều icon), tablet, desktop.
- A11y nhanh: tab-order, focus ring, `aria-label` nút icon, contrast dark mode.
- Perf (Lighthouse): LCP do dùng `<img>` thô thay `next/image`; CLS ảnh chưa set kích thước.

---

## Phần 4 - Cơ hội nâng cấp chức năng

1. returnUrl sau đăng nhập (mục #4).
2. Danh sách đơn giàu thông tin: nhãn tiếng Việt, badge trạng thái, nhắc hạn + nút trả nhanh cho đơn online chưa trả, lọc theo trạng thái.
3. Hủy đơn chủ động cho đơn online chưa trả (nếu backend hỗ trợ) thay vì chỉ chờ hết hạn.
4. Chặn số lượng theo tồn kho ngay ở UI (mục #6).
5. Rà đồng bộ user info sau khi cập nhật hồ sơ.
6. Wishlist -> giỏ nhanh; đánh dấu sản phẩm đã yêu thích trên card.
7. Tìm kiếm nâng cao: lọc giá/danh mục, phân trang kết quả (đang có `total`).
8. Thông báo realtime (SSE/WebSocket) thay poll 30s nếu backend hỗ trợ.
9. Đánh giá: điểm trung bình + số lượng trên card/chi tiết; phân trang review.

---

## Phần 5 - Cơ hội nâng cấp giao diện

1. `next/image` thay toàn bộ `<img>` (card, gallery, chi tiết) -> LCP tốt, hết layout shift, hết `eslint-disable`. Đã whitelist `/media` qua rewrite nên hợp `next/image`.
2. Skeleton loading thay text "Đang tải..." (đã có `components/ui/skeleton.tsx`).
3. Empty states có minh họa (giỏ trống, chưa có đơn/thông báo/wishlist) - icon + CTA.
4. Chi tiết sản phẩm: gallery thumbnail chọn được, badge tồn kho ("Còn/Sắp hết/Hết hàng"), sticky khối mua trên mobile.
5. Header mobile: gom search + nav vào hamburger/sheet.
6. Checkout: chia bước rõ, nút áp coupon có spinner, hiển thị số tiền tiết kiệm.
7. Đơn hàng: dòng thời gian trạng thái + đồng hồ đếm ngược hạn thanh toán đơn online.
8. Dialog xác nhận cho hành động phá hủy (xóa giỏ, hủy đơn).
9. Micro-interaction: badge giỏ nảy khi thêm, transition trang.

---

## Phần 6 - Phân công: tôi (Claude) làm được gì, bạn làm thủ công gì

### Claude làm được (thuần code, kiểm chứng bằng `tsc`/`build`/`lint`)

| Hạng mục | Thuộc phần |
|---|---|
| Sửa `decodeJwt` để đọc đúng UTF-8 | #1 |
| Map nhãn tiếng Việt + badge trạng thái + nút/nhắc hạn ở danh sách đơn | #2, #3 |
| Thêm returnUrl vào `RequireAuth` + xử lý ở `/login` | #4 |
| Chặn số lượng theo tồn kho ở product-detail + cart | #6 |
| Thêm `busy`/thông báo cho áp coupon; sửa deps effect preview | #7, #8 |
| Không nuốt lỗi ở cart-context (phân biệt lỗi mạng vs giỏ trống) | #9 |
| Chặn/validate `n.link` chỉ path nội bộ | #10 |
| Thay `<img>` bằng `next/image` | Giao diện #1 |
| Thêm Skeleton + Empty states | Giao diện #2, #3 |
| Gallery thumbnail chọn được, badge tồn kho, sticky mua | Giao diện #4 |
| Header mobile (hamburger/sheet) | Giao diện #5 |
| Checkout chia bước + spinner coupon; dòng thời gian đơn + đếm ngược | Giao diện #6, #7 |
| Dialog xác nhận hành động phá hủy | Giao diện #8 |
| `tsc --noEmit`, `npm run lint`, `npm run build` sau mỗi đợt | Phần 3 (tự động) |

### Cần bạn làm thủ công (hoặc quyết định trước khi tôi code)

| Hạng mục | Lý do cần bạn |
|---|---|
| **Chạy QA thủ công Phần 2 (A-E)** trên trình duyệt thật | Cần thao tác người thật, nhiều trình duyệt, mắt nhìn (rate-limit, 2 phiên, race 2 tab, thanh toán mock) |
| **Xác nhận mục #5 (giá lệch)** bằng cách mở 1 sản phẩm có `discountPercentage` và đối chiếu giá card vs chi tiết | Phải xem dữ liệu thật để biết backend đã áp giảm vào `price` chưa - quyết định sửa card hay giữ nguyên |
| **Kích/đợi job hết hạn đơn online** (mỗi 10') để test hoàn kho + hủy | Phụ thuộc scheduler backend chạy thật |
| **Chạy Lighthouse / kiểm A11y bằng công cụ** (Perf/CLS/contrast) | Cần trình duyệt + tiện ích đo |
| **Quyết định phạm vi mục #3 backend-phụ-thuộc**: "hủy đơn chủ động" (chức năng #3) | Cần biết backend có endpoint hủy đơn không - nếu chưa có thì thuộc việc backend |
| **Thông báo realtime (chức năng #8)** | Phụ thuộc backend có SSE/WebSocket - quyết định trước |
| **Cài thêm package nếu cần** (vd component sheet/dialog nếu chưa có) | Theo quy ước: phải hỏi bạn trước khi cài |

### Thứ tự tôi đề xuất triển khai (khi bạn duyệt)

1. Nhóm lỗi ảnh hưởng người dùng: **#1 -> #2 -> #3**.
2. UX chức năng: **#4, #6, #7/#8, #9, #10**.
3. Nền tảng giao diện đồng loạt: **`next/image` + skeleton + empty state**.
4. Nâng cấp sâu: gallery/checkout/timeline/dialog.

> Sau mỗi nhóm sẽ chạy `tsc` + `build`. Không cài package / không commit git khi chưa hỏi.
