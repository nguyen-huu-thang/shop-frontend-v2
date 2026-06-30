// Footer storefront - thông tin liên hệ cơ bản.
// Storefront footer - basic contact info.
import Link from "next/link"

import { siteConfig } from "@/lib/site-config"

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="text-lg font-bold">{siteConfig.name}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>
        <div className="text-sm">
          <div className="font-medium">Liên hệ</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>Điện thoại: {siteConfig.phone}</li>
            <li>Email: {siteConfig.email}</li>
            <li>Địa chỉ: {siteConfig.address}</li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-medium">Liên kết</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <Link href="/products" className="hover:text-foreground">
                Sản phẩm
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-foreground">
                Danh mục
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-foreground">
                Tài khoản
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. Đã đăng ký bản quyền.
      </div>
    </footer>
  )
}
