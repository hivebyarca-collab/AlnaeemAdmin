'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_SESSION_COOKIE,
  apiFetch,
  apiUrl,
  extractSessionToken,
  type ApiEnvelope,
} from '@/lib/api/client';
import { ApiClientError, toActionError } from '@/lib/api/errors';
import { getDataAdapter } from '@/lib/config/env';
import type { AdminSessionUser } from '@/lib/admin-auth';

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  user?: AdminSessionUser;
};

async function mirrorSessionCookie(token: string | null, maxAge = 60 * 60 * 24) {
  const store = await cookies();
  if (!token) {
    store.delete(ADMIN_SESSION_COOKIE);
    return;
  }
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

export async function loginAction(email: string, password: string): Promise<AuthActionResult> {
  if (getDataAdapter() !== 'api') {
    return { ok: false, error: 'تسجيل الدخول عبر API يتطلب DATA_ADAPTER=api' };
  }

  try {
    const response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      credentials: 'include',
      cache: 'no-store',
    });

    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      const err = json && typeof json === 'object' && 'error' in json
        ? (json as { error: { code?: string; message?: string } }).error
        : undefined;
      if (response.status === 429) {
        return { ok: false, error: 'محاولات كثيرة — حاول بعد دقيقة' };
      }
      if (response.status === 401 || err?.code === 'INVALID_CREDENTIALS') {
        return { ok: false, error: 'بيانات الدخول غير صحيحة' };
      }
      return { ok: false, error: err?.message || 'تعذر تسجيل الدخول' };
    }

    const setCookie = response.headers.get('set-cookie');
    const token = extractSessionToken(setCookie);
    if (!token) {
      return { ok: false, error: 'لم يُرجع الخادم جلسة صالحة' };
    }
    await mirrorSessionCookie(token);

    const user = (json as ApiEnvelope<AdminSessionUser> | null)?.data;
    return { ok: true, user: user ?? undefined };
  } catch {
    return { ok: false, error: 'تعذر الاتصال بالخادم — تحقق من تشغيل API على المنفذ 4000' };
  }
}

export async function logoutAction(): Promise<void> {
  if (getDataAdapter() === 'api') {
    try {
      await apiFetch('/auth/logout', { method: 'POST', emptyResponse: false });
    } catch (error) {
      if (!(error instanceof ApiClientError && error.isUnauthorized)) {
        // Still clear local mirror even if API logout fails.
        console.error('logout API error', toActionError(error));
      }
    }
  }
  await mirrorSessionCookie(null);
  redirect('/login');
}
