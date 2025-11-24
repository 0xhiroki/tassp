const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api'

export class ApiError<T = unknown> extends Error {
  status: number
  payload: T | null

  constructor(message: string, status: number, payload: T | null) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const parseBody = () => (isJson ? response.json() : response.text())

  if (!response.ok) {
    const payload = (await parseBody()) as unknown
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error: string }).error)
        : typeof payload === 'string'
          ? payload
          : `Request failed: ${response.status}`
    throw new ApiError(message, response.status, (isJson ? (payload as T) : null))
  }

  return (await parseBody()) as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
}
