/** Server-side environment configuration. Never import secrets into client components. */

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://localhost:4000';
}

export function isAdminDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ADMIN_DEV_BYPASS === 'true';
}

export function getDataAdapter(): 'sqlite' | 'api' {
  return process.env.DATA_ADAPTER === 'api' ? 'api' : 'sqlite';
}
