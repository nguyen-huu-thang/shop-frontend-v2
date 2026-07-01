// Giải mã payload JWT phía client (KHÔNG xác thực chữ ký - chỉ để hiển thị thông tin user).
// Access token của backend chứa claims: uid, username, email, isActive, exp, type, jti...
// (xem authentication_service.create_token). Đủ để hiển thị user mà không cần endpoint /me.
// Decode a JWT payload on the client (does NOT verify signature - display purposes only).

export interface JwtUser {
  uid: number
  username: string
  email: string
  isActive?: boolean
  exp?: number
}

export function decodeJwt(token: string): JwtUser | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    // base64url → base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    // atob trả chuỗi latin1; phải giải lại UTF-8 để không hỏng tiếng Việt (username/email có dấu).
    // atob yields a latin1 string; re-decode as UTF-8 so Vietnamese chars survive.
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder("utf-8").decode(bytes)
    const data = JSON.parse(json) as JwtUser
    return data
  } catch {
    return null
  }
}
