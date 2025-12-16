// Dashboard Drizzle Queries for FinMatrix
// These queries fetch data for dashboard widgets from the tenant schema

import { sql, eq, and, gte, lte, desc, sum, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  CashBalanceMetric,
  AccountsReceivableMetric,
  AccountsPayableMetric,
  NetIncomeMetric,
  ARAgingData,
  APAgingData,
  AgingBucket,
  RevenueExpensesData,
  MonthlyFinancialData,
  ProfitMarginData,
  MarginData,
  CashFlowForecastData,
  CashFlowDataPoint,
  GSTSummaryData,
  TaxItem,
  TopCustomersData,
  TopCustomer,
  ActionItemsData,
  ActionItem,
} from '../types/dashboard';

// Helper to format PKR currency
function formatPKR(amount: number): string {
  if (amount >= 10000000) {
    return `PKR ${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `PKR ${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `PKR ${(amount / 1000).toFixed(0)}K`;
  }
  return `PKR ${amount.toLocaleString()}`;
}

// Helper to calculate percentage change
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Helper to get date ranges
function getDateRanges() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  return {
    now,
    startOfMonth,
    startOfPrevMonth,
    endOfPrevMonth,
    startOf12MonthsAgo,
  };
}

// Aging bucket definitions
const AGING_BUCKETS = [
  { name: 'Current', minDays: -Infinity, maxDays: 0, color: '#16a34a' },
  { name: '1-30 Days', minDays: 1, maxDays: 30, color: '#3b82f6' },
  { name: '31-60 Days', minDays: 31, maxDays: 60, color: '#f59e0b' },
  { name: '61-90 Days', minDays: 61, maxDays: 90, color: '#f97316' },
  { name: '90+ Days', minDays: 91, maxDays: Infinity, color: '#dc2626' },
];

/**
 * Get cash balance metric with trend data
 * In a real implementation, this would query the bank_accounts and journal_entries tables
 */
