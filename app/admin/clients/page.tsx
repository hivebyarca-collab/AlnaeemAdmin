import Link from 'next/link';
import { getSettings, listClients } from '@/lib/database';

export const metadata = { title: 'العملاء' };

type SearchParams = Promise<{ q?: string; phone?: string }>;

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, phone } = await searchParams;
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let dbError = false;
  try {
    clients = listClients(q);
  } catch {
    dbError = true;
  }
  if (dbError) return <div className="admin-empty" role="alert"><h2>تعذر تحميل العملاء</h2><p>تأكد من تهيئة قاعدة البيانات المحلية ثم أعد المحاولة.</p></div>;
  const settings = getSettings();
  const whatsappConfigured = Boolean(settings.whatsapp_connected_number);
  const highlighted = phone ? clients.filter((client) => client.phone === phone) : clients;

  return (
    <div className="admin-page-body">
      <header className="admin-page-header admin-page-header--split">
        <div>
          <h1><span aria-hidden="true">👥</span> العملاء</h1>
          <p>إدارة قاعدة عملائك من الموقع وواتساب معاً</p>
        </div>
        <form className="admin-filter-search" action="/admin/clients">
          <span aria-hidden="true">🔍</span>
          <input name="q" defaultValue={q ?? ''} placeholder="ابحث بالاسم أو الهاتف أو البريد..." aria-label="البحث في العملاء" />
        </form>
      </header>

      {!whatsappConfigured && (
        <p className="admin-callout admin-callout--warn">
          رقم واتساب المتصل غير مضبوط بعد — يمكن ضبطه من <Link href="/admin/settings">الإعدادات ← واتساب</Link>. يتم دمج عملاء واتساب وعملاء الموقع تلقائياً عبر رقم الهاتف.
        </p>
      )}

      {highlighted.length === 0 ? (
        <div className="admin-empty"><h2>لا يوجد عملاء</h2><p>سيظهر عملاء الموقع ومحادثات واتساب هنا تلقائياً بعد أول تفاعل.</p></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>العميل</th><th>الهاتف</th><th>عدد الطلبات</th><th>إجمالي الإنفاق</th><th>آخر طلب</th><th>المصدر</th><th>الحالة</th><th aria-label="عرض" /></tr></thead>
              <tbody>
                {highlighted.map((client) => (
                  <tr key={client.id}>
                    <td><Link href={`/admin/clients/${client.id}`} className="admin-table-title">{client.full_name}</Link></td>
                    <td dir="ltr">{client.phone ?? '—'}</td>
                    <td dir="ltr">{client.orderCount}</td>
                    <td dir="ltr">${client.totalSpentUsd.toLocaleString('en-US')}</td>
                    <td dir="ltr">{client.lastOrderAt?.slice(0, 10) ?? '—'}</td>
                    <td>
                      {client.sources.length === 0 && <span className="badge">—</span>}
                      {client.sources.length > 1 && <span className="badge badge--source-both">كلاهما</span>}
                      {client.sources.length === 1 && <span className={`badge badge--source-${client.sources[0]}`}>{client.sources[0] === 'whatsapp' ? 'واتساب' : client.sources[0] === 'manual' ? 'يدوي' : 'الموقع'}</span>}
                    </td>
                    <td><span className={`badge ${client.is_disabled ? 'badge--hidden' : 'badge--active'}`}>{client.is_disabled ? 'معطّل' : 'نشط'}</span></td>
                    <td><Link href={`/admin/clients/${client.id}`} className="admin-row-btn" aria-label={`عرض ${client.full_name}`}>عرض ←</Link></td>
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
