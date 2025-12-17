// Database client and connection
export {
  db,
  getPool,
  createTenantDb,
  withTenantDb,
  createTenantSchema,
  deleteTenantSchema,
  type Database,
} from './client';

// All schemas
export * from './schema';

// Utility functions
export * from './utils';

// Dashboard types
export * from './types/dashboard';

// GL (General Ledger) types
export * from './types/gl';

// AR (Accounts Receivable) types
export * from './types/ar';

// AP (Accounts Payable) types
export * from './types/ap';

// FBR (Federal Board of Revenue) Compliance types
export * from './types/fbr';

// Dashboard queries
export * from './queries/dashboard';

// Dashboard LIVE queries (real database data)
export * from './queries/dashboard-live';

// GL (General Ledger) queries
export * from './queries/gl';

// AR (Accounts Receivable) queries
export * from './queries/ar';

// AP (Accounts Payable) queries
export * from './queries/ap';

// FBR (Federal Board of Revenue) Compliance queries
export * from './queries/fbr';

// FBR Auto-populate functions (Form A from invoices, Form B from bills)
export * from './queries/fbr-auto-populate';

// Banking queries
export * from './queries/banking';

// Banking types
export * from './types/banking';

// Re-export drizzle-orm operators for convenience
export { eq, ne, gt, gte, lt, lte, and, or, not, inArray, sql } from 'drizzle-orm';
