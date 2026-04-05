# FinMatrix MVP

<div align="center">

![FinMatrix](https://img.shields.io/badge/FinMatrix-MVP-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)

**Professional Accounting Software for Pakistani SMBs**

[Getting Started](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

FinMatrix is a modern, cloud-ready accounting solution designed specifically for Pakistani small and medium businesses. Built with a robust tech stack and featuring FBR compliance, multi-tenancy support, and a comprehensive role-based access control system.

### Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | PostgreSQL 15, Drizzle ORM |
| **Authentication** | NextAuth.js 4.24 (JWT Strategy) |
| **UI Components** | Shadcn/ui, Radix UI |
| **Build System** | pnpm Workspaces, Turborepo |

## ✨ Features

### Weeks 1-4 Foundation (Included)

- ✅ **Monorepo Architecture** - Organized codebase with shared packages
- ✅ **Multi-Tenant Database** - Schema-per-tenant isolation
- ✅ **Authentication System** - Secure login with NextAuth.js
- ✅ **RBAC System** - 6 hierarchical roles, 30+ permissions
- ✅ **UI Component Library** - 10+ pre-built Shadcn/ui components
- ✅ **Pakistan-Specific Settings** - PKR currency, July fiscal year, 17% GST

### Coming Soon (Weeks 5-20)

- 📊 Chart of Accounts Management
- 📝 Journal Entries with Double-Entry Validation
- 🧾 Invoicing & Accounts Receivable
- 💰 Accounts Payable
- 📈 Financial Reports (P&L, Balance Sheet)
- 🏛️ FBR Compliance (GST, Form A/B)
- 🏦 Bank Reconciliation

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.17.0
- pnpm >= 8.0.0 (`npm install -g pnpm`)
- PostgreSQL >= 14.0

### Installation

```bash
# Clone or extract the project
cd finmatrix-mvp

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate and run migrations
pnpm db:generate
pnpm db:migrate

# Seed the database
pnpm --filter @finmatrix/db tsx src/seed.ts

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
finmatrix-mvp/
├── apps/
│   └── web/                    # Next.js 14 Application
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Login, Register pages
│       │   ├── (dashboard)/    # Protected dashboard
│       │   └── api/            # API routes
│       ├── components/         # React components
│       └── styles/             # Global styles
├── packages/
│   ├── auth/                   # Authentication & RBAC
│   ├── db/                     # Database & ORM
│   └── ui/                     # Shared UI components
├── package.json                # Root workspace config
├── IMPLEMENTATION.md           # Detailed setup guide
└── README.md                   # This file
```

## 🔐 Authentication & Authorization

### User Roles (Hierarchical)

| Role | Level | Access |
|------|-------|--------|
| `super_admin` | 100 | System-wide administration |
| `org_owner` | 90 | Full organization control |
| `admin` | 80 | User and settings management |
| `accountant` | 60 | All financial operations |
| `bookkeeper` | 40 | Basic transaction entry |
| `viewer` | 20 | Read-only access |

### Example Usage

```typescript
import { requireAuth, requireRole, checkPermission } from '@finmatrix/auth';

// Protect a page
const session = await requireAuth();

// Check role
await requireRole('admin');

// Check permission
const canCreate = await checkPermission('invoices:create');
```

## 🏢 Multi-Tenancy

FinMatrix uses a **schema-per-tenant** architecture where each organization gets its own PostgreSQL schema for complete data isolation:

```typescript
import { withTenantDb } from '@finmatrix/db';

// Execute queries in tenant context
const data = await withTenantDb('tenant_acme_corp_xyz', async (db) => {
  return db.select().from(invoices);
});
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start development server |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## 📖 Documentation

For detailed setup instructions, troubleshooting, and advanced configuration, see:

📘 **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Complete implementation guide

## 🗺️ Roadmap

| Week | Feature | Status |
|------|---------|--------|
| 1-4 | Foundation & Setup | ✅ Complete |
| 5-6 | General Ledger | 🔜 Upcoming |
| 7-8 | Invoicing & AR | 🔜 Upcoming |
| 9-10 | Accounts Payable | 🔜 Upcoming |
| 11-12 | Financial Reports | 🔜 Upcoming |
| 13-14 | FBR Compliance | 🔜 Upcoming |
| 15-20 | Bank Reconciliation | 🔜 Upcoming |

## 🤝 Contributing

This is an MVP in active development. Contributions are welcome after the initial feature set is complete.

## 📄 License

Proprietary - All rights reserved.

---

<div align="center">

**FinMatrix MVP** - Built with ❤️ for Pakistani SMBs

</div>
# FinMatrix-Web
