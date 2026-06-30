"use client"

// Trang thanh toán cổng online GIẢ LẬP (demo). Nhận ?ref= (paymentRef) rồi cho người dùng bấm
// "thành công" / "thất bại" -> gọi callback backend chốt trạng thái thanh toán đơn.
// Mock online payment gateway page (demo). Reads ?ref= and posts the callback.
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/site/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockPaymentCallback } from "@/lib/api/payments"
import { ApiError } from "@/lib/api-error"

function MockPaymentInner() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = params.get("ref") ?? ""
  const [busy, setBusy] = useState(false)

  const finish = async (success: boolean) => {
    if (!ref) {
      toast.error("Thiếu mã giao dịch")
      return
    }
    setBusy(true)
    try {
      await mockPaymentCallback(ref, success)
      if (success) {
        toast.success("Thanh toán thành công")
      } else {
        toast.message("Đã hủy thanh toán")
      }
      router.push("/orders")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xử lý thanh toán thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="py-12">
      <Card size="sm" className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Cổng thanh toán giả lập</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Đây là trang demo mô phỏng cổng thanh toán online. Mã giao dịch:{" "}
            <span className="font-mono">{ref || "(thiếu)"}</span>
          </p>
          <div className="flex gap-2">
            <Button disabled={busy || !ref} onClick={() => finish(true)} className="flex-1">
              Thanh toán thành công
            </Button>
            <Button
              variant="outline"
              disabled={busy || !ref}
              onClick={() => finish(false)}
              className="flex-1"
            >
              Hủy / Thất bại
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}

export default function MockPaymentPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <MockPaymentInner />
      </Suspense>
    </RequireAuth>
  )
}
