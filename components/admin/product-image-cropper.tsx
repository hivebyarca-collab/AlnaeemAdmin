'use client';

import { useRef, useState } from 'react';
import { Check, Loader2, X, ZoomIn } from 'lucide-react';

export type CroppedImage = { bytes: number[]; width: number; height: number };

/**
 * Real crop editor: drag to pan, slider to zoom, 1:1 output ratio.
 * Confirm produces an actual cropped WebP file (max 1200x1200, no upscaling)
 * rendered through a canvas — not a CSS-only illusion.
 */
export function ProductImageCropper({ src, alt, onConfirm, onCancel }: {
  src: string;
  alt: string;
  onConfirm: (cropped: CroppedImage) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  function clampOffsets(next: { x: number; y: number }, scale: number, frame: number, naturalWidth: number, naturalHeight: number) {
    return {
      x: Math.min(0, Math.max(frame - naturalWidth * scale, next.x)),
      y: Math.min(0, Math.max(frame - naturalHeight * scale, next.y)),
    };
  }

  function currentScale() {
    const image = imageRef.current;
    const frame = frameRef.current;
    if (!image || !frame) return 1;
    return (frame.clientWidth / Math.min(image.naturalWidth, image.naturalHeight)) * zoom;
  }

  function onPointerDown(event: React.PointerEvent) {
    if (!imageRef.current) return;
    imageRef.current.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, baseX: offset.x, baseY: offset.y };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    const image = imageRef.current;
    const frame = frameRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !image || !frame) return;
    setOffset(clampOffsets({ x: drag.baseX + (event.clientX - drag.startX), y: drag.baseY + (event.clientY - drag.startY) }, currentScale(), frame.clientWidth, image.naturalWidth, image.naturalHeight));
  }

  function onPointerEnd(event: React.PointerEvent) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function onZoom(nextZoom: number) {
    const image = imageRef.current;
    const frame = frameRef.current;
    if (!image || !frame) { setZoom(nextZoom); return; }
    const scale = (frame.clientWidth / Math.min(image.naturalWidth, image.naturalHeight)) * nextZoom;
    setOffset(clampOffsets(offset, scale, frame.clientWidth, image.naturalWidth, image.naturalHeight));
    setZoom(nextZoom);
  }

  async function confirm() {
    const image = imageRef.current;
    const frame = frameRef.current;
    if (!image || !frame || !image.naturalWidth) { setError('تعذر معالجة الصورة'); return; }
    setWorking(true); setError('');
    try {
      const displayed = frame.clientWidth;
      const scale = (displayed / Math.min(image.naturalWidth, image.naturalHeight)) * zoom;
      const sourceWidth = displayed / scale;
      const sourceX = -offset.x / scale;
      const sourceY = -offset.y / scale;
      // Real pixel crop through canvas. Never upscale past the source region.
      const target = Math.min(1200, Math.round(sourceWidth));
      const canvas = document.createElement('canvas');
      canvas.width = target;
      canvas.height = target;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceWidth, 0, 0, target, target);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
      if (!blob) throw new Error('blob');
      const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
      await onConfirm({ bytes, width: target, height: target });
    } catch {
      setError('تعذر معالجة الصورة، حاول مجدداً');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="admin-cropper" aria-label="قص الصورة">
      <h3>قص الصورة</h3>
      <div
        ref={frameRef}
        className="admin-cropper-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => {
            const image = imageRef.current;
            const frame = frameRef.current;
            if (!image || !frame) return;
            const scale = (frame.clientWidth / Math.min(image.naturalWidth, image.naturalHeight)) * zoom;
            setOffset(clampOffsets({ x: 0, y: 0 }, scale, frame.clientWidth, image.naturalWidth, image.naturalHeight));
          }}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
        />
        <div className="admin-cropper-guide" aria-hidden="true" />
      </div>
      <label className="admin-cropper-zoom">
        <ZoomIn aria-hidden="true" />
        <input type="range" min={1} max={4} step={0.05} value={zoom} onChange={(event) => onZoom(Number(event.target.value))} aria-label="تكبير الصورة" />
      </label>
      {error && <p className="admin-callout admin-callout--error" aria-live="polite">{error}</p>}
      <div className="admin-cropper-actions">
        <button type="button" className="admin-btn admin-btn--success" onClick={() => void confirm()} disabled={working}>
          {working ? <><Loader2 className="admin-spin" aria-hidden="true" /> جاري معالجة الصورة...</> : <><Check aria-hidden="true" /> تأكيد الصورة</>}
        </button>
        <button type="button" className="admin-btn" onClick={onCancel} disabled={working}><X aria-hidden="true" /> إلغاء</button>
      </div>
      <small className="admin-cropper-hint">اسحب الصورة لتحريكها واستخدم شريط التكبير لضبط الإطار (نسبة 1:1)</small>
    </div>
  );
}
