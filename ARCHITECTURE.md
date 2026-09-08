# AL NAEEM Admin — Architecture

Standalone admin application for AL NAEEM Gaming Store. Production domain target: `admin.alnaeem.com`.

## Stack

- Next.js 16 App Router
- React 19, TypeScript (strict)
- Tailwind CSS 4 + AL NAEEM admin theme (`styles/admin.css`)
- shadcn/ui primitives (`components/ui/`) — foundation only, not template UI
- Lucide icons, Tajawal + Inter fonts

## Layer Model

```
Presentation (app/, components/)
        ↓
Features (features/* — domain UI)
        ↓
Services (services/*.service.ts)
        ↓
Repository interfaces (services/repositories/)
        ↓
Data adapters
   ├── SQLite (development) — services/adapters/sqlite/
   └── HTTP/API (future)    — lib/api/client.ts → al-naeem-api
```

**Rule:** UI pages and React components MUST NOT import `@/lib/database`. Only SQLite adapters may do so.

## Folder Structure

```
app/
  (shell)/          Authenticated admin routes (no /admin prefix)
  actions.ts        Server actions → services
  api/              Thin route handlers
components/
  layout/           AdminShell
  shared/           PageHeader, ScaffoldPage
  ui/               shadcn primitives
  admin/            Legacy feature components (migrating to features/)
features/
  customers/        Customer-specific UI
config/
  admin-navigation.ts
services/
  *.service.ts
  repositories/     Interfaces
  adapters/sqlite/  Development implementation
lib/
  database/         INTERNAL — SQLite only, used by adapters
  api/              Future HTTP client
  config/env.ts     Environment helpers
  admin-auth.ts     Session gate
types/              Shared domain types
styles/admin.css    Admin surface styles
```

## Routing

Canonical routes (no `/admin` prefix):

| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/products` | Product list |
| `/products/new` | Create product |
| `/products/:id` | Edit product |
| `/categories` | Categories (read-only dev) |
| `/brands` | Brands (read-only dev) |
| `/inventory` | Low stock overview |
| `/orders` | Order list |
| `/orders/:id` | Order detail |
| `/customers` | Customer list |
| `/customers/:id` | Customer detail |
| `/promotions` | Scaffold |
| `/website` | Scaffold |
| `/media` | Scaffold |
| `/users` | Admin users (read-only) |
| `/settings` | Store settings |

Temporary redirects: `/admin/*` → `/*`, `/clients/*` → `/customers/*`.

## Data Strategy

- **Development:** `DATA_ADAPTER=sqlite` (default). Local file at `data/local/al-naeem.sqlite`.
- **Production (future):** `DATA_ADAPTER=api` + `API_BASE_URL` pointing to `al-naeem-api` (PostgreSQL backend, separate repo).

Switching adapters must not require UI changes — only service adapter wiring in `services/index.ts`.

## Authentication

- Cookie: `al-naeem-admin-session` matched against `AL_NAEEM_ADMIN_SESSION_TOKEN`
- Development: `ADMIN_DEV_BYPASS=true` (never in production)
- Future: JWT/session from `al-naeem-api`

## State

- Server Components fetch via services
- Mutations via Server Actions in `app/actions.ts`
- No global client state library
