// Accounts Receivable Database Queries
// CRUD operations and queries for Customers, Invoices, Payments

import { eq, and, desc, asc, sql, gte, lte, or, like, isNull, ne, inArray, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  customers,
  invoices,
  invoiceLineItems,
  payments,
  paymentApplications,
  Customer,
  Invoice,
  InvoiceLineItem,
  Payment,
  PaymentApplication,
  InvoiceStatus,
} from '../schema/ar';
import { chartOfAccounts, journalEntries, transactionLines } from '../schema/gl';
import type {
  CustomerListItem,
  CustomerInput,
  CustomerSearchResult,
  CustomerFilters,
  InvoiceListItem,
  InvoiceWithLines,
  InvoiceInput,
  InvoiceFilters,
  PaymentListItem,
  PaymentWithApplications,
  PaymentInput,
  PaymentFilters,
  OutstandingInvoice,
  ARAgingRow,
  ARAgingReport,
  ARDashboardStats,
  ARRecentActivity,
  PaginationParams,
  PaginatedResult,
} from '../types/ar';

// Helper to format Date to YYYY-MM-DD string
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to calculate days overdue
function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// ============================================================================
// Customer Queries
// ============================================================================

/**
 * Get all customers for a tenant with optional filters
 */
export async function getCustomers(
  db: NodePgDatabase<any>,
  tenantId: string,
  filters?: CustomerFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<CustomerListItem>> {
  const conditions = [eq(customers.tenantId, tenantId)];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(customers.isActive, filters.isActive));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(customers.companyName, searchTerm),
        like(customers.customerNumber, searchTerm),
        like(customers.email, searchTerm),
        like(customers.contactName, searchTerm)
      )!
    );
  }

  if (filters?.hasBalance) {
    conditions.push(sql`${customers.currentBalance}::numeric > 0`);
  }

  if (filters?.isOverdue) {
    conditions.push(sql`${customers.overdueBalance}::numeric > 0`);
  }

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(customers)
    .where(and(...conditions));

  // Determine sort order
  let orderBy: any = desc(customers.createdAt);
  if (filters?.sortBy) {
    const column = {
      companyName: customers.companyName,
      customerNumber: customers.customerNumber,
      currentBalance: customers.currentBalance,
      createdAt: customers.createdAt,
    }[filters.sortBy];
    
    orderBy = filters.sortOrder === 'asc' ? asc(column) : desc(column);
  }

  // Pagination
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const rawData = await db
    .select({
      id: customers.id,
      customerNumber: customers.customerNumber,
      companyName: customers.companyName,
      displayName: customers.displayName,
      contactName: customers.contactName,
      email: customers.email,
      phone: customers.phone,
      currentBalance: customers.currentBalance,
      overdueBalance: customers.overdueBalance,
      isActive: customers.isActive,
      creditLimit: customers.creditLimit,
      paymentTerms: customers.paymentTerms,
    })
    .from(customers)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // Ensure creditLimit is always a string (not null)
  const data = rawData.map(row => ({
    ...row,
    creditLimit: row.creditLimit ?? '0',
  }));

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(
  db: NodePgDatabase<any>,
  tenantId: string,
  customerId: string
): Promise<Customer | null> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.id, customerId)))
    .limit(1);

  return customer || null;
}

/**
 * Search customers for autocomplete
 */
export async function searchCustomers(
  db: NodePgDatabase<any>,
  tenantId: string,
  searchTerm: string,
  limit = 10
): Promise<CustomerSearchResult[]> {
  const term = `%${searchTerm}%`;
  
  const results = await db
    .select({
      id: customers.id,
      customerNumber: customers.customerNumber,
      companyName: customers.companyName,
      displayName: customers.displayName,
      email: customers.email,
      currentBalance: customers.currentBalance,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        eq(customers.isActive, true),
        or(
          like(customers.companyName, term),
          like(customers.customerNumber, term),
          like(customers.email, term)
        )
      )
    )
    .orderBy(customers.companyName)
    .limit(limit);

  return results;
}

/**
 * Get recent customers for quick selection
 */
