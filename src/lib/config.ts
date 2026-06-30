// Cấu hình AN TOÀN cho client (chỉ chứa biến NEXT_PUBLIC_* + hằng public).
// File này được import ở cả Client lẫn Server Component.
// Client-safe config (only NEXT_PUBLIC_* vars + public constants).

// Base URL backend dùng làm fallback / cho production (browser gọi thẳng - mô hình không proxy).
// Backend base URL fallback / for production.
export const NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088"

// Cổng backend (dùng khi dev tự suy host theo trình duyệt). Đổi qua NEXT_PUBLIC_API_PORT nếu cần.
// Backend port (used when dev derives the host from the browser).
export const API_PORT = process.env.NEXT_PUBLIC_API_PORT ?? "8088"

// URL public của site, cho sitemap/robots/canonical/OG.
// Public site URL for sitemap/robots/canonical/OG.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const IS_PROD = process.env.NODE_ENV === "production"

// Base URL backend mà TRÌNH DUYỆT gọi thẳng.
// - Dev: dùng ĐÚNG host trình duyệt đang mở (localhost hoặc IP LAN) + cổng backend → cùng-site,
//   không cần sửa .env khi đổi giữa localhost và IP LAN (vd http://192.168.0.103:3000).
// - Prod: dùng NEXT_PUBLIC_API_URL (backend có thể khác domain).
// Browser-side backend base URL: derives host from the browser in dev; uses the env in prod.
export function apiBase(): string {
  if (!IS_PROD && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`
  }
  return NEXT_PUBLIC_API_URL
}
