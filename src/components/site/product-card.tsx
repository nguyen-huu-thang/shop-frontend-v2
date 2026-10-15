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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Ảnh đại diện; chưa có ảnh thì giữ ô gradient + icon. */}
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-gradient-to-br from-muted via-card to-accent/35 text-muted-foreground">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
          />
        ) : (
          <ShoppingBag className="size-10 opacity-40" />
        )}
        {hasDiscount ? (
          <Badge variant="destructive" className="absolute left-3 top-3 rounded-full px-2.5 shadow-sm">
            -{discount}%
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground transition-colors group-hover:text-primary sm:text-[0.9375rem]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className={`text-base font-bold tracking-tight ${hasDiscount ? "text-primary" : "text-foreground"}`}>
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
