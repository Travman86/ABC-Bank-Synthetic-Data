# ABC Bank

A synthetic business-banking data studio for generating, reviewing, and exporting fictional transaction datasets and bank statements.

## Run & Operate

- Use the managed `artifacts/abc-bank: web` workflow to run the React app.
- Use the managed `artifacts/api-server: API Server` workflow to run the API.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — provided by the Replit PostgreSQL database

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React 19, Vite, Tailwind CSS
- Build: Vite (frontend), esbuild (API)

## Where things live

- `artifacts/abc-bank` — the React/Vite user interface
- `artifacts/api-server` — the Express API, routed under `/api`
- `lib/api-spec` — the OpenAPI source contract
- `lib/api-client-react` — generated React Query API client
- `lib/api-zod` — generated Zod request and response schemas
- `lib/db` — Drizzle schema and PostgreSQL connection

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Generate fictional business banking datasets.
- Review account overviews and transaction ledgers.
- Export generated data and download synthetic bank statements.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm install --frozen-lockfile` after a fresh import before starting workflows.
- Access the API through `/api`; artifact workflow ports are assigned dynamically.
- Regenerate API clients and schemas after changing the OpenAPI contract.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
