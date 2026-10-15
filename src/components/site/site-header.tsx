"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationBell } from "@/components/site/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { mediaUrl } from "@/lib/format"
import type { ShopSettings } from "@/lib/types"

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/categories", label: "Danh mục" },
]

export function SiteHeader({ settings }: { settings: ShopSettings }) {
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const { status, user, logout } = useAuth()
  const { count } = useCart()
  const [keywords, setKeywords] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const logo = mediaUrl(settings.logoPath)
  const shopName = settings.shopName || "Cửa hàng"
  const panelTransition = { duration: reduceMotion ? 0 : 0.22, ease: "easeOut" as const }

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const query = keywords.trim()
    if (!query) return
    setMobileOpen(false)
    setSearchOpen(false)
    router.push("/search?keywords=" + encodeURIComponent(query))
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 shadow-sm shadow-foreground/[0.025] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-1.5 px-2 sm:gap-2 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 xl:size-9 xl:hidden"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setMobileOpen((open) => !open)
            setSearchOpen(false)
          }}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>

        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg text-base font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            {logo ? (
              <Image src={logo} alt={shopName} fill sizes="36px" className="object-contain p-1" />
            ) : (
              shopName.trim().charAt(0).toUpperCase() || "S"
            )}
          </span>
          <span className="max-w-[30vw] truncate sm:max-w-48 xl:max-w-60">{shopName}</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="ml-2 hidden items-center gap-1 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto size-11 shrink-0 sm:hidden"
          aria-label={searchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
          aria-expanded={searchOpen}
          aria-controls="mobile-search"
          onClick={() => {
            setSearchOpen((open) => !open)
            setMobileOpen(false)
          }}
        >
          {searchOpen ? <X /> : <Search />}
        </Button>

        <form onSubmit={onSearch} role="search" className="ml-auto hidden min-w-0 max-w-xs flex-1 items-center sm:flex xl:max-w-sm">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="Tìm sản phẩm..."
              aria-label="Tìm kiếm sản phẩm"
              className="h-10 rounded-full border-transparent bg-muted/70 pl-9 pr-3 shadow-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/35 focus-visible:bg-background"
            />
            <button type="submit" className="sr-only">Tìm kiếm</button>
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden xl:flex">
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" aria-label="Yêu thích">
              <Link href="/wishlist"><Heart /></Link>
            </Button>
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative size-11 rounded-full xl:size-9"
            aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
          >
            <Link href="/cart">
              <ShoppingCart />
              {count > 0 ? (
                <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground ring-2 ring-background">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
          </Button>

          {status === "authenticated" ? (
            <div className="hidden items-center gap-1 xl:flex">
              <NotificationBell />
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/account">
                  <User />
                  <span className="max-w-28 truncate">{user?.username}</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()} className="rounded-full">
                Đăng xuất
              </Button>
            </div>
          ) : status === "unauthenticated" ? (
            <Button asChild size="sm" className="hidden rounded-full px-4 xl:inline-flex">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen ? (
          <motion.nav
            id="mobile-navigation"
            key="mobile-navigation"
            aria-label="Điều hướng mobile"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={panelTransition}
            className="overflow-hidden border-t border-border/70 bg-background xl:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <form onSubmit={onSearch} role="search" className="mb-3 flex items-center gap-2">
                <Input
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="Tìm sản phẩm..."
                  aria-label="Tìm kiếm sản phẩm"
                  className="h-11 rounded-full bg-muted/60 px-4"
                />
                <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Tìm kiếm">
                  <Search />
                </Button>
              </form>
              <div className="grid gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                      isActive(item.href) ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Heart className="size-4" />
                  Sản phẩm yêu thích
                </Link>
                {status === "authenticated" ? (
                  <>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                      <User className="size-4" />
                      Tài khoản ({user?.username})
                    </Link>
                    <div className="flex items-center justify-between rounded-xl px-3.5 py-2 text-sm text-muted-foreground">
                      <span>Thông báo</span>
                      <NotificationBell />
                    </div>
                    <Button variant="outline" onClick={() => logout()} className="mt-1 w-full rounded-xl">
                      Đăng xuất
                    </Button>
                  </>
                ) : status === "unauthenticated" ? (
                  <Button asChild className="mt-1 w-full rounded-xl">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border/70 bg-muted/35 px-3.5 py-2">
                <span className="text-sm font-medium">Giao diện</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {searchOpen ? (
          <motion.div
            id="mobile-search"
            key="mobile-search"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={panelTransition}
            className="overflow-hidden border-t border-border/70 px-4 py-3 sm:hidden"
          >
            <form onSubmit={onSearch} role="search" className="mx-auto flex max-w-7xl items-center gap-2">
              <Input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="Tìm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"
                autoFocus
                className="h-11 rounded-full bg-muted/60 px-4"
              />
              <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Tìm kiếm">
                <Search />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
