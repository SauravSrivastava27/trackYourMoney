# FinTrack AI — Personal Finance Tracker

A full-stack personal finance management application designed to help users track income and expenses, manage budgets, monitor savings goals, and gain insights into their spending habits.

FinTrack AI combines a modern React interface, a secure Node.js backend, PostgreSQL data storage, and AI-powered financial insights.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Design](#database-design)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [License](#license)

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