import type { AuthFetch } from "@/lib/auth-context"
import type {
  ShopPolicyPage,
  ShopSettingOptions,
  ShopSettings,
} from "@/lib/types"

export interface ShopSettingsUpdatePayload {
  shopName: string
  tagline: string | null
  description: string | null
  logoPath: string | null
  coverPath: string | null
  footerNote: string | null
  theme: ShopSettings["theme"]
  home: ShopSettings["home"]
  contact: ShopSettings["contact"]
  social: ShopSettings["social"]
  owner: ShopSettings["owner"]
  payments: ShopSettings["payments"]
}

export const getAdminShopSettings = (authFetch: AuthFetch) =>
  authFetch<ShopSettings>("/api/shop-settings")

export const getAdminShopSettingOptions = (authFetch: AuthFetch) =>
  authFetch<ShopSettingOptions>("/api/shop-settings/options")

export const updateShopSettings = (
  authFetch: AuthFetch,
  payload: ShopSettingsUpdatePayload
) =>
  authFetch<ShopSettings>("/api/shop-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  })

export const getShopPoliciesForAdmin = (authFetch: AuthFetch) =>
  authFetch<ShopPolicyPage[]>("/api/shop-settings/policies")

export const updateShopPolicy = (
  authFetch: AuthFetch,
  slug: string,
  payload: Pick<ShopPolicyPage, "title" | "content" | "isPublished">
) =>
  authFetch<ShopPolicyPage>("/api/shop-settings/policies/" + encodeURIComponent(slug), {
    method: "PUT",
    body: JSON.stringify(payload),
  })

export async function uploadShopImage(
  authFetch: AuthFetch,
  file: File
): Promise<{ file: string }> {
  const body = new FormData()
  body.append("file", file)
  const result = await authFetch<{ message: string; id: number; file: string }>(
    "/api/files",
    { method: "POST", body }
  )
  return { file: result.file }
}
