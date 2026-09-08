import { apiData, apiFetch, type ApiCollection, type ApiEnvelope } from '@/lib/api/client';
import {
  mapBrandFromApi,
  mapCategoryFromApi,
  mapProductFromApi,
  type ApiBrand,
  type ApiCategory,
  type ApiProduct,
} from '@/lib/api/mappers/product';
import {
  mapOrderFromApi,
  type ApiCustomer,
  type ApiOrder,
} from '@/lib/api/mappers/order-customer';
import type {
  BrandWriteInput,
  CatalogRepository,
  CategoryWriteInput,
  ConversationRepository,
  DashboardRepository,
  InventoryAdjustmentInput,
  InventoryListItem,
  InventoryRepository,
  SettingsRepository,
} from '../../repositories/catalog.repository';
import type { DashboardStats, Product } from '@/types';

export const apiCatalogRepository: CatalogRepository = {
  async getCategories() {
    const response = await apiFetch<ApiEnvelope<ApiCategory[]>>('/categories');
    return (response.data ?? []).map(mapCategoryFromApi);
  },
  async getBrands() {
    const response = await apiFetch<ApiEnvelope<ApiBrand[]>>('/brands');
    return (response.data ?? []).map(mapBrandFromApi);
  },
  async createCategory(input: CategoryWriteInput) {
    const category = await apiData<ApiCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapCategoryFromApi(category);
  },
  async updateCategory(id, input) {
    const category = await apiData<ApiCategory>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapCategoryFromApi(category);
  },
  async deleteCategory(id) {
    await apiFetch(`/categories/${id}`, { method: 'DELETE', emptyResponse: true });
  },
  async createBrand(input: BrandWriteInput) {
    const brand = await apiData<ApiBrand>('/brands', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapBrandFromApi(brand);
  },
  async updateBrand(id, input) {
    const brand = await apiData<ApiBrand>(`/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapBrandFromApi(brand);
  },
  async deleteBrand(id) {
    await apiFetch(`/brands/${id}`, { method: 'DELETE', emptyResponse: true });
  },
};

export const apiDashboardRepository: DashboardRepository = {
  async getStats(days = 30): Promise<DashboardStats> {
    const since = Date.now() - days * 86400000;
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      apiFetch<ApiEnvelope<ApiOrder[]>>('/orders'),
      apiFetch<ApiEnvelope<ApiCustomer[]>>('/customers'),
      apiFetch<ApiCollection<ApiProduct>>('/products?page=1&pageSize=100&status=ACTIVE'),
    ]);
    const orders = (ordersRes.data ?? []).map(mapOrderFromApi);
    const products = (productsRes.data ?? []).map(mapProductFromApi);
    const lowStockProducts = products.filter(
      (product) => product.stock_quantity - product.reserved_quantity <= product.low_stock_threshold,
    );
    const recentOrders = orders.slice(0, 6);
    const newOrders = orders.filter(
      (order) => order.status === 'SUBMITTED' && new Date(order.created_at).getTime() >= since,
    ).length;
    const totalSalesUsd = orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0);

    const salesByDayMap = new Map<string, number>();
    for (const order of orders) {
      if (order.status === 'CANCELLED') continue;
      const ts = new Date(order.created_at).getTime();
      if (ts < since) continue;
      const date = order.created_at.slice(0, 10);
      salesByDayMap.set(date, (salesByDayMap.get(date) ?? 0) + order.total);
    }
    const salesByDay = [...salesByDayMap.entries()]
      .map(([date, totalUsd]) => ({ date, totalUsd }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const ordersBySource: Record<string, number> = {};
    const ordersByStatus: Record<string, number> = {};
    for (const order of orders) {
      ordersBySource[order.source] = (ordersBySource[order.source] ?? 0) + 1;
      ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
    }

    return {
      totalSalesUsd,
      newOrders,
      totalCustomers: customersRes.data?.length ?? 0,
      lowStockCount: lowStockProducts.length,
      salesByDay,
      ordersBySource,
      ordersByStatus,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 8),
    };
  },

  async listConversations() {
    // WhatsApp conversations are not in the Admin integration contract yet.
    return [];
  },
};

export const apiSettingsRepository: SettingsRepository = {
  async getAll() {
    return {};
  },
  async setMany() {
    throw new Error('Store settings require a future API endpoint');
  },
  async getAdminUsers() {
    return [];
  },
};

export const apiInventoryRepository: InventoryRepository = {
  async getLowStockProducts(): Promise<Product[]> {
    const rows = await this.listInventory();
    return rows
      .filter((row) => row.quantity - row.reservedQuantity <= row.lowStockThreshold)
      .map((row) => ({
        id: row.productId,
        sku: '',
        slug: '',
        category: '',
        subcategory: '',
        brand: '',
        name: row.productName,
        model: '',
        short_name: row.productName,
        description: '',
        price_usd: null,
        currency: 'USD',
        price_source: null,
        price_checked_at: null,
        stock_quantity: row.quantity,
        reserved_quantity: row.reservedQuantity,
        low_stock_threshold: row.lowStockThreshold,
        is_active: 1,
        is_demo: 0,
        compatibility_type: null,
        specs_json: '{}',
        external_ref: null,
        sync_status: 'CURRENT' as const,
        last_synced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
  },

  async listInventory(): Promise<InventoryListItem[]> {
    const response = await apiFetch<
      ApiEnvelope<
        {
          id: string;
          productId: string;
          quantity: number;
          reservedQuantity: number;
          lowStockThreshold: number;
          product?: { name?: string } | null;
        }[]
      >
    >('/inventory');
    return (response.data ?? []).map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.product?.name ?? row.productId,
      quantity: row.quantity,
      reservedQuantity: row.reservedQuantity,
      lowStockThreshold: row.lowStockThreshold,
    }));
  },

  async adjust(input: InventoryAdjustmentInput) {
    await apiData('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

export const apiConversationRepository: ConversationRepository = {
  async setFlags() {
    throw new Error('Conversation flags require a future API endpoint');
  },
};
