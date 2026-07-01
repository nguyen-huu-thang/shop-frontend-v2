"use client"

// Yêu thích (cần đăng nhập). Backend đã cập nhật: list trả [{wishlistId, productId, name}].
// Xóa qua wishlistId. Wishlist theo PRODUCT.
// Wishlist (login required). List now returns wishlistId for deletion.
import Link from "next/link"
import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getWishlist, removeWishlist } from "@/lib/api/account"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import type { WishlistItem } from "@/lib/types"

function WishlistContent() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  // Item chờ xác nhận bỏ yêu thích.
  // Item pending un-wishlist confirmation.
  const [pending, setPending] = useState<WishlistItem | null>(null)

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

  const confirmRemove = async () => {
    if (!pending) return
    const wishlistId = pending.wishlistId
    setBusyId(wishlistId)
    try {
      await removeWishlist(authFetch, wishlistId)
      setItems((prev) => prev.filter((it) => it.wishlistId !== wishlistId))
      toast.success("Đã bỏ yêu thích")
      setPending(null)
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
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <Heart className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Chưa có sản phẩm yêu thích nào.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/products">Khám phá sản phẩm</Link>
          </Button>
        </div>
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
                onClick={() => setPending(it)}
              >
                Bỏ
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="Bỏ khỏi danh sách yêu thích?"
        description={pending?.name}
        confirmLabel="Bỏ"
        busy={busyId !== null}
        onConfirm={confirmRemove}
        onCancel={() => setPending(null)}
      />
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
