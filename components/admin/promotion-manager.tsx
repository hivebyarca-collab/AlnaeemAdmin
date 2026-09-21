'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { promotionCommandAction, savePromotionAction } from '@/app/actions';
import { minorToDollars } from '@/lib/api/mappers/money';
import type { ApiPromotion } from '@/services/adapters/api/promotion.repository';

type ProductOption = { id: string; name: string; sku: string; priceUsd: number };

const STATUS_LABEL: Record<string, string> = {
  NORMAL: 'عادي',
  SCHEDULED: 'مجدول',
  ACTIVE: 'نشط',
  EXPIRED: 'منتهٍ',
};

function toLocal(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function fromLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function PromotionManager({
  promotions,
  products,
}: {
  promotions: ApiPromotion[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(promotions[0]?.productId || products[0]?.id || '');
  const selectedPromo = promotions.find((item) => item.productId === selectedId) ?? null;
  const selectedProduct = products.find((item) => item.id === selectedId) ?? null;
  const [enabled, setEnabled] = useState(selectedPromo?.enabled ?? false);
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>(selectedPromo?.type ?? 'PERCENTAGE');
  const [percentage, setPercentage] = useState(String(selectedPromo?.percentage ?? 15));
  const [salePrice, setSalePrice] = useState(
    selectedPromo?.salePriceMinor != null ? String(minorToDollars(selectedPromo.salePriceMinor)) : '',
  );
  const [startsAt, setStartsAt] = useState(toLocal(selectedPromo?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocal(selectedPromo?.endsAt ?? null));
  const [showOnHomepage, setShowOnHomepage] = useState(selectedPromo?.showOnHomepage ?? true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function loadProduct(productId: string) {
    const promo = promotions.find((item) => item.productId === productId) ?? null;
    setSelectedId(productId);
    setEnabled(promo?.enabled ?? false);
    setType(promo?.type ?? 'PERCENTAGE');
    setPercentage(String(promo?.percentage ?? 15));
    setSalePrice(promo?.salePriceMinor != null ? String(minorToDollars(promo.salePriceMinor)) : '');
    setStartsAt(toLocal(promo?.startsAt ?? null));
    setEndsAt(toLocal(promo?.endsAt ?? null));
    setShowOnHomepage(promo?.showOnHomepage ?? true);
    setMessage(null);
  }

  const original = selectedProduct?.priceUsd ?? (selectedPromo?.product ? minorToDollars(selectedPromo.product.priceMinor) : 0);
  const preview = useMemo(() => {
    if (type === 'PERCENTAGE') {
      const percent = Number(percentage);
      if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return { offer: null as number | null, percent: null as number | null };
      return { offer: Math.round(original * (1 - percent / 100) * 100) / 100, percent };
    }
    const sale = Number(salePrice);
    if (!Number.isFinite(sale) || sale <= 0 || sale >= original) return { offer: null, percent: null };
    return { offer: sale, percent: Math.round(((original - sale) / original) * 10000) / 100 };
  }, [original, percentage, salePrice, type]);

  function run(task: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await task();
      setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="admin-dashboard-grid">
      <div className="admin-panel admin-table-panel">
        <header className="admin-panel-title"><h2>عروض المنتجات</h2></header>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--narrow">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الحالة</th>
                <th>الخصم</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr><td colSpan={4}>لا توجد عروض بعد. اختر منتجاً من النموذج.</td></tr>
              ) : promotions.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <button type="button" className="admin-table-title" aria-label={`تحرير عرض ${promo.product?.name ?? promo.name}`} onClick={() => loadProduct(promo.productId ?? '')}>
                      {promo.product?.name ?? promo.name}
                    </button>
                    <div dir="ltr">{promo.product?.sku}</div>
                  </td>
                  <td>{STATUS_LABEL[promo.status] ?? promo.status}</td>
                  <td dir="ltr">{promo.percentage != null ? `${promo.percentage}%` : '—'}</td>
                  <td>
                    <button type="button" className="admin-btn" onClick={() => loadProduct(promo.productId ?? '')}>تحرير</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form
        className="admin-panel admin-order-form"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => savePromotionAction({
            productId: selectedId,
            type,
            percentage: type === 'PERCENTAGE' ? Number(percentage) : null,
            salePriceMinor: type === 'FIXED_AMOUNT' ? Math.round(Number(salePrice) * 100) : null,
            startsAt: fromLocal(startsAt),
            endsAt: fromLocal(endsAt),
            enabled,
            showOnHomepage,
          }));
        }}
      >
        <header className="admin-panel-title"><h2>محرر العرض</h2></header>
        <label>المنتج
          <select value={selectedId} onChange={(event) => loadProduct(event.target.value)} required>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name} — {product.sku}</option>
            ))}
          </select>
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          تفعيل العرض
        </label>
        <label>نوع العرض
          <select value={type} onChange={(event) => setType(event.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}>
            <option value="PERCENTAGE">نسبة مئوية</option>
            <option value="FIXED_AMOUNT">سعر عرض ثابت</option>
          </select>
        </label>
        {type === 'PERCENTAGE' ? (
          <label>نسبة الخصم
            <input dir="ltr" value={percentage} onChange={(event) => setPercentage(event.target.value)} />
          </label>
        ) : (
          <label>سعر العرض بالدولار
            <input dir="ltr" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} />
          </label>
        )}
        <label>بداية العرض
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
        </label>
        <label>نهاية العرض
          <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={showOnHomepage} onChange={(event) => setShowOnHomepage(event.target.checked)} />
          إظهار في عروض الرئيسية
        </label>
        <p className="admin-callout">
          الحالة الحالية: {STATUS_LABEL[selectedPromo?.status ?? (enabled ? 'ACTIVE' : 'NORMAL')]} —
          السعر الأصلي <b dir="ltr">${original.toFixed(2)}</b>
          {preview.offer != null ? <> — سعر العرض <b dir="ltr">${preview.offer.toFixed(2)}</b> — التوفير <b dir="ltr">{preview.percent}%</b></> : null}
        </p>
        {message ? <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p> : null}
        <div className="admin-row-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={pending || !selectedId}>
            {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} حفظ
          </button>
          {selectedPromo ? (
            <>
              <button type="button" className="admin-btn" disabled={pending} onClick={() => run(() => promotionCommandAction(selectedPromo.id, 'disable'))}>تعطيل</button>
              <button type="button" className="admin-btn" disabled={pending} onClick={() => run(() => promotionCommandAction(selectedPromo.id, 'end'))}>إنهاء الآن</button>
              <button type="button" className="admin-btn" disabled={pending} onClick={() => run(() => promotionCommandAction(selectedPromo.id, 'extend'))}>تمديد 24 ساعة</button>
            </>
          ) : null}
        </div>
      </form>
    </div>
  );
}
