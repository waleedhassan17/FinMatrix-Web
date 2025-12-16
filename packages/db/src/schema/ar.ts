// Accounts Receivable Schema for FinMatrix
// Customers, Invoices, Invoice Line Items, and Payments

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
  index,
} from 'drizzle-orm/pg-core';
import { users } from './user';
import { organizations } from './organization';
import { chartOfAccounts, journalEntries } from './gl';

// ============================================================================
// Enums
// ============================================================================

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue',
  'void',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer',
  'cheque',
  'online',
  'credit_card',
  'other',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

// ============================================================================
// Customers
// ============================================================================

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Customer identification
  customerNumber: varchar('customer_number', { length: 20 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }), // For display in dropdowns
  
  // Contact information
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  mobile: varchar('mobile', { length: 50 }),
  fax: varchar('fax', { length: 50 }),
  website: varchar('website', { length: 255 }),
  
  // Billing address
  billingAddress: text('billing_address'),
  billingCity: varchar('billing_city', { length: 100 }),
  billingState: varchar('billing_state', { length: 100 }),
  billingPostalCode: varchar('billing_postal_code', { length: 20 }),
  billingCountry: varchar('billing_country', { length: 100 }).default('Pakistan'),
  
  // Shipping address
  shippingAddress: text('shipping_address'),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingState: varchar('shipping_state', { length: 100 }),
  shippingPostalCode: varchar('shipping_postal_code', { length: 20 }),
  shippingCountry: varchar('shipping_country', { length: 100 }).default('Pakistan'),
  
  // Tax information (Pakistan FBR compliance)
  ntn: varchar('ntn', { length: 20 }), // National Tax Number (format: XXXXXXX-X)
  strn: varchar('strn', { length: 20 }), // Sales Tax Registration Number (13 digits)
  cnic: varchar('cnic', { length: 20 }), // For individuals
  
  // Credit & Terms
  creditLimit: decimal('credit_limit', { precision: 19, scale: 4 }).default('0'),
  paymentTerms: integer('payment_terms').default(30), // Days
  priceLevel: varchar('price_level', { length: 50 }), // 'standard', 'wholesale', 'vip', etc.
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  
  // Accounting
  receivableAccountId: uuid('receivable_account_id').references(() => chartOfAccounts.id),
  defaultRevenueAccountId: uuid('default_revenue_account_id').references(() => chartOfAccounts.id),
  
  // Running balances (updated on invoice/payment)
  currentBalance: decimal('current_balance', { precision: 19, scale: 4 }).notNull().default('0'),
  overdueBalance: decimal('overdue_balance', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Additional info
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  tenantIdx: index('customers_tenant_idx').on(table.tenantId),
  customerNumberIdx: index('customers_number_idx').on(table.tenantId, table.customerNumber),
  companyNameIdx: index('customers_company_name_idx').on(table.tenantId, table.companyName),
  emailIdx: index('customers_email_idx').on(table.tenantId, table.email),
  activeIdx: index('customers_active_idx').on(table.tenantId, table.isActive),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [customers.tenantId],
    references: [organizations.id],
  }),
  receivableAccount: one(chartOfAccounts, {
    fields: [customers.receivableAccountId],
    references: [chartOfAccounts.id],
  }),
  defaultRevenueAccount: one(chartOfAccounts, {
    fields: [customers.defaultRevenueAccountId],
    references: [chartOfAccounts.id],
  }),
  createdByUser: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
  }),
  invoices: many(invoices),
  payments: many(payments),
}));

