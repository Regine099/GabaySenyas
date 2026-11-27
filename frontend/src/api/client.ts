export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK_ERROR', 'Cannot reach the backend. Is it running?', 0);
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || !json || !('data' in json)) {
    const apiError = json?.error;
    if (apiError?.code) throw new ApiError(apiError.code, apiError.message, response.status);
    if (response.status === 404) {
      throw new ApiError('NOT_FOUND', 'Enable DEV_RECOGNITION=true in backend/.env for local testing.', 404);
    }
    throw new ApiError('UNKNOWN', `Request failed (${response.status})`, response.status);
  }

  return json.data as T;
}
