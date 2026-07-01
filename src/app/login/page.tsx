"use client"

// Đăng nhập. Dùng auth-context.login (gọi thẳng backend, token RAM + refresh cookie).
// Login page.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getMyPermissions } from "@/lib/api/account"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api-error"

export default function LoginPage() {
  const router = useRouter()
  const { status, login, authFetch } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  // Điều hướng sau xác thực: ưu tiên returnUrl (trang người dùng đang muốn vào), nếu không thì
  // theo vai trò - có quyền quản trị -> /admin, khách thường -> trang chủ.
  // Chỉ nhận returnUrl là path nội bộ (bắt đầu "/" nhưng không "//") để tránh open-redirect.
  // Post-auth redirect: prefer a safe internal returnUrl, else role-based (/admin or /).
  const redirectAfterAuth = useCallback(async () => {
    const raw =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("returnUrl")
        : null
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
      router.replace(raw)
      return
    }
    try {
      const perms = await getMyPermissions(authFetch)
      router.replace(Array.isArray(perms) && perms.length > 0 ? "/admin" : "/")
    } catch {
      router.replace("/")
    }
  }, [authFetch, router])

  // Đã đăng nhập sẵn mà mở /login → điều hướng theo vai trò.
  // Already authenticated visiting /login → redirect by role.
  useEffect(() => {
    if (status === "authenticated") redirectAfterAuth()
  }, [status, redirectAfterAuth])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await login(username, password)
      toast.success("Đăng nhập thành công")
      await redirectAfterAuth()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đăng nhập thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng nhập</CardTitle>
          <CardDescription>Đăng nhập để mua sắm và quản lý đơn hàng.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              Đăng nhập
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  )
}
