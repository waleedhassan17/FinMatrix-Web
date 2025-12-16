// General Ledger Schema for FinMatrix
// Chart of Accounts, Journal Entries, and Transaction Lines

import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  date,
  pgEnum,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './user';
import { organizations } from './organization';

// ============================================================================
// Enums
// ============================================================================

export const accountTypeEnum = pgEnum('account_type', [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
]);

export const accountSubTypeEnum = pgEnum('account_sub_type', [
  // Assets
  'cash',
  'bank',
  'accounts_receivable',
  'inventory',
  'prepaid_expense',
  'fixed_asset',
  'accumulated_depreciation',
  'other_current_asset',
  'other_non_current_asset',
  // Liabilities
  'accounts_payable',
  'credit_card',
  'accrued_liability',
  'short_term_loan',
  'long_term_loan',
  'deferred_revenue',
  'other_current_liability',
  'other_non_current_liability',
  // Equity
  'owners_equity',
  'retained_earnings',
  'common_stock',
  'additional_paid_in_capital',
  'treasury_stock',
  'opening_balance_equity',
  // Revenue
  'sales_revenue',
  'service_revenue',
  'other_income',
  'interest_income',
  'discount_received',
  // Expenses
  'cost_of_goods_sold',
  'operating_expense',
  'payroll_expense',
  'rent_expense',
  'utilities_expense',
  'depreciation_expense',
  'interest_expense',
  'tax_expense',
  'other_expense',
]);

export const normalBalanceEnum = pgEnum('normal_balance', ['debit', 'credit']);

export const journalEntryStatusEnum = pgEnum('journal_entry_status', [
  'draft',
  'posted',
  'voided',
]);

// ============================================================================
// Chart of Accounts
// ============================================================================

export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Account identification
  accountNumber: varchar('account_number', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Account classification
  type: accountTypeEnum('type').notNull(),
  subType: accountSubTypeEnum('sub_type'),
  normalBalance: normalBalanceEnum('normal_balance').notNull(),
  
  // Hierarchy
  parentId: uuid('parent_id').references((): any => chartOfAccounts.id, { onDelete: 'set null' }),
  level: integer('level').notNull().default(0),
  path: text('path'), // Materialized path for efficient tree queries (e.g., "1.2.3")
  
  // Organizational
  departmentIds: jsonb('department_ids').$type<string[]>().default([]),
  
  // Settings
  isActive: boolean('is_active').notNull().default(true),
  isSystemAccount: boolean('is_system_account').notNull().default(false),
  isBankAccount: boolean('is_bank_account').notNull().default(false),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  
  // Running balance (updated on each transaction)
  currentBalance: decimal('current_balance', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [chartOfAccounts.tenantId],
    references: [organizations.id],
  }),
  parent: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentId],
    references: [chartOfAccounts.id],
    relationName: 'accountHierarchy',
  }),
  children: many(chartOfAccounts, { relationName: 'accountHierarchy' }),
  transactionLines: many(transactionLines),
  createdByUser: one(users, {
    fields: [chartOfAccounts.createdBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Journal Entries
// ============================================================================

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Entry identification
  entryNumber: varchar('entry_number', { length: 20 }).notNull(), // GL-YYYY-XXXXX
  date: date('date').notNull(),
  
  // Description
  memo: text('memo'),
  reference: varchar('reference', { length: 100 }), // External reference (invoice #, etc.)
  
  // Status
  status: journalEntryStatusEnum('status').notNull().default('draft'),
  
  // Amounts (denormalized for quick queries)
  totalDebit: decimal('total_debit', { precision: 19, scale: 4 }).notNull().default('0'),
  totalCredit: decimal('total_credit', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Fiscal period
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalPeriod: integer('fiscal_period').notNull(), // 1-12 for months
  
  // Reversal tracking
  reversalOf: uuid('reversal_of').references((): any => journalEntries.id),
  reversedBy: uuid('reversed_by').references((): any => journalEntries.id),
  isAutoGenerated: boolean('is_auto_generated').notNull().default(false),
  sourceType: varchar('source_type', { length: 50 }), // 'invoice', 'bill', 'payment', 'manual'
  sourceId: uuid('source_id'), // Reference to source document
  
  // Attachments
  attachments: jsonb('attachments').$type<{ name: string; url: string; type: string }[]>().default([]),
  
  // Audit
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  postedBy: uuid('posted_by').references(() => users.id),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
});

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [journalEntries.tenantId],
    references: [organizations.id],
  }),
  lines: many(transactionLines),
  createdByUser: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
    relationName: 'createdJournalEntries',
  }),
  postedByUser: one(users, {
    fields: [journalEntries.postedBy],
    references: [users.id],
    relationName: 'postedJournalEntries',
  }),
  voidedByUser: one(users, {
    fields: [journalEntries.voidedBy],
    references: [users.id],
    relationName: 'voidedJournalEntries',
  }),
  reversalOfEntry: one(journalEntries, {
    fields: [journalEntries.reversalOf],
    references: [journalEntries.id],
    relationName: 'reversals',
  }),
  reversedByEntry: one(journalEntries, {
    fields: [journalEntries.reversedBy],
    references: [journalEntries.id],
    relationName: 'reversals',
  }),
}));

