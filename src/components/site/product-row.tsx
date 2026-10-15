"use client"

// Hàng sản phẩm ngang dùng cho các khối gợi ý (thịnh hành / gợi ý cho bạn / hay mua cùng...).
// Rỗng -> không render (trừ khi showEmpty). Dùng lại ProductCard.
// Horizontal product row for recommendation blocks.
import { ProductCard } from "@/components/site/product-card"
import { RevealGroup, RevealItem } from "@/components/site/reveal"
import type { Product } from "@/lib/types"

interface ProductRowProps {
  title: string
  products: Product[]
  loading?: boolean
  showEmpty?: boolean
  emptyText?: string
}

export function ProductRow({
  title,
  products,
  loading,
  showEmpty,
  emptyText = "Chưa có dữ liệu.",
}: ProductRowProps) {
  // Ẩn cả khối khi rỗng và không yêu cầu hiện empty (tránh khoảng trống thừa).
  if (!loading && products.length === 0 && !showEmpty) return null

  return (
    <section className="mb-12 last:mb-0 sm:mb-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-7 w-1 rounded-full bg-primary" aria-hidden="true" />
        <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">{title}</h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Đang tải sản phẩm">
          {[0, 1, 2, 3].map((index) => <div key={index} className="aspect-square animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">{emptyText}</p>
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
  )
}
