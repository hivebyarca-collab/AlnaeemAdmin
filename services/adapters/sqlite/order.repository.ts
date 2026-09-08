import { getOrderById, getOrderCounts, listOrders, updateOrderAdmin } from '@/lib/database';
import type { OrderRepository } from '../../repositories/order.repository';

export const sqliteOrderRepository: OrderRepository = {
  list: listOrders,
  getById: getOrderById,
  getCounts: getOrderCounts,
  updateAdmin: updateOrderAdmin,
};
