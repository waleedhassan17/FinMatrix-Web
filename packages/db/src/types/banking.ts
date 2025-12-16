import type {
  BankAccount,
  BankTransaction,
  ImportedStatement,
  ImportedTransaction,
  BankReconciliation,
  ReconciliationItem,
  MatchingRule,
} from '../schema/banking';

// ============================================================================
// Bank Account Types
// ============================================================================

export type BankAccountType = 
  | 'checking' 
  | 'savings' 
  | 'money_market' 
  | 'credit_card' 
  | 'line_of_credit' 
  | 'petty_cash' 
  | 'other';

export type BankAccountStatus = 'active' | 'inactive' | 'closed';

export interface BankAccountWithDetails extends BankAccount {
  transactionCount?: number;
  unreconciledCount?: number;
  pendingDeposits?: string;
  pendingWithdrawals?: string;
  glAccountName?: string;
  glAccountNumber?: string;
}

export interface BankAccountSummary {
  id: string;
  accountName: string;
  accountType: BankAccountType;
  bankName: string | null;
  currentBalance: string;
  lastReconciledBalance: string | null;
  lastReconciledDate: string | null;
  unreconciledCount: number;
  status: BankAccountStatus;
}

export interface CreateBankAccountInput {
  accountName: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  bankBranch?: string;
  accountType: BankAccountType;
  openingBalance: number;
  openingBalanceDate?: string;
  glAccountId?: string;
  defaultDescription?: string;
  isDefault?: boolean;
  notes?: string;
}

export interface UpdateBankAccountInput {
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  bankBranch?: string;
  accountType?: BankAccountType;
  status?: BankAccountStatus;
  glAccountId?: string;
  defaultDescription?: string;
  isDefault?: boolean;
  notes?: string;
}

// ============================================================================
// Bank Transaction Types
// ============================================================================

export type BankTransactionType = 
  | 'deposit'
  | 'withdrawal'
  | 'transfer_in'
  | 'transfer_out'
  | 'check'
  | 'fee'
  | 'interest'
  | 'adjustment'
  | 'payment'
  | 'receipt';

export type TransactionSource = 
  | 'manual'
  | 'import'
  | 'system'
  | 'journal_entry'
  | 'invoice_payment'
  | 'bill_payment';

export interface BankTransactionWithDetails extends BankTransaction {
  bankAccountName?: string;
  reconciledStatus?: string;
}

export interface CreateBankTransactionInput {
  bankAccountId: string;
  transactionDate: string;
  transactionType: BankTransactionType;
  amount: number;
  referenceNumber?: string;
  checkNumber?: string;
  description?: string;
  memo?: string;
  payeeName?: string;
  payeeId?: string;
  payeeType?: 'customer' | 'vendor' | 'employee';
}

export interface AccountRegisterEntry {
  id: string;
  transactionDate: string;
  transactionType: BankTransactionType;
  referenceNumber: string | null;
  checkNumber: string | null;
  description: string | null;
  payeeName: string | null;
  amount: string;
  runningBalance: string | null;
  isReconciled: boolean | null;
  source: TransactionSource;
}

// ============================================================================
// Statement Import Types
// ============================================================================

export type ImportStatus = 'pending' | 'matched' | 'created' | 'ignored' | 'error';
export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';

export interface ColumnMapping {
  date: string;
  amount: string;
  description?: string;
  reference?: string;
  checkNumber?: string;
  debit?: string;
  credit?: string;
  balance?: string;
  type?: string;
}

