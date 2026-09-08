import { sqliteOrderRepository } from './adapters/sqlite/order.repository';
import type { OrderRepository } from './repositories/order.repository';
import type { OrderFilters, OrderStatus } from '@/types';

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}

  listOrders(filters?: OrderFilters) {
    return this.repository.list(filters);
  }

  getOrder(id: string) {
    return this.repository.getById(id);
  }

  getOrderCounts() {
    return this.repository.getCounts();
  }

  updateOrder(
    id: string,
    changes: {
      status?: OrderStatus;
      payment_status?: 'unpaid' | 'paid' | 'refunded';
      notes?: string;
    },
  ) {
    return this.repository.updateAdmin(id, changes);
  }
}

export const orderService = new OrderService(sqliteOrderRepository);
