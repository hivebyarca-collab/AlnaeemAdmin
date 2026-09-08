import { randomUUID } from 'node:crypto';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DATABASE_PATH = process.env.AL_NAEEM_DATABASE_PATH ?? path.join(process.cwd(), 'data', 'local', 'al-naeem.sqlite');
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'database', 'schema.sql');

export type Product = {
  id: string; sku: string; slug: string; category: string; subcategory: string; brand: string;
  name: string; model: string; short_name: string; description: string; price_usd: number | null; currency: string;
  price_source: string | null; price_checked_at: string | null; stock_quantity: number; reserved_quantity: number;
  low_stock_threshold: number; is_active: number; is_demo: number; compatibility_type: string | null;
  specs_json: string; external_ref: string | null; sync_status: 'CURRENT' | 'STALE' | 'NEEDS_CHECK' | 'MANUAL';
  last_synced_at: string | null; created_at: string; updated_at: string;
  cost_price?: number | null; barcode?: string | null; image_path?: string | null; image_source_url?: string | null;
  image_source_domain?: string | null; image_width?: number | null; image_height?: number | null;
};
export type User = {
  id: string; full_name: string; phone: string | null; email: string | null; role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status: string; language: string; theme: string; location: string; is_demo: number; created_at: string; updated_at: string;
  notes?: string | null; is_disabled?: number;
};
export type OrderStatus = 'SUBMITTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_demo'> & { id?: string; is_demo?: number };
export type OrderInput = {
  customer_id?: string; pc_build_id?: string; total: number; currency?: string; status?: OrderStatus; is_demo?: number;
  contact_name: string; contact_phone: string; contact_email?: string;
  items: Array<{ product_id?: string; pc_build_id?: string; item_name: string; quantity: number; unit_price: number }>;
};
export type PcBuildInput = {
  id?: string; user_id?: string; name: string; case_name?: string; accessories?: unknown[]; total: number; is_demo?: number;
  compatibility: number; status?: string; items: Array<{ product_id?: string; item_type: string; item_name: string; quantity?: number; price: number }>;
};
export type PcBuild = { id: string; user_id: string | null; name: string; case_name: string | null; accessories: string; total: number; compatibility: number; status: string; is_demo: number; created_at: string; updated_at: string; items: Record<string, SQLInputValue>[] };
export type OrderRow = {
  id: string; customer_id: string | null; pc_build_id: string | null; total: number; currency: string;
  status: OrderStatus; contact_name: string; contact_phone: string; contact_email: string | null;
  created_at: string; updated_at: string; items: Array<Record<string, unknown>>;
};
export type MaintenanceRequestInput = {
  device: string; problem: string; description: string; specifications?: string; customer_id?: string;
  phone: string; preferred_contact: string; status?: string;
};

function openDatabase() {
  mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
  const database = new DatabaseSync(DATABASE_PATH, { enableForeignKeyConstraints: true, timeout: 5000 });
  database.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  return database;
}

function withDatabase<T>(operation: (database: DatabaseSync) => T): T {
  const database = openDatabase();
  try { return operation(database); } finally { database.close(); }
}

function now() { return new Date().toISOString(); }
function optional(value: string | undefined): string | null { return value ?? null; }

function validateProductInput(input: { price_usd: number | null; price_source: string | null; price_checked_at: string | null; stock_quantity: number; reserved_quantity: number; low_stock_threshold: number; specs_json: string }) {
  if (input.price_usd !== null && (!Number.isFinite(input.price_usd) || input.price_usd < 0)) throw new Error('price_usd must be null or a non-negative number');
  if (input.price_usd !== null && (!input.price_source || !input.price_checked_at)) throw new Error('price snapshots require price_source and price_checked_at');
  if (!Number.isInteger(input.stock_quantity) || input.stock_quantity < 0) throw new Error('stock_quantity must be a non-negative integer');
  if (!Number.isInteger(input.reserved_quantity) || input.reserved_quantity < 0 || input.reserved_quantity > input.stock_quantity) throw new Error('reserved_quantity must be between zero and stock_quantity');
  if (!Number.isInteger(input.low_stock_threshold) || input.low_stock_threshold < 0) throw new Error('low_stock_threshold must be a non-negative integer');
  try { JSON.parse(input.specs_json); } catch { throw new Error('specs_json must contain valid JSON'); }
}