// ============================================================================
// Invoices
// ============================================================================

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  
  // Invoice identification
  invoiceNumber: varchar('invoice_number', { length: 30 }).notNull(),
  referenceNumber: varchar('reference_number', { length: 50 }), // PO number, etc.
  
  // Dates
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  
  // Status
  status: invoiceStatusEnum('status').notNull().default('draft'),
  
  // Amounts
  subtotal: decimal('subtotal', { precision: 19, scale: 4 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  total: decimal('total', { precision: 19, scale: 4 }).notNull().default('0'),
  amountPaid: decimal('amount_paid', { precision: 19, scale: 4 }).notNull().default('0'),
  balance: decimal('balance', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Tax details (FBR compliance)
  taxBreakdown: jsonb('tax_breakdown').$type<TaxBreakdown[]>().default([]),
  
  // Customer info snapshot (at time of invoice)
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerNtn: varchar('customer_ntn', { length: 20 }),
  customerStrn: varchar('customer_strn', { length: 20 }),
  billingAddress: text('billing_address'),
  shippingAddress: text('shipping_address'),
  
  // Terms and notes
  terms: text('terms'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  
  // Currency (default PKR)
  currency: varchar('currency', { length: 3 }).notNull().default('PKR'),
  exchangeRate: decimal('exchange_rate', { precision: 15, scale: 6 }).default('1'),
  
  // GL Integration
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  revenueAccountId: uuid('revenue_account_id').references(() => chartOfAccounts.id),
  receivableAccountId: uuid('receivable_account_id').references(() => chartOfAccounts.id),
  
  // Email tracking
  sentAt: timestamp('sent_at', { withTimezone: true }),
  sentTo: varchar('sent_to', { length: 255 }),
  lastReminder: timestamp('last_reminder', { withTimezone: true }),
  reminderCount: integer('reminder_count').default(0),
  
  // Attachments
  attachments: jsonb('attachments').$type<InvoiceAttachment[]>().default([]),
  
  // Audit
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  finalizedBy: uuid('finalized_by').references(() => users.id),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
}, (table) => ({
  tenantIdx: index('invoices_tenant_idx').on(table.tenantId),
  customerIdx: index('invoices_customer_idx').on(table.customerId),
  numberIdx: index('invoices_number_idx').on(table.tenantId, table.invoiceNumber),
  statusIdx: index('invoices_status_idx').on(table.tenantId, table.status),
  dateIdx: index('invoices_date_idx').on(table.tenantId, table.invoiceDate),
  dueDateIdx: index('invoices_due_date_idx').on(table.tenantId, table.dueDate),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [invoices.tenantId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  lineItems: many(invoiceLineItems),
  journalEntry: one(journalEntries, {
    fields: [invoices.journalEntryId],
    references: [journalEntries.id],
  }),
  revenueAccount: one(chartOfAccounts, {
    fields: [invoices.revenueAccountId],
    references: [chartOfAccounts.id],
  }),
  receivableAccount: one(chartOfAccounts, {
    fields: [invoices.receivableAccountId],
    references: [chartOfAccounts.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  paymentApplications: many(paymentApplications),
}));

// ============================================================================
// Invoice Line Items
// ============================================================================

export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  
  // Line item details
  lineNumber: integer('line_number').notNull().default(1),
  itemId: uuid('item_id'), // Future: link to products/services table
  itemCode: varchar('item_code', { length: 50 }),
  description: text('description').notNull(),
  
  // Quantities and pricing
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull().default('1'),
  unitPrice: decimal('unit_price', { precision: 19, scale: 4 }).notNull().default('0'),
  unit: varchar('unit', { length: 20 }), // 'each', 'hour', 'kg', etc.
  
  // Discounts
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 19, scale: 4 }).default('0'),
  
  // Tax (GST for Pakistan)
  taxable: boolean('taxable').notNull().default(true),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull().default('17'), // 17% GST default
  taxAmount: decimal('tax_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Calculated totals
  subtotal: decimal('subtotal', { precision: 19, scale: 4 }).notNull().default('0'), // qty * unitPrice
  lineTotal: decimal('line_total', { precision: 19, scale: 4 }).notNull().default('0'), // After discount + tax
  
  // GL Account (override customer default)
  revenueAccountId: uuid('revenue_account_id').references(() => chartOfAccounts.id),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('invoice_line_items_invoice_idx').on(table.invoiceId),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  revenueAccount: one(chartOfAccounts, {
    fields: [invoiceLineItems.revenueAccountId],
    references: [chartOfAccounts.id],
  }),
}));

// ============================================================================
// Payments (Customer Payments Received)
// ============================================================================

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  
  // Payment identification
  paymentNumber: varchar('payment_number', { length: 30 }).notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }), // Cheque #, transaction ID
  
  // Dates
  paymentDate: date('payment_date').notNull(),
  
  // Amount
  amount: decimal('amount', { precision: 19, scale: 4 }).notNull(),
  appliedAmount: decimal('applied_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  unappliedAmount: decimal('unapplied_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Payment method details
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status: paymentStatusEnum('status').notNull().default('completed'),
  
  // Bank details
  bankAccountId: uuid('bank_account_id').references(() => chartOfAccounts.id),
  bankName: varchar('bank_name', { length: 100 }),
  chequeNumber: varchar('cheque_number', { length: 50 }),
  chequeDate: date('cheque_date'),
  transactionId: varchar('transaction_id', { length: 100 }),
  
  // Currency
  currency: varchar('currency', { length: 3 }).notNull().default('PKR'),
  exchangeRate: decimal('exchange_rate', { precision: 15, scale: 6 }).default('1'),
  
  // Notes
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  
  // GL Integration
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  // Audit
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  voidedBy: uuid('voided_by').references(() => users.id),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
}, (table) => ({
  tenantIdx: index('payments_tenant_idx').on(table.tenantId),
  customerIdx: index('payments_customer_idx').on(table.customerId),
  numberIdx: index('payments_number_idx').on(table.tenantId, table.paymentNumber),
  dateIdx: index('payments_date_idx').on(table.tenantId, table.paymentDate),
  statusIdx: index('payments_status_idx').on(table.tenantId, table.status),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  tenant: one(organizations, {
    fields: [payments.tenantId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  bankAccount: one(chartOfAccounts, {
    fields: [payments.bankAccountId],
    references: [chartOfAccounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [payments.journalEntryId],
    references: [journalEntries.id],
  }),
  createdByUser: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
  applications: many(paymentApplications),
}));

// ============================================================================
// Payment Applications (Links payments to invoices)
// ============================================================================

export const paymentApplications = pgTable('payment_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'restrict' }),
  
  // Amount applied to this invoice
  amount: decimal('amount', { precision: 19, scale: 4 }).notNull(),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  paymentIdx: index('payment_applications_payment_idx').on(table.paymentId),
  invoiceIdx: index('payment_applications_invoice_idx').on(table.invoiceId),
}));

export const paymentApplicationsRelations = relations(paymentApplications, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentApplications.paymentId],
    references: [payments.id],
  }),
  invoice: one(invoices, {
    fields: [paymentApplications.invoiceId],
    references: [invoices.id],
  }),
}));

