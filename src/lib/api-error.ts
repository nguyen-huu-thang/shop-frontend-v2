import type { ApiErrorBody } from "./types"

// Lỗi từ API backend, mang theo status + errorKey để UI xử lý.
// Error from the backend API, carrying status + errorKey for the UI.
export class ApiError extends Error {
  status: number
  errorKey?: string
  code?: number
  details?: unknown

  constructor(status: number, body?: Partial<ApiErrorBody> | null) {
    super(body?.message || `Lỗi máy chủ (${status})`)
    this.name = "ApiError"
    this.status = status
    this.errorKey = body?.errorKey
    this.code = body?.code
    this.details = body?.details
  }
}

// Đọc body lỗi (JSON nếu có) từ một Response và ném ApiError.
// Read the (JSON) error body from a Response and throw an ApiError.
export async function throwApiError(res: Response): Promise<never> {
  let body: Partial<ApiErrorBody> | null = null
  try {
    body = (await res.json()) as ApiErrorBody
  } catch {
    body = null
  }
  throw new ApiError(res.status, body)
}
