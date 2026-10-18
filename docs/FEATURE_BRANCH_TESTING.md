# Feature Branch Test Checklist

Branch: `feature/scalable-frontend-architecture`

## Added in this branch

- Shared UI primitives: Button, Alert, LoadingState, Modal, PageHeader, StatCard, and EmptyState.
- Typed Redux hooks.
- ErrorBoundary integrated into the shared layout.
- Transaction API: list/search/type filter, create, update, and delete.
- Category API and category management page.
- Transaction page with account/category selection, validation, search, type filtering, and delete confirmation.
- Account balances are adjusted transactionally when income/expense transactions are created, edited, or deleted.
- Dashboard summaries now read account and transaction data.
- Reports page for INR income, expenses, net cash flow, and expense categories.
- Rule-based Money Insights page. This is not an external LLM/AI integration.

## Local verification

Run in separate terminals from the repository root.

Backend:
```bash
cd app/backend
npm ci
npm run build
npm run dev
```

Frontend:
```bash
cd app/frontend
npm ci
npm run lint
npm run build
npm run dev
```

## Manual functional checks

1. Sign up or sign in.
2. Create an account with an opening balance.
3. Create an expense transaction and verify the account balance decreases by that amount.
4. Edit the transaction amount/type/account and verify the old balance effect is reversed and the new effect is applied.
5. Delete the transaction and verify its balance effect is reversed.
6. Create income and expense categories, then assign a matching category to a transaction.
7. Verify another user's account/category IDs cannot be used in transaction requests.
8. Search transactions and filter by income/expense.
9. Verify dashboard summaries, recent transactions, reports, and insights update after mutations.
10. Test modal keyboard Escape, Tab focus cycling, backdrop close, and focus restoration.
11. Test light/dark theme and mobile navigation at narrow viewport widths.

## Known scope limits

- Budgets and savings goals are still not implemented; the current Prisma schema has no corresponding models. They need a reviewed schema change, migration, generated Prisma client, and CRUD/UI tests.
- Recurring transactions, CSV import/export, and real LLM-powered insights are not implemented in this branch.
- Transaction listing currently returns up to 100 records per request. Reports and client-side summaries therefore cover the latest returned records, not an unlimited history.
- Account balances are treated as the opening/current balance and are adjusted by transaction create/edit/delete. Do not import transactions that have already been reflected in the account's opening balance without reconciling that opening balance first.

No local build or live database integration test has been run by the remote editing environment. Complete the commands and manual checks above before merging to `main`.
