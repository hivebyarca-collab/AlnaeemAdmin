import type { AdminProductFilters, ProductInput } from '@/types';
import { sqliteProductRepository } from './adapters/sqlite/product.repository';
import type { ProductRepository } from './repositories/product.repository';

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  listProducts(filters?: AdminProductFilters) {
    return this.repository.list(filters);
  }

  getProduct(id: string) {
    return this.repository.getById(id);
  }

  getProductBySku(sku: string) {
    return this.repository.getBySku(sku);
  }

  createProduct(input: ProductInput) {
    return this.repository.create(input);
  }

  updateProduct(id: string, changes: Partial<ProductInput>) {
    return this.repository.update(id, changes);
  }

  updateProductExtended(
    id: string,
    extended: Parameters<ProductRepository['updateExtended']>[1],
  ) {
    return this.repository.updateExtended(id, extended);
  }

  deleteProduct(id: string) {
    return this.repository.delete(id);
  }

  getLowStockProducts() {
    return this.repository.getLowStock();
  }
}

export const productService = new ProductService(sqliteProductRepository);
