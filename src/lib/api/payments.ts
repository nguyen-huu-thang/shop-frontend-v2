// Thanh toán cổng online GIẢ LẬP (demo). Trang /payment/mock gọi callback này để chốt kết quả.
// Mock payment gateway callback (demo). Public: identified by paymentRef.
import { publicFetch } from "@/lib/api-client"
import type { MessageResponse } from "@/lib/types"

export const mockPaymentCallback = (paymentRef: string, success: boolean) =>
  publicFetch<MessageResponse>("/api/payments/mock/callback", {
    method: "POST",
    body: JSON.stringify({ paymentRef, success }),
  })
