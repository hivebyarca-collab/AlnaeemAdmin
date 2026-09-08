import type { Order, OrderFilters, OrderItem, OrderRow, OrderStatus } from '@/types';

export type OrderListResult = {
  rows: (Order & { items: OrderItem[] })[];
  total: number;
  page: number;
  pageSize: number;
};

export type OrderCounts = {
  all: number;
  website: number;
  whatsapp: number;
  byStatus: Record<string, number>;
};

export interface OrderRepository {
  list(filters?: OrderFilters): OrderListResult;
  getById(id: string): OrderRow | undefined;
  getCounts(): OrderCounts;
  updateAdmin(
    id: string,
    changes: {
      status?: OrderStatus;
      payment_status?: 'unpaid' | 'paid' | 'refunded';
      notes?: string;
    },
  ): boolean;
}
