'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { toActionError } from '@/lib/api/errors';
import { slugifyAscii } from '@/lib/api/mappers/money';
import { isApiAdapter } from '@/lib/config/env';
import {
  catalogService,
  conversationService,
  customerService,
  inventoryService,
  productService,
  orderService,
  settingsService,
} from '@/services';
import type { ProductInput } from '@/types';

export type ActionResult = { ok: boolean; error?: string; message?: string };

export type ProductFormValues = {
  id?: string; name: string; brand: string; model: string; sku: string; category: string;
  price: string; costPrice?: string; quantity: string; lowStockThreshold: string; description: string;
  isActive: boolean; barcode?: string | null; imagePath?: string | null; imageSourceUrl?: string | null;
  imageSourceDomain?: string | null; imageWidth?: number | null; imageHeight?: number | null;
};

const SETTINGS_ALLOWLIST = new Set([
  'whatsapp_connected_number', 'whatsapp_ai_enabled', 'whatsapp_ai_mode', 'whatsapp_greeting',
  'ai_escalation_keywords', 'ai_high_value_threshold_usd',
  'store_name', 'store_phone', 'store_address', 'syp_per_usd', 'site_description',
  'products_default_low_stock', 'products_barcode_type', 'products_image_format', 'orders_notify',
  ...Array.from({ length: 7 }, (_, index) => [`hours_${index}_open`, `hours_${index}_from`, `hours_${index}_to`]).flat(),
]);

