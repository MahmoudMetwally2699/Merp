# Multi-Tenant SaaS Subscription Management System


---

## 1. Project Overview
This project is a complete, production-ready Node.js (Express) backend for a Multi-Tenant SaaS Subscription Management System.
It utilizes **PostgreSQL** as the database, **Prisma** as the ORM, **JWT** for authentication, and **Bcrypt** for password hashing.
The system features isolated multi-tenancy, a fully integrated financial double-entry ledger (Chart of Accounts), subscription tracking, automated invoice generation, payment processing, and revenue recognition workflows.

---

## 2. Design Decisions & Architecture

To meet the highest standards of code quality and logic correctness, the following design decisions were implemented:

### A. Strict Data Isolation (Multi-Tenancy)
- **Middleware Enforcement:** The system uses a JWT-based authentication middleware that extracts the user's `tenantId` and attaches it to the request object (`req.user.tenantId`).
- **Query Level Security:** Every single database query strictly filters by `tenantId`. A user can *never* query, update, or delete a resource without implicitly filtering by their own `tenantId`, ensuring absolute data isolation between tenants.

### B. Correct Accounting Logic (Deferred Revenue)
The backend implements a mathematically sound **Double-Entry Accounting System**.
- Financial amounts are strictly stored as `Decimal` types to prevent floating-point precision errors.
- **Journal Entries** are generated using Prisma `$transaction` blocks to ensure atomic updates (if the payment fails, the journal entry rolls back).
- **Revenue Recognition:** Following GAAP principles, when an invoice is generated and paid, it credits **Deferred Revenue (Liability)**. Only when the `recognize-revenue` endpoint is triggered at month-end is the liability shifted into actual **Subscription Revenue**.

### C. Scalable Architecture
- The codebase follows the **Controller-Route-Middleware** pattern.
- Input validation is handled at the routing layer using `express-validator`.
- A centralized global error handler catches all asynchronous errors, ensuring the app never crashes unexpectedly and always returns consistent JSON responses.

---

## 3. Local Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```
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
   ```
5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

---

## 4. API Documentation

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

---

## 5. Accounting Workflows

The system seeds 4 default accounts upon tenant registration:
1. **Cash (1000)** - ASSET
2. **Accounts Receivable (1200)** - ASSET
3. **Deferred Revenue (2100)** - LIABILITY
4. **Subscription Revenue (4000)** - REVENUE

### Workflow 1: Invoice Generation
When an invoice is generated for an active subscription:
- **DEBIT**: Accounts Receivable (1200)
- **CREDIT**: Deferred Revenue (2100)

### Workflow 2: Payment Processing
When a payment is collected for an invoice:
- **DEBIT**: Cash (1000)
- **CREDIT**: Accounts Receivable (1200)

### Workflow 3: Revenue Recognition
When recognizing deferred revenue into actual revenue for a specific period:
- **DEBIT**: Deferred Revenue (2100)
- **CREDIT**: Subscription Revenue (4000)
