import { getApiBaseUrl } from '@/lib/config/env';

export { getApiBaseUrl };
export { getApiBaseUrl as API_BASE_URL };

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, getApiBaseUrl()).toString();
}

/** Future HTTP adapter entry point for al-naeem-api. Not used in SQLite development mode. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(apiUrl(path), { ...init, headers });
  if (!response.ok) {
    throw new Error(`API_${response.status}`);
  }
  return response.json() as Promise<T>;
}
