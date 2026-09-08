import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { isAdminRequest } from '@/lib/admin-auth';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'لوحة التحكم' };

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) notFound();
  const dateLabel = new Intl.DateTimeFormat('ar-SY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
  return <AdminShell dateLabel={dateLabel}>{children}</AdminShell>;
}
