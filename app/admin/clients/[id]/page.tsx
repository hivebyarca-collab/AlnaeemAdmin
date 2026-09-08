import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClientDetail } from '@/lib/database';
import { ClientDetailPanel } from '@/components/admin/client-detail-panel';

export const metadata = { title: 'ملف العميل' };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getClientDetail(id);
  if (!detail) notFound();
  const { user, orders, conversation, messages: rawMessages, totalSpentUsd, addresses } = detail;
  const messages = rawMessages as { id: string; direction: string; sender_type: string; body: string; created_at: string }[];

  return (
    <div className="admin-page-body">
      <header className="admin-page-header admin-page-header--split">
        <div>
          <h1><span aria-hidden="true">👤</span> {user.full_name}</h1>
          <p>ملف العميل وسجل النشاط الكامل</p>
        </div>
        <Link href="/admin/clients" className="admin-btn">← كل العملاء</Link>
      </header>

      <div className="admin-detail-grid">
        <ClientDetailPanel
          client={{
            id: user.id, full_name: user.full_name, phone: user.phone, email: user.email,
            is_disabled: Boolean(user.is_disabled), notes: user.notes ?? '',
          }}
        />

        <section className="admin-panel" aria-label="إحصائيات الطلبات">
          <header className="admin-panel-title"><h2>سجل الطلبات</h2></header>
          <p className="admin-panel-stats" dir="ltr">
            {orders.length} طلب — ${totalSpentUsd.toLocaleString('en-US')} إجمالي — {addresses.length as number} عنوان
          </p>
          {orders.length === 0 ? (
            <p className="admin-panel-empty">لا توجد طلبات لهذا العميل بعد.</p>
          ) : (
            <ul className="admin-lowstock-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} dir="ltr">#{order.id.slice(0, 8)}</Link>
                  <span dir="ltr">${order.total.toLocaleString('en-US')} — {order.created_at.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel" aria-label="محادثة واتساب">
          <header className="admin-panel-title"><h2>محادثة واتساب</h2></header>
          {!conversation ? (
            <p className="admin-panel-empty">لا توجد محادثة واتساب مرتبطة بهذا العميل.</p>
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
