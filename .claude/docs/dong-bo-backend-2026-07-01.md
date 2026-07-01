# Đồng bộ frontend với đợt rà soát/hardening backend (2026-07-01)

> Backend vừa qua đợt rà soát + vá lỗi (giữ chỗ tồn kho kiểu Shopee, rate limit, đổi mật khẩu đăng
> xuất phiên khác, logout POST, tính tiền Decimal...). Tài liệu này ghi phần frontend đã chỉnh để
> khớp, và các thay đổi backend kèm theo. `tsc` sạch, `next build` OK (28 route).

## Thay đổi backend kèm theo (chỉnh khi cần cho FE)

- **`OrderResponse` mở rộng** (`app/dto/response/order_response.py`): thêm `paymentProvider`
  ('cod' | 'mock_online'), `paymentDeadline` (ISO, null nếu COD/đã trả), `cancelledAt` (ISO, null
  nếu còn hiệu lực). Additive - không phá client cũ. Cần cho FE hiển thị hạn thanh toán + gate nút
  trả tiền + trạng thái đã hủy.

## Thay đổi frontend

- **`lib/types.ts` - `Order`:** thêm `paymentProvider`, `paymentDeadline?`, `cancelledAt?`.
- **`/orders/[id]`:** dùng `paymentProvider` (fallback `paymentMethod`) để tính `canPay`; ẩn nút
  "Thanh toán ngay" khi đơn đã hủy (`cancelledAt`); hiện nhắc "thanh toán trước <hạn>, nếu không
  đơn tự hủy và hoàn kho" và dòng "đơn đã bị hủy do quá hạn - tồn kho đã hoàn".
- **`/account` đổi mật khẩu:** thêm ô tích "Đăng xuất tất cả phiên khác (giữ phiên hiện tại)";
  `changePassword(..., logoutOtherSessions)` gửi cờ này (`lib/api/account.ts`).
- **`lib/auth-context.tsx`:** `logout()` đổi từ GET sang **POST** (backend hỗ trợ cả hai).

## Không cần đổi (đã tương thích)

- **Rate limit 429** (login/forgot-password/otp): các trang đã hiển thị `err.message` từ ApiError
  nên tự hiện thông điệp 429 của backend.
- **Login unknown user → E1005** (trước E1004): FE không special-case E1004 nên không ảnh hưởng.
- **Tiền tính bằng Decimal** ở backend: JSON vẫn trả số → FE không đổi.
- **Checkout online create → pay:** luồng cũ (tạo đơn rồi `/pay` → trang mock) vẫn đúng vì giờ kho
  được giữ chỗ ngay lúc tạo đơn.
- **Phân trang kẹp** ở backend: trong suốt với FE.
