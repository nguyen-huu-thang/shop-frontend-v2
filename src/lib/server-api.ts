// API phía SERVER cho dữ liệu CÔNG KHAI (Server Components / SSR) - phục vụ SEO.
// Gọi backend qua INTERNAL_API_URL (không kèm auth). CHỈ import file này trong Server Component
// hoặc route handler. KHÔNG import vào Client Component (dùng biến server-only INTERNAL_API_URL).
// Server-side API for PUBLIC data (SSR for SEO). Import ONLY from Server Components.
import { ApiError } from "./api-error"
import type { Category, CountResponse, Product } from "./types"

// URL backend cho phía server (server-only - không có tiền tố NEXT_PUBLIC).
// Server-only backend URL.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8088"

interface ServerFetchOptions {
  // Số giây cache (ISR). Mặc định 60s cho trang public.
  // Cache seconds (ISR). Defaults to 60s for public pages.
  revalidate?: number
  // true → luôn lấy mới.
  // true → always fresh.
  noStore?: boolean
}

async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { revalidate = 60, noStore = false } = options
  const res = await fetch(`${INTERNAL_API_URL}${path}`, {
    headers: { Accept: "application/json" },
    ...(noStore ? { cache: "no-store" } : { next: { revalidate } }),
  })
  if (!res.ok) {
    let body = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw new ApiError(res.status, body)
  }
  return (await res.json()) as T
}

// Biến lỗi 404 thành null (cho trang chi tiết → notFound()).
// Turn a 404 into null (for detail pages → notFound()).
async function serverFetchOrNull<T>(
  path: string,
  options?: ServerFetchOptions
): Promise<T | null> {
  try {
    return await serverFetch<T>(path, options)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

const qs = (params: Record<string, string | number | undefined>): string => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

// ── Products (công khai) ─────────────────────────────────────────────────────
export const getProducts = (page = 1, limit = 10) =>
  serverFetch<Product[]>(`/api/products${qs({ page, limit })}`)

export const getProduct = (id: number | string) =>
  serverFetchOrNull<Product>(`/api/products/${id}`)

export const getProductCount = () =>
  serverFetch<CountResponse>("/api/products/count")

export const getProductsByCategory = (categoryId: number | string) =>
  serverFetch<Product[]>(`/api/products/by-category/${categoryId}`)

// ── Categories (công khai) ───────────────────────────────────────────────────
export const getCategories = () => serverFetch<Category[]>("/api/categories")

export const getCategory = (id: number | string) =>
  serverFetchOrNull<Category>(`/api/categories/${id}`)

export const getSubcategories = (id: number | string) =>
  serverFetch<Category[]>(`/api/categories/${id}/subcategories`)

// ── Search sản phẩm (công khai, trả dict) ────────────────────────────────────
export const searchProducts = (params: {
  keywords: string
  min_price?: number
  max_price?: number
  page?: number
  limit?: number
}) => serverFetch<unknown>(`/api/search/products${qs(params)}`)
