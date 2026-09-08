'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ShieldBan, ShieldCheck, Trash2 } from 'lucide-react';
import { anonymizeCustomerAdmin, updateCustomerAdmin } from '@/app/actions';

export function CustomerDetailPanel({ customer }: {
  customer: { id: string; full_name: string; phone: string | null; email: string | null; is_disabled: boolean; notes: string };
}) {
  const router = useRouter();
  const [values, setValues] = useState({ full_name: customer.full_name, phone: customer.phone ?? '', email: customer.email ?? '', notes: customer.notes });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string; message?: string }>, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
      if (result.ok) router.refresh();
    });
  };

  return (
    <section className="admin-panel" aria-label="بيانات العميل">
      <header className="admin-panel-title"><h2>الملف الشخصي</h2><small>تعديل البيانات وإدارة الحساب</small></header>
      <form
        className="admin-order-form"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => updateCustomerAdmin(customer.id, { full_name: values.full_name, phone: values.phone || null, email: values.email || null, notes: values.notes || null }));
        }}
      >
        <label>الاسم<input required value={values.full_name} onChange={(event) => setValues({ ...values, full_name: event.target.value })} /></label>
        <label>الهاتف<input dir="ltr" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></label>
        <label>البريد الإلكتروني<input dir="ltr" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label>
        <label>ملاحظات الإدارة<textarea rows={3} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label>
        {message && <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p>}
        <div className="admin-action-row">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>{pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} حفظ</button>
          <button type="button" className="admin-btn" disabled={pending} onClick={() => run(() => updateCustomerAdmin(customer.id, { is_disabled: !customer.is_disabled }), customer.is_disabled ? 'تفعيل هذا العميل؟' : 'تعطيل هذا العميل؟')}>
            {customer.is_disabled ? <><ShieldCheck aria-hidden="true" /> تفعيل</> : <><ShieldBan aria-hidden="true" /> تعطيل</>}
          </button>
          <button type="button" className="admin-btn admin-row-btn--danger" disabled={pending} onClick={() => run(() => anonymizeCustomerAdmin(customer.id), 'إخفاء هوية هذا العميل؟ سيتم حذف بياناته الشخصية مع الاحتفاظ بسجل الطلبات.')}>
            <Trash2 aria-hidden="true" /> إخفاء الهوية
          </button>
        </div>
      </form>
    </section>
  );
}
