"use client"

// Khối gợi ý ở trang chủ: "Gợi ý cho bạn" + "Đã xem gần đây" (đăng nhập) và "Thịnh hành" (công khai).
// Backend tự ghi tín hiệu khi user tương tác -> FE không gọi API log.
// Home recommendation blocks. Trending is public; for-you / recently-viewed need login.
import { useEffect, useState } from "react"

import { ProductRow } from "@/components/site/product-row"
import { getForYou, getRecentlyViewed, getTrending } from "@/lib/api/recommendations"
import { useAuth } from "@/lib/auth-context"
import type { Product } from "@/lib/types"

export function HomeRecommendations() {
  const { status, authFetch } = useAuth()
  const [trending, setTrending] = useState<Product[]>([])
  const [forYou, setForYou] = useState<Product[]>([])
  const [recent, setRecent] = useState<Product[]>([])

  // Thịnh hành (công khai) - luôn tải.
  useEffect(() => {
    getTrending(8)
      .then((d) => setTrending(Array.isArray(d) ? d : []))
      .catch(() => setTrending([]))
  }, [])

  // Cá nhân hóa - chỉ khi đăng nhập.
  useEffect(() => {
    if (status !== "authenticated") {
      setForYou([])
      setRecent([])
      return
    }
    getForYou(authFetch, 8)
      .then((d) => setForYou(Array.isArray(d) ? d : []))
      .catch(() => setForYou([]))
    getRecentlyViewed(authFetch, 8)
      .then((d) => setRecent(Array.isArray(d) ? d : []))
      .catch(() => setRecent([]))
  }, [status, authFetch])

  return (
    <>
      {status === "authenticated" ? (
        <ProductRow title="Gợi ý cho bạn" products={forYou} />
      ) : null}
      {status === "authenticated" ? (
        <ProductRow title="Đã xem gần đây" products={recent} />
      ) : null}
      <ProductRow title="Thịnh hành" products={trending} />
    </>
  )
}
