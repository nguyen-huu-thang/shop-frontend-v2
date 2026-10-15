"use client"

// Khung quản trị (store manager): điều hướng thích ứng và thanh công cụ.
// Admin shell: responsive navigation and topbar.
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react"

import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { PermissionsProvider, usePermissions } from "@/lib/permissions-context"
import { cn } from "@/lib/utils"

const navItems: { href: string; label: string; perm: string | null; icon: LucideIcon }[] = [
  { href: "/admin", label: "Tổng quan", perm: "access_admin_dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", perm: "create_product", icon: Package },
  { href: "/admin/categories", label: "Danh mục", perm: "create_category", icon: Tags },
  { href: "/admin/coupons", label: "Mã giảm giá", perm: "view_coupons", icon: TicketPercent },
  { href: "/admin/orders", label: "Đơn hàng", perm: "view_orders", icon: ShoppingBag },
  { href: "/admin/reviews", label: "Đánh giá", perm: "view_reviews", icon: Star },
  { href: "/admin/users", label: "Người dùng", perm: "view_users", icon: Users },
  { href: "/admin/notifications", label: "Thông báo", perm: "create_notification", icon: Bell },
  { href: "/admin/settings", label: "Cấu hình cửa hàng", perm: "manage_system_settings", icon: Settings },
]

function Sidebar() {
  const pathname = usePathname()
  const { has, loading } = usePermissions()
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <aside className="w-full border-b border-border/70 bg-card/75 p-3 xl:sticky xl:top-16 xl:h-[calc(100vh-4rem)] xl:w-60 xl:shrink-0 xl:overflow-y-auto xl:border-r xl:border-b-0 xl:p-4">
      <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground xl:block">
        Quản lý cửa hàng
      </p>
      <nav aria-label="Điều hướng quản trị" className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
        {navItems.map((item) => {
          if (!loading && item.perm && !has(item.perm)) return null
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors xl:w-full",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
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
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-3 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Khu vực quản trị</p>
          <p className="truncate text-sm font-bold tracking-tight sm:text-base">Quản trị cửa hàng</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <span className="hidden max-w-36 truncate text-sm text-muted-foreground lg:inline">{user?.username}</span>
        <Button asChild variant="outline" size="sm" className="min-h-10 rounded-full px-2.5 sm:px-4">
          <Link href="/" aria-label="Về cửa hàng">
            <Store />
            <span className="hidden sm:inline">Về cửa hàng</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="min-h-10 rounded-full px-2.5 sm:px-3" aria-label="Đăng xuất" onClick={() => logout()}>
          <LogOut />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PermissionsProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Topbar />
          <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
            <Sidebar />
            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </PermissionsProvider>
    </RequireAuth>
  )
}
