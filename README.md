# FinTrack AI — Personal Finance Tracker

A full-stack personal finance management application designed to help users track income and expenses, manage budgets, monitor savings goals, and gain insights into their spending habits.

FinTrack AI combines a modern React interface, a secure Node.js backend, PostgreSQL data storage, and AI-powered financial insights.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Financial Data Integrity Principles](#financial-data-integrity-principles)
- [Project Documentation](#project-documentation)
- [Feature Status and Verification](#feature-status-and-verification)
- [CSV Transaction Import Safety Checklist](#csv-transaction-import-safety-checklist)
- [CSV Export Safety](#csv-export-safety)
- [AI Insight Validation Checklist](#ai-insight-validation-checklist)
- [Transaction Dates and Time Zones](#transaction-dates-and-time-zones)

## Project Overview

FinTrack AI aims to provide a centralized platform for managing personal finances through transaction tracking, budgeting, reporting, and intelligent spending analysis.

The application is being developed with a focus on:

- Maintainable and scalable architecture
- Secure authentication and authorization
- Relational database design and data integrity
- Accurate financial calculations
- RESTful API development
- Database indexing and query optimization
- Automated testing and CI/CD
- Responsive and accessible user interfaces

## Key Features

### Core Features

- User registration and authentication
- Secure account and profile management
- Income and expense tracking
- Multiple financial accounts
- Transaction categorization
- Monthly budgets and spending limits
- Dashboard with financial summaries
- Search, filtering, sorting, and pagination
- Monthly and category-wise reports
- CSV transaction import and export

### Advanced Features

- Recurring income and expenses
- Savings goals and progress tracking
- Budget utilization alerts
- Cash-flow analysis
- Spending trend visualization
- Transaction history and auditability

### AI-Powered Features

- Intelligent transaction categorization
- Personalized spending insights
- Budget recommendations
- Natural-language finance queries
- Unusual-spending detection
- Spending forecasts based on historical data

AI-generated insights will be advisory. Financial calculations and transaction records will remain controlled by validated application logic.

## Technology Stack

### Frontend

- Next.js 16 with React 19
- TypeScript
- TanStack Query
- Redux Toolkit and React Redux
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express.js 5
- TypeScript
- RESTful APIs
- Zod request validation
- Helmet security headers
- Cookie parsing and CORS middleware
- Prisma ORM with the PostgreSQL adapter

### Database

- PostgreSQL
- Prisma ORM and migrations
- PostgreSQL driver (`pg`)

### Development Tools

- ESLint 9
- TypeScript compiler
- npm scripts for development, linting, and production builds

## Financial Data Integrity Principles

Personal finance software must preserve the accuracy and ownership of every transaction. These principles guide implementation and future reviews:

- **Use decimal-safe money values.** Avoid binary floating-point arithmetic for currency calculations. Prefer integer minor units (such as paise) or a database decimal type with explicit precision and rounding rules.
- **Validate transaction inputs at the boundary.** Check amount, currency, transaction type, date, category, and account ownership on the server. Client-side validation improves usability but is not a security boundary.
- **Enforce ownership on every operation.** Derive the authenticated user from the verified session and scope reads, updates, and deletes to resources that user is allowed to access.
- **Keep balance changes consistent.** When a transaction affects a stored balance, update related records in a database transaction so partial failures cannot leave inconsistent state.
- **Make retries safe where needed.** For import jobs or other retryable write operations, use an idempotency strategy or stable external reference to reduce duplicate transactions.
- **Define reporting rules explicitly.** Document how refunds, transfers, pending transactions, time zones, and month boundaries affect totals so dashboard figures remain consistent.
- **Test financial edge cases.** Cover zero and negative amounts where applicable, rounding boundaries, duplicate submissions, concurrent updates, month-end dates, and users attempting to access another user's data.
- **Treat AI output as untrusted advice.** Validate any proposed category or insight, never let a model directly mutate financial records, and keep calculated totals grounded in persisted transaction data.

These are engineering principles, not a claim that every item is already implemented. The actual behavior should be verified against the current codebase and automated tests.

## Project Documentation

The repository's `docs/` directory contains focused guides for implementation and review:

- [Authentication token implementation](docs/AUTH_TOKEN_IMPLEMENTATION.md) — notes on the authentication-token work.
- [Feature branch testing](docs/FEATURE_BRANCH_TESTING.md) — guidance for testing changes on feature branches.
- [Financial balance rules](docs/FINANCIAL_BALANCE_RULES.md) — documented rules for maintaining consistent financial balances.

Use these guides alongside the current source code; documentation should not be treated as proof that a behavior is implemented or tested.

## Feature Status and Verification

The feature lists above describe the product's intended scope; they are not a guarantee that every capability is currently available. Before treating a feature as complete:

1. Inspect the current implementation and relevant API or UI paths.
2. Run the tests that cover the behavior, and add tests for important gaps.
3. Verify authorization, validation, and failure handling for sensitive operations.
4. Update this README and the relevant guide when actual behavior or setup instructions change.

If a feature is planned, partially implemented, or unverified, describe it that way in project updates rather than presenting it as production-ready.

## CSV Transaction Import Safety Checklist

CSV imports can introduce malformed, duplicated, or incorrectly interpreted financial records. Use this checklist when implementing or reviewing an import flow:

1. **Validate the file.** Enforce an allowed format and reasonable file-size and row-count limits; do not trust the filename or browser-provided content type alone.
2. **Validate each row on the server.** Check required columns, date formats, currency, transaction type, amount precision, and category/account ownership. Client-side validation improves usability but is not a security boundary.
3. **Preview before saving.** Show parsed values and validation errors so users can catch incorrect column mappings or date/decimal interpretation before confirming an import.
4. **Define duplicate handling.** Establish a documented matching strategy for repeated uploads, such as a stable source transaction identifier where available. Avoid silently assuming that two similar-looking transactions are duplicates.
5. **Keep writes consistent.** Decide whether an import is all-or-nothing or supports partial success, and report that behavior clearly. Use database transactions where needed to prevent unintended partial updates.
6. **Protect sensitive data.** Do not log full transaction rows or other financial details unnecessarily; ensure imported records are scoped to the authenticated user.
7. **Test failure cases.** Include empty files, malformed rows, unexpected encodings, oversized files, duplicate uploads, and failures during persistence.

This checklist is implementation guidance, not confirmation that CSV import currently supports these safeguards. Verify the actual behavior in code and tests before describing it as complete.

## CSV Export Safety

Exported transaction data may be opened in spreadsheet applications. Text fields controlled by users or external sources—such as merchant names, notes, and categories—can be interpreted as spreadsheet formulas if they begin with formula-triggering characters.

When implementing or reviewing CSV export:

1. **Guard against formula injection.** Define and apply a consistent policy for untrusted text cells that begin with characters such as `=`, `+`, `-`, or `@`. Consider spreadsheet behavior for leading tabs, carriage returns, and line feeds as well.
2. **Do not rely on CSV quoting alone.** Quoting and escaping delimiters protects CSV structure, but does not necessarily stop spreadsheet software from evaluating a cell as a formula.
3. **Preserve financial values accurately.** Apply text-cell protections without silently changing the underlying transaction records or corrupting legitimate numeric amounts and dates.
4. **Test spreadsheet-facing output.** Include malicious-looking merchant names and notes, embedded quotes, commas, and newlines. Verify the exported file in the spreadsheet applications the project intends to support.
5. **Document export behavior.** Explain any normalization applied to exported text so users understand differences between a spreadsheet-safe export and the original stored data.

This guidance describes risks and review criteria; it does not assert that formula-injection protections are already implemented. Confirm safeguards in the export code and tests before claiming coverage.

## AI Insight Validation Checklist

AI-generated summaries and recommendations can sound confident even when their inputs are incomplete or their conclusions are wrong. Use this checklist when implementing or reviewing AI-powered finance features:

1. **Minimize data sent to models.** Send only the transaction details needed for the task, and follow the application's privacy and consent requirements for any external AI service.
2. **Validate model output.** Treat responses as untrusted input. Validate structured fields against a schema and handle missing, malformed, or unexpected values without breaking the user experience.
3. **Keep calculations deterministic.** Compute balances, totals, budget utilization, and other financial figures using application logic and persisted data. Do not rely on a language model for arithmetic or as the source of truth.
4. **Limit model authority.** AI suggestions must not independently create, edit, or delete financial records. Require the normal authenticated and validated application flow for any user-confirmed action.
5. **Handle uncertainty and outages.** Distinguish estimates from verified facts, avoid unsupported claims, and provide a safe fallback when the model is unavailable or returns unusable output.
6. **Test adversarial and edge cases.** Cover prompt-injection attempts in user-controlled text, empty or conflicting transaction data, malformed responses, timeouts, and attempts to expose another user's information.

These are review recommendations, not a statement that the application currently implements them. Confirm the safeguards in code and tests before describing an AI feature as production-ready.

## Transaction Dates and Time Zones

Transaction dates affect monthly reports, recurring entries, and budget boundaries. Define date semantics explicitly so the same transaction is not counted in different periods by different parts of the application.

- **Distinguish date-only values from timestamps.** A transaction entered as a calendar date may not represent a precise instant. Avoid converting date-only values through UTC in ways that shift the displayed day.
- **Choose a consistent reporting zone.** Decide whether reports follow the user's configured time zone or another documented product rule, and use that rule consistently in API queries and UI summaries.
- **Use explicit period boundaries.** For timestamp-based queries, prefer a start-inclusive and end-exclusive range to avoid double-counting records at adjacent month boundaries.
- **Define recurring transaction behavior.** Specify how due dates behave across short months, leap years, and daylight-saving transitions where applicable.
- **Test boundary cases.** Include transactions near midnight, month-end, year-end, and time-zone changes, plus users viewing the same account from different zones.

These are design and testing recommendations, not claims that the current application implements a particular time-zone policy. Document the chosen behavior and verify it against query logic and tests.
