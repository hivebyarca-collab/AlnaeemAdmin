# AL NAEEM Admin

Independent admin application extracted from the AL NAEEM website.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Local SQLite prototype data layer for current development

## Requirements

- Node.js 22.13 or newer
- npm

## Setup

```bash
npm install
Copy-Item .env.example .env.local
npm run db:init
npm run db:seed
```

Fill only the environment variables you actually use. Do not commit `.env.local`.

## Development

```bash
npm run dev
```

Local URL: `http://localhost:3001`

The admin route currently remains at `/admin` inside this standalone app, so the dashboard URL is `http://localhost:3001/admin`.

## Build

```bash
npm run lint
npm run typecheck
npm run build
```

## Architecture

- `app/admin` contains the admin routes and server actions.
- `components/admin` contains admin UI and forms.
- `lib/database` contains the current local SQLite repository.
- `lib/api.ts` is the future backend API base layer.
- `public/uploads/products` stores local product images used by the prototype admin.

## Planned Backend

The next phase can replace direct local SQLite calls with an `al-naeem-api` service backed by PostgreSQL. Keep production URLs centralized behind `API_BASE_URL` or the API service layer.
