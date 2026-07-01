// Dòng thời gian trạng thái giao hàng của đơn. Đơn đã hủy hiển thị riêng (đỏ).
// Order shipping status timeline. Cancelled orders render a distinct state.
import type { Order } from "@/lib/types"
import { isCancelled } from "@/lib/order-status"

// Các mốc giao hàng theo thứ tự.
// Ordered shipping milestones.
const STEPS: { key: string; label: string }[] = [
  { key: "pending", label: "Chờ xử lý" },
  { key: "processing", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
]

// shipped gộp vào bước "Đang giao" cho gọn.
// Map "shipped" onto the "shipping" milestone.
function stepIndex(status: string): number {
  const normalized = status === "shipped" ? "shipping" : status
  const i = STEPS.findIndex((s) => s.key === normalized)
  return i
}

export function OrderTimeline({ order }: { order: Order }) {
  if (isCancelled(order)) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Đơn đã bị hủy do quá hạn thanh toán - tồn kho đã được hoàn lại.
      </div>
    )
  }

  const current = stepIndex(order.shippingStatus)

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const reached = current >= 0 && i <= current
        const isLast = i === STEPS.length - 1
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs ${
                  reached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {reached ? "✓" : i + 1}
              </span>
              <span
                className={`text-center text-[11px] ${
                  reached ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <span
                className={`mx-1 h-0.5 flex-1 ${
                  current > i ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
