# FinMatrix MVP - Implementation Guide (Weeks 1-4)

## 🎯 Overview

This guide walks you through setting up and running the FinMatrix MVP foundation, covering:

- **Week 1**: Project Setup & Monorepo Architecture
- **Week 2**: Database & ORM with Multi-Tenancy
- **Week 3**: Authentication & RBAC System
- **Week 4**: Multi-Tenancy Implementation

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.17.0 (LTS recommended)
- **pnpm** >= 8.0.0 (`npm install -g pnpm`)
- **PostgreSQL** >= 14.0 (local or cloud instance)
- **Git** for version control

## 🏗️ Project Structure

```
finmatrix-mvp/
├── apps/
│   └── web/                    # Next.js 14 Application
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Auth pages (login, register)
│       │   ├── (dashboard)/    # Protected dashboard pages
│       │   └── api/            # API routes
│       ├── components/         # React components
│       └── styles/             # Global styles
├── packages/
│   ├── auth/                   # Authentication & RBAC package
│   │   └── src/
│   │       ├── config.ts       # NextAuth configuration
│   │       ├── session.ts      # Session utilities
│   │       ├── rbac.ts         # Role-based access control
│   │       └── password.ts     # Password utilities
│   ├── db/                     # Database package
│   │   └── src/
│   │       ├── client.ts       # Database client & multi-tenancy
│   │       ├── schema/         # Drizzle ORM schemas
│   │       ├── utils/          # Database utilities
│   │       └── seed.ts         # Seed script
│   └── ui/                     # Shared UI components
│       └── src/
│           └── components/     # Shadcn/ui components
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace configuration
├── tsconfig.json               # Base TypeScript config
└── turbo.json                  # Turborepo configuration
```

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd finmatrix-mvp
pnpm install
```

### Step 2: Set Up PostgreSQL

#### Option A: Local PostgreSQL

```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE finmatrix;
CREATE USER finmatrix_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE finmatrix TO finmatrix_user;
\q
```

#### Option B: Docker

```bash
docker run --name finmatrix-postgres \
  -e POSTGRES_DB=finmatrix \
  -e POSTGRES_USER=finmatrix_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Option C: Cloud (Neon, Supabase, Railway)

Use the connection string provided by your cloud provider.

### Step 3: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://finmatrix_user:your_secure_password@localhost:5432/finmatrix"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars-long"

# App
NODE_ENV="development"
```

**Generate a secure NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### Step 4: Generate & Run Migrations

```bash
# Generate migration files from schema
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Step 5: Seed the Database

```bash
# Seed roles and permissions
pnpm --filter @finmatrix/db tsx src/seed.ts
```

### Step 6: Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your application.

## 📦 Available Scripts

### Root Level

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Remove all node_modules and build artifacts |

### Database Package (@finmatrix/db)

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate migrations from schema |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio GUI |
| `pnpm db:push` | Push schema changes directly (dev only) |

## 🔐 Authentication System

### NextAuth.js Configuration

The authentication system uses NextAuth.js with the Credentials provider:

```typescript
// Usage in Server Components
import { getSession, requireAuth } from '@finmatrix/auth';

// Get current session
const session = await getSession();

// Require authentication (redirects to login if not authenticated)
const session = await requireAuth();
```

### Session Data Structure

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
  currentOrganizationId?: string;
  currentOrganizationSlug?: string;
  role?: string;
}
```

## 🛡️ RBAC System

### Available Roles (Hierarchical)

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | 100 | System-wide administration |
| `org_owner` | 90 | Organization owner with full access |
| `admin` | 80 | Administrative access |
| `accountant` | 60 | Financial operations access |
| `bookkeeper` | 40 | Basic bookkeeping access |
| `viewer` | 20 | Read-only access |

### Using RBAC

```typescript
import { 
  checkRole, 
  requireRole, 
  hasMinimumRole,
  checkPermission,
  requirePermission 
} from '@finmatrix/auth';

// Check if user has specific role
const isAdmin = await checkRole('admin');

// Require role (throws error if not authorized)
await requireRole('admin');

// Check minimum role level
const canManage = await hasMinimumRole('accountant');

// Check specific permission
const canCreateInvoice = await checkPermission('invoices:create');

