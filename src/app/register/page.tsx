"use client"

// Đăng ký. Backend đã có POST /api/register (trả {message}, không auto-login) → chuyển sang /login.
// Register page.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { register } from "@/lib/api/user-api"
import { ApiError } from "@/lib/api-error"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  })
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      toast.success("Đăng ký thành công, vui lòng đăng nhập")
      router.push("/login")
    } catch (err) {
      // Backend trả message rõ cho trùng username (E1006) / email (E1001).
      // Backend returns a clear message for duplicate username/email.
      toast.error(err instanceof ApiError ? err.message : "Đăng ký thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Tạo tài khoản để mua sắm và theo dõi đơn hàng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input id="username" value={form.username} onChange={set("username")} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={set("password")}
                minLength={6}
                required
              />
              <span className="text-xs text-muted-foreground">
                Tối thiểu 6 ký tự.
              </span>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" value={form.address} onChange={set("address")} />
            </div>
            <Button type="submit" disabled={busy}>
              Đăng ký
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  )
}
