// Layout khu quản trị. ConditionalShell ở root đã bỏ PublicShell cho /admin → ở đây dùng AdminShell.
// Admin area layout. Root ConditionalShell skips PublicShell for /admin, so we use AdminShell here.
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
