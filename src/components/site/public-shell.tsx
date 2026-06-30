import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

// Khung bao trang public: Header + nội dung + Footer.
// Public page shell: Header + content + Footer.
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
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
    <div className={`mx-auto w-full max-w-6xl px-4 ${className}`}>{children}</div>
  )
}