export function initializeDatabase() { return withDatabase(() => undefined); }

export function getProducts(): Product[] {
  return withDatabase((database) => database.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as unknown as Product[]);
}
export function getProduct(id: string): Product | undefined {
  return withDatabase((database) => database.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined);
}
export function createProduct(input: ProductInput): Product {
  const id = input.id ?? randomUUID(); const timestamp = now();
  validateProductInput(input);
  return withDatabase((database) => {
    database.prepare(`INSERT INTO products (id, sku, slug, category, subcategory, brand, name, model, short_name, description, price_usd, currency, price_source, price_checked_at, stock_quantity, reserved_quantity, low_stock_threshold, is_active, is_demo, compatibility_type, specs_json, external_ref, sync_status, last_synced_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, input.sku, input.slug, input.category, input.subcategory, input.brand, input.name, input.model, input.short_name, input.description, input.price_usd, input.currency, input.price_source, input.price_checked_at, input.stock_quantity, input.reserved_quantity, input.low_stock_threshold, input.is_active, input.is_demo ?? 0, input.compatibility_type, input.specs_json, input.external_ref, input.sync_status, input.last_synced_at, timestamp, timestamp);
    return database.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product;
  });
}
export function updateProduct(id: string, changes: Partial<ProductInput>): Product | undefined {
  const allowed = ['sku', 'slug', 'category', 'subcategory', 'brand', 'name', 'model', 'short_name', 'description', 'price_usd', 'currency', 'price_source', 'price_checked_at', 'stock_quantity', 'reserved_quantity', 'low_stock_threshold', 'is_active', 'compatibility_type', 'specs_json', 'external_ref', 'sync_status', 'last_synced_at'] as const;
  return withDatabase((database) => {
    const current = database.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
    if (!current) return undefined;
    const next = { ...current, ...changes };
    validateProductInput(next);
    const fields = allowed.filter((field) => changes[field] !== undefined);
    if (fields.length) database.prepare(`UPDATE products SET ${fields.map((field) => `${field} = ?`).join(', ')}, updated_at = ? WHERE id = ?`).run(...fields.map((field) => changes[field] as SQLInputValue), now(), id);
    return database.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
  });
}
export function updateProductExtended(id: string, extended: { cost_price?: number | null; barcode?: string | null; image_path?: string | null; image_source_url?: string | null; image_source_domain?: string | null; image_width?: number | null; image_height?: number | null }) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const fields: string[] = []; const parameters: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(extended)) {
      if (value !== undefined) { fields.push(`${key} = ?`); parameters.push(value as SQLInputValue); }
    }
    if (fields.length) database.prepare(`UPDATE products SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(...parameters, now(), id);
  });
}

export function deleteProduct(id: string) { return withDatabase((database) => database.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0); }
export function getLowStockProducts(): Product[] { return withDatabase((database) => database.prepare('SELECT * FROM products WHERE stock_quantity - reserved_quantity <= low_stock_threshold ORDER BY stock_quantity - reserved_quantity ASC').all() as unknown as Product[]); }
export function getProductsByCategory(category: string): Product[] { return withDatabase((database) => database.prepare('SELECT * FROM products WHERE category = ? ORDER BY name').all(category) as unknown as Product[]); }
export function getProductBySku(sku: string): Product | undefined { return withDatabase((database) => database.prepare('SELECT * FROM products WHERE sku = ?').get(sku) as Product | undefined); }
export function getProductByName(name: string): Product | undefined { return withDatabase((database) => database.prepare('SELECT * FROM products WHERE name = ? OR model = ? LIMIT 1').get(name, name) as Product | undefined); }
export function getProductPriceSyp(product: Product): number | null {
  const priceUsd = product.price_usd;
  if (priceUsd === null) return null;
  return withDatabase((database) => {
    const setting = database.prepare("SELECT value FROM site_settings WHERE key = 'syp_per_usd'").get() as { value: string } | undefined;
    const rate = Number(setting?.value);
    return Number.isFinite(rate) ? Math.round(priceUsd * rate) : null;
  });
}

export function getUsers(): User[] { return withDatabase((database) => database.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as unknown as User[]); }
export function getUserById(id: string): User | undefined { return withDatabase((database) => database.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined); }

export function createOrder(input: OrderInput) {
  const id = randomUUID(); const timestamp = now();
  return withDatabase((database) => {
    database.exec('BEGIN');
    try {
      database.prepare(`INSERT INTO orders (id, customer_id, pc_build_id, total, currency, status, contact_name, contact_phone, contact_email, is_demo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, optional(input.customer_id), optional(input.pc_build_id), input.total, input.currency ?? 'USD', input.status ?? 'SUBMITTED', input.contact_name, input.contact_phone, optional(input.contact_email), input.is_demo ?? 0, timestamp, timestamp);
      const item = database.prepare(`INSERT INTO order_items (id, order_id, product_id, pc_build_id, item_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const orderItem of input.items) item.run(randomUUID(), id, optional(orderItem.product_id), optional(orderItem.pc_build_id), orderItem.item_name, orderItem.quantity, orderItem.unit_price);
      const order = database.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
      const items = database.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
      database.exec('COMMIT');
      return { ...order, items } as unknown as OrderRow;
    } catch (error) { database.exec('ROLLBACK'); throw error; }
  });
}
export function getOrders() { return withDatabase((database) => database.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()); }
export function getOrderById(id: string): OrderRow | undefined {
  return withDatabase((database) => {
    const order = database.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) return undefined;
    return { ...order, items: database.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) } as unknown as OrderRow;
  });
}
export function updateOrderStatus(id: string, status: OrderStatus) {
  return withDatabase((database) => {
    database.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), id);
    const order = database.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) return undefined;
    return { ...order, items: database.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) } as unknown as OrderRow;
  });
}

