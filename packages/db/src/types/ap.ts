// Accounts Payable (AP) Types
import type { vendors, bills, billLineItems, vendorPayments } from '../schema/ap';

// Vendor Types
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export interface VendorListItem {
  id: string;
  vendorNumber: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  outstandingBalance: string;
}

export interface VendorInput {
  vendorNumber?: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  ntn?: string;
  strn?: string;
  paymentTerms?: number;
  defaultExpenseAccountId?: string;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    branchCode?: string;
  };
  notes?: string;
  website?: string;
  isActive?: boolean;
}

export interface VendorDetail extends Vendor {
  outstandingBalance: string;
  totalPurchases: string;
  lastPurchaseDate: string | null;
  bills: BillListItem[];
  payments: VendorPaymentListItem[];
}

// Bill Types
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;

export interface BillListItem {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string | null;
  vendorId: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  status: string;
  total: string;
  balance: string;
  isOverdue: boolean;
}

export interface BillLineItemInput {
  expenseAccountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface BillInput {
  vendorId: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate: string;
  lineItems: BillLineItemInput[];
  notes?: string;
  attachmentUrl?: string;
  apAccountId?: string;
}

export interface BillDetail extends Bill {
  vendor: {
    id: string;
    companyName: string;
    vendorNumber: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  lineItems: {
    id: string;
    expenseAccountId: string;
    expenseAccountName: string;
    expenseAccountNumber: string;
    description: string;
    quantity: string;
    unitPrice: string;
    taxRate: string;
    taxAmount: string;
    lineTotal: string;
  }[];
  payments: {
    id: string;
    paymentNumber: string;
    paymentDate: string;
    amount: string;
    paymentMethod: string;
  }[];
}

// Vendor Payment Types
export type VendorPayment = typeof vendorPayments.$inferSelect;
export type NewVendorPayment = typeof vendorPayments.$inferInsert;

export interface VendorPaymentListItem {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  paymentDate: string;
  amount: string;
  paymentMethod: string;
  status: string;
}

export interface PaymentAllocation {
  billId: string;
  amountApplied: number;
}

export interface VendorPaymentInput {
  vendorId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'cheque' | 'cash' | 'online' | 'credit_card';
  chequeNumber?: string;
  bankAccountId: string;
  reference?: string;
  notes?: string;
  allocations: PaymentAllocation[];
}

// AP Aging Report Types
export interface APAgingRow {
  vendorId: string;
  vendorNumber: string;
  vendorName: string;
  current: string;
  days1_30: string;
  days31_60: string;
  days61_90: string;
  over90: string;
  total: string;
}

export interface APAgingReport {
  asOfDate: string;
  rows: APAgingRow[];
  totals: {
    current: string;
    days1_30: string;
    days31_60: string;
    days61_90: string;
    over90: string;
    total: string;
  };
}

// Dashboard Stats
export interface APDashboardStats {
  totalVendors: number;
  activeVendors: number;
  outstandingAP: string;
  dueThisWeek: string;
  overdueAmount: string;
  thisMonthPurchases: string;
}

// Recent Activity
export interface APActivityItem {
  id: string;
  type: 'bill' | 'payment';
  description: string;
  amount: string;
  date: string;
  vendorName: string;
}

// Outstanding Bill for Payment
export interface OutstandingBill {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string | null;
  billDate: string;
  dueDate: string;
  total: string;
  balance: string;
  isOverdue: boolean;
  daysOverdue: number;
}
