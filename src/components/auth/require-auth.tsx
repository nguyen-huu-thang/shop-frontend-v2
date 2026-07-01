"use client"

// Guard phía client: chặn nội dung khi chưa đăng nhập, chuyển hướng tới /login.
// Dùng cho các trang cần đăng nhập (tài khoản, store manager...).
// Client guard: blocks content when unauthenticated and redirects to /login.
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

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
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") {
      // Giữ trang đích (kèm query) để đăng nhập xong quay lại đúng chỗ.
      // Đọc query bằng window để khỏi cần Suspense boundary như useSearchParams.
      // Keep the target (with query) so login can return here; read query via window
      // to avoid the Suspense requirement of useSearchParams.
      const query = typeof window !== "undefined" ? window.location.search : ""
      const returnUrl = `${pathname}${query}`
      const sep = redirectTo.includes("?") ? "&" : "?"
      router.replace(`${redirectTo}${sep}returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }, [status, router, redirectTo, pathname])

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
