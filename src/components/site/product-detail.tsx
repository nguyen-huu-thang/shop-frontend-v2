"use client"

// Chi tiết sản phẩm (client): chọn thuộc tính → tìm option (giá/tồn), thêm giỏ/wishlist,
// xem ảnh, gửi đánh giá. Cơ chế option: chọn đủ mỗi thuộc tính 1 giá trị → 1 SKU.
// ⚠️ Chưa liệt kê được review theo sản phẩm (backend khoảng trống #7) - chỉ có form gửi.
// Product detail (client): pick attributes → find option, add to cart/wishlist, gallery, review.
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  findOption,
  getOptionDefault,
  getProductImages,
  getProductReviews,
} from "@/lib/api/catalog"
import { addWishlist, createReview } from "@/lib/api/account"
import { RelatedProducts } from "@/components/site/related-products"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { formatPrice, mediaUrl } from "@/lib/format"
import type {
  FileItem,
  OptionDefault,
  Product,
  ProductOption,
  Review,
} from "@/lib/types"

export function ProductDetail({ product }: { product: Product }) {
  const { status, user, authFetch } = useAuth()
  const { add } = useCart()

  const attributeNames = useMemo(
    () => Object.keys(product.attribute ?? {}),
    [product.attribute]
  )
  const hasVariants = attributeNames.length > 0

  const [images, setImages] = useState<FileItem[]>([])
  const [activeImg, setActiveImg] = useState(0)
  const [defaultOpt, setDefaultOpt] = useState<OptionDefault | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [option, setOption] = useState<ProductOption | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)

  // Tải ảnh + option mặc định.
  // Load images + default option.
  useEffect(() => {
    getProductImages(product.id)
      .then((imgs) => {
        setImages(imgs)
        setActiveImg(0)
      })
      .catch(() => setImages([]))
    getOptionDefault(product.id).then(setDefaultOpt).catch(() => setDefaultOpt(null))
  }, [product.id])

  const allSelected =
    hasVariants && attributeNames.every((name) => selected[name])

  // Khi chọn đủ thuộc tính → tìm option khớp.
  // When all attributes are chosen → find the matching option.
  useEffect(() => {
    if (!allSelected) {
      setOption(null)
      return
    }
    let active = true
    findOption(product.id, selected)
      .then((opt) => {
        if (active) setOption(opt)
      })
      .catch(() => {
        if (active) {
          setOption(null)
          toast.error("Tổ hợp lựa chọn này không khả dụng")
        }
      })
    return () => {
      active = false
    }
  }, [allSelected, product.id, selected])

  // Giá hiển thị: khi có phân loại nhưng CHƯA chọn đủ -> hiện giá thấp nhất (product.price,
  // khớp với card ngoài trang chủ/danh sách); chọn đủ -> giá đúng option.
  // Displayed price: before a full variant pick, show the lowest price (matches the card).
  const price = hasVariants
    ? option?.price ?? product.price
    : defaultOpt?.prices ?? product.price
  const stock = hasVariants ? option?.stock ?? null : defaultOpt?.stock ?? product.stock
  // Đã chọn đủ phân loại chưa (để đánh dấu "giá từ" khi chưa chọn).
  // Whether a full variant is selected (to show a "from" price otherwise).
  const priceIsFrom = hasVariants && !option

  // Giá sau giảm (khớp card + số tiền backend thực tính). null nếu chưa có giá.
  // Discounted price (matches the card + the amount charged by backend).
  const discount = product.discountPercentage ?? 0
  const hasDiscount = discount > 0
  const finalPrice =
    price != null && hasDiscount ? price * (1 - discount / 100) : price

  // Option id để thêm giỏ/wishlist.
  // Option id for cart/wishlist.
  const optionId = hasVariants ? option?.id : defaultOpt?.id

  const pick = useCallback((name: string, value: string) => {
    setSelected((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Hết hàng khi biết tồn kho và = 0.
  // Out of stock when stock is known and zero.
  const outOfStock = stock != null && stock <= 0
  // Vượt tồn kho khi biết tồn và số lượng chọn lớn hơn.
  const overStock = stock != null && quantity > stock

  const handleAddToCart = async () => {
    if (!optionId) {
      toast.error(hasVariants ? "Vui lòng chọn đủ phân loại" : "Sản phẩm chưa sẵn sàng")
      return
    }
    if (outOfStock) {
      toast.error("Sản phẩm đã hết hàng")
      return
    }
    if (overStock) {
      toast.error(`Chỉ còn ${stock} sản phẩm trong kho`)
      return
    }
    setBusy(true)
    try {
      await add(optionId, quantity)
      toast.success("Đã thêm vào giỏ hàng")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thêm được vào giỏ")
    } finally {
      setBusy(false)
    }
  }

  const handleAddWishlist = async () => {
    if (status !== "authenticated") {
      toast.error("Vui lòng đăng nhập để dùng yêu thích")
      return
    }
    // Wishlist theo PRODUCT (không cần chọn phân loại).
    // Wishlist is by product (no variant needed).
    setBusy(true)
    try {
      await addWishlist(authFetch, product.id)
      toast.success("Đã thêm vào yêu thích")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thêm được")
    } finally {
      setBusy(false)
    }
  }

  const mainImage = mediaUrl(images[activeImg]?.file_path ?? images[0]?.file_path)

  return (
    <>
    <div className="grid gap-7 md:grid-cols-2 md:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      {/* Ảnh */}
      <div className="md:sticky md:top-24 md:self-start">
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-border/70 bg-muted shadow-lg shadow-foreground/5">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <span className="text-sm text-muted-foreground">Chưa có ảnh</span>
          )}
        </div>
        {images.length > 1 ? (
          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
            {images.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveImg(i)}
                aria-label={`Ảnh ${i + 1}`}
                className={`relative size-16 shrink-0 overflow-hidden rounded-xl border transition-[border-color,box-shadow] ${
                  i === activeImg ? "border-primary ring-2 ring-primary/35" : "border-border/70 hover:border-primary/40"
                }`}
              >
                <Image
                  src={mediaUrl(f.file_path) ?? ""}
                  alt={f.description ?? product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Thông tin */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Chi tiết sản phẩm</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">{product.name}</h1>
          {product.locationAddress ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Cơ sở: {product.locationAddress}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl bg-muted/45 p-4">
          {priceIsFrom ? (
            <span className="text-sm text-muted-foreground">Từ</span>
          ) : null}
          <span className="text-3xl font-bold tracking-tight text-primary">{formatPrice(finalPrice)}</span>
          {hasDiscount && price != null ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(price)}
            </span>
          ) : null}
          {hasDiscount ? (
            <Badge variant="destructive">-{discount}%</Badge>
          ) : null}
        </div>

        {stock != null ? (
          <div>
            {stock <= 0 ? (
              <Badge variant="destructive">Hết hàng</Badge>
            ) : stock <= 5 ? (
              <Badge variant="destructive">Sắp hết - còn {stock}</Badge>
            ) : (
              <Badge variant="secondary">Còn hàng ({stock})</Badge>
            )}
          </div>
        ) : null}

        {product.description ? (
          <p className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-7 text-muted-foreground sm:text-base">{product.description}</p>
        ) : null}

        {/* Chọn phân loại */}
        {hasVariants ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            {attributeNames.map((name) => (
              <div key={name}>
                <Label className="mb-2 block font-semibold">{name}</Label>
                <div className="flex flex-wrap gap-2">
                  {product.attribute[name].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pick(name, value)}
                      className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition-[background-color,border-color,color,box-shadow] ${
                        selected[name] === value
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border/70 bg-card hover:border-primary/35 hover:bg-primary/5"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Số lượng + hành động */}
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="qty" className="font-semibold">Số lượng</Label>
          <input
            id="qty"
            type="number"
            min={1}
            max={stock ?? undefined}
            aria-label="Số lượng"
            value={quantity}
            onChange={(e) => {
              // Kẹp trong [1, tồn kho] nếu biết tồn kho.
              // Clamp to [1, stock] when stock is known.
              const n = Math.max(1, Number(e.target.value) || 1)
              setQuantity(stock != null && stock > 0 ? Math.min(n, stock) : n)
            }}
            disabled={outOfStock}
            className="h-11 w-24 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="h-11 flex-1 rounded-full shadow-sm shadow-primary/15" onClick={handleAddToCart} disabled={busy || outOfStock || overStock}>
            {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </Button>
          <Button size="lg" variant="outline" className="h-11 rounded-full px-5" onClick={handleAddWishlist} disabled={busy}>
            Yêu thích
          </Button>
        </div>

        <Separator />

        <ProductReviews productId={product.id} />
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-5">
          <ReviewForm productId={product.id} />
        </div>
      </div>
    </div>

    {/* Gợi ý hay mua cùng (full-width dưới phần chi tiết) */}
    <div className="mt-12 rounded-3xl bg-muted/30 px-4 py-8 sm:mt-16 sm:px-7 sm:py-10">
      <RelatedProducts productId={product.id} />
    </div>
    </>
  )
}

// Danh sách đánh giá đã duyệt của sản phẩm (công khai).
// Approved reviews for the product (public).
function ProductReviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductReviews(productId)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [productId])

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Đánh giá sản phẩm</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có đánh giá nào.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="text-sm font-medium text-amber-600">
                {"★".repeat(r.rating)}
                <span className="text-muted-foreground">
                  {"★".repeat(Math.max(0, 5 - r.rating))}
                </span>
              </div>
              {r.comment ? <p className="mt-1 text-sm">{r.comment}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Form gửi đánh giá (cần đăng nhập). Backend chưa có endpoint liệt kê review theo SP.
// Review submit form (login required).
function ReviewForm({ productId }: { productId: number }) {
  const { status, user, authFetch } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)

  if (status !== "authenticated") {
    return (
      <p className="text-sm text-muted-foreground">
        Đăng nhập để gửi đánh giá sản phẩm.
      </p>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    try {
      await createReview(authFetch, {
        productId,
        userId: user.uid,
        rating,
        comment: comment.trim() || undefined,
      })
      toast.success("Đã gửi đánh giá, chờ duyệt")
      setComment("")
      setRating(5)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không gửi được đánh giá")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h2 className="text-base font-semibold tracking-tight">Viết đánh giá</h2>
      <div className="flex items-center gap-2">
        <Label htmlFor="rating">Điểm</Label>
        <select
          id="rating"
          aria-label="Điểm đánh giá"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="h-11 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} sao
            </option>
          ))}
        </select>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Nhận xét của bạn..."
      />
      <Button type="submit" size="sm" disabled={busy} className="min-h-11 w-fit rounded-full px-4">
        Gửi đánh giá
      </Button>
    </form>
  )
}
