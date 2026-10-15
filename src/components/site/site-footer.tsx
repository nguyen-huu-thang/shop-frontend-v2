import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { mediaUrl } from "@/lib/format"
import type { ShopSettings } from "@/lib/types"

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null
  } catch {
    return null
  }
}

function phoneHref(value: string | null): string | null {
  if (!value) return null
  const digits = value.trim().replace(/[^\d+]/g, "")
  return digits ? "tel:" + digits : null
}

function zaloHref(value: string | null): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, "")
  return digits ? "https://zalo.me/" + digits : null
}

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  const logo = mediaUrl(settings.logoPath)
  const contacts = [
    { label: "Điện thoại", value: settings.contact.hotline, href: phoneHref(settings.contact.hotline) },
    { label: "Zalo", value: settings.contact.zalo, href: zaloHref(settings.contact.zalo) },
    {
      label: "Email",
      value: settings.contact.email,
      href: settings.contact.email ? "mailto:" + settings.contact.email : null,
    },
  ].filter((item) => item.value)
  const socials = [
    { label: "Facebook", href: safeExternalUrl(settings.social.facebook) },
    { label: "Instagram", href: safeExternalUrl(settings.social.instagram) },
    { label: "TikTok", href: safeExternalUrl(settings.social.tiktok) },
    { label: "YouTube", href: safeExternalUrl(settings.social.youtube) },
  ].filter((item) => item.href)
  const ownerDetails = [
    settings.owner.name,
    settings.owner.address,
    settings.owner.taxCode ? "Mã số thuế: " + settings.owner.taxCode : null,
    settings.owner.registration ? "Đăng ký: " + settings.owner.registration : null,
  ].filter(Boolean)

  return (
    <footer className="mt-14 border-t border-border/70 bg-muted/35 sm:mt-20">
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-[1.2fr_0.8fr_1fr] md:gap-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-sm text-primary-foreground shadow-sm shadow-primary/20">
              {logo ? (
                <Image src={logo} alt={settings.shopName} fill sizes="36px" className="object-contain p-1" />
              ) : (
                settings.shopName.trim().charAt(0).toUpperCase() || "S"
              )}
            </span>
            {settings.shopName}
          </Link>
          {settings.footerNote || settings.description ? (
          <p className="mt-3 max-w-sm whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {settings.footerNote || settings.description}
            </p>
          ) : null}
          {ownerDetails.length > 0 ? (
            <div className="mt-4 space-y-1 text-xs leading-5 text-muted-foreground">
              {ownerDetails.map((item, index) => <p key={index}>{item}</p>)}
            </div>
          ) : null}
        </div>

        <div className="text-sm">
          <h2 className="font-semibold tracking-tight">Mua sắm</h2>
          <ul className="mt-3 space-y-2.5 text-muted-foreground">
            <li><Link href="/products" className="transition-colors hover:text-primary">Sản phẩm</Link></li>
            <li><Link href="/categories" className="transition-colors hover:text-primary">Danh mục</Link></li>
          </ul>
          {settings.policies.length > 0 ? (
            <>
              <h2 className="mt-6 font-semibold tracking-tight">Chính sách</h2>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                {settings.policies.map((policy) => (
                  <li key={policy.slug}>
                    <Link href={`/policies/${encodeURIComponent(policy.slug)}`} className="transition-colors hover:text-primary">
                      {policy.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="text-sm">
          {contacts.length > 0 || settings.contact.address ? (
            <>
              <h2 className="font-semibold tracking-tight">Liên hệ</h2>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                {contacts.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <a href={item.href} className="transition-colors hover:text-primary">{item.label}: {item.value}</a>
                    ) : <span>{item.label}: {item.value}</span>}
                  </li>
                ))}
                {settings.contact.address ? <li>Địa chỉ: {settings.contact.address}</li> : null}
              </ul>
            </>
          ) : null}
          {socials.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border bg-background px-3 py-2 text-xs font-medium hover:text-primary"
                >
                  {social.label}<ArrowUpRight className="ml-1 inline size-3" aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings.shopName}
      </div>
    </footer>
  )
}