// ============================================================================
// Credit Memos (Future enhancement - placeholder)
// ============================================================================

export const creditMemos = pgTable('credit_memos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  
  // Credit memo identification
  creditMemoNumber: varchar('credit_memo_number', { length: 30 }).notNull(),
  
  // Related invoice (if applicable)
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  
  // Dates
  creditMemoDate: date('credit_memo_date').notNull(),
  
  // Amounts
  subtotal: decimal('subtotal', { precision: 19, scale: 4 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  total: decimal('total', { precision: 19, scale: 4 }).notNull().default('0'),
  appliedAmount: decimal('applied_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  balance: decimal('balance', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Reason
  reason: text('reason'),
  notes: text('notes'),
  
  // GL Integration
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  // Audit
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('credit_memos_tenant_idx').on(table.tenantId),
  customerIdx: index('credit_memos_customer_idx').on(table.customerId),
  numberIdx: index('credit_memos_number_idx').on(table.tenantId, table.creditMemoNumber),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type PaymentApplication = typeof paymentApplications.$inferSelect;
export type NewPaymentApplication = typeof paymentApplications.$inferInsert;

export type CreditMemo = typeof creditMemos.$inferSelect;
export type NewCreditMemo = typeof creditMemos.$inferInsert;

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'online' | 'credit_card' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ============================================================================
// Helper Types
// ============================================================================

export interface TaxBreakdown {
  taxCode: string;
  taxName: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}
