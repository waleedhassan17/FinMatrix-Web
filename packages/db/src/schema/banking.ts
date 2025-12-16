import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  date,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization';
import { chartOfAccounts } from './gl';

// ============================================================================
// Enums
// ============================================================================

export const bankAccountTypeEnum = pgEnum('bank_account_type', [
  'checking',
  'savings',
  'money_market',
  'credit_card',
  'line_of_credit',
  'petty_cash',
  'other',
]);

export const bankAccountStatusEnum = pgEnum('bank_account_status', [
  'active',
  'inactive',
  'closed',
]);

export const bankTransactionTypeEnum = pgEnum('bank_transaction_type', [
  'deposit',
  'withdrawal',
  'transfer_in',
  'transfer_out',
  'check',
  'fee',
  'interest',
  'adjustment',
  'payment',
  'receipt',
]);

export const transactionSourceEnum = pgEnum('transaction_source', [
  'manual',
  'import',
  'system',
  'journal_entry',
  'invoice_payment',
  'bill_payment',
]);

export const importStatusEnum = pgEnum('import_status', [
  'pending',
  'matched',
  'created',
  'ignored',
  'error',
]);

export const matchConfidenceEnum = pgEnum('match_confidence', [
  'high',
  'medium',
  'low',
  'none',
]);

export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'in_progress',
  'completed',
  'cancelled',
]);

