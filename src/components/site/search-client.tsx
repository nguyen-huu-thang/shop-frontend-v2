"use client"

// Kết quả tìm kiếm (client): đọc keywords + lọc giá từ URL, gọi /api/search/products.
// Search results (client): reads keywords + price filter from URL.
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Container } from "@/components/site/public-shell"
import { ProductCard } from "@/components/site/product-card"
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
    <Container className="py-9 sm:py-12">
      <Reveal className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tìm kiếm</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Kết quả tìm kiếm</h1>
      </Reveal>
      {keywords ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Từ khóa</span>
          <span className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 font-medium text-foreground">{keywords}</span>
          {data ? <span>{data.total} kết quả</span> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-3 font-medium">Nhập từ khóa để bắt đầu</p>
          <p className="mt-1 text-sm text-muted-foreground">Bạn có thể tìm theo tên hoặc thông tin sản phẩm.</p>
        </div>
      )}

      {keywords ? (
        <form onSubmit={applyFilter} className="mb-7 flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
          <div className="grid gap-1">
            <Label htmlFor="min-price">Giá từ</Label>
            <Input
              id="min-price"
              type="number"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="h-11 w-36 rounded-xl bg-background"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="max-price">Đến giá</Label>
            <Input
              id="max-price"
              type="number"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="h-11 w-36 rounded-xl bg-background"
            />
          </div>
          <Button type="submit" variant="outline" size="lg" className="h-11 rounded-full px-5">
            Lọc giá
          </Button>
        </form>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p role="status" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">Không thể tìm sản phẩm lúc này. Vui lòng thử lại sau.</p>
      ) : data && data.results.length > 0 ? (
        <>
          <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {data.results.map((r) => (
              <RevealItem key={r.product.id} className="h-full">
                <ProductCard product={r.product} />
              </RevealItem>
            ))}
          </RevealGroup>
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
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-3 font-medium">Chưa tìm thấy sản phẩm phù hợp</p>
          <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc khoảng giá.</p>
        </div>
      ) : null}
    </Container>
  )
}
