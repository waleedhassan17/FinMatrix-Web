// Accounts Payable (AP) Schema - Vendors & Purchases
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization';
import { chartOfAccounts } from './gl';

// Enums
export const billStatusEnum = pgEnum('bill_status', [
  'draft',
  'pending_approval',
  'approved',
  'partially_paid',
  'paid',
  'cancelled',
]);

export const vendorPaymentMethodEnum = pgEnum('vendor_payment_method', [
  'bank_transfer',
  'cheque',
  'cash',
  'online',
  'credit_card',
]);

export const vendorPaymentStatusEnum = pgEnum('vendor_payment_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);

// Vendors Table
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  vendorNumber: varchar('vendor_number', { length: 50 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Pakistan'),
  postalCode: varchar('postal_code', { length: 20 }),
  ntn: varchar('ntn', { length: 50 }), // National Tax Number
  strn: varchar('strn', { length: 50 }), // Sales Tax Registration Number
  paymentTerms: integer('payment_terms').default(30), // Days
  defaultExpenseAccountId: uuid('default_expense_account_id').references(
    () => chartOfAccounts.id
  ),
  bankDetails: jsonb('bank_details').$type<{
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    branchCode?: string;
  }>(),
  notes: text('notes'),
  website: varchar('website', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bills Table (Vendor Invoices)
export const bills = pgTable('bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'restrict' }),
  billNumber: varchar('bill_number', { length: 50 }).notNull(),
  vendorInvoiceNumber: varchar('vendor_invoice_number', { length: 100 }), // Vendor's reference
  billDate: date('bill_date').notNull(),
  dueDate: date('due_date').notNull(),
  status: billStatusEnum('status').default('draft').notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).default('0').notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 15, scale: 2 }).default('0').notNull(),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).default('0').notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  apAccountId: uuid('ap_account_id').references(() => chartOfAccounts.id), // AP Account
  journalEntryId: uuid('journal_entry_id'), // Reference to GL journal entry
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bill Line Items Table
export const billLineItems = pgTable('bill_line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  billId: uuid('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'cascade' }),
  expenseAccountId: uuid('expense_account_id')
    .notNull()
    .references(() => chartOfAccounts.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).default('1').notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).default('0').notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0').notNull(), // Input GST rate
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Vendor Payments Table
export const vendorPayments = pgTable('vendor_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'restrict' }),
  paymentNumber: varchar('payment_number', { length: 50 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: vendorPaymentMethodEnum('payment_method').default('bank_transfer').notNull(),
  chequeNumber: varchar('cheque_number', { length: 50 }),
  bankAccountId: uuid('bank_account_id').references(() => chartOfAccounts.id),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  status: vendorPaymentStatusEnum('status').default('completed').notNull(),
  journalEntryId: uuid('journal_entry_id'), // Reference to GL journal entry
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment Applications (which bills this payment applies to)
export const vendorPaymentApplications = pgTable('vendor_payment_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => vendorPayments.id, { onDelete: 'cascade' }),
  billId: uuid('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'restrict' }),
  amountApplied: decimal('amount_applied', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Debit Memos (Vendor Credits/Returns)
export const debitMemos = pgTable('debit_memos', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'restrict' }),
  memoNumber: varchar('memo_number', { length: 50 }).notNull(),
  memoDate: date('memo_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).default('open').notNull(), // open, applied, cancelled
  appliedToBillId: uuid('applied_to_bill_id').references(() => bills.id),
  journalEntryId: uuid('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.tenantId],
    references: [organizations.id],
  }),
  defaultExpenseAccount: one(chartOfAccounts, {
    fields: [vendors.defaultExpenseAccountId],
    references: [chartOfAccounts.id],
  }),
  bills: many(bills),
  payments: many(vendorPayments),
  debitMemos: many(debitMemos),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bills.tenantId],
    references: [organizations.id],
  }),
  vendor: one(vendors, {
    fields: [bills.vendorId],
    references: [vendors.id],
  }),
  apAccount: one(chartOfAccounts, {
    fields: [bills.apAccountId],
    references: [chartOfAccounts.id],
  }),
  lineItems: many(billLineItems),
  paymentApplications: many(vendorPaymentApplications),
}));

export const billLineItemsRelations = relations(billLineItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billLineItems.billId],
    references: [bills.id],
  }),
  expenseAccount: one(chartOfAccounts, {
    fields: [billLineItems.expenseAccountId],
    references: [chartOfAccounts.id],
  }),
}));

export const vendorPaymentsRelations = relations(vendorPayments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendorPayments.tenantId],
    references: [organizations.id],
  }),
  vendor: one(vendors, {
    fields: [vendorPayments.vendorId],
    references: [vendors.id],
  }),
  bankAccount: one(chartOfAccounts, {
    fields: [vendorPayments.bankAccountId],
    references: [chartOfAccounts.id],
  }),
  applications: many(vendorPaymentApplications),
}));

export const vendorPaymentApplicationsRelations = relations(
  vendorPaymentApplications,
  ({ one }) => ({
    payment: one(vendorPayments, {
      fields: [vendorPaymentApplications.paymentId],
      references: [vendorPayments.id],
    }),
    bill: one(bills, {
      fields: [vendorPaymentApplications.billId],
      references: [bills.id],
    }),
  })
);

export const debitMemosRelations = relations(debitMemos, ({ one }) => ({
  organization: one(organizations, {
    fields: [debitMemos.tenantId],
    references: [organizations.id],
  }),
  vendor: one(vendors, {
    fields: [debitMemos.vendorId],
    references: [vendors.id],
  }),
  appliedToBill: one(bills, {
    fields: [debitMemos.appliedToBillId],
    references: [bills.id],
  }),
}));

// Type exports
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type BillLineItem = typeof billLineItems.$inferSelect;
export type NewBillLineItem = typeof billLineItems.$inferInsert;
export type VendorPayment = typeof vendorPayments.$inferSelect;
export type NewVendorPayment = typeof vendorPayments.$inferInsert;
export type VendorPaymentApplication = typeof vendorPaymentApplications.$inferSelect;
export type NewVendorPaymentApplication = typeof vendorPaymentApplications.$inferInsert;
export type DebitMemo = typeof debitMemos.$inferSelect;
export type NewDebitMemo = typeof debitMemos.$inferInsert;
