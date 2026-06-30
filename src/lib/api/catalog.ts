// API danh mục/sản phẩm phía TRÌNH DUYỆT (công khai - không cần đăng nhập).
// Dùng publicFetch (gọi thẳng backend, credentials:"include"). Cho các thao tác client-side
// (chọn option, tìm kiếm có lọc, tải ảnh...). Trang SSR dùng server-api.ts thay vì file này.
// Browser-side public catalog API. Server pages use server-api.ts instead.
import { publicFetch } from "@/lib/api-client"
import type {
  Category,
  CountResponse,
  FileItem,
  OptionDefault,
  Product,
  ProductOption,
  ProductSearchResult,
  Review,
} from "@/lib/types"

const qs = (params: Record<string, string | number | undefined>): string => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

// ── Sản phẩm ─────────────────────────────────────────────────────────────────
export const getProducts = (page = 1, limit = 12) =>
  publicFetch<Product[]>(`/api/products${qs({ page, limit })}`)

export const getProduct = (id: number | string) =>
  publicFetch<Product>(`/api/products/${id}`)

export const getProductCount = () =>
  publicFetch<CountResponse>("/api/products/count")

export const getProductsByCategory = (categoryId: number | string) =>
  publicFetch<Product[]>(`/api/products/by-category/${categoryId}`)

export const getOptionDefault = (productId: number | string) =>
  publicFetch<OptionDefault>(`/api/products/${productId}/option-default`)

// Tìm option (SKU) khớp tổ hợp đã chọn → {id, price, stock}.
// Find the option (SKU) matching the chosen attribute values.
export const findOption = (
  productId: number | string,
  selected: Record<string, string>
) =>
  publicFetch<ProductOption>(`/api/products/${productId}/find-option`, {
    method: "POST",
    body: JSON.stringify(selected),
  })

// ── Danh mục ─────────────────────────────────────────────────────────────────
export const getCategories = () => publicFetch<Category[]>("/api/categories")

export const getCategory = (id: number | string) =>
  publicFetch<Category>(`/api/categories/${id}`)

export const getSubcategories = (id: number | string) =>
  publicFetch<Category[]>(`/api/categories/${id}/subcategories`)

// ── Ảnh sản phẩm (công khai) ─────────────────────────────────────────────────
export const getProductImages = (productId: number | string) =>
  publicFetch<FileItem[]>(`/api/files/product/${productId}`)

// ── Review công khai theo sản phẩm (chỉ review đã duyệt) ─────────────────────
export const getProductReviews = (
  productId: number | string,
  page = 1,
  limit = 10
) =>
  publicFetch<Review[]>(
    `/api/reviews/product/${productId}${qs({ page, limit })}`
  )

// ── Tìm kiếm sản phẩm (trả dict có cấu trúc) ─────────────────────────────────
export const searchProducts = (params: {
  keywords: string
  min_price?: number
  max_price?: number
  page?: number
  limit?: number
}) => publicFetch<ProductSearchResult>(`/api/search/products${qs(params)}`)
