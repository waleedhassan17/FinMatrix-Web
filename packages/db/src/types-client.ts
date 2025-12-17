// Client-safe exports - no database client included
// Use this for client components that need types/constants but not db access

// GL (General Ledger) types - safe for client
export {
  // Schema types (re-exported from types/gl.ts)
  type ChartOfAccount,
  type JournalEntry,
  type TransactionLine,
  type AccountType,
  type AccountSubType,
  type NormalBalance,
  type JournalEntryStatus,
  // Tree and option types
  type AccountTreeNode,
  type AccountOption,
  type AccountTypeConfig,
  type AccountInput,
  type AccountImportRow,
  // Journal entry types
  type JournalEntryLineInput,
  type JournalEntryInput,
  type JournalEntryWithLines,
  type JournalEntryStatusConfig,
  // Report types
  type TrialBalanceRow,
  type GLAccountDetail,
  // Settings types
  type FiscalPeriod,
  type Department,
  // Config constants
  ACCOUNT_TYPE_CONFIGS,
  ACCOUNT_SUB_TYPE_LABELS,
  JOURNAL_ENTRY_STATUS_CONFIGS,
} from './types/gl';

// Dashboard types - safe for client
export type {
  WidgetId,
  WidgetConfig,
  DashboardConfig,
  AccountBalance,
  Transaction,
  FinancialMetric,
  CashFlowItem,
  CashFlowData,
  ChartDataPoint,
  WidgetData,
  ActionItem,
  ActionItemsData,
} from './types/dashboard';
