/**
 * Shared Admin domain types.
 * Kept free of Node/SQLite imports so client and production bundles stay clean.
 * SQLite and HTTP adapters both map into these shapes.
 */

export type Product = {
  id: string;
  sku: string;
  slug: string;
  category: string;
  subcategory: string;
  brand: string;
  name: string;
  model: string;
  short_name: string;
  description: string;
  price_usd: number | null;
  currency: string;
  price_source: string | null;
  price_checked_at: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: number;
  is_demo: number;
  brand_label?: string;
  category_label?: string;
  compatibility_type: string | null;
  specs_json: string;
  external_ref: string | null;
  sync_status: 'CURRENT' | 'STALE' | 'NEEDS_CHECK' | 'MANUAL';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  cost_price?: number | null;
  barcode?: string | null;
  image_path?: string | null;
  image_source_url?: string | null;
  image_source_domain?: string | null;
  image_width?: number | null;
  image_height?: number | null;
};

export type User = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status: string;
  language: string;
  theme: string;
  location: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  is_disabled?: number;
};

export type OrderStatus = 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_demo'> & {
  id?: string;
  is_demo?: number;
};

export type OrderInput = {
  customer_id?: string;
  pc_build_id?: string;
  total: number;
  currency?: string;
  status?: OrderStatus;
  is_demo?: number;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  items: Array<{ product_id?: string; pc_build_id?: string; item_name: string; quantity: number; unit_price: number }>;
};

export type Order = {
  id: string;
  customer_id: string | null;
  pc_build_id: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  source: 'website' | 'whatsapp' | 'manual';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  conversation_id: string | null;
  notes: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  is_demo: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  pc_build_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  is_demo: number;
};

export type OrderRow = {
  id: string;
  customer_id: string | null;
  pc_build_id: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
  items: Array<Record<string, unknown>>;
};

export type OrderFilters = {
  source?: string;
  status?: string;
  payment?: string;
  query?: string;
  page?: number;
  pageSize?: number;
};

export type AdminProductFilters = {
  query?: string;
  category?: string;
  brand?: string;
  stock?: 'in' | 'low' | 'out';
  active?: 'active' | 'hidden';
  page?: number;
  pageSize?: number;
};

export type DashboardStats = {
  totalSalesUsd: number;
  newOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  salesByDay: { date: string; totalUsd: number }[];
  ordersBySource: Record<string, number>;
  ordersByStatus: Record<string, number>;
  recentOrders: (Order & { items: OrderItem[] })[];
  lowStockProducts: Product[];
};

export type ClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  is_disabled: number;
  notes: string | null;
  sources: string[];
  orderCount: number;
  totalSpentUsd: number;
  lastOrderAt: string | null;
};

export type Conversation = {
  id: string;
  phone: string;
  display_name: string | null;
  client_id: string | null;
  ai_paused: number;
  needs_admin: number;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = { id: string; name_ar: string; name_en: string };
export type Brand = { id: string; name: string };

export type CustomerDetail = {
  user: User & { notes?: string | null; is_disabled?: number };
  orders: Order[];
  conversation: Conversation | undefined;
  messages: unknown[];
  totalSpentUsd: number;
  addresses: unknown[];
};

export type AdminUser = Pick<User, 'id' | 'full_name' | 'email' | 'role' | 'status'>;
