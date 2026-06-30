// Sổ địa chỉ giao hàng (cần đăng nhập). CRUD + đặt mặc định.
// Address book (login required): CRUD + set default. Backend: /api/addresses.
import type { AuthFetch } from "@/lib/auth-context"
import type { Address, AddressPayload, MessageResponse } from "@/lib/types"

export const getAddresses = (authFetch: AuthFetch) =>
  authFetch<Address[]>("/api/addresses")

export const createAddress = (authFetch: AuthFetch, payload: AddressPayload) =>
  authFetch<Address>("/api/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const updateAddress = (
  authFetch: AuthFetch,
  id: number,
  payload: Partial<AddressPayload>
) =>
  authFetch<Address>(`/api/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

// Đặt một địa chỉ làm mặc định (bỏ mặc định các địa chỉ khác).
// Set an address as default.
export const setDefaultAddress = (authFetch: AuthFetch, id: number) =>
  authFetch<Address>(`/api/addresses/${id}/default`, { method: "PUT" })

export const deleteAddress = (authFetch: AuthFetch, id: number) =>
  authFetch<MessageResponse>(`/api/addresses/${id}`, { method: "DELETE" })
