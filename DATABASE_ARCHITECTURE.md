# FinMatrix Database Architecture

## Complete Guide to the Database System

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Multi-Tenant Architecture](#multi-tenant-architecture)
4. [Database Connection & Client](#database-connection--client)
5. [Schema Organization](#schema-organization)
6. [Core Modules](#core-modules)
   - [Users & Organizations](#1-users--organizations)
   - [Authentication](#2-authentication)
   - [Role-Based Access Control (RBAC)](#3-role-based-access-control-rbac)
   - [General Ledger (GL)](#4-general-ledger-gl)
   - [Accounts Receivable (AR)](#5-accounts-receivable-ar)
   - [Accounts Payable (AP)](#6-accounts-payable-ap)
   - [Banking Module](#7-banking-module)
   - [FBR Compliance (Pakistan Tax)](#8-fbr-compliance-pakistan-tax)
7. [Data Types & Type Safety](#data-types--type-safety)
8. [Queries & Data Access Layer](#queries--data-access-layer)
9. [Database Migrations](#database-migrations)
10. [Entity Relationship Diagram](#entity-relationship-diagram)
11. [Best Practices](#best-practices)

---

## Overview

FinMatrix uses a **PostgreSQL** database with **Drizzle ORM** for type-safe database operations. The system is designed for multi-tenant SaaS architecture, supporting multiple organizations with complete data isolation.

### Key Features:
- **Multi-Tenant Architecture**: Schema-per-tenant isolation
- **Type-Safe ORM**: Full TypeScript support with Drizzle ORM
- **Pakistan-Specific Compliance**: FBR (Federal Board of Revenue) tax compliance built-in
- **Double-Entry Accounting**: Complete GL with journal entries and transaction lines
- **Serverless-Ready**: Compatible with Neon Database for serverless deployments

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Database** | PostgreSQL | Primary relational database |
| **ORM** | Drizzle ORM v0.29.1 | Type-safe SQL query builder |
| **Driver** | `pg` (node-postgres) | PostgreSQL client for Node.js |
| **Serverless** | `@neondatabase/serverless` | Neon DB for serverless deployments |
| **Migrations** | Drizzle Kit | Schema migrations and generation |
| **Schema Definition** | TypeScript | Type-safe schema definitions |

### Package Dependencies

```json
{
  "dependencies": {
    "drizzle-orm": "^0.29.1",
    "pg": "^8.11.3",
    "@neondatabase/serverless": "^0.6.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.6"
  }
}
```

---

## Multi-Tenant Architecture

FinMatrix implements a **Schema-per-Tenant** approach for complete data isolation.

### How It Works:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Public Schema  │  │ tenant_acme_xyz │  │ tenant_corp_abc │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  │
│  │ - users         │  │ - All tenant    │  │ - All tenant    │  │
│  │ - organizations │  │   specific      │  │   specific      │  │
│  │ - sessions      │  │   tables        │  │   tables        │  │
│  │ - accounts      │  │ - GL, AR, AP    │  │ - GL, AR, AP    │  │
│  │ - roles         │  │ - Banking       │  │ - Banking       │  │
│  │ - permissions   │  │ - FBR           │  │ - FBR           │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Schema Naming Convention:
```typescript
// Format: tenant_{normalized_org_name}_{random_suffix}
// Example: tenant_acme_corporation_a1b2c3
```

### Key Functions:

```typescript
// Create a tenant-scoped database client
export const createTenantDb = async (schemaName: string): Promise<Database>

// Execute function within tenant context
export const withTenantDb = async <T>(
  schemaName: string,
  fn: (db: Database) => Promise<T>
): Promise<T>

// Create new tenant schema
export const createTenantSchema = async (schemaName: string): Promise<void>

// Delete tenant schema (use with caution!)
export const deleteTenantSchema = async (schemaName: string): Promise<void>
```

---

## Database Connection & Client

### File: `packages/db/src/client.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Connection Pool Configuration
const createPool = (connectionString: string) => {
  return new Pool({
    connectionString,
    max: 20,                      // Maximum connections
    idleTimeoutMillis: 30000,     // 30 seconds idle timeout
    connectionTimeoutMillis: 2000, // 2 seconds connection timeout
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });
};

// Main Database Client
export const db = drizzle(getPool(), { schema });
```

### Environment Variables Required:
```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development|production
```

---

## Schema Organization

### Directory Structure:
```
packages/db/src/
├── schema/
│   ├── index.ts          # Exports all schemas
│   ├── user.ts           # Users & Organization Members
│   ├── organization.ts   # Organizations (Tenants)
│   ├── role.ts           # RBAC - Roles & Permissions
│   ├── auth.ts           # NextAuth.js tables
│   ├── gl.ts             # General Ledger
│   ├── ar.ts             # Accounts Receivable
│   ├── ap.ts             # Accounts Payable
│   ├── banking.ts        # Banking Module
│   └── fbr.ts            # FBR Tax Compliance
├── queries/
│   ├── dashboard-live.ts # Dashboard data queries
│   ├── gl.ts             # GL CRUD operations
│   ├── ar.ts             # AR CRUD operations
│   ├── ap.ts             # AP CRUD operations
│   └── fbr.ts            # FBR queries
├── types/
│   ├── dashboard.ts      # Dashboard types
│   ├── gl.ts             # GL types
│   ├── ar.ts             # AR types
│   ├── ap.ts             # AP types
│   └── fbr.ts            # FBR types
├── utils/
│   ├── tenant.ts         # Tenant management utilities
│   └── user.ts           # User utilities
├── client.ts             # Database connection
├── index.ts              # Main exports
└── migrate.ts            # Migration runner
```

---

## Core Modules

### 1. Users & Organizations

#### Users Table (`users`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `emailVerified` | TIMESTAMP | Email verification date |
| `passwordHash` | TEXT | Bcrypt password hash |
| `firstName` | VARCHAR(100) | First name |
| `lastName` | VARCHAR(100) | Last name |
| `phone` | VARCHAR(20) | Phone number |
| `isActive` | BOOLEAN | Account status |
| `lastLoginAt` | TIMESTAMP | Last login timestamp |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |

#### Organizations Table (`organizations`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Organization name |
| `slug` | VARCHAR(100) | URL-friendly identifier |
| `schemaName` | VARCHAR(63) | PostgreSQL schema name |
| `businessType` | VARCHAR(50) | Type of business |
| `ntn` | VARCHAR(50) | National Tax Number (Pakistan) |
| `strn` | VARCHAR(50) | Sales Tax Registration Number |
| `settings` | JSONB | Organization settings |
| `isActive` | BOOLEAN | Status |

#### Organization Settings Interface:
```typescript
interface OrganizationSettings {
  fiscalYearStart?: number;    // Month (1-12), default: 7 (July for Pakistan)
  currency?: string;           // Default: 'PKR'
  timezone?: string;           // Default: 'Asia/Karachi'
  dateFormat?: string;         // Default: 'DD/MM/YYYY'
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  enableGst?: boolean;
  gstRate?: number;            // Default: 17
}
```

#### Organization Members Table (`organization_members`)
Junction table for many-to-many users ↔ organizations relationship.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `userId` | UUID | Foreign key → users |
| `organizationId` | UUID | Foreign key → organizations |
| `isOwner` | BOOLEAN | Is organization owner |
| `joinedAt` | TIMESTAMP | When user joined |

---

### 2. Authentication

Built for **NextAuth.js** compatibility.

#### Sessions Table (`sessions`)
```typescript
{
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}
```

#### Accounts Table (`accounts`)
OAuth provider accounts (Google, GitHub, etc.)
```typescript
{
  userId: uuid('user_id'),
  type: varchar('type'),
  provider: varchar('provider'),
  providerAccountId: varchar('provider_account_id'),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  // Composite primary key: (provider, providerAccountId)
}
```

#### Verification Tokens (`verification_tokens`)
For email verification and password reset.

---

### 3. Role-Based Access Control (RBAC)

#### System Roles Enum:
```typescript
const systemRoleEnum = pgEnum('system_role', [
  'super_admin',   // Full system access
  'org_owner',     // Organization owner
  'admin',         // Organization admin
  'accountant',    // Full accounting access
  'bookkeeper',    // Limited accounting access
  'viewer',        // Read-only access
]);
```

#### Roles Table (`roles`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Role name |
| `slug` | VARCHAR(100) | URL identifier |
| `systemRole` | ENUM | Predefined system role |
| `organizationId` | UUID | Null = global, else org-specific |
| `isSystem` | BOOLEAN | Is system-defined role |

#### Permissions Table (`permissions`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Permission name |
| `slug` | VARCHAR(100) | Unique identifier |
| `resource` | VARCHAR(100) | Resource (invoices, reports, etc.) |
| `action` | VARCHAR(50) | Action (create, read, update, delete) |

#### Junction Tables:
- `role_permissions` - Links roles to permissions
- `user_roles` - Links users to roles within organizations

---

### 4. General Ledger (GL)

The core accounting module implementing **Double-Entry Bookkeeping**.

#### Account Type Enums:
```typescript
const accountTypeEnum = pgEnum('account_type', [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
]);

const accountSubTypeEnum = pgEnum('account_sub_type', [
  // Assets
  'cash', 'bank', 'accounts_receivable', 'inventory',
  'prepaid_expense', 'fixed_asset', 'accumulated_depreciation',
  // Liabilities
  'accounts_payable', 'credit_card', 'accrued_liability',
  'short_term_loan', 'long_term_loan', 'deferred_revenue',
  // Equity
  'owners_equity', 'retained_earnings', 'common_stock',
  // Revenue
  'sales_revenue', 'service_revenue', 'other_income',
  // Expenses
  'cost_of_goods_sold', 'operating_expense', 'payroll_expense',
  // ... more sub-types
]);

const normalBalanceEnum = pgEnum('normal_balance', ['debit', 'credit']);
```

#### Chart of Accounts (`chart_of_accounts`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenantId` | UUID | Organization reference |
| `accountNumber` | VARCHAR(20) | Account code (e.g., 1000) |
| `name` | VARCHAR(255) | Account name |
| `type` | ENUM | Asset/Liability/Equity/Revenue/Expense |
| `subType` | ENUM | Detailed classification |
| `normalBalance` | ENUM | Debit or Credit |
| `parentId` | UUID | Self-reference for hierarchy |
| `level` | INTEGER | Hierarchy depth |
| `path` | TEXT | Materialized path (e.g., "1.2.3") |
| `currentBalance` | DECIMAL(19,4) | Running balance |
| `isSystemAccount` | BOOLEAN | System-generated account |
| `isBankAccount` | BOOLEAN | Linked to bank module |

#### Journal Entries (`journal_entries`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenantId` | UUID | Organization reference |
| `entryNumber` | VARCHAR(20) | Entry ID (GL-YYYY-XXXXX) |
| `date` | DATE | Transaction date |
| `memo` | TEXT | Description |
| `status` | ENUM | draft/posted/voided |
| `totalDebit` | DECIMAL(19,4) | Sum of debits |
| `totalCredit` | DECIMAL(19,4) | Sum of credits |
| `fiscalYear` | INTEGER | Fiscal year |
| `fiscalPeriod` | INTEGER | Month (1-12) |
| `sourceType` | VARCHAR | invoice/bill/payment/manual |
| `sourceId` | UUID | Reference to source document |

#### Transaction Lines (`transaction_lines`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `journalEntryId` | UUID | Parent entry |
| `accountId` | UUID | Chart of accounts reference |
| `debit` | DECIMAL(19,4) | Debit amount |
| `credit` | DECIMAL(19,4) | Credit amount |
| `memo` | TEXT | Line description |
| `departmentId` | UUID | Department allocation |

#### Double-Entry Principle:
```
Total Debits = Total Credits (always balanced)

Example Journal Entry:
┌────────────────────┬───────────┬───────────┐
│ Account            │   Debit   │  Credit   │
├────────────────────┼───────────┼───────────┤
│ Cash (Asset)       │ 10,000.00 │           │
│ Sales Revenue      │           │ 10,000.00 │
├────────────────────┼───────────┼───────────┤
│ TOTAL              │ 10,000.00 │ 10,000.00 │
└────────────────────┴───────────┴───────────┘
```

---

### 5. Accounts Receivable (AR)

Manages customers, invoices, and incoming payments.

#### Customers (`customers`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenantId` | UUID | Organization |
| `customerNumber` | VARCHAR(20) | Customer code |
| `companyName` | VARCHAR(255) | Company name |
| `email` | VARCHAR(255) | Contact email |
| `ntn` | VARCHAR(20) | Pakistan NTN |
| `strn` | VARCHAR(20) | Sales Tax Registration |
| `creditLimit` | DECIMAL(19,4) | Credit limit |
| `paymentTerms` | INTEGER | Days (default 30) |
| `currentBalance` | DECIMAL(19,4) | Outstanding balance |
| `overdueBalance` | DECIMAL(19,4) | Past due amount |

#### Invoices (`invoices`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `invoiceNumber` | VARCHAR(30) | Invoice number |
| `customerId` | UUID | Customer reference |
| `invoiceDate` | DATE | Invoice date |
| `dueDate` | DATE | Payment due date |
| `status` | ENUM | draft/sent/partial/paid/overdue/void |
| `subtotal` | DECIMAL(19,4) | Before tax |
| `taxAmount` | DECIMAL(19,4) | GST amount |
| `total` | DECIMAL(19,4) | Total amount |
| `amountPaid` | DECIMAL(19,4) | Paid so far |
| `balance` | DECIMAL(19,4) | Remaining balance |
| `taxBreakdown` | JSONB | Tax details for FBR |
| `journalEntryId` | UUID | GL integration |

#### Invoice Line Items (`invoice_line_items`)
Individual items on an invoice with quantity, rate, and tax.

#### Payments (`payments`)
Records customer payments and their application to invoices.

#### Credit Memos (`credit_memos`)
Customer credits for returns or adjustments.

---

### 6. Accounts Payable (AP)

Manages vendors, bills, and outgoing payments.

#### Vendors (`vendors`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendorNumber` | VARCHAR(50) | Vendor code |
| `companyName` | VARCHAR(255) | Company name |
| `ntn` | VARCHAR(50) | Pakistan NTN |
| `strn` | VARCHAR(50) | Sales Tax Registration |
| `paymentTerms` | INTEGER | Days (default 30) |
| `bankDetails` | JSONB | Bank account info |
| `defaultExpenseAccountId` | UUID | Default GL account |

#### Bills (`bills`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `billNumber` | VARCHAR(50) | Bill number |
| `vendorId` | UUID | Vendor reference |
| `vendorInvoiceNumber` | VARCHAR(100) | Vendor's reference |
| `billDate` | DATE | Bill date |
| `dueDate` | DATE | Payment due date |
| `status` | ENUM | draft/pending_approval/approved/partially_paid/paid/cancelled |
| `subtotal` | DECIMAL(15,2) | Before tax |
| `taxAmount` | DECIMAL(15,2) | Input GST |
| `total` | DECIMAL(15,2) | Total amount |
| `amountPaid` | DECIMAL(15,2) | Paid amount |
| `balance` | DECIMAL(15,2) | Remaining |
| `apAccountId` | UUID | AP GL account |

#### Vendor Payments (`vendor_payments`)
Records payments to vendors with bank/cheque tracking.

#### Debit Memos (`debit_memos`)
Vendor credits for returns or adjustments.

---

### 7. Banking Module

Complete bank account management with reconciliation support.

#### Bank Accounts (`bank_accounts`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `accountName` | VARCHAR(255) | Display name |
| `accountNumber` | VARCHAR(50) | Full account number |
| `accountNumberMasked` | VARCHAR(20) | Last 4 digits |
| `bankName` | VARCHAR(255) | Bank name |
| `accountType` | ENUM | checking/savings/credit_card/petty_cash |
| `status` | ENUM | active/inactive/closed |
| `openingBalance` | DECIMAL(15,2) | Starting balance |
| `currentBalance` | DECIMAL(15,2) | Current balance |
| `lastReconciledBalance` | DECIMAL(15,2) | Last reconciled |
| `glAccountId` | UUID | Linked GL account |

#### Bank Transactions (`bank_transactions`)
| Column | Type | Description |
|--------|------|-------------|
| `transactionDate` | DATE | Transaction date |
| `transactionType` | ENUM | deposit/withdrawal/transfer/check/fee/payment |
| `amount` | DECIMAL(15,2) | Amount (+ deposit, - withdrawal) |
| `referenceNumber` | VARCHAR(100) | Reference |
| `checkNumber` | VARCHAR(50) | Check number if applicable |
| `payeeName` | VARCHAR(255) | Payee/Payer |
| `source` | ENUM | manual/import/system/journal_entry |
| `isReconciled` | BOOLEAN | Reconciliation status |
| `runningBalance` | DECIMAL(15,2) | Balance after transaction |

#### Bank Reconciliation Support:
- `imported_statements` - Staging for imported bank statements
- `imported_transactions` - Individual imported transactions with matching
- `bank_reconciliations` - Reconciliation sessions
- `reconciliation_items` - Items included in reconciliation
- `matching_rules` - Auto-matching rules for imports

---

### 8. FBR Compliance (Pakistan Tax)

Complete Pakistan Federal Board of Revenue compliance for GST/Sales Tax.

#### Tax Types:
```typescript
const taxTypeEnum = pgEnum('tax_type', [
  'gst',           // 17% General Sales Tax
  'reduced_gst',   // Reduced rates
  'zero_rated',    // Zero-rated supplies
  'exempt',        // Exempt from GST
  'further_tax',   // 3% on unregistered persons
  'withholding',   // Withholding tax
  'advance_tax',   // Advance tax on imports
  'provincial',    // Provincial sales tax
]);
```

#### Tax Registration (`tax_registration`)
| Column | Type | Description |
|--------|------|-------------|
| `ntn` | VARCHAR(50) | National Tax Number |
| `strn` | VARCHAR(50) | Sales Tax Registration Number |
| `businessType` | ENUM | manufacturer/importer/retailer/etc. |
| `taxOffice` | VARCHAR(255) | Regional Tax Office |
| `punjabStn` | VARCHAR(50) | Punjab Sales Tax |
| `sindhSrn` | VARCHAR(50) | Sindh Revenue Number |
| `fiscalYearStart` | INTEGER | Default: 7 (July) |

#### Sales Tax Returns (`sales_tax_returns`)
FBR Form-A for output tax on sales:
- Taxable supplies at standard rate (17%)
- Reduced rate supplies
- Zero-rated supplies
- Exempt supplies
- Export supplies
- Further tax (3% on unregistered)

#### Input Tax Claims (`input_tax_claims`)
FBR Form-B for input tax on purchases:
- Local purchases
- Imports
- Capital goods
- Services
- Adjustments

#### GST Reconciliation (`gst_reconciliations`)
Reconciles output tax (sales) vs input tax (purchases):
```
Net GST Payable = Output Tax - Input Tax (Claimable)
```

#### Withholding Tax Records (`withholding_tax_records`)
Tracks tax withheld from payments per FBR requirements.

---

## Data Types & Type Safety

Drizzle ORM provides automatic type inference from schema definitions.

### Type Exports:
```typescript
// From schema files
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccount = typeof chartOfAccounts.$inferInsert;

// ... same pattern for all tables
```

### Using Types:
```typescript
import { User, NewUser, Organization } from '@finmatrix/db';

// Create new user (insert type)
const newUser: NewUser = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

// Query result (select type)
const user: User = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com'),
});
```

---

## Queries & Data Access Layer

### Location: `packages/db/src/queries/`

### GL Queries Example:
```typescript
// Get all accounts for a tenant
export async function getAccounts(
  db: NodePgDatabase<any>,
  tenantId: string,
  options?: {
    includeInactive?: boolean;
    type?: AccountType;
    parentId?: string | null;
  }
): Promise<ChartOfAccount[]>

// Build hierarchical account tree
export function buildAccountTree(accounts: ChartOfAccount[]): AccountTreeNode[]

// Get journal entries with lines
export async function getJournalEntries(
  db: NodePgDatabase<any>,
  tenantId: string,
  options?: { status?: JournalEntryStatus; limit?: number }
): Promise<JournalEntryWithLines[]>
```

### Dashboard Queries:
```typescript
// Live data for dashboard widgets
export async function getCashBalanceMetricLive(
  db: NodePgDatabase<any>,
  tenantId: string
): Promise<CashBalanceMetric>

export async function getAccountsReceivableMetricLive(
  db: NodePgDatabase<any>,
  tenantId: string
): Promise<AccountsReceivableMetric>

export async function getARAgingDataLive(
  db: NodePgDatabase<any>,
  tenantId: string
): Promise<ARAgingData>
```

---

## Database Migrations

### Using Drizzle Kit

#### Commands:
```bash
# Generate migration files from schema changes
pnpm --filter @finmatrix/db generate

# Apply migrations
pnpm --filter @finmatrix/db migrate

# Push schema directly (development)
pnpm --filter @finmatrix/db push

# Open Drizzle Studio (GUI)
pnpm --filter @finmatrix/db studio
```

### Drizzle Config (`drizzle.config.ts`):
```typescript
export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  tablesFilter: ['!pg_stat_*'],
  verbose: true,
  strict: true,
} satisfies Config;
```

### Migration Files:
Located in `packages/db/drizzle/` directory with SQL files.

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │────<│org_members      │>────│ organizations   │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                                │
         │              ┌─────────────────┐               │
         └────────────<│   user_roles    │>──────────────┘
                        └────────┬────────┘
                                 │
┌─────────────────┐     ┌────────┴────────┐
│   permissions   │────<│role_permissions │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        │     roles       │
                        └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     TENANT-SCOPED TABLES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐            ┌─────────────────┐              │
│  │chart_of_accounts│──────────<│transaction_lines│              │
│  └────────┬────────┘            └────────┬────────┘              │
│           │ (self-ref)                   │                        │
│           └──────────┐          ┌────────┴────────┐              │
│                      │          │ journal_entries │              │
│                      │          └─────────────────┘              │
│                      │                                            │
│  ┌─────────────────┐ │          ┌─────────────────┐              │
│  │   customers     │─┼────────<│    invoices     │              │
│  └─────────────────┘ │          └────────┬────────┘              │
│                      │                   │                        │
│                      │          ┌────────┴────────┐              │
│                      │          │invoice_line_items│             │
│                      │          └─────────────────┘              │
│                      │                                            │
│  ┌─────────────────┐ │          ┌─────────────────┐              │
│  │    vendors      │─┼────────<│     bills       │              │
│  └─────────────────┘ │          └────────┬────────┘              │
│                      │                   │                        │
│                      │          ┌────────┴────────┐              │
│                      │          │ bill_line_items │              │
│                      │          └─────────────────┘              │
│                      │                                            │
│  ┌─────────────────┐ │          ┌─────────────────┐              │
│  │  bank_accounts  │─┴────────<│bank_transactions│              │
│  └─────────────────┘            └─────────────────┘              │
│                                                                   │
│  ┌─────────────────┐            ┌─────────────────┐              │
│  │ tax_registration│            │sales_tax_returns│              │
│  └─────────────────┘            └─────────────────┘              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. Always Use Tenant Context
```typescript
// ✅ Correct - with tenant context
const accounts = await getAccounts(db, tenantId);

// ❌ Wrong - missing tenant isolation
const accounts = await db.select().from(chartOfAccounts);
```

### 2. Use Type-Safe Queries
```typescript
// ✅ Use Drizzle query builder
const invoices = await db
  .select()
  .from(invoices)
  .where(and(
    eq(invoices.tenantId, tenantId),
    eq(invoices.status, 'sent')
  ));

// ❌ Avoid raw SQL when possible
```

### 3. Validate Schema Names
```typescript
// Schema names are validated to prevent SQL injection
if (!/^[a-z][a-z0-9_]*$/.test(schemaName)) {
  throw new Error('Invalid schema name');
}
```

### 4. Use Transactions for Multi-Table Operations
```typescript
await db.transaction(async (tx) => {
  // Create journal entry
  const [entry] = await tx.insert(journalEntries).values({...}).returning();
  
  // Create transaction lines
  await tx.insert(transactionLines).values([
    { journalEntryId: entry.id, debit: amount, credit: 0 },
    { journalEntryId: entry.id, debit: 0, credit: amount },
  ]);
});
```

### 5. Maintain Double-Entry Balance
```typescript
// Always ensure: Total Debits = Total Credits
const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

if (totalDebit !== totalCredit) {
  throw new Error('Journal entry is not balanced');
}
```

---

## Summary

FinMatrix's database architecture is designed for:

- **🔒 Security**: Multi-tenant schema isolation
- **📊 Compliance**: Pakistan FBR tax requirements built-in
- **💰 Accounting**: Full double-entry bookkeeping
- **🔧 Type Safety**: Complete TypeScript support
- **🚀 Scalability**: Connection pooling & serverless-ready
- **📈 Performance**: Proper indexing on frequently queried columns

For questions or contributions, refer to the codebase in `packages/db/`.