export interface ImportPreviewData {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export interface ImportBatchSummary {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  importFileName: string;
  importedAt: string;
  totalTransactions: number;
  matchedTransactions: number;
  pendingTransactions: number;
  createdTransactions: number;
  ignoredTransactions: number;
  statementStartDate: string | null;
  statementEndDate: string | null;
}

export interface ImportedTransactionWithMatch extends ImportedTransaction {
  matchedTransactionDetails?: BankTransaction;
  suggestedMatches?: SuggestedMatch[];
}

export interface SuggestedMatch {
  transactionId: string;
  confidence: MatchConfidence;
  score: number;
  matchReasons: string[];
  transaction: {
    transactionDate: string;
    amount: string;
    description: string | null;
    referenceNumber: string | null;
  };
}

// ============================================================================
// Auto-Matching Types
// ============================================================================

export interface MatchResult {
  importedTransactionId: string;
  matchedTransactionId: string | null;
  confidence: MatchConfidence;
  score: number;
  matchReasons: string[];
}

export interface MatchingCriteria {
  exactAmountDateMatch: boolean;
  amountMatchWithinDays: number;
  referenceNumberMatch: boolean;
  checkNumberMatch: boolean;
}

export interface AutoMatchSummary {
  totalImported: number;
  highConfidenceMatches: number;
  mediumConfidenceMatches: number;
  lowConfidenceMatches: number;
  noMatches: number;
}

// ============================================================================
// Reconciliation Types
// ============================================================================

export type ReconciliationStatus = 'in_progress' | 'completed' | 'cancelled';

export interface ReconciliationWithDetails extends BankReconciliation {
  bankAccountName: string;
  itemCount: number;
  clearedItemCount: number;
}

export interface BankReconciliationSummary {
  beginningBalance: number;
  clearedDeposits: number;
  clearedWithdrawals: number;
  clearedBalance: number;
  statementEndingBalance: number;
  difference: number;
  outstandingDeposits: number;
  outstandingWithdrawals: number;
}

export interface ReconciliationItemWithTransaction extends ReconciliationItem {
  transaction: BankTransaction;
}

export interface StartReconciliationInput {
  bankAccountId: string;
  statementDate: string;
  statementEndingBalance: number;
}

export interface OutstandingItem {
  id: string;
  transactionDate: string;
  transactionType: BankTransactionType;
  referenceNumber: string | null;
  checkNumber: string | null;
  description: string | null;
  payeeName: string | null;
  amount: string;
  daysOutstanding: number;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReconciliationReport {
  bankAccount: BankAccountSummary;
  reconciliation: BankReconciliation;
  
  // Statement info
  statementDate: string;
  statementEndingBalance: number;
  
  // Book balance
  bookBalance: number;
  
  // Outstanding items
  outstandingChecks: OutstandingItem[];
  depositsInTransit: OutstandingItem[];
  
  // Totals
  totalOutstandingChecks: number;
  totalDepositsInTransit: number;
  
  // Adjusted balances
  adjustedBankBalance: number;
  adjustedBookBalance: number;
  
  // Difference (should be 0)
  difference: number;
}

export interface BankingDashboardSummary {
  totalCashBalance: number;
  reconciledBalance: number;
  unreconciledItems: number;
  pendingImports: number;
  
  accountSummaries: BankAccountSummary[];
  
  recentTransactions: BankTransactionWithDetails[];
  
  alerts: BankingAlert[];
}

export interface BankingAlert {
  type: 'unreconciled' | 'pending_import' | 'low_balance' | 'overdue_reconciliation';
  severity: 'info' | 'warning' | 'error';
  message: string;
  accountId?: string;
  accountName?: string;
  count?: number;
}

// ============================================================================
// Matching Rule Types
// ============================================================================

export interface CreateMatchingRuleInput {
  ruleName?: string;
  ruleType: 'payee' | 'description' | 'amount' | 'category';
  matchPattern: string;
  matchField: 'description' | 'payee' | 'amount';
  assignPayeeId?: string;
  assignPayeeName?: string;
  assignPayeeType?: 'customer' | 'vendor' | 'employee';
  assignTransactionType?: BankTransactionType;
  assignGlAccountId?: string;
  assignDescription?: string;
}

// ============================================================================
// Quick Action Types
// ============================================================================

export interface RecordDepositInput {
  bankAccountId: string;
  transactionDate: string;
  amount: number;
  description?: string;
  referenceNumber?: string;
  payerName?: string;
  payerId?: string;
  payerType?: 'customer' | 'vendor' | 'employee';
}

export interface WriteCheckInput {
  bankAccountId: string;
  transactionDate: string;
  amount: number;
  checkNumber: string;
  payeeName: string;
  payeeId?: string;
  payeeType?: 'customer' | 'vendor' | 'employee';
  memo?: string;
}

export interface TransferFundsInput {
  fromAccountId: string;
  toAccountId: string;
  transactionDate: string;
  amount: number;
  description?: string;
  referenceNumber?: string;
}
