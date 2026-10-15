"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/permissions-context"
import {
  getAdminShopSettingOptions,
  getAdminShopSettings,
  getShopPoliciesForAdmin,
  updateShopPolicy,
  updateShopSettings,
  uploadShopImage,
} from "@/lib/api/shop-settings"
import type { ShopPolicyPage, ShopSettingOptions, ShopSettings } from "@/lib/types"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const { has, loading: permissionsLoading } = usePermissions()
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [options, setOptions] = useState<ShopSettingOptions | null>(null)
  const [policies, setPolicies] = useState<ShopPolicyPage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<"logoPath" | "coverPath" | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextSettings, nextOptions, nextPolicies] = await Promise.all([
        getAdminShopSettings(authFetch),
        getAdminShopSettingOptions(authFetch),
        getShopPoliciesForAdmin(authFetch),
      ])
      setSettings(nextSettings)
      setOptions(nextOptions)
      setPolicies(nextPolicies)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được cấu hình cửa hàng")
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    void load()
  }, [load])

  const setTop = (key: "shopName" | "tagline" | "description" | "logoPath" | "coverPath" | "footerNote", value: string) => {
    setSettings((current) => {
      if (!current) return current
      if (key === "shopName") return { ...current, shopName: value }
      return { ...current, [key]: value || null }
    })
  }

  const setNested = <K extends "theme" | "home" | "contact" | "social" | "owner" | "payments",
    F extends keyof ShopSettings[K]>(group: K, field: F, value: ShopSettings[K][F]) => {
    setSettings((current) => {
      if (!current) return current
      return { ...current, [group]: { ...current[group], [field]: value } } as ShopSettings
    })
  }

  const uploadImage = async (key: "logoPath" | "coverPath", file?: File) => {
    if (!file) return
    setUploading(key)
    try {
      const uploaded = await uploadShopImage(authFetch, file)
      setTop(key, uploaded.file)
      toast.success("Đã tải ảnh lên. Bấm Lưu cấu hình để áp dụng.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Tải ảnh lên thất bại")
    } finally {
      setUploading(null)
    }
  }

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!settings) return
    setBusy(true)
    try {
      const updated = await updateShopSettings(authFetch, {
        shopName: settings.shopName,
        tagline: settings.tagline,
        description: settings.description,
        logoPath: settings.logoPath,
        coverPath: settings.coverPath,
        footerNote: settings.footerNote,
        theme: settings.theme,
        home: settings.home,
        contact: settings.contact,
        social: settings.social,
        owner: settings.owner,
        payments: settings.payments,
      })
      setSettings(updated)
      toast.success("Đã lưu cấu hình cửa hàng")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu cấu hình thất bại")
    } finally {
      setBusy(false)
    }
  }

  const savePolicy = async (policy: ShopPolicyPage) => {
    try {
      const updated = await updateShopPolicy(authFetch, policy.slug, {
        title: policy.title,
        content: policy.content,
        isPublished: Boolean(policy.isPublished),
      })
      setPolicies((items) => items.map((item) => item.slug === updated.slug ? updated : item))
      toast.success(`Đã lưu ${policy.title}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu chính sách thất bại")
    }
  }

  if (loading || permissionsLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
  }
  if (!has("manage_system_settings")) {
    return <p role="alert" className="text-sm text-destructive">Bạn không có quyền quản lý cấu hình cửa hàng.</p>
  }
  if (!settings || !options) {
    return <div className="space-y-3"><p className="text-sm text-destructive">Không tải được cấu hình.</p><Button variant="outline" onClick={() => void load()}>Thử lại</Button></div>
  }

  const imageAccept = options.imageExtensions.map((extension) => `.${extension}`).join(",")

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-sm font-medium text-primary">Thiết lập cửa hàng</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Cấu hình thương hiệu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Những giá trị này cập nhật tên, màu sắc, nội dung và thông tin công khai của trang.
        </p>
      </header>

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-lg font-semibold">Nhận diện cửa hàng</h2>
          <div className="grid gap-2">
            <Label htmlFor="shop-name">Tên cửa hàng</Label>
            <Input id="shop-name" required maxLength={100} value={settings.shopName} onChange={(event) => setTop("shopName", event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shop-tagline">Khẩu hiệu</Label>
            <Input id="shop-tagline" maxLength={160} value={settings.tagline ?? ""} onChange={(event) => setTop("tagline", event.target.value)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="shop-description">Mô tả và SEO</Label>
            <Textarea id="shop-description" maxLength={500} value={settings.description ?? ""} onChange={(event) => setTop("description", event.target.value)} />
          </div>
          {(["logoPath", "coverPath"] as const).map((key) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={key}>{key === "logoPath" ? "Logo" : "Ảnh bìa"}</Label>
              <Input id={key} value={settings[key] ?? ""} placeholder="Đường dẫn media" onChange={(event) => setTop(key, event.target.value)} />
              <Input
                type="file"
                accept={imageAccept}
                aria-label={`Tải ${key === "logoPath" ? "logo" : "ảnh bìa"} lên`}
                disabled={uploading !== null}
                onChange={(event) => { void uploadImage(key, event.target.files?.[0]); event.currentTarget.value = "" }}
              />
              {uploading === key ? <span className="text-xs text-muted-foreground">Đang tải ảnh...</span> : null}
            </div>
          ))}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="footer-note">Ghi chú chân trang</Label>
            <Textarea id="footer-note" maxLength={500} value={settings.footerNote ?? ""} onChange={(event) => setTop("footerNote", event.target.value)} />
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-lg font-semibold">Giao diện và trang chủ</h2>
          <div className="grid gap-2">
            <Label htmlFor="primary-color">Màu chủ đạo</Label>
            <div className="flex items-center gap-3">
              <Input id="primary-color" type="color" className="h-10 w-16 p-1" value={settings.theme.primaryColor} onChange={(event) => setNested("theme", "primaryColor", event.target.value)} />
              <span className="text-sm text-muted-foreground">{settings.theme.primaryColor}</span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shop-font">Font chữ</Label>
            <select id="shop-font" className="h-10 rounded-md border bg-background px-3 text-sm" value={settings.theme.font} onChange={(event) => setNested("theme", "font", event.target.value)}>
              {options.fonts.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="hero-title">Tiêu đề trang chủ</Label>
            <Input id="hero-title" maxLength={120} value={settings.home.heroTitle ?? ""} onChange={(event) => setNested("home", "heroTitle", event.target.value || null)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="hero-subtitle">Mô tả trang chủ</Label>
            <Textarea id="hero-subtitle" maxLength={300} value={settings.home.heroSubtitle ?? ""} onChange={(event) => setNested("home", "heroSubtitle", event.target.value || null)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="announcement">Thông báo</Label>
            <Input id="announcement" maxLength={200} value={settings.home.announcement ?? ""} onChange={(event) => setNested("home", "announcement", event.target.value || null)} />
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-lg font-semibold">Liên hệ và mạng xã hội</h2>
          <Field label="Điện thoại" value={settings.contact.hotline} onChange={(value) => setNested("contact", "hotline", value)} />
          <Field label="Zalo" value={settings.contact.zalo} onChange={(value) => setNested("contact", "zalo", value)} />
          <Field label="Email" type="email" value={settings.contact.email} onChange={(value) => setNested("contact", "email", value)} />
          <Field label="Địa chỉ" value={settings.contact.address} onChange={(value) => setNested("contact", "address", value)} />
          <Field label="Facebook URL" type="url" value={settings.social.facebook} onChange={(value) => setNested("social", "facebook", value)} />
          <Field label="Instagram URL" type="url" value={settings.social.instagram} onChange={(value) => setNested("social", "instagram", value)} />
          <Field label="TikTok URL" type="url" value={settings.social.tiktok} onChange={(value) => setNested("social", "tiktok", value)} />
          <Field label="YouTube URL" type="url" value={settings.social.youtube} onChange={(value) => setNested("social", "youtube", value)} />
        </section>

        <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-lg font-semibold">Thông tin đơn vị bán hàng</h2>
          <Field label="Tên đơn vị" value={settings.owner.name} onChange={(value) => setNested("owner", "name", value)} />
          <Field label="Mã số thuế" value={settings.owner.taxCode} onChange={(value) => setNested("owner", "taxCode", value)} />
          <Field label="Địa chỉ đăng ký" value={settings.owner.address} onChange={(value) => setNested("owner", "address", value)} />
          <Field label="Thông tin đăng ký" value={settings.owner.registration} onChange={(value) => setNested("owner", "registration", value)} />
        </section>

        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Phương thức thanh toán</h2>
          <p className="text-sm text-muted-foreground">Chỉ bật các phương thức đang được backend hỗ trợ.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.payments.cod} onChange={(event) => setNested("payments", "cod", event.target.checked)} />
            Thanh toán khi nhận hàng (COD)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.payments.mockOnline} onChange={(event) => setNested("payments", "mockOnline", event.target.checked)} />
            Thanh toán trực tuyến mô phỏng
          </label>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu cấu hình"}</Button>
        </div>
      </form>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">Trang chính sách</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nội dung Markdown. Chỉ trang được xuất bản mới hiện ở chân trang.</p>
        </div>
        {policies.map((policy) => (
          <PolicyEditor key={policy.slug} policy={policy} onSave={savePolicy} />
        ))}
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  type?: string
}) {
  const id = "field-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value || null)} />
    </div>
  )
}

function PolicyEditor({
  policy,
  onSave,
}: {
  policy: ShopPolicyPage
  onSave: (policy: ShopPolicyPage) => Promise<void>
}) {
  const [draft, setDraft] = useState(policy)
  const [busy, setBusy] = useState(false)
  useEffect(() => setDraft(policy), [policy])

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        try { await onSave(draft) } finally { setBusy(false) }
      }}
      className="grid gap-3 rounded-2xl border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{policy.title}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(draft.isPublished)} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} />
          Xuất bản
        </label>
      </div>
      <Label htmlFor={`policy-title-${policy.slug}`}>Tiêu đề</Label>
      <Input id={`policy-title-${policy.slug}`} value={draft.title} maxLength={150} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
      <Label htmlFor={`policy-content-${policy.slug}`}>Nội dung</Label>
      <Textarea id={`policy-content-${policy.slug}`} value={draft.content} maxLength={50000} rows={8} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} />
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={busy}>{busy ? "Đang lưu..." : "Lưu chính sách"}</Button>
      </div>
    </form>
  )
}
