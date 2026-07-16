const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return configuredApiBaseUrl
  }

  const configuredUrl = new URL(configuredApiBaseUrl)
  const isLoopbackApiHost =
    configuredUrl.hostname === 'localhost' ||
    configuredUrl.hostname === '127.0.0.1'
  const isDifferentPageHost = window.location.hostname !== configuredUrl.hostname

  if (isLoopbackApiHost && isDifferentPageHost) {
    configuredUrl.hostname = window.location.hostname
  }

  return configuredUrl.toString().replace(/\/$/, '')
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
  })
}

export function throwApiError(response: Response, message: string): never {
  throw new ApiError(message, response.status)
}
