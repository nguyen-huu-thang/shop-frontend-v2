import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ConditionalShell } from "@/components/site/conditional-shell"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { SITE_URL } from "@/lib/config"
import { getShopSettingsForStore } from "@/lib/server-api"
import { shopFontClasses, shopFontVariables } from "./fonts"
import "./globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

function validColor(value: string | null | undefined): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value))
}

function foregroundForColor(hex: string): string {
  const channels = hex.slice(1).match(/.{2}/g)?.map((part) => parseInt(part, 16) / 255)
  if (!channels || channels.length !== 3) return "#ffffff"
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
  return luminance > 0.179 ? "#111827" : "#ffffff"
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getShopSettingsForStore()
  const title = settings.tagline
    ? `${settings.shopName} - ${settings.tagline}`
    : settings.shopName
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${settings.shopName}` },
    description: settings.description ?? undefined,
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: settings.shopName,
      title,
      description: settings.description ?? undefined,
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getShopSettingsForStore()
  const primary = validColor(settings.theme?.primaryColor)
    ? settings.theme.primaryColor
    : "#2563EB"
  const fontFamily =
    shopFontVariables[settings.theme?.font ?? ""] ?? shopFontVariables["be-vietnam-pro"]
  const themeStyle = {
    "--primary": primary,
    "--primary-foreground": foregroundForColor(primary),
    "--ring": primary,
    "--font-sans": fontFamily,
  } as unknown as CSSProperties

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      style={themeStyle}
      className={`${shopFontClasses} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <ConditionalShell settings={settings}>{children}</ConditionalShell>
            </CartProvider>
          </AuthProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
