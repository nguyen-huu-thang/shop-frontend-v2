// Thông báo in-app theo user (cần đăng nhập). Hộp thư + badge chuông.
// Per-user in-app notifications (login required): inbox + bell badge. Backend: /api/notifications.
import type { AuthFetch } from "@/lib/auth-context"
import type { Notification } from "@/lib/types"

// Hộp thư của tôi (phân trang).
export const getMyNotifications = (authFetch: AuthFetch, page = 1, limit = 20) =>
  authFetch<Notification[]>(`/api/notifications/me?page=${page}&limit=${limit}`)

// Số thông báo chưa đọc (cho badge chuông).
export const getMyUnreadCount = (authFetch: AuthFetch) =>
  authFetch<{ count: number }>("/api/notifications/me/unread-count")

// Đánh dấu một thông báo đã đọc (owner-only ở backend).
export const markNotificationRead = (authFetch: AuthFetch, id: number) =>
  authFetch<Notification>(`/api/notifications/${id}/read`, { method: "PATCH" })

// Đánh dấu tất cả đã đọc.
export const markAllNotificationsRead = (authFetch: AuthFetch) =>
  authFetch<{ updated: number }>("/api/notifications/me/read-all", {
    method: "PATCH",
  })

// Admin: gửi thông báo tới mọi user đang hoạt động (cần quyền create_notification).
export const broadcastNotification = (
  authFetch: AuthFetch,
  payload: { title: string; message: string; link?: string }
) =>
  authFetch<{ count: number }>("/api/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  })
