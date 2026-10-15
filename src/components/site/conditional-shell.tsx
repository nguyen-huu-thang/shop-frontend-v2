"use client"

// Chọn khung theo route: /admin dùng shell quản trị riêng (admin/layout.tsx), còn lại dùng
// PublicShell (storefront). Tránh phải tách route group + di chuyển file.
// Pick the shell by route: /admin uses its own admin shell; everything else uses PublicShell.
import { usePathname } from "next/navigation"

import type { ShopSettings } from "@/lib/types"

import { PublicShell } from "./public-shell"

export function ConditionalShell({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: ShopSettings
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  if (isAdmin) return <>{children}</>
  return <PublicShell settings={settings}>{children}</PublicShell>
}
