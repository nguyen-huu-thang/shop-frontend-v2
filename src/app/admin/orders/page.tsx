"use client"

// Quản trị đơn hàng: liệt kê (phân trang) + xem chi tiết + xóa.
// ⚠️ Backend chỉ cho cập nhật ĐỊA CHỈ đơn (PUT /api/orders/{id}); chưa có đổi trạng thái giao/TT.
// Admin orders: list (paginated) + view details + delete.
import { Fragment, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  deleteOrder,
  getAllOrders,
  getOrderCount,
  updateShippingStatus,
} from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import type { Order } from "@/lib/types"

const LIMIT = 10

// Các trạng thái giao hàng cho admin chọn.
const SHIPPING_STATUSES = ["pending", "processing", "shipping", "delivered", "cancelled"]

export default function AdminOrdersPage() {
  const { authFetch } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)
  // Bản nháp trạng thái giao theo từng đơn (chưa lưu).
  const [statusDraft, setStatusDraft] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getAllOrders(authFetch, page, LIMIT), getOrderCount(authFetch)])
      .then(([list, count]) => {
        setOrders(Array.isArray(list) ? list : [])
        setTotal(count.total)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [authFetch, page])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (o: Order) => {
    if (!window.confirm(`Xóa đơn #${o.id}?`)) return
    try {
      await deleteOrder(authFetch, o.id)
      toast.success("Đã xóa đơn")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xóa thất bại")
    }
  }

  const saveStatus = async (o: Order) => {
    const status = statusDraft[o.id] ?? o.shippingStatus
    if (status === o.shippingStatus) {
      toast.message("Trạng thái không đổi")
      return
    }
    setSavingId(o.id)
    try {
      await updateShippingStatus(authFetch, o.id, status)
      toast.success("Đã cập nhật trạng thái giao hàng")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật thất bại")
    } finally {
      setSavingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Đơn hàng ({total})</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Người dùng</th>
                <th className="p-2">Tổng</th>
                <th className="p-2">TT</th>
                <th className="p-2">Giao hàng</th>
                <th className="p-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr className="border-t">
                    <td className="p-2">{o.id}</td>
                    <td className="p-2">{o.userId}</td>
                    <td className="p-2">{formatPrice(o.totalAmount)}</td>
                    <td className="p-2">
                      {o.paymentStatus ? "Đã TT" : "Chưa TT"}
                    </td>
                    <td className="p-2">{o.shippingStatus}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setOpenId(openId === o.id ? null : o.id)}
                        >
                          {openId === o.id ? "Ẩn" : "Chi tiết"}
                        </Button>
                        <Button size="xs" variant="destructive" onClick={() => remove(o)}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {openId === o.id ? (
                    <tr className="border-t bg-muted/20">
                      <td colSpan={6} className="p-3">
                        <div className="text-xs text-muted-foreground">
                          Địa chỉ: {o.address} - Phương thức: {o.paymentMethod}
                        </div>
                        {/* Đổi trạng thái giao hàng (backend tự thông báo + email cho chủ đơn) */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Trạng thái giao:</span>
                          <select
                            aria-label={`Trạng thái giao đơn ${o.id}`}
                            value={statusDraft[o.id] ?? o.shippingStatus}
                            onChange={(e) =>
                              setStatusDraft((prev) => ({ ...prev, [o.id]: e.target.value }))
                            }
                            className="h-8 rounded-md border bg-transparent px-2 text-sm"
                          >
                            {SHIPPING_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="xs"
                            disabled={savingId === o.id}
                            onClick={() => saveStatus(o)}
                          >
                            Lưu
                          </Button>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {o.details.map((d) => (
                            <li key={d.id} className="flex justify-between">
                              <span>
                                {d.name} x {d.quantity}
                              </span>
                              <span>{formatPrice(d.price)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Trước
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {page}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  )
}
