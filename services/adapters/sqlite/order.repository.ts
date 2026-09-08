import {
  getOrderById,
  getOrderCounts,
  listOrders,
  updateOrderAdmin,
} from '@/lib/database';
import type { OrderRepository } from '../../repositories/order.repository';

export const sqliteOrderRepository: OrderRepository = {
  list: async (filters) => listOrders(filters),
  getById: async (id) => getOrderById(id),
  getCounts: async () => getOrderCounts(),
  updateAdmin: async (id, changes) => updateOrderAdmin(id, changes),
};
