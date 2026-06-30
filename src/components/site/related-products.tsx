"use client"

// "Sản phẩm hay mua cùng" ở trang chi tiết (công khai). Rỗng -> tự ẩn.
// "Frequently bought together" on the product detail page (public).
import { useEffect, useState } from "react"

import { ProductRow } from "@/components/site/product-row"
import { getRelatedProducts } from "@/lib/api/recommendations"
import type { Product } from "@/lib/types"

export function RelatedProducts({ productId }: { productId: number | string }) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getRelatedProducts(productId, 8)
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [productId])

  return <ProductRow title="Sản phẩm hay mua cùng" products={items} loading={loading} />
}
