'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { saveCategoryAction, deleteCategoryAction } from '@/app/actions';

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="admin-panel admin-order-form"
      aria-label="إضافة تصنيف"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await saveCategoryAction({ name, slug });
          setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
          if (result.ok) {
            setName('');
            setSlug('');
            router.refresh();
          }
        });
      }}
    >
      <header className="admin-panel-title"><h2>إضافة تصنيف</h2></header>
      <label>الاسم
        <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} placeholder="مثال: هواتف" />
      </label>
      <label>المعرّف النصي (slug)
        <input value={slug} onChange={(event) => setSlug(event.target.value)} dir="ltr" placeholder="phones" />
      </label>
      {message && <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />} إنشاء تصنيف
      </button>
    </form>
  );
}

export function CategoryDeleteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <button
      type="button"
      className="admin-row-btn admin-row-btn--danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`هل تريد حذف التصنيف «${label}»؟`)) return;
        startTransition(async () => {
          const result = await deleteCategoryAction(id);
          if (!result.ok) setError(result.error ?? 'خطأ');
          else router.refresh();
        });
      }}
    >
      {pending ? '…' : 'حذف'}
      {error && <span className="admin-callout admin-callout--error" role="alert">{error}</span>}
    </button>
  );
}
