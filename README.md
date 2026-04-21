# Multi-Tenant SaaS Subscription Management System

## 1. Project Overview
This project is a complete, production-ready Node.js (Express) backend for a Multi-Tenant SaaS Subscription Management System. 
It utilizes **PostgreSQL** as the database, **Prisma** as the ORM, **JWT** for authentication, and **Bcrypt** for password hashing. 
The system features isolated multi-tenancy, a fully integrated financial double-entry ledger (Chart of Accounts), subscription tracking, automated invoice generation, payment processing, and revenue recognition workflows.

## 2. Local Setup Steps
1. **Clone the repository** (or download the source).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your PostgreSQL URL and a JWT secret.
   ```bash
   cp .env.example .env
   ```
4. **Run Database Migrations**:
   Push the Prisma schema to the database (in dev) or run migrations:
   ```bash
   npm run db:push
   # Or npm run db:migrate for production setups
   ```
5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## 3. API Documentation

| Method | Endpoint | Auth Required | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | No | `{ tenantName, adminEmail, adminPassword }` | Returns JWT, Tenant, User, creates 4 default Accounts |
| POST | `/api/auth/login` | No | `{ email, password }` | Returns JWT token |
| GET | `/api/plans` | Yes (Admin) | None | Lists all active plans |
| POST | `/api/plans` | Yes (Admin) | `{ name, price, intervalDays }` | Returns created plan |
| PUT | `/api/plans/:id` | Yes (Admin) | `{ name, price, intervalDays }` | Returns updated plan |
| DELETE | `/api/plans/:id` | Yes (Admin) | None | Soft-deletes plan |
| GET | `/api/customers` | Yes | None | Lists all customers |
| POST | `/api/customers` | Yes | `{ name, email }` | Returns created customer |
| PUT | `/api/customers/:id` | Yes | `{ name, email }` | Returns updated customer |
| DELETE | `/api/customers/:id` | Yes | None | Deletes customer |
| GET | `/api/subscriptions` | Yes | None | Lists all subscriptions |
| POST | `/api/subscriptions` | Yes | `{ customerId, planId, startDate }` | Returns created subscription |
| PUT | `/api/subscriptions/:id/cancel` | Yes | None | Cancels subscription |
| POST | `/api/billing/generate-invoices`| Yes (Admin) | None | Simulates cron job, creates Invoices & Journal Entries |
| POST | `/api/billing/recognize-revenue`| Yes (Admin) | `{ month, year }` | Recognizes revenue for paid invoices |
| POST | `/api/payments` | Yes | `{ invoiceId, amount }` | Pays an invoice, creates Journal Entries |
| GET | `/api/reports/income-statement` | Yes (Admin) | Query: `startDate`, `endDate` | Returns subscription revenue |
| GET | `/api/reports/balance-sheet` | Yes (Admin) | None | Returns balances for Assets, Liabilities, Revenue |

## 4. Accounting Logic
The backend uses a double-entry accounting system with 4 default accounts: **Cash (1000)**, **Accounts Receivable (1200)**, **Deferred Revenue (2100)**, and **Subscription Revenue (4000)**. 
Journal entries are strictly append-only and executed via Prisma `$transaction`.

There are three main journal entry scenarios:

1. **Invoice Generation**
   - When an invoice is generated for an active subscription.
   - **DEBIT**: Accounts Receivable (1200)
   - **CREDIT**: Deferred Revenue (2100)

2. **Payment Processing**
   - When a payment is collected for an invoice.
   - **DEBIT**: Cash (1000)
   - **CREDIT**: Accounts Receivable (1200)

3. **Revenue Recognition (Month-End Close)**
   - When recognizing deferred revenue into actual revenue for a specific period.
   - **DEBIT**: Deferred Revenue (2100)
   - **CREDIT**: Subscription Revenue (4000)

## 5. Deployment Guide (Railway / Render)
1. Ensure your PostgreSQL database is provisioned and get the connection string.
2. Add your `DATABASE_URL` and `JWT_SECRET` to the environment variables of your hosting provider.
3. Configure your Build Command:
   ```bash
   npm install && npm run db:generate && npm run db:push
   ```
   *(Note: Use `db:migrate` if you are using migration files instead of db:push).*
4. Configure your Start Command:
   ```bash
   npm run start
   ```
5. Deploy. The application will start and listen on the port provided by the host.
