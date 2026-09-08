import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getAdminSession } from '@/lib/admin-auth';
import { getDataAdapter, isAdminDevBypassEnabled } from '@/lib/config/env';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'تسجيل الدخول' };

export default async function LoginPage() {
  if (getDataAdapter() === 'sqlite' && isAdminDevBypassEnabled()) {
    redirect('/');
  }

  try {
    const session = await getAdminSession();
    if (session) redirect('/');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // API down — still show login form.
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <span className="admin-hero-eyebrow" dir="ltr">AL NAEEM ADMIN</span>
        <h1>تسجيل الدخول</h1>
        <p>ادخل باستخدام حساب الإدارة المرتبط بـ AL NAEEM API.</p>
        <LoginForm />
      </div>
    </div>
  );
}
