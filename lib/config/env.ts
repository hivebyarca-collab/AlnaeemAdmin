/** Server-side environment configuration. Never import secrets into client components. */

/**
 * Production Admin talks only to AL NAEEM API.
 * Prefer API_BASE_URL (server). NEXT_PUBLIC_API_BASE_URL is an optional public alias for the same non-secret base URL.
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    '';
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is required in production. Example: https://api.example.com/api/v1',
    );
  }
  return 'http://localhost:4000/api/v1';
}

/**
 * Production always uses the HTTP API adapter.
 * SQLite is an explicit local-development fallback only — never an automatic failover.
 */
export function getDataAdapter(): 'sqlite' | 'api' {
  if (process.env.NODE_ENV === 'production') return 'api';
  if (process.env.VERCEL === '1') return 'api';
  return process.env.DATA_ADAPTER === 'api' ? 'api' : 'sqlite';
}

/** Dev cookie bypass — only when using the SQLite adapter outside production. */
export function isAdminDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL !== '1' &&
    getDataAdapter() === 'sqlite' &&
    process.env.ADMIN_DEV_BYPASS === 'true'
  );
}

export function isApiAdapter(): boolean {
  return getDataAdapter() === 'api';
}
