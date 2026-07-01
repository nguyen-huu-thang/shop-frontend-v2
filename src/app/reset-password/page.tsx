"use client"

// Đặt lại mật khẩu: token (từ ?token= hoặc dán tay) + mật khẩu mới. Backend thu hồi mọi refresh token.
// Reset password: token + new password. Backend revokes all refresh tokens after reset.
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { resetPassword } from "@/lib/api/auth-email"
import { ApiError } from "@/lib/api-error"

function ResetPasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = params.get("token")
    if (t) setToken(t)
  }, [params])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự")
      return
    }
    setBusy(true)
    try {
      await resetPassword(token.trim(), password)
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đặt lại thất bại. Token có thể đã hết hạn.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="py-12">
      <Card size="sm" className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Đặt lại mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="rp-token">Token đặt lại</Label>
              <Input
                id="rp-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="token từ email / log backend"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rp-pass">Mật khẩu mới</Label>
              <PasswordInput
                id="rp-pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={busy || !token.trim()} className="w-full">
              Đặt lại mật khẩu
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  )
}