export async function getCashBalanceMetric(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<CashBalanceMetric> {
  // Sample implementation - replace with actual Drizzle queries
  // In production, query: SELECT SUM(balance) FROM {tenantSchema}.bank_accounts WHERE is_active = true
  
  const currentBalance = 2450000;
  const previousBalance = 2180000;
  const change = calculateChange(currentBalance, previousBalance);
  
  return {
    value: currentBalance,
    formattedValue: formatPKR(currentBalance),
    change: Number(change.toFixed(1)),
    changeLabel: 'vs last month',
    trend: change >= 0 ? 'up' : 'down',
    trendColor: change >= 0 ? 'green' : 'red',
    sparklineData: [2100000, 2200000, 2150000, 2300000, 2280000, 2450000],
    accountsBreakdown: [
      { accountId: '1', accountName: 'Operating Account', balance: 1850000 },
      { accountId: '2', accountName: 'Savings Account', balance: 450000 },
      { accountId: '3', accountName: 'Petty Cash', balance: 150000 },
    ],
  };
}

/**
 * Get accounts receivable metric with aging summary
 */
export async function getAccountsReceivableMetric(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<AccountsReceivableMetric> {
  // Sample implementation - replace with actual Drizzle queries
  // In production, query invoices table with status = 'unpaid' or 'partial'
  
  const totalReceivable = 980000;
  const previousReceivable = 1035000;
  const overdueAmount = 250000;
  const change = calculateChange(totalReceivable, previousReceivable);
  
  return {
    value: totalReceivable,
    formattedValue: formatPKR(totalReceivable),
    change: Number(change.toFixed(1)),
    changeLabel: 'vs last month',
    trend: change >= 0 ? 'up' : 'down',
    trendColor: change <= 0 ? 'green' : 'amber', // Lower AR can be good (collected)
    sparklineData: [1100000, 1050000, 1020000, 1000000, 990000, 980000],
    overdueAmount,
    overdueInvoiceCount: 8,
    agingBreakdown: AGING_BUCKETS.map((bucket, i) => ({
      name: bucket.name,
      value: [450000, 280000, 150000, 70000, 30000][i],
      color: bucket.color,
      count: [12, 8, 5, 3, 2][i],
      percentage: [46, 29, 15, 7, 3][i],
    })),
  };
}

/**
 * Get accounts payable metric with due soon warning
 */
export async function getAccountsPayableMetric(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<AccountsPayableMetric> {
  // Sample implementation
  const totalPayable = 650000;
  const previousPayable = 630000;
  const dueSoonAmount = 180000;
  const change = calculateChange(totalPayable, previousPayable);
  
  return {
    value: totalPayable,
    formattedValue: formatPKR(totalPayable),
    change: Number(change.toFixed(1)),
    changeLabel: 'vs last month',
    trend: change >= 0 ? 'up' : 'down',
    trendColor: change >= 0 ? 'amber' : 'green',
    sparklineData: [600000, 620000, 610000, 630000, 640000, 650000],
    dueSoonAmount,
    dueSoonBillCount: 5,
    agingBreakdown: AGING_BUCKETS.map((bucket, i) => ({
      name: bucket.name,
      value: [320000, 180000, 100000, 35000, 15000][i],
      color: bucket.color,
      count: [8, 6, 4, 2, 1][i],
      percentage: [49, 28, 15, 5, 3][i],
    })),
  };
}

/**
 * Get net income (P&L) metric for current month
 */
export async function getNetIncomeMetric(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<NetIncomeMetric> {
  // Sample implementation - query journal_entries and accounts tables
  const revenue = 1850000;
  const expenses = 1400000;
  const netIncome = revenue - expenses;
  const previousNetIncome = 380000;
  const change = calculateChange(netIncome, previousNetIncome);
  
  return {
    value: netIncome,
    formattedValue: formatPKR(netIncome),
    change: Number(change.toFixed(1)),
    changeLabel: 'vs last month',
    trend: change >= 0 ? 'up' : 'down',
    trendColor: change >= 0 ? 'green' : 'red',
    sparklineData: [320000, 350000, 380000, 400000, 420000, 450000],
    revenue,
    expenses,
    previousMonthIncome: previousNetIncome,
  };
}

/**
 * Get AR aging chart data with top overdue customers
 */
export async function getARAgingData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<ARAgingData> {
  const buckets: AgingBucket[] = [
    { name: 'Current', value: 450000, color: '#16a34a', count: 12, percentage: 46 },
    { name: '1-30 Days', value: 280000, color: '#3b82f6', count: 8, percentage: 29 },
    { name: '31-60 Days', value: 150000, color: '#f59e0b', count: 5, percentage: 15 },
    { name: '61-90 Days', value: 70000, color: '#f97316', count: 3, percentage: 7 },
    { name: '90+ Days', value: 30000, color: '#dc2626', count: 2, percentage: 3 },
  ];
  
  const total = buckets.reduce((sum, b) => sum + b.value, 0);
  
  return {
    type: 'receivable',
    buckets,
    total,
    formattedTotal: formatPKR(total),
    topItems: [
      { id: '1', name: 'ABC Trading Co.', amount: 85000, daysOverdue: 45 },
      { id: '2', name: 'XYZ Industries', amount: 65000, daysOverdue: 38 },
      { id: '3', name: 'Lahore Enterprises', amount: 45000, daysOverdue: 92 },
    ],
    topOverdueCustomers: [
      { id: '1', name: 'Lahore Enterprises', amount: 45000, daysOverdue: 92 },
      { id: '2', name: 'Karachi Solutions', amount: 30000, daysOverdue: 75 },
      { id: '3', name: 'Islamabad Tech', amount: 25000, daysOverdue: 62 },
      { id: '4', name: 'Peshawar Traders', amount: 20000, daysOverdue: 55 },
      { id: '5', name: 'Multan Industries', amount: 15000, daysOverdue: 48 },
    ],
  };
}

/**
 * Get AP aging chart data with top overdue vendors
 */
export async function getAPAgingData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<APAgingData> {
  const buckets: AgingBucket[] = [
    { name: 'Current', value: 320000, color: '#16a34a', count: 8, percentage: 49 },
    { name: '1-30 Days', value: 180000, color: '#3b82f6', count: 6, percentage: 28 },
    { name: '31-60 Days', value: 100000, color: '#f59e0b', count: 4, percentage: 15 },
    { name: '61-90 Days', value: 35000, color: '#f97316', count: 2, percentage: 5 },
    { name: '90+ Days', value: 15000, color: '#dc2626', count: 1, percentage: 3 },
  ];
  
  const total = buckets.reduce((sum, b) => sum + b.value, 0);
  
  return {
    type: 'payable',
    buckets,
    total,
    formattedTotal: formatPKR(total),
    topItems: [
      { id: '1', name: 'Supplier A', amount: 75000, daysOverdue: 35 },
      { id: '2', name: 'Vendor Solutions', amount: 55000, daysOverdue: 28 },
    ],
    topOverdueVendors: [
      { id: '1', name: 'Supplier A', amount: 35000, daysOverdue: 65 },
      { id: '2', name: 'Vendor Solutions', amount: 15000, daysOverdue: 95 },
    ],
  };
}

/**
 * Get revenue vs expenses data for last 12 months
 */
export async function getRevenueExpensesData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<RevenueExpensesData> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthly: MonthlyFinancialData[] = [
    { month: 'Jan', monthIndex: 0, year: 2024, revenue: 1200000, expenses: 950000, profit: 250000, profitMargin: 20.8, budget: 1100000 },
    { month: 'Feb', monthIndex: 1, year: 2024, revenue: 1350000, expenses: 1050000, profit: 300000, profitMargin: 22.2, budget: 1200000 },
    { month: 'Mar', monthIndex: 2, year: 2024, revenue: 1100000, expenses: 900000, profit: 200000, profitMargin: 18.2, budget: 1150000 },
    { month: 'Apr', monthIndex: 3, year: 2024, revenue: 1450000, expenses: 1100000, profit: 350000, profitMargin: 24.1, budget: 1300000 },
    { month: 'May', monthIndex: 4, year: 2024, revenue: 1600000, expenses: 1200000, profit: 400000, profitMargin: 25.0, budget: 1400000 },
    { month: 'Jun', monthIndex: 5, year: 2024, revenue: 1400000, expenses: 1050000, profit: 350000, profitMargin: 25.0, budget: 1350000 },
    { month: 'Jul', monthIndex: 6, year: 2024, revenue: 1550000, expenses: 1150000, profit: 400000, profitMargin: 25.8, budget: 1400000 },
    { month: 'Aug', monthIndex: 7, year: 2024, revenue: 1700000, expenses: 1250000, profit: 450000, profitMargin: 26.5, budget: 1500000 },
    { month: 'Sep', monthIndex: 8, year: 2024, revenue: 1650000, expenses: 1200000, profit: 450000, profitMargin: 27.3, budget: 1550000 },
    { month: 'Oct', monthIndex: 9, year: 2024, revenue: 1800000, expenses: 1350000, profit: 450000, profitMargin: 25.0, budget: 1600000 },
    { month: 'Nov', monthIndex: 10, year: 2024, revenue: 1750000, expenses: 1300000, profit: 450000, profitMargin: 25.7, budget: 1650000 },
    { month: 'Dec', monthIndex: 11, year: 2024, revenue: 1850000, expenses: 1400000, profit: 450000, profitMargin: 24.3, budget: 1700000 },
  ];
  
  const totalRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = monthly.reduce((sum, m) => sum + m.expenses, 0);
  
  return {
    monthly,
    quarterly: [
      { quarter: 'Q1', year: 2024, revenue: 3650000, expenses: 2900000, profit: 750000, profitMargin: 20.5 },
      { quarter: 'Q2', year: 2024, revenue: 4450000, expenses: 3350000, profit: 1100000, profitMargin: 24.7 },
      { quarter: 'Q3', year: 2024, revenue: 4900000, expenses: 3600000, profit: 1300000, profitMargin: 26.5 },
      { quarter: 'Q4', year: 2024, revenue: 5400000, expenses: 4050000, profit: 1350000, profitMargin: 25.0 },
    ],
    totalRevenue,
    totalExpenses,
    totalProfit: totalRevenue - totalExpenses,
    averageMargin: (totalRevenue - totalExpenses) / totalRevenue * 100,
  };
}

/**
 * Get profit margin trend data
 */
export async function getProfitMarginData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<ProfitMarginData> {
  const monthly: MarginData[] = [
    { month: 'Jan', monthIndex: 0, year: 2024, grossMargin: 35.2, netMargin: 20.8 },
    { month: 'Feb', monthIndex: 1, year: 2024, grossMargin: 36.5, netMargin: 22.2 },
    { month: 'Mar', monthIndex: 2, year: 2024, grossMargin: 34.8, netMargin: 18.2 },
    { month: 'Apr', monthIndex: 3, year: 2024, grossMargin: 38.2, netMargin: 24.1 },
    { month: 'May', monthIndex: 4, year: 2024, grossMargin: 37.5, netMargin: 25.0 },
    { month: 'Jun', monthIndex: 5, year: 2024, grossMargin: 36.8, netMargin: 25.0 },
    { month: 'Jul', monthIndex: 6, year: 2024, grossMargin: 38.5, netMargin: 25.8 },
    { month: 'Aug', monthIndex: 7, year: 2024, grossMargin: 39.2, netMargin: 26.5 },
    { month: 'Sep', monthIndex: 8, year: 2024, grossMargin: 38.8, netMargin: 27.3 },
    { month: 'Oct', monthIndex: 9, year: 2024, grossMargin: 40.0, netMargin: 25.0 },
    { month: 'Nov', monthIndex: 10, year: 2024, grossMargin: 39.5, netMargin: 25.7 },
    { month: 'Dec', monthIndex: 11, year: 2024, grossMargin: 40.5, netMargin: 24.3 },
  ];
  
  const avgGross = monthly.reduce((sum, m) => sum + m.grossMargin, 0) / monthly.length;
  const avgNet = monthly.reduce((sum, m) => sum + m.netMargin, 0) / monthly.length;
  
  // Determine trend based on last 3 months vs first 3 months
  const recentAvg = (monthly[9].netMargin + monthly[10].netMargin + monthly[11].netMargin) / 3;
  const earlyAvg = (monthly[0].netMargin + monthly[1].netMargin + monthly[2].netMargin) / 3;
  const trendDiff = recentAvg - earlyAvg;
  
  return {
    monthly,
    averageGrossMargin: Number(avgGross.toFixed(1)),
    averageNetMargin: Number(avgNet.toFixed(1)),
    trendDirection: trendDiff > 2 ? 'improving' : trendDiff < -2 ? 'declining' : 'stable',
  };
}

/**
 * Get cash flow forecast data for 30/60/90 days
 */
export async function getCashFlowForecastData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<CashFlowForecastData> {
  const currentBalance = 2450000;
  const minimumBalance = 500000;
  
  const data: CashFlowDataPoint[] = [
    { date: 'Week 1', dateValue: new Date(), actual: 2450000, projected: 2450000, inflows: 0, outflows: 0 },
    { date: 'Week 2', dateValue: new Date(), actual: 2380000, projected: 2380000, inflows: 180000, outflows: 250000 },
    { date: 'Week 3', dateValue: new Date(), projected: 2520000, optimistic: 2650000, pessimistic: 2400000, inflows: 320000, outflows: 180000 },
    { date: 'Week 4', dateValue: new Date(), projected: 2680000, optimistic: 2850000, pessimistic: 2500000, inflows: 280000, outflows: 120000 },
    { date: 'Week 5', dateValue: new Date(), projected: 2750000, optimistic: 2950000, pessimistic: 2550000, inflows: 220000, outflows: 150000 },
    { date: 'Week 6', dateValue: new Date(), projected: 2620000, optimistic: 2850000, pessimistic: 2400000, inflows: 150000, outflows: 280000 },
    { date: 'Week 7', dateValue: new Date(), projected: 2800000, optimistic: 3100000, pessimistic: 2500000, inflows: 350000, outflows: 170000 },
    { date: 'Week 8', dateValue: new Date(), projected: 2950000, optimistic: 3300000, pessimistic: 2600000, inflows: 280000, outflows: 130000 },
    { date: 'Week 9', dateValue: new Date(), projected: 2880000, optimistic: 3200000, pessimistic: 2550000, inflows: 180000, outflows: 250000 },
    { date: 'Week 10', dateValue: new Date(), projected: 3050000, optimistic: 3450000, pessimistic: 2650000, inflows: 320000, outflows: 150000 },
    { date: 'Week 11', dateValue: new Date(), projected: 3150000, optimistic: 3600000, pessimistic: 2700000, inflows: 250000, outflows: 150000 },
    { date: 'Week 12', dateValue: new Date(), projected: 3200000, optimistic: 3700000, pessimistic: 2750000, inflows: 200000, outflows: 150000 },
  ];
  
  const hasWarning = data.some(d => (d.pessimistic || d.projected) < minimumBalance);
  
  return {
    data,
    currentBalance,
    projectedBalance30Day: data[4].projected,
    projectedBalance60Day: data[8].projected,
    projectedBalance90Day: data[11].projected,
    projectedChange: ((data[11].projected - currentBalance) / currentBalance) * 100,
    minimumBalance,
    hasLowBalanceWarning: hasWarning,
    warningDate: hasWarning ? 'Week 6' : undefined,
    pendingReceivables: 980000,
    pendingPayables: 650000,
    recurringInflows: 150000,
    recurringOutflows: 120000,
  };
}

/**
 * Get GST/Tax liability summary
 */
export async function getGSTSummaryData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<GSTSummaryData> {
  const outputTax = 314500;
  const inputTax = 157000;
  const netPayable = outputTax - inputTax;
  
  const taxItems: TaxItem[] = [
    {
      id: '1',
      type: 'GST Return',
      period: 'Dec 2024',
      periodStart: new Date('2024-12-01'),
      periodEnd: new Date('2024-12-31'),
      dueDate: 'Jan 15, 2025',
      dueDateValue: new Date('2025-01-15'),
      amount: 157500,
      status: 'pending',
    },
    {
      id: '2',
      type: 'Withholding Tax',
      period: 'Dec 2024',
      periodStart: new Date('2024-12-01'),
      periodEnd: new Date('2024-12-31'),
      dueDate: 'Jan 7, 2025',
      dueDateValue: new Date('2025-01-07'),
      amount: 45000,
      status: 'upcoming',
    },
    {
      id: '3',
      type: 'GST Return',
      period: 'Nov 2024',
      periodStart: new Date('2024-11-01'),
      periodEnd: new Date('2024-11-30'),
      dueDate: 'Dec 15, 2024',
      dueDateValue: new Date('2024-12-15'),
      amount: 142000,
      status: 'filed',
      filedAt: new Date('2024-12-14'),
    },
  ];
  
  const nextDeadline = taxItems
    .filter(t => t.status === 'pending' || t.status === 'upcoming')
    .sort((a, b) => a.dueDateValue.getTime() - b.dueDateValue.getTime())[0];
  
  const daysRemaining = nextDeadline 
    ? Math.ceil((nextDeadline.dueDateValue.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return {
    outputTax,
    inputTax,
    netPayable,
    isRefund: netPayable < 0,
    currentPeriod: 'Dec 2024',
    taxItems,
    hasOverdue: taxItems.some(t => t.status === 'overdue'),
    nextDeadline: nextDeadline ? {
      type: nextDeadline.type,
      dueDate: nextDeadline.dueDate,
      daysRemaining,
    } : undefined,
  };
}

/**
 * Get top customers by revenue
 */
export async function getTopCustomersData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<TopCustomersData> {
  const customers: TopCustomer[] = [
    { id: '1', name: 'ABC Trading Co.', revenue: 450000, change: 15.2, changeLabel: '+15.2%', invoiceCount: 12 },
    { id: '2', name: 'XYZ Industries', revenue: 380000, change: 8.5, changeLabel: '+8.5%', invoiceCount: 8 },
    { id: '3', name: 'Karachi Enterprises', revenue: 320000, change: -3.2, changeLabel: '-3.2%', invoiceCount: 15 },
    { id: '4', name: 'Lahore Solutions', revenue: 280000, change: 22.1, changeLabel: '+22.1%', invoiceCount: 6 },
    { id: '5', name: 'Islamabad Tech', revenue: 245000, change: 5.8, changeLabel: '+5.8%', invoiceCount: 9 },
  ];
  
  const totalRevenue = customers.reduce((sum, c) => sum + c.revenue, 0);
  
  return {
    customers,
    period: 'Last 12 Months',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
    periodEnd: new Date(),
    totalCustomerRevenue: totalRevenue,
    topCustomerPercentage: (customers[0].revenue / totalRevenue) * 100,
  };
}

/**
 * Get action items and alerts
 */
export async function getActionItemsData(
  _db: NodePgDatabase<any>,
  _tenantSchema: string
): Promise<ActionItemsData> {
  const items: ActionItem[] = [
    {
      id: '1',
      title: '3 Invoices Overdue',
      description: 'Total amount: PKR 125,000',
      priority: 'high',
      type: 'overdue',
      actionUrl: '/dashboard/invoices?filter=overdue',
      actionLabel: 'Send Reminders',
      dueDate: 'Past Due',
      createdAt: new Date(),
      relatedEntityType: 'invoice',
    },
    {
      id: '2',
      title: 'Purchase Order Approval',
      description: 'PO-2024-089 from Vendor Solutions Ltd',
      priority: 'medium',
      type: 'approval',
      actionUrl: '/dashboard/purchase-orders/89',
      actionLabel: 'Review',
      createdAt: new Date(),
    },
    {
      id: '3',
      title: 'GST Return Filing',
      description: 'December 2024 GST return due soon',
      priority: 'high',
      type: 'compliance',
      actionUrl: '/dashboard/fbr/gst-return',
      actionLabel: 'Prepare Return',
      dueDate: 'Jan 15, 2025',
      createdAt: new Date(),
      relatedEntityType: 'tax',
    },
    {
      id: '4',
      title: 'Bank Reconciliation Pending',
      description: '15 transactions need matching',
      priority: 'medium',
      type: 'reconciliation',
      actionUrl: '/dashboard/banking/reconciliation',
      actionLabel: 'Reconcile',
      createdAt: new Date(),
      relatedEntityType: 'transaction',
    },
    {
      id: '5',
      title: 'Low Stock Alert',
      description: '5 products below reorder level',
      priority: 'low',
      type: 'warning',
      actionUrl: '/dashboard/inventory?filter=low-stock',
      actionLabel: 'View Items',
      createdAt: new Date(),
    },
  ];
  
  return {
    items,
    totalCount: items.length,
    highPriorityCount: items.filter(i => i.priority === 'high').length,
    overdueCount: items.filter(i => i.type === 'overdue').length,
    pendingApprovals: items.filter(i => i.type === 'approval').length,
  };
}

/**
 * Get all dashboard data in a single query (for initial load)
 */
export async function getDashboardData(
  db: NodePgDatabase<any>,
  tenantSchema: string
) {
  const [
    cashBalance,
    accountsReceivable,
    accountsPayable,
    netIncome,
    arAging,
    apAging,
    revenueExpenses,
    profitMargin,
    cashFlow,
    gstSummary,
    topCustomers,
    actionItems,
  ] = await Promise.all([
    getCashBalanceMetric(db, tenantSchema),
    getAccountsReceivableMetric(db, tenantSchema),
    getAccountsPayableMetric(db, tenantSchema),
    getNetIncomeMetric(db, tenantSchema),
    getARAgingData(db, tenantSchema),
    getAPAgingData(db, tenantSchema),
    getRevenueExpensesData(db, tenantSchema),
    getProfitMarginData(db, tenantSchema),
    getCashFlowForecastData(db, tenantSchema),
    getGSTSummaryData(db, tenantSchema),
    getTopCustomersData(db, tenantSchema),
    getActionItemsData(db, tenantSchema),
  ]);
  
  return {
    organizationId: tenantSchema,
    lastUpdated: new Date(),
    metrics: {
      cashBalance,
      accountsReceivable,
      accountsPayable,
      netIncome,
    },
    arAging,
    apAging,
    revenueExpenses,
    profitMargin,
    cashFlow,
    gstSummary,
    topCustomers,
    actionItems,
  };
}
