"use client"

// Quản trị sản phẩm: liệt kê + tạo/sửa/xóa (trường cơ bản + giá/tồn của option mặc định).
// ⚠️ Trình chỉnh thuộc tính/biến thể (SKU) qua POST /api/products/{id}/attribute là phần phức tạp,
// để làm sau (ghi chú). Tạo/sửa ở đây quản lý option mặc định (giá + tồn) như backend create/update.
// Admin products: list + create/edit/delete (basic fields + default option price/stock).
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createProduct,
  deleteProduct,
  getManagedProductCount,
  getManagedProducts,
  updateProduct,
  type ProductPayload,
} from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/types"

const LIMIT = 10
const emptyForm: ProductPayload = {
  name: "",
  locationAddress: "",
  description: "",
  categoryId: null,
  discountPercentage: 0,
  price: null,
  stock: 0,
}

export default function AdminProductsPage() {
  const { authFetch } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductPayload>(emptyForm)
  const [busy, setBusy] = useState(false)

  // Dùng /managed: chỉ sản phẩm thuộc mảng category nhân viên phụ trách (superadmin thấy tất cả).
  // Use /managed so employees only see the categories they handle.
  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      getManagedProducts(authFetch, page, LIMIT),
      getManagedProductCount(authFetch),
    ])
      .then(([list, count]) => {
        setProducts(list)
        setTotal(count.total)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [authFetch, page])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      locationAddress: p.locationAddress ?? "",
      description: p.description ?? "",
      categoryId: p.categoryId,
      discountPercentage: p.discountPercentage ?? 0,
      price: p.price,
      stock: p.stock,
    })
    setShowForm(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editingId) {
        await updateProduct(authFetch, editingId, form)
        toast.success("Đã cập nhật sản phẩm")
      } else {
        await createProduct(authFetch, form)
        toast.success("Đã tạo sản phẩm")
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (p: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return
    try {
      await deleteProduct(authFetch, p.id)
      toast.success("Đã xóa")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xóa thất bại")
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const setField = (k: keyof ProductPayload, v: string | number | null) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sản phẩm ({total})</h1>
        <Button onClick={openCreate}>Thêm sản phẩm</Button>
      </div>

      {showForm ? (
        <form
          onSubmit={submit}
          className="mb-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="loc">Cơ sở (location)</Label>
            <Input
              id="loc"
              value={form.locationAddress}
              onChange={(e) => setField("locationAddress", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price">Giá</Label>
            <Input
              id="price"
              type="number"
              value={form.price ?? ""}
              onChange={(e) =>
                setField("price", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="stock">Tồn kho</Label>
            <Input
              id="stock"
              type="number"
              value={form.stock ?? 0}
              onChange={(e) => setField("stock", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cat">Mã danh mục</Label>
            <Input
              id="cat"
              type="number"
              value={form.categoryId ?? ""}
              onChange={(e) =>
                setField("categoryId", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disc">Giảm giá (%)</Label>
            <Input
              id="disc"
              type="number"
              value={form.discountPercentage ?? 0}
              onChange={(e) => setField("discountPercentage", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {editingId ? "Cập nhật" : "Tạo"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Lưu ý: chỉnh thuộc tính/biến thể (size, màu...) và nhiều SKU sẽ bổ sung sau.
          </p>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Tên</th>
                <th className="p-2">Giá</th>
                <th className="p-2">Tồn</th>
                <th className="p-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{formatPrice(p.price)}</td>
                  <td className="p-2">{p.stock}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="xs" variant="outline" onClick={() => openEdit(p)}>
                        Sửa
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => remove(p)}>
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
