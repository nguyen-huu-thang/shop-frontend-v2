"use client"

// Form tạo/sửa địa chỉ giao hàng, dùng chung cho trang Tài khoản và Thanh toán.
// Shared address create/edit form (used by account page and checkout).
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Address, AddressPayload } from "@/lib/types"

interface AddressFormProps {
  initial?: Address | null
  busy?: boolean
  submitLabel?: string
  onSubmit: (payload: AddressPayload) => void
  onCancel?: () => void
}

export function AddressForm({
  initial,
  busy,
  submitLabel = "Lưu địa chỉ",
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [form, setForm] = useState({
    recipientName: initial?.recipientName ?? "",
    recipientPhone: initial?.recipientPhone ?? "",
    province: initial?.province ?? "",
    district: initial?.district ?? "",
    ward: initial?.ward ?? "",
    detail: initial?.detail ?? "",
    isDefault: initial?.isDefault ?? false,
  })

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      recipientName: form.recipientName.trim(),
      recipientPhone: form.recipientPhone.trim(),
      province: form.province.trim(),
      district: form.district.trim(),
      ward: form.ward.trim(),
      detail: form.detail.trim(),
      isDefault: form.isDefault,
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="af-name">Người nhận</Label>
        <Input id="af-name" value={form.recipientName} onChange={set("recipientName")} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="af-phone">Số điện thoại</Label>
        <Input id="af-phone" value={form.recipientPhone} onChange={set("recipientPhone")} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="af-province">Tỉnh/Thành</Label>
        <Input id="af-province" value={form.province} onChange={set("province")} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="af-district">Quận/Huyện</Label>
        <Input id="af-district" value={form.district} onChange={set("district")} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="af-ward">Phường/Xã</Label>
        <Input id="af-ward" value={form.ward} onChange={set("ward")} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="af-detail">Địa chỉ chi tiết</Label>
        <Input id="af-detail" value={form.detail} onChange={set("detail")} placeholder="Số nhà, đường..." required />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
        />
        Đặt làm địa chỉ mặc định
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy} className="w-fit">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} className="w-fit">
            Hủy
          </Button>
        ) : null}
      </div>
    </form>
  )
}
