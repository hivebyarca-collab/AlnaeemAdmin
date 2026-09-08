import type { Brand, Category, DashboardStats, Conversation, Product, User } from '@/types';

export type CategoryWriteInput = { name: string; slug: string; description?: string | null };
export type BrandWriteInput = { name: string; slug: string; description?: string | null; logoUrl?: string | null };

export type InventoryAdjustmentInput = {
  productId: string;
  variantId?: string | null;
  type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'RESERVATION' | 'RELEASE';
  quantity: number;
  reason?: string;
  reference?: string;
};

export type InventoryListItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
};

export interface CatalogRepository {
  getCategories(): Promise<Category[]>;
  getBrands(): Promise<Brand[]>;
  createCategory(input: CategoryWriteInput): Promise<Category>;
  updateCategory(id: string, input: Partial<CategoryWriteInput>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  createBrand(input: BrandWriteInput): Promise<Brand>;
  updateBrand(id: string, input: Partial<BrandWriteInput>): Promise<Brand>;
  deleteBrand(id: string): Promise<void>;
}

export interface DashboardRepository {
  getStats(days?: number): Promise<DashboardStats>;
  listConversations(needsAttentionOnly?: boolean): Promise<(Conversation & { last_body: string | null })[]>;
}

export interface SettingsRepository {
  getAll(): Promise<Record<string, string>>;
  setMany(entries: Record<string, string>): Promise<void>;
  getAdminUsers(): Promise<User[]>;
}

export interface InventoryRepository {
  getLowStockProducts(): Promise<Product[]>;
  listInventory(): Promise<InventoryListItem[]>;
  adjust(input: InventoryAdjustmentInput): Promise<void>;
}

export interface ConversationRepository {
  setFlags(
    id: string,
    flags: { ai_paused?: boolean; needs_admin?: boolean; reset_unread?: boolean },
  ): Promise<void>;
}
