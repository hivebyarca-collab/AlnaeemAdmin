# AL NAEEM Admin System

Module reference for the admin application. Status as of architecture foundation implementation.

## Dashboard `/`

| Feature | Status |
|---------|--------|
| KPI cards (sales, orders, customers, low stock) | Implemented — SQLite dev data |
| Sales chart (7/30 days) | Implemented |
| Recent orders table | Implemented |
| WhatsApp attention queue | Implemented |
| Low stock list | Implemented |
| Quick actions | Implemented |

## Catalog

### Products `/products`

| Feature | Status |
|---------|--------|
| Search, filter, pagination | Implemented |
| Create / edit / delete | Implemented |
| Image search, crop, upload | Implemented (Serper optional) |
| Barcode generation | Implemented |
| Featured / sale price / SEO | Planned — API |

### Categories `/categories`

| Feature | Status |
|---------|--------|
| List from database | Implemented (read-only) |
| CRUD management | Planned — API |

### Brands `/brands`

| Feature | Status |
|---------|--------|
| List from database | Implemented (read-only) |
| CRUD management | Planned — API |

## Inventory `/inventory`

| Feature | Status |
|---------|--------|
| Low stock overview | Implemented |
| Stock adjustments | Planned — API |
| Multi-location inventory | Planned — API |

## Orders `/orders`

| Feature | Status |
|---------|--------|
| List with source/status/payment filters | Implemented |
| Order detail + status update | Implemented |
| Manual order creation | Planned — API |
| Order timeline | Planned — API |

## Customers `/customers`

| Feature | Status |
|---------|--------|
| List + search | Implemented |
| Detail + edit + anonymize | Implemented |
| WhatsApp conversation view | Implemented (read) |

## Marketing

### Promotions `/promotions`

Scaffold only — discounts, featured products, banners require API.

## Content

### Website `/website`

Scaffold only — homepage CMS requires API.

### Media `/media`

Scaffold only — media library requires API + object storage.

## Administration

### Users `/users`

Read-only list of ADMIN/STAFF from SQLite. Full RBAC requires API.

### Settings `/settings`

| Feature | Status |
|---------|--------|
| Store, website, product, order settings | Implemented (SQLite) |
| WhatsApp / AI integration status | Implemented |
| Working hours UI | Implemented (save fixed) |
| Admin user management | Read-only |

## Integrations (server-side)

| Integration | Status |
|-------------|--------|
| Serper image search | Optional env |
| WhatsApp Cloud API | Optional env |
| AI agent | Optional env |
| WhatsApp webhook route | Not implemented yet |
