import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { toActionError } from '@/lib/api/errors';
import {
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_TYPE_LABELS,
  isServiceRequestStatus,
  isServiceRequestType,
  type MaintenanceDetails,
  type PcBuildDetails,
  type ServiceRequestRecord,
  type UpgradeDetails,
} from '@/lib/service-requests';
import { getServiceRequestCounts, listServiceRequests } from '@/services/adapters/api/service-request.repository';

export const metadata = { title: 'طلبات الخدمة' };

const TYPE_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'maintenance', label: 'الصيانة' },
  { key: 'upgrade', label: 'الإضافات والترقيات' },
  { key: 'pc-build', label: 'تجميعات PC' },
  { key: 'sell-hardware', label: 'بيع الأجهزة' },
] as const;

function requestSummary(request: ServiceRequestRecord): string {
  try {
    const details = JSON.parse(request.details_json) as Record<string, unknown>;
    switch (request.type) {
      case 'maintenance': {
        const item = details as MaintenanceDetails;
        return `${item.device}${item.deviceModel ? ` - ${item.deviceModel}` : ''} · ${item.problem}`;
      }
      case 'upgrade': {
        const item = details as UpgradeDetails;
        return `${item.deviceType} · ${item.upgradeCategory}`;
      }
      case 'pc-build': {
        const item = details as PcBuildDetails;
        return `${item.buildName} · ${item.items?.length ?? 0} قطعة`;
      }
      default:
        return '—';
    }
  } catch {
    return '—';
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

type SearchParams = Promise<{ type?: string; status?: string; q?: string; page?: string }>;

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const type = isServiceRequestType(filters.type) ? filters.type : 'all';
  const status = isServiceRequestStatus(filters.status) ? filters.status : 'all';
  let data: Awaited<ReturnType<typeof listServiceRequests>> | null = null;
  let counts: Awaited<ReturnType<typeof getServiceRequestCounts>> | null = null;
  let errorMessage = '';
  try {
    data = await listServiceRequests({
      type,
      status,
      query: filters.q,
      page: Number(filters.page ?? 1) || 1,
      pageSize: 20,
    });
    counts = await getServiceRequestCounts();
  } catch (error) {
    errorMessage = toActionError(error);
  }

  if (!data || !counts) {
    return (
      <div className="admin-empty" role="alert">
        <h2>تعذر تحميل طلبات الخدمة</h2>
        <p>{errorMessage || 'تحقق من اتصال لوحة الإدارة بواجهة البرمجة ثم أعد المحاولة.'}</p>
      </div>
    );
  }

  return (
    <div className="admin-page-body">
      <PageHeader title="طلبات الخدمة" description="صيانة، ترقيات، تجميعات PC، وبيع الأجهزة الواردة من المتجر." emoji="📥" />
      <div className="admin-kpi-grid" aria-label="ملخص الطلبات">
        <article className="admin-kpi"><span className="admin-kpi-label">الإجمالي</span><strong dir="ltr">{counts.total}</strong></article>
        <article className="admin-kpi"><span className="admin-kpi-label">صيانة</span><strong dir="ltr">{counts.byType.maintenance ?? 0}</strong></article>
        <article className="admin-kpi"><span className="admin-kpi-label">ترقيات</span><strong dir="ltr">{counts.byType.upgrade ?? 0}</strong></article>
        <article className="admin-kpi"><span className="admin-kpi-label">تجميعات</span><strong dir="ltr">{counts.byType['pc-build'] ?? 0}</strong></article>
      </div>
      <form className="admin-filter-bar">
        <label className="admin-filter-search">
          <input name="q" defaultValue={filters.q ?? ''} placeholder="ابحث بالاسم أو الهاتف أو رقم الطلب" aria-label="البحث في الطلبات" />
        </label>
        <select name="type" defaultValue={type} aria-label="نوع الطلب">
          {TYPE_TABS.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
        </select>
        <select name="status" defaultValue={status} aria-label="حالة الطلب">
          <option value="all">كل الحالات</option>
          {Object.entries(SERVICE_REQUEST_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button type="submit" className="admin-btn">تطبيق</button>
      </form>
      {data.rows.length === 0 ? (
        <div className="admin-empty">
          <h2>لا توجد طلبات مطابقة</h2>
          <p>عندما يرسل العميل طلباً من المتجر سيظهر هنا.</p>
        </div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المرجع</th>
                  <th>النوع</th>
                  <th>العميل</th>
                  <th>الملخص</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((request) => (
                  <tr key={request.id}>
                    <td dir="ltr">
                      <Link className="admin-table-title" href={`/requests/${request.id}`}>{request.reference_code}</Link>
                    </td>
                    <td>{SERVICE_REQUEST_TYPE_LABELS[request.type]}</td>
                    <td>
                      {request.customer_name}
                      <span className="admin-cell-sub" dir="ltr">{request.phone}</span>
                    </td>
                    <td>{requestSummary(request)}</td>
                    <td><span className={`badge badge--status-${request.status}`}>{SERVICE_REQUEST_STATUS_LABELS[request.status]}</span></td>
                    <td dir="ltr">{formatDate(request.created_at)}</td>
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
