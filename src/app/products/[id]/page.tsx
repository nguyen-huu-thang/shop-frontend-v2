// Chi tiết sản phẩm: SSR lấy sản phẩm (cho SEO + metadata), phần tương tác (chọn option, giỏ,
// đánh giá) do client component ProductDetail đảm nhiệm.
// Product detail: SSR product (SEO), interactivity in the ProductDetail client component.
import { notFound } from "next/navigation"

import { Container } from "@/components/site/public-shell"
import { ProductDetail } from "@/components/site/product-detail"
import { getProduct } from "@/lib/server-api"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: "Không tìm thấy sản phẩm" }
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  // JSON-LD Product cho SEO (Google rich result).
  // Product JSON-LD for SEO.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    ...(product.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "VND",
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  }

  return (
    <Container className="py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
    </Container>
  )
}
