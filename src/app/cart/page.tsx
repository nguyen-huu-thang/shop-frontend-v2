"use client"

// Giỏ hàng (cần đăng nhập). Sửa số lượng, xóa, đi tới thanh toán.
// Backend đã thêm tên/đơn giá/thành tiền cho mỗi item → hiển thị đầy đủ + tạm tính.
// Cart page (login required).
import Link from "next/link"
import { toast } from "sonner"

import { Container } from "@/components/site/public-shell"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

  const onUpdate = async (item: CartItem, quantity: number) => {
    if (quantity < 1) return
    try {
      await update(item.id, quantity)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không cập nhật được")
    }
  }

  const onRemove = async (item: CartItem) => {
    try {
      await remove(item.id)
      toast.success("Đã xóa khỏi giỏ")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không xóa được")
    }
  }

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Giỏ hàng</h1>

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Đang tải giỏ hàng...</p>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Giỏ hàng trống.{" "}
          <Link href="/products" className="text-primary hover:underline">
            Mua sắm ngay
          </Link>
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
                onClick={() => onRemove(item)}
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
