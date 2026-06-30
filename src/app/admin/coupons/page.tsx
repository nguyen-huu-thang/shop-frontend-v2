"use client"

// Quản trị mã giảm giá: liệt kê + tạo/sửa/xóa.
// Admin coupons: list + create/edit/delete.
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
  type CouponPayload,
} from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatDate, formatPrice } from "@/lib/format"
import type { Coupon } from "@/lib/types"

// Chuyển input date (YYYY-MM-DD) → ISO datetime để gửi backend.
// Convert a date input to an ISO datetime for the backend.
const toIso = (d: string) => (d ? new Date(d).toISOString() : "")
const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : "")

interface FormState {
  code: string
  discount: number
  startDate: string // YYYY-MM-DD (input)
  endDate: string
  isActive: boolean
  discountType: "fixed" | "percent"
  maxDiscount: string // để trống = không trần
  minOrderAmount: number
  appliesTo: "product" | "shipping"
  usageLimit: string // để trống = không giới hạn
  perUserOnce: boolean
}
const emptyForm: FormState = {
  code: "",
  discount: 0,
  startDate: "",
  endDate: "",
  isActive: true,
  discountType: "fixed",
  maxDiscount: "",
  minOrderAmount: 0,
  appliesTo: "product",
  usageLimit: "",
  perUserOnce: false,
}

export default function AdminCouponsPage() {
  const { authFetch } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCoupons(authFetch)
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false))
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      discount: c.discount,
      startDate: toDateInput(c.start_date),
      endDate: toDateInput(c.end_date),
      isActive: c.is_active,
      discountType: c.discount_type,
      maxDiscount: c.max_discount != null ? String(c.max_discount) : "",
      minOrderAmount: c.min_order_amount,
      appliesTo: c.applies_to,
      usageLimit: c.usage_limit != null ? String(c.usage_limit) : "",
      perUserOnce: c.per_user_once,
    })
    setShowForm(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const payload: CouponPayload = {
      code: form.code,
      discount: form.discount,
      startDate: toIso(form.startDate),
      endDate: toIso(form.endDate),
      isActive: form.isActive,
      discountType: form.discountType,
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      minOrderAmount: form.minOrderAmount,
      appliesTo: form.appliesTo,
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      perUserOnce: form.perUserOnce,
    }
    try {
      if (editingId) {
        await updateCoupon(authFetch, editingId, payload)
        toast.success("Đã cập nhật mã")
      } else {
        await createCoupon(authFetch, payload)
        toast.success("Đã tạo mã")
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: Coupon) => {
    if (!window.confirm(`Xóa mã "${c.code}"?`)) return
    try {
      await deleteCoupon(authFetch, c.id)
      toast.success("Đã xóa")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xóa thất bại")
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mã giảm giá ({coupons.length})</h1>
        <Button onClick={openCreate}>Thêm mã</Button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mb-6 grid max-w-lg gap-3 rounded-lg border p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="code">Mã</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="discountType">Loại giảm</Label>
              <select
                id="discountType"
                aria-label="Loại giảm"
                value={form.discountType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, discountType: e.target.value as "fixed" | "percent" }))
                }
                className="h-9 rounded-md border bg-transparent px-2 text-sm"
              >
                <option value="fixed">Số tiền (VND)</option>
                <option value="percent">Phần trăm (%)</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="discount">
                Giá trị giảm {form.discountType === "percent" ? "(%)" : "(VND)"}
              </Label>
              <Input
                id="discount"
                type="number"
                value={form.discount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, discount: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="appliesTo">Áp dụng cho</Label>
              <select
                id="appliesTo"
                aria-label="Áp dụng cho"
                value={form.appliesTo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, appliesTo: e.target.value as "product" | "shipping" }))
                }
                className="h-9 rounded-md border bg-transparent px-2 text-sm"
              >
                <option value="product">Tiền hàng</option>
                <option value="shipping">Phí vận chuyển</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxDiscount">Trần giảm (để trống = không trần)</Label>
              <Input
                id="maxDiscount"
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))}
                placeholder="VD: 100000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="minOrder">Đơn tối thiểu</Label>
              <Input
                id="minOrder"
                type="number"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, minOrderAmount: Number(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="usageLimit">Giới hạn lượt (để trống = không giới hạn)</Label>
              <Input
                id="usageLimit"
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                placeholder="VD: 1000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">Bắt đầu</Label>
              <Input
                id="start"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end">Kết thúc</Label>
              <Input
                id="end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Đang kích hoạt
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.perUserOnce}
              onChange={(e) => setForm((p) => ({ ...p, perUserOnce: e.target.checked }))}
            />
            Mỗi người dùng chỉ dùng 1 lần
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {editingId ? "Cập nhật" : "Tạo"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Mã</th>
                <th className="p-2">Giảm</th>
                <th className="p-2">Hiệu lực</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2 font-medium">{c.code}</td>
                  <td className="p-2">
                    {c.discount_type === "percent" ? `${c.discount}%` : formatPrice(c.discount)}
                    <span className="block text-xs text-muted-foreground">
                      {c.applies_to === "shipping" ? "phí ship" : "tiền hàng"}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {formatDate(c.start_date)} - {formatDate(c.end_date)}
                  </td>
                  <td className="p-2">
                    {c.is_active ? "Kích hoạt" : "Tắt"}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="xs" variant="outline" onClick={() => openEdit(c)}>
                        Sửa
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => remove(c)}>
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
