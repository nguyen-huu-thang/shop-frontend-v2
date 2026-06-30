"use client"

// Lịch sử đơn hàng của tôi (cần đăng nhập). Mỗi đơn dẫn tới trang chi tiết.
// My order history (login required); each links to its detail page.
import { useCallback, useEffect, useState } from "react"

import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/site/public-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyOrders } from "@/lib/api/account"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import type { Order } from "@/lib/types"

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
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Bạn chưa có đơn hàng nào.{" "}
          <a href="/products" className="text-primary hover:underline">
            Mua sắm ngay
          </a>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <a key={o.id} href={`/orders/${o.id}`} className="block">
              <Card size="sm" className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Đơn #{o.id}</span>
                    <span className="font-normal text-muted-foreground">
                      {formatPrice(o.totalAmount)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={o.paymentStatus ? "secondary" : "outline"}>
                    {o.paymentStatus ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Badge>
                  <span>Giao: {o.shippingStatus}</span>
                  <span>· {o.details.length} sản phẩm</span>
                </CardContent>
              </Card>
            </a>
          ))}
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