export function savePcBuild(input: PcBuildInput): PcBuild | undefined {
  const id = input.id ?? randomUUID(); const timestamp = now();
  return withDatabase((database) => {
    database.exec('BEGIN');
    try {
      database.prepare(`INSERT INTO pc_builds (id, user_id, name, case_name, accessories, total, compatibility, status, is_demo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, optional(input.user_id), input.name, optional(input.case_name), JSON.stringify(input.accessories ?? []), input.total, input.compatibility, input.status ?? 'DRAFT', input.is_demo ?? 0, timestamp, timestamp);
      const item = database.prepare(`INSERT INTO pc_build_items (id, build_id, product_id, item_type, item_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const buildItem of input.items) item.run(randomUUID(), id, optional(buildItem.product_id), buildItem.item_type, buildItem.item_name, buildItem.quantity ?? 1, buildItem.price);
      const build = database.prepare('SELECT * FROM pc_builds WHERE id = ?').get(id) as unknown as PcBuild;
      const items = database.prepare('SELECT * FROM pc_build_items WHERE build_id = ?').all(id);
      database.exec('COMMIT');
      return { ...build, items } as PcBuild;
    } catch (error) { database.exec('ROLLBACK'); throw error; }
  });
}
export function getPcBuilds(userId?: string): PcBuild[] { return withDatabase((database) => { const builds = database.prepare(userId ? 'SELECT * FROM pc_builds WHERE user_id = ? ORDER BY created_at DESC' : 'SELECT * FROM pc_builds ORDER BY created_at DESC').all(...(userId ? [userId] : [])) as unknown as PcBuild[]; return builds.map((build) => ({ ...build, items: database.prepare('SELECT * FROM pc_build_items WHERE build_id = ?').all(build.id) })); }); }

export function createMaintenanceRequest(input: MaintenanceRequestInput) { const id = randomUUID(); const timestamp = now(); return withDatabase((database) => { database.prepare(`INSERT INTO maintenance_requests (id, device, problem, description, specifications, customer_id, phone, preferred_contact, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, input.device, input.problem, input.description, input.specifications ?? '', optional(input.customer_id), input.phone, input.preferred_contact, input.status ?? 'SUBMITTED', timestamp, timestamp); return database.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(id); }); }
export function getMaintenanceRequests() { return withDatabase((database) => database.prepare('SELECT * FROM maintenance_requests ORDER BY created_at DESC').all()); }

/* ============================ Admin extensions ============================ */

// Additive, idempotent column migrations. Never destroys existing data.
function ensureAdminColumns(database: DatabaseSync) {
  const addColumns = (table: string, columns: Record<string, string>) => {
    const existing = new Set((database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((column) => column.name));
    for (const [name, definition] of Object.entries(columns)) {
      if (!existing.has(name)) database.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    }
  };
  addColumns('products', {
    cost_price: 'REAL', barcode: 'TEXT', image_path: 'TEXT', image_source_url: 'TEXT',
    image_source_domain: 'TEXT', image_width: 'INTEGER', image_height: 'INTEGER',
  });
  addColumns('orders', {
    source: "TEXT NOT NULL DEFAULT 'website'",
    payment_status: "TEXT NOT NULL DEFAULT 'unpaid'",
    conversation_id: 'TEXT REFERENCES whatsapp_conversations(id) ON DELETE SET NULL', notes: 'TEXT',
  });
  addColumns('users', { notes: 'TEXT', is_disabled: 'INTEGER NOT NULL DEFAULT 0' });
}

export type AdminProductFilters = {
  query?: string; category?: string; brand?: string; stock?: 'in' | 'low' | 'out';
  active?: 'active' | 'hidden'; page?: number; pageSize?: number;
};

export function listAdminProducts(filters: AdminProductFilters = {}): { rows: Product[]; total: number; page: number; pageSize: number } {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const conditions: string[] = []; const parameters: SQLInputValue[] = [];
    if (filters.query) { conditions.push('(name LIKE ? OR sku LIKE ? OR model LIKE ? OR brand LIKE ?)'); const like = `%${filters.query}%`; parameters.push(like, like, like, like); }
    if (filters.category && filters.category !== 'all') { conditions.push('category = ?'); parameters.push(filters.category); }
    if (filters.brand && filters.brand !== 'all') { conditions.push('brand = ?'); parameters.push(filters.brand); }
    if (filters.stock === 'out') conditions.push('stock_quantity - reserved_quantity <= 0');
    else if (filters.stock === 'low') conditions.push('stock_quantity - reserved_quantity > 0 AND stock_quantity - reserved_quantity <= low_stock_threshold');
    else if (filters.stock === 'in') conditions.push('stock_quantity - reserved_quantity > low_stock_threshold');
    if (filters.active === 'active') conditions.push('is_active = 1');
    else if (filters.active === 'hidden') conditions.push('is_active = 0');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 100);
    const total = (database.prepare(`SELECT COUNT(*) AS count FROM products ${where}`).get(...parameters) as { count: number }).count;
    const page = Math.max(filters.page ?? 1, 1);
    const rows = database.prepare(`SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...parameters, pageSize, (page - 1) * pageSize) as unknown as Product[];
    return { rows, total, page, pageSize };
  });
}

export function getCategories(): { id: string; name_ar: string; name_en: string }[] {
  return withDatabase((database) => database.prepare('SELECT id, name_ar, name_en FROM categories ORDER BY name_ar').all() as unknown as { id: string; name_ar: string; name_en: string }[]);
}
export function getBrands(): { id: string; name: string }[] {
  return withDatabase((database) => database.prepare('SELECT id, name FROM brands ORDER BY name').all() as unknown as { id: string; name: string }[]);
}

export type Order = {
  id: string; customer_id: string | null; pc_build_id: string | null; total: number; currency: string;
  status: OrderStatus; source: 'website' | 'whatsapp' | 'manual'; payment_status: 'unpaid' | 'paid' | 'refunded';
  conversation_id: string | null; notes: string | null; contact_name: string; contact_phone: string;
  contact_email: string | null; is_demo: number; created_at: string; updated_at: string;
};
export type OrderItem = { id: string; order_id: string; product_id: string | null; pc_build_id: string | null; item_name: string; quantity: number; unit_price: number; is_demo: number };

export type DashboardStats = {
  totalSalesUsd: number; newOrders: number; totalCustomers: number; lowStockCount: number;
  salesByDay: { date: string; totalUsd: number }[]; ordersBySource: Record<string, number>; ordersByStatus: Record<string, number>;
  recentOrders: (Order & { items: OrderItem[] })[]; lowStockProducts: Product[];
};

export function getDashboardStats(days = 30): DashboardStats {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const totalSalesUsd = (database.prepare(`SELECT COALESCE(SUM(total), 0) AS sum FROM orders WHERE status != 'CANCELLED'`).get() as { sum: number }).sum;
    const newOrders = (database.prepare(`SELECT COUNT(*) AS count FROM orders WHERE status = 'SUBMITTED' AND created_at >= ?`).get(since) as { count: number }).count;
    const totalCustomers = (database.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'CUSTOMER' AND is_disabled = 0`).get() as { count: number }).count;
    const lowStockCount = (database.prepare(`SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND stock_quantity - reserved_quantity <= low_stock_threshold`).get() as { count: number }).count;
    const salesByDay = database.prepare(`SELECT substr(created_at, 1, 10) AS date, COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'CANCELLED' AND created_at >= ? GROUP BY date ORDER BY date`).all(since) as unknown as { date: string; totalUsd: number }[];
    for (const row of salesByDay) (row as { totalUsd: number }).totalUsd = (row as unknown as { total: number }).total;
    const bySource: Record<string, number> = {}; const byStatus: Record<string, number> = {};
    for (const row of database.prepare('SELECT source, status, COUNT(*) AS count FROM orders GROUP BY source, status').all() as unknown as { source: string; status: string; count: number }[]) {
      bySource[row.source] = (bySource[row.source] ?? 0) + row.count; byStatus[row.status] = (byStatus[row.status] ?? 0) + row.count;
    }
    return { totalSalesUsd, newOrders, totalCustomers, lowStockCount, salesByDay, ordersBySource: bySource, ordersByStatus: byStatus,
      recentOrders: database.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6').all() as unknown as (Order & { items: OrderItem[] })[],
      lowStockProducts: database.prepare('SELECT * FROM products WHERE is_active = 1 AND stock_quantity - reserved_quantity <= low_stock_threshold ORDER BY stock_quantity - reserved_quantity ASC LIMIT 8').all() as unknown as Product[],
    };
  });
}

export type OrderFilters = { source?: string; status?: string; payment?: string; query?: string; page?: number; pageSize?: number };
export function listOrders(filters: OrderFilters = {}): { rows: (Order & { items: OrderItem[] })[]; total: number; page: number; pageSize: number } {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const conditions: string[] = []; const parameters: SQLInputValue[] = [];
    if (filters.source && filters.source !== 'all') { conditions.push('source = ?'); parameters.push(filters.source); }
    if (filters.status && filters.status !== 'all') { conditions.push('status = ?'); parameters.push(filters.status); }
    if (filters.payment && filters.payment !== 'all') { conditions.push('payment_status = ?'); parameters.push(filters.payment); }
    if (filters.query) { conditions.push('(contact_name LIKE ? OR contact_phone LIKE ? OR id LIKE ?)'); const like = `%${filters.query}%`; parameters.push(like, like, like); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 100);
    const total = (database.prepare(`SELECT COUNT(*) AS count FROM orders ${where}`).get(...parameters) as { count: number }).count;
    const page = Math.max(filters.page ?? 1, 1);
    const rows = database.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...parameters, pageSize, (page - 1) * pageSize) as unknown as (Order & { items: OrderItem[] })[];
    const itemsStatement = database.prepare('SELECT * FROM order_items WHERE order_id = ?');
    for (const order of rows) order.items = itemsStatement.all(order.id) as unknown as OrderItem[];
    return { rows, total, page, pageSize };
  });
}

export function getOrderCounts(): { all: number; website: number; whatsapp: number; byStatus: Record<string, number> } {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const byStatus: Record<string, number> = {}; let all = 0, website = 0, whatsapp = 0;
    for (const row of database.prepare('SELECT source, status, COUNT(*) AS count FROM orders GROUP BY source, status').all() as unknown as { source: string; status: string; count: number }[]) {
      all += row.count; byStatus[row.status] = (byStatus[row.status] ?? 0) + row.count;
      if (row.source === 'website') website += row.count; else if (row.source === 'whatsapp') whatsapp += row.count;
    }
    return { all, website, whatsapp, byStatus };
  });
}

export function updateOrderAdmin(id: string, changes: { status?: OrderStatus; payment_status?: 'unpaid' | 'paid' | 'refunded'; notes?: string }) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const fields: string[] = []; const parameters: SQLInputValue[] = [];
    if (changes.status) { fields.push('status = ?'); parameters.push(changes.status); }
    if (changes.payment_status) { fields.push('payment_status = ?'); parameters.push(changes.payment_status); }
    if (changes.notes !== undefined) { fields.push('notes = ?'); parameters.push(changes.notes); }
    if (!fields.length) return false;
    return database.prepare(`UPDATE orders SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(...parameters, now(), id).changes > 0;
  });
}

