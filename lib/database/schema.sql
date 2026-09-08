PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  language TEXT NOT NULL DEFAULT 'ar',
  theme TEXT NOT NULL DEFAULT 'dark',
  location TEXT NOT NULL DEFAULT 'Bahsa',
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL REFERENCES categories(id),
  subcategory TEXT NOT NULL,
  brand TEXT NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_usd REAL CHECK (price_usd IS NULL OR price_usd >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  price_source TEXT,
  price_checked_at TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 2 CHECK (low_stock_threshold >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  compatibility_type TEXT,
  specs_json TEXT NOT NULL DEFAULT '{}',
  external_ref TEXT,
  sync_status TEXT NOT NULL DEFAULT 'MANUAL' CHECK (sync_status IN ('CURRENT', 'STALE', 'NEEDS_CHECK', 'MANUAL')),
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  location TEXT NOT NULL DEFAULT 'Bahsa',
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pc_builds (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  case_name TEXT,
  accessories TEXT NOT NULL DEFAULT '[]',
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  compatibility INTEGER NOT NULL DEFAULT 0 CHECK (compatibility BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'DRAFT',
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pc_build_items (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL REFERENCES pc_builds(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  pc_build_id TEXT REFERENCES pc_builds(id) ON DELETE SET NULL,
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  pc_build_id TEXT REFERENCES pc_builds(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  CHECK (product_id IS NOT NULL OR pc_build_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id TEXT PRIMARY KEY,
  device TEXT NOT NULL,
  problem TEXT NOT NULL,
  description TEXT NOT NULL,
  specifications TEXT NOT NULL DEFAULT '',
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Damascus',
  phone TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity, reserved_quantity, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_builds_user ON pc_builds(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_customer ON maintenance_requests(customer_id);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  wa_contact_id TEXT,
  display_name TEXT,
  client_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ai_paused INTEGER NOT NULL DEFAULT 0 CHECK (ai_paused IN (0, 1)),
  needs_admin INTEGER NOT NULL DEFAULT 0 CHECK (needs_admin IN (0, 1)),
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_conversations_phone ON whatsapp_conversations(phone);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'admin', 'system')),
  body TEXT NOT NULL,
  provider_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'received')),
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation ON whatsapp_messages(conversation_id, created_at);