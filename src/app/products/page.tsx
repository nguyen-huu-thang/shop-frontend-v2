// Danh sách sản phẩm (SSR). Backend đã có /api/products/count → phân trang số trang thật.
// Product listing (SSR) with accurate pagination via /api/products/count.
import Link from "next/link"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { Button } from "@/components/ui/button"
import { getProductCount, getProducts } from "@/lib/server-api"
import type { Product } from "@/lib/types"

export const metadata = {
  title: "Sản phẩm",
}

const LIMIT = 12

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  let products: Product[] = []
  let total = 0
  let error: string | null = null
  try {
    const [list, count] = await Promise.all([
      getProducts(page, LIMIT),
      getProductCount(),
    ])
    products = list
    total = count.total
  } catch (err) {
    error = err instanceof Error ? err.message : "Không tải được sản phẩm"
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Sản phẩm</h1>

      {error ? (
        <p className="text-sm text-destructive">Lỗi: {error}</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có sản phẩm.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        {hasPrev ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/products?page=${page - 1}`}>Trang trước</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Trang trước
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Trang {page}/{totalPages}
        </span>
        {hasNext ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/products?page=${page + 1}`}>Trang sau</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Trang sau
          </Button>
        )}
      </div>
    </Container>
  )
}
