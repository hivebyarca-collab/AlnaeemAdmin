'use client';

import { useState, useTransition } from 'react';
import { Building2, Check, NotebookPen, Phone } from 'lucide-react';
import { saveRequestNotes, sendRequestToOffice, updateRequestStatus } from '@/app/(shell)/requests/actions';
import {
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_STATUS_LABELS,
  type MaintenanceDetails,
  type PcBuildDetails,
  type SellHardwareDetails,
  type ServiceRequestEvent,
  type ServiceRequestRecord,
  type UpgradeDetails,
} from '@/lib/service-requests';

function money(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function eventLabel(event: ServiceRequestEvent): string {
  if (event.event === 'received') return 'استلام الطلب';
  if (event.event === 'opened') return 'فتح الطلب من الإدارة';
  if (event.event === 'note-updated') return 'تحديث الملاحظات الداخلية';
  if (event.event.startsWith('status:')) {
    const status = event.event.slice(7) as keyof typeof SERVICE_REQUEST_STATUS_LABELS;
    return `تغيير الحالة إلى: ${SERVICE_REQUEST_STATUS_LABELS[status] ?? status}`;
  }
  return event.event;
}

function DetailRow({ label, value, ltr }: { label: string; value: string | undefined | null; ltr?: boolean }) {
  if (!value) return null;
  return (
    <div className="admin-request-row">
      <dt>{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined}>{value}</dd>
    </div>
  );
}

function TypeDetails({ request }: { request: ServiceRequestRecord }) {
  let details: Record<string, unknown>;
  try {
    details = JSON.parse(request.details_json) as Record<string, unknown>;
  } catch {
    return <p>تعذر قراءة تفاصيل الطلب.</p>;
  }
  if (request.type === 'maintenance') {
    const item = details as MaintenanceDetails;
    return (
      <dl className="admin-request-rows">
        <DetailRow label="الجهاز" value={item.device} ltr />
        <DetailRow label="الموديل" value={item.deviceModel} ltr />
        <DetailRow label="العلامة" value={item.brand} ltr />
        <DetailRow label="المشكلة" value={item.problem} />
        <DetailRow label="الوصف" value={item.description} />
        <DetailRow label="المواصفات" value={item.specifications} ltr />
      </dl>
    );
  }
  if (request.type === 'upgrade') {
    const item = details as UpgradeDetails;
    return (
      <dl className="admin-request-rows">
        <DetailRow label="نوع الجهاز" value={item.deviceType} ltr />
        <DetailRow label="المواصفات الحالية" value={item.currentSpecs} ltr />
        <DetailRow label="فئة الترقية" value={item.upgradeCategory} />
        <DetailRow label="الطلب" value={item.requestedUpgrade} />
        <DetailRow label="النتيجة المطلوبة" value={item.desiredOutcome} />
        <DetailRow label="الميزانية" value={item.budget} ltr />
        <DetailRow label="منتجات مختارة" value={item.selectedProducts?.map((product) => product.name).join('، ')} />
      </dl>
    );
  }
  if (request.type === 'pc-build') {
    const item = details as PcBuildDetails;
    return (
      <div className="admin-request-build">
        <dl className="admin-request-rows">
          <DetailRow label="اسم التجميعة" value={item.buildName} />
          <DetailRow label="الكيس" value={item.caseName} ltr />
          <DetailRow label="التوافق" value={`${item.compatibilityPercent}%`} ltr />
          <DetailRow label="التوصيل" value={item.delivery} />
        </dl>
        <table className="admin-table admin-table--narrow">
          <thead>
            <tr>
              <th>القطعة</th>
              <th>الاسم</th>
              <th>الكمية</th>
              <th>السعر</th>
            </tr>
          </thead>
          <tbody>
            {item.items?.map((part, index) => (
              <tr key={`${part.slot}-${index}`}>
                <td>{part.label || part.slot}</td>
                <td dir="ltr">{part.name}</td>
                <td dir="ltr">{part.quantity}</td>
                <td dir="ltr">{money(part.priceCents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>الإجمالي</td>
              <td dir="ltr">{money(item.totalCents ?? request.total_cents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
  const item = details as SellHardwareDetails;
  return (
    <dl className="admin-request-rows">
      <DetailRow label="الجهاز" value={item.deviceName} ltr />
      <DetailRow label="النوع" value={item.deviceType} />
      <DetailRow label="الحالة" value={item.condition} />
      <DetailRow label="مدة الاستخدام" value={item.usageDuration} />
      <DetailRow label="السعر المتوقع" value={item.expectedPrice} ltr />
    </dl>
  );
}

export function RequestDetail({ request }: { request: ServiceRequestRecord }) {
  const [notes, setNotes] = useState(request.admin_notes ?? '');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? { ok: true, message: success } : { ok: false, message: result.error ?? 'تعذر تنفيذ الإجراء' });
    });
  }

  return (
    <div className="admin-request-detail">
      <section className="admin-panel admin-request-card">
        <div className="admin-request-grid">
          <section aria-label="بيانات العميل">
            <h3>العميل</h3>
            <dl className="admin-request-rows">
              <DetailRow label="الاسم" value={request.customer_name} />
              <DetailRow label="الهاتف" value={request.phone} ltr />
              <DetailRow label="البريد" value={request.email} ltr />
              <DetailRow label="طريقة التواصل" value={request.preferred_contact === 'whatsapp' ? 'واتساب' : request.preferred_contact === 'phone' ? 'اتصال' : request.preferred_contact} />
              <DetailRow label="الموقع / الاستلام" value={request.location} />
              <DetailRow label="ملاحظات العميل" value={request.customer_notes} />
            </dl>
            {request.total_cents != null ? (
              <p className="admin-request-total">الإجمالي التقديري: <b dir="ltr">{money(request.total_cents)}</b></p>
            ) : null}
          </section>
          <section aria-label="تفاصيل الطلب">
            <h3><Phone size={16} /> تفاصيل الطلب</h3>
            <TypeDetails request={request} />
          </section>
        </div>
      </section>

      <section className="admin-panel admin-request-card" aria-label="إجراءات الطلب">
        <div className="admin-request-actions">
          <label>
            الحالة
            <select
              value={request.status}
              disabled={pending}
              onChange={(event) => run(() => updateRequestStatus(request.id, event.target.value), 'تم تحديث الحالة')}
            >
              {SERVICE_REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>{SERVICE_REQUEST_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={pending || request.status === 'sent-to-office'}
            onClick={() => run(() => sendRequestToOffice(request.id), 'أُرسل الطلب إلى المكتب')}
          >
            <Building2 size={16} /> {request.status === 'sent-to-office' ? 'أُرسل إلى المكتب' : 'إرسال إلى المكتب'}
          </button>
        </div>
        <div className="admin-request-notes">
          <label htmlFor="admin-notes"><NotebookPen size={15} /> ملاحظات داخلية (لا تظهر للعميل)</label>
          <textarea
            id="admin-notes"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={pending}
            placeholder="مثال: الاتصال بالعميل قبل طلب القطعة..."
          />
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={pending || notes === (request.admin_notes ?? '')}
            onClick={() => run(() => saveRequestNotes(request.id, notes), 'تم حفظ الملاحظات')}
          >
            <Check size={16} /> حفظ الملاحظات
          </button>
        </div>
        {feedback ? (
          <p role={feedback.ok ? 'status' : 'alert'} className={`admin-request-feedback ${feedback.ok ? 'is-ok' : 'is-error'}`}>
            {feedback.message}
          </p>
        ) : null}
      </section>

      <section className="admin-panel admin-request-card" aria-label="سجل الطلب">
        <h3>سجل الطلب</h3>
        <ol className="admin-request-timeline">
          {request.events?.map((event) => (
            <li key={event.id}>
              <b>{eventLabel(event)}</b>
              {event.detail ? <span>{event.detail}</span> : null}
              <small dir="ltr">{formatDate(event.created_at)} · {event.actor}</small>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
