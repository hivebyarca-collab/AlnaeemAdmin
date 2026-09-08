// Server-side only module (imported exclusively by route handlers / server actions).
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Local-disk object storage provider. The project had no storage vendor before,
 * so files live under public/uploads and are served statically. Swapping this
 * module for S3/Supabase later requires only changing these functions.
 */
const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'products');

export async function saveProductImage(bytes: Uint8Array, extension = 'webp'): Promise<{ path: string }> {
  mkdirSync(UPLOAD_ROOT, { recursive: true });
  const fileName = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_ROOT, fileName), bytes);
  return { path: `/uploads/products/${fileName}` };
}

/** Validates a remote image URL: https-only, no localhost/private/internal hosts (SSRF guard). */
function isSafeRemoteImageUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;
    if (hostname === '0.0.0.0' || hostname === '::1' || hostname === '[::1]') return false;
    const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const octets = ipv4.slice(1).map(Number);
      if (octets.some((octet) => octet > 255)) return false;
      const [a, b] = octets;
      if (a === 10 || a === 127 || a === 0 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_REMOTE_BYTES = 8 * 1024 * 1024;

/** Downloads a remote image chosen by an admin; returns null on any failure (CORS/network/unsafe). */
export async function fetchRemoteImage(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!isSafeRemoteImageUrl(url)) return null;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'AL-Naeem-Admin/1.0' }, signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (!response.ok) return null;
    const contentType = (response.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) return null;
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && (declaredLength <= 0 || declaredLength > MAX_REMOTE_BYTES)) return null;
    if (!response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REMOTE_BYTES) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    if (total === 0) return null;
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const validSignature = contentType === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : contentType === 'image/png'
        ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
        : bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (!validSignature) return null;
    return { bytes, contentType };
  } catch {
    return null;
  }
}

