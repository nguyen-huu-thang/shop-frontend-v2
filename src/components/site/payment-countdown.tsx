"use client"

// Đồng hồ đếm ngược tới hạn thanh toán đơn online. Hết hạn -> báo đã quá hạn (đơn sẽ tự hủy).
// Countdown to an online order's payment deadline.
import { useEffect, useState } from "react"

function remaining(deadlineMs: number): { done: boolean; text: string } {
  const diff = deadlineMs - Date.now()
  if (diff <= 0) return { done: true, text: "Đã quá hạn thanh toán" }
  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return { done: false, text: `${h}h ${pad(m)}m ${pad(s)}s` }
}

export function PaymentCountdown({ deadline }: { deadline: string }) {
  const deadlineMs = new Date(deadline).getTime()
  const [state, setState] = useState(() => remaining(deadlineMs))

  useEffect(() => {
    setState(remaining(deadlineMs))
    const t = setInterval(() => setState(remaining(deadlineMs)), 1000)
    return () => clearInterval(t)
  }, [deadlineMs])

  if (state.done) {
    return <span className="font-medium text-destructive">{state.text}</span>
  }
  return (
    <span className="font-medium text-amber-600 dark:text-amber-500 tabular-nums">
      Còn lại {state.text}
    </span>
  )
}