export async function getRecentCustomers(
  db: NodePgDatabase<any>,
  tenantId: string,
  limit = 5
): Promise<CustomerSearchResult[]> {
  // Get customers from recent invoices
  const recentInvoices = await db
    .selectDistinct({ customerId: invoices.customerId })
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId))
    .orderBy(desc(invoices.createdAt))
    .limit(limit * 2);

  if (recentInvoices.length === 0) {
    // Fall back to most recently created customers
    return db
      .select({
        id: customers.id,
        customerNumber: customers.customerNumber,
        companyName: customers.companyName,
        displayName: customers.displayName,
        email: customers.email,
        currentBalance: customers.currentBalance,
      })
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.isActive, true)))
      .orderBy(desc(customers.createdAt))
      .limit(limit);
  }

  const customerIds = recentInvoices.map(i => i.customerId);
  
  return db
    .select({
      id: customers.id,
      customerNumber: customers.customerNumber,
      companyName: customers.companyName,
      displayName: customers.displayName,
      email: customers.email,
      currentBalance: customers.currentBalance,
    })
    .from(customers)
    .where(inArray(customers.id, customerIds))
    .limit(limit);
}

/**
 * Create a new customer
 */
export async function createCustomer(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: CustomerInput,
  userId: string
): Promise<Customer> {
  // Generate customer number if not provided
  let customerNumber = input.customerNumber;
  if (!customerNumber) {
    const [lastCustomer] = await db
      .select({ customerNumber: customers.customerNumber })
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.createdAt))
      .limit(1);

    const lastNum = lastCustomer?.customerNumber
      ? parseInt(lastCustomer.customerNumber.replace(/\D/g, ''), 10) || 0
      : 0;
    customerNumber = `CUST-${String(lastNum + 1).padStart(5, '0')}`;
  }

  const [customer] = await db
    .insert(customers)
    .values({
      tenantId,
      customerNumber,
      companyName: input.companyName,
      displayName: input.displayName || input.companyName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      billingAddress: input.billingAddress,
      billingCity: input.billingCity,
      billingState: input.billingState,
      billingPostalCode: input.billingPostalCode,
      billingCountry: input.billingCountry || 'Pakistan',
      shippingAddress: input.shippingAddress,
      shippingCity: input.shippingCity,
      shippingState: input.shippingState,
      shippingPostalCode: input.shippingPostalCode,
      shippingCountry: input.shippingCountry || 'Pakistan',
      ntn: input.ntn,
      strn: input.strn,
      cnic: input.cnic,
      creditLimit: input.creditLimit?.toString() ?? '0',
      paymentTerms: input.paymentTerms ?? 30,
      priceLevel: input.priceLevel,
      discountPercent: input.discountPercent?.toString() ?? '0',
      notes: input.notes,
      tags: input.tags ?? [],
      createdBy: userId,
    })
    .returning();

  return customer;
}

/**
 * Update a customer
 */
export async function updateCustomer(
  db: NodePgDatabase<any>,
  tenantId: string,
  customerId: string,
  input: Partial<CustomerInput>
): Promise<Customer | null> {
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Copy allowed fields
  const allowedFields = [
    'companyName', 'displayName', 'contactName', 'email', 'phone', 'mobile',
    'billingAddress', 'billingCity', 'billingState', 'billingPostalCode', 'billingCountry',
    'shippingAddress', 'shippingCity', 'shippingState', 'shippingPostalCode', 'shippingCountry',
    'ntn', 'strn', 'cnic', 'creditLimit', 'paymentTerms', 'priceLevel', 'discountPercent',
    'notes', 'tags'
  ];

  for (const field of allowedFields) {
    if (field in input) {
      updateData[field] = (input as any)[field];
    }
  }

  const [customer] = await db
    .update(customers)
    .set(updateData)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.id, customerId)))
    .returning();

  return customer || null;
}

/**
 * Update customer balance (called after invoice/payment operations)
 */
