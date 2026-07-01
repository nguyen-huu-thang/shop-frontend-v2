"use client"

// Tài khoản (cần đăng nhập): thông tin user (từ JWT), lịch sử đơn hàng, đổi mật khẩu.
// ⚠️ Sửa hồ sơ/địa chỉ chờ backend (khoảng trống #2) - chỉ hiển thị thông tin từ JWT.
// Account page (login required): user info (from JWT), orders, change password.
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { AddressManager } from "@/components/account/address-manager"
import { EmailSecuritySection } from "@/components/account/email-security"
import { RequireAuth } from "@/components/auth/require-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { changePassword, getMyOrders } from "@/lib/api/account"
import { getMe, updateProfile } from "@/lib/api/user-api"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { formatPrice } from "@/lib/format"
import {
  orderDisplayStatus,
  ORDER_STATUS_LABEL,
  paymentLabel,
  shippingLabel,
} from "@/lib/order-status"
import type { Order, UserInfo } from "@/lib/types"

// Màu badge theo trạng thái tổng hợp của đơn.
const STATUS_VARIANT: Record<
  ReturnType<typeof orderDisplayStatus>,
  "secondary" | "outline" | "destructive"
> = {
  paid: "secondary",
  awaiting_payment: "outline",
  cod_unpaid: "outline",
  cancelled: "destructive",
}

function OrdersSection() {
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
    <section>
      <h2 className="mb-3 text-lg font-semibold">Lịch sử đơn hàng</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const status = orderDisplayStatus(o)
            return (
              <Card key={o.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <Link href={`/orders/${o.id}`} className="hover:text-primary">
                      Đơn #{o.id}
                    </Link>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatPrice(o.totalAmount)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
                    <span className="text-muted-foreground">
                      {paymentLabel(o.paymentMethod)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Địa chỉ: {o.address}</p>
                  <p className="text-muted-foreground">
                    Giao hàng: {shippingLabel(o.shippingStatus)}
                  </p>
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

// Hồ sơ: xem + sửa email/phone/address (GET/PUT /api/me).
// Profile: view + edit email/phone/address.
function ProfileSection() {
  const { authFetch } = useAuth()
  const [info, setInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ email: "", phone: "", address: "" })

  useEffect(() => {
    getMe(authFetch)
      .then((u) => {
        setInfo(u)
        setForm({
          email: u.email ?? "",
          phone: u.phone ?? "",
          address: u.address ?? "",
        })
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false))
  }, [authFetch])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const updated = await updateProfile(authFetch, {
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      setInfo(updated)
      toast.success("Đã cập nhật hồ sơ")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật thất bại")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="mb-3 text-lg font-semibold">Hồ sơ</h2>
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Hồ sơ</h2>
      <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="p-username">Tên đăng nhập</Label>
          <Input id="p-username" value={info?.username ?? ""} disabled />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" type="email" value={form.email} onChange={set("email")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-phone">Số điện thoại</Label>
          <Input id="p-phone" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-address">Địa chỉ</Label>
          <Input id="p-address" value={form.address} onChange={set("address")} />
        </div>
        <Button type="submit" disabled={busy} className="w-fit">
          Lưu hồ sơ
        </Button>
      </form>
    </section>
  )
}

function ChangePasswordSection() {
  const { authFetch } = useAuth()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [logoutOthers, setLogoutOthers] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await changePassword(authFetch, current, next, logoutOthers)
      toast.success(
        logoutOthers
          ? "Đổi mật khẩu thành công. Đã đăng xuất các phiên khác."
          : "Đổi mật khẩu thành công"
      )
      setCurrent("")
      setNext("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đổi mật khẩu thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Đổi mật khẩu</h2>
      <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="current">Mật khẩu hiện tại</Label>
          <PasswordInput
            id="current"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="next">Mật khẩu mới</Label>
          <PasswordInput
            id="next"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={logoutOthers}
            onChange={(e) => setLogoutOthers(e.target.checked)}
          />
          Đăng xuất tất cả phiên khác (giữ phiên hiện tại)
        </label>
        <Button type="submit" disabled={busy} className="w-fit">
          Cập nhật mật khẩu
        </Button>
      </form>
    </section>
  )
}

function AccountContent() {
  const { user } = useAuth()

  return (
    <Container className="py-8">
      <h1 className="mb-1 text-xl font-semibold">Tài khoản</h1>
      {user ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {user.username} - {user.email}
          {" · "}
          <a href="/admin" className="text-primary hover:underline">
            Khu quản trị
          </a>
        </p>
      ) : null}

      <div className="flex flex-col gap-8">
        <ProfileSection />
        <Separator />
        <AddressManager />
        <Separator />
        <OrdersSection />
        <Separator />
        <ChangePasswordSection />
        <Separator />
        <EmailSecuritySection />
      </div>
    </Container>
  )
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  )
}
