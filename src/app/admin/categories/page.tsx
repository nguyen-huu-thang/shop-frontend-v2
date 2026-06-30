"use client"

// Quản trị danh mục: liệt kê (cây cha-con) + tạo/sửa/xóa. parentId rỗng = danh mục gốc.
// Admin categories: list + create/edit/delete.
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getCategories } from "@/lib/api/catalog"
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryPayload,
} from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import type { Category } from "@/lib/types"

const emptyForm: CategoryPayload = { name: "", description: "", parentId: null }

export default function AdminCategoriesPage() {
  const { authFetch } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CategoryPayload>(emptyForm)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (c: Category) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      description: c.description ?? "",
      parentId: c.parent_id ?? null,
    })
    setShowForm(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editingId) {
        await updateCategory(authFetch, editingId, form)
        toast.success("Đã cập nhật danh mục")
      } else {
        await createCategory(authFetch, form)
        toast.success("Đã tạo danh mục")
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: Category) => {
    if (!window.confirm(`Xóa danh mục "${c.name}"?`)) return
    try {
      await deleteCategory(authFetch, c.id)
      toast.success("Đã xóa")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xóa thất bại")
    }
  }

  const setField = (k: keyof CategoryPayload, v: string | number | null) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh mục ({categories.length})</h1>
        <Button onClick={openCreate}>Thêm danh mục</Button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mb-6 grid max-w-lg gap-3 rounded-lg border p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Tên</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="parent">Mã danh mục cha (để trống nếu gốc)</Label>
            <Input
              id="parent"
              type="number"
              value={form.parentId ?? ""}
              onChange={(e) =>
                setField("parentId", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
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
                <th className="p-2">ID</th>
                <th className="p-2">Tên</th>
                <th className="p-2">Đường dẫn phân cấp</th>
                <th className="p-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2 text-muted-foreground">{c.hierarchy_path ?? "-"}</td>
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
