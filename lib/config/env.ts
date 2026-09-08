/** Server-side environment configuration. Never import secrets into client components. */

export function getApiBaseUrl(): string {
  const configured =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    '';
  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:4000/api/v1';
}

/**
 * Production always uses the HTTP API adapter.
 * SQLite is an explicit local-development fallback only — never an automatic failover.
 */
export function getDataAdapter(): 'sqlite' | 'api' {
  if (process.env.NODE_ENV === 'production') return 'api';
  return process.env.DATA_ADAPTER === 'api' ? 'api' : 'sqlite';
}

/** Dev cookie bypass — only when using the SQLite adapter outside production. */
export function isAdminDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    getDataAdapter() === 'sqlite' &&
    process.env.ADMIN_DEV_BYPASS === 'true'
  );
}

export function isApiAdapter(): boolean {
  return getDataAdapter() === 'api';
}