// Require permission
await requirePermission('settings:update');
```

### Available Permissions

| Category | Permissions |
|----------|-------------|
| Organization | `organization:read`, `organization:update`, `organization:delete` |
| Users | `users:read`, `users:create`, `users:update`, `users:delete` |
| Roles | `roles:read`, `roles:assign` |
| Settings | `settings:read`, `settings:update` |
| Dashboard | `dashboard:read` |
| Reports | `reports:read`, `reports:create`, `reports:export` |
| Chart of Accounts | `coa:read`, `coa:create`, `coa:update`, `coa:delete` |
| Journal Entries | `journal:read`, `journal:create`, `journal:update`, `journal:delete`, `journal:post` |
| Invoices | `invoices:read`, `invoices:create`, `invoices:update`, `invoices:delete`, `invoices:send` |

## 🏢 Multi-Tenancy

### Schema-per-Tenant Architecture

Each organization gets its own PostgreSQL schema for complete data isolation:

```
public schema (shared)
├── users
├── organizations
├── organization_members
├── roles
├── permissions
└── ...

tenant_acme_corp_abc123 schema
├── chart_of_accounts
├── journal_entries
├── invoices
└── ...

tenant_xyz_ltd_def456 schema
├── chart_of_accounts
├── journal_entries
├── invoices
└── ...
```

### Using Multi-Tenancy

```typescript
import { withTenantDb, createTenantSchema } from '@finmatrix/db';

// Execute queries in tenant context
const accounts = await withTenantDb(schemaName, async (db) => {
  return db.select().from(chartOfAccounts);
});

// Create new tenant schema
await createTenantSchema('tenant_new_company_xyz789');
```

### Creating a New Tenant

```typescript
import { createTenant } from '@finmatrix/db';

const tenant = await createTenant({
  name: 'Acme Corporation',
  ownerId: userId,
  ntn: '1234567-8',
  settings: {
    fiscalYearStart: 7, // July (Pakistan fiscal year)
    currency: 'PKR',
    gstRate: 17,
  },
});
```

## 🧪 Testing the Setup

### 1. Health Check

```bash
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### 2. Database Connectivity

```bash
curl http://localhost:3000/api/test-db
# Expected: {"status":"connected","userCount":0,"orgCount":0}
```

### 3. Test Registration (via API)

```typescript
// Create a test user programmatically
import { createUser } from '@finmatrix/db';
import { hashPassword } from '@finmatrix/auth';

const passwordHash = await hashPassword('SecurePass123!');
const user = await createUser({
  email: 'test@example.com',
  passwordHash,
  firstName: 'Test',
  lastName: 'User',
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Ensure PostgreSQL is running:
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Docker
docker start finmatrix-postgres
```

#### 2. Migration Errors

```
Error: relation "users" already exists
```

**Solution:** Reset the database:
```bash
psql -U postgres -d finmatrix -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm db:migrate
```

#### 3. NextAuth Secret Error

```
[next-auth][error][NO_SECRET]
```

**Solution:** Ensure `NEXTAUTH_SECRET` is set in `.env`:
```bash
openssl rand -base64 32
# Add output to .env as NEXTAUTH_SECRET
```

#### 4. Module Not Found Errors

```
Cannot find module '@finmatrix/ui'
```

**Solution:** Rebuild packages:
```bash
pnpm clean
pnpm install
pnpm build
```

#### 5. TypeScript Errors in IDE

**Solution:** Restart TypeScript server or reload IDE window.

## 📝 Next Steps (Weeks 5+)

After completing the Week 1-4 foundation, proceed with:

### Week 5-6: General Ledger
- Chart of Accounts management
- Journal Entry creation with double-entry validation
- Transaction posting

### Week 7-8: Invoicing & AR
- Customer management
- Invoice creation with line items
- PDF generation
- AR aging reports

### Week 9-10: Accounts Payable
- Vendor management
- Bill entry
- AP aging reports

### Week 11-12: Financial Reporting
- Profit & Loss Statement
- Balance Sheet
- Dashboard with key metrics

### Week 13-14: FBR Compliance
- GST calculation (17%)
- FBR-compliant invoice numbering
- Form A/B report generation

### Week 15-20: Bank Reconciliation
- CSV import
- Auto-matching algorithm
- Manual reconciliation UI

## 📚 Additional Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments
3. Consult the linked documentation

---

**FinMatrix MVP** - Professional Accounting Software for Pakistani SMBs
