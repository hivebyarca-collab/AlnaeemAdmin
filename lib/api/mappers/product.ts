import type { Brand, Category, Product, ProductInput, AdminProductFilters } from '@/types';
import { dollarsToMinor, minorToDollars, slugifyAscii } from './money';

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiBrand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiInventory = {
  id?: string;
  productId?: string;
  quantity: number;
  reservedQuantity?: number;
  lowStockThreshold: number;
};

export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  priceMinor: number;
  salePriceMinor?: number | null;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  featured?: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  category?: ApiCategory | null;
  brand?: ApiBrand | null;
  inventories?: ApiInventory[];
  images?: { id: string; url: string; alt?: string | null; position?: number }[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ApiProductWrite = {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  priceMinor: number;
  salePriceMinor?: number | null;
  currency?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  featured?: boolean;
  categoryId?: string;
  brandId?: string;
  inventory?: { quantity: number; lowStockThreshold: number };
};

function primaryInventory(product: ApiProduct): ApiInventory | undefined {
  return product.inventories?.find((row) => row) ?? product.inventories?.[0];
}

export function mapCategoryFromApi(dto: ApiCategory): Category {
  return { id: dto.id, name_ar: dto.name, name_en: dto.name };
}

export function mapBrandFromApi(dto: ApiBrand): Brand {
  return { id: dto.id, name: dto.name };
}

export function mapProductFromApi(dto: ApiProduct): Product {
  const inventory = primaryInventory(dto);
  const image = dto.images?.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
  const categoryId = dto.categoryId ?? dto.category?.id ?? '';
  const brandId = dto.brandId ?? dto.brand?.id ?? '';
  return {
    id: dto.id,
    sku: dto.sku,
    slug: dto.slug,
    category: categoryId,
    subcategory: categoryId,
    brand: brandId,
    name: dto.name,
    model: dto.name,
    short_name: dto.name,
    description: dto.description ?? '',
    price_usd: minorToDollars(dto.priceMinor),
    currency: dto.currency || 'USD',
    price_source: 'API',
    price_checked_at: dto.updatedAt,
    stock_quantity: inventory?.quantity ?? 0,
    reserved_quantity: inventory?.reservedQuantity ?? 0,
    low_stock_threshold: inventory?.lowStockThreshold ?? 0,
    is_active: dto.status === 'ACTIVE' ? 1 : 0,
    is_demo: 0,
    compatibility_type: null,
    specs_json: '{}',
    external_ref: null,
    sync_status: 'CURRENT',
    last_synced_at: dto.updatedAt,
    created_at: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updated_at: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
    image_path: image?.url ?? null,
  };
}

export function mapProductInputToApi(input: ProductInput | Partial<ProductInput>): ApiProductWrite {
  const name = input.name?.trim() || 'Untitled';
  const sku = input.sku?.trim() || `SKU-${Date.now()}`;
  const slug = input.slug?.trim() || slugifyAscii(`${input.brand ?? ''}-${name}-${sku}`);
  const priceMinor = dollarsToMinor(Number(input.price_usd ?? 0));
  const status: ApiProductWrite['status'] =
    input.is_active === undefined ? undefined : input.is_active ? 'ACTIVE' : 'INACTIVE';

  const body: ApiProductWrite = {
    name,
    slug: slugifyAscii(slug.replace(/[\u0600-\u06FF]/g, '') || `product-${Date.now()}`),
    sku,
    description: input.description?.trim() || undefined,
    priceMinor,
    currency: input.currency || 'USD',
  };

  if (status) body.status = status;
  if (input.category) body.categoryId = input.category;
  if (input.brand) body.brandId = input.brand;
  if (input.stock_quantity !== undefined || input.low_stock_threshold !== undefined) {
    body.inventory = {
      quantity: input.stock_quantity ?? 0,
      lowStockThreshold: input.low_stock_threshold ?? 0,
    };
  }
  return body;
}

export function mapProductFiltersToQuery(filters: AdminProductFilters = {}): Record<string, string> {
  const query: Record<string, string> = {
    page: String(filters.page ?? 1),
    pageSize: String(Math.min(Math.max(filters.pageSize ?? 10, 1), 100)),
  };
  if (filters.query) query.search = filters.query;
  if (filters.category && filters.category !== 'all') query.categoryId = filters.category;
  if (filters.brand && filters.brand !== 'all') query.brandId = filters.brand;
  if (filters.active === 'active') query.status = 'ACTIVE';
  if (filters.active === 'hidden') query.status = 'INACTIVE';
  return query;
}

export function filterProductsClientSide(rows: Product[], filters: AdminProductFilters = {}): Product[] {
  return rows.filter((product) => {
    if (filters.stock === 'out' && product.stock_quantity - product.reserved_quantity > 0) return false;
    if (
      filters.stock === 'low' &&
      !(
        product.stock_quantity - product.reserved_quantity > 0 &&
        product.stock_quantity - product.reserved_quantity <= product.low_stock_threshold
      )
    ) {
      return false;
    }
    if (filters.stock === 'in' && product.stock_quantity - product.reserved_quantity <= product.low_stock_threshold) {
      return false;
    }
    return true;
  });
}
