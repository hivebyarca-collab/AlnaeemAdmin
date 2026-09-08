# AL NAEEM Admin

Production admin application for AL NAEEM Gaming Store.

**Target domain:** `admin.alnaeem.com`

## Stack

- Next.js 16 App Router · React 19 · TypeScript
- Service layer with SQLite dev adapter (future: `al-naeem-api`)

## Requirements

- Node.js 22.13+
- npm

## Setup (API mode — preferred)

Requires AL NAEEM API running at `http://localhost:4000` with PostgreSQL ready.

```bash
npm install
copy .env.example .env.local   # Windows
```

`.env.local` for local API integration:

```env
DATA_ADAPTER=api
API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
ADMIN_DEV_BYPASS=false
```

Create an API owner admin in the API repo (`npm run admin:create`), then open the Admin login page.

## SQLite fallback (local only)

```env
DATA_ADAPTER=sqlite
ADMIN_DEV_BYPASS=true
```

```bash
npm run db:init
npm run db:seed
```

Never use SQLite or `ADMIN_DEV_BYPASS` in production. API failures must not fall back to SQLite.

## Development

```bash
npm run dev
```

Open: **http://localhost:3001** → `/login` when `DATA_ADAPTER=api`.

## Quality

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — layers, routing, data strategy
- [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) — module status
- [DECISIONS.md](./DECISIONS.md) — frozen technical decisions
- Backend contract: `AlNaeem API/ADMIN_INTEGRATION.md`

## Production env (Admin only)

```env
DATA_ADAPTER=api
API_BASE_URL=https://api.<DOMAIN>/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.<DOMAIN>/api/v1
ADMIN_DEV_BYPASS=false
```

Do not set `DATABASE_URL` or auth signing secrets in the Admin app — those belong to the API.
