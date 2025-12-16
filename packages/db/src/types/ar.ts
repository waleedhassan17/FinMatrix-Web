// Accounts Receivable Types
// Extended types for Customers, Invoices, Payments, and AR Reports

import type {
  Customer,
  Invoice,
  InvoiceLineItem,
  Payment,
  PaymentApplication,
  InvoiceStatus,
  PaymentMethod,
} from '../schema/ar';

// ============================================================================
// Customer Types
// ============================================================================

export interface CustomerWithBalance extends Customer {
  invoiceCount?: number;
  totalSales?: number;
  lastInvoiceDate?: string;
  lastPaymentDate?: string;
}

export interface CustomerListItem {
  id: string;
  customerNumber: string;
  companyName: string;
  displayName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  currentBalance: string;
  overdueBalance: string;
  isActive: boolean;
  creditLimit: string;
  paymentTerms: number | null;
}

export interface CustomerSearchResult {
  id: string;
  customerNumber: string;
  companyName: string;
  displayName: string | null;
  email: string | null;
  currentBalance: string;
}

export interface CustomerInput {
  customerNumber?: string;
  companyName: string;
  displayName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  ntn?: string;
  strn?: string;
  cnic?: string;
  creditLimit?: number;
  paymentTerms?: number;
  priceLevel?: string;
  discountPercent?: number;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface CustomerStatement {
  customer: CustomerListItem;
  openingBalance: number;
  transactions: CustomerTransaction[];
  closingBalance: number;
  periodStart: string;
  periodEnd: string;
  aging: ARAgingBucket;
}

export interface CustomerTransaction {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit_memo';
  number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface InvoiceWithLines extends Invoice {
  lineItems: InvoiceLineItem[];
  customer?: CustomerListItem;
  paymentHistory?: PaymentApplicationDetail[];
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  customerName: string;
  customerId: string;
  total: string;
  balance: string;
  amountPaid: string;
  daysOverdue: number;
}

export interface InvoiceLineItemInput {
  itemId?: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  discountPercent?: number;
  discountAmount?: number;
  taxable?: boolean;
  taxRate?: number;
  revenueAccountId?: string;
}

export interface InvoiceInput {
  customerId: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  invoiceDate: string;
  dueDate: string;
  terms?: string;
  notes?: string;
  internalNotes?: string;
  discountPercent?: number;
  shippingAmount?: number;
  currency?: string;
  lineItems: InvoiceLineItemInput[];
  revenueAccountId?: string;
  receivableAccountId?: string;
}

export interface InvoiceSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  taxBreakdown: {
    taxCode: string;
    taxName: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }[];
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentWithApplications extends Payment {
  applications: PaymentApplicationDetail[];
  customer?: CustomerListItem;
}

export interface PaymentApplicationDetail {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTotal: string;
  amount: string;
}

export interface PaymentListItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  customerName: string;
  customerId: string;
  amount: string;
  appliedAmount: string;
  unappliedAmount: string;
  paymentMethod: PaymentMethod;
  status: string;
}

export interface PaymentInput {
  customerId: string;
  paymentNumber?: string;
  referenceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  transactionId?: string;
  notes?: string;
  applications: {
    invoiceId: string;
    amount: number;
  }[];
}

export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  balance: number;
  daysOverdue: number;
  isOverdue: boolean;
}

// ============================================================================
// AR Aging Types
// ============================================================================

export interface ARAgingBucket {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  total: number;
}

export interface ARAgingRow {
  customerId: string;
  customerNumber: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  total: number;
  invoiceCount: number;
}

export interface ARAgingReport {
  asOfDate: string;
  rows: ARAgingRow[];
  totals: ARAgingBucket;
  summary: {
    totalCustomers: number;
    customersWithBalance: number;
    customersOverdue: number;
  };
}

export interface ARAgingDetail {
  customerId: string;
  customerName: string;
  invoices: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    total: number;
    balance: number;
    daysOverdue: number;
    bucket: 'current' | 'days1_30' | 'days31_60' | 'days61_90' | 'days90Plus';
  }[];
  totals: ARAgingBucket;
}

// ============================================================================
// Dashboard & Statistics Types
// ============================================================================

export interface ARDashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalOutstanding: number;
  overdueAmount: number;
  currentMonthSales: number;
  currentMonthCollections: number;
  averageDaysToCollect: number;
  topCustomers: {
    id: string;
    companyName: string;
    currentBalance: number;
    totalSales: number;
  }[];
}

export interface ARRecentActivity {
  id: string;
  type: 'invoice_created' | 'invoice_sent' | 'payment_received' | 'invoice_overdue';
  title: string;
  description: string;
  amount?: number;
  customerId: string;
  customerName: string;
  documentId: string;
  documentNumber: string;
  createdAt: string;
}

// ============================================================================
// Filter & Pagination Types
// ============================================================================

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
  hasBalance?: boolean;
  isOverdue?: boolean;
  tags?: string[];
  sortBy?: 'companyName' | 'customerNumber' | 'currentBalance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceFilters {
  customerId?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'invoiceNumber' | 'invoiceDate' | 'dueDate' | 'total' | 'balance';
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentFilters {
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'paymentNumber' | 'paymentDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
