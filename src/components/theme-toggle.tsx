"use client"

// Nút chuyển sáng/tối. Tránh hydration mismatch bằng cách chỉ render icon sau khi mounted.
// Light/dark toggle. Renders the icon only after mount to avoid hydration mismatch.
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Chuyển chế độ sáng/tối"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? isDark ? <Sun /> : <Moon /> : <Sun />}
    </Button>
  )
}
