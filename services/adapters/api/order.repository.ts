import { apiData, apiFetch, type ApiCollection, type ApiEnvelope } from '@/lib/api/client';
import {
  mapOrderFromApi,
  mapOrderRowFromApi,
  mapOrderStatusToApi,
  type ApiOrder,
} from '@/lib/api/mappers/order-customer';
import type { OrderFilters } from '@/types';
import type { OrderCounts, OrderListResult, OrderRepository } from '../../repositories/order.repository';

export const apiOrderRepository: OrderRepository = {
  async list(filters: OrderFilters = {}): Promise<OrderListResult> {
    const response = await apiFetch<ApiCollection<ApiOrder> | ApiEnvelope<ApiOrder[]>>('/orders');
    let rows = (Array.isArray(response.data) ? response.data : []).map(mapOrderFromApi);

    if (filters.status && filters.status !== 'all') {
      rows = rows.filter((order) => order.status === filters.status);
    }
    if (filters.source && filters.source !== 'all') {
      rows = rows.filter((order) => order.source === filters.source);
    }
    if (filters.query) {
      const needle = filters.query.trim().toLowerCase();
      rows = rows.filter(
        (order) =>
          order.contact_name.toLowerCase().includes(needle) ||
          order.contact_phone.includes(needle) ||
          order.id.toLowerCase().includes(needle),
      );
    }

    const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
    const page = Math.max(filters.page ?? 1, 1);
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), total, page, pageSize };
  },

  async getById(id) {
    try {
      const order = await apiData<ApiOrder>(`/orders/${id}`);
      return mapOrderRowFromApi(order);
    } catch {
      return undefined;
    }
  },

  async getCounts(): Promise<OrderCounts> {
    const response = await apiFetch<ApiEnvelope<ApiOrder[]>>('/orders');
    const rows = (response.data ?? []).map(mapOrderFromApi);
    const byStatus: Record<string, number> = {};
    for (const order of rows) {
      byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    }
    return {
      all: rows.length,
      website: rows.filter((order) => order.source === 'website').length,
      whatsapp: rows.filter((order) => order.source === 'whatsapp').length,
      byStatus,
    };
  },

  async updateAdmin(id, changes) {
    if (!changes.status) {
      // Payment status / notes are not exposed by PATCH /orders/:id/status yet.
      return false;
    }
    try {
      await apiData(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: mapOrderStatusToApi(changes.status) }),
      });
      return true;
    } catch {
      return false;
    }
  },
};
