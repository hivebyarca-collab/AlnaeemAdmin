'use server';

import { revalidatePath } from 'next/cache';
import {
  createProduct, updateProduct, updateProductExtended, deleteProduct, getProductBySku, getProduct, updateOrderAdmin,
  updateClient, anonymizeClient, setSettings, setConversationFlags, normalizePhone,
} from '@/lib/database';
import { requireAdmin } from '@/lib/admin-auth';

export type ActionResult = { ok: boolean; error?: string; message?: string };

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || `product-${Date.now()}`;
}

export type ProductFormValues = {
  id?: string; name: string; brand: string; model: string; sku: string; category: string;
  price: string; costPrice?: string; quantity: string; lowStockThreshold: string; description: string;
  isActive: boolean; barcode?: string | null; imagePath?: string | null; imageSourceUrl?: string | null;
  imageSourceDomain?: string | null; imageWidth?: number | null; imageHeight?: number | null;
};

/** Server-side validation + product create/update. Prevents duplicate SKUs. */
export async function saveProduct(values: ProductFormValues): Promise<ActionResult> {
  await requireAdmin();
  const name = values.name.trim();
  const sku = values.sku.trim().toUpperCase();
  if (name.length < 3) return { ok: false, error: 'اسم المنتج مطلوب (3 أحرف على الأقل)' };
  if (!/^[A-Z0-9][A-Z0-9-]{2,40}$/.test(sku)) return { ok: false, error: 'رمز المنتج (SKU) يجب أن يكون حروفاً لاتينية وأرقاماً وشرطات فقط' };
  if (!values.brand.trim()) return { ok: false, error: 'العلامة التجارية مطلوبة' };
  if (!values.category) return { ok: false, error: 'التصنيف مطلوب' };
  const price = Number(values.price);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'السعر يجب أن يكون رقماً موجباً' };
  const quantity = Number(values.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) return { ok: false, error: 'الكمية يجب أن تكون رقماً صحيحاً' };
  const threshold = Number(values.lowStockThreshold);
  if (!Number.isInteger(threshold) || threshold < 0) return { ok: false, error: 'حد أدنى للمخزون يجب أن يكون رقماً صحيحاً' };
  const costPrice = values.costPrice ? Number(values.costPrice) : null;
  if (values.costPrice && (!Number.isFinite(costPrice) || (costPrice ?? 0) < 0)) return { ok: false, error: 'سعر التكلفة غير صالح' };

  const existing = getProductBySku(sku);
  if (existing && existing.id !== values.id) return { ok: false, error: 'رمز المنتج (SKU) مستخدم مسبقاً — يجب أن يكون فريداً' };

  const existingProduct = values.id ? getProduct(values.id) : undefined;
  const base = {
    sku, slug: slugify(`${values.brand}-${name}-${sku}`), category: values.category, subcategory: values.category,
    brand: values.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, model: values.model.trim() || name,
    short_name: name, description: values.description.trim(), price_usd: price, currency: 'USD',
    price_source: 'MANUAL_ADMIN', price_checked_at: new Date().toISOString(), stock_quantity: quantity,
    reserved_quantity: existingProduct?.reserved_quantity ?? 0, low_stock_threshold: threshold, is_active: values.isActive ? 1 : 0,
    // Preserve existing specs_json if editing, otherwise set defaults
    specs_json: existingProduct?.specs_json ?? '{}',
    sync_status: existingProduct?.sync_status ?? ('MANUAL' as const),
    compatibility_type: existingProduct?.compatibility_type ?? null,
    external_ref: existingProduct?.external_ref ?? null,
    last_synced_at: existingProduct?.last_synced_at ?? null,
  };

  let productId = values.id;
  if (productId) {
    updateProduct(productId, base);
  } else {
    productId = createProduct(base).id;
  }
  // Extended image/cost/barcode columns (additive migration fields).
  updateProductExtended(productId, {
    cost_price: costPrice, barcode: values.barcode ?? null, image_path: values.imagePath ?? null,
    image_source_url: values.imageSourceUrl ?? null, image_source_domain: values.imageSourceDomain ?? null,
    image_width: values.imageWidth ?? null, image_height: values.imageHeight ?? null,
  });
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  revalidatePath('/store');
  return { ok: true, message: values.id ? 'تم تحديث المنتج' : 'تم إضافة المنتج بنجاح' };
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!updateProduct(id, { is_active: isActive ? 1 : 0 })) return { ok: false, error: 'المنتج غير موجود' };
  revalidatePath('/admin/products');
  revalidatePath('/store');
  return { ok: true, message: isActive ? 'تم إظهار المنتج' : 'تم إخفاء المنتج' };
}

export async function removeProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!getProduct(id)) return { ok: false, error: 'المنتج غير موجود' };
  deleteProduct(id);
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { ok: true, message: 'تم حذف المنتج' };
}

