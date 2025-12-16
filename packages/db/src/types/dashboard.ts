// Dashboard Widget Types for FinMatrix
// These types are used across the dashboard for metrics, charts, and widgets

// ============================================================================
// Key Metrics Types
// ============================================================================

export interface MetricData {
  value: number;
  formattedValue: string;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  trendColor: 'green' | 'red' | 'amber';
  sparklineData: number[];
}

export interface CashBalanceMetric extends MetricData {
  accountsBreakdown: {
    accountId: string;
    accountName: string;
    balance: number;
  }[];
}

export interface AccountsReceivableMetric extends MetricData {
  overdueAmount: number;
  overdueInvoiceCount: number;
  agingBreakdown: AgingBucket[];
}

export interface AccountsPayableMetric extends MetricData {
  dueSoonAmount: number;
  dueSoonBillCount: number;
  agingBreakdown: AgingBucket[];
}

export interface NetIncomeMetric extends MetricData {
  revenue: number;
  expenses: number;
  previousMonthIncome: number;
}

// ============================================================================
// Aging Chart Types
// ============================================================================

export interface AgingBucket {
  name: string;
  value: number;
  color: string;
  count: number;
  percentage: number;
}

export interface AgingChartData {
  buckets: AgingBucket[];
  total: number;
  formattedTotal: string;
  topItems: AgingTopItem[];
}

export interface AgingTopItem {
  id: string;
  name: string;
  amount: number;
  daysOverdue: number;
}

export interface ARAgingData extends AgingChartData {
  type: 'receivable';
  topOverdueCustomers: AgingTopItem[];
}

export interface APAgingData extends AgingChartData {
  type: 'payable';
  topOverdueVendors: AgingTopItem[];
}

// ============================================================================
// Revenue & Expenses Types
// ============================================================================

export interface MonthlyFinancialData {
  month: string;
  monthIndex: number;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  budget?: number;
}

export interface QuarterlyFinancialData {
  quarter: string;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  budget?: number;
}

export interface RevenueExpensesData {
  monthly: MonthlyFinancialData[];
  quarterly: QuarterlyFinancialData[];
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  averageMargin: number;
}

// ============================================================================
// Profit Margin Types
// ============================================================================

export interface MarginData {
  month: string;
  monthIndex: number;
  year: number;
  grossMargin: number;
  netMargin: number;
  operatingMargin?: number;
}

export interface ProfitMarginData {
  monthly: MarginData[];
  averageGrossMargin: number;
  averageNetMargin: number;
  trendDirection: 'improving' | 'declining' | 'stable';
}

// ============================================================================
// Cash Flow Forecast Types
// ============================================================================

export interface CashFlowDataPoint {
  date: string;
  dateValue: Date;
  actual?: number;
  projected: number;
  optimistic?: number;
  pessimistic?: number;
  inflows: number;
  outflows: number;
}

export interface CashFlowForecastData {
  data: CashFlowDataPoint[];
  currentBalance: number;
  projectedBalance30Day: number;
  projectedBalance60Day: number;
  projectedBalance90Day: number;
  projectedChange: number;
  minimumBalance: number;
  hasLowBalanceWarning: boolean;
  warningDate?: string;
  pendingReceivables: number;
  pendingPayables: number;
  recurringInflows: number;
  recurringOutflows: number;
}

// ============================================================================
// GST/Tax Liability Types
// ============================================================================

export type TaxItemStatus = 'pending' | 'filed' | 'overdue' | 'upcoming' | 'paid';

export interface TaxItem {
  id: string;
  type: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: string;
  dueDateValue: Date;
  amount: number;
  status: TaxItemStatus;
  filedAt?: Date;
  paidAt?: Date;
}

export interface GSTSummaryData {
  outputTax: number;
  inputTax: number;
  netPayable: number;
  isRefund: boolean;
  currentPeriod: string;
  taxItems: TaxItem[];
  hasOverdue: boolean;
  nextDeadline?: {
    type: string;
    dueDate: string;
    daysRemaining: number;
  };
}

// ============================================================================
// Top Customers Types
// ============================================================================

export interface TopCustomer {
  id: string;
  name: string;
  revenue: number;
  change: number;
  changeLabel: string;
  invoiceCount: number;
  lastInvoiceDate?: Date;
  outstandingAmount?: number;
}

export interface TopCustomersData {
  customers: TopCustomer[];
  period: string;
  periodStart: Date;
  periodEnd: Date;
  totalCustomerRevenue: number;
  topCustomerPercentage: number;
}

// ============================================================================
// Action Items / Alerts Types
// ============================================================================

export type ActionPriority = 'high' | 'medium' | 'low';
export type ActionType = 'overdue' | 'approval' | 'warning' | 'reminder' | 'reconciliation' | 'compliance';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  type: ActionType;
  actionUrl: string;
  actionLabel: string;
  dueDate?: string;
  createdAt: Date;
  relatedEntityId?: string;
  relatedEntityType?: 'invoice' | 'bill' | 'transaction' | 'customer' | 'vendor' | 'tax';
  metadata?: Record<string, unknown>;
}

export interface ActionItemsData {
  items: ActionItem[];
  totalCount: number;
  highPriorityCount: number;
  overdueCount: number;
  pendingApprovals: number;
}

// ============================================================================
// Widget Configuration Types
// ============================================================================

export type WidgetId = 
  | 'cash-balance'
  | 'accounts-receivable'
  | 'accounts-payable'
  | 'net-income'
  | 'active-customers'
  | 'open-invoices'
  | 'ar-aging'
  | 'ap-aging'
  | 'revenue-expenses'
  | 'profit-margin'
  | 'cash-flow'
  | 'gst-summary'
  | 'top-customers'
  | 'action-items';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
  row: number;
  column?: number;
  span?: number;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  refreshInterval: number;
  theme: 'light' | 'dark' | 'system';
  lastUpdated: Date;
}

// ============================================================================
// Dashboard Summary Types
// ============================================================================

export interface DashboardSummary {
  organizationId: string;
  organizationName: string;
  lastUpdated: Date;
  metrics: {
    cashBalance: CashBalanceMetric;
    accountsReceivable: AccountsReceivableMetric;
    accountsPayable: AccountsPayableMetric;
    netIncome: NetIncomeMetric;
  };
  arAging: ARAgingData;
  apAging: APAgingData;
  revenueExpenses: RevenueExpensesData;
  profitMargin: ProfitMarginData;
  cashFlow: CashFlowForecastData;
  gstSummary: GSTSummaryData;
  topCustomers: TopCustomersData;
  actionItems: ActionItemsData;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface DashboardApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface DashboardWidgetResponse<T> extends DashboardApiResponse<T> {
  widgetId: WidgetId;
  cacheKey?: string;
  ttl?: number;
}
