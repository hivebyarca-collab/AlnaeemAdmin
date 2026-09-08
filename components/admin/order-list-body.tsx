import Link from 'next/link';
import type { OrderListResult, OrderCounts } from '@/services/repositories/order.repository';

type StatusLabels = Record<string, { label: string; className: string }>;

/** Tabs, status chips, filter bar and table for the unified orders page. */
export function OrderListBody({
  data, counts, filters, source, totalPages, statusLabels, paymentLabels, sourceLabels,
}: {
  data: OrderListResult;
  counts: OrderCounts;
  filters: Record<string, string | undefined>;
  source: string;
  totalPages: number;
  statusLabels: StatusLabels;
  paymentLabels: StatusLabels;
  sourceLabels: Record<string, string>;
}) {
  const query = (extra: Record<string, string>) => {
    const parameters = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...extra })) {
      if (value) parameters.set(key, value);
    }
    return `/orders?${parameters.toString()}`;
  };
  return (
    <>
      <div className="admin-tabs" role="tablist" aria-label="مصدر الطلبات">
        <Link href={query({ tab: 'all', page: '1' })} role="tab" aria-selected={source === 'all'} className={`admin-tab ${source === 'all' ? 'is-active' : ''}`}>جميع الطلبات <span className="admin-tab-count" dir="ltr">{counts.all}</span></Link>
        <Link href={query({ tab: 'website', page: '1' })} role="tab" aria-selected={source === 'website'} className={`admin-tab ${source === 'website' ? 'is-active' : ''}`}>طلبات الموقع <span className="admin-tab-count" dir="ltr">{counts.website}</span></Link>
        <Link href={query({ tab: 'whatsapp', page: '1' })} role="tab" aria-selected={source === 'whatsapp'} className={`admin-tab ${source === 'whatsapp' ? 'is-active' : ''}`}>طلبات واتساب <span className="admin-tab-count" dir="ltr">{counts.whatsapp}</span></Link>
      </div>

      <div className="admin-status-chips" aria-label="تصفية حسب الحالة">
        <Link href={query({ status: 'all', page: '1' })} className={!filters.status || filters.status === 'all' ? 'is-active' : ''}>الكل</Link>
        {Object.entries(statusLabels).map(([key, value]) => (
          <Link key={key} href={query({ status: key, page: '1' })} className={filters.status === key ? 'is-active' : ''}>
            {value.label} <span className="admin-tab-count" dir="ltr">{counts.byStatus[key] ?? 0}</span>
          </Link>
        ))}
      </div>

      <form className="admin-filter-bar">
        <label className="admin-filter-search">
          <span aria-hidden="true">🔍</span>
          <input name="q" defaultValue={filters.q ?? ''} placeholder="ابحث عن طلب، عميل، رقم هاتف..." aria-label="البحث في الطلبات" />
        </label>
        <select name="payment" defaultValue={filters.payment ?? 'all'} aria-label="حالة الدفع">
          <option value="all">كل حالات الدفع</option>
          <option value="unpaid">لم يتم الدفع</option>
          <option value="paid">مدفوع</option>
          <option value="refunded">مسترد</option>
        </select>
        <input type="hidden" name="tab" value={filters.tab ?? 'all'} />
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <button type="submit" className="admin-btn">تصفية</button>
      </form>

      {data.rows.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد طلبات مطابقة</h2><p>ستظهر طلبات الموقع وواتساب والطلبات اليدوية هنا جميعها.</p></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>رقم الطلب</th><th>المصدر</th><th>العميل</th><th>المنتجات</th><th>المجموع</th><th>الدفع</th><th>الحالة</th><th>التاريخ</th><th aria-label="عرض" /></tr>
              </thead>
              <tbody>
                {data.rows.map((order) => (
                  <tr key={order.id}>
                    <td dir="ltr"><Link href={`/orders/${order.id}`}>#{order.id.slice(0, 8)}</Link></td>
                    <td><span className={`badge badge--source-${order.source}`}>{sourceLabels[order.source] ?? order.source}</span></td>
                    <td>{order.contact_name}<small dir="ltr" className="admin-cell-sub">{order.contact_phone}</small></td>
                    <td>
                      <span dir="auto">{(order.items ?? []).slice(0, 2).map((item) => item.item_name).join('، ') || '—'}</span>
                      {(order.items?.length ?? 0) > 2 && <small className="admin-cell-sub" dir="ltr">+{(order.items?.length ?? 0) - 2}</small>}
                    </td>
                    <td dir="ltr">${order.total.toLocaleString('en-US')}</td>
                    <td><span className={`badge ${paymentLabels[order.payment_status]?.className}`}>{paymentLabels[order.payment_status]?.label ?? order.payment_status}</span></td>
                    <td><span className={`badge ${statusLabels[order.status]?.className}`}>{statusLabels[order.status]?.label ?? order.status}</span></td>
                    <td dir="ltr">{order.created_at.slice(0, 16).replace('T', ' ')}</td>
                    <td><Link href={`/orders/${order.id}`} className="admin-row-btn" aria-label={`عرض الطلب ${order.id}`}>عرض ←</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="admin-pagination">
            <span dir="rtl">من {data.total} طلب — صفحة {data.page}</span>
            <nav aria-label="صفحات الطلبات">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1).map((pageNumber) => (
                <Link key={pageNumber} href={query({ page: String(pageNumber) })} className={pageNumber === data.page ? 'is-current' : ''}>{pageNumber}</Link>
              ))}
            </nav>
          </footer>
        </div>
      )}
    </>
  );
}
