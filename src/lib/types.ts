// TypeScript types khớp với DTO response của backend (shop/backend/app/dto).
// ⚠️ Backend TRỘN casing: nhiều response là snake_case (CategoryResponse, ReviewResponse...),
//    nhưng Order/Dashboard/Cart là camelCase. Mỗi type ghi rõ casing theo đúng JSON thực tế.
// TypeScript types matching backend response DTOs. Casing is MIXED per endpoint - see notes.

// ── Auth (token_response.py - camelCase) ─────────────────────────────────────
export interface AccessTokenResponse {
  accessToken: string
}

export interface MessageResponse {
  message: string
}

// Lỗi nghiệp vụ chuẩn: {errorKey, code, message, details?} (exception/handler.py).
// Standard business error shape.
export interface ApiErrorBody {
  errorKey: string
  code: number
  message: string
  details?: unknown
}

// ── Category (category_response.py - snake_case) ─────────────────────────────
export interface Category {
  id: number
  name: string
  description?: string | null
  parent_id?: number | null
  hierarchy_path?: string | null
  hierarchy_path_by_id?: string | null
}

// ── Product (product_service._to_dto - camelCase) ────────────────────────────
// price = giá thấp nhất trong các option (hoặc giá option mặc định); KHÔNG kèm ảnh.
// Ảnh lấy riêng qua GET /api/files/product/{id} → file_path → /media/{file_path}.
export interface Product {
  id: number
  name: string
  locationAddress: string
  categoryId: number | null
  description: string | null
  price: number | null
  stock: number
  // {tên thuộc tính: [giá trị, ...]} - vd {"Size": ["S","M"], "Màu": ["Đỏ"]}
  attribute: Record<string, string[]>
  discountPercentage: number | null
  // Đường dẫn ảnh đại diện (file_path); dựng URL qua mediaUrl(). null nếu chưa có ảnh.
  // Primary image path; build the URL via mediaUrl(). null if no image.
  imageUrl?: string | null
}

// Option (SKU) - giá + tồn kho của một tổ hợp lựa chọn.
// /products/{id}/option-default trả {id, prices, stock} (lưu ý key "prices").
// /products/{id}/find-option trả {id, price, stock}.
export interface ProductOption {
  id: number
  price: number
  stock: number
}

export interface OptionDefault {
  id: number
  prices: number | null
  stock: number
}

// Kết quả tìm kiếm sản phẩm (search_service.search_product - CÓ total).
// Product search result (has total, unlike plain list endpoints).
export interface ProductSearchResult {
  total: number
  page: number
  limit: number
  results: { product: Product; relevanceScore: number }[]
}

// ── Cart (cart_controller - camelCase). Backend đã thêm productId/productName/price/subtotal.
export interface CartItem {
  id: number
  userId: number
  productId: number
  productName: string
  productOptionId: number
  price: number
  quantity: number
  subtotal: number
  optionValues: Record<string, string>
}

export interface CartCreatePayload {
  productOptionId: number
  quantity?: number
}

// ── Wishlist (GET /api/wishlist - backend đã thêm wishlistId để xóa) ──────────
export interface WishlistItem {
  wishlistId: number
  productId: number
  name: string
}

// ── Order (order_response.py - camelCase) ────────────────────────────────────
export interface OrderDetail {
  id: number
  name: string
  price: number
  quantity: number
  url?: string | null
}

export interface Order {
  id: number
  userId: number
  address: string
  totalAmount: number
  paymentMethod: string
  shippingStatus: string
  paymentStatus: boolean
  details: OrderDetail[]
}

// Tạo đơn (shape MỚI khớp OrderCreateRequest backend): đặt từ cartIds + địa chỉ trong sổ +
// coupon + nhà cung cấp thanh toán. Thay shape cũ (address text + paymentMethod).
// Create order (NEW shape): cart ids + saved address + coupon + payment provider.
export interface OrderCreatePayload {
  cartIds: number[]
  addressId: number
  couponCode?: string
  paymentProvider: "cod" | "mock_online"
}

// Xem trước tổng tiền checkout (POST /api/orders/preview) - không tạo đơn.
// Preview the checkout totals without creating an order.
export interface OrderPreviewPayload {
  cartIds: number[]
  addressId?: number
  couponCode?: string
}

// Breakdown tiền (OrderPreviewResponse - camelCase).
export interface OrderPreview {
  subtotal: number
  shippingFee: number
  productDiscount: number
  shipDiscount: number
  total: number
  couponApplied: boolean
  couponCode?: string | null
}

// Khởi tạo thanh toán cổng giả lập (PaymentInitResponse).
export interface PaymentInit {
  orderId: number
  paymentRef: string
  mockUrl: string
}

// ── Sổ địa chỉ (AddressResponse - camelCase) ─────────────────────────────────
export interface Address {
  id: number
  recipientName: string
  recipientPhone: string
  province: string
  district: string
  ward: string
  detail: string
  lat?: number | null
  lng?: number | null
  isDefault: boolean
}

// Payload tạo/sửa địa chỉ (alias camelCase backend chấp nhận).
export interface AddressPayload {
  recipientName: string
  recipientPhone: string
  province: string
  district: string
  ward: string
  detail: string
  lat?: number | null
  lng?: number | null
  isDefault?: boolean
}

// ── Review (review_response.py - snake_case) ─────────────────────────────────
export interface Review {
  id: number
  product_id: number
  user_id: number
  rating: number
  comment?: string | null
  is_approved: boolean
}

// ── Coupon (coupon_response.py - snake_case, ngày dạng ISO datetime) ─────────
// discount_type: "fixed" (số tiền) | "percent" (%). applies_to: "product" | "shipping".
export interface Coupon {
  id: number
  code: string
  discount: number
  start_date: string
  end_date: string
  is_active: boolean
  discount_type: "fixed" | "percent"
  max_discount?: number | null
  min_order_amount: number
  applies_to: "product" | "shipping"
  usage_limit?: number | null
  used_count: number
  per_user_once: boolean
}

// ── Notification (notification_response.py - snake_case) ─────────────────────
export interface Notification {
  id: number
  user_id: number
  title: string
  message?: string | null
  type: string
  link?: string | null
  is_read: boolean
  created_at: string
  read_at?: string | null
}

// ── File (file_response.py - snake_case). Ảnh phục vụ qua /media/{file_path} ──
export interface FileItem {
  id: number
  user_id: number
  file_name: string
  file_path: string
  file_size: number
  sort?: number | null
  target_id?: number | null
  list_table_id?: string | null
  uploaded_at: string
  is_active: boolean
  description?: string | null
}

// ── User (UserResponse - snake_case: id, username, email, phone, address, is_active) ─
export interface UserInfo {
  id: number
  username: string
  email: string
  phone?: string | null
  address?: string | null
  is_active?: boolean
  email_verified?: boolean
}

// Đếm tổng (CountResponse) - dùng cho phân trang chính xác.
// Total count for accurate pagination.
export interface CountResponse {
  total: number
}

// ── Dashboard (dashboard_response.py - camelCase) ────────────────────────────
export interface TopProduct {
  productId: number
  name: string
  totalSold: number
}

export interface DashboardStats {
  revenuePaid: number
  totalOrders: number
  ordersToday: number
  unpaidOrders: number
  totalProducts: number
  lowStockOptions: number
  totalUsers: number
  totalReviews: number
  topProducts: TopProduct[]
}
