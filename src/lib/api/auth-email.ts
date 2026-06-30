// Luồng tài khoản qua email bảo mật: xác minh email, quên/đặt lại mật khẩu, OTP.
// Công khai (token định danh user): verify-email, forgot-password, reset-password.
// Cần đăng nhập: resend verify, OTP request/verify.
// Account email flows. Public ones use publicFetch; logged-in ones use authFetch.
import { publicFetch } from "@/lib/api-client"
import type { AuthFetch } from "@/lib/auth-context"
import type { MessageResponse } from "@/lib/types"

// ── Xác minh email ───────────────────────────────────────────────────────────
export const verifyEmail = (token: string) =>
  publicFetch<MessageResponse>("/api/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  })

export const resendVerifyEmail = (authFetch: AuthFetch) =>
  authFetch<MessageResponse>("/api/verify-email/resend", { method: "POST" })

// ── Quên / Đặt lại mật khẩu ──────────────────────────────────────────────────
// Luôn trả 200 dù email không tồn tại (backend tránh dò tài khoản).
export const forgotPassword = (email: string) =>
  publicFetch<MessageResponse>("/api/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })

export const resetPassword = (token: string, newPassword: string) =>
  publicFetch<MessageResponse>("/api/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  })

// ── OTP ──────────────────────────────────────────────────────────────────────
export const requestOtp = (authFetch: AuthFetch) =>
  authFetch<MessageResponse>("/api/otp/request", { method: "POST" })

export const verifyOtp = (authFetch: AuthFetch, otp: string) =>
  authFetch<MessageResponse>("/api/otp/verify", {
    method: "POST",
    body: JSON.stringify({ otp }),
  })
