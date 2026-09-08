'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { updateOrderDetails } from '@/app/admin/actions';

const statuses = [
  { value: 'SUBMITTED', label: 'جديد' }, { value: 'CONFIRMED', label: 'مؤكد' }, { value: 'PREPARING', label: 'قيد التجهيز' },
  { value: 'READY', label: 'جاهز' }, { value: 'COMPLETED', label: 'تم التسليم' }, { value: 'CANCELLED', label: 'ملغي' },
];

export function OrderStatusForm({ orderId, initialStatus, initialPayment, initialNotes }: {
  orderId: string; initialStatus: string; initialPayment: string; initialNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [payment, setPayment] = useState(initialPayment);
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="admin-order-form"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateOrderDetails(orderId, { status, payment_status: payment, notes });
          setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
          if (result.ok) router.refresh();
        });
      }}
    >
      <label>حالة الطلب
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>حالة الدفع
        <select value={payment} onChange={(event) => setPayment(event.target.value)}>
          <option value="unpaid">لم يتم الدفع</option>
          <option value="paid">مدفوع</option>
          <option value="refunded">مسترد</option>
        </select>
      </label>
      <label>ملاحظات الإدارة
        <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      {message && <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} حفظ التغييرات
      </button>
    </form>
  );
}
