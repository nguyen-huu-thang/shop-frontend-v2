"use client"

// Widget KIỂM THỬ Phần 1 (sẽ xóa khi dựng trang thật ở Phần 2):
// - Đăng nhập/đăng xuất gọi THẲNG backend (NEXT_PUBLIC_API_URL) + lưu access token RAM.
// - Hiển thị user giải mã từ JWT.
// - Gọi thử endpoint cần đăng nhập (/api/cart) qua authFetch để xác minh Bearer + refresh.
// Part 1 SMOKE-TEST widget (remove in Part 2).
import { useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api-error"
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

export function AuthDemo() {
  const { status, user, login, logout, authFetch } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [cartResult, setCartResult] = useState<string>("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await login(username, password)
      toast.success("Đăng nhập thành công")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Đăng nhập thất bại"
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const handleCart = async () => {
    setBusy(true)
    setCartResult("")
    try {
      const data = await authFetch<unknown>("/api/cart")
      setCartResult(JSON.stringify(data))
      toast.success("Gọi /api/cart thành công")
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.errorKey ?? ""} ${err.message}` : "Lỗi"
      toast.error(msg)
      setCartResult(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Kiểm thử xác thực (Phần 1)</CardTitle>
        <CardDescription>
          Trạng thái: <span className="font-medium">{status}</span>
          {user ? ` - ${user.username} (${user.email})` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {status === "authenticated" ? (
          <div className="flex flex-col gap-2">
            <Button onClick={handleCart} disabled={busy}>
              Gọi thử /api/cart (cần đăng nhập)
            </Button>
            <Button variant="outline" onClick={() => logout()} disabled={busy}>
              Đăng xuất
            </Button>
            {cartResult ? (
              <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">
                {cartResult}
              </pre>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={busy}>
              Đăng nhập
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
