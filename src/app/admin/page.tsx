"use client"

// Tổng quan quản trị: số liệu từ GET /api/dashboard/stats.
// Admin dashboard: stats from GET /api/dashboard/stats.
import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
        { label: "Doanh thu đã thanh toán", value: formatPrice(stats.revenuePaid) },
        { label: "Tổng đơn hàng", value: stats.totalOrders },
        { label: "Đơn hàng hôm nay", value: stats.ordersToday },
        { label: "Đơn chưa thanh toán", value: stats.unpaidOrders },
        { label: "Sản phẩm", value: stats.totalProducts },
        { label: "Phiên bản sắp hết", value: stats.lowStockOptions },
        { label: "Người dùng", value: stats.totalUsers },
        { label: "Đánh giá", value: stats.totalReviews },
      ]
    : []

  return (
    <div>
      <div className="mb-7 sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tình hình cửa hàng</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Tổng quan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Theo dõi đơn hàng, sản phẩm và hoạt động cửa hàng.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p role="status" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cards.map((card, index) => (
              <Card
                key={card.label}
                size="sm"
                className="relative overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${index === 0 ? "bg-primary" : "bg-primary/25"}`} aria-hidden="true" />
                <CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
                  <div className="text-xs font-medium leading-5 text-muted-foreground sm:text-sm">{card.label}</div>
                  <div className="mt-2 break-words text-xl font-bold tracking-tight sm:text-2xl">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats && stats.topProducts.length > 0 ? (
            <Card className="mt-6 overflow-hidden rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/25 px-5 py-4 sm:px-6">
                <CardTitle className="text-base font-semibold sm:text-lg">Sản phẩm bán chạy</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border/60">
                  {stats.topProducts.map((product) => (
                    <li key={product.productId} className="flex items-center justify-between gap-4 px-5 py-4 text-sm sm:px-6">
                      <span className="min-w-0 truncate font-medium">{product.name}</span>
                      <span className="shrink-0 text-muted-foreground">Đã bán: <span className="font-semibold text-foreground">{product.totalSold}</span></span>
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
