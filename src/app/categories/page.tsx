// Danh sách danh mục (SSR). Hiển thị cây phân cấp đơn giản qua hierarchy_path.
// Category list (SSR).
import Link from "next/link"
import { ArrowUpRight, LayoutGrid } from "lucide-react"

import { Container } from "@/components/site/public-shell"
import { Reveal } from "@/components/site/reveal"
import { getCategories } from "@/lib/server-api"
import type { Category } from "@/lib/types"

export const metadata = {
  title: "Danh mục",
}

export default async function CategoriesPage() {
  let categories: Category[] = []
  let error: string | null = null
  try {
    categories = await getCategories()
  } catch (err) {
    error = err instanceof Error ? err.message : "Không tải được danh mục"
  }

  return (
    <Container className="py-9 sm:py-12">
      <Reveal className="mb-7 sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Khám phá cửa hàng</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Danh mục sản phẩm</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Chọn một danh mục để xem các sản phẩm liên quan.
        </p>
      </Reveal>
      {error ? (
        <p role="status" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">Không tải được danh mục. Vui lòng thử lại sau.</p>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center">
          <LayoutGrid className="mx-auto size-9 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-3 font-medium">Chưa có danh mục</p>
          <p className="mt-1 text-sm text-muted-foreground">Danh mục của cửa hàng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.id}`}
                className="group flex min-h-32 items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <LayoutGrid className="size-4" aria-hidden="true" />
                  </span>
                  <span className="block font-semibold tracking-tight">{c.name}</span>
                  {c.hierarchy_path ? <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{c.hierarchy_path}</span> : null}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