export async function updateCustomerBalance(
  db: NodePgDatabase<any>,
  tenantId: string,
  customerId: string
): Promise<void> {
  // Calculate current balance from all unpaid invoices
  const balanceResult = await db
    .select({
      currentBalance: sql<string>`COALESCE(SUM(${invoices.balance}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, customerId),
        ne(invoices.status, 'void'),
        ne(invoices.status, 'draft'),
        sql`${invoices.balance}::numeric > 0`
      )
    );

  // Calculate overdue balance
  const today = formatDateString(new Date());
  const overdueResult = await db
    .select({
      overdueBalance: sql<string>`COALESCE(SUM(${invoices.balance}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, customerId),
        ne(invoices.status, 'void'),
        ne(invoices.status, 'draft'),
        sql`${invoices.balance}::numeric > 0`,
        lte(invoices.dueDate, today)
      )
    );

  await db
    .update(customers)
    .set({
      currentBalance: balanceResult[0]?.currentBalance ?? '0',
      overdueBalance: overdueResult[0]?.overdueBalance ?? '0',
      updatedAt: new Date(),
    })
    .where(and(eq(customers.tenantId, tenantId), eq(customers.id, customerId)));
}

// ============================================================================
// Invoice Queries
// ============================================================================

/**
 * Get invoices with optional filters
 */
export async function getInvoices(
  db: NodePgDatabase<any>,
  tenantId: string,
  filters?: InvoiceFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<InvoiceListItem>> {
  const conditions = [eq(invoices.tenantId, tenantId)];

  if (filters?.customerId) {
    conditions.push(eq(invoices.customerId, filters.customerId));
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(inArray(invoices.status, filters.status));
    } else {
      conditions.push(eq(invoices.status, filters.status));
    }
  }

  if (filters?.dateFrom) {
    conditions.push(gte(invoices.invoiceDate, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(invoices.invoiceDate, filters.dateTo));
  }

  if (filters?.dueDateFrom) {
    conditions.push(gte(invoices.dueDate, filters.dueDateFrom));
  }

  if (filters?.dueDateTo) {
    conditions.push(lte(invoices.dueDate, filters.dueDateTo));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(invoices.invoiceNumber, searchTerm),
        like(invoices.customerName, searchTerm),
        like(invoices.referenceNumber, searchTerm)
      )!
    );
  }

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(invoices)
    .where(and(...conditions));

  // Sort order
  let orderBy: any = desc(invoices.invoiceDate);
  if (filters?.sortBy) {
    const column = {
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      balance: invoices.balance,
    }[filters.sortBy];
    
    orderBy = filters.sortOrder === 'asc' ? asc(column) : desc(column);
  }

  // Pagination
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const today = formatDateString(new Date());
  
  const data = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      status: invoices.status,
      customerName: invoices.customerName,
      customerId: invoices.customerId,
      total: invoices.total,
      balance: invoices.balance,
      amountPaid: invoices.amountPaid,
    })
    .from(invoices)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // Calculate days overdue for each invoice
  const result: InvoiceListItem[] = data.map(inv => ({
    ...inv,
    daysOverdue: calculateDaysOverdue(inv.dueDate),
  }));

  return {
    data: result,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get single invoice with line items
 */
export async function getInvoiceById(
  db: NodePgDatabase<any>,
  tenantId: string,
  invoiceId: string
): Promise<InvoiceWithLines | null> {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.tenantId, tenantId), eq(invoices.id, invoiceId)))
    .limit(1);

  if (!invoice) return null;

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceLineItems.lineNumber));

  // Get payment applications
  const applications = await db
    .select({
      id: paymentApplications.id,
      invoiceId: paymentApplications.invoiceId,
      amount: paymentApplications.amount,
      paymentId: payments.id,
      paymentNumber: payments.paymentNumber,
      paymentDate: payments.paymentDate,
    })
    .from(paymentApplications)
    .innerJoin(payments, eq(paymentApplications.paymentId, payments.id))
    .where(eq(paymentApplications.invoiceId, invoiceId));

  return {
    ...invoice,
    lineItems,
    paymentHistory: applications.map(a => ({
      id: a.id,
      invoiceId: a.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      invoiceTotal: invoice.total,
      amount: a.amount,
    })),
  };
}

/**
 * Get next invoice number
 */
export async function getNextInvoiceNumber(
  db: NodePgDatabase<any>,
  tenantId: string,
  prefix = 'INV'
): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const [lastInvoice] = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(and(eq(invoices.tenantId, tenantId), like(invoices.invoiceNumber, pattern)))
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  let nextNum = 1;
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${year}-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Create an invoice with line items
 */
