// User: đăng ký + hồ sơ (backend đã có user_controller - cap-nhat-backend-2026-06-25.md mục 1).
// User: register + profile (backend now available).
import { publicFetch } from "@/lib/api-client"
import type { AuthFetch } from "@/lib/auth-context"
import type { UserInfo } from "@/lib/types"

export interface RegisterPayload {
  username: string
  email: string
  password: string
  phone?: string
  address?: string
}

// POST /api/register → {message} (KHÔNG auto-login, client tự sang /login).
// Ràng buộc: username 3-20, email 3-255, password >= 6, phone <= 15, address <= 255.
// Trùng: username E1006, email E1001.
export const register = (payload: RegisterPayload) =>
  publicFetch<{ message: string }>("/api/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })

// GET /api/me → thông tin user hiện tại (kèm phone/address mà JWT không có).
export const getMe = (authFetch: AuthFetch) => authFetch<UserInfo>("/api/me")

// PUT /api/me → cập nhật hồ sơ (cần >= 1 trường). Email trùng người khác → E1001.
export const updateProfile = (
  authFetch: AuthFetch,
  payload: { email?: string; phone?: string; address?: string }
) =>
  authFetch<UserInfo>("/api/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
