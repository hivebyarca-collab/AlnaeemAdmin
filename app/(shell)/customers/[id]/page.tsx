import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { CustomerDetailPanel } from '@/features/customers/components/customer-detail-panel';
import { customerService } from '@/services';

export const metadata = { title: 'ملف العميل' };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await customerService.getCustomerDetail(id);
  if (!detail) notFound();
  const { user, orders, conversation, messages: rawMessages, totalSpentUsd, addresses } = detail;
  const messages = rawMessages as { id: string; direction: string; sender_type: string; body: string; created_at: string }[];

  return (
    <div className="admin-page-body">
      <PageHeader
        title={user.full_name}
        description="ملف العميل وسجل النشاط الكامل"
        emoji="👤"
        actions={<Link href="/customers" className="admin-btn">← كل العملاء</Link>}
      />

      <div className="admin-detail-grid">
        <CustomerDetailPanel
          customer={{
            id: user.id, full_name: user.full_name, phone: user.phone, email: user.email,
            is_disabled: Boolean(user.is_disabled), notes: user.notes ?? '',
          }}
        />

        <section className="admin-panel" aria-label="سجل الطلبات">
          <header className="admin-panel-title"><h2>سجل الطلبات</h2></header>
          <p className="admin-panel-stats" dir="ltr">{orders.length} طلب — ${totalSpentUsd.toLocaleString('en-US')} — {addresses.length as number} عنوان</p>
          {orders.length === 0 ? (
            <p className="admin-panel-empty">لا توجد طلبات لهذا العميل بعد.</p>
          ) : (
            <ul className="admin-lowstock-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/orders/${order.id}`} dir="ltr">#{order.id.slice(0, 8)}</Link>
                  <span dir="ltr">${order.total.toLocaleString('en-US')} — {order.created_at.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel" aria-label="محادثة واتساب">
          <header className="admin-panel-title"><h2>محادثة واتساب</h2></header>
          {!conversation ? (
            <p className="admin-panel-empty">لا توجد محادثة واتساب مرتبطة.</p>
          ) : (
            <ul className="admin-message-list" dir="auto">
              {messages.map((message) => (
                <li key={message.id} className={message.direction === 'inbound' ? 'is-inbound' : 'is-outbound'}>
                  <small>{message.sender_type} — {message.created_at.slice(0, 16).replace('T', ' ')}</small>
                  <p>{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
