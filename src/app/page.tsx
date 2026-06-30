// Trang chủ (SSR cho SEO): banner + danh mục + lưới sản phẩm chung.
// Các mục best-sell/special/suggest đang CHỜ backend (xem ke-hoach + viec-can-lam-cho-frontend #5).
// Home page (SSR for SEO): banner + categories + general product grid.
import Link from "next/link"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { HomeRecommendations } from "@/components/site/home-recommendations"
import { Button } from "@/components/ui/button"
import { getCategories, getProducts } from "@/lib/server-api"
import { siteConfig } from "@/lib/site-config"
import type { Category, Product } from "@/lib/types"

export default async function HomePage() {
  let products: Product[] = []
  let categories: Category[] = []
  let error: string | null = null

  try {
    ;[products, categories] = await Promise.all([
      getProducts(1, 12),
      getCategories(),
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : "Không tải được dữ liệu"
  }

  // Danh mục nổi bật cho trang chủ: chỉ các danh mục cấp 1 (con của danh mục gốc), tối đa 8.
  // Trang /categories mới liệt kê đầy đủ. Fallback: nếu không nhận ra gốc thì lấy 8 mục đầu.
  // Featured categories for home: only top-level ones (children of root), max 8.
  const root = categories.find((c) => c.parent_id == null)
  const topLevel = root
    ? categories.filter((c) => c.parent_id === root.id)
    : categories
  const featuredCategories = (topLevel.length > 0 ? topLevel : categories).slice(0, 8)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 size-72 rounded-full bg-white/10 blur-3xl" />
        <Container className="relative flex flex-col items-start gap-4 py-16">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            Mua sắm trực tuyến
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-xl text-primary-foreground/90">{siteConfig.description}</p>
          <Button asChild size="lg" variant="secondary" className="mt-2">
            <Link href="/products">Khám phá sản phẩm</Link>
          </Button>
        </Container>
      </section>

      <Container className="py-8">
        {error ? (
          <p className="text-sm text-destructive">
            Lỗi khi gọi backend: {error}. Kiểm tra backend đã chạy ở cổng 8088 chưa.
          </p>
        ) : null}

        {/* Danh mục nổi bật (chỉ vài cái; bấm "Xem tất cả" để tới trang liệt kê đầy đủ) */}
        {featuredCategories.length > 0 ? (
          <section className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Danh mục nổi bật</h2>
              <Link href="/categories" className="text-sm text-primary hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {featuredCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.id}`}
                  className="rounded-full border border-primary/20 bg-accent/50 px-4 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Gợi ý / cá nhân hóa (client - thịnh hành công khai, gợi ý cho bạn khi đăng nhập) */}
        <HomeRecommendations />

        {/* Sản phẩm */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sản phẩm mới</h2>
            <Link href="/products" className="text-sm text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          {products.length === 0 && !error ? (
            <p className="text-sm text-muted-foreground">Chưa có sản phẩm.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </Container>
    </>
  )
}
