"use client"

// Context xác thực (mô hình KHÔNG proxy - trình duyệt gọi thẳng backend).
// - Access token: lưu trong RAM (state + ref), KHÔNG localStorage/cookie.
// - Refresh token: httpOnly cookie do BACKEND đặt (Path=/api/refresh-token), trình duyệt tự gửi
//   khi gọi /api/refresh-token. JS không đọc được.
// - Mọi fetch đặt credentials:"include" để cookie cross-site đi kèm (cần backend bật CORS
//   allow_credentials + cookie samesite=none/secure ở prod; dev localhost same-site dùng lax).
// - Khi mở app: gọi /api/refresh-token một lần để khôi phục phiên (nếu cookie còn hạn).
// Auth context (no-proxy). Access token in RAM; refresh is a backend httpOnly cookie.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { apiBase } from "./config"
import { ApiError } from "./api-error"
import { decodeJwt, type JwtUser } from "./jwt"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

// Kiểu của authFetch - tái dùng ở các module API cần đăng nhập.
// Type of authFetch - reused by API modules that require login.
export type AuthFetch = <T>(path: string, init?: RequestInit) => Promise<T>

interface AuthContextValue {
  status: AuthStatus
  user: JwtUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // fetch đã gắn Bearer + tự refresh khi 401, gọi thẳng backend. Trả dữ liệu JSON kiểu T.
  // authenticated fetch: attaches Bearer + auto-refreshes on 401, calls backend directly.
  authFetch: <T>(path: string, init?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const api = (path: string) => `${apiBase()}${path}`

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<JwtUser | null>(null)
  // Giữ token trong ref để truy cập đồng bộ trong authFetch.
  // Keep the token in a ref for synchronous access inside authFetch.
  const tokenRef = useRef<string | null>(null)

  const applyToken = useCallback((token: string | null) => {
    tokenRef.current = token
    if (token) {
      setUser(decodeJwt(token))
      setStatus("authenticated")
    } else {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  // Gọi endpoint refresh của backend; trả access token mới hoặc null.
  // Cookie refresh tự được gửi (credentials:"include" + path khớp /api/refresh-token).
  // Call the backend refresh endpoint; returns a new access token or null.
  const requestRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(api("/api/refresh-token"), {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) return null
      const data = (await res.json()) as { accessToken: string }
      return data.accessToken ?? null
    } catch {
      return null
    }
  }, [])

  // Khôi phục phiên khi mount.
  // Restore session on mount.
  useEffect(() => {
    let active = true
    requestRefresh().then((token) => {
      if (!active) return
      applyToken(token)
    })
    return () => {
      active = false
    }
  }, [requestRefresh, applyToken])

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetch(api("/api/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new ApiError(res.status, data)
      }
      applyToken(data.accessToken)
    },
    [applyToken]
  )

  const logout = useCallback(async () => {
    const token = tokenRef.current
    try {
      await fetch(api("/api/logout"), {
        method: "GET",
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      })
    } finally {
      applyToken(null)
    }
  }, [applyToken])

  const authFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const doFetch = (token: string | null) => {
        const headers = new Headers(init.headers)
        if (token) headers.set("authorization", `Bearer ${token}`)
        if (!headers.has("content-type") && init.body) {
          headers.set("content-type", "application/json")
        }
        return fetch(api(path), { ...init, headers, credentials: "include" })
      }

      let res = await doFetch(tokenRef.current)

      // 401 → thử refresh một lần rồi gọi lại.
      // 401 → try refresh once then retry.
      if (res.status === 401) {
        const newToken = await requestRefresh()
        if (newToken) {
          applyToken(newToken)
          res = await doFetch(newToken)
        } else {
          applyToken(null)
        }
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new ApiError(res.status, body)
      }
      // 204/empty → trả undefined
      if (res.status === 204) return undefined as T
      const text = await res.text()
      return (text ? JSON.parse(text) : undefined) as T
    },
    [requestRefresh, applyToken]
  )

  return (
    <AuthContext.Provider value={{ status, user, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth phải dùng bên trong <AuthProvider>")
  }
  return ctx
}
