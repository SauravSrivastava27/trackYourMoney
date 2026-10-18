# NestJS backend

This folder is the replacement API implementation for the previous Express server.

- `main.ts`: NestJS bootstrap, CORS, Helmet, cookie parsing and validation.
- `nest-app.module.ts`: root module and API module registration.
- `nest/database.module.ts`: shared Prisma service and PostgreSQL pool lifecycle.
- `nest/auth*`: authentication, refresh-token rotation and session-aware guard.
- `nest/accounts.module.ts`: account CRUD and opening-balance invariant.
- `nest/categories.module.ts`: category CRUD.
- `nest/transactions.module.ts`: transaction CRUD with atomic balance updates.
- `nest/health.controller.ts`: database readiness endpoint.

The existing Prisma schema, migrations, generated client and token utilities are reused. The frontend API prefix remains `/api/v1`; set `NEXT_PUBLIC_API_URL` to the backend origin as before.

Do not run database migrations or switch production traffic until dependency installation, typecheck, build and API regression tests pass.