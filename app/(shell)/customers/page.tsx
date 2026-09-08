import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { customerService, settingsService } from '@/services';

export const metadata = { title: 'العملاء' };

type SearchParams = Promise<{ q?: string; phone?: string }>;

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, phone } = await searchParams;
  let customers: Awaited<ReturnType<typeof customerService.listCustomers>> = [];
  let dbError = false;
  try {
    customers = customerService.listCustomers(q);
  } catch {
    dbError = true;
  }
  if (dbError) return <div className="admin-empty" role="alert"><h2>تعذر تحميل العملاء</h2></div>;
  const settings = settingsService.getAll();
  const whatsappConfigured = Boolean(settings.whatsapp_connected_number);
  const highlighted = phone ? customers.filter((customer) => customer.phone === phone) : customers;

  return (
    <div className="admin-page-body">
      <PageHeader
        title="العملاء"
        description="إدارة قاعدة عملائك من الموقع وواتساب معاً"
        emoji="👥"
        actions={
          <form className="admin-filter-search" action="/customers">
            <span aria-hidden="true">🔍</span>
            <input name="q" defaultValue={q ?? ''} placeholder="ابحث بالاسم أو الهاتف..." aria-label="البحث في العملاء" />
          </form>
        }
      />

      {!whatsappConfigured && (
        <p className="admin-callout admin-callout--warn">
          رقم واتساب المتصل غير مضبوط — <Link href="/settings">الإعدادات ← واتساب</Link>
        </p>
      )}

      {highlighted.length === 0 ? (
        <div className="admin-empty"><h2>لا يوجد عملاء</h2></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>العميل</th><th>الهاتف</th><th>الطلبات</th><th>الإنفاق</th><th>آخر طلب</th><th>المصدر</th><th>الحالة</th><th aria-label="عرض" /></tr></thead>
              <tbody>
                {highlighted.map((customer) => (
                  <tr key={customer.id}>
                    <td><Link href={`/customers/${customer.id}`} className="admin-table-title">{customer.full_name}</Link></td>
                    <td dir="ltr">{customer.phone ?? '—'}</td>
                    <td dir="ltr">{customer.orderCount}</td>
                    <td dir="ltr">${customer.totalSpentUsd.toLocaleString('en-US')}</td>
                    <td dir="ltr">{customer.lastOrderAt?.slice(0, 10) ?? '—'}</td>
                    <td>
                      {customer.sources.length > 1 && <span className="badge badge--source-both">كلاهما</span>}
                      {customer.sources.length === 1 && <span className={`badge badge--source-${customer.sources[0]}`}>{customer.sources[0] === 'whatsapp' ? 'واتساب' : customer.sources[0] === 'manual' ? 'يدوي' : 'الموقع'}</span>}
                      {customer.sources.length === 0 && <span className="badge">—</span>}
                    </td>
                    <td><span className={`badge ${customer.is_disabled ? 'badge--hidden' : 'badge--active'}`}>{customer.is_disabled ? 'معطّل' : 'نشط'}</span></td>
                    <td><Link href={`/customers/${customer.id}`} className="admin-row-btn">عرض ←</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
