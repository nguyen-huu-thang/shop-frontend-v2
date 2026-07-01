// API cần ĐĂNG NHẬP: đơn hàng, đổi mật khẩu, wishlist, review.
// Mỗi hàm nhận authFetch (từ useAuth) để tự gắn Bearer + refresh khi 401.
// Authenticated API: orders, password, wishlist, reviews. Each takes authFetch from useAuth.
import type { AuthFetch } from "@/lib/auth-context"
import type {
  CountResponse,
  MessageResponse,
  Order,
  OrderCreatePayload,
  OrderPreview,
  OrderPreviewPayload,
  PaymentInit,
  Review,
  WishlistItem,
} from "@/lib/types"

// ── Đơn hàng ─────────────────────────────────────────────────────────────────
export const getMyOrders = (authFetch: AuthFetch) =>
  authFetch<Order[]>("/api/orders")

export const getMyOrderCount = (authFetch: AuthFetch) =>
  authFetch<CountResponse>("/api/orders/count")

export const getOrder = (authFetch: AuthFetch, id: number | string) =>
  authFetch<Order>(`/api/orders/${id}`)

// Xem trước tổng tiền (subtotal + ship - giảm giá) trước khi đặt; không tạo đơn.
// Preview totals before placing the order.
export const previewOrder = (authFetch: AuthFetch, payload: OrderPreviewPayload) =>
  authFetch<OrderPreview>("/api/orders/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const createOrder = (authFetch: AuthFetch, payload: OrderCreatePayload) =>
  authFetch<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  })

// Bắt đầu thanh toán cổng online giả lập cho đơn (paymentProvider="mock_online").
// Trả {orderId, paymentRef, mockUrl} -> FE điều hướng tới trang mock.
export const payOrder = (authFetch: AuthFetch, orderId: number | string) =>
  authFetch<PaymentInit>(`/api/orders/${orderId}/pay`, { method: "POST" })

// Chủ đơn tự hủy đơn online chưa thanh toán -> backend hoàn kho + nhả coupon. Trả đơn đã cập nhật.
// Owner cancels an unpaid online order -> backend restocks + releases coupon.
export const cancelOrder = (authFetch: AuthFetch, orderId: number | string) =>
  authFetch<Order>(`/api/orders/${orderId}/cancel`, { method: "POST" })

// ── Mật khẩu ─────────────────────────────────────────────────────────────────
// logoutOtherSessions=true: đăng xuất mọi phiên KHÁC (giữ phiên hiện tại).
export const changePassword = (
  authFetch: AuthFetch,
  currentPassword: string,
  newPassword: string,
  logoutOtherSessions = false
) =>
  authFetch<MessageResponse>("/api/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, logoutOtherSessions }),
  })

export const verifyPassword = (authFetch: AuthFetch, password: string) =>
  authFetch<MessageResponse>("/api/verify-password", {
    method: "POST",
    body: JSON.stringify({ password }),
  })

// ── Wishlist ─────────────────────────────────────────────────────────────────
// Backend đã cập nhật: list trả [{wishlistId, productId, name}]; wishlist theo PRODUCT.
// POST nhận {productId}; DELETE theo wishlistId.
export const getWishlist = (authFetch: AuthFetch) =>
  authFetch<WishlistItem[]>("/api/wishlist")

export const addWishlist = (authFetch: AuthFetch, productId: number) =>
  authFetch<unknown>("/api/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId }),
  })

export const removeWishlist = (authFetch: AuthFetch, wishlistId: number) =>
  authFetch<MessageResponse>(`/api/wishlist/${wishlistId}`, {
    method: "DELETE",
  })

// ── Quyền hiệu lực của user hiện tại (gate UI admin) ─────────────────────────
export const getMyPermissions = (authFetch: AuthFetch) =>
  authFetch<string[]>("/api/me/permissions")

// ── Review ───────────────────────────────────────────────────────────────────
// Tạo đánh giá (cần đăng nhập). Lưu ý: backend CHƯA có endpoint lấy review theo sản phẩm
// cho khách xem (khoảng trống #7) → trang chi tiết chỉ có form gửi, chưa liệt kê được.
export const createReview = (
  authFetch: AuthFetch,
  payload: { productId: number; userId: number; rating: number; comment?: string }
) =>
  authFetch<Review>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  })
