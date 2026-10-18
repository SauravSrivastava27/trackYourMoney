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

## Current verification gaps

- The repository connector can create and inspect GitHub files, but it does not execute the repository's npm scripts.
- Local build, database connectivity, end-to-end tests, and runtime WebSocket behavior have not been run in this session.
- Authentication route review is in progress; complete parity must be verified before cutover.
