// robots.txt: cho phép index storefront, chặn khu quản trị + các trang riêng tư.
// robots.txt: allow the storefront, block the admin + private pages.
import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/wishlist"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
