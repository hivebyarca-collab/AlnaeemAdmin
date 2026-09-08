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

export const sqliteCatalogRepository: CatalogRepository = {
  getCategories,
  getBrands,
};

export const sqliteDashboardRepository: DashboardRepository = {
  getStats: getDashboardStats,
  listConversations,
};

export const sqliteSettingsRepository: SettingsRepository = {
  getAll: getSettings,
  setMany: setSettings,
  getAdminUsers: () => getUsers().filter((user) => user.role !== 'CUSTOMER'),
};

export const sqliteInventoryRepository: InventoryRepository = {
  getLowStockProducts: getLowStockProducts,
};

export const sqliteConversationRepository: ConversationRepository = {
  setFlags: setConversationFlags,
};
