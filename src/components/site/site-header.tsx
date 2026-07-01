"use client"

// Header storefront: logo, ô tìm kiếm, điều hướng, icon giỏ (đếm số), menu tài khoản.
// Storefront header: logo, search box, nav, cart icon (count), account menu.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, Search, ShoppingCart, Heart, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationBell } from "@/components/site/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { siteConfig } from "@/lib/site-config"

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/categories", label: "Danh mục" },
]

export function SiteHeader() {
  const router = useRouter()
  const { status, user, logout } = useAuth()
  const { count } = useCart()
  const [keywords, setKeywords] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = keywords.trim()
    if (q) {
      setMobileOpen(false)
      router.push(`/search?keywords=${encodeURIComponent(q)}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {/* Nút mở menu (chỉ mobile) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Mở menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            {siteConfig.name.charAt(0)}
          </span>
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Tìm kiếm */}
        <form onSubmit={onSearch} className="ml-auto flex max-w-xs flex-1 items-center gap-1">
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Tìm sản phẩm..."
            aria-label="Tìm kiếm sản phẩm"
          />
          <Button type="submit" size="icon" variant="outline" aria-label="Tìm">
            <Search />
          </Button>
        </form>

        {/* Wishlist + Giỏ + Tài khoản */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="Yêu thích">
            <Link href="/wishlist">
              <Heart />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Giỏ hàng">
            <Link href="/cart">
              <ShoppingCart />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          </Button>

          {status === "authenticated" ? (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button asChild variant="ghost" size="sm">
                <Link href="/account">
                  <User />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Menu điều hướng cho mobile (mở bằng hamburger) */}
      {/* Mobile nav menu (opened via hamburger) */}
      {mobileOpen ? (
        <nav className="border-t md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
