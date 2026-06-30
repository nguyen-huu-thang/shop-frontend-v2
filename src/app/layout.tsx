import type { Metadata } from "next"
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ConditionalShell } from "@/components/site/conditional-shell"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { SITE_URL } from "@/lib/config"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

// Font hỗ trợ tiếng Việt đầy đủ (subset vietnamese).
// Font with full Vietnamese support.
const fontSans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: siteConfig.name,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${fontSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              {/* Khung đổi theo route: /admin có shell quản trị riêng, còn lại là storefront. */}
              {/* Shell varies by route: /admin has its own admin shell; others use the storefront. */}
              <ConditionalShell>{children}</ConditionalShell>
            </CartProvider>
          </AuthProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
