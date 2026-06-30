"use client"

// Quản trị đánh giá: liệt kê tất cả + duyệt/bỏ duyệt/xóa.
// Admin reviews: list all + approve/disapprove/delete.
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  approveReview,
  deleteReview,
  disapproveReview,
  getAllReviews,
} from "@/lib/api/admin"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import type { Review } from "@/lib/types"

export default function AdminReviewsPage() {
  const { authFetch } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getAllReviews(authFetch)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const act = async (fn: Promise<unknown>, ok: string) => {
    try {
      await fn
      toast.success(ok)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Thao tác thất bại")
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Đánh giá ({reviews.length})</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có đánh giá.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-600">
                    {"★".repeat(r.rating)}
                  </span>
                  <Badge variant={r.is_approved ? "default" : "outline"}>
                    {r.is_approved ? "Đã duyệt" : "Chờ duyệt"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    SP #{r.product_id} - User #{r.user_id}
                  </span>
                </div>
                <div className="flex gap-2">
                  {r.is_approved ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        act(disapproveReview(authFetch, r.id), "Đã bỏ duyệt")
                      }
                    >
                      Bỏ duyệt
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      onClick={() => act(approveReview(authFetch, r.id), "Đã duyệt")}
                    >
                      Duyệt
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => act(deleteReview(authFetch, r.id), "Đã xóa")}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
              {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
