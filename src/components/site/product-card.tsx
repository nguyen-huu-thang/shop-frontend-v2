// Thẻ sản phẩm dùng ở lưới (home, danh mục, tìm kiếm).
// Ảnh đại diện lấy từ product.imageUrl (backend trả file_path); chưa có thì hiện ô giữ chỗ.
// Product card for grids. Uses product.imageUrl (backend file_path); falls back to a placeholder.
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatPrice, mediaUrl } from "@/lib/format"
import type { Product } from "@/lib/types"

export function ProductCard({ product }: { product: Product }) {
  const discount = product.discountPercentage ?? 0
  const hasDiscount = discount > 0
  const finalPrice =
    product.price != null && hasDiscount
      ? product.price * (1 - discount / 100)
      : product.price
  const image = mediaUrl(product.imageUrl)

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      {/* Ảnh đại diện; chưa có ảnh thì giữ ô gradient + icon. */}
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-gradient-to-br from-muted to-accent/40 text-muted-foreground">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ShoppingBag className="size-10 opacity-40" />
        )}
        {hasDiscount ? (
          <Badge variant="destructive" className="absolute left-2 top-2 h-5 shadow">
            -{discount}%
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-bold text-primary">
            {formatPrice(finalPrice)}
          </span>
          {hasDiscount && product.price != null ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
