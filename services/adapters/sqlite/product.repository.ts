import {
  createProduct,
  deleteProduct,
  getLowStockProducts,
  getProduct,
  getProductBySku,
  listAdminProducts,
  updateProduct,
  updateProductExtended,
} from '@/lib/database';
import type { ProductRepository } from '../../repositories/product.repository';

export const sqliteProductRepository: ProductRepository = {
  list: listAdminProducts,
  getById: getProduct,
  getBySku: getProductBySku,
  create: createProduct,
  update: updateProduct,
  updateExtended: updateProductExtended,
  delete: deleteProduct,
  getLowStock: getLowStockProducts,
};
