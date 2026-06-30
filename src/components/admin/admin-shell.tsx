"use client"

// Khung quản trị (store manager): sidebar điều hướng + topbar. Bọc RequireAuth + PermissionsProvider.
// Ẩn mục menu theo quyền (usePermissions); backend vẫn thực thi quyền thật.
// Admin shell: sidebar nav + topbar. Wrapped in RequireAuth + PermissionsProvider.
import Link from "next/link"
import { usePathname } from "next/navigation"

import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { PermissionsProvider, usePermissions } from "@/lib/permissions-context"
import { cn } from "@/lib/utils"

// Mỗi mục kèm quyền để ẩn/hiện (nếu user không có quyền). null = luôn hiện.
// Each item carries a permission to gate visibility. null = always shown.
const navItems: { href: string; label: string; perm: string | null }[] = [
  { href: "/admin", label: "Tổng quan", perm: "access_admin_dashboard" },
  { href: "/admin/products", label: "Sản phẩm", perm: "create_product" },
  { href: "/admin/categories", label: "Danh mục", perm: "create_category" },
  { href: "/admin/coupons", label: "Mã giảm giá", perm: "view_coupons" },
  { href: "/admin/orders", label: "Đơn hàng", perm: "view_orders" },
  { href: "/admin/reviews", label: "Đánh giá", perm: "view_reviews" },
  { href: "/admin/users", label: "Người dùng", perm: "view_users" },
  { href: "/admin/notifications", label: "Thông báo", perm: "create_notification" },
]

function Sidebar() {
  const pathname = usePathname()
  const { has, loading } = usePermissions()

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/20 p-3">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          // Khi chưa tải xong quyền thì hiện tạm; tải xong thì lọc theo quyền.
          // Show while loading; filter by permission once loaded.
          if (!loading && item.perm && !has(item.perm)) return null
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(item.href) && "bg-muted text-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

function Topbar() {
  const { user, logout } = useAuth()
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2 font-semibold">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
          S
        </span>
        Quản trị cửa hàng
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{user?.username}</span>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Về cửa hàng</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Đăng xuất
        </Button>
      </div>
    </header>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PermissionsProvider>
        <div className="flex min-h-screen flex-col">
          <Topbar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </PermissionsProvider>
    </RequireAuth>
  )
}
