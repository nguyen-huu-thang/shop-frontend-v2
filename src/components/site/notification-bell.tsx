"use client"

// Chuông thông báo in-app (chỉ khi đăng nhập). Badge số chưa đọc + dropdown hộp thư.
// In-app notification bell (auth only): unread badge + inbox dropdown.
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  getMyNotifications,
  getMyUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications"
import { useAuth } from "@/lib/auth-context"
import { formatDateTime } from "@/lib/format"
import type { Notification } from "@/lib/types"

export function NotificationBell() {
  const { authFetch } = useAuth()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const loadCount = useCallback(() => {
    getMyUnreadCount(authFetch)
      .then((r) => setUnread(r.count ?? 0))
      .catch(() => setUnread(0))
  }, [authFetch])

  // Poll badge số chưa đọc mỗi 30s (nhẹ).
  useEffect(() => {
    loadCount()
    const t = setInterval(loadCount, 30000)
    return () => clearInterval(t)
  }, [loadCount])

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const openInbox = () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      getMyNotifications(authFetch, 1, 20)
        .then((data) => setItems(Array.isArray(data) ? data : []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }
  }

  const onItemClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(authFetch, n.id)
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
        setUnread((c) => Math.max(0, c - 1))
      } catch {
        // bỏ qua lỗi đánh dấu đọc, vẫn cho điều hướng
      }
    }
  }

  const readAll = async () => {
    try {
      await markAllNotificationsRead(authFetch)
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })))
      setUnread(0)
    } catch {
      // bỏ qua
    }
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Thông báo"
        onClick={openInbox}
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-popover shadow-md">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Thông báo</span>
            {unread > 0 ? (
              <button className="text-xs text-primary hover:underline" onClick={readAll}>
                Đọc tất cả
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Chưa có thông báo.</p>
            ) : (
              items.map((n) => {
                const body = (
                  <div
                    className={`border-b px-3 py-2 text-sm last:border-b-0 ${
                      n.is_read ? "" : "bg-accent/40"
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.message ? (
                      <p className="text-muted-foreground">{n.message}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                )
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => {
                      onItemClick(n)
                      setOpen(false)
                    }}
                    className="block hover:bg-accent/60"
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className="block w-full text-left hover:bg-accent/60"
                  >
                    {body}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
