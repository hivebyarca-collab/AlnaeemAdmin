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
  list(filters?: AdminProductFilters): Promise<ProductListResult>;
  getById(id: string): Promise<Product | undefined>;
  getBySku(sku: string): Promise<Product | undefined>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, changes: Partial<ProductInput>): Promise<Product | undefined>;
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
  ): Promise<void>;
  delete(id: string): Promise<boolean>;
  getLowStock(): Promise<Product[]>;
}
