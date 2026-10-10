import { ApiErrorResponse } from '@forgeline/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status: number;

  constructor(status: number, errorData: ApiErrorResponse['error']) {
    super(errorData.message || 'API request failed');
    this.name = 'ApiClientError';
    this.status = status;
    this.code = errorData.code || 'UNKNOWN_ERROR';
    this.details = errorData.details;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Handle 401 with single automatic refresh attempt
  if (response.status === 401 && !isRetry && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return apiRequest<T>(path, options, true);
    }
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse['error'] = {
      code: 'HTTP_ERROR',
      message: response.statusText,
    };

    try {
      const json = await response.json();
      if (json && json.error) {
        errorData = json.error;
      }
    } catch {
      // Non-JSON error payload
    }

    throw new ApiClientError(response.status, errorData);
  }

  // Handle 204 or empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

export const apiClient = {
  get: <T = any>(path: string, options?: RequestInit) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T = any>(path: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(path: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(path: string, options?: RequestInit) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
