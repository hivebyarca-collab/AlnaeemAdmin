import Link from 'next/link';
import {
  Boxes, ClipboardList, DollarSign, MessageCircle, PackageSearch, Plus, Settings, ShoppingBag, UsersRound,
} from 'lucide-react';
import { dashboardService } from '@/services';

const statusLabels: Record<string, string> = {
  SUBMITTED: 'جديد', CONFIRMED: 'مؤكد', PREPARING: 'قيد التجهيز', READY: 'جاهز', COMPLETED: 'تم التسليم', CANCELLED: 'ملغي',
};
const sourceLabels: Record<string, string> = { website: 'الموقع', whatsapp: 'واتساب', manual: 'يدوي' };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const days = range === '7' ? 7 : 30;
  let stats: Awaited<ReturnType<typeof dashboardService.getStats>> | null = null;
  let conversations: Awaited<ReturnType<typeof dashboardService.listConversations>> = [];
  let dbError = false;
  try {
    stats = dashboardService.getStats(days);
    conversations = dashboardService.listConversations(true);
  } catch {
    dbError = true;
  }

  if (dbError || !stats) {
    return (
      <div className="admin-empty" role="alert">
        <h2>تعذر تحميل لوحة البيانات</h2>
        <p>لم نتمكن من قراءة قاعدة البيانات المحلية. جرّب تشغيل <code dir="ltr">npm run db:init</code> ثم <code dir="ltr">npm run db:seed</code> وأعد تحميل الصفحة.</p>
      </div>
    );
  }

  const maxSales = Math.max(...stats.salesByDay.map((day) => day.totalUsd), 1);
  const kpis = [
    { label: 'إجمالي المبيعات', value: `$${stats.totalSalesUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: DollarSign, href: '/orders', tone: 'accent' },
    { label: 'الطلبات الجديدة', value: String(stats.newOrders), icon: ShoppingBag, href: '/orders?status=SUBMITTED', tone: 'green' },
    { label: 'العملاء', value: String(stats.totalCustomers), icon: UsersRound, href: '/customers', tone: 'blue' },
    { label: 'منتجات منخفضة المخزون', value: String(stats.lowStockCount), icon: Boxes, href: '/products?stock=low', tone: 'accent' },
  ];

  return (
    <div className="admin-home">
      <section className="admin-hero">
        <span className="admin-hero-eyebrow" dir="ltr">AL NAEEM ADMIN</span>
        <h1>مرحباً بك مجدداً 👋</h1>
        <p>إليك نظرة سريعة على أداء متجرك — بيانات التطوير من SQLite المحلي.</p>
      </section>

      <div className="admin-kpi-grid">
        {kpis.map(({ label, value, icon: Icon, href, tone }) => (
          <Link key={label} href={href} className={`admin-kpi admin-kpi--${tone}`}>
            <span className="admin-kpi-icon"><Icon aria-hidden="true" /></span>
            <span className="admin-kpi-label">{label}</span>
            <strong dir="ltr">{value}</strong>
          </Link>
        ))}
      </div>

      <div className="admin-home-grid">
        <section className="admin-panel" aria-label="نشاط المبيعات">
          <header className="admin-panel-title">
            <h2>نشاط المبيعات</h2>
            <div className="admin-range-switch" aria-label="اختر المدة">
              <Link href="/?range=7" className={days === 7 ? 'is-active' : ''}>آخر 7 أيام</Link>
              <Link href="/?range=30" className={days === 30 ? 'is-active' : ''}>آخر 30 يوم</Link>
            </div>
          </header>
          {stats.salesByDay.length === 0 ? (
            <p className="admin-panel-empty">لا توجد مبيعات مسجلة في هذه المدة بعد.</p>
          ) : (
            <div className="admin-chart">
              <div className="chart-grid-lines" aria-hidden="true" />
              <div className="chart-bars" aria-hidden="true">
                {stats.salesByDay.slice(-30).map((day) => (
                  <i key={day.date} style={{ height: `${Math.max((day.totalUsd / maxSales) * 100, 4)}%` }} title={`${day.date}: $${day.totalUsd}`} />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="admin-panel" aria-label="أحدث الطلبات">
          <header className="admin-panel-title">
            <h2>أحدث الطلبات</h2>
            <Link href="/orders">عرض الكل ←</Link>
          </header>
          {stats.recentOrders.length === 0 ? (
            <p className="admin-panel-empty">لا توجد طلبات بعد.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th># الطلب</th><th>العميل</th><th>المصدر</th><th>الحالة</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td dir="ltr"><Link href={`/orders/${order.id}`}>#{order.id.slice(0, 8)}</Link></td>
                      <td>{order.contact_name}</td>
                      <td><span className={`badge badge--source-${order.source}`}>{sourceLabels[order.source] ?? order.source}</span></td>
                      <td><span className={`badge badge--status-${order.status}`}>{statusLabels[order.status]}</span></td>
                      <td dir="ltr">${order.total.toLocaleString('en-US')}</td>
                      <td dir="ltr">{order.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel" aria-label="محادثات واتساب تحتاج متابعة">
          <header className="admin-panel-title">
            <h2><MessageCircle aria-hidden="true" /> محادثات واتساب تحتاج متابعة</h2>
          </header>
          {conversations.length === 0 ? (
            <p className="admin-panel-empty">لا توجد محادثات تحت متابعة حالياً.</p>
          ) : (
            <ul className="admin-convo-list">
              {conversations.slice(0, 6).map((conversation) => (
                <li key={conversation.id}>
                  <div>
                    <strong>{conversation.display_name ?? conversation.phone}</strong>
                    <small dir="auto">{conversation.last_body ?? '—'}</small>
                  </div>
                  <Link href={`/customers?phone=${encodeURIComponent(conversation.phone)}`} className="badge badge--whatsapp">فتح</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel" aria-label="منتجات منخفضة المخزون">
          <header className="admin-panel-title">
            <h2><PackageSearch aria-hidden="true" /> منتجات منخفضة المخزون</h2>
            <Link href="/inventory">عرض الكل ←</Link>
          </header>
          {stats.lowStockProducts.length === 0 ? (
            <p className="admin-panel-empty">كل المنتجات النشطة لديها مخزون كافٍ.</p>
          ) : (
            <ul className="admin-lowstock-list">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.id}`}>{product.name}</Link>
                  <span className={product.stock_quantity - product.reserved_quantity <= 0 ? 'stock-pill stock-pill--out' : 'stock-pill stock-pill--low'} dir="ltr">
                    {product.stock_quantity - product.reserved_quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel admin-quick" aria-label="إجراءات سريعة">
        <header className="admin-panel-title"><h2>إجراءات سريعة</h2></header>
        <div className="admin-quick-grid">
          <Link href="/products/new" className="admin-quick-card admin-quick-card--primary"><Plus aria-hidden="true" /><strong>إضافة منتج</strong></Link>
          <Link href="/products" className="admin-quick-card"><Boxes aria-hidden="true" /><strong>قائمة المنتجات</strong></Link>
          <Link href="/orders" className="admin-quick-card"><ShoppingBag aria-hidden="true" /><strong>إدارة الطلبات</strong></Link>
          <Link href="/customers" className="admin-quick-card"><ClipboardList aria-hidden="true" /><strong>العملاء</strong></Link>
          <Link href="/settings" className="admin-quick-card"><Settings aria-hidden="true" /><strong>الإعدادات</strong></Link>
        </div>
      </section>
    </div>
  );
}
