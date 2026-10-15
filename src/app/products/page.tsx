// Danh sách sản phẩm (SSR). Backend đã có /api/products/count → phân trang số trang thật.
// Product listing (SSR) with accurate pagination via /api/products/count.
import Link from "next/link"
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal"
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
    <Container className="py-9 sm:py-12">
      <Reveal className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Cửa hàng</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Tất cả sản phẩm</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">Khám phá những sản phẩm đang có tại cửa hàng.</p>
        </div>
        <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          Duyệt theo danh mục <ArrowRight className="size-4" />
        </Link>
      </Reveal>

      {error ? (
        <p role="status" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">Không tải được danh sách sản phẩm. Vui lòng thử lại sau.</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center">
          <ShoppingBag className="mx-auto size-9 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-3 font-medium">Chưa có sản phẩm</p>
          <p className="mt-1 text-sm text-muted-foreground">Các mặt hàng của cửa hàng sẽ được hiển thị tại đây.</p>
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

      <div className="mt-9 flex items-center justify-center gap-3">
        {hasPrev ? (
          <Button asChild variant="outline" size="lg" className="h-11 rounded-full px-4">
            <Link href={`/products?page=${page - 1}`}><ArrowLeft /> Trang trước</Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="h-11 rounded-full px-4" disabled>
            <ArrowLeft /> Trang trước
          </Button>
        )}
        <span className="rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
          Trang {page}/{totalPages}
        </span>
        {hasNext ? (
          <Button asChild variant="outline" size="lg" className="h-11 rounded-full px-4">
            <Link href={`/products?page=${page + 1}`}>Trang sau <ArrowRight /></Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="h-11 rounded-full px-4" disabled>
            Trang sau <ArrowRight />
          </Button>
        )}
      </div>
    </Container>
  )
}