// ============================================================================
// Transaction Lines (Journal Entry Line Items)
// ============================================================================

export const transactionLines = pgTable('transaction_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  
  // Account reference
  accountId: uuid('account_id')
    .notNull()
    .references(() => chartOfAccounts.id),
  
  // Amounts (only one should be non-zero)
  debit: decimal('debit', { precision: 19, scale: 4 }).notNull().default('0'),
  credit: decimal('credit', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Description
  memo: text('memo'),
  
  // Dimensional tagging
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  customerId: uuid('customer_id'),
  vendorId: uuid('vendor_id'),
  
  // Reference to source document line (if applicable)
  reference: varchar('reference', { length: 100 }),
  
  // Tax tracking (for GST/WHT)
  taxCode: varchar('tax_code', { length: 20 }),
  taxAmount: decimal('tax_amount', { precision: 19, scale: 4 }),
  
  // Line ordering
  lineNumber: integer('line_number').notNull().default(0),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transactionLinesRelations = relations(transactionLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [transactionLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(chartOfAccounts, {
    fields: [transactionLines.accountId],
    references: [chartOfAccounts.id],
  }),
}));

// ============================================================================
// Fiscal Periods
// ============================================================================

export const fiscalPeriods = pgTable('fiscal_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  fiscalYear: integer('fiscal_year').notNull(),
  period: integer('period').notNull(), // 1-12 for months, or 13 for year-end adjustments
  name: varchar('name', { length: 50 }).notNull(), // "January 2024", "Year-End 2024"
  
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  isClosed: boolean('is_closed').notNull().default(false),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedBy: uuid('closed_by').references(() => users.id),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({ one }) => ({
  tenant: one(organizations, {
    fields: [fiscalPeriods.tenantId],
    references: [organizations.id],
  }),
  closedByUser: one(users, {
    fields: [fiscalPeriods.closedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Departments (for dimensional reporting)
// ============================================================================

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  parentId: uuid('parent_id').references((): any => departments.id, { onDelete: 'set null' }),
  managerId: uuid('manager_id').references(() => users.id),
  
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [departments.tenantId],
    references: [organizations.id],
  }),
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
    relationName: 'departmentHierarchy',
  }),
  children: many(departments, { relationName: 'departmentHierarchy' }),
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccount = typeof chartOfAccounts.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type TransactionLine = typeof transactionLines.$inferSelect;
export type NewTransactionLine = typeof transactionLines.$inferInsert;

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type NewFiscalPeriod = typeof fiscalPeriods.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountSubType = typeof accountSubTypeEnum.enumValues[number];
export type NormalBalance = 'debit' | 'credit';
export type JournalEntryStatus = 'draft' | 'posted' | 'voided';
