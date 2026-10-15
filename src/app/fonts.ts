import { Be_Vietnam_Pro, Inter, Lexend, Nunito } from "next/font/google"

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
})

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: "variable",
  variable: "--font-inter",
})

const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: "variable",
  variable: "--font-lexend",
})

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: "variable",
  variable: "--font-nunito",
})

export const shopFonts = { "be-vietnam-pro": beVietnamPro, inter, lexend, nunito }
export const shopFontClasses = Object.values(shopFonts)
  .map((font) => font.variable)
  .join(" ")
export const shopFontVariables: Record<string, string> = {
  "be-vietnam-pro": "var(--font-be-vietnam-pro)",
  inter: "var(--font-inter)",
  lexend: "var(--font-lexend)",
  nunito: "var(--font-nunito)",
}