export function createManualOrder(input: { contact_name: string; contact_phone: string; notes?: string; items: { product_id?: string; item_name: string; quantity: number; unit_price: number }[] }) {
  const order = createOrder({ ...input, total: input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), status: 'CONFIRMED' }) as unknown as { id: string };
  withDatabase((database) => { ensureAdminColumns(database); database.prepare("UPDATE orders SET source = 'manual', notes = ? WHERE id = ?").run(input.notes ?? null, order.id); });
  return getOrderById(order.id);
}

export type ClientRow = {
  id: string; full_name: string; phone: string | null; email: string | null; status: string; is_disabled: number;
  notes: string | null; sources: string[]; orderCount: number; totalSpentUsd: number; lastOrderAt: string | null;
};

export function listClients(query?: string): ClientRow[] {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const rows = database.prepare(`
      SELECT u.id, u.full_name, u.phone, u.email, u.status, u.is_disabled, u.notes,
        COALESCE(o.order_count, 0) AS order_count, COALESCE(o.total_spent, 0) AS total_spent, o.last_order_at,
        o.sources
      FROM users u
      LEFT JOIN (
        SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent, MAX(created_at) AS last_order_at,
          GROUP_CONCAT(DISTINCT source) AS sources
        FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id
      ) o ON o.customer_id = u.id
      WHERE u.role = 'CUSTOMER'
      ORDER BY COALESCE(o.last_order_at, u.created_at) DESC
    `).all() as unknown as (ClientRow & { order_count: number; total_spent: number; sources: string | null })[];
    const result = rows.map((row) => ({ ...row, orderCount: row.order_count, totalSpentUsd: row.total_spent, sources: row.sources ? row.sources.split(',') : [] }));
    if (!query) return result;
    const needle = query.trim().toLowerCase();
    return result.filter((row) => row.full_name.toLowerCase().includes(needle) || row.phone?.includes(needle) || row.email?.toLowerCase().includes(needle));
  });
}