export async function updateOrderDetails(id: string, changes: { status?: string; payment_status?: string; notes?: string }): Promise<ActionResult> {
  await requireAdmin();
  const statuses = ['SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
  if (changes.status && !statuses.includes(changes.status)) return { ok: false, error: 'حالة طلب غير صالحة' };
  if (changes.payment_status && !['unpaid', 'paid', 'refunded'].includes(changes.payment_status)) return { ok: false, error: 'حالة دفع غير صالحة' };
  const updated = updateOrderAdmin(id, changes as { status?: 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'; payment_status?: 'unpaid' | 'paid' | 'refunded'; notes?: string });
  if (!updated) return { ok: false, error: 'الطلب غير موجود' };
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin');
  return { ok: true, message: 'تم تحديث الطلب' };
}

export async function updateClientAdmin(id: string, changes: { full_name?: string; email?: string | null; phone?: string | null; notes?: string | null; is_disabled?: boolean }): Promise<ActionResult> {
  await requireAdmin();
  if (changes.phone) changes.phone = normalizePhone(changes.phone);
  if (!updateClient(id, { ...changes, is_disabled: changes.is_disabled === undefined ? undefined : (changes.is_disabled ? 1 : 0) })) return { ok: false, error: 'العميل غير موجود' };
  revalidatePath('/admin/clients');
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true, message: 'تم تحديث بيانات العميل' };
}

export async function anonymizeClientAdmin(id: string): Promise<ActionResult> {
  await requireAdmin();
  anonymizeClient(id);
  revalidatePath('/admin/clients');
  revalidatePath('/admin');
  return { ok: true, message: 'تم إخفاء هوية العميل مع الاحتفاظ بسجل الطلبات' };
}

export async function saveAdminSettings(entries: Record<string, string>): Promise<ActionResult> {
  await requireAdmin();
  const allowed = new Set(['whatsapp_greeting', 'syp_per_usd', 'ai_high_value_threshold_usd', 'whatsapp_ai_mode']);
  if (Object.keys(entries).some((key) => !allowed.has(key))) return { ok: false, error: 'إعداد غير مسموح' };
  if (entries.whatsapp_greeting && entries.whatsapp_greeting.length > 300) return { ok: false, error: 'رسالة الترحيب يجب أن تكون أقل من 300 حرف' };
  if (entries.syp_per_usd && (!Number.isFinite(Number(entries.syp_per_usd)) || Number(entries.syp_per_usd) <= 0 || Number(entries.syp_per_usd) > 1_000_000)) return { ok: false, error: 'سعر صرف الدولار غير صالح' };
  if (entries.ai_high_value_threshold_usd && (!Number.isFinite(Number(entries.ai_high_value_threshold_usd)) || Number(entries.ai_high_value_threshold_usd) < 0)) return { ok: false, error: 'حد قيمة الطلب غير صالح' };
  if (entries.whatsapp_ai_mode && !['AUTO', 'ASSIST', 'MANUAL'].includes(entries.whatsapp_ai_mode)) return { ok: false, error: 'وضع الذكاء الاصطناعي غير صالح' };
  setSettings(entries);
  revalidatePath('/admin/settings');
  revalidatePath('/admin');
  revalidatePath('/store');
  return { ok: true, message: 'تم حفظ الإعدادات' };
}

export async function setConversationAiState(id: string, aiPaused: boolean): Promise<ActionResult> {
  await requireAdmin();
  setConversationFlags(id, { ai_paused: aiPaused, needs_admin: aiPaused });
  revalidatePath('/admin/clients');
  return { ok: true, message: aiPaused ? 'تم استلام المحادثة من الذكاء الاصطناعي' : 'تم إعادة المحادثة للذكاء الاصطناعي' };
}

export async function fetchProductImageCandidates(product: { name?: string; brand?: string; model?: string; category?: string }): Promise<{ ok: boolean; candidates?: { title: string; imageUrl: string; thumbnailUrl?: string; width?: number; height?: number; source?: string; domain?: string; sourcePage?: string }[]; error?: string }> {
  await requireAdmin();
  const { searchProductImages, isImageSearchConfigured } = await import('@/lib/services/image-search');
  if (!isImageSearchConfigured()) return { ok: false, error: 'IMAGE_SEARCH_NOT_CONFIGURED' };
  if (!product.name?.trim()) return { ok: false, error: 'QUERY_REQUIRED' };
  try {
    return { ok: true, candidates: await searchProductImages({ name: product.name ?? '', brand: product.brand, model: product.model, category: product.category }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'SEARCH_FAILED' };
  }
}

/** Server-side download of an admin-selected remote image into local storage (SSRF-guarded). */
export async function storeRemoteImage(url: string): Promise<{ ok: boolean; path?: string; error?: string }> {
  await requireAdmin();
  const { fetchRemoteImage, saveProductImage } = await import('@/lib/services/storage');
  const remote = await fetchRemoteImage(url);
  if (!remote) return { ok: false, error: 'تعذر تحميل هذه الصورة، اختر صورة أخرى' };
  const extension = remote.contentType.includes('png') ? 'png' : remote.contentType.includes('webp') ? 'webp' : 'jpg';
  const saved = await saveProductImage(remote.bytes, extension);
  return { ok: true, path: saved.path };
}

/** Persists a processed (cropped/optimized) image produced by the admin crop editor. */
export async function storeProcessedImage(bytes: number[], sourceMeta: { sourceUrl?: string | null; domain?: string | null; width?: number; height?: number }): Promise<{ ok: boolean; path?: string; error?: string }> {
  await requireAdmin();
  if (!bytes.length) return { ok: false, error: 'تعذر معالجة الصورة' };
  if (bytes.length > 8 * 1024 * 1024) return { ok: false, error: 'حجم الصورة كبير جداً' };
  const { saveProductImage } = await import('@/lib/services/storage');
  try {
    const saved = await saveProductImage(new Uint8Array(bytes), 'webp');
    return { ok: true, path: saved.path, ...sourceMeta };
  } catch {
    return { ok: false, error: 'تعذر حفظ الصورة في التخزين' };
  }
}

