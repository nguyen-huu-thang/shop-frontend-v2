"use client"

// Giỏ hàng (cần đăng nhập). Sửa số lượng, xóa, đi tới thanh toán.
// Backend đã thêm tên/đơn giá/thành tiền cho mỗi item → hiển thị đầy đủ + tạm tính.
// Cart page (login required).
import Link from "next/link"
import { useState } from "react"
import { ShoppingBag, ShoppingCart, Trash2 } from "lucide-react"
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
    <Container className="py-9 sm:py-12">
      <div className="mb-7 sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Đơn hàng của bạn</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Giỏ hàng</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kiểm tra sản phẩm và số lượng trước khi đặt hàng.</p>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-14 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <ShoppingCart className="size-6" />
          </div>
          <p className="mt-4 text-lg font-semibold tracking-tight">Giỏ hàng của bạn đang trống</p>
          <p className="mt-1 text-sm text-muted-foreground">Thêm sản phẩm vào giỏ để tiếp tục đặt hàng.</p>
          <Button asChild size="lg" className="mt-5 h-11 rounded-full px-6">
            <Link href="/products">Mua sắm ngay</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-5 sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <ShoppingBag className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="line-clamp-2 text-sm font-semibold leading-5 hover:text-primary sm:text-base"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {renderOptionValues(item.optionValues)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                    Đơn giá: {formatPrice(item.price)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-xl"
                  aria-label={`Giảm số lượng ${item.productName}`}
                  onClick={() => onUpdate(item, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-xl"
                  aria-label={`Tăng số lượng ${item.productName}`}
                  onClick={() => onUpdate(item, item.quantity + 1)}
                >
                  +
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:min-w-28 sm:text-right">
                <span className="text-xs text-muted-foreground sm:hidden">Thành tiền</span>
                <span className="text-sm font-bold tracking-tight sm:text-base">{formatPrice(item.subtotal)}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="min-h-11 w-fit rounded-full px-4"
                onClick={() => setPendingRemove(item)}
              >
                <Trash2 />
                Xóa
              </Button>
            </div>
          ))}

          <Separator className="my-2" />

          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="text-sm">
              <div className="text-muted-foreground">{count} sản phẩm trong giỏ</div>
              <div className="mt-1 text-xl font-bold tracking-tight">
                Tạm tính: <span className="text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Button asChild size="lg" className="h-11 w-full rounded-full px-6 sm:w-auto">
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