export function getClientDetail(id: string) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const user = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as (User & { notes?: string | null; is_disabled?: number }) | undefined;
    if (!user) return undefined;
    const orders = database.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(id) as unknown as Order[];
    const conversation = user.phone
      ? database.prepare('SELECT * FROM whatsapp_conversations WHERE phone = ? OR client_id = ?').get(normalizePhone(user.phone), id)
      : undefined;
    const messages = conversation ? database.prepare('SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY created_at ASC').all((conversation as { id: string }).id) : [];
    const totalSpentUsd = orders.filter((order) => order.status !== 'CANCELLED').reduce((sum, order) => sum + order.total, 0);
    return { user, orders, conversation, messages, totalSpentUsd, addresses: database.prepare('SELECT * FROM addresses WHERE user_id = ?').all(id) };
  });
}

export function updateClient(id: string, changes: { full_name?: string; email?: string | null; phone?: string | null; notes?: string | null; is_disabled?: number }) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const fields: string[] = []; const parameters: SQLInputValue[] = [];
    for (const key of ['full_name', 'email', 'phone', 'notes', 'is_disabled'] as const) {
      if (changes[key] !== undefined) { fields.push(`${key} = ?`); parameters.push(changes[key] as SQLInputValue); }
    }
    if (!fields.length) return false;
    return database.prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(...parameters, now(), id).changes > 0;
  });
}

