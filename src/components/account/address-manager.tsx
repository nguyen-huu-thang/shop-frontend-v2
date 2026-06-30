"use client"

// Sổ địa chỉ trong trang Tài khoản: liệt kê + thêm/sửa/xóa + đặt mặc định.
// Address book section on the account page: list + add/edit/delete + set default.
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { AddressForm } from "@/components/account/address-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/lib/api/address"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import type { Address, AddressPayload } from "@/lib/types"

export function formatAddress(a: Address): string {
  return `${a.detail}, ${a.ward}, ${a.district}, ${a.province}`
}

export function AddressManager() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  // null = không mở form; "new" = thêm mới; số = id đang sửa.
  const [editing, setEditing] = useState<"new" | number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getAddresses(authFetch)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (payload: AddressPayload) => {
    setBusy(true)
    try {
      if (editing === "new") {
        await createAddress(authFetch, payload)
        toast.success("Đã thêm địa chỉ")
      } else if (typeof editing === "number") {
        await updateAddress(authFetch, editing, payload)
        toast.success("Đã cập nhật địa chỉ")
      }
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu địa chỉ thất bại")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAddress(authFetch, id)
      toast.success("Đã xóa địa chỉ")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xóa thất bại")
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(authFetch, id)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đặt mặc định thất bại")
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sổ địa chỉ</h2>
        {editing === null ? (
          <Button size="sm" onClick={() => setEditing("new")}>
            Thêm địa chỉ
          </Button>
        ) : null}
      </div>

      {editing === "new" ? (
        <Card size="sm" className="mb-4">
          <CardContent className="pt-4">
            <AddressForm
              busy={busy}
              submitLabel="Thêm địa chỉ"
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : items.length === 0 && editing === null ? (
        <p className="text-sm text-muted-foreground">Bạn chưa có địa chỉ nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) =>
            editing === a.id ? (
              <Card key={a.id} size="sm">
                <CardContent className="pt-4">
                  <AddressForm
                    initial={a}
                    busy={busy}
                    submitLabel="Lưu thay đổi"
                    onSubmit={handleSubmit}
                    onCancel={() => setEditing(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card key={a.id} size="sm">
                <CardContent className="flex flex-wrap items-start justify-between gap-2 pt-4">
                  <div className="text-sm">
                    <p className="font-medium">
                      {a.recipientName} · {a.recipientPhone}
                      {a.isDefault ? (
                        <Badge variant="secondary" className="ml-2">
                          Mặc định
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground">{formatAddress(a)}</p>
                  </div>
                  <div className="flex gap-1">
                    {!a.isDefault ? (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(a.id)}>
                        Đặt mặc định
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(a.id)}>
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(a.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </section>
  )
}
