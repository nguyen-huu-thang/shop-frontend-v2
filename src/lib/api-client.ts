// Fetch phía TRÌNH DUYỆT cho endpoint CÔNG KHAI (không cần đăng nhập).
// Mô hình không proxy: gọi THẲNG backend qua NEXT_PUBLIC_API_URL. Luôn đặt credentials:"include"
// để cookie refresh cross-site hoạt động (sau khi backend bật CORS allow_credentials + samesite).
// Browser fetch for PUBLIC endpoints. Calls the backend DIRECTLY (no proxy).
"use client"

import { apiBase } from "./config"
import { ApiError } from "./api-error"

export async function publicFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json")
  }
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
