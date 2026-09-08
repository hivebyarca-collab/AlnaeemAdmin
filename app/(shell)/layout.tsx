import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { AdminShell } from '@/components/layout/admin-shell';
import { getAdminSession } from '@/lib/admin-auth';
import { ApiClientError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'لوحة التحكم' };

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  try {
    const session = await getAdminSession();
    if (!session) redirect('/login');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiClientError && (error.isUnauthorized || error.isForbidden)) {
      redirect('/login');
    }
    // Network / API unavailable: keep shell mounted; pages render error + retry.
  }

  const dateLabel = new Intl.DateTimeFormat('ar-SY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
  return <AdminShell dateLabel={dateLabel}>{children}</AdminShell>;
}
