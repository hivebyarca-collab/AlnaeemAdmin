'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Plus, Save } from 'lucide-react';
import { saveProduct, type ProductFormValues, type ActionResult } from '@/app/actions';
import { ProductImagePicker, type PickedImage } from './product-image-picker';
import { BarcodeGenerator } from './barcode-generator';

export type ProductFormInitial = Partial<ProductFormValues> & { id?: string; category?: string };

const emptyValues = {
  name: '', brand: '', model: '', sku: '', category: '', price: '', costPrice: '',
  quantity: '0', lowStockThreshold: '2', description: '', isActive: true,
};

export function ProductForm({
  initial,
  categories = [],
  brands = [],
}: {
  initial: ProductFormInitial;
  categories?: { id: string; label: string }[];
  brands?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({ ...emptyValues, ...initial, isActive: initial.isActive ?? true });
  const [image, setImage] = useState<PickedImage | null>(
    initial.imagePath
      ? { path: initial.imagePath, sourceUrl: initial.imageSourceUrl ?? null, domain: initial.imageSourceDomain ?? null, width: initial.imageWidth ?? null, height: initial.imageHeight ?? null }
      : null,
  );
  const [barcode, setBarcode] = useState<string | null>(initial.barcode ?? null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const [, startTransition] = useTransition();

  function submit(then: 'list' | 'another') {
    setSaving(true); setFeedback(null);
    startTransition(async () => {
      const result = await saveProduct({
        ...values,
        id: initial.id,
        barcode,
        imagePath: image?.path ?? null,
        imageSourceUrl: image?.sourceUrl ?? null,
        imageSourceDomain: image?.domain ?? null,
        imageWidth: image?.width ?? null,
        imageHeight: image?.height ?? null,
      });
      setSaving(false);
      if (!result.ok) { setFeedback({ ok: false, error: result.error }); return; }
      if (then === 'list') {
        router.push('/products');
      } else {
        setValues({ ...emptyValues });
        setImage(null);
        setBarcode(null);
        setFeedback({ ok: true, message: 'تم حفظ المنتج — يمكنك إضافة منتج آخر' });
        router.refresh();
      }
    });
  }

  return (
    <form
      className="admin-product-form"
      onSubmit={(event) => { event.preventDefault(); submit('list'); }}
      noValidate
    >
      <div className="admin-form-columns">
        <section className="admin-panel admin-image-panel" aria-label="صورة المنتج">
          <header className="admin-panel-title"><h2>صورة المنتج</h2><small>أضف صورة عالية الجودة للمنتج</small></header>
          <ProductImagePicker
            initial={image}
            productName={values.name}
            brand={values.brand}
            model={values.model}
            category={categories.find((option) => option.id === values.category)?.label ?? ''}
            onChange={setImage}
          />
        </section>

        <div className="admin-form-main">
          <section className="admin-panel" aria-label="تفاصيل المنتج الأساسية">
            <header className="admin-panel-title"><h2>تفاصيل المنتج الأساسية</h2><small>أدخل المعلومات الأساسية للمنتج</small></header>
            <div className="admin-field-grid">
              <label>اسم المنتج <b>*</b><input required value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
              <label>رمز المنتج SKU <b>*</b><input dir="ltr" required value={values.sku} onChange={(event) => setValues({ ...values, sku: event.target.value })} placeholder="ASUS-RTX4070-001" /></label>
              <label>التصنيف <b>*</b>
                <select required value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value })}>
                  <option value="">اختر التصنيف</option>
                  {categories.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label>العلامة التجارية <b>*</b>
                <select required value={values.brand} onChange={(event) => setValues({ ...values, brand: event.target.value })}>
                  <option value="">اختر العلامة</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
              <label>رقم الموديل<input dir="ltr" value={values.model} onChange={(event) => setValues({ ...values, model: event.target.value })} placeholder="ROG-STRIX-RTX4070-O12G-GAMING" /></label>
              <label>السعر (دولار) <b>*</b><input dir="ltr" required type="number" min="0" step="0.01" value={values.price} onChange={(event) => setValues({ ...values, price: event.target.value })} /></label>
              <label>سعر التكلفة (اختياري)<input dir="ltr" type="number" min="0" step="0.01" value={values.costPrice} onChange={(event) => setValues({ ...values, costPrice: event.target.value })} /></label>
              <label>الكمية المتوفرة <b>*</b><input dir="ltr" required type="number" min="0" value={values.quantity} onChange={(event) => setValues({ ...values, quantity: event.target.value })} /></label>
              <label>الحد الأدنى للمخزون <b>*</b><input dir="ltr" required type="number" min="0" value={values.lowStockThreshold} onChange={(event) => setValues({ ...values, lowStockThreshold: event.target.value })} /></label>
              <label className="admin-field-full">الوصف
                <textarea rows={4} maxLength={1000} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
                <small dir="ltr">{values.description.length}/1000</small>
              </label>
              <label className="admin-switch">
                <input type="checkbox" checked={values.isActive} onChange={(event) => setValues({ ...values, isActive: event.target.checked })} />
                <span>منتج نشط (ظاهر في المتجر)</span>
              </label>
            </div>
          </section>

          <section className="admin-panel" aria-label="الباركود">
            <header className="admin-panel-title"><h2>الباركود</h2><small>يُنشأ باركود Code 128 من رمز المنتج</small></header>
            <BarcodeGenerator sku={values.sku} initialBarcode={initial.barcode} onChange={setBarcode} />
          </section>

          {saving && <p className="admin-callout" aria-live="polite">جاري حفظ المنتج...</p>}
          {feedback && (
            <p className={`admin-callout ${feedback.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">
              {feedback.ok ? feedback.message : feedback.error}
            </p>
          )}

          <div className="admin-form-footer">
            {!initial.id && (
              <button type="button" className="admin-btn" disabled={saving} onClick={() => submit('another')}>
                {saving ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />} حفظ وإضافة منتج آخر
              </button>
            )}
            <button type="submit" className="admin-btn admin-btn--primary admin-btn--lg" disabled={saving}>
              {saving ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} حفظ المنتج
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
