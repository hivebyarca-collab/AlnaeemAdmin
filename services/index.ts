import { getDataAdapter } from '@/lib/config/env';
import {
  apiCatalogRepository,
  apiConversationRepository,
  apiDashboardRepository,
  apiInventoryRepository,
  apiSettingsRepository,
} from './adapters/api/catalog.repository';
import {
  sqliteCatalogRepository,
  sqliteConversationRepository,
  sqliteDashboardRepository,
  sqliteInventoryRepository,
  sqliteSettingsRepository,
} from './adapters/sqlite/catalog.repository';

const useApi = getDataAdapter() === 'api';

export const catalogService = useApi ? apiCatalogRepository : sqliteCatalogRepository;
export const dashboardService = useApi ? apiDashboardRepository : sqliteDashboardRepository;
export const settingsService = useApi ? apiSettingsRepository : sqliteSettingsRepository;
export const inventoryService = useApi ? apiInventoryRepository : sqliteInventoryRepository;
export const conversationService = useApi ? apiConversationRepository : sqliteConversationRepository;

export { productService } from './product.service';
export { orderService } from './order.service';
export { customerService } from './customer.service';
