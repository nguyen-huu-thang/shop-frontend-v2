"use client"

// Quản trị người dùng: liệt kê (phân trang, gồm cả user bị khóa) + tạo + khóa/mở + xóa.
// Admin users: list (paginated, includes locked) + create + activate/deactivate + delete.
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  createUser,
  deleteUser,
  getUserCount,
  getUsers,
  setUserActive,
  type UserCreatePayload,
} from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import type { UserInfo } from "@/lib/types"

const LIMIT = 10
const emptyForm: UserCreatePayload = {
  username: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  isActive: true,
}

export default function AdminUsersPage() {
  const { authFetch } = useAuth()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UserCreatePayload>(emptyForm)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getUsers(authFetch, page, LIMIT), getUserCount(authFetch)])
      .then(([list, count]) => {
        setUsers(Array.isArray(list) ? list : [])
        setTotal(count.total)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [authFetch, page])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await createUser(authFetch, {
        ...form,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      toast.success("Đã tạo người dùng")
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tạo thất bại")
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (u: UserInfo) => {
    try {
      await setUserActive(authFetch, u.id, !u.is_active)
      toast.success(u.is_active ? "Đã khóa" : "Đã mở khóa")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Thao tác thất bại")
    }
  }

  const remove = async (u: UserInfo) => {
    if (!window.confirm(`Xóa người dùng "${u.username}"?`)) return
    try {
      await deleteUser(authFetch, u.id)
      toast.success("Đã xóa")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xóa thất bại")
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const setField = (k: keyof UserCreatePayload, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Người dùng ({total})</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Đóng" : "Thêm người dùng"}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mb-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="u-username">Tên đăng nhập</Label>
            <Input
              id="u-username"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-email">Email</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-password">Mật khẩu</Label>
            <Input
              id="u-password"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-phone">Số điện thoại</Label>
            <Input
              id="u-phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              Tạo
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
                <th className="p-2">Email</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <Badge variant={u.is_active ? "default" : "destructive"}>
                      {u.is_active ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="xs" variant="outline" onClick={() => toggleActive(u)}>
                        {u.is_active ? "Khóa" : "Mở"}
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => remove(u)}>
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
