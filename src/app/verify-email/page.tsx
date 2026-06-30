"use client"

// Xác minh email: đọc ?token= từ liên kết trong email rồi gọi backend xác minh.
// SMTP demo có thể đang TẮT -> lấy token từ log backend / bảng auth_tokens để dán vào URL.
// Verify email: reads ?token= and confirms with the backend.
import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Container } from "@/components/site/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyEmail } from "@/lib/api/auth-email"
import { ApiError } from "@/lib/api-error"

function VerifyEmailInner() {
  const params = useSearchParams()
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const autoRan = useRef(false)

  const run = async (t: string) => {
    if (!t.trim()) return
    setStatus("loading")
    try {
      const res = await verifyEmail(t.trim())
      setStatus("done")
      setMessage(res.message ?? "Email đã được xác minh.")
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof ApiError ? err.message : "Xác minh thất bại. Token có thể đã hết hạn.")
    }
  }

  // Nếu URL có token, tự xác minh một lần.
  useEffect(() => {
    const t = params.get("token")
    if (t && !autoRan.current) {
      autoRan.current = true
      setToken(t)
      run(t)
    }
  }, [params])

  return (
    <Container className="py-12">
      <Card size="sm" className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Xác minh email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "done" ? (
            <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
          ) : (
            <>
              {status === "error" ? (
                <p className="text-sm text-destructive">{message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Dán token xác minh (từ email, hoặc log backend khi demo) rồi bấm xác minh.
                </p>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="vtoken">Token xác minh</Label>
                <Input
                  id="vtoken"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="token..."
                />
              </div>
              <Button
                disabled={status === "loading" || !token.trim()}
                onClick={() => run(token)}
                className="w-full"
              >
                Xác minh
              </Button>
            </>
          )}
          <a href="/account" className="block text-sm text-primary hover:underline">
            Về trang tài khoản
          </a>
        </CardContent>
      </Card>
    </Container>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  )
}
