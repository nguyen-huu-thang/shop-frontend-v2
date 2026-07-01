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
    <div className="grid gap-8 md:grid-cols-2">
      {/* Ảnh */}
      <div className="md:sticky md:top-20 md:self-start">
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border bg-muted">
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
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveImg(i)}
                aria-label={`Ảnh ${i + 1}`}
                className={`relative size-16 shrink-0 overflow-hidden rounded-md border transition-colors ${
                  i === activeImg ? "border-primary ring-2 ring-primary/40" : "hover:border-primary/40"
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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {product.locationAddress ? (
            <p className="text-sm text-muted-foreground">
              Cơ sở: {product.locationAddress}
            </p>
          ) : null}
        </div>

        <div className="flex items-baseline gap-3">
          {priceIsFrom ? (
            <span className="text-sm text-muted-foreground">Từ</span>
          ) : null}
          <span className="text-2xl font-bold">{formatPrice(finalPrice)}</span>
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
          <p className="text-sm leading-relaxed">{product.description}</p>
        ) : null}

        {/* Chọn phân loại */}
        {hasVariants ? (
          <div className="flex flex-col gap-3">
            {attributeNames.map((name) => (
              <div key={name}>
                <Label className="mb-1">{name}</Label>
                <div className="flex flex-wrap gap-2">
                  {product.attribute[name].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pick(name, value)}
                      className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                        selected[name] === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-muted"
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
        <div className="flex items-center gap-2">
          <Label htmlFor="qty">Số lượng</Label>
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
            className="h-8 w-20 rounded-md border bg-transparent px-2 text-sm disabled:opacity-50"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAddToCart} disabled={busy || outOfStock || overStock}>
            {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </Button>
          <Button variant="outline" onClick={handleAddWishlist} disabled={busy}>
            Yêu thích
          </Button>
        </div>

        <Separator />

        <ProductReviews productId={product.id} />
        <ReviewForm productId={product.id} />
      </div>
    </div>

    {/* Gợi ý hay mua cùng (full-width dưới phần chi tiết) */}
    <div className="mt-10">
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
      <h2 className="mb-2 font-medium">Đánh giá sản phẩm</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có đánh giá nào.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border p-3">
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
    <form onSubmit={submit} className="flex flex-col gap-2">
      <h2 className="font-medium">Viết đánh giá</h2>
      <div className="flex items-center gap-2">
        <Label htmlFor="rating">Điểm</Label>
        <select
          id="rating"
          aria-label="Điểm đánh giá"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
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
      <Button type="submit" size="sm" disabled={busy} className="w-fit">
        Gửi đánh giá
      </Button>
    </form>
  )
}
