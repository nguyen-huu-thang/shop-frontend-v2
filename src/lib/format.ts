// Helper định dạng hiển thị theo locale Việt Nam.
// Display formatting helpers for the Vietnamese locale.

// Định dạng giá tiền (VND). null/undefined → "Liên hệ".
// Format price (VND). null/undefined → "Liên hệ".
export function formatPrice(value?: number | null): string {
  if (value === null || value === undefined) return "Liên hệ"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

// Định dạng ngày (DD/MM/YYYY) theo giờ địa phương.
// Format date (DD/MM/YYYY) in local time.
export function formatDate(iso?: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Định dạng ngày + giờ theo giờ địa phương.
// Format date + time in local time.
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// URL ảnh từ file_path của backend (phục vụ qua rewrite /media → backend /media).
// Image URL from backend file_path (served via the /media rewrite).
export function mediaUrl(filePath?: string | null): string | null {
  if (!filePath) return null
  const clean = filePath.replace(/^\/+/, "")
  return `/media/${clean}`
}
