export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const parseResponseBody = async (response: Response) => {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody = body && typeof body === 'object' ? body as Record<string, unknown> : null;
    const message = String(errorBody?.error || errorBody?.message || `Request failed with status ${response.status}`);
    throw new ApiError(response.status, message);
  }

  return body as T;
}
