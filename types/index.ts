/** Domain types shared by services, UI, and future API adapters. */
export type {
  Product,
  ProductInput,
  AdminProductFilters,
  Order,
  OrderItem,
  OrderStatus,
  OrderFilters,
  OrderRow,
  User,
  DashboardStats,
  ClientRow as CustomerRow,
  OrderInput,
} from '@/lib/database';

export type Category = { id: string; name_ar: string; name_en: string };
export type Brand = { id: string; name: string };

export type CustomerDetail = {
  user: import('@/lib/database').User & { notes?: string | null; is_disabled?: number };
  orders: import('@/lib/database').Order[];
  conversation: import('@/lib/database').Conversation | undefined;
  messages: unknown[];
  totalSpentUsd: number;
  addresses: unknown[];
};

export type Conversation = import('@/lib/database').Conversation;
export type AdminUser = Pick<import('@/lib/database').User, 'id' | 'full_name' | 'email' | 'role' | 'status'>;
