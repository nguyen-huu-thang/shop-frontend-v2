"use client"

// Quản trị: gửi thông báo broadcast tới mọi user đang hoạt động (cần quyền create_notification).
// Admin: broadcast a notification to all active users.
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { broadcastNotification } from "@/lib/api/notifications"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"

export default function AdminNotificationsPage() {
  const { authFetch } = useAuth()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [link, setLink] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung")
      return
    }
    setBusy(true)
    try {
      const res = await broadcastNotification(authFetch, {
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
      })
      toast.success(`Đã gửi tới ${res.count} người dùng`)
      setTitle("")
      setMessage("")
      setLink("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gửi thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Gửi thông báo</h1>
      <Card size="sm" className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Broadcast tới mọi người dùng đang hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="n-title">Tiêu đề</Label>
              <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="n-message">Nội dung</Label>
              <Textarea
                id="n-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="n-link">Liên kết (tùy chọn)</Label>
              <Input
                id="n-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/products/1"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-fit">
              Gửi thông báo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
