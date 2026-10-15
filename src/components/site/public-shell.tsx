import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import { ShopSettingsProvider } from "./shop-settings-context"
import type { ShopSettings } from "@/lib/types"

// Khung bao trang public: Header + nội dung + Footer.
// Public page shell: Header + content + Footer.
export function PublicShell({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: ShopSettings
}) {
  return (
    <ShopSettingsProvider settings={settings}>
      <SiteHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </ShopSettingsProvider>
  )
}

// Container giới hạn bề ngang + padding chuẩn.
// Width-constrained container.
export function Container({
  className = "",
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>
  )
}
