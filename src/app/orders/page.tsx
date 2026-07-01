"use client"

// Lịch sử đơn hàng của tôi (cần đăng nhập). Mỗi đơn dẫn tới trang chi tiết.
// My order history (login required); each links to its detail page.
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/site/public-shell"
import { PaymentCountdown } from "@/components/site/payment-countdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getMyOrders } from "@/lib/api/account"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import {
  canPay as orderCanPay,
  hasPaymentDeadline,
  orderDisplayStatus,
  ORDER_STATUS_LABEL,
  shippingLabel,
} from "@/lib/order-status"
import type { Order } from "@/lib/types"

// Màu badge theo trạng thái tổng hợp của đơn.
// Badge variant per aggregated order status.
const STATUS_VARIANT: Record<
  ReturnType<typeof orderDisplayStatus>,
  "secondary" | "outline" | "destructive"
> = {
  paid: "secondary",
  awaiting_payment: "outline",
  cod_unpaid: "outline",
  cancelled: "destructive",
}

function OrdersContent() {
  const { authFetch } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getMyOrders(authFetch)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Đơn hàng của tôi</h1>
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/products">Mua sắm ngay</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const status = orderDisplayStatus(o)
            return (
              <Card key={o.id} size="sm" className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <Link href={`/orders/${o.id}`} className="hover:text-primary">
                      Đơn #{o.id}
                    </Link>
                    <span className="font-normal text-muted-foreground">
                      {formatPrice(o.totalAmount)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={STATUS_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
                  <span>Giao: {shippingLabel(o.shippingStatus)}</span>
                  <span>· {o.details.length} sản phẩm</span>
                  {hasPaymentDeadline(o) ? (
                    <span className="ml-auto text-xs">
                      <PaymentCountdown deadline={o.paymentDeadline as string} />
                    </span>
                  ) : null}
                  {orderCanPay(o) ? (
                    <Button asChild size="sm" className="ml-auto">
                      <Link href={`/orders/${o.id}`}>Thanh toán</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </Container>
  )
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  )
}
