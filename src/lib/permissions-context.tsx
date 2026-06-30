"use client"

// Quyền hiệu lực của user (GET /api/me/permissions) - dùng để ẩn/hiện menu/nút trong admin.
// Chỉ tải khi đã đăng nhập. Backend vẫn là nơi thực thi quyền (frontend chỉ ẩn UI cho gọn).
// Effective permissions for the current user - used to gate admin UI (backend still enforces).
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import { useAuth } from "./auth-context"
import { getMyPermissions } from "./api/account"

interface PermissionsValue {
  permissions: string[]
  loading: boolean
  has: (name: string) => boolean
}

const PermissionsContext = createContext<PermissionsValue | null>(null)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { status, authFetch } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== "authenticated") {
      setPermissions([])
      setLoading(status === "loading")
      return
    }
    let active = true
    setLoading(true)
    getMyPermissions(authFetch)
      .then((perms) => {
        if (active) setPermissions(Array.isArray(perms) ? perms : [])
      })
      .catch(() => {
        if (active) setPermissions([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [status, authFetch])

  const has = (name: string) => permissions.includes(name)

  return (
    <PermissionsContext.Provider value={{ permissions, loading, has }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions(): PermissionsValue {
  const ctx = useContext(PermissionsContext)
  if (!ctx) {
    throw new Error("usePermissions phải dùng bên trong <PermissionsProvider>")
  }
  return ctx
}
