"use client"

// Quên mật khẩu: nhập email -> backend gửi liên kết đặt lại (luôn báo thành công để tránh dò tài khoản).
// Forgot password: enter email; backend always responds OK to avoid account enumeration.
import { useState } from "react"

import { Container } from "@/components/site/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/api/auth-email"
import { ApiError } from "@/lib/api-error"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await forgotPassword(email.trim())
      setSent(true)
      setMessage(res.message ?? "Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.")
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Gửi yêu cầu thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="py-12">
      <Card size="sm" className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Quên mật khẩu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                Mở liên kết trong email (hoặc lấy token reset từ log backend khi demo) rồi tới{" "}
                <a href="/reset-password" className="text-primary hover:underline">
                  trang đặt lại mật khẩu
                </a>
                .
              </p>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                Gửi liên kết đặt lại
              </Button>
            </form>
          )}
          <a href="/login" className="block text-sm text-primary hover:underline">
            Về đăng nhập
          </a>
        </CardContent>
      </Card>
    </Container>
  )
}
