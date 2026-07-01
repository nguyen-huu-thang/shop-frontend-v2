// Nhãn + suy luận trạng thái đơn hàng, dùng chung cho /orders, /orders/[id], /account.
// Tránh lặp bảng nhãn và logic "được thanh toán / đã hủy / còn hạn" ở nhiều nơi.
// Order labels + status helpers shared across order screens.
import type { Order } from "./types"

// Nhãn trạng thái giao hàng (fallback: hiện nguyên giá trị).
// Shipping status labels (fallback to raw value).
export const SHIPPING_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang chuẩn bị",
  shipping: "Đang giao",
  shipped: "Đã giao cho đơn vị vận chuyển",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
}

// Nhãn phương thức thanh toán.
// Payment method labels.
export const PAYMENT_LABEL: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  mock_online: "Thanh toán online (giả lập)",
}

export function shippingLabel(status: string): string {
  return SHIPPING_LABEL[status] ?? status
}

export function paymentLabel(method: string): string {
  return PAYMENT_LABEL[method] ?? method
}

// Nhà cung cấp thanh toán: ưu tiên field mới, fallback paymentMethod (đơn cũ).
// Payment provider: prefer the new field, fall back to paymentMethod for old orders.
export function orderProvider(order: Order): string {
  return order.paymentProvider ?? order.paymentMethod
}

// Đơn đã bị hủy (quá hạn thanh toán) hay chưa.
export function isCancelled(order: Order): boolean {
  return Boolean(order.cancelledAt)
}

// Đơn online, chưa trả, chưa bị hủy -> cho thanh toán lại (giữ chỗ tồn kho theo hạn).
// Online, unpaid, not cancelled -> can (re)pay.
export function canPay(order: Order): boolean {
  return orderProvider(order) === "mock_online" && !order.paymentStatus && !isCancelled(order)
}

// Còn hạn thanh toán để hiển thị nhắc (đơn online chưa trả, chưa hủy, có deadline).
export function hasPaymentDeadline(order: Order): boolean {
  return canPay(order) && Boolean(order.paymentDeadline)
}

// Trạng thái tổng hợp để hiển thị badge một chỗ.
// Aggregated display status for a single badge.
export type OrderDisplayStatus =
  | "cancelled"
  | "paid"
  | "awaiting_payment"
  | "cod_unpaid"

export function orderDisplayStatus(order: Order): OrderDisplayStatus {
  if (isCancelled(order)) return "cancelled"
  if (order.paymentStatus) return "paid"
  if (orderProvider(order) === "mock_online") return "awaiting_payment"
  return "cod_unpaid"
}

export const ORDER_STATUS_LABEL: Record<OrderDisplayStatus, string> = {
  cancelled: "Đã hủy",
  paid: "Đã thanh toán",
  awaiting_payment: "Chờ thanh toán",
  cod_unpaid: "Chưa thanh toán (COD)",
}
