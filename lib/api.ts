export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, API_BASE_URL).toString();
}
