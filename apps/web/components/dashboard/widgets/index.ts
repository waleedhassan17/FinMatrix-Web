// Dashboard Widgets Barrel Export
// Re-export all widget components for easy importing

export { MetricCard } from './metric-card';
export { AgingChart } from './aging-chart';
export { RevenueExpensesChart } from './revenue-expenses-chart';
export { ProfitMarginChart } from './profit-margin-chart';
export { CashFlowForecast } from './cash-flow-forecast';
export { GstSummary } from './gst-summary';
export { TopCustomers } from './top-customers';
export { ActionItems, type ActionItem } from './action-items';
export { QuickActions } from './quick-actions';

// Skeleton Loaders
export {
  MetricCardSkeleton,
  AgingChartSkeleton,
  ChartSkeleton,
  ProfitMarginChartSkeleton,
  CashFlowSkeleton,
  GSTSummarySkeleton,
  TopCustomersSkeleton,
  ActionItemsSkeleton,
  DashboardSkeleton,
} from './skeletons';

// Widget Grid & Customization
export { WidgetGrid, SortableWidgetWrapper, WIDGET_LABELS } from './widget-grid';
