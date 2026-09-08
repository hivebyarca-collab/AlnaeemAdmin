import type {
  AdminProductFilters,
  Product,
  ProductInput,
} from '@/types';

export type ProductListResult = {
  rows: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ProductRepository {
  list(filters?: AdminProductFilters): ProductListResult;
  getById(id: string): Product | undefined;
  getBySku(sku: string): Product | undefined;
  create(input: ProductInput): Product;
  update(id: string, changes: Partial<ProductInput>): Product | undefined;
  updateExtended(
    id: string,
    extended: {
      cost_price?: number | null;
      barcode?: string | null;
      image_path?: string | null;
      image_source_url?: string | null;
      image_source_domain?: string | null;
      image_width?: number | null;
      image_height?: number | null;
    },
  ): void;
  delete(id: string): boolean;
  getLowStock(): Product[];
}
