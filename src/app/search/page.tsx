// Trang tìm kiếm. useSearchParams cần Suspense boundary (yêu cầu của Next).
// Search page. useSearchParams requires a Suspense boundary.
import { Suspense } from "react"

import { SearchClient } from "@/components/site/search-client"

export const metadata = {
  title: "Tìm kiếm",
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Đang tải...</div>}>
      <SearchClient />
    </Suspense>
  )
}
