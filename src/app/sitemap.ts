// sitemap.xml: trang tĩnh + sản phẩm + danh mục (lấy qua SSR INTERNAL_API_URL).
// Lỗi backend → vẫn trả phần tĩnh (không vỡ build).
// sitemap.xml: static pages + products + categories (fetched server-side).
import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/config"
import { getCategories, getProducts } from "@/lib/server-api"
import type { Category, Product } from "@/lib/types"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, changeFrequency: "weekly", priority: 0.7 },
  ]

  let products: Product[] = []
  let categories: Category[] = []
  try {
    // Lấy tối đa một lượng sản phẩm hợp lý cho sitemap.
    // Fetch a reasonable number of products for the sitemap.
    ;[products, categories] = await Promise.all([
      getProducts(1, 200),
      getCategories(),
    ])
  } catch {
    // Bỏ qua - trả phần tĩnh.
  }

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}
