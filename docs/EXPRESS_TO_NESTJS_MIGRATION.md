# Express.js to NestJS Migration Audit

## Status

- Migration branch: `feature/express-to-nestjs-migration`
- Base: `feature/scalable-frontend-architecture`
- Strategy: incremental migration; keep Express runnable until NestJS passes verification.
- Database: PostgreSQL through Prisma 7.10.1 and `@prisma/adapter-pg`.
- Existing frontend: Next.js App Router, React 19, API base configured by `NEXT_PUBLIC_API_URL` (fallback `http://localhost:5000`).

## Current backend inventory

The existing Express app mounts these routes under `/api/v1`:

| Route | Existing operations observed | Target NestJS module |
|---|---|---|
| `/auth` | `POST /signup`, `POST /signin`, `POST /refresh`, `POST /logout`, `GET /me` | `AuthModule` |
| `/accounts` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` | `AccountsModule` |
| `/categories` | `GET /`, `POST /`, `PATCH /:id` | `CategoriesModule` |
| `/transactions` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` | `TransactionsModule` |
| `/health/db` | database connectivity check | `HealthModule` |

### Existing middleware and infrastructure

- Helmet security headers.
- CORS with credentials; origin from `CLIENT_ORIGIN`, defaulting to `http://localhost:3000`.
- JSON body limit: 1 MB.
- Cookie parsing.
- Authentication cookies: HttpOnly access token (15 minutes) and opaque refresh token backed by a hashed server-side `Session` row (7 days).
- Password hashing with bcryptjs.
- Zod request validation and explicit JSON response contracts.
- Prisma 7.10.1, PostgreSQL adapter and a `pg` connection pool.
- Existing Prisma schema includes User, Session, Account, Category and Transaction. Account has both `balance` and `openingBalance`.
- The backend code audited so far contains no application WebSocket gateway or Socket.IO server. The observed `ws://localhost:3000/_next/hmr` connection is Next.js development HMR, not a TrackYourMoney backend feature. Do not migrate that development-only connection into NestJS.

## Frontend contract

- API helper: `app/frontend/src/app/lib/api.ts`.
- Default backend URL: `http://localhost:5000`.
- API requests send cookies with `credentials: include`.
- On eligible 401 responses, the helper calls `POST /api/v1/auth/refresh` and retries once.
- Preserve API prefixes, response envelopes, status codes, cookies, refresh rotation, and UI behavior during migration.

## Safety constraints

- Do not change or reset the existing database.
- Preserve Prisma schema and migration history.
- Keep the Express backend in place until NestJS parity and verification are demonstrated.
- Never copy real `.env` secrets into new files; use examples only.
- No claim of successful build/test until the command has actually run.

## Phased execution

1. Audit route contracts, auth, Prisma configuration and frontend API helper. (Started; see inventory above.)
2. Add NestJS foundation and injectable Prisma service.
3. Migrate health and domain modules in small steps, preserving response contracts.
4. Migrate auth/session handling and security middleware.
5. Update frontend API URL only after Nest endpoints are verified.
6. Run type checks, builds, API integration tests and frontend regression checks.
7. Switch deployment only after parity; keep a rollback path to Express.

## Implementation status on this branch

- Added a standalone NestJS API package under `apps/api` with bootstrap, global configuration, validation pipe, CORS, Helmet, cookie parsing, and shutdown hooks.
- Added a lifecycle-managed Prisma service using the existing generated Prisma client and PostgreSQL adapter. The current schema and migrations remain in `app/backend/prisma`; no database migration was run.
- Added `GET /api/v1/health/db`.
- Migrated the existing auth contract into NestJS routes: signup, signin, refresh-token rotation, logout and current-user lookup. Cookie names, token implementation, server-side session hash, and TTL are reused from the existing backend.
- Added a session-aware auth guard and migrated category list/create/rename routes with the existing response envelopes.
- Added root scripts for the NestJS API, existing Next.js frontend, and legacy Express API. The legacy application remains available for rollback.
- The Next.js frontend remains at `app/frontend` for now; it has not been moved or rewritten.

### Current consolidated target

The NestJS implementation now lives in the existing `app/backend` project. There is no planned second backend directory; `app/frontend` remains the single Next.js frontend. The root scripts delegate to those existing project folders.

The backend package's start/build commands now target NestJS. Legacy Express route files are excluded from the NestJS TypeScript build while migration is in progress; they are not mounted by the NestJS bootstrap.

### Endpoint parity tracker

| Endpoint group | Status |
|---|---|
| Auth | Signup, signin, refresh rotation, logout and current-user routes added; runtime parity tests still required |
| Categories | GET, POST, PATCH added; runtime parity tests still required |
| Accounts | GET, POST, PATCH, DELETE added; opening-balance handling included; runtime parity tests still required |
| Transactions | GET, POST, PATCH, DELETE added; balance updates use Prisma transactions; runtime parity tests still required |
| Database health | Added |
| WebSocket | No application WebSocket server found in the audited Express backend; the observed `/_next/hmr` connection is Next.js development HMR |

## Current verification gaps

- The repository connector can create and inspect GitHub files, but it does not execute the repository's npm scripts.
- No root lockfile has been generated yet; run npm install from the repository root locally and commit the resulting package-lock after reviewing the dependency graph.
- Local build, database connectivity, end-to-end tests, and runtime WebSocket behavior have not been run in this session.
- Authentication route review is in progress; complete parity must be verified before cutover.
