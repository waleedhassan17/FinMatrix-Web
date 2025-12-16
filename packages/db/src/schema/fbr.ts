// FBR (Federal Board of Revenue) Compliance Schema for Pakistan
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
import { users } from './user';

// ============================================================================
// Enums
// ============================================================================

export const taxTypeEnum = pgEnum('tax_type', [
  'gst', // General Sales Tax (17%)
  'reduced_gst', // Reduced GST rates (various)
  'zero_rated', // Zero-rated supplies
  'exempt', // Exempt from GST
  'further_tax', // 3% on unregistered persons
  'withholding', // Withholding tax
  'advance_tax', // Advance tax on imports
  'provincial', // Provincial sales tax
]);

export const taxReturnStatusEnum = pgEnum('tax_return_status', [
  'draft',
  'pending_review',
  'ready_to_file',
  'filed',
  'revised',
  'cancelled',
]);

export const taxPeriodTypeEnum = pgEnum('tax_period_type', [
  'monthly',
  'quarterly',
  'annual',
]);

export const businessTypeEnum = pgEnum('business_type', [
  'manufacturer',
  'importer',
  'exporter',
  'retailer',
  'wholesaler',
  'service_provider',
  'contractor',
  'other',
]);

export const supplyTypeEnum = pgEnum('supply_type', [
  'taxable_standard', // Standard 17%
  'taxable_reduced', // Reduced rates
  'zero_rated',
  'exempt',
  'export',
  'inter_provincial',
]);

export const purchaseTypeEnum = pgEnum('purchase_type', [
  'local_taxable',
  'local_exempt',
  'imports',
  'capital_goods',
  'services',
]);

// ============================================================================
// Tax Configuration
// ============================================================================

