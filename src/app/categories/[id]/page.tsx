// Trang danh mục: thông tin danh mục + sản phẩm thuộc danh mục (SSR cho SEO).
// Category page (SSR): category info + its products.
import { notFound } from "next/navigation"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
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
    <Container className="py-8">
      <h1 className="text-xl font-semibold">{category.name}</h1>
      {category.description ? (
        <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
      ) : null}

      {subcategories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {subcategories.map((s) => (
            <a
              key={s.id}
              href={`/categories/${s.id}`}
              className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
            >
              {s.name}
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có sản phẩm trong danh mục này.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}
