'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Eye, EyeOff, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { removeProduct, setProductActive } from '@/app/actions';

/** Row actions for the product list. Destructive actions always confirm first. */
export function ProductRowActions({ id, sku, isActive, hasImage }: { id: string; sku: string; isActive: boolean; hasImage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? 'حدث خطأ');
      else router.refresh();
    });
  }

  async function duplicate() {
    const response = await fetch(`/api/products/${id}/duplicate`, { method: 'POST' });
    if (response.ok) {
      const data = (await response.json()) as { id?: string };
      router.push(data.id ? `/products/${data.id}` : '/products');
    } else {
      setError('تعذر نسخ المنتج');
    }
  }

  return (
    <div className="admin-row-actions">
      <a className="admin-row-btn" href={`/products/${id}`} aria-label={`تعديل ${sku}`}>تعديل</a>
      <button type="button" className="admin-row-btn" onClick={() => void duplicate()} disabled={pending} aria-label={`نسخ ${sku}`}><Copy aria-hidden="true" /> نسخ</button>
      <button
        type="button" className="admin-row-btn" disabled={pending}
        onClick={() => run(() => setProductActive(id, !isActive), isActive ? undefined : undefined)}
        aria-label={isActive ? `إخفاء ${sku}` : `إظهار ${sku}`}
      >
        {isActive ? <><EyeOff aria-hidden="true" /> إخفاء</> : <><Eye aria-hidden="true" /> إظهار</>}
      </button>
      {!hasImage && (
        <a className="admin-row-btn" href={`/products/${id}`} aria-label={`جلب صورة جديدة لـ ${sku}`}><RefreshCcw aria-hidden="true" /> صورة جديدة</a>
      )}
      <button
        type="button" className="admin-row-btn admin-row-btn--danger" disabled={pending}
        onClick={() => run(() => removeProduct(id), `هل تريد حذف المنتج ${sku} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)}
        aria-label={`حذف ${sku}`}
      >
        {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />} حذف
      </button>
      {error && <span className="admin-callout admin-callout--error" role="alert">{error}</span>}
    </div>
  );
}