export async function saveProduct(values: ProductFormValues): Promise<ActionResult> {
  try {
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

    const existing = await productService.getProductBySku(sku);
    if (existing && existing.id !== values.id) return { ok: false, error: 'رمز المنتج (SKU) مستخدم مسبقاً — يجب أن يكون فريداً' };

    const existingProduct = values.id ? await productService.getProduct(values.id) : undefined;
    const brandId = values.brand.trim();
    const categoryId = values.category.trim();
    const base: ProductInput = {
      sku,
      slug: slugifyAscii(`${brandId.slice(0, 8)}-${name}-${sku}`),
      category: categoryId,
      subcategory: categoryId,
      brand: brandId,
      name,
      model: values.model.trim() || name,
      short_name: name,
      description: values.description.trim(),
      price_usd: price,
      currency: 'USD',
      price_source: 'MANUAL_ADMIN',
      price_checked_at: new Date().toISOString(),
      stock_quantity: quantity,
      reserved_quantity: existingProduct?.reserved_quantity ?? 0,
      low_stock_threshold: threshold,
      is_active: values.isActive ? 1 : 0,
      specs_json: existingProduct?.specs_json ?? '{}',
      sync_status: existingProduct?.sync_status ?? 'MANUAL',
      compatibility_type: existingProduct?.compatibility_type ?? null,
      external_ref: existingProduct?.external_ref ?? null,
      last_synced_at: existingProduct?.last_synced_at ?? null,
    };

    let productId = values.id;
    if (productId) {
      const updated = await productService.updateProduct(productId, base);
      if (!updated) return { ok: false, error: 'تعذر تحديث المنتج' };
    } else {
      productId = (await productService.createProduct(base)).id;
    }
    await productService.updateProductExtended(productId, {
      cost_price: costPrice, barcode: values.barcode ?? null, image_path: values.imagePath ?? null,
      image_source_url: values.imageSourceUrl ?? null, image_source_domain: values.imageSourceDomain ?? null,
      image_width: values.imageWidth ?? null, image_height: values.imageHeight ?? null,
    });
    revalidatePath('/products');
    revalidatePath('/');
    return { ok: true, message: values.id ? 'تم تحديث المنتج' : 'تم إضافة المنتج بنجاح' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const updated = await productService.updateProduct(id, { is_active: isActive ? 1 : 0 });
    if (!updated) return { ok: false, error: 'المنتج غير موجود' };
    revalidatePath('/products');
    return { ok: true, message: isActive ? 'تم إظهار المنتج' : 'تم إخفاء المنتج' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function removeProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!(await productService.getProduct(id))) return { ok: false, error: 'المنتج غير موجود' };
    await productService.deleteProduct(id);
    revalidatePath('/products');
    revalidatePath('/');
    return { ok: true, message: 'تم حذف المنتج' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function updateOrderDetails(id: string, changes: { status?: string; payment_status?: string; notes?: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const statuses = ['SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (changes.status && !statuses.includes(changes.status)) return { ok: false, error: 'حالة طلب غير صالحة' };
    if (changes.payment_status && !['unpaid', 'paid', 'refunded'].includes(changes.payment_status)) return { ok: false, error: 'حالة دفع غير صالحة' };

    if (isApiAdapter()) {
      if (!changes.status) return { ok: false, error: 'API يدعم تحديث حالة الطلب فقط حالياً' };
      if (changes.payment_status || changes.notes) {
        // Status-only contract — ignore unsupported fields rather than faking success.
      }
      const updated = await orderService.updateOrder(id, {
        status: changes.status as 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED',
      });
      if (!updated) return { ok: false, error: 'تعذر تحديث حالة الطلب (الدفع والملاحظات غير مدعومين عبر API بعد)' };
    } else {
      const updated = await orderService.updateOrder(id, changes as { status?: 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'; payment_status?: 'unpaid' | 'paid' | 'refunded'; notes?: string });
      if (!updated) return { ok: false, error: 'الطلب غير موجود' };
    }
    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    revalidatePath('/');
    return { ok: true, message: 'تم تحديث الطلب' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function updateCustomerAdmin(id: string, changes: { full_name?: string; email?: string | null; phone?: string | null; notes?: string | null; is_disabled?: boolean }): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (isApiAdapter()) {
      return { ok: false, error: 'تعديل العملاء غير متاح عبر API بعد — القراءة فقط' };
    }
    if (changes.phone) changes.phone = customerService.normalizePhone(changes.phone);
    if (!(await customerService.updateCustomer(id, changes))) return { ok: false, error: 'العميل غير موجود' };
    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    return { ok: true, message: 'تم تحديث بيانات العميل' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function anonymizeCustomerAdmin(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (isApiAdapter()) {
      return { ok: false, error: 'إخفاء هوية العميل غير متاح عبر API بعد' };
    }
    await customerService.anonymizeCustomer(id);
    revalidatePath('/customers');
    revalidatePath('/');
    return { ok: true, message: 'تم إخفاء هوية العميل مع الاحتفاظ بسجل الطلبات' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

/** @deprecated Use updateCustomerAdmin */
export async function updateClientAdmin(id: string, changes: Parameters<typeof updateCustomerAdmin>[1]): Promise<ActionResult> {
  return updateCustomerAdmin(id, changes);
}

/** @deprecated Use anonymizeCustomerAdmin */
export async function anonymizeClientAdmin(id: string): Promise<ActionResult> {
  return anonymizeCustomerAdmin(id);
}

export async function saveAdminSettings(entries: Record<string, string>): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (isApiAdapter()) {
      return { ok: false, error: 'إعدادات المتجر غير متاحة عبر API بعد' };
    }
    if (Object.keys(entries).some((key) => !SETTINGS_ALLOWLIST.has(key))) return { ok: false, error: 'إعداد غير مسموح' };
    if (entries.whatsapp_greeting && entries.whatsapp_greeting.length > 300) return { ok: false, error: 'رسالة الترحيب يجب أن تكون أقل من 300 حرف' };
    if (entries.syp_per_usd && (!Number.isFinite(Number(entries.syp_per_usd)) || Number(entries.syp_per_usd) <= 0 || Number(entries.syp_per_usd) > 1_000_000)) return { ok: false, error: 'سعر صرف الدولار غير صالح' };
    if (entries.ai_high_value_threshold_usd && (!Number.isFinite(Number(entries.ai_high_value_threshold_usd)) || Number(entries.ai_high_value_threshold_usd) < 0)) return { ok: false, error: 'حد قيمة الطلب غير صالح' };
    if (entries.whatsapp_ai_mode && !['AUTO', 'ASSIST', 'MANUAL'].includes(entries.whatsapp_ai_mode)) return { ok: false, error: 'وضع الذكاء الاصطناعي غير صالح' };
    await settingsService.setMany(entries);
    revalidatePath('/settings');
    revalidatePath('/');
    return { ok: true, message: 'تم حفظ الإعدادات' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function setConversationAiState(id: string, aiPaused: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (isApiAdapter()) {
      return { ok: false, error: 'محادثات واتساب غير متاحة عبر API بعد' };
    }
    await conversationService.setFlags(id, { ai_paused: aiPaused, needs_admin: aiPaused });
    revalidatePath('/customers');
    return { ok: true, message: aiPaused ? 'تم استلام المحادثة من الذكاء الاصطناعي' : 'تم إعادة المحادثة للذكاء الاصطناعي' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function saveCategoryAction(input: { id?: string; name: string; slug: string; description?: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = input.name.trim();
    const slug = slugifyAscii(input.slug || name);
    if (name.length < 2) return { ok: false, error: 'اسم التصنيف مطلوب' };
    if (!slug) return { ok: false, error: 'المعرّف النصي غير صالح' };
    if (input.id) await catalogService.updateCategory(input.id, { name, slug, description: input.description ?? null });
    else await catalogService.createCategory({ name, slug, description: input.description ?? null });
    revalidatePath('/categories');
    revalidatePath('/products');
    return { ok: true, message: input.id ? 'تم تحديث التصنيف' : 'تم إنشاء التصنيف' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await catalogService.deleteCategory(id);
    revalidatePath('/categories');
    revalidatePath('/products');
    return { ok: true, message: 'تم حذف التصنيف' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function saveBrandAction(input: { id?: string; name: string; slug: string; description?: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = input.name.trim();
    const slug = slugifyAscii(input.slug || name);
    if (name.length < 2) return { ok: false, error: 'اسم العلامة مطلوب' };
    if (!slug) return { ok: false, error: 'المعرّف النصي غير صالح' };
    if (input.id) await catalogService.updateBrand(input.id, { name, slug, description: input.description ?? null });
    else await catalogService.createBrand({ name, slug, description: input.description ?? null });
    revalidatePath('/brands');
    revalidatePath('/products');
    return { ok: true, message: input.id ? 'تم تحديث العلامة' : 'تم إنشاء العلامة' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await catalogService.deleteBrand(id);
    revalidatePath('/brands');
    revalidatePath('/products');
    return { ok: true, message: 'تم حذف العلامة' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function adjustInventoryAction(input: {
  productId: string;
  type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'RESERVATION' | 'RELEASE';
  quantity: number;
  reason?: string;
  reference?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!Number.isInteger(input.quantity) || input.quantity === 0) {
      return { ok: false, error: 'الكمية يجب أن تكون عدداً صحيحاً غير صفر' };
    }
    await inventoryService.adjust({
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      reference: input.reference,
    });
    revalidatePath('/inventory');
    revalidatePath('/products');
    revalidatePath('/');
    return { ok: true, message: 'تم تسجيل حركة المخزون' };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
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

export async function storeRemoteImage(url: string): Promise<{ ok: boolean; path?: string; error?: string }> {
  await requireAdmin();
  const { fetchRemoteImage, saveProductImage } = await import('@/lib/services/storage');
  const remote = await fetchRemoteImage(url);
  if (!remote) return { ok: false, error: 'تعذر تحميل هذه الصورة، اختر صورة أخرى' };
  const extension = remote.contentType.includes('png') ? 'png' : remote.contentType.includes('webp') ? 'webp' : 'jpg';
  const saved = await saveProductImage(remote.bytes, extension);
  return { ok: true, path: saved.path };
}

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