// Anonymize personal data; orders and financial history are preserved.
export function anonymizeClient(id: string) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    database.prepare("UPDATE users SET full_name = 'عميل محذوف', email = NULL, phone = NULL, notes = NULL, is_disabled = 1, status = 'ANONYMIZED', updated_at = ? WHERE id = ?").run(now(), id);
    database.prepare('DELETE FROM addresses WHERE user_id = ?').run(id);
    database.prepare('UPDATE orders SET contact_name = ? WHERE customer_id = ?').run('عميل محذوف', id);
  });
}

export function getSettings(): Record<string, string> {
  return withDatabase((database) => {
    const rows = database.prepare('SELECT key, value FROM site_settings').all() as unknown as { key: string; value: string }[];
    return Object.fromEntries(rows.map((row) => [String(row.key), String(row.value)]));
  });
}
export function setSettings(entries: Record<string, string>) {
  return withDatabase((database) => {
    const statement = database.prepare('INSERT INTO site_settings (key, value, is_demo, updated_at) VALUES (?, ?, 0, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at');
    for (const [key, value] of Object.entries(entries)) statement.run(key, value, now());
  });
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/* ======================= WhatsApp conversations ======================= */

export type Conversation = {
  id: string; phone: string; display_name: string | null; client_id: string | null;
  ai_paused: number; needs_admin: number; unread_count: number; last_message_at: string | null;
  created_at: string; updated_at: string;
};
export type WhatsAppMessage = {
  id: string; conversation_id: string; direction: 'inbound' | 'outbound'; sender_type: 'customer' | 'ai' | 'admin' | 'system';
  body: string; provider_message_id: string | null; status: string; created_at: string;
};

export function listConversations(needsAttentionOnly = false): (Conversation & { last_body: string | null })[] {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    return database.prepare(`SELECT c.*, (SELECT body FROM whatsapp_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_body
      FROM whatsapp_conversations c ${needsAttentionOnly ? 'WHERE c.needs_admin = 1 OR c.unread_count > 0' : ''} ORDER BY COALESCE(c.last_message_at, c.created_at) DESC LIMIT 20`).all() as unknown as (Conversation & { last_body: string | null })[];
  });
}