export async function createInvoice(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: InvoiceInput,
  userId: string
): Promise<InvoiceWithLines> {
  // Get customer details
  const customer = await getCustomerById(db, tenantId, input.customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Generate invoice number if not provided
  const invoiceNumber = input.invoiceNumber || await getNextInvoiceNumber(db, tenantId);

  // Calculate line item totals
  let subtotal = 0;
  let totalTax = 0;
  const processedLines: any[] = [];

  for (let i = 0; i < input.lineItems.length; i++) {
    const line = input.lineItems[i];
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmt = line.discountPercent 
      ? lineSubtotal * (line.discountPercent / 100) 
      : (line.discountAmount || 0);
    const taxableAmount = lineSubtotal - discountAmt;
    const taxAmount = line.taxable !== false 
      ? taxableAmount * ((line.taxRate ?? 17) / 100) 
      : 0;
    const lineTotal = taxableAmount + taxAmount;

    subtotal += lineSubtotal;
    totalTax += taxAmount;

    processedLines.push({
      lineNumber: i + 1,
      itemId: line.itemId,
      itemCode: line.itemCode,
      description: line.description,
      quantity: line.quantity.toString(),
      unitPrice: line.unitPrice.toString(),
      unit: line.unit,
      discountPercent: (line.discountPercent ?? 0).toString(),
      discountAmount: discountAmt.toString(),
      taxable: line.taxable !== false,
      taxRate: (line.taxRate ?? 17).toString(),
      taxAmount: taxAmount.toString(),
      subtotal: lineSubtotal.toString(),
      lineTotal: lineTotal.toString(),
      revenueAccountId: line.revenueAccountId,
    });
  }

  // Calculate invoice totals
  const discountAmount = input.discountPercent 
    ? subtotal * (input.discountPercent / 100) 
    : 0;
  const shippingAmount = input.shippingAmount || 0;
  const total = subtotal - discountAmount + totalTax + shippingAmount;

  // Create invoice
  const [invoice] = await db
    .insert(invoices)
    .values({
      tenantId,
      customerId: input.customerId,
      invoiceNumber,
      referenceNumber: input.referenceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      status: 'draft',
      subtotal: subtotal.toString(),
      discountAmount: discountAmount.toString(),
      discountPercent: (input.discountPercent ?? 0).toString(),
      taxAmount: totalTax.toString(),
      shippingAmount: shippingAmount.toString(),
      total: total.toString(),
      amountPaid: '0',
      balance: total.toString(),
      taxBreakdown: [{
        taxCode: 'GST',
        taxName: 'GST (17%)',
        rate: 17,
        taxableAmount: subtotal - discountAmount,
        taxAmount: totalTax,
      }],
      customerName: customer.companyName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerNtn: customer.ntn,
      customerStrn: customer.strn,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      terms: input.terms,
      notes: input.notes,
      internalNotes: input.internalNotes,
      currency: input.currency || 'PKR',
      revenueAccountId: input.revenueAccountId,
      receivableAccountId: input.receivableAccountId,
      createdBy: userId,
    })
    .returning();

  // Create line items
  const lineItems = await db
    .insert(invoiceLineItems)
    .values(processedLines.map(line => ({
      invoiceId: invoice.id,
      ...line,
    })))
    .returning();

  return {
    ...invoice,
    lineItems,
  };
}

/**
 * Finalize an invoice (post to GL)
 */
export async function finalizeInvoice(
  db: NodePgDatabase<any>,
  tenantId: string,
  invoiceId: string,
  userId: string,
  options: {
    receivableAccountId: string;
    revenueAccountId: string;
    taxPayableAccountId?: string;
  }
): Promise<Invoice> {
  const invoice = await getInvoiceById(db, tenantId, invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'draft') {
    throw new Error('Only draft invoices can be finalized');
  }

  const total = parseFloat(invoice.total);
  const taxAmount = parseFloat(invoice.taxAmount);
  const revenueAmount = total - taxAmount;

  // Get fiscal year and period
  const invoiceDate = new Date(invoice.invoiceDate);
  const fiscalYear = invoiceDate.getMonth() >= 6 
    ? invoiceDate.getFullYear() + 1 
    : invoiceDate.getFullYear();
  const fiscalPeriod = ((invoiceDate.getMonth() + 7) % 12) || 12;

  // Generate journal entry number
  const [lastEntry] = await db
    .select({ entryNumber: journalEntries.entryNumber })
    .from(journalEntries)
    .where(eq(journalEntries.tenantId, tenantId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(1);

  let entryNum = 1;
  if (lastEntry?.entryNumber) {
    const match = lastEntry.entryNumber.match(/(\d+)$/);
    if (match) entryNum = parseInt(match[1], 10) + 1;
  }
  const entryNumber = `GL-${fiscalYear}-${String(entryNum).padStart(5, '0')}`;

  // Create journal entry
  const [journalEntry] = await db
    .insert(journalEntries)
    .values({
      tenantId,
      entryNumber,
      date: invoice.invoiceDate,
      memo: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
      reference: invoice.invoiceNumber,
      status: 'posted',
      totalDebit: total.toString(),
      totalCredit: total.toString(),
      fiscalYear,
      fiscalPeriod,
      isAutoGenerated: true,
      sourceType: 'invoice',
      sourceId: invoice.id,
      createdBy: userId,
      postedBy: userId,
      postedAt: new Date(),
    })
    .returning();

  // Create transaction lines
  const txLines = [
    // Debit: Accounts Receivable
    {
      journalEntryId: journalEntry.id,
      accountId: options.receivableAccountId,
      debit: total.toString(),
      credit: '0',
      memo: `Invoice ${invoice.invoiceNumber}`,
      customerId: invoice.customerId,
      lineNumber: 1,
    },
    // Credit: Revenue Account
    {
      journalEntryId: journalEntry.id,
      accountId: options.revenueAccountId,
      debit: '0',
      credit: revenueAmount.toString(),
      memo: `Invoice ${invoice.invoiceNumber} - Revenue`,
      customerId: invoice.customerId,
      lineNumber: 2,
    },
  ];

  // Add tax line if there's tax
  if (taxAmount > 0 && options.taxPayableAccountId) {
    txLines.push({
      journalEntryId: journalEntry.id,
      accountId: options.taxPayableAccountId,
      debit: '0',
      credit: taxAmount.toString(),
      memo: `Invoice ${invoice.invoiceNumber} - GST Payable`,
      customerId: invoice.customerId,
      lineNumber: 3,
    });
  }

  await db.insert(transactionLines).values(txLines);

  // Update account balances
  await db
    .update(chartOfAccounts)
    .set({
      currentBalance: sql`${chartOfAccounts.currentBalance}::numeric + ${total}`,
      updatedAt: new Date(),
    })
    .where(eq(chartOfAccounts.id, options.receivableAccountId));

  await db
    .update(chartOfAccounts)
    .set({
      currentBalance: sql`${chartOfAccounts.currentBalance}::numeric + ${revenueAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(chartOfAccounts.id, options.revenueAccountId));

  if (options.taxPayableAccountId && taxAmount > 0) {
    await db
      .update(chartOfAccounts)
      .set({
        currentBalance: sql`${chartOfAccounts.currentBalance}::numeric + ${taxAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(chartOfAccounts.id, options.taxPayableAccountId));
  }

  // Update invoice status
  const [updatedInvoice] = await db
    .update(invoices)
    .set({
      status: 'sent',
      journalEntryId: journalEntry.id,
      receivableAccountId: options.receivableAccountId,
      revenueAccountId: options.revenueAccountId,
      finalizedBy: userId,
      finalizedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning();

  // Update customer balance
  await updateCustomerBalance(db, tenantId, invoice.customerId);

  return updatedInvoice;
}

/**
 * Update invoice status based on payments and due date
 */
export async function updateInvoiceStatus(
  db: NodePgDatabase<any>,
  invoiceId: string
): Promise<void> {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice || invoice.status === 'void' || invoice.status === 'draft') {
    return;
  }

  const balance = parseFloat(invoice.balance);
  const total = parseFloat(invoice.total);
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);

  let newStatus: InvoiceStatus = invoice.status;

  if (balance <= 0) {
    newStatus = 'paid';
  } else if (balance < total) {
    newStatus = 'partial';
  } else if (today > dueDate) {
    newStatus = 'overdue';
  } else {
    newStatus = 'sent';
  }

  if (newStatus !== invoice.status) {
    await db
      .update(invoices)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  }
}

/**
 * Get outstanding invoices for a customer
 */
export async function getOutstandingInvoices(
  db: NodePgDatabase<any>,
  tenantId: string,
  customerId: string
): Promise<OutstandingInvoice[]> {
  const results = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      balance: invoices.balance,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        eq(invoices.customerId, customerId),
        ne(invoices.status, 'void'),
        ne(invoices.status, 'draft'),
        ne(invoices.status, 'paid'),
        sql`${invoices.balance}::numeric > 0`
      )
    )
    .orderBy(asc(invoices.invoiceDate));

  const today = formatDateString(new Date());

  return results.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    total: parseFloat(inv.total),
    balance: parseFloat(inv.balance),
    daysOverdue: calculateDaysOverdue(inv.dueDate),
    isOverdue: inv.dueDate < today,
  }));
}

