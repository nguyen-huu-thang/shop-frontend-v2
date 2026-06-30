"use client"

// Bọc next-themes cho toàn app (sáng/tối + theo hệ thống). Dùng ở root layout.
// next-themes provider for the whole app (light/dark + system).
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
