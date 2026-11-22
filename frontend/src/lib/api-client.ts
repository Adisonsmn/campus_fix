import { API_BASE_URL } from '@/config/env'

type QueryValue = string | number | undefined | null

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

type ValidationItem = { loc?: unknown[]; msg?: string }

/** Error raised for every failed API call. `status` is 0 when the server is unreachable. */
export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

function parseValidationItems(items: ValidationItem[]): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const item of items) {
    const path = (item.loc ?? []).filter((part) => part !== 'body' && part !== 'query')
    const field = path.join('.')
    if (field && item.msg && !(field in errors)) {
      errors[field] = item.msg
    }
  }
  return errors
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail: unknown
  try {
    detail = ((await response.json()) as { detail?: unknown }).detail
  } catch {
    detail = undefined
  }

  if (response.status === 422 && Array.isArray(detail)) {
    return new ApiError(
      422,
      'Please check the highlighted fields.',
      parseValidationItems(detail as ValidationItem[]),
    )
  }
  if (typeof detail === 'string' && detail && response.status < 500) {
    return new ApiError(response.status, detail)
  }
  return new ApiError(response.status, FALLBACK_MESSAGE)
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE_URL}/api${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url
}

/** The single HTTP client for the backend. Feature code wraps it in TanStack Query hooks. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, NETWORK_MESSAGE)
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
