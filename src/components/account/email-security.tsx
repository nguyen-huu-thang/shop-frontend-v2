"use client"

// Bảo mật email trong trang Tài khoản: trạng thái xác minh + gửi lại email xác minh + OTP.
// SMTP demo có thể TẮT -> nút vẫn gọi backend; lấy token/OTP từ log backend để thử.
// Email security section: verification status + resend + OTP.
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestOtp, resendVerifyEmail, verifyOtp } from "@/lib/api/auth-email"
import { getMe } from "@/lib/api/user-api"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"

export function EmailSecuritySection() {
  const { authFetch } = useAuth()
  const [verified, setVerified] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState("")

  useEffect(() => {
    getMe(authFetch)
      .then((u) => setVerified(Boolean(u.email_verified)))
      .catch(() => setVerified(null))
  }, [authFetch])

  const resend = async () => {
    setBusy(true)
    try {
      const res = await resendVerifyEmail(authFetch)
      toast.success(res.message ?? "Đã gửi email xác minh")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gửi email thất bại (SMTP có thể chưa cấu hình)")
    } finally {
      setBusy(false)
    }
  }

  const sendOtp = async () => {
    setBusy(true)
    try {
      const res = await requestOtp(authFetch)
      toast.success(res.message ?? "Đã gửi OTP")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gửi OTP thất bại (SMTP có thể chưa cấu hình)")
    } finally {
      setBusy(false)
    }
  }

  const checkOtp = async () => {
    if (!otp.trim()) return
    setBusy(true)
    try {
      const res = await verifyOtp(authFetch, otp.trim())
      toast.success(res.message ?? "Xác thực OTP thành công")
      setOtp("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "OTP không hợp lệ / hết hạn")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Bảo mật email</h2>
      <div className="flex flex-col gap-4">
        {/* Trạng thái xác minh email */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Trạng thái email:</span>
          {verified === null ? (
            <span className="text-muted-foreground">đang kiểm tra...</span>
          ) : verified ? (
            <Badge variant="secondary">Đã xác minh</Badge>
          ) : (
            <>
              <Badge variant="outline">Chưa xác minh</Badge>
              <Button size="sm" variant="outline" disabled={busy} onClick={resend}>
                Gửi lại email xác minh
              </Button>
            </>
          )}
        </div>

        {/* OTP qua email */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Mã OTP qua email (demo)</Label>
          <div className="flex max-w-sm items-center gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={sendOtp}>
              Gửi OTP
            </Button>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập OTP"
              className="max-w-[140px]"
            />
            <Button size="sm" disabled={busy || !otp.trim()} onClick={checkOtp}>
              Xác thực
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
