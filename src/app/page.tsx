import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, LayoutGrid, ShoppingBag } from "lucide-react"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { HomeRecommendations } from "@/components/site/home-recommendations"
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal"
import { Button } from "@/components/ui/button"
import { getCategories, getProducts, getShopSettingsForStore } from "@/lib/server-api"
import { mediaUrl } from "@/lib/format"
import type { Category, Product } from "@/lib/types"

export default async function HomePage() {
  const settings = await getShopSettingsForStore()
  let products: Product[] = []
  let categories: Category[] = []
  let error: string | null = null

  try {
    ;[products, categories] = await Promise.all([getProducts(1, 12), getCategories()])
  } catch (err) {
    error = err instanceof Error ? err.message : "Không tải được dữ liệu"
  }

  const root = categories.find((category) => category.parent_id == null)
  const topLevel = root
    ? categories.filter((category) => category.parent_id === root.id)
    : categories
  const featuredCategories = (topLevel.length > 0 ? topLevel : categories).slice(0, 8)
  const heroTitle = settings.home.heroTitle?.trim() || settings.tagline || "Mua sắm trực tuyến"
  const heroSubtitle = settings.home.heroSubtitle?.trim() || settings.description
  const coverUrl = mediaUrl(settings.coverPath)
  const heroProduct = products.find((product) => product.imageUrl)
  const heroImage = coverUrl || mediaUrl(heroProduct?.imageUrl)

  return (
    <>
      {settings.home.announcement ? (
        <div className="border-b border-primary/15 bg-primary/8 px-4 py-2.5 text-center text-sm font-medium text-foreground">
          {settings.home.announcement}
        </div>
      ) : null}

      <section className="relative isolate overflow-hidden border-b border-border/70 bg-background">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_12%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_44%)]" />
        <Container className="grid items-center gap-10 py-10 sm:py-14 lg:min-h-[34rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-16">
          <Reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/6 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary sm:text-sm">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {settings.tagline || "Cửa hàng trực tuyến"}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            {heroSubtitle ? (
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {heroSubtitle}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 rounded-full px-6 shadow-sm shadow-primary/15">
                <Link href="/products">
                  Khám phá sản phẩm
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full bg-card/70 px-6">
                <Link href="/categories">Xem danh mục</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="w-full">
            <div className="group relative mx-auto aspect-[1.12/1] w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-border/70 bg-muted shadow-xl shadow-foreground/5 sm:aspect-[1.25/1] sm:rounded-[2rem]">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={coverUrl ? `${settings.shopName} - ảnh giới thiệu cửa hàng` : heroProduct?.name ?? ""}
                  fill
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  priority
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/50">
                  <div className="absolute -right-10 -top-16 size-64 rounded-full bg-primary/15 blur-3xl" />
                  <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-primary/10 blur-3xl" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="grid size-24 place-items-center rounded-[1.75rem] border border-primary/15 bg-card/85 text-primary shadow-lg shadow-primary/10 backdrop-blur sm:size-28">
                      <ShoppingBag className="size-11 sm:size-12" strokeWidth={1.5} />
                    </div>
                    <p className="mt-5 max-w-xs text-lg font-semibold tracking-tight sm:text-xl">
                      Không gian mua sắm của {settings.shopName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Bắt đầu từ điều bạn đang tìm</p>
                  </div>
                </div>
              )}
              {coverUrl && settings.shopName ? (
                <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/25 bg-black/35 px-4 py-3 text-white shadow-lg backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:px-5">
                  <p className="text-xs font-medium text-white/75">Chào mừng bạn đến với</p>
                  <p className="mt-0.5 text-lg font-semibold tracking-tight">{settings.shopName}</p>
                </div>
              ) : null}
            </div>
          </Reveal>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        {error ? (
          <p role="status" className="mb-8 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
            Chưa tải được sản phẩm hoặc danh mục. Kiểm tra backend đang chạy.
          </p>
        ) : null}

        {featuredCategories.length > 0 ? (
          <section className="mb-14 sm:mb-18" aria-labelledby="featured-categories-title">
            <Reveal className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Khám phá cửa hàng</p>
                <h2 id="featured-categories-title" className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  Danh mục nổi bật
                </h2>
              </div>
              <Link href="/categories" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Xem tất cả danh mục
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {featuredCategories.map((category) => (
                <RevealItem key={category.id} className="h-full">
                  <Link
                    href={`/categories/${category.id}`}
                    className="group flex h-full min-h-28 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-32 sm:p-5"
                  >
                    <span className="min-w-0">
                      <span className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <LayoutGrid className="size-4" aria-hidden="true" />
                      </span>
                      <span className="line-clamp-2 font-semibold leading-snug">{category.name}</span>
                      {category.description ? (
                        <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                          {category.description}
                        </span>
                      ) : null}
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        ) : null}

        <div className="space-y-12 sm:space-y-16">
          <HomeRecommendations />

          <section aria-labelledby="new-products-title" className="rounded-[1.75rem] border border-border/60 bg-muted/35 p-4 sm:rounded-[2rem] sm:p-7 lg:p-9">
            <Reveal className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Khám phá thêm</p>
                <h2 id="new-products-title" className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  Sản phẩm tại cửa hàng
                </h2>
              </div>
              <Link href="/products" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Xem tất cả sản phẩm
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>

            {products.length === 0 && !error ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/70 px-5 py-14 text-center">
                <ShoppingBag className="mx-auto size-9 text-muted-foreground/60" aria-hidden="true" />
                <p className="mt-3 font-medium">Chưa có sản phẩm</p>
                <p className="mt-1 text-sm text-muted-foreground">Sản phẩm sẽ xuất hiện ở đây khi cửa hàng có mặt hàng mới.</p>
              </div>
            ) : (
              <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {products.map((product) => (
                  <RevealItem key={product.id} className="h-full">
                    <ProductCard product={product} />
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </section>
        </div>
      </Container>
    </>
  )
}
