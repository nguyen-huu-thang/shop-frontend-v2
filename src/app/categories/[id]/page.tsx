// Trang danh mục: thông tin danh mục + sản phẩm thuộc danh mục (SSR cho SEO).
// Category page (SSR): category info + its products.
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal"
import {
  getCategory,
  getProductsByCategory,
  getSubcategories,
} from "@/lib/server-api"
import type { Category, Product } from "@/lib/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const category = await getCategory(id)
  return { title: category?.name ?? "Danh mục" }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const category = await getCategory(id)
  if (!category) notFound()

  let products: Product[] = []
  let subcategories: Category[] = []
  try {
    ;[products, subcategories] = await Promise.all([
      getProductsByCategory(id),
      getSubcategories(id),
    ])
  } catch {
    // by-category trả 404 (E10200) khi rỗng → coi như không có sản phẩm.
    // by-category returns 404 when empty → treat as no products.
    products = []
  }

  return (
    <Container className="py-9 sm:py-12">
      <Reveal className="mb-7 sm:mb-9">
        <Link href="/categories" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowRight className="size-4 rotate-180" /> Danh mục
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Danh mục sản phẩm</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{category.description}</p>
        ) : null}
      </Reveal>

      {subcategories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {subcategories.map((s) => (
            <Link
              key={s.id}
              href={`/categories/${s.id}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              {s.name}
              <ArrowUpRight className="size-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <p className="font-medium">Chưa có sản phẩm trong danh mục này</p>
            <p className="mt-1 text-sm text-muted-foreground">Hãy xem các danh mục khác để tiếp tục mua sắm.</p>
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
      </div>
    </Container>
  )
}
