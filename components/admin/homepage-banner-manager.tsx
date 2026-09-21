'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Save } from 'lucide-react';
import { reorderBannersAction, saveBannerAction, toggleBannerAction, uploadBannerImageAction } from '@/app/actions';
import type { ApiBanner } from '@/services/adapters/api/banner.repository';

function imageContentType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp') return file.type;
  return null;
}

function fileToPayload(file: File) {
  return new Promise<{ filename: string; contentType: 'image/jpeg' | 'image/png' | 'image/webp'; dataBase64: string }>((resolve, reject) => {
    const contentType = imageContentType(file);
    if (!contentType) {
      reject(new Error('صيغة الصورة يجب أن تكون JPG أو PNG أو WebP'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('تعذر قراءة الملف'));
        return;
      }
      const dataBase64 = result.includes(',') ? result.slice(result.indexOf(',') + 1) : result;
      resolve({ filename: file.name, contentType, dataBase64 });
    };
    reader.readAsDataURL(file);
  });
}

function BannerCard({
  banner,
  pending,
  onSave,
  onToggle,
  onMove,
  onReplace,
}: {
  banner: ApiBanner;
  pending: boolean;
  onSave: (banner: ApiBanner) => void;
  onToggle: (banner: ApiBanner) => void;
  onMove: (banner: ApiBanner, direction: -1 | 1) => void;
  onReplace: (banner: ApiBanner, variant: 'dark' | 'light', file: File) => void;
}) {
  const [title, setTitle] = useState(banner.title);
  const [link, setLink] = useState(banner.link ?? banner.href ?? '');
  const [position, setPosition] = useState(String(banner.position));

  return (
    <article className="admin-panel admin-banner-card">
      <header className="admin-panel-title">
        <h2>{banner.title}</h2>
        <span className={`stock-pill ${banner.active ? 'stock-pill--in' : 'stock-pill--out'}`}>{banner.active ? 'نشط' : 'متوقف'}</span>
      </header>
      <div className="admin-banner-previews">
        <figure>
          <Image src={banner.imageUrlDark || banner.imageUrl} alt="" width={640} height={280} unoptimized />
          <figcaption>الوضع الداكن</figcaption>
          <label className="admin-btn">استبدال الداكن
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onReplace(banner, 'dark', file);
              event.currentTarget.value = '';
            }} />
          </label>
        </figure>
        <figure>
          <Image src={banner.imageUrlLight || banner.imageUrl} alt="" width={640} height={280} unoptimized />
          <figcaption>الوضع الفاتح</figcaption>
          <label className="admin-btn">استبدال الفاتح
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onReplace(banner, 'light', file);
              event.currentTarget.value = '';
            }} />
          </label>
        </figure>
      </div>
      <div className="admin-field-grid">
        <label>الاسم
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>الترتيب
          <input dir="ltr" value={position} onChange={(event) => setPosition(event.target.value)} />
        </label>
        <label className="admin-field-full">رابط الوجهة
          <input dir="ltr" value={link} onChange={(event) => setLink(event.target.value)} />
        </label>
      </div>
      <div className="admin-row-actions" style={{ padding: '0 16px 16px' }}>
        <button type="button" className="admin-btn admin-btn--primary" disabled={pending} onClick={() => onSave({ ...banner, title, link, position: Number(position) || banner.position })}>
          {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} حفظ
        </button>
        <button type="button" className="admin-btn" disabled={pending} onClick={() => onToggle(banner)}>{banner.active ? 'إيقاف' : 'تفعيل'}</button>
        <button type="button" className="admin-btn" disabled={pending} onClick={() => onMove(banner, -1)}>أعلى</button>
        <button type="button" className="admin-btn" disabled={pending} onClick={() => onMove(banner, 1)}>أسفل</button>
      </div>
    </article>
  );
}

export function HomepageBannerManager({ banners }: { banners: ApiBanner[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<'HERO' | 'PROMO'>('HERO');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const visible = useMemo(
    () => banners.filter((banner) => banner.placement === tab).sort((a, b) => a.position - b.position),
    [banners, tab],
  );

  function run(task: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await task();
      setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="admin-page-body">
      <div className="admin-tabs" role="tablist">
        <button type="button" className={`admin-tab ${tab === 'HERO' ? 'is-active' : ''}`} onClick={() => setTab('HERO')}>البانر الرئيسي</button>
        <button type="button" className={`admin-tab ${tab === 'PROMO' ? 'is-active' : ''}`} onClick={() => setTab('PROMO')}>العروض الصغيرة</button>
      </div>
      {message ? <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p> : null}
      <div className="admin-banner-list">
        {visible.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            pending={pending}
            onSave={(next) => run(() => saveBannerAction({
              id: next.id,
              title: next.title,
              imageUrl: next.imageUrl,
              imageUrlLight: next.imageUrlLight,
              link: next.link,
              placement: next.placement,
              active: next.active,
              position: next.position,
              altText: next.altText,
              key: next.key,
            }))}
            onToggle={(next) => run(() => toggleBannerAction(next.id, !next.active))}
            onMove={(next, direction) => {
              const ids = visible.map((item) => item.id);
              const index = ids.indexOf(next.id);
              const swap = index + direction;
              if (swap < 0 || swap >= ids.length) return;
              const copy = [...ids];
              const [moved] = copy.splice(index, 1);
              copy.splice(swap, 0, moved);
              run(() => reorderBannersAction(copy));
            }}
            onReplace={(next, variant, file) => {
              run(async () => {
                const payload = await fileToPayload(file);
                const uploaded = await uploadBannerImageAction(payload);
                if (!uploaded.ok || !uploaded.url) return uploaded;
                return saveBannerAction({
                  id: next.id,
                  title: next.title,
                  imageUrl: variant === 'dark' ? uploaded.url : next.imageUrl,
                  imageUrlLight: variant === 'light' ? uploaded.url : next.imageUrlLight,
                  link: next.link,
                  placement: next.placement,
                  active: next.active,
                  position: next.position,
                  altText: next.altText,
                  key: next.key,
                });
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}
