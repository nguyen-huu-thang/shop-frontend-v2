// Danh sách danh mục (SSR). Hiển thị cây phân cấp đơn giản qua hierarchy_path.
// Category list (SSR).
import Link from "next/link"

import { Container } from "@/components/site/public-shell"
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
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Danh mục sản phẩm</h1>
      {error ? (
        <p className="text-sm text-destructive">Lỗi: {error}</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có danh mục.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.id}`}
                className="flex flex-col rounded-lg border p-3 hover:bg-muted"
              >
                <span className="font-medium">{c.name}</span>
                {c.hierarchy_path ? (
                  <span className="text-xs text-muted-foreground">
                    {c.hierarchy_path}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