export const taxRates = pgTable('tax_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(), // e.g., 'GST_STANDARD', 'GST_REDUCED_10'
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  taxType: taxTypeEnum('tax_type').notNull(),
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(), // e.g., 17.00, 10.00, 0.00
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  applicableToSales: boolean('applicable_to_sales').default(true),
  applicableToPurchases: boolean('applicable_to_purchases').default(true),
  fbrTaxCode: varchar('fbr_tax_code', { length: 50 }), // FBR's official tax code
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Company Tax Registration
export const taxRegistration = pgTable('tax_registration', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ntn: varchar('ntn', { length: 50 }).notNull(), // National Tax Number
  strn: varchar('strn', { length: 50 }), // Sales Tax Registration Number
  businessType: businessTypeEnum('business_type').notNull(),
  registeredName: varchar('registered_name', { length: 255 }).notNull(),
  businessAddress: text('business_address'),
  principalBusinessActivity: varchar('principal_business_activity', { length: 255 }),
  taxOffice: varchar('tax_office', { length: 255 }), // FBR Regional Tax Office
  registrationDate: date('registration_date'),
  // Provincial registrations
  punjabStn: varchar('punjab_stn', { length: 50 }), // Punjab Sales Tax Number
  sindhSrn: varchar('sindh_srn', { length: 50 }), // Sindh Revenue Number
  kpkStn: varchar('kpk_stn', { length: 50 }), // KPK Sales Tax Number
  balochistanStn: varchar('balochistan_stn', { length: 50 }),
  // Additional info
  isActiveForGst: boolean('is_active_for_gst').default(true),
  isActiveForIncomeTax: boolean('is_active_for_income_tax').default(true),
  fiscalYearStart: integer('fiscal_year_start').default(7), // July (Pakistan's fiscal year)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Fiscal Periods for Tax Filing
export const taxFilingPeriods = pgTable('tax_filing_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  periodType: taxPeriodTypeEnum('period_type').notNull(),
  periodName: varchar('period_name', { length: 100 }).notNull(), // e.g., "December 2024"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  dueDate: date('due_date').notNull(), // Filing deadline
  fiscalYear: integer('fiscal_year').notNull(),
  periodNumber: integer('period_number').notNull(), // 1-12 for months
  isClosed: boolean('is_closed').default(false),
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Sales Tax Return (Form A - Output Tax)
// ============================================================================

export const salesTaxReturns = pgTable('sales_tax_returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  periodId: uuid('period_id')
    .notNull()
    .references(() => taxFilingPeriods.id),
  returnNumber: varchar('return_number', { length: 50 }).notNull(),
  returnType: varchar('return_type', { length: 20 }).default('original'), // original, revised
  status: taxReturnStatusEnum('status').default('draft').notNull(),
  
  // Taxable Supplies at Standard Rate (17%)
  taxableSuppliesValue: decimal('taxable_supplies_value', { precision: 15, scale: 2 }).default('0'),
  taxableSuppliesTax: decimal('taxable_supplies_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Taxable Supplies at Reduced Rates
  reducedRateSuppliesValue: decimal('reduced_rate_supplies_value', { precision: 15, scale: 2 }).default('0'),
  reducedRateSuppliesTax: decimal('reduced_rate_supplies_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Zero-Rated Supplies
  zeroRatedSuppliesValue: decimal('zero_rated_supplies_value', { precision: 15, scale: 2 }).default('0'),
  
  // Exempt Supplies
  exemptSuppliesValue: decimal('exempt_supplies_value', { precision: 15, scale: 2 }).default('0'),
  
  // Export Supplies
  exportSuppliesValue: decimal('export_supplies_value', { precision: 15, scale: 2 }).default('0'),
  
  // Further Tax (3% on unregistered persons)
  furtherTaxValue: decimal('further_tax_value', { precision: 15, scale: 2 }).default('0'),
  furtherTaxAmount: decimal('further_tax_amount', { precision: 15, scale: 2 }).default('0'),
  
  // Totals
  totalSuppliesValue: decimal('total_supplies_value', { precision: 15, scale: 2 }).default('0'),
  totalOutputTax: decimal('total_output_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Filing info
  filedAt: timestamp('filed_at'),
  filedBy: uuid('filed_by').references(() => users.id),
  fbrReferenceNumber: varchar('fbr_reference_number', { length: 100 }),
  fbrAcknowledgement: jsonb('fbr_acknowledgement'), // Store FBR response
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Sales Tax Return Line Items (Detail of supplies)
export const salesTaxReturnLines = pgTable('sales_tax_return_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  returnId: uuid('return_id')
    .notNull()
    .references(() => salesTaxReturns.id, { onDelete: 'cascade' }),
  supplyType: supplyTypeEnum('supply_type').notNull(),
  customerId: uuid('customer_id'), // Reference to customer if applicable
  customerNtn: varchar('customer_ntn', { length: 50 }),
  customerStrn: varchar('customer_strn', { length: 50 }),
  customerName: varchar('customer_name', { length: 255 }),
  invoiceCount: integer('invoice_count').default(0),
  grossValue: decimal('gross_value', { precision: 15, scale: 2 }).default('0'),
  taxableValue: decimal('taxable_value', { precision: 15, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  furtherTax: decimal('further_tax', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Input Tax Claim (Form B)
// ============================================================================

export const inputTaxClaims = pgTable('input_tax_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  periodId: uuid('period_id')
    .notNull()
    .references(() => taxFilingPeriods.id),
  claimNumber: varchar('claim_number', { length: 50 }).notNull(),
  status: taxReturnStatusEnum('status').default('draft').notNull(),
  
  // Local Purchases
  localPurchasesValue: decimal('local_purchases_value', { precision: 15, scale: 2 }).default('0'),
  localPurchasesTax: decimal('local_purchases_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Imports
  importsValue: decimal('imports_value', { precision: 15, scale: 2 }).default('0'),
  importsTax: decimal('imports_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Capital Goods
  capitalGoodsValue: decimal('capital_goods_value', { precision: 15, scale: 2 }).default('0'),
  capitalGoodsTax: decimal('capital_goods_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Services
  servicesValue: decimal('services_value', { precision: 15, scale: 2 }).default('0'),
  servicesTax: decimal('services_tax', { precision: 15, scale: 2 }).default('0'),
  
  // Adjustments
  previousPeriodAdjustment: decimal('previous_period_adjustment', { precision: 15, scale: 2 }).default('0'),
  
  // Totals
  totalPurchasesValue: decimal('total_purchases_value', { precision: 15, scale: 2 }).default('0'),
  totalInputTax: decimal('total_input_tax', { precision: 15, scale: 2 }).default('0'),
  claimableInputTax: decimal('claimable_input_tax', { precision: 15, scale: 2 }).default('0'),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Input Tax Claim Line Items
export const inputTaxClaimLines = pgTable('input_tax_claim_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  claimId: uuid('claim_id')
    .notNull()
    .references(() => inputTaxClaims.id, { onDelete: 'cascade' }),
  purchaseType: purchaseTypeEnum('purchase_type').notNull(),
  vendorId: uuid('vendor_id'),
  vendorNtn: varchar('vendor_ntn', { length: 50 }),
  vendorStrn: varchar('vendor_strn', { length: 50 }),
  vendorName: varchar('vendor_name', { length: 255 }),
  billCount: integer('bill_count').default(0),
  grossValue: decimal('gross_value', { precision: 15, scale: 2 }).default('0'),
  taxableValue: decimal('taxable_value', { precision: 15, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  isClaimable: boolean('is_claimable').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// GST Reconciliation
// ============================================================================

export const gstReconciliations = pgTable('gst_reconciliations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  periodId: uuid('period_id')
    .notNull()
    .references(() => taxFilingPeriods.id),
  salesTaxReturnId: uuid('sales_tax_return_id').references(() => salesTaxReturns.id),
  inputTaxClaimId: uuid('input_tax_claim_id').references(() => inputTaxClaims.id),
  
  // Summary
  totalOutputTax: decimal('total_output_tax', { precision: 15, scale: 2 }).default('0'),
  totalInputTax: decimal('total_input_tax', { precision: 15, scale: 2 }).default('0'),
  netTaxPayable: decimal('net_tax_payable', { precision: 15, scale: 2 }).default('0'), // Positive = payable, Negative = refundable
  
  // Carry forward
  previousPeriodCredit: decimal('previous_period_credit', { precision: 15, scale: 2 }).default('0'),
  carryForwardCredit: decimal('carry_forward_credit', { precision: 15, scale: 2 }).default('0'),
  
  // Payment info
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).default('0'),
  paymentDate: date('payment_date'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  cprNumber: varchar('cpr_number', { length: 100 }), // Computerized Payment Receipt
  
  status: varchar('status', { length: 20 }).default('pending'), // pending, paid, refund_claimed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// Withholding Tax Records (Section 153)
// ============================================================================

export const withholdingTaxRecords = pgTable('withholding_tax_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'payment', 'invoice'
  transactionId: uuid('transaction_id'), // Reference to payment or invoice
  transactionDate: date('transaction_date').notNull(),
  vendorId: uuid('vendor_id'),
  vendorNtn: varchar('vendor_ntn', { length: 50 }),
  vendorName: varchar('vendor_name', { length: 255 }),
  vendorType: varchar('vendor_type', { length: 50 }), // 'company', 'individual', 'aop'
  isFiler: boolean('is_filer').default(false), // FBR Active Taxpayer status
  
  // Amounts
  grossAmount: decimal('gross_amount', { precision: 15, scale: 2 }).notNull(),
  withholdingSection: varchar('withholding_section', { length: 50 }).notNull(), // '153(1)(a)', '153(1)(b)', etc.
  withholdingRate: decimal('withholding_rate', { precision: 5, scale: 2 }).notNull(),
  withholdingAmount: decimal('withholding_amount', { precision: 15, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 15, scale: 2 }).notNull(),
  
  // Status
  isDeposited: boolean('is_deposited').default(false),
  depositDate: date('deposit_date'),
  cprNumber: varchar('cpr_number', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// FBR API Integration Logs
// ============================================================================

export const fbrApiLogs = pgTable('fbr_api_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  apiEndpoint: varchar('api_endpoint', { length: 255 }).notNull(),
  requestType: varchar('request_type', { length: 20 }).notNull(), // GET, POST, etc.
  requestPayload: jsonb('request_payload'),
  responseCode: integer('response_code'),
  responsePayload: jsonb('response_payload'),
  isSuccess: boolean('is_success').default(false),
  errorMessage: text('error_message'),
  referenceId: uuid('reference_id'), // Link to related record
  referenceType: varchar('reference_type', { length: 50 }), // 'sales_tax_return', 'invoice', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

// ============================================================================
// Relations
// ============================================================================

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  organization: one(organizations, {
    fields: [taxRates.tenantId],
    references: [organizations.id],
  }),
}));

export const taxRegistrationRelations = relations(taxRegistration, ({ one }) => ({
  organization: one(organizations, {
    fields: [taxRegistration.tenantId],
    references: [organizations.id],
  }),
}));

export const taxFilingPeriodsRelations = relations(taxFilingPeriods, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [taxFilingPeriods.tenantId],
    references: [organizations.id],
  }),
  closedByUser: one(users, {
    fields: [taxFilingPeriods.closedBy],
    references: [users.id],
  }),
  salesTaxReturns: many(salesTaxReturns),
  inputTaxClaims: many(inputTaxClaims),
  reconciliations: many(gstReconciliations),
}));

export const salesTaxReturnsRelations = relations(salesTaxReturns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [salesTaxReturns.tenantId],
    references: [organizations.id],
  }),
  period: one(taxFilingPeriods, {
    fields: [salesTaxReturns.periodId],
    references: [taxFilingPeriods.id],
  }),
  filedByUser: one(users, {
    fields: [salesTaxReturns.filedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [salesTaxReturns.createdBy],
    references: [users.id],
  }),
  lines: many(salesTaxReturnLines),
}));

export const salesTaxReturnLinesRelations = relations(salesTaxReturnLines, ({ one }) => ({
  return: one(salesTaxReturns, {
    fields: [salesTaxReturnLines.returnId],
    references: [salesTaxReturns.id],
  }),
}));

export const inputTaxClaimsRelations = relations(inputTaxClaims, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inputTaxClaims.tenantId],
    references: [organizations.id],
  }),
  period: one(taxFilingPeriods, {
    fields: [inputTaxClaims.periodId],
    references: [taxFilingPeriods.id],
  }),
  createdByUser: one(users, {
    fields: [inputTaxClaims.createdBy],
    references: [users.id],
  }),
  lines: many(inputTaxClaimLines),
}));

export const inputTaxClaimLinesRelations = relations(inputTaxClaimLines, ({ one }) => ({
  claim: one(inputTaxClaims, {
    fields: [inputTaxClaimLines.claimId],
    references: [inputTaxClaims.id],
  }),
}));

export const gstReconciliationsRelations = relations(gstReconciliations, ({ one }) => ({
  organization: one(organizations, {
    fields: [gstReconciliations.tenantId],
    references: [organizations.id],
  }),
  period: one(taxFilingPeriods, {
    fields: [gstReconciliations.periodId],
    references: [taxFilingPeriods.id],
  }),
  salesTaxReturn: one(salesTaxReturns, {
    fields: [gstReconciliations.salesTaxReturnId],
    references: [salesTaxReturns.id],
  }),
  inputTaxClaim: one(inputTaxClaims, {
    fields: [gstReconciliations.inputTaxClaimId],
    references: [inputTaxClaims.id],
  }),
}));

export const withholdingTaxRecordsRelations = relations(withholdingTaxRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [withholdingTaxRecords.tenantId],
    references: [organizations.id],
  }),
}));

export const fbrApiLogsRelations = relations(fbrApiLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [fbrApiLogs.tenantId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [fbrApiLogs.createdBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;
export type TaxRegistration = typeof taxRegistration.$inferSelect;
export type NewTaxRegistration = typeof taxRegistration.$inferInsert;
export type TaxFilingPeriod = typeof taxFilingPeriods.$inferSelect;
export type NewTaxFilingPeriod = typeof taxFilingPeriods.$inferInsert;
export type SalesTaxReturn = typeof salesTaxReturns.$inferSelect;
export type NewSalesTaxReturn = typeof salesTaxReturns.$inferInsert;
export type SalesTaxReturnLine = typeof salesTaxReturnLines.$inferSelect;
export type InputTaxClaim = typeof inputTaxClaims.$inferSelect;
export type NewInputTaxClaim = typeof inputTaxClaims.$inferInsert;
export type InputTaxClaimLine = typeof inputTaxClaimLines.$inferSelect;
export type GstReconciliation = typeof gstReconciliations.$inferSelect;
export type WithholdingTaxRecord = typeof withholdingTaxRecords.$inferSelect;
export type FbrApiLog = typeof fbrApiLogs.$inferSelect;
