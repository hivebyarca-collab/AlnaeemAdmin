import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { settingsService } from '@/services';

export const metadata = { title: 'المستخدمون' };

export default function UsersPage() {
  const users = settingsService.getAdminUsers();
  return (
    <div className="admin-page-body">
      <PageHeader title="المستخدمون والصلاحيات" description="عرض حسابات الإدارة — إدارة CRUD/RBAC تتطلب al-naeem-api" emoji="🔐" />
      <div className="admin-panel admin-table-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}><td>{user.full_name}</td><td dir="ltr">{user.email ?? '—'}</td><td dir="ltr">{user.role}</td><td dir="ltr">{user.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Link href="/settings" className="admin-btn">← الإعدادات</Link>
    </div>
  );
}
