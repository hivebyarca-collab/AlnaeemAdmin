'use client';

import { useMemo, useState } from 'react';
import { Barcode, RefreshCcw, Settings2 } from 'lucide-react';
import { code128Svg } from '@/lib/barcode';

/**
 * Local CODE128 barcode generation from the product SKU.
 * Deterministic — no AI, no external barcode API.
 */
export function BarcodeGenerator({ sku, initialBarcode, onChange }: {
  sku: string;
  initialBarcode?: string | null;
  onChange: (barcode: string | null) => void;
}) {
  const [barcode, setBarcode] = useState(initialBarcode ?? '');
  const normalizedSku = sku.trim().toUpperCase();
  const stale = Boolean(barcode) && barcode !== normalizedSku;

  const svg = useMemo(() => {
    if (!/^[A-Z0-9-]{3,42}$/.test(barcode)) return null;
    try { return code128Svg(barcode, { height: 56, moduleWidth: 2 }); } catch { return null; }
  }, [barcode]);

  function generate() {
    if (!/^[A-Z0-9-]{3,}$/.test(normalizedSku)) return;
    const next = normalizedSku;
    setBarcode(next);
    onChange(next);
  }

  return (
    <div className="admin-barcode-row">
      <div className="admin-barcode-controls">
        <button type="button" className="admin-btn admin-btn--primary" onClick={generate} disabled={!/^[A-Z0-9-]{3,}$/.test(normalizedSku)}>
          {barcode ? <><RefreshCcw aria-hidden="true" /> إعادة إنشاء</> : <><Settings2 aria-hidden="true" /> إنشاء باركود</>}
        </button>
        <label>نوع الباركود
          <select defaultValue="code128" aria-label="نوع الباركود"><option value="code128">Code 128</option></select>
        </label>
        <label>رمز المنتج / SKU
          <input dir="ltr" value={barcode || normalizedSku} readOnly aria-label="قيمة الباركود" />
        </label>
        {stale && <p className="admin-callout admin-callout--warn">تغيّر رمز المنتج — أعد إنشاء الباركود ليتطابق مع SKU الجديد.</p>}
      </div>
      <div className="admin-barcode-preview">
        {svg
          ? <div className="admin-barcode-svg" dir="ltr" dangerouslySetInnerHTML={{ __html: svg }} />
          : <span className="admin-image-placeholder"><Barcode aria-hidden="true" /> أدخل SKU ثم اضغط إنشاء باركود</span>}
      </div>
    </div>
  );
}
