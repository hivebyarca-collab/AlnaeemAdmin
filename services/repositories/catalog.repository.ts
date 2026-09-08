import type { Brand, Category, DashboardStats } from '@/types';
import type { Conversation } from '@/types';
import type { User } from '@/types';

export interface CatalogRepository {
  getCategories(): Category[];
  getBrands(): Brand[];
}

export interface DashboardRepository {
  getStats(days?: number): DashboardStats;
  listConversations(needsAttentionOnly?: boolean): (Conversation & { last_body: string | null })[];
}

export interface SettingsRepository {
  getAll(): Record<string, string>;
  setMany(entries: Record<string, string>): void;
  getAdminUsers(): User[];
}

export interface InventoryRepository {
  getLowStockProducts(): import('@/types').Product[];
}

export interface ConversationRepository {
  setFlags(
    id: string,
    flags: { ai_paused?: boolean; needs_admin?: boolean; reset_unread?: boolean },
  ): void;
}
