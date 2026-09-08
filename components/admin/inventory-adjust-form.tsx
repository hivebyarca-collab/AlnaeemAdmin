'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { adjustInventoryAction } from '@/app/actions';

type ProductOption = { id: string; name: string };

export function InventoryAdjustForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [type, setType] = useState<'RESTOCK' | 'ADJUSTMENT'>('RESTOCK');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (products.length === 0) return null;

  return (
    <form
      className="admin-panel admin-order-form"
      aria-label="تسوية المخزون"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await adjustInventoryAction({
            productId,
            type,
            quantity: Number(quantity),
            reason: reason.trim() || undefined,
          });
          setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
          if (result.ok) {
            setQuantity('');
            setReason('');
            router.refresh();
          }
        });
      }}
    >
      <header className="admin-panel-title"><h2>تسوية المخزون</h2></header>
      <label>المنتج
        <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      </label>
      <label>نوع الحركة
        <select value={type} onChange={(event) => setType(event.target.value as 'RESTOCK' | 'ADJUSTMENT')}>
          <option value="RESTOCK">إعادة تخزين</option>
          <option value="ADJUSTMENT">تعديل يدوي</option>
        </select>
      </label>
      <label>الكمية
        <input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} required dir="ltr" placeholder="10 أو -3" />
      </label>
      <label>السبب (اختياري)
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="مثال: جرد شهري" />
      </label>
      {message && <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} تسجيل الحركة
      </button>
    </form>
  );
}
