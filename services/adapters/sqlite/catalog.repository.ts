import {
  getBrands,
  getCategories,
  getDashboardStats,
  getLowStockProducts,
  getSettings,
  getUsers,
  listConversations,
  setConversationFlags,
  setSettings,
} from '@/lib/database';
import type {
  CatalogRepository,
  ConversationRepository,
  DashboardRepository,
  InventoryRepository,
  SettingsRepository,
} from '../../repositories/catalog.repository';

function unsupported(action: string): never {
  throw new Error(`SQLite adapter does not support ${action}. Use DATA_ADAPTER=api.`);
}

export const sqliteCatalogRepository: CatalogRepository = {
  getCategories: async () => getCategories(),
  getBrands: async () => getBrands(),
  createCategory: async () => unsupported('createCategory'),
  updateCategory: async () => unsupported('updateCategory'),
  deleteCategory: async () => unsupported('deleteCategory'),
  createBrand: async () => unsupported('createBrand'),
  updateBrand: async () => unsupported('updateBrand'),
  deleteBrand: async () => unsupported('deleteBrand'),
};

export const sqliteDashboardRepository: DashboardRepository = {
  getStats: async (days) => getDashboardStats(days),
  listConversations: async (needsAttentionOnly) => listConversations(needsAttentionOnly),
};

export const sqliteSettingsRepository: SettingsRepository = {
  getAll: async () => getSettings(),
  setMany: async (entries) => {
    setSettings(entries);
  },
  getAdminUsers: async () => getUsers().filter((user) => user.role !== 'CUSTOMER'),
};

export const sqliteInventoryRepository: InventoryRepository = {
  getLowStockProducts: async () => getLowStockProducts(),
  listInventory: async () =>
    getLowStockProducts().map((product) => ({
      id: product.id,
      productId: product.id,
      productName: product.name,
      quantity: product.stock_quantity,
      reservedQuantity: product.reserved_quantity,
      lowStockThreshold: product.low_stock_threshold,
    })),
  adjust: async () => unsupported('inventory.adjust'),
};

export const sqliteConversationRepository: ConversationRepository = {
  setFlags: async (id, flags) => {
    setConversationFlags(id, flags);
  },
};
