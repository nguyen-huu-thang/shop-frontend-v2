"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-error"
import { useAuth } from "@/lib/auth-context"
import { getProductVariants, saveProductVariants } from "@/lib/api/admin"
import type { ProductVariantMatrix } from "@/lib/types"

type VariantDraft = {
  id?: number
  values: Record<string, string>
  price: string
  stock: string
}

export function ProductVariantEditor({
  productId,
  productName,
  onClose,
  onSaved,
}: {
  productId: number
  productName: string
  onClose: () => void
  onSaved: () => void
}) {
  const { authFetch } = useAuth()
  const [matrix, setMatrix] = useState<ProductVariantMatrix | null>(null)
  const [rows, setRows] = useState<VariantDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProductVariants(authFetch, productId)
      setMatrix(data)
      setRows(data.options.map((option) => ({
        id: option.id,
        values: option.values,
        price: option.price === null ? "" : String(option.price),
        stock: String(option.stock),
      })))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được biến thể")
    } finally {
      setLoading(false)
    }
  }, [authFetch, productId])

  useEffect(() => { void load() }, [load])

  const addRow = () => {
    if (!matrix?.attributes.length) return
    const values = Object.fromEntries(
      matrix.attributes.map((attribute) => [attribute.name, attribute.values[0] ?? ""])
    )
    setRows((current) => [...current, {
      values,
      price: "",
      stock: "0",
    }])
  }

  const updateRow = (index: number, update: Partial<VariantDraft>) => {
    setRows((current) => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...update } : row
    ))
  }

  const updateValue = (index: number, name: string, value: string) => {
    setRows((current) => current.map((row, rowIndex) =>
      rowIndex === index
        ? { ...row, values: { ...row.values, [name]: value } }
        : row
    ))
  }

  const save = async () => {
    if (!matrix || matrix.attributes.length === 0) {
      toast.error("Hãy khai báo ít nhất một thuộc tính cho sản phẩm trước.")
      return
    }
    if (rows.length === 0) {
      toast.error("Cần có ít nhất một tổ hợp SKU.")
      return
    }

    const names = matrix.attributes.map((attribute) => attribute.name)
    const signatures = new Set<string>()
    const value = [] as Array<[string[], [number, number]]>
    for (const row of rows) {
      const selected = names.map((name) => row.values[name] ?? "")
      const price = Number(row.price)
      const stock = Number(row.stock)
      if (selected.some((item) => !item) || row.price === "" || !Number.isFinite(price) || price < 0) {
        toast.error("Mỗi SKU cần đủ giá trị thuộc tính và giá hợp lệ.")
        return
      }
      if (!Number.isInteger(stock) || stock < 0) {
        toast.error("Tồn kho phải là số nguyên không âm.")
        return
      }
      const signature = JSON.stringify(selected)
      if (signatures.has(signature)) {
        toast.error("Danh sách đang có tổ hợp thuộc tính trùng nhau.")
        return
      }
      signatures.add(signature)
      value.push([selected, [price, stock]])
    }

    setBusy(true)
    try {
      await saveProductVariants(authFetch, productId, { attribute: names, value })
      toast.success("Đã lưu biến thể sản phẩm")
      await load()
      onSaved()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu biến thể thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-6 space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Catalog tổng quát</p>
          <h2 className="text-lg font-semibold">Biến thể: {productName}</h2>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Đóng</Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Đang tải SKU...</p> : null}
      {!loading && matrix?.attributes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Sản phẩm chưa có thuộc tính. Đóng bảng này, mở “Sửa sản phẩm” và khai báo thuộc tính theo dạng
          <span className="font-medium"> Tên thuộc tính: giá trị 1, giá trị 2</span> trước.
        </p>
      ) : null}
      {!loading && matrix && matrix.attributes.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {matrix.attributes.map((attribute) => (
              <div key={attribute.name} className="rounded-lg bg-muted px-3 py-2 text-xs">
                <span className="font-semibold">{attribute.name}:</span> {attribute.values.join(", ") || "chưa có giá trị"}
              </div>
            ))}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Đặt tồn kho về 0 để ngừng bán một SKU. Backend giữ bản ghi để bảo toàn tham chiếu trong giỏ và đơn cũ.
          </p>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.id ?? `new-${index}`} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,2fr)_1fr_1fr]">
                <div className="grid gap-2 sm:grid-cols-2">
                  {matrix.attributes.map((attribute) => (
                    <div key={attribute.name} className="grid gap-1">
                      <Label htmlFor={`variant-${index}-${attribute.name}`}>{attribute.name}</Label>
                      <select
                        id={`variant-${index}-${attribute.name}`}
                        className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
                        value={row.values[attribute.name] ?? ""}
                        onChange={(event) => updateValue(index, attribute.name, event.target.value)}
                      >
                        <option value="">Chọn giá trị</option>
                        {attribute.values.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`variant-price-${index}`}>Giá</Label>
                  <Input id={`variant-price-${index}`} type="number" min="0" step="0.01" value={row.price} onChange={(event) => updateRow(index, { price: event.target.value })} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`variant-stock-${index}`}>Tồn kho</Label>
                  <Input id={`variant-stock-${index}`} type="number" min="0" step="1" value={row.stock} onChange={(event) => updateRow(index, { stock: event.target.value })} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={addRow}>Thêm tổ hợp</Button>
            <Button type="button" disabled={busy || loading} onClick={() => void save()}>{busy ? "Đang lưu..." : "Lưu biến thể"}</Button>
          </div>
        </>
      ) : null}
    </section>
  )
}
