'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, RefreshCcw, Sparkles, Upload } from 'lucide-react';
import { fetchProductImageCandidates, storeRemoteImage, storeProcessedImage } from '@/app/actions';
import { ProductImageCropper, type CroppedImage } from './product-image-cropper';

type Candidate = { title: string; imageUrl: string; thumbnailUrl?: string; width?: number; height?: number; source?: string; domain?: string; sourcePage?: string };
export type PickedImage = { path: string; sourceUrl?: string | null; domain?: string | null; width?: number | null; height?: number | null };

const searchErrors: Record<string, string> = {
  IMAGE_SEARCH_NOT_CONFIGURED: 'خدمة البحث عن الصور غير مفعّلة (لا يوجد SERPER_API_KEY على الخادم). يمكنك رفع صورة يدوياً.',
  QUERY_REQUIRED: 'أدخل اسم المنتج والعلامة التجارية أولاً',
  IMAGE_SEARCH_TIMEOUT: 'انتهت مهلة البحث، حاول مجدداً',
  IMAGE_SEARCH_RATE_LIMITED: 'تم تجاوز حد الطلبات، انتظر قليلاً ثم أعد البحث',
  IMAGE_SEARCH_UNAUTHORIZED: 'مفتاح البحث غير صالح — تحقق من SERPER_API_KEY',
  IMAGE_SEARCH_NO_RESULTS: 'لا توجد نتائج لهذا المنتج، جرّب تعديل الاسم أو الموديل',
  IMAGE_SEARCH_NETWORK: 'تعذر الاتصال بخدمة البحث، تحقق من الشبكة',
};

/**
 * Reusable product image picker: Serper search (best 3 scored candidates),
 * server-side download, shared crop editor, and optimized WebP storage.
 * Used by both Add Product and Edit Product.
 */
export function ProductImagePicker({ initial, productName, brand, model, category, onChange }: {
  initial?: PickedImage | null;
  productName: string;
  brand: string;
  model: string;
  category: string;
  onChange: (image: PickedImage | null) => void;
}) {
  const [image, setImage] = useState<PickedImage | null>(initial ?? null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; candidate?: Candidate } | null>(null);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function update(next: PickedImage | null) {
    setImage(next);
    onChange(next);
  }

  async function handleSearch() {
    if (!productName.trim() || !brand.trim()) { setError(searchErrors.QUERY_REQUIRED); return; }
    setSearching(true); setError('');
    const result = await fetchProductImageCandidates({ name: productName, brand, model, category });
    setSearching(false);
    if (!result.ok || !result.candidates?.length) {
      setError(result.error ? searchErrors[result.error] ?? 'فشل البحث عن الصور، حاول مجدداً' : 'فشل البحث عن الصور، حاول مجدداً');
      return;
    }
    setCandidates(result.candidates);
  }

  /** Selection downloads the remote image server-side, then opens the shared crop editor. */
  async function handleSelect(candidate: Candidate) {
    setDownloading(true); setError(''); setSelectedUrl(candidate.imageUrl);
    const stored = await storeRemoteImage(candidate.imageUrl);
    setDownloading(false);
    if (!stored.ok || !stored.path) { setError(stored.error ?? 'تعذر تحميل هذه الصورة، اختر صورة أخرى'); setSelectedUrl(null); return; }
    setCropSource({ src: stored.path, candidate });
  }

  function handleUploadFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('صيغة الصورة غير مدعومة — استخدم JPG أو PNG أو WebP'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('حجم الصورة كبير جداً (الحد 8 ميجابايت)'); return; }
    setError('');
    setCropSource({ src: URL.createObjectURL(file) });
  }

  async function handleCropped(cropped: CroppedImage) {
    setProcessing(true);
    const saved = await storeProcessedImage(cropped.bytes, {
      sourceUrl: cropSource?.candidate?.sourcePage ?? null,
      domain: cropSource?.candidate?.domain ?? null,
      width: cropped.width,
      height: cropped.height,
    });
    setProcessing(false);
    if (!saved.ok || !saved.path) { setError(saved.error ?? 'تعذر حفظ الصورة'); return; }
    update({ path: saved.path, sourceUrl: cropSource?.candidate?.sourcePage ?? null, domain: cropSource?.candidate?.domain ?? null, width: cropped.width, height: cropped.height });
    setCropSource(null);
    setSelectedUrl(null);
    setCandidates([]);
  }

  const busy = searching || downloading || processing;

  return (
    <div className="admin-image-body">
      <div className="admin-image-preview">
        {image?.path
          ? <Image src={image.path} alt="صورة المنتج" width={320} height={240} unoptimized className="admin-image-img" />
          : <span className="admin-image-placeholder"><ImagePlus aria-hidden="true" /> لا توجد صورة بعد</span>}
        {image?.domain && <small className="admin-image-domain" dir="ltr">المصدر: {image.domain}</small>}
        {image?.width && <small className="admin-image-domain" dir="ltr">{image.width}×{image.height}</small>}
      </div>

      <div className="admin-image-actions">
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSearch} disabled={busy || !productName.trim()}>
          {searching ? <><Loader2 className="admin-spin" aria-hidden="true" /> جاري البحث عن الصور...</> : <><Sparkles aria-hidden="true" /> جلب أفضل صورة</>}
        </button>
        <button type="button" className="admin-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload aria-hidden="true" /> رفع صورة يدوياً
        </button>
        <input
          ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={(event) => { const file = event.target.files?.[0]; if (file) handleUploadFile(file); event.target.value = ''; }}
        />
      </div>

      {error && <p className="admin-callout admin-callout--error" aria-live="polite">{error}</p>}

      {candidates.length > 0 && !cropSource && (
        <div className="admin-candidates">
          {candidates.map((candidate, index) => (
            <button
              type="button" key={candidate.imageUrl}
              className={`admin-candidate ${selectedUrl === candidate.imageUrl ? 'is-selected' : ''}`}
              onClick={() => void handleSelect(candidate)} disabled={busy}
              title={candidate.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={candidate.thumbnailUrl ?? candidate.imageUrl} alt={`خيار ${index + 1}`} width={96} height={72} loading="lazy" />
              <span>الخيار {index + 1}</span>
              {candidate.domain && <small dir="ltr">{candidate.domain}</small>}
              {candidate.width && <small dir="ltr">{candidate.width}×{candidate.height}</small>}
              <b className="admin-candidate-use">{downloading && selectedUrl === candidate.imageUrl ? 'جاري التحميل...' : 'استخدام'}</b>
            </button>
          ))}
          <button type="button" className="admin-btn" onClick={handleSearch} disabled={busy}>
            <RefreshCcw aria-hidden="true" /> إعادة البحث
          </button>
        </div>
      )}

      {cropSource && (
        <ProductImageCropper
          src={cropSource.src}
          alt="قص صورة المنتج"
          onConfirm={handleCropped}
          onCancel={() => { setCropSource(null); setSelectedUrl(null); }}
        />
      )}
    </div>
  );
}
