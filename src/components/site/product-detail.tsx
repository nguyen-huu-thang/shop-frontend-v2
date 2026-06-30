"use client"

// Chi tiết sản phẩm (client): chọn thuộc tính → tìm option (giá/tồn), thêm giỏ/wishlist,
// xem ảnh, gửi đánh giá. Cơ chế option: chọn đủ mỗi thuộc tính 1 giá trị → 1 SKU.
// ⚠️ Chưa liệt kê được review theo sản phẩm (backend khoảng trống #7) - chỉ có form gửi.
// Product detail (client): pick attributes → find option, add to cart/wishlist, gallery, review.
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
  const [defaultOpt, setDefaultOpt] = useState<OptionDefault | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [option, setOption] = useState<ProductOption | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)

  // Tải ảnh + option mặc định.
  // Load images + default option.
  useEffect(() => {
    getProductImages(product.id).then(setImages).catch(() => setImages([]))
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

  // Giá + tồn hiển thị.
  // Displayed price + stock.
  const price = hasVariants
    ? option?.price ?? null
    : defaultOpt?.prices ?? product.price
  const stock = hasVariants ? option?.stock ?? null : defaultOpt?.stock ?? product.stock

  // Option id để thêm giỏ/wishlist.
  // Option id for cart/wishlist.
  const optionId = hasVariants ? option?.id : defaultOpt?.id

  const pick = useCallback((name: string, value: string) => {
    setSelected((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleAddToCart = async () => {
    if (!optionId) {
      toast.error(hasVariants ? "Vui lòng chọn đủ phân loại" : "Sản phẩm chưa sẵn sàng")
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

  const mainImage = mediaUrl(images[0]?.file_path)

  return (
    <>
    <div className="grid gap-8 md:grid-cols-2">
      {/* Ảnh */}
      <div>
        <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border bg-muted">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm text-muted-foreground">Chưa có ảnh</span>
          )}
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.id}
                src={mediaUrl(f.file_path) ?? ""}
                alt={f.description ?? product.name}
                className="size-16 rounded-md border object-cover"
              />
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

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{formatPrice(price)}</span>
          {(product.discountPercentage ?? 0) > 0 ? (
            <Badge variant="destructive">-{product.discountPercentage}%</Badge>
          ) : null}
        </div>

        {stock != null ? (
          <p className="text-sm text-muted-foreground">Tồn kho: {stock}</p>
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
            aria-label="Số lượng"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 w-20 rounded-md border bg-transparent px-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAddToCart} disabled={busy}>
            Thêm vào giỏ
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
