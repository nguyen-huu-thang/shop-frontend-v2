// Gợi ý / cá nhân hóa. Tất cả trả MẢNG product DTO (cùng shape Product, camelCase).
// Backend TỰ ghi tín hiệu khi user đăng nhập tương tác -> FE KHÔNG gọi API log.
// Recommendations: trending/related public; recently-viewed/for-you need login.
import { publicFetch } from "@/lib/api-client"
import type { AuthFetch } from "@/lib/auth-context"
import type { Product } from "@/lib/types"

// Thịnh hành toàn site (công khai; kiêm fallback cho khách mới).
export const getTrending = (limit = 10) =>
  publicFetch<Product[]>(`/api/recommendations/trending?limit=${limit}`)

// Sản phẩm hay mua cùng ở trang chi tiết (công khai).
export const getRelatedProducts = (productId: number | string, limit = 10) =>
  publicFetch<Product[]>(`/api/products/${productId}/related?limit=${limit}`)

// Gợi ý cho bạn (đăng nhập; cold-start -> backend tự trả trending).
export const getForYou = (authFetch: AuthFetch, limit = 10) =>
  authFetch<Product[]>(`/api/recommendations/for-you?limit=${limit}`)

// Đã xem gần đây (đăng nhập).
export const getRecentlyViewed = (authFetch: AuthFetch, limit = 10) =>
  authFetch<Product[]>(`/api/recommendations/recently-viewed?limit=${limit}`)
