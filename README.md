# AL NAEEM Admin

Production admin application for AL NAEEM Gaming Store.

**Target domain:** `admin.alnaeem.com`

## Stack

- Next.js 16 App Router · React 19 · TypeScript
- Service layer with SQLite dev adapter (future: `al-naeem-api`)

## Requirements

- Node.js 22.13+
- npm

## Setup

```bash
npm install
copy .env.example .env.local   # Windows
npm run db:init
npm run db:seed
```

Set `ADMIN_DEV_BYPASS=true` in `.env.local` for local development without cookie auth.

## Development

```bash
npm run dev
```

Open: **http://localhost:3001**

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

## Future Backend

Replace SQLite adapter with HTTP adapter pointing to `al-naeem-api`. UI and routes remain unchanged.
