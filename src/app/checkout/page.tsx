"use client"

// Thanh toán (cần đăng nhập): chọn địa chỉ từ sổ + mã giảm giá + phương thức, xem trước tổng tiền
// rồi đặt hàng. COD -> tới đơn; mock_online -> trang thanh toán giả lập.
// Checkout (login required): pick saved address + coupon + method, preview totals, place order.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { AddressForm } from "@/components/account/address-form"
import { formatAddress } from "@/components/account/address-manager"
import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/site/public-shell"
import { useShopSettings } from "@/components/site/shop-settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createAddress, getAddresses } from "@/lib/api/address"
import { createOrder, payOrder, previewOrder } from "@/lib/api/account"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/format"
import type { Address, AddressPayload, OrderPreview } from "@/lib/types"

type PaymentProvider = "cod" | "mock_online"

function CheckoutContent() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const { items, count, refresh } = useCart()
  const shopSettings = useShopSettings()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [addingAddr, setAddingAddr] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined)
  const [provider, setProvider] = useState<PaymentProvider>(
    shopSettings.payments.cod ? "cod" : "mock_online"
  )
  const [preview, setPreview] = useState<OrderPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [couponBusy, setCouponBusy] = useState(false)

  const cartIds = items.map((it) => it.id)
  // Khóa ổn định theo nội dung giỏ để effect preview chạy lại khi item đổi (không chỉ số lượng phần tử).
  // Stable key over cart contents so the preview effect reruns on item changes, not just count.
  const cartKey = cartIds.join(",")
  const codAvailable = shopSettings.payments.cod
  const onlineAvailable = shopSettings.payments.mockOnline

  useEffect(() => {
    if (provider === "cod" && !codAvailable && onlineAvailable) {
      setProvider("mock_online")
    } else if (provider === "mock_online" && !onlineAvailable && codAvailable) {
      setProvider("cod")
    }
  }, [provider, codAvailable, onlineAvailable])

  // Tải sổ địa chỉ; tự chọn địa chỉ mặc định nếu có.
  const loadAddresses = useCallback(() => {
    setLoadingAddr(true)
    getAddresses(authFetch)
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setAddresses(list)
        setSelectedId((prev) => prev ?? (list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null))
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddr(false))
  }, [authFetch])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  // Gọi preview mỗi khi giỏ / địa chỉ / coupon đã áp đổi.
  // Recompute the preview whenever cart / address / applied coupon changes.
  useEffect(() => {
    if (cartIds.length === 0) {
      setPreview(null)
      return
    }
    let active = true
    previewOrder(authFetch, {
      cartIds,
      addressId: selectedId ?? undefined,
      couponCode: appliedCoupon,
    })
      .then((p) => {
        if (!active) return
        // Coupon đang áp bỗng hết hợp lệ (đổi địa chỉ/số lượng làm dưới ngưỡng min_order...):
        // bỏ áp mã, tính lại không mã thay vì để trống bảng tổng.
        // Applied coupon became invalid: drop it and recompute without it.
        if (appliedCoupon && !p.couponApplied) {
          setAppliedCoupon(undefined)
          toast.message("Mã giảm giá không còn áp dụng được cho đơn này")
        }
        setPreview(p)
      })
      .catch(() => {
        if (active) setPreview(null)
      })
    return () => {
      active = false
    }
    // cartKey đại diện nội dung giỏ; cartIds/items chủ ý không đưa vào deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch, selectedId, appliedCoupon, cartKey])

  const applyCoupon = () => {
    const code = couponInput.trim()
    if (!code) {
      setAppliedCoupon(undefined)
      return
    }
    if (couponBusy) return
    setCouponBusy(true)
    // Thử preview với mã; nếu lỗi (mã không hợp lệ) thì báo và bỏ áp.
    previewOrder(authFetch, { cartIds, addressId: selectedId ?? undefined, couponCode: code })
      .then((p) => {
        if (p.couponApplied) {
          setAppliedCoupon(code)
          setPreview(p)
          toast.success("Đã áp dụng mã giảm giá")
        } else {
          toast.error("Mã giảm giá không áp dụng được cho đơn này")
        }
      })
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Mã giảm giá không hợp lệ")
      )
      .finally(() => setCouponBusy(false))
  }

  const handleAddAddress = async (payload: AddressPayload) => {
    setBusy(true)
    try {
      const created = await createAddress(authFetch, payload)
      toast.success("Đã thêm địa chỉ")
      setAddingAddr(false)
      setSelectedId(created.id)
      loadAddresses()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Thêm địa chỉ thất bại")
    } finally {
      setBusy(false)
    }
  }

  const placeOrder = async () => {
    if (items.length === 0) {
      toast.error("Giỏ hàng trống")
      return
    }
    if (!selectedId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng")
      return
    }
    setBusy(true)
    try {
      const order = await createOrder(authFetch, {
        cartIds,
        addressId: selectedId,
        couponCode: appliedCoupon,
        paymentProvider: provider,
      })
      await refresh()
      if (provider === "mock_online") {
        // Khởi tạo thanh toán giả lập rồi điều hướng tới trang mock.
        const pay = await payOrder(authFetch, order.id)
        router.push(pay.mockUrl)
      } else {
        toast.success("Đặt hàng thành công")
        router.push(`/orders/${order.id}`)
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đặt hàng thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="py-9 sm:py-12">
      <div className="mb-7 sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hoàn tất đơn hàng</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Thanh toán</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chọn địa chỉ, phương thức thanh toán và kiểm tra tổng đơn.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <p className="font-medium">Giỏ hàng đang trống</p>
          <Link href="/products" className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Cột trái: địa chỉ + phương thức + coupon */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Địa chỉ giao hàng */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold sm:text-lg">Địa chỉ giao hàng</h2>
                {!addingAddr ? (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddingAddr(true)}>
                    Thêm địa chỉ
                  </Button>
                ) : null}
              </div>

              {addingAddr ? (
                <Card size="sm" className="mb-3">
                  <CardContent className="pt-4">
                    <AddressForm
                      busy={busy}
                      submitLabel="Thêm địa chỉ"
                      onSubmit={handleAddAddress}
                      onCancel={() => setAddingAddr(false)}
                    />
                  </CardContent>
                </Card>
              ) : null}

              {loadingAddr ? (
                <p className="text-sm text-muted-foreground">Đang tải địa chỉ...</p>
              ) : addresses.length === 0 && !addingAddr ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có địa chỉ. Hãy thêm một địa chỉ giao hàng.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors ${selectedId === a.id ? "border-primary/45 bg-primary/5 ring-1 ring-primary/15" : "border-border/70 bg-background hover:bg-muted/50"}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1 size-4 accent-primary"
                        checked={selectedId === a.id}
                        onChange={() => setSelectedId(a.id)}
                      />
                      <span>
                        <span className="font-medium">
                          {a.recipientName} · {a.recipientPhone}
                          {a.isDefault ? " (mặc định)" : ""}
                        </span>
                        <br />
                        <span className="text-muted-foreground">{formatAddress(a)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* Phương thức thanh toán */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-semibold sm:text-lg">Phương thức thanh toán</h2>
              <div className="flex flex-col gap-2 text-sm">
                {codAvailable ? (
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${provider === "cod" ? "border-primary/45 bg-primary/5 ring-1 ring-primary/15" : "border-border/70 bg-background hover:bg-muted/50"}`}>
                    <input
                      type="radio"
                      name="provider"
                      className="size-4 accent-primary"
                      checked={provider === "cod"}
                      onChange={() => setProvider("cod")}
                    />
                    Thanh toán khi nhận hàng (COD)
                  </label>
                ) : null}
                {onlineAvailable ? (
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${provider === "mock_online" ? "border-primary/45 bg-primary/5 ring-1 ring-primary/15" : "border-border/70 bg-background hover:bg-muted/50"}`}>
                    <input
                      type="radio"
                      name="provider"
                      className="size-4 accent-primary"
                      checked={provider === "mock_online"}
                      onChange={() => setProvider("mock_online")}
                    />
                    Thanh toán trực tuyến mô phỏng
                  </label>
                ) : null}
              </div>
            </section>

            {/* Mã giảm giá */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-semibold sm:text-lg">Mã giảm giá</h2>
              <div className="flex max-w-sm items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="coupon">Nhập mã</Label>
                  <Input
                    id="coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="VD: WELCOME10"
                    className="h-11 rounded-xl bg-background"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-4"
                  onClick={applyCoupon}
                  disabled={couponBusy}
                >
                  {couponBusy ? "Đang áp..." : "Áp dụng"}
                </Button>
              </div>
              {appliedCoupon ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Đang áp mã: <span className="font-medium">{appliedCoupon}</span>{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setAppliedCoupon(undefined)
                      setCouponInput("")
                    }}
                  >
                    bỏ
                  </button>
                </p>
              ) : null}
            </section>
          </div>

          {/* Cột phải: tóm tắt đơn */}
          <aside>
            <Card size="sm" className="sticky top-20 overflow-hidden rounded-2xl border-border/70 shadow-lg shadow-foreground/5">
              <CardContent className="p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-bold tracking-tight">Đơn hàng <span className="text-sm font-medium text-muted-foreground">({count})</span></h2>
                <ul className="mb-3 space-y-1 text-sm">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span className="truncate text-muted-foreground">
                        {it.productName} x {it.quantity}
                      </span>
                      <span>{formatPrice(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-3" />
                {preview ? (
                  <div className="space-y-1 text-sm">
                    <Row label="Tạm tính" value={formatPrice(preview.subtotal)} />
                    <Row label="Phí vận chuyển" value={formatPrice(preview.shippingFee)} />
                    {preview.productDiscount > 0 ? (
                      <Row label="Giảm tiền hàng" value={`- ${formatPrice(preview.productDiscount)}`} />
                    ) : null}
                    {preview.shipDiscount > 0 ? (
                      <Row label="Giảm phí ship" value={`- ${formatPrice(preview.shipDiscount)}`} />
                    ) : null}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Tổng cộng</span>
                      <span>{formatPrice(preview.total)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Đang tính tổng tiền...</p>
                )}
                <Button
                  size="lg"
                  className="mt-5 h-11 w-full rounded-full shadow-sm shadow-primary/15"
                  disabled={busy || items.length === 0 || !selectedId}
                  onClick={placeOrder}
                >
                  {provider === "mock_online" ? "Tiến hành thanh toán" : "Đặt hàng"}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </Container>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  )
}
