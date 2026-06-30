// API quản trị (store manager). Mọi hàm nhận authFetch (cần đăng nhập + quyền tương ứng).
// Backend thực thi quyền; frontend chỉ ẩn UI qua usePermissions.
// Admin (store manager) API. Each function takes authFetch (login + permission required).
import type { AuthFetch } from "@/lib/auth-context"
import type {
  Category,
  Coupon,
  CountResponse,
  DashboardStats,
  MessageResponse,
  Order,
  Product,
  Review,
  UserInfo,
} from "@/lib/types"

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = (authFetch: AuthFetch) =>
  authFetch<DashboardStats>("/api/dashboard/stats")

// ── Products ─────────────────────────────────────────────────────────────────
export interface ProductPayload {
  name: string
  locationAddress: string
  description?: string | null
  categoryId?: number | null
  discountPercentage?: number | null
  price?: number | null
  stock?: number
}

export const createProduct = (authFetch: AuthFetch, payload: ProductPayload) =>
  authFetch<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const updateProduct = (
  authFetch: AuthFetch,
  id: number,
  payload: Partial<ProductPayload>
) =>
  authFetch<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

export const deleteProduct = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/products/${id}`, { method: "DELETE" })

// Sản phẩm cho khu quản trị: chỉ mảng category nhân viên phụ trách (superadmin thấy tất cả).
// Managed products: only the categories an employee handles (superadmin sees all).
export const getManagedProducts = (authFetch: AuthFetch, page = 1, limit = 10) =>
  authFetch<Product[]>(`/api/products/managed?page=${page}&limit=${limit}`)

export const getManagedProductCount = (authFetch: AuthFetch) =>
  authFetch<CountResponse>("/api/products/managed/count")

// ── Categories ───────────────────────────────────────────────────────────────
export interface CategoryPayload {
  name: string
  description?: string | null
  parentId?: number | null
}

export const createCategory = (authFetch: AuthFetch, payload: CategoryPayload) =>
  authFetch<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const updateCategory = (
  authFetch: AuthFetch,
  id: number,
  payload: Partial<CategoryPayload>
) =>
  authFetch<Category>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

export const deleteCategory = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/categories/${id}`, { method: "DELETE" })

// ── Coupons ──────────────────────────────────────────────────────────────────
export interface CouponPayload {
  code: string
  discount: number
  startDate: string // ISO datetime
  endDate: string
  isActive?: boolean
  // ── Coupon nâng cấp (backend đã hỗ trợ) ────────────────────────────────────
  discountType?: "fixed" | "percent" // số tiền | phần trăm
  maxDiscount?: number | null // trần giảm khi percent; null = không trần
  minOrderAmount?: number // đơn tối thiểu (tính trên tiền hàng)
  appliesTo?: "product" | "shipping" // giảm tiền hàng | giảm phí ship
  usageLimit?: number | null // tổng lượt dùng; null = không giới hạn
  perUserOnce?: boolean // mỗi user chỉ dùng 1 lần
}

export const getCoupons = (authFetch: AuthFetch) =>
  authFetch<Coupon[]>("/api/coupons")

export const createCoupon = (authFetch: AuthFetch, payload: CouponPayload) =>
  authFetch<Coupon>("/api/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const updateCoupon = (
  authFetch: AuthFetch,
  id: number,
  payload: Partial<CouponPayload>
) =>
  authFetch<Coupon>(`/api/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

export const deleteCoupon = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/coupons/${id}`, { method: "DELETE" })

// ── Orders (quản trị) ────────────────────────────────────────────────────────
export const getAllOrders = (authFetch: AuthFetch, page = 1, limit = 10) =>
  authFetch<Order[]>(`/api/orders/all?page=${page}&limit=${limit}`)

export const getOrderCount = (authFetch: AuthFetch) =>
  authFetch<CountResponse>("/api/orders/count")

export const deleteOrder = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/orders/${id}`, { method: "DELETE" })

// Đổi trạng thái giao hàng (admin) -> backend tự thông báo + email cho chủ đơn.
// Update shipping status (admin); backend notifies the order owner.
export const updateShippingStatus = (
  authFetch: AuthFetch,
  id: number,
  status: string
) =>
  authFetch<Order>(`/api/orders/${id}/shipping-status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })

// ── Cá nhân hóa (admin) ───────────────────────────────────────────────────────
// Dựng lại bảng "mua cùng" thủ công (cần quyền manage_recommendations).
export const rebuildCooccurrence = (authFetch: AuthFetch) =>
  authFetch<MessageResponse>(
    "/api/recommendations/admin/rebuild-cooccurrence",
    { method: "POST" }
  )

// ── Reviews (duyệt) ──────────────────────────────────────────────────────────
export const getAllReviews = (authFetch: AuthFetch) =>
  authFetch<Review[]>("/api/reviews")

export const approveReview = (authFetch: AuthFetch, id: number) =>
  authFetch<Review>(`/api/reviews/${id}/approve`, { method: "PATCH" })

export const disapproveReview = (authFetch: AuthFetch, id: number) =>
  authFetch<Review>(`/api/reviews/${id}/disapprove`, { method: "PATCH" })

export const deleteReview = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/reviews/${id}`, { method: "DELETE" })

// ── Users (quản trị) ─────────────────────────────────────────────────────────
export interface UserCreatePayload {
  username: string
  email: string
  password: string
  phone?: string
  address?: string
  isActive?: boolean
}

export const getUsers = (authFetch: AuthFetch, page = 1, limit = 10) =>
  authFetch<UserInfo[]>(`/api/users?page=${page}&limit=${limit}`)

export const getUserCount = (authFetch: AuthFetch) =>
  authFetch<CountResponse>("/api/users/count")

export const createUser = (authFetch: AuthFetch, payload: UserCreatePayload) =>
  authFetch<UserInfo>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const setUserActive = (
  authFetch: AuthFetch,
  id: number,
  isActive: boolean
) =>
  authFetch<UserInfo>(`/api/users/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })

export const deleteUser = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/users/${id}`, { method: "DELETE" })
