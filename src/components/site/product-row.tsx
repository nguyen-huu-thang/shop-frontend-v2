"use client"

// Hàng sản phẩm ngang dùng cho các khối gợi ý (thịnh hành / gợi ý cho bạn / hay mua cùng...).
// Rỗng -> không render (trừ khi showEmpty). Dùng lại ProductCard.
// Horizontal product row for recommendation blocks.
import { ProductCard } from "@/components/site/product-card"
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
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
