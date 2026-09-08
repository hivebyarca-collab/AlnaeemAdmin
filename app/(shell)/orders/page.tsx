import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { OrderListBody } from '@/components/admin/order-list-body';
import { orderService } from '@/services';

export const metadata = { title: 'الطلبات' };

const statusLabels: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: 'جديد', className: 'badge--status-SUBMITTED' },
  CONFIRMED: { label: 'مؤكد', className: 'badge--status-CONFIRMED' },
  PREPARING: { label: 'قيد التجهيز', className: 'badge--status-PREPARING' },
  READY: { label: 'جاهز', className: 'badge--status-READY' },
  COMPLETED: { label: 'تم التسليم', className: 'badge--status-COMPLETED' },
  CANCELLED: { label: 'ملغي', className: 'badge--status-CANCELLED' },
};
const paymentLabels: Record<string, { label: string; className: string }> = {
  unpaid: { label: 'لم يتم الدفع', className: 'badge--unpaid' },
  paid: { label: 'مدفوع', className: 'badge--paid' },
  refunded: { label: 'مسترد', className: 'badge--refunded' },
};
const sourceLabels: Record<string, string> = { website: 'الموقع', whatsapp: 'واتساب', manual: 'يدوي' };

type SearchParams = Promise<{ tab?: string; status?: string; payment?: string; q?: string; page?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const source = filters.tab === 'website' ? 'website' : filters.tab === 'whatsapp' ? 'whatsapp' : 'all';
  let data: Awaited<ReturnType<typeof orderService.listOrders>> | null = null;
  let counts: Awaited<ReturnType<typeof orderService.getOrderCounts>> | null = null;
  let dbError = false;
  try {
    data = orderService.listOrders({ source, status: filters.status, payment: filters.payment, query: filters.q, page: Number(filters.page ?? 1) || 1, pageSize: 10 });
    counts = orderService.getOrderCounts();
  } catch {
    dbError = true;
  }
  if (dbError || !data || !counts) {
    return <div className="admin-empty" role="alert"><h2>تعذر تحميل الطلبات</h2></div>;
  }
  const totalPages = Math.max(Math.ceil(data.total / data.pageSize), 1);
  return (
    <div className="admin-page-body">
      <PageHeader
        title="الطلبات"
        description="إدارة جميع الطلبات من الموقع الإلكتروني وواتساب"
        emoji="🛒"
        actions={<Link href="/customers" className="admin-btn admin-btn--primary">طلب يدوي جديد</Link>}
      />
      <OrderListBody data={data} counts={counts} filters={filters} source={source} totalPages={totalPages} statusLabels={statusLabels} paymentLabels={paymentLabels} sourceLabels={sourceLabels} />
    </div>
  );
}