// ============================================================================
// Bank Accounts
// ============================================================================

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Account Details
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  accountNumberMasked: varchar('account_number_masked', { length: 20 }), // Last 4 digits
  routingNumber: varchar('routing_number', { length: 20 }),
  bankName: varchar('bank_name', { length: 255 }),
  bankBranch: varchar('bank_branch', { length: 255 }),
  
  // Type and Status
  accountType: bankAccountTypeEnum('account_type').notNull().default('checking'),
  status: bankAccountStatusEnum('status').notNull().default('active'),
  
  // Balances
  openingBalance: decimal('opening_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  openingBalanceDate: date('opening_balance_date'),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  lastReconciledBalance: decimal('last_reconciled_balance', { precision: 15, scale: 2 }),
  lastReconciledDate: date('last_reconciled_date'),
  
  // GL Integration
  glAccountId: uuid('gl_account_id').references(() => chartOfAccounts.id),
  
  // Settings
  defaultDescription: varchar('default_description', { length: 255 }),
  isDefault: boolean('is_default').default(false),
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// ============================================================================
// Bank Transactions (Book side)
// ============================================================================

export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  
  // Transaction Details
  transactionDate: date('transaction_date').notNull(),
  postDate: date('post_date'),
  transactionType: bankTransactionTypeEnum('transaction_type').notNull(),
  
  // Amount (positive for deposits, negative for withdrawals)
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  
  // Reference
  referenceNumber: varchar('reference_number', { length: 100 }),
  checkNumber: varchar('check_number', { length: 50 }),
  description: varchar('description', { length: 500 }),
  memo: text('memo'),
  
  // Payee/Payer
  payeeName: varchar('payee_name', { length: 255 }),
  payeeId: uuid('payee_id'), // Customer or Vendor ID
  payeeType: varchar('payee_type', { length: 50 }), // 'customer', 'vendor', 'employee'
  
  // Source tracking
  source: transactionSourceEnum('source').notNull().default('manual'),
  sourceDocumentId: uuid('source_document_id'), // Link to invoice, bill, journal entry
  sourceDocumentType: varchar('source_document_type', { length: 50 }),
  
  // Reconciliation
  isReconciled: boolean('is_reconciled').default(false),
  reconciledAt: timestamp('reconciled_at'),
  reconciledBy: uuid('reconciled_by'),
  reconciliationId: uuid('reconciliation_id').references(() => bankReconciliations.id),
  
  // GL Integration
  journalEntryId: uuid('journal_entry_id'),
  
  // Running balance at time of transaction
  runningBalance: decimal('running_balance', { precision: 15, scale: 2 }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// ============================================================================
// Imported Bank Statements (Staging table for imports)
// ============================================================================

export const importedStatements = pgTable('imported_statements', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  
  // Import batch info
  importBatchId: uuid('import_batch_id').notNull(),
  importFileName: varchar('import_file_name', { length: 255 }),
  importFileType: varchar('import_file_type', { length: 20 }), // 'csv', 'ofx', 'qfx'
  importedAt: timestamp('imported_at').defaultNow().notNull(),
  importedBy: uuid('imported_by'),
  
  // Statement period
  statementStartDate: date('statement_start_date'),
  statementEndDate: date('statement_end_date'),
  statementOpeningBalance: decimal('statement_opening_balance', { precision: 15, scale: 2 }),
  statementClosingBalance: decimal('statement_closing_balance', { precision: 15, scale: 2 }),
  
  // Processing
  totalTransactions: integer('total_transactions').default(0),
  processedTransactions: integer('processed_transactions').default(0),
  matchedTransactions: integer('matched_transactions').default(0),
  
  // Raw data
  columnMapping: jsonb('column_mapping'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Imported Transactions (Individual transactions from import)
// ============================================================================

export const importedTransactions = pgTable('imported_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  importBatchId: uuid('import_batch_id').notNull().references(() => importedStatements.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  
  // Transaction from bank statement
  transactionDate: date('transaction_date').notNull(),
  postDate: date('post_date'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: varchar('description', { length: 500 }),
  referenceNumber: varchar('reference_number', { length: 100 }),
  checkNumber: varchar('check_number', { length: 50 }),
  transactionType: varchar('transaction_type', { length: 50 }), // From bank statement
  
  // Bank's transaction ID (for duplicate detection)
  bankTransactionId: varchar('bank_transaction_id', { length: 100 }),
  
  // Raw data from import
  rawData: jsonb('raw_data'),
  
  // Processing status
  status: importStatusEnum('status').notNull().default('pending'),
  
  // Matching
  matchConfidence: matchConfidenceEnum('match_confidence'),
  matchedTransactionId: uuid('matched_transaction_id').references(() => bankTransactions.id),
  matchScore: integer('match_score'), // 0-100
  matchDetails: jsonb('match_details'), // Details about why it matched
  
  // If new entry created
  createdTransactionId: uuid('created_transaction_id').references(() => bankTransactions.id),
  
  // User action
  processedAt: timestamp('processed_at'),
  processedBy: uuid('processed_by'),
  userAction: varchar('user_action', { length: 50 }), // 'matched', 'created', 'ignored'
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Bank Reconciliations
// ============================================================================

export const bankReconciliations = pgTable('bank_reconciliations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  
  // Statement info
  statementDate: date('statement_date').notNull(),
  statementEndingBalance: decimal('statement_ending_balance', { precision: 15, scale: 2 }).notNull(),
  
  // Beginning balance (from previous reconciliation or opening balance)
  beginningBalance: decimal('beginning_balance', { precision: 15, scale: 2 }).notNull(),
  
  // Calculated values
  clearedDeposits: decimal('cleared_deposits', { precision: 15, scale: 2 }).default('0'),
  clearedWithdrawals: decimal('cleared_withdrawals', { precision: 15, scale: 2 }).default('0'),
  clearedBalance: decimal('cleared_balance', { precision: 15, scale: 2 }),
  
  // Outstanding items
  outstandingDeposits: decimal('outstanding_deposits', { precision: 15, scale: 2 }).default('0'),
  outstandingWithdrawals: decimal('outstanding_withdrawals', { precision: 15, scale: 2 }).default('0'),
  
  // Adjustments
  adjustmentAmount: decimal('adjustment_amount', { precision: 15, scale: 2 }).default('0'),
  adjustmentDescription: text('adjustment_description'),
  
  // Difference (should be 0 when completed)
  difference: decimal('difference', { precision: 15, scale: 2 }).default('0'),
  
  // Status
  status: reconciliationStatusEnum('status').notNull().default('in_progress'),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by'),
  
  // Notes
  notes: text('notes'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// ============================================================================
// Reconciliation Items (transactions included in reconciliation)
// ============================================================================

export const reconciliationItems = pgTable('reconciliation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  reconciliationId: uuid('reconciliation_id').notNull().references(() => bankReconciliations.id, { onDelete: 'cascade' }),
  bankTransactionId: uuid('bank_transaction_id').notNull().references(() => bankTransactions.id, { onDelete: 'cascade' }),
  
  // Cleared status
  isCleared: boolean('is_cleared').default(false),
  clearedAt: timestamp('cleared_at'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Matching Rules (for learning from user corrections)
// ============================================================================

export const matchingRules = pgTable('matching_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Rule definition
  ruleName: varchar('rule_name', { length: 255 }),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'payee', 'description', 'amount', 'category'
  
  // Pattern matching
  matchPattern: varchar('match_pattern', { length: 500 }), // Regex or text pattern
  matchField: varchar('match_field', { length: 50 }), // 'description', 'payee', 'amount'
  
  // Action
  assignPayeeId: uuid('assign_payee_id'),
  assignPayeeName: varchar('assign_payee_name', { length: 255 }),
  assignPayeeType: varchar('assign_payee_type', { length: 50 }),
  assignTransactionType: bankTransactionTypeEnum('assign_transaction_type'),
  assignGlAccountId: uuid('assign_gl_account_id').references(() => chartOfAccounts.id),
  assignDescription: varchar('assign_description', { length: 500 }),
  
  // Learning
  timesUsed: integer('times_used').default(0),
  lastUsedAt: timestamp('last_used_at'),
  isActive: boolean('is_active').default(true),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// ============================================================================
// Relations
// ============================================================================

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [bankAccounts.tenantId],
    references: [organizations.id],
  }),
  glAccount: one(chartOfAccounts, {
    fields: [bankAccounts.glAccountId],
    references: [chartOfAccounts.id],
  }),
  transactions: many(bankTransactions),
  reconciliations: many(bankReconciliations),
  importedStatements: many(importedStatements),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  tenant: one(organizations, {
    fields: [bankTransactions.tenantId],
    references: [organizations.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [bankTransactions.bankAccountId],
    references: [bankAccounts.id],
  }),
  reconciliation: one(bankReconciliations, {
    fields: [bankTransactions.reconciliationId],
    references: [bankReconciliations.id],
  }),
}));

export const importedStatementsRelations = relations(importedStatements, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [importedStatements.tenantId],
    references: [organizations.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [importedStatements.bankAccountId],
    references: [bankAccounts.id],
  }),
  transactions: many(importedTransactions),
}));

export const importedTransactionsRelations = relations(importedTransactions, ({ one }) => ({
  tenant: one(organizations, {
    fields: [importedTransactions.tenantId],
    references: [organizations.id],
  }),
  importBatch: one(importedStatements, {
    fields: [importedTransactions.importBatchId],
    references: [importedStatements.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [importedTransactions.bankAccountId],
    references: [bankAccounts.id],
  }),
  matchedTransaction: one(bankTransactions, {
    fields: [importedTransactions.matchedTransactionId],
    references: [bankTransactions.id],
  }),
}));

export const bankReconciliationsRelations = relations(bankReconciliations, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [bankReconciliations.tenantId],
    references: [organizations.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [bankReconciliations.bankAccountId],
    references: [bankAccounts.id],
  }),
  items: many(reconciliationItems),
}));

export const reconciliationItemsRelations = relations(reconciliationItems, ({ one }) => ({
  reconciliation: one(bankReconciliations, {
    fields: [reconciliationItems.reconciliationId],
    references: [bankReconciliations.id],
  }),
  transaction: one(bankTransactions, {
    fields: [reconciliationItems.bankTransactionId],
    references: [bankTransactions.id],
  }),
}));

export const matchingRulesRelations = relations(matchingRules, ({ one }) => ({
  tenant: one(organizations, {
    fields: [matchingRules.tenantId],
    references: [organizations.id],
  }),
  glAccount: one(chartOfAccounts, {
    fields: [matchingRules.assignGlAccountId],
    references: [chartOfAccounts.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type NewBankTransaction = typeof bankTransactions.$inferInsert;

export type ImportedStatement = typeof importedStatements.$inferSelect;
export type NewImportedStatement = typeof importedStatements.$inferInsert;

export type ImportedTransaction = typeof importedTransactions.$inferSelect;
export type NewImportedTransaction = typeof importedTransactions.$inferInsert;

export type BankReconciliation = typeof bankReconciliations.$inferSelect;
export type NewBankReconciliation = typeof bankReconciliations.$inferInsert;

export type ReconciliationItem = typeof reconciliationItems.$inferSelect;
export type NewReconciliationItem = typeof reconciliationItems.$inferInsert;

export type MatchingRule = typeof matchingRules.$inferSelect;
export type NewMatchingRule = typeof matchingRules.$inferInsert;
