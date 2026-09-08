import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { apiData, ADMIN_SESSION_COOKIE } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { getDataAdapter, isAdminDevBypassEnabled } from '@/lib/config/env';

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function matchesSecret(value: string | undefined, expected: string | undefined): boolean {
  if (!value || !expected) return false;
  const actualBytes = Buffer.from(value);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

/** When using the API adapter, authenticity is verified via GET /auth/me. */
export async function getAdminSession(): Promise<AdminSessionUser | null> {
  if (isAdminDevBypassEnabled()) {
    return { id: 'dev', email: 'dev@local', name: 'Dev Admin', role: 'Owner' };
  }

  if (getDataAdapter() === 'api') {
    try {
      return await apiData<AdminSessionUser>('/auth/me');
    } catch (error) {
      if (error instanceof ApiClientError && (error.isUnauthorized || error.isForbidden)) {
        return null;
      }
      throw error;
    }
  }

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!matchesSecret(token, process.env.AL_NAEEM_ADMIN_SESSION_TOKEN)) return null;
  return { id: 'local', email: 'local@admin', name: 'Local Admin', role: 'Owner' };
}

export async function isAdminRequest(): Promise<boolean> {
  if (isAdminDevBypassEnabled()) return true;
  return Boolean(await getAdminSession());
}

export async function requireAdmin(): Promise<AdminSessionUser> {
  const session = await getAdminSession();
  if (!session) throw new Error('ADMIN_AUTH_REQUIRED');
  return session;
}
