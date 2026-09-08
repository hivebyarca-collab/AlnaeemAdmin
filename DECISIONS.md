# Technical Decisions — AL NAEEM Admin

Frozen decisions. Do not reverse without explicit approval and documented reason.

## D-001: No `/admin` URL prefix

This app IS the admin (`admin.alnaeem.com`). Routes live at `/`, `/products`, etc. Legacy `/admin/*` redirects temporarily.

## D-002: Keep Next.js 16 App Router

No framework change. Use route groups `(shell)` for authenticated layout.

## D-003: Service / repository / adapter layering

UI → Services → Repository interface → Adapter (SQLite now, HTTP later). Never import SQLite from UI.

## D-004: SQLite is development-only

Local SQLite behind `services/adapters/sqlite/`. Production uses `al-naeem-api` + PostgreSQL via HTTP adapter.

## D-005: shadcn/ui as primitives only

Use shadcn for Dialog, Sheet, Tabs, Select, etc. Build AL NAEEM-branded composites on top. Do not ship a generic shadcn template look.

## D-006: Customers terminology

Application code uses `customers` (routes, services, components). Database may retain `customer_id`, `listClients` internally in adapters — do not rename DB columns without migration.

## D-007: Arabic RTL first

`lang="ar" dir="rtl"`. Admin shell and tables optimized for Arabic operators.

## D-008: Auth pattern

Server-only secrets. Cookie gate now; real auth from API later. `ADMIN_DEV_BYPASS` for local dev only.

## D-009: Centralized API URL

All future HTTP calls via `lib/api/client.ts` and `API_BASE_URL`. No hardcoded production URLs in components.

## D-010: Documentation required for agents

ARCHITECTURE.md, ADMIN_SYSTEM.md, and this file must be updated when making structural changes.