// ============================================================================
// Payment Queries
// ============================================================================

/**
 * Get payments with optional filters
 */
export async function getPayments(
  db: NodePgDatabase<any>,
  tenantId: string,
  filters?: PaymentFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<PaymentListItem>> {
  const conditions = [eq(payments.tenantId, tenantId)];

  if (filters?.customerId) {
    conditions.push(eq(payments.customerId, filters.customerId));
  }

  if (filters?.dateFrom) {
    conditions.push(gte(payments.paymentDate, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(payments.paymentDate, filters.dateTo));
  }

  if (filters?.paymentMethod) {
    conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(payments.paymentNumber, searchTerm),
        like(payments.referenceNumber, searchTerm)
      )!
    );
  }

  // Count
  const [{ total }] = await db
    .select({ total: count() })
    .from(payments)
    .where(and(...conditions));

  // Sort
  let orderBy: any = desc(payments.paymentDate);
  if (filters?.sortBy) {
    const column = {
      paymentNumber: payments.paymentNumber,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
    }[filters.sortBy];
    
    orderBy = filters.sortOrder === 'asc' ? asc(column) : desc(column);
  }

  // Pagination
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const data = await db
    .select({
      id: payments.id,
      paymentNumber: payments.paymentNumber,
      paymentDate: payments.paymentDate,
      customerId: payments.customerId,
      customerName: customers.companyName,
      amount: payments.amount,
      appliedAmount: payments.appliedAmount,
      unappliedAmount: payments.unappliedAmount,
      paymentMethod: payments.paymentMethod,
      status: payments.status,
    })
    .from(payments)
    .innerJoin(customers, eq(payments.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get next payment number
 */
export async function getNextPaymentNumber(
  db: NodePgDatabase<any>,
  tenantId: string,
  prefix = 'RCP'
): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const [lastPayment] = await db
    .select({ paymentNumber: payments.paymentNumber })
    .from(payments)
    .where(and(eq(payments.tenantId, tenantId), like(payments.paymentNumber, pattern)))
    .orderBy(desc(payments.paymentNumber))
    .limit(1);

  let nextNum = 1;
  if (lastPayment?.paymentNumber) {
    const match = lastPayment.paymentNumber.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${year}-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Create a payment and apply to invoices
 */
export async function createPayment(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: PaymentInput,
  userId: string,
  glOptions: {
    receivableAccountId: string;
    bankAccountId: string;
  }
): Promise<PaymentWithApplications> {
  // Verify customer
  const customer = await getCustomerById(db, tenantId, input.customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Generate payment number
  const paymentNumber = input.paymentNumber || await getNextPaymentNumber(db, tenantId);

  // Calculate applied and unapplied amounts
  const totalApplied = input.applications.reduce((sum, app) => sum + app.amount, 0);
  const unapplied = input.amount - totalApplied;

  // Create payment record
  const [payment] = await db
    .insert(payments)
    .values({
      tenantId,
      customerId: input.customerId,
      paymentNumber,
      referenceNumber: input.referenceNumber,
      paymentDate: input.paymentDate,
      amount: input.amount.toString(),
      appliedAmount: totalApplied.toString(),
      unappliedAmount: unapplied.toString(),
      paymentMethod: input.paymentMethod,
      status: 'completed',
      bankAccountId: input.bankAccountId || glOptions.bankAccountId,
      bankName: input.bankName,
      chequeNumber: input.chequeNumber,
      chequeDate: input.chequeDate,
      transactionId: input.transactionId,
      notes: input.notes,
      createdBy: userId,
    })
    .returning();

  // Apply to invoices
  const applications: any[] = [];
  for (const app of input.applications) {
    if (app.amount <= 0) continue;

    const [application] = await db
      .insert(paymentApplications)
      .values({
        paymentId: payment.id,
        invoiceId: app.invoiceId,
        amount: app.amount.toString(),
      })
      .returning();

    applications.push(application);

    // Update invoice amounts
    await db
      .update(invoices)
      .set({
        amountPaid: sql`${invoices.amountPaid}::numeric + ${app.amount}`,
        balance: sql`${invoices.balance}::numeric - ${app.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, app.invoiceId));

    // Update invoice status
    await updateInvoiceStatus(db, app.invoiceId);
  }

  // Create journal entry for payment
  // Get fiscal info
  const paymentDate = new Date(input.paymentDate);
  const fiscalYear = paymentDate.getMonth() >= 6 
    ? paymentDate.getFullYear() + 1 
    : paymentDate.getFullYear();
  const fiscalPeriod = ((paymentDate.getMonth() + 7) % 12) || 12;

  // Generate entry number
  const [lastEntry] = await db
    .select({ entryNumber: journalEntries.entryNumber })
    .from(journalEntries)
    .where(eq(journalEntries.tenantId, tenantId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(1);

  let entryNum = 1;
  if (lastEntry?.entryNumber) {
    const match = lastEntry.entryNumber.match(/(\d+)$/);
    if (match) entryNum = parseInt(match[1], 10) + 1;
  }
  const entryNumber = `GL-${fiscalYear}-${String(entryNum).padStart(5, '0')}`;

  // Create journal entry
  const [journalEntry] = await db
    .insert(journalEntries)
    .values({
      tenantId,
      entryNumber,
      date: input.paymentDate,
      memo: `Payment ${paymentNumber} from ${customer.companyName}`,
      reference: paymentNumber,
      status: 'posted',
      totalDebit: input.amount.toString(),
      totalCredit: input.amount.toString(),
      fiscalYear,
      fiscalPeriod,
      isAutoGenerated: true,
      sourceType: 'payment',
      sourceId: payment.id,
      createdBy: userId,
      postedBy: userId,
      postedAt: new Date(),
    })
    .returning();

  // Create transaction lines
  await db.insert(transactionLines).values([
    // Debit: Bank/Cash Account
    {
      journalEntryId: journalEntry.id,
      accountId: glOptions.bankAccountId,
      debit: input.amount.toString(),
      credit: '0',
      memo: `Payment ${paymentNumber}`,
      customerId: input.customerId,
      lineNumber: 1,
    },
    // Credit: Accounts Receivable
    {
      journalEntryId: journalEntry.id,
      accountId: glOptions.receivableAccountId,
      debit: '0',
      credit: input.amount.toString(),
      memo: `Payment ${paymentNumber}`,
      customerId: input.customerId,
      lineNumber: 2,
    },
  ]);

  // Update account balances
  await db
    .update(chartOfAccounts)
    .set({
      currentBalance: sql`${chartOfAccounts.currentBalance}::numeric + ${input.amount}`,
      updatedAt: new Date(),
    })
    .where(eq(chartOfAccounts.id, glOptions.bankAccountId));

  await db
    .update(chartOfAccounts)
    .set({
      currentBalance: sql`${chartOfAccounts.currentBalance}::numeric - ${input.amount}`,
      updatedAt: new Date(),
    })
    .where(eq(chartOfAccounts.id, glOptions.receivableAccountId));

  // Update payment with journal entry ID
  await db
    .update(payments)
    .set({ journalEntryId: journalEntry.id })
    .where(eq(payments.id, payment.id));

  // Update customer balance
  await updateCustomerBalance(db, tenantId, input.customerId);

  return {
    ...payment,
    applications,
  };
}

// ============================================================================
// AR Aging Queries
// ============================================================================

/**
 * Get AR Aging Report
 */
export async function getARAgingReport(
  db: NodePgDatabase<any>,
  tenantId: string,
  asOfDate?: string
): Promise<ARAgingReport> {
  const today = asOfDate || formatDateString(new Date());

  // Get all open invoices grouped by customer
  const openInvoices = await db
    .select({
      customerId: invoices.customerId,
      customerNumber: customers.customerNumber,
      companyName: customers.companyName,
      contactName: customers.contactName,
      phone: customers.phone,
      email: customers.email,
      invoiceId: invoices.id,
      dueDate: invoices.dueDate,
      balance: invoices.balance,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        ne(invoices.status, 'void'),
        ne(invoices.status, 'draft'),
        ne(invoices.status, 'paid'),
        sql`${invoices.balance}::numeric > 0`
      )
    )
    .orderBy(customers.companyName);

  // Group by customer and calculate aging buckets
  const customerMap = new Map<string, ARAgingRow>();

  for (const inv of openInvoices) {
    const daysOverdue = calculateDaysOverdue(inv.dueDate);
    const balance = parseFloat(inv.balance);

    if (!customerMap.has(inv.customerId)) {
      customerMap.set(inv.customerId, {
        customerId: inv.customerId,
        customerNumber: inv.customerNumber,
        companyName: inv.companyName,
        contactName: inv.contactName,
        phone: inv.phone,
        email: inv.email,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90Plus: 0,
        total: 0,
        invoiceCount: 0,
      });
    }

    const row = customerMap.get(inv.customerId)!;
    row.total += balance;
    row.invoiceCount += 1;

    if (daysOverdue <= 0) {
      row.current += balance;
    } else if (daysOverdue <= 30) {
      row.days1_30 += balance;
    } else if (daysOverdue <= 60) {
      row.days31_60 += balance;
    } else if (daysOverdue <= 90) {
      row.days61_90 += balance;
    } else {
      row.days90Plus += balance;
    }
  }

  const rows = Array.from(customerMap.values());

  // Calculate totals
  const totals = rows.reduce(
    (acc, row) => ({
      current: acc.current + row.current,
      days1_30: acc.days1_30 + row.days1_30,
      days31_60: acc.days31_60 + row.days31_60,
      days61_90: acc.days61_90 + row.days61_90,
      days90Plus: acc.days90Plus + row.days90Plus,
      total: acc.total + row.total,
    }),
    { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0, total: 0 }
  );

  return {
    asOfDate: today,
    rows,
    totals,
    summary: {
      totalCustomers: rows.length,
      customersWithBalance: rows.filter(r => r.total > 0).length,
      customersOverdue: rows.filter(r => 
        r.days1_30 > 0 || r.days31_60 > 0 || r.days61_90 > 0 || r.days90Plus > 0
      ).length,
    },
  };
}

// ============================================================================
// Dashboard Queries
// ============================================================================

/**
 * Get AR Dashboard Statistics
 */
export async function getARDashboardStats(
  db: NodePgDatabase<any>,
  tenantId: string
): Promise<ARDashboardStats> {
  const today = new Date();
  const todayStr = formatDateString(today);
  const firstOfMonth = formatDateString(new Date(today.getFullYear(), today.getMonth(), 1));

  // Total and active customers
  const [customerCounts] = await db
    .select({
      total: count(),
      active: sql<number>`COUNT(*) FILTER (WHERE ${customers.isActive} = true)`,
    })
    .from(customers)
    .where(eq(customers.tenantId, tenantId));

  // Outstanding and overdue amounts
  const [arTotals] = await db
    .select({
      outstanding: sql<string>`COALESCE(SUM(${invoices.balance}::numeric) FILTER (WHERE ${invoices.status} NOT IN ('void', 'draft', 'paid')), 0)`,
      overdue: sql<string>`COALESCE(SUM(${invoices.balance}::numeric) FILTER (WHERE ${invoices.status} = 'overdue' OR (${invoices.dueDate} < ${todayStr} AND ${invoices.status} NOT IN ('void', 'draft', 'paid'))), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId));

  // This month's sales
  const [monthSales] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        ne(invoices.status, 'void'),
        ne(invoices.status, 'draft'),
        gte(invoices.invoiceDate, firstOfMonth)
      )
    );

  // This month's collections
  const [monthCollections] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.tenantId, tenantId),
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, firstOfMonth)
      )
    );

  // Top customers by balance
  const topCustomersList = await db
    .select({
      id: customers.id,
      companyName: customers.companyName,
      currentBalance: customers.currentBalance,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        eq(customers.isActive, true),
        sql`${customers.currentBalance}::numeric > 0`
      )
    )
    .orderBy(desc(customers.currentBalance))
    .limit(5);

  return {
    totalCustomers: customerCounts?.total ?? 0,
    activeCustomers: customerCounts?.active ?? 0,
    totalOutstanding: parseFloat(arTotals?.outstanding ?? '0'),
    overdueAmount: parseFloat(arTotals?.overdue ?? '0'),
    currentMonthSales: parseFloat(monthSales?.total ?? '0'),
    currentMonthCollections: parseFloat(monthCollections?.total ?? '0'),
    averageDaysToCollect: 0, // TODO: Calculate from payment history
    topCustomers: topCustomersList.map(c => ({
      id: c.id,
      companyName: c.companyName,
      currentBalance: parseFloat(c.currentBalance),
      totalSales: 0, // TODO: Calculate
    })),
  };
}

/**
 * Get Recent AR Activity
 */
export async function getRecentARActivity(
  db: NodePgDatabase<any>,
  tenantId: string,
  limit = 10
): Promise<ARRecentActivity[]> {
  // Get recent invoices
  const recentInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerName: invoices.customerName,
      customerId: invoices.customerId,
      total: invoices.total,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);

  // Get recent payments
  const recentPayments = await db
    .select({
      id: payments.id,
      paymentNumber: payments.paymentNumber,
      customerId: payments.customerId,
      customerName: customers.companyName,
      amount: payments.amount,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(customers, eq(payments.customerId, customers.id))
    .where(eq(payments.tenantId, tenantId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);

  // Combine and sort
  const activities: ARRecentActivity[] = [
    ...recentInvoices.map(inv => ({
      id: inv.id,
      type: 'invoice_created' as const,
      title: `Invoice ${inv.invoiceNumber}`,
      description: `Created for ${inv.customerName}`,
      amount: parseFloat(inv.total),
      customerId: inv.customerId,
      customerName: inv.customerName,
      documentId: inv.id,
      documentNumber: inv.invoiceNumber,
      createdAt: inv.createdAt.toISOString(),
    })),
    ...recentPayments.map(pmt => ({
      id: pmt.id,
      type: 'payment_received' as const,
      title: `Payment ${pmt.paymentNumber}`,
      description: `Received from ${pmt.customerName}`,
      amount: parseFloat(pmt.amount),
      customerId: pmt.customerId,
      customerName: pmt.customerName,
      documentId: pmt.id,
      documentNumber: pmt.paymentNumber,
      createdAt: pmt.createdAt.toISOString(),
    })),
  ];

  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
