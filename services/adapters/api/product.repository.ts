import { apiData, apiFetch, type ApiCollection } from '@/lib/api/client';
import {
  filterProductsClientSide,
  mapProductFiltersToQuery,
  mapProductFromApi,
  mapProductInputToApi,
  type ApiProduct,
} from '@/lib/api/mappers/product';
import type { ProductRepository, ProductListResult } from '../../repositories/product.repository';
import type { AdminProductFilters, ProductInput } from '@/types';

function toQuery(params: Record<string, string>): string {
  const search = new URLSearchParams(params);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const apiProductRepository: ProductRepository = {
  async list(filters: AdminProductFilters = {}): Promise<ProductListResult> {
    const query = mapProductFiltersToQuery(filters);
    // Fetch a wider page when stock filters need client-side narrowing.
    if (filters.stock && filters.stock !== 'all' as string) {
      query.pageSize = '100';
      query.page = '1';
    }
    const response = await apiFetch<ApiCollection<ApiProduct>>(`/products${toQuery(query)}`);
    let rows = (response.data ?? []).map(mapProductFromApi);
    rows = filterProductsClientSide(rows, filters);
    const page = filters.page ?? 1;
    const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 100);
    if (filters.stock && filters.stock !== 'all' as string) {
      const total = rows.length;
      const start = (page - 1) * pageSize;
      return { rows: rows.slice(start, start + pageSize), total, page, pageSize };
    }
    return {
      rows,
      total: response.meta?.total ?? rows.length,
      page: response.meta?.page ?? page,
      pageSize: response.meta?.pageSize ?? pageSize,
    };
  },

  async getById(id) {
    try {
      const product = await apiData<ApiProduct>(`/products/${id}`);
      return mapProductFromApi(product);
    } catch {
      return undefined;
    }
  },

  async getBySku(sku) {
    const response = await apiFetch<ApiCollection<ApiProduct>>(
      `/products${toQuery({ search: sku, page: '1', pageSize: '20' })}`,
    );
    const match = (response.data ?? []).find((row) => row.sku.toUpperCase() === sku.toUpperCase());
    return match ? mapProductFromApi(match) : undefined;
  },

  async create(input: ProductInput) {
    const body = mapProductInputToApi(input);
    if (!body.status) body.status = 'ACTIVE';
    const product = await apiData<ApiProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapProductFromApi(product);
  },

  async update(id, changes) {
    try {
      const body = mapProductInputToApi(changes);
      const product = await apiData<ApiProduct>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return mapProductFromApi(product);
    } catch {
      return undefined;
    }
  },

  async updateExtended() {
    // Extended local-only fields (barcode/cost/image meta) are not in the API product contract yet.
  },

  async delete(id) {
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE', emptyResponse: true });
      return true;
    } catch {
      return false;
    }
  },

  async getLowStock() {
    const response = await apiFetch<ApiCollection<ApiProduct>>('/products?page=1&pageSize=100&status=ACTIVE');
    return (response.data ?? [])
      .map(mapProductFromApi)
      .filter((product) => product.stock_quantity - product.reserved_quantity <= product.low_stock_threshold)
      .slice(0, 50);
  },
};
