"use client"

// Chi tiết đơn hàng (cần đăng nhập, chỉ chủ đơn - backend vá IDOR trả 403/401).
// Hiện trạng thái + cho phép thanh toán lại nếu là đơn online giả lập chưa trả.
// Order detail (login required, owner-only). Allows re-paying mock_online unpaid orders.
import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/site/public-shell"
import { OrderTimeline } from "@/components/site/order-timeline"
import { PaymentCountdown } from "@/components/site/payment-countdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cancelOrder, getOrder, payOrder } from "@/lib/api/account"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import {
  canPay as orderCanPay,
  hasPaymentDeadline,
  paymentLabel,
} from "@/lib/order-status"
import type { Order } from "@/lib/types"

function OrderDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const { authFetch } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getOrder(authFetch, id)
      .then((o) => setOrder(o))
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
          setError("Bạn không có quyền xem đơn hàng này.")
        } else {
          setError("Không tải được đơn hàng.")
        }
      })
      .finally(() => setLoading(false))
  }, [authFetch, id])

  useEffect(() => {
    load()
  }, [load])

  const pay = async () => {
    if (!order) return
    setBusy(true)
    try {
      const init = await payOrder(authFetch, order.id)
      router.push(init.mockUrl)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không khởi tạo được thanh toán")
    } finally {
      setBusy(false)
    }
  }

  const doCancel = async () => {
    if (!order) return
    setCancelling(true)
    try {
      const updated = await cancelOrder(authFetch, order.id)
      setOrder(updated)
      setConfirmCancel(false)
      toast.success("Đã hủy đơn, tồn kho đã được hoàn lại")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không hủy được đơn")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-4 h-7 w-40" />
        <Skeleton className="mb-4 h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </Container>
    )
  }

  if (error || !order) {
    return (
      <Container className="py-8">
        <p className="text-sm text-muted-foreground">{error ?? "Không tìm thấy đơn hàng."}</p>
        <a href="/orders" className="mt-2 inline-block text-sm text-primary hover:underline">
          Về danh sách đơn hàng
        </a>
      </Container>
    )
  }

  const canPay = orderCanPay(order)
  const showDeadline = hasPaymentDeadline(order)

  return (
    <Container className="py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Đơn hàng #{order.id}</h1>
        <a href="/orders" className="text-sm text-primary hover:underline">
          Tất cả đơn hàng
        </a>
      </div>

      <Card size="sm" className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Thông tin đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Địa chỉ: {order.address}</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            Thanh toán: {paymentLabel(order.paymentMethod)}
            <Badge variant={order.paymentStatus ? "secondary" : "outline"}>
              {order.paymentStatus ? "Đã thanh toán" : "Chưa thanh toán"}
            </Badge>
          </p>
          <OrderTimeline order={order} />
          {showDeadline ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-amber-600 dark:text-amber-500">
              Vui lòng thanh toán trước{" "}
              {new Date(order.paymentDeadline as string).toLocaleString("vi-VN")} - {" "}
              <PaymentCountdown deadline={order.paymentDeadline as string} />. Quá hạn đơn sẽ
              tự hủy và hoàn kho.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {order.details.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>
                  {d.name} x {d.quantity}
                </span>
                <span>{formatPrice(d.price * d.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />
          <div className="flex justify-between text-base font-semibold">
            <span>Tổng cộng</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
          {canPay ? (
            <div className="mt-4 flex flex-col gap-2">
              <Button disabled={busy} onClick={pay}>
                Thanh toán ngay
              </Button>
              <Button
                variant="outline"
                disabled={busy || cancelling}
                onClick={() => setConfirmCancel(true)}
              >
                Hủy đơn
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        title="Hủy đơn hàng này?"
        description="Tồn kho sẽ được hoàn lại và mã giảm giá (nếu có) được nhả ra. Không thể hoàn tác."
        confirmLabel="Hủy đơn"
        cancelLabel="Không"
        busy={cancelling}
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </Container>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <RequireAuth>
      <OrderDetailContent id={id} />
    </RequireAuth>
  )
}
