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
  list: async (filters) => listAdminProducts(filters),
  getById: async (id) => getProduct(id),
  getBySku: async (sku) => getProductBySku(sku),
  create: async (input) => createProduct(input),
  update: async (id, changes) => updateProduct(id, changes),
  updateExtended: async (id, extended) => {
    updateProductExtended(id, extended);
  },
  delete: async (id) => deleteProduct(id),
  getLowStock: async () => getLowStockProducts(),
};
