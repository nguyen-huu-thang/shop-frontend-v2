"use client"

// Guard phía client: chặn nội dung khi chưa đăng nhập, chuyển hướng tới /login.
// Dùng cho các trang cần đăng nhập (tài khoản, store manager...).
// Client guard: blocks content when unauthenticated and redirects to /login.
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/lib/auth-context"

export function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(redirectTo)
    }
  }, [status, router, redirectTo])

  if (status !== "authenticated") {
    // Đang khôi phục phiên hoặc chưa đăng nhập → không render nội dung bảo vệ.
    // Restoring session or unauthenticated → do not render protected content.
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra phiên đăng nhập...
      </div>
    )
  }

  return <>{children}</>
}
