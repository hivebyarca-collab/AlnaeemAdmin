import { NextResponse } from 'next/server';
import { searchProductImages, isImageSearchConfigured } from '@/lib/services/image-search';
import { isAdminRequest } from '@/lib/admin-auth';

const errorStatuses: Record<string, number> = {
  IMAGE_SEARCH_NOT_CONFIGURED: 503, QUERY_REQUIRED: 400, IMAGE_SEARCH_RATE_LIMITED: 429,
  IMAGE_SEARCH_UNAUTHORIZED: 502, IMAGE_SEARCH_TIMEOUT: 504, IMAGE_SEARCH_NETWORK: 502, IMAGE_SEARCH_NO_RESULTS: 404,
};

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  if (!isImageSearchConfigured()) {
    return NextResponse.json({ ok: false, error: 'IMAGE_SEARCH_NOT_CONFIGURED' }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { name?: string; brand?: string; model?: string; category?: string };
  if (JSON.stringify(body).length > 1000) return NextResponse.json({ ok: false, error: 'QUERY_TOO_LARGE' }, { status: 413 });
  if (!body.name?.trim()) return NextResponse.json({ ok: false, error: 'QUERY_REQUIRED' }, { status: 400 });
  try {
    const candidates = await searchProductImages({ name: body.name, brand: body.brand, model: body.model, category: body.category });
    return NextResponse.json({ ok: true, candidates });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'SEARCH_FAILED';
    return NextResponse.json({ ok: false, error: code }, { status: errorStatuses[code] ?? 502 });
  }
}
