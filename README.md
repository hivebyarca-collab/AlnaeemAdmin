# AL NAEEM Admin

Standalone production admin for AL NAEEM Gaming Store.

**Target domain:** `admin.alnaeem.com` (Vercel)

## Stack

- Next.js 16 App Router · React 19 · TypeScript
- HTTP adapter → AL NAEEM API → PostgreSQL (production)
- SQLite adapter for **local development only**

## Requirements

- Node.js 22.13+
- npm
- Running AL NAEEM API for production / API-mode local work

## Setup (API mode — preferred)

```bash
npm install
copy .env.example .env.local   # Windows
```

```env
DATA_ADAPTER=api
API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
ADMIN_DEV_BYPASS=false
```

Create an API owner in the API repo (`npm run admin:create`), then open `/login`.

## SQLite fallback (local only)

```env
DATA_ADAPTER=sqlite
ADMIN_DEV_BYPASS=true
```

```bash
npm run db:init
npm run db:seed
```

Never use SQLite or `ADMIN_DEV_BYPASS` on Vercel. API failures must not fall back to SQLite.

## Development

```bash
npm run dev
```

Open: **http://localhost:3001** → `/login` when `DATA_ADAPTER=api`.

Canonical routes stay at the root: `/`, `/products`, `/orders`, `/customers`, `/settings`, …

## Vercel deployment

1. Import this GitHub repo into Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Set environment variables (Production + Preview as needed):

```env
API_BASE_URL=https://api.<DOMAIN>/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.<DOMAIN>/api/v1
ADMIN_DEV_BYPASS=false
```

4. Do **not** set `DATABASE_URL` here — Postgres lives on the API / Railway.
5. Ensure the API CORS allow-list includes `https://admin.alnaeem.com`.
6. Node.js version **22.x** on Vercel.

### Auth note

Production auth is **API-owned** (`POST /auth/login`, `GET /auth/me`, HttpOnly session cookie mirrored for SSR).  
`ADMIN_DEV_BYPASS` is development-only and cannot activate on Vercel/production.

CUSTOMER accounts cannot use Admin login (API admin auth + role allowlist).

### Known production limits until Railway/API media land

- Local disk image uploads are disabled on Vercel (use future API object storage).
- Settings / WhatsApp / AI remain optional env-gated or pending API endpoints.

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
