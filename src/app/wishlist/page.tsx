"use client"

// Yêu thích (cần đăng nhập). Backend đã cập nhật: list trả [{wishlistId, productId, name}].
// Xóa qua wishlistId. Wishlist theo PRODUCT.
// Wishlist (login required). List now returns wishlistId for deletion.
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { getWishlist, removeWishlist } from "@/lib/api/account"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import type { WishlistItem } from "@/lib/types"

function WishlistContent() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getWishlist(authFetch)
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [authFetch])

  const onRemove = async (wishlistId: number) => {
    setBusyId(wishlistId)
    try {
      await removeWishlist(authFetch, wishlistId)
      setItems((prev) => prev.filter((it) => it.wishlistId !== wishlistId))
      toast.success("Đã bỏ yêu thích")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không bỏ được")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Sản phẩm yêu thích</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có sản phẩm yêu thích.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li
              key={it.wishlistId}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <Link
                href={`/products/${it.productId}`}
                className="text-sm font-medium hover:text-primary"
              >
                {it.name}
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === it.wishlistId}
                onClick={() => onRemove(it.wishlistId)}
              >
                Bỏ
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  )
}
