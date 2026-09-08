import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/database';
import { OrderStatusForm } from '@/components/admin/order-status-form';

export const metadata = { title: 'تفاصيل الطلب' };

const sourceLabels: Record<string, string> = { website: 'الموقع', whatsapp: 'واتساب', manual: 'يدوي' };

type OrderDetail = {
  id: string; total: number; status: string; source: string; payment_status: string;
  contact_name: string; contact_phone: string; contact_email: string | null; notes: string | null;
  created_at: string;
  items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrderById(id) as OrderDetail | undefined;
  if (!order) notFound();

  return (
    <div className="admin-page-body">
      <header className="admin-page-header admin-page-header--split">
        <div>
          <h1><span aria-hidden="true">🧾</span> طلب <span dir="ltr">#{order.id.slice(0, 8)}</span></h1>
          <p>منشأ من: {sourceLabels[order.source] ?? order.source} — {order.created_at.slice(0, 16).replace('T', ' ')}</p>
        </div>
        <Link href="/admin/orders" className="admin-btn">← كل الطلبات</Link>
      </header>

      <div className="admin-detail-grid">
        <section className="admin-panel" aria-label="عناصر الطلب">
          <header className="admin-panel-title"><h2>عناصر الطلب</h2></header>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--narrow">
              <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة وقت الشراء</th><th>المجموع</th></tr></thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td dir="auto">{item.item_name}</td>
                    <td dir="ltr">{item.quantity}</td>
                    <td dir="ltr">${item.unit_price.toLocaleString('en-US')}</td>
                    <td dir="ltr">${(item.unit_price * item.quantity).toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}>المجموع الكلي</td><td dir="ltr"><b>${order.total.toLocaleString('en-US')}</b></td></tr></tfoot>
            </table>
          </div>
        </section>

        <section className="admin-panel" aria-label="بيانات العميل والتوصيل">
          <header className="admin-panel-title"><h2>بيانات العميل</h2></header>
          <dl className="admin-detail-list">
            <div><dt>الاسم</dt><dd>{order.contact_name}</dd></div>
            <div><dt>الهاتف</dt><dd dir="ltr">{order.contact_phone}</dd></div>
            <div><dt>البريد الإلكتروني</dt><dd dir="ltr">{order.contact_email ?? '—'}</dd></div>
            <div><dt>حالة الدفع</dt><dd dir="ltr">{order.payment_status}</dd></div>
            <div><dt>ملاحظات</dt><dd dir="auto">{order.notes ?? '—'}</dd></div>
          </dl>
        </section>

        <section className="admin-panel" aria-label="إدارة الطلب">
          <header className="admin-panel-title"><h2>إدارة الطلب</h2><small>تحديث الحالة والدفع والملاحظات</small></header>
          <OrderStatusForm orderId={order.id} initialStatus={order.status} initialPayment={order.payment_status} initialNotes={order.notes ?? ''} />
        </section>
      </div>
    </div>
  );
}
