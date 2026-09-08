import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { initializeDatabase, createProduct, createOrder, setSettings } from '../../lib/database/index.ts';

const dbPath = process.env.AL_NAEEM_DATABASE_PATH ?? path.join(process.cwd(), 'data', 'local', 'al-naeem.sqlite');
mkdirSync(path.dirname(dbPath), { recursive: true });
initializeDatabase();

const db = new DatabaseSync(dbPath);
const seedCategories = [
  ['cpu', 'المعالجات', 'Processors'],
  ['gpu', 'البطاقات الرسومية', 'Graphics Cards'],
  ['accessory', 'الإكسسوارات', 'Accessories'],
];
const seedBrands = ['asus', 'msi', 'logitech', 'sony'];

for (const [id, nameAr, nameEn] of seedCategories) {
  db.prepare('INSERT OR IGNORE INTO categories (id, name_ar, name_en) VALUES (?, ?, ?)').run(id, nameAr, nameEn);
}
for (const brand of seedBrands) {
  db.prepare('INSERT OR IGNORE INTO brands (id, name) VALUES (?, ?)').run(brand, brand.toUpperCase());
}
db.close();

const product = createProduct({
  sku: 'DEMO-GPU-001',
  slug: 'demo-gpu-001',
  category: 'gpu',
  subcategory: 'gpu',
  brand: 'asus',
  name: 'Demo Graphics Card',
  model: 'RTX 4070',
  short_name: 'Demo GPU',
  description: 'Development seed product — not production data.',
  price_usd: 599,
  currency: 'USD',
  price_source: 'SEED',
  price_checked_at: new Date().toISOString(),
  stock_quantity: 5,
  reserved_quantity: 0,
  low_stock_threshold: 2,
  is_active: 1,
  specs_json: '{}',
  sync_status: 'MANUAL',
  compatibility_type: null,
  external_ref: null,
  last_synced_at: null,
});

createOrder({
  contact_name: 'عميل تجريبي',
  contact_phone: '+963900000001',
  total: 599,
  status: 'SUBMITTED',
  items: [{ product_id: product.id, item_name: product.name, quantity: 1, unit_price: 599 }],
});

setSettings({
  store_name: 'AL NAEEM Gaming Store',
  syp_per_usd: '13500',
  whatsapp_greeting: 'مرحباً بك في النعيم!',
  whatsapp_ai_mode: 'MANUAL',
});

console.log('Seed complete. Demo product:', product.sku);
