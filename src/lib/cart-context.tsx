"use client"

// Context giỏ hàng. Giữ danh sách item của user hiện tại + đếm số lượng cho header.
// Cần đăng nhập (giỏ hàng theo user phía backend). Khi đăng xuất → giỏ rỗng.
// ⚠️ Cart item từ backend thiếu tên/đơn giá sản phẩm (khoảng trống #9) - chỉ có optionValues.
// Cart context. Holds the current user's items + a count for the header.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { useAuth } from "./auth-context"
import { ApiError } from "./api-error"
import type { CartItem } from "./types"

interface CartContextValue {
  items: CartItem[]
  count: number
  loading: boolean
  refresh: () => Promise<void>
  add: (productOptionId: number, quantity?: number) => Promise<void>
  update: (id: number, quantity: number) => Promise<void>
  remove: (id: number) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, authFetch } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const data = await authFetch<CartItem[]>("/api/cart")
      setItems(Array.isArray(data) ? data : [])
    } catch {
      // Lỗi tạm thời (mạng/server) → GIỮ item hiện có để không làm người dùng tưởng mất hàng.
      // Trạng thái đăng xuất đã được xử lý riêng ở effect bên dưới (đặt giỏ rỗng).
      // Transient error → keep existing items; logout is handled separately below.
    } finally {
      setLoading(false)
    }
  }, [status, authFetch])

  // Tải lại giỏ mỗi khi trạng thái đăng nhập đổi.
  // Reload the cart whenever auth status changes.
  useEffect(() => {
    if (status === "authenticated") {
      refresh()
    } else if (status === "unauthenticated") {
      setItems([])
    }
  }, [status, refresh])

  const add = useCallback(
    async (productOptionId: number, quantity = 1) => {
      if (status !== "authenticated") {
        throw new ApiError(401, { message: "Vui lòng đăng nhập để thêm vào giỏ" })
      }
      await authFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productOptionId, quantity }),
      })
      await refresh()
    },
    [status, authFetch, refresh]
  )

  const update = useCallback(
    async (id: number, quantity: number) => {
      await authFetch(`/api/cart/${id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      })
      await refresh()
    },
    [authFetch, refresh]
  )

  const remove = useCallback(
    async (id: number) => {
      await authFetch(`/api/cart/${id}`, { method: "DELETE" })
      await refresh()
    },
    [authFetch, refresh]
  )

  const count = items.reduce((sum, it) => sum + (it.quantity || 0), 0)

  return (
    <CartContext.Provider
      value={{ items, count, loading, refresh, add, update, remove }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart phải dùng bên trong <CartProvider>")
  }
  return ctx
}
