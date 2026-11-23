// Base fetch wrapper: /api/v1, auth header, { data } / { error } envelope.

export class ApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError('NETWORK_ERROR', 'Cannot reach the backend. Is it running?', 0)
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json || !('data' in json)) {
    const err = json?.error
    if (err?.code) throw new ApiError(err.code, err.message, res.status)
    if (res.status === 502 || res.status === 504)
      throw new ApiError('NETWORK_ERROR', 'Cannot reach the backend. Start it with: uvicorn main:app --port 8000', res.status)
    if (res.status === 404) throw new ApiError('NOT_FOUND', 'Endpoint not found. Set DEV_RECOGNITION=true in backend/.env.', 404)
    throw new ApiError('UNKNOWN', `Request failed (${res.status})`, res.status)
  }
  return json.data as T
}
