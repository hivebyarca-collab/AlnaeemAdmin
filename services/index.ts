import {
  sqliteCatalogRepository,
  sqliteConversationRepository,
  sqliteDashboardRepository,
  sqliteInventoryRepository,
  sqliteSettingsRepository,
} from './adapters/sqlite/catalog.repository';

export const catalogService = sqliteCatalogRepository;
export const dashboardService = sqliteDashboardRepository;
export const settingsService = sqliteSettingsRepository;
export const inventoryService = sqliteInventoryRepository;
export const conversationService = sqliteConversationRepository;

export { productService } from './product.service';
export { orderService } from './order.service';
export { customerService } from './customer.service';