export function upsertConversation(phone: string, displayName?: string | null): Conversation {
  const normalized = normalizePhone(phone);
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const existing = database.prepare('SELECT * FROM whatsapp_conversations WHERE phone = ?').get(normalized) as Conversation | undefined;
    if (existing) return existing;
    const id = randomUUID();
    const client = database.prepare('SELECT id FROM users WHERE phone = ?').get(normalized) as { id: string } | undefined;
    database.prepare('INSERT INTO whatsapp_conversations (id, phone, display_name, client_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, normalized, displayName ?? null, client?.id ?? null, now(), now());
    return database.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').get(id) as Conversation;
  });
}

export function insertMessage(input: { conversation_id: string; direction: 'inbound' | 'outbound'; sender_type: 'customer' | 'ai' | 'admin' | 'system'; body: string; provider_message_id?: string | null; status?: string }) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    if (input.provider_message_id) {
      const duplicate = database.prepare('SELECT id FROM whatsapp_messages WHERE provider_message_id = ?').get(input.provider_message_id) as unknown as { id: string } | undefined;
      if (duplicate) return { ...duplicate, inserted: false as const }; // idempotency via provider message id
    }
    const id = randomUUID();
    database.prepare('INSERT INTO whatsapp_messages (id, conversation_id, direction, sender_type, body, provider_message_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, input.conversation_id, input.direction, input.sender_type, input.body, input.provider_message_id ?? null, input.status ?? (input.direction === 'inbound' ? 'received' : 'sent'), now());
    database.prepare('UPDATE whatsapp_conversations SET last_message_at = ?, updated_at = ?, unread_count = unread_count + ? WHERE id = ?')
      .run(now(), now(), input.direction === 'inbound' ? 1 : 0, input.conversation_id);
    return { ...(database.prepare('SELECT * FROM whatsapp_messages WHERE id = ?').get(id) as Record<string, unknown>), inserted: true as const };
  });
}

export function getMessages(conversationId: string): WhatsAppMessage[] {
  return withDatabase((database) => database.prepare('SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId) as unknown as WhatsAppMessage[]);
}

export function setConversationFlags(id: string, flags: { ai_paused?: boolean; needs_admin?: boolean; reset_unread?: boolean }) {
  return withDatabase((database) => {
    ensureAdminColumns(database);
    const sets: string[] = []; const parameters: SQLInputValue[] = [];
    if (flags.ai_paused !== undefined) { sets.push('ai_paused = ?'); parameters.push(flags.ai_paused ? 1 : 0); }
    if (flags.needs_admin !== undefined) { sets.push('needs_admin = ?'); parameters.push(flags.needs_admin ? 1 : 0); }
    if (flags.reset_unread) sets.push('unread_count = 0');
    if (sets.length) database.prepare(`UPDATE whatsapp_conversations SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...parameters, now(), id);
  });
}

export function getConversationById(id: string): Conversation | undefined {
  return withDatabase((database) => database.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').get(id) as Conversation | undefined);
}

