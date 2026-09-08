import { NextResponse } from 'next/server';
import { createProduct, getProduct, updateProductExtended } from '@/lib/database';
import { isAdminRequest } from '@/lib/admin-auth';

/** Duplicates a product as a hidden draft with a new unique SKU for the admin to review. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  let suffix = '-COPY';
  let sku = `${product.sku}${suffix}`;
  let attempt = 0;
  // Reserve a unique SKU before insert.
  while (attempt < 50) {
    try {
      const created = createProduct({
        ...product, sku, slug: `${product.slug}-copy-${Date.now().toString(36)}`, name: `${product.name} (نسخة)`,
        is_active: 0, is_demo: 0,
      });
      updateProductExtended(created.id, {
        image_path: product.image_path ?? null, image_source_url: null, image_source_domain: null,
        image_width: product.image_width ?? null, image_height: product.image_height ?? null,
      });
      return NextResponse.json({ ok: true, id: created.id, sku });
    } catch {
      attempt += 1;
      suffix = `-COPY-${attempt}`;
      sku = `${product.sku}${suffix}`;
    }
  }
  return NextResponse.json({ ok: false, error: 'SKU_CONFLICT' }, { status: 409 });
}
