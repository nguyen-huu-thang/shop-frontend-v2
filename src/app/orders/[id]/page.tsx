"use client"

// Chi tiết đơn hàng (cần đăng nhập, chỉ chủ đơn - backend vá IDOR trả 403/401).
// Hiện trạng thái + cho phép thanh toán lại nếu là đơn online giả lập chưa trả.
// Order detail (login required, owner-only). Allows re-paying mock_online unpaid orders.
import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/site/public-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getOrder, payOrder } from "@/lib/api/account"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import type { Order } from "@/lib/types"

// Nhãn trạng thái giao hàng tiếng Việt (fallback hiện nguyên giá trị).
const SHIPPING_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang chuẩn bị",
  shipping: "Đang giao",
  shipped: "Đã giao cho đơn vị vận chuyển",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  mock_online: "Thanh toán online (giả lập)",
}

function OrderDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const { authFetch } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

  if (loading) {
    return (
      <Container className="py-8">
        <p className="text-sm text-muted-foreground">Đang tải...</p>
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

  const canPay = order.paymentMethod === "mock_online" && !order.paymentStatus

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
        <CardContent className="space-y-1 text-sm">
          <p className="text-muted-foreground">Địa chỉ: {order.address}</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            Thanh toán: {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            <Badge variant={order.paymentStatus ? "secondary" : "outline"}>
              {order.paymentStatus ? "Đã thanh toán" : "Chưa thanh toán"}
            </Badge>
          </p>
          <p className="text-muted-foreground">
            Giao hàng: {SHIPPING_LABEL[order.shippingStatus] ?? order.shippingStatus}
          </p>
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
            <Button className="mt-4 w-full" disabled={busy} onClick={pay}>
              Thanh toán ngay
            </Button>
          ) : null}
        </CardContent>
      </Card>
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
