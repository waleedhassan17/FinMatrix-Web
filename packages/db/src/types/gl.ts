// General Ledger Types for FinMatrix
// Types for Chart of Accounts, Journal Entries, and GL Reports

import type {
  ChartOfAccount,
  JournalEntry,
  TransactionLine,
  FiscalPeriod,
  Department,
  AccountType,
  AccountSubType,
  NormalBalance,
  JournalEntryStatus,
} from '../schema/gl';

// Re-export schema types
export type {
  ChartOfAccount,
  JournalEntry,
  TransactionLine,
  FiscalPeriod,
  Department,
  AccountType,
  AccountSubType,
  NormalBalance,
  JournalEntryStatus,
};

// ============================================================================
// Chart of Accounts Types
// ============================================================================

/**
 * Account with hierarchy information for tree display
 */
export interface AccountTreeNode extends ChartOfAccount {
  children: AccountTreeNode[];
  depth: number;
  isExpanded?: boolean;
  hasChildren: boolean;
}

/**
 * Flattened account for dropdown/select
 */
export interface AccountOption {
  id: string;
  accountNumber: string;
  name: string;
  fullName: string; // "1000 - Cash on Hand"
  type: AccountType;
  normalBalance: NormalBalance;
  isActive: boolean;
  level: number;
  currentBalance: number;
}

/**
 * Account type configuration for UI
 */
export interface AccountTypeConfig {
  type: AccountType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  normalBalance: NormalBalance;
  accountNumberRange: { start: number; end: number };
}

export const ACCOUNT_TYPE_CONFIGS: Record<AccountType, AccountTypeConfig> = {
  asset: {
    type: 'asset',
    label: 'Asset',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    normalBalance: 'debit',
    accountNumberRange: { start: 1000, end: 1999 },
  },
  liability: {
    type: 'liability',
    label: 'Liability',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    normalBalance: 'credit',
    accountNumberRange: { start: 2000, end: 2999 },
  },
  equity: {
    type: 'equity',
    label: 'Equity',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    normalBalance: 'credit',
    accountNumberRange: { start: 3000, end: 3999 },
  },
  revenue: {
    type: 'revenue',
    label: 'Revenue',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    normalBalance: 'credit',
    accountNumberRange: { start: 4000, end: 4999 },
  },
  expense: {
    type: 'expense',
    label: 'Expense',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    normalBalance: 'debit',
    accountNumberRange: { start: 5000, end: 9999 },
  },
};

/**
 * Account sub-type labels
 */
export const ACCOUNT_SUB_TYPE_LABELS: Record<AccountSubType, string> = {
  // Assets
  cash: 'Cash',
  bank: 'Bank',
  accounts_receivable: 'Accounts Receivable',
  inventory: 'Inventory',
  prepaid_expense: 'Prepaid Expense',
  fixed_asset: 'Fixed Asset',
  accumulated_depreciation: 'Accumulated Depreciation',
  other_current_asset: 'Other Current Asset',
  other_non_current_asset: 'Other Non-Current Asset',
  // Liabilities
  accounts_payable: 'Accounts Payable',
  credit_card: 'Credit Card',
  accrued_liability: 'Accrued Liability',
  short_term_loan: 'Short-Term Loan',
  long_term_loan: 'Long-Term Loan',
  deferred_revenue: 'Deferred Revenue',
  other_current_liability: 'Other Current Liability',
  other_non_current_liability: 'Other Non-Current Liability',
  // Equity
  owners_equity: "Owner's Equity",
  retained_earnings: 'Retained Earnings',
  common_stock: 'Common Stock',
  additional_paid_in_capital: 'Additional Paid-in Capital',
  treasury_stock: 'Treasury Stock',
  opening_balance_equity: 'Opening Balance Equity',
  // Revenue
  sales_revenue: 'Sales Revenue',
  service_revenue: 'Service Revenue',
  other_income: 'Other Income',
  interest_income: 'Interest Income',
  discount_received: 'Discount Received',
  // Expenses
  cost_of_goods_sold: 'Cost of Goods Sold',
  operating_expense: 'Operating Expense',
  payroll_expense: 'Payroll Expense',
  rent_expense: 'Rent Expense',
  utilities_expense: 'Utilities Expense',
  depreciation_expense: 'Depreciation Expense',
  interest_expense: 'Interest Expense',
  tax_expense: 'Tax Expense',
  other_expense: 'Other Expense',
};

/**
 * Input for creating/updating an account
 */
export interface AccountInput {
  accountNumber: string;
  name: string;
  description?: string;
  type: AccountType;
  subType?: AccountSubType;
  normalBalance: NormalBalance;
  parentId?: string | null;
  departmentIds?: string[];
  isActive?: boolean;
  isBankAccount?: boolean;
  bankAccountNumber?: string;
}

/**
 * CSV import row for Chart of Accounts
 */
export interface AccountImportRow {
  accountNumber: string;
  name: string;
  type: string;
  subType?: string;
  parentAccountNumber?: string;
  description?: string;
  openingBalance?: number;
}

// ============================================================================
// Journal Entry Types
// ============================================================================

/**
 * Journal entry line input (for form)
 */
export interface JournalEntryLineInput {
  id?: string; // For editing existing lines
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
  departmentId?: string;
  projectId?: string;
  reference?: string;
}

/**
 * Journal entry input (for form)
 */
export interface JournalEntryInput {
  date: string; // ISO date string
  memo?: string;
  reference?: string;
  lines: JournalEntryLineInput[];
  attachments?: { name: string; url: string; type: string }[];
}

/**
 * Journal entry with lines for display
 */
export interface JournalEntryWithLines extends JournalEntry {
  lines: (TransactionLine & {
    account: {
      id: string;
      accountNumber: string;
      name: string;
      type: AccountType;
    };
  })[];
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  postedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Journal entry status configuration
 */
export interface JournalEntryStatusConfig {
  status: JournalEntryStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const JOURNAL_ENTRY_STATUS_CONFIGS: Record<JournalEntryStatus, JournalEntryStatusConfig> = {
  draft: {
    status: 'draft',
    label: 'Draft',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
  },
  posted: {
    status: 'posted',
    label: 'Posted',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  voided: {
    status: 'voided',
    label: 'Voided',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
};

// ============================================================================
// Report Types
// ============================================================================

/**
 * Trial Balance row
 */
export interface TrialBalanceRow {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  balance: number;
}

/**
 * Trial Balance report
 */
export interface TrialBalanceReport {
  asOfDate: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

/**
 * General Ledger detail row (transaction)
 */
export interface GLDetailRow {
  date: string;
  entryNumber: string;
  journalEntryId: string;
  memo: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  status: JournalEntryStatus;
}

/**
 * General Ledger report for one account
 */
export interface GLAccountDetail {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingBalance: number;
  transactions: GLDetailRow[];
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

/**
 * Account Activity Summary row
 */
export interface AccountActivityRow {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  debitMovement: number;
  creditMovement: number;
  closingBalance: number;
  transactionCount: number;
}

/**
 * Department P&L row
 */
export interface DepartmentPLRow {
  departmentId: string;
  departmentName: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  margin: number;
}

/**
 * Department P&L report
 */
export interface DepartmentPLReport {
  startDate: string;
  endDate: string;
  rows: DepartmentPLRow[];
  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GLApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AccountBalanceUpdate {
  accountId: string;
  previousBalance: number;
  newBalance: number;
  change: number;
}

export interface JournalEntryPostResult {
  journalEntry: JournalEntry;
  balanceUpdates: AccountBalanceUpdate[];
}
