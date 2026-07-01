"use client"

// Giỏ hàng (cần đăng nhập). Sửa số lượng, xóa, đi tới thanh toán.
// Backend đã thêm tên/đơn giá/thành tiền cho mỗi item → hiển thị đầy đủ + tạm tính.
// Cart page (login required).
import Link from "next/link"
import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/lib/cart-context"
import { ApiError } from "@/lib/api-error"
import { formatPrice } from "@/lib/format"
import type { CartItem } from "@/lib/types"

function renderOptionValues(optionValues: Record<string, string>): string {
  const entries = Object.entries(optionValues ?? {})
  if (entries.length === 0) return "Mặc định"
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ")
}

function CartContent() {
  const { items, count, loading, update, remove } = useCart()
  const subtotal = items.reduce((sum, it) => sum + (it.subtotal || 0), 0)
  // Item đang chờ xác nhận xóa (mở dialog).
  // Item pending delete confirmation.
  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null)
  const [removing, setRemoving] = useState(false)

  const onUpdate = async (item: CartItem, quantity: number) => {
    if (quantity < 1) return
    try {
      await update(item.id, quantity)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không cập nhật được")
    }
  }

  const confirmRemove = async () => {
    if (!pendingRemove) return
    setRemoving(true)
    try {
      await remove(pendingRemove.id)
      toast.success("Đã xóa khỏi giỏ")
      setPendingRemove(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không xóa được")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Giỏ hàng</h1>

      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <ShoppingCart className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/products">Mua sắm ngay</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border p-3"
            >
              <div className="flex-1">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {item.productName}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {renderOptionValues(item.optionValues)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Đơn giá: {formatPrice(item.price)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onUpdate(item, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onUpdate(item, item.quantity + 1)}
                >
                  +
                </Button>
              </div>
              <div className="w-24 text-right text-sm font-medium">
                {formatPrice(item.subtotal)}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setPendingRemove(item)}
              >
                Xóa
              </Button>
            </div>
          ))}

          <Separator className="my-2" />

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-muted-foreground">Tổng số lượng: {count}</div>
              <div className="text-base font-semibold">
                Tạm tính: {formatPrice(subtotal)}
              </div>
            </div>
            <Button asChild>
              <Link href="/checkout">Tiến hành đặt hàng</Link>
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Xóa sản phẩm khỏi giỏ?"
        description={pendingRemove?.productName}
        confirmLabel="Xóa"
        busy={removing}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </Container>
  )
}

export default function CartPage() {
  return (
    <RequireAuth>
      <CartContent />
    </RequireAuth>
  )
}
