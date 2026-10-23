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

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Redux Toolkit, where shared client state is required
- Tailwind CSS
- React Hook Form
- Zod
- Recharts

### Backend

- Node.js
- Express.js
- TypeScript
- RESTful APIs
- Zod validation
- Helmet
- Secure cookie-based authentication
- Prisma ORM

### Database

- PostgreSQL
- Neon for managed database hosting
- Prisma migrations
- Relational constraints and indexes
- SQL query analysis and optimization

### Testing and Development Tools

- Vitest
- Supertest

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
