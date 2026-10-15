import type { ShopSettings } from "./types"

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: "Cửa hàng",
  tagline: "Mua sắm trực tuyến",
  description: "Khám phá sản phẩm và đặt hàng trực tuyến.",
  logoPath: null,
  coverPath: null,
  footerNote: null,
  theme: { primaryColor: "#2563EB", font: "be-vietnam-pro" },
  home: { heroTitle: null, heroSubtitle: null, announcement: null },
  contact: { hotline: null, zalo: null, email: null, address: null },
  social: { facebook: null, instagram: null, tiktok: null, youtube: null },
  owner: { name: null, address: null, taxCode: null, registration: null },
  payments: { cod: true, mockOnline: true },
  policies: [],
  updatedAt: "",
}
