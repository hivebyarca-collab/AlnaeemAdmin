import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/lib/config/env';
import { ApiClientError, type ApiErrorBody } from '@/lib/api/errors';

export { getApiBaseUrl };
export { getApiBaseUrl as API_BASE_URL };

export const ADMIN_SESSION_COOKIE = 'al-naeem-admin-session';

const DEFAULT_TIMEOUT_MS = 15_000;

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export type ApiFetchOptions = RequestInit & {
  /** Skip forwarding the admin session cookie (login). */
  skipAuth?: boolean;
  timeoutMs?: number;
  /** When true, treat 204 as success and return undefined. */
  emptyResponse?: boolean;
};

async function sessionCookieHeader(): Promise<string | undefined> {
  try {
    const store = await cookies();
    const token = store.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return undefined;
    return `${ADMIN_SESSION_COOKIE}=${token}`;
  } catch {
    return undefined;
  }
}

function parseErrorBody(raw: unknown, status: number): ApiErrorBody {
  if (raw && typeof raw === 'object' && 'error' in raw) {
    const err = (raw as { error: ApiErrorBody }).error;
    if (err && typeof err === 'object') {
      return {
        code: typeof err.code === 'string' ? err.code : `HTTP_${status}`,
        message: typeof err.message === 'string' ? err.message : `API error ${status}`,
        details: err.details,
      };
    }
  }
  return { code: `HTTP_${status}`, message: `API error ${status}` };
}

/**
 * Server-side HTTP client for al-naeem-api.
 * Forwards the Admin session cookie so SSR/Server Actions can authenticate.
 * Never falls back to SQLite on failure.
 */
export async function apiFetch<T = unknown>(path: string, init: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, timeoutMs = DEFAULT_TIMEOUT_MS, emptyResponse, signal, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const cookieHeader = await sessionCookieHeader();
    if (cookieHeader) headers.set('Cookie', cookieHeader);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...rest,
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', onAbort);
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Request timed out'
      : 'Network request failed';
    throw new ApiClientError(0, { code: 'NETWORK_ERROR', message });
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', onAbort);
  }

  if (response.status === 204 || (emptyResponse && response.ok && response.status !== 200 && response.status !== 201)) {
    if (!response.ok) {
      throw new ApiClientError(response.status, parseErrorBody(null, response.status));
    }
    return undefined as T;
  }

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    throw new ApiClientError(response.status, parseErrorBody(json, response.status));
  }

  return json as T;
}

export type ApiEnvelope<T> = { data: T };
export type ApiCollection<T> = { data: T[]; meta?: { page: number; pageSize: number; total: number; totalPages: number } };

export async function apiData<T>(path: string, init?: ApiFetchOptions): Promise<T> {
  const body = await apiFetch<ApiEnvelope<T>>(path, init);
  return body.data;
}

/** Extract Set-Cookie token value for mirroring onto the Admin domain. */
export function extractSessionToken(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
