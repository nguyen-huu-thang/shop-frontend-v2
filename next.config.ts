import type { NextConfig } from "next"

// Ảnh media của backend được rewrite về cùng origin Next (ảnh first-party, ẩn cổng backend,
// hợp với next/image). Đây CHỈ là rewrite ảnh tĩnh - các lệnh gọi API dữ liệu/auth vẫn đi
// thẳng từ trình duyệt tới backend (mô hình không proxy của shop).
// Backend media is rewritten to the Next origin (first-party images). Data/auth API calls still
// go directly from the browser to the backend (shop's no-proxy model).
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8088"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${INTERNAL_API_URL}/media/:path*`,
      },
    ]
  },
}

export default nextConfig
