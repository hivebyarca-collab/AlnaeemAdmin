import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'al-naeem-admin-session';

function matchesSecret(value: string | undefined, expected: string | undefined): boolean {
  if (!value || !expected) return false;
  const actualBytes = Buffer.from(value);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

/** Deny privileged access unless a future auth layer provides this server-only session token. */
export async function isAdminRequest(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return matchesSecret(token, process.env.AL_NAEEM_ADMIN_SESSION_TOKEN);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) throw new Error('ADMIN_AUTH_REQUIRED');
}
