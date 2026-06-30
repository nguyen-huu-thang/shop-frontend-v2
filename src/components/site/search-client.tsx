"use client"

// Kết quả tìm kiếm (client): đọc keywords + lọc giá từ URL, gọi /api/search/products.
// Search results (client): reads keywords + price filter from URL.
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { searchProducts } from "@/lib/api/catalog"
import type { ProductSearchResult } from "@/lib/types"

const LIMIT = 12

export function SearchClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const keywords = sp.get("keywords") ?? ""
  const page = Math.max(1, Number(sp.get("page")) || 1)
  const minPrice = sp.get("min_price") ?? ""
  const maxPrice = sp.get("max_price") ?? ""

  const [data, setData] = useState<ProductSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ô lọc giá (state cục bộ, áp khi bấm Lọc).
  // Price filter inputs.
  const [minInput, setMinInput] = useState(minPrice)
  const [maxInput, setMaxInput] = useState(maxPrice)

  useEffect(() => {
    if (!keywords) {
      setData(null)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    searchProducts({
      keywords,
      page,
      limit: LIMIT,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
    })
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err) => {
        if (active) setError(err?.message ?? "Lỗi tìm kiếm")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [keywords, page, minPrice, maxPrice])

  const applyFilter = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set("keywords", keywords)
    if (minInput) params.set("min_price", minInput)
    if (maxInput) params.set("max_price", maxInput)
    router.push(`/search?${params.toString()}`)
  }

  const goPage = (p: number) => {
    const params = new URLSearchParams(sp.toString())
    params.set("page", String(p))
    router.push(`/search?${params.toString()}`)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1

  return (
    <Container className="py-8">
      <h1 className="mb-1 text-xl font-semibold">Kết quả tìm kiếm</h1>
      {keywords ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Từ khóa: <span className="font-medium">{keywords}</span>
          {data ? ` - ${data.total} kết quả` : ""}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Nhập từ khóa để tìm sản phẩm.</p>
      )}

      {keywords ? (
        <form onSubmit={applyFilter} className="mb-6 flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label htmlFor="min">Giá từ</Label>
            <Input
              id="min"
              type="number"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="max">Đến</Label>
            <Input
              id="max"
              type="number"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-32"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Lọc giá
          </Button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tìm...</p>
      ) : error ? (
        <p className="text-sm text-destructive">Lỗi: {error}</p>
      ) : data && data.results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.results.map((r) => (
              <ProductCard key={r.product.id} product={r.product} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                Trang trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Trang sau
              </Button>
            </div>
          ) : null}
        </>
      ) : keywords ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</p>
      ) : null}
    </Container>
  )
}
