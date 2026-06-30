"use client"

// Tổng quan quản trị: số liệu từ GET /api/dashboard/stats.
// Admin dashboard: stats from GET /api/dashboard/stats.
import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import type { DashboardStats } from "@/lib/types"

export default function AdminDashboardPage() {
  const { authFetch } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats(authFetch)
      .then(setStats)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Không tải được số liệu")
      )
      .finally(() => setLoading(false))
  }, [authFetch])

  const cards = stats
    ? [
        { label: "Doanh thu (đã TT)", value: formatPrice(stats.revenuePaid) },
        { label: "Tổng đơn", value: stats.totalOrders },
        { label: "Đơn hôm nay", value: stats.ordersToday },
        { label: "Đơn chưa TT", value: stats.unpaidOrders },
        { label: "Sản phẩm", value: stats.totalProducts },
        { label: "Option sắp hết", value: stats.lowStockOptions },
        { label: "Người dùng", value: stats.totalUsers },
        { label: "Đánh giá", value: stats.totalReviews },
      ]
    : []

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tổng quan</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label} size="sm">
                <CardContent>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="mt-1 text-xl font-semibold">{c.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats && stats.topProducts.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {stats.topProducts.map((p) => (
                    <li key={p.productId} className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">
                        Đã bán: {p.totalSold}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
