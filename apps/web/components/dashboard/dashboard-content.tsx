'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { 
  MetricCard, 
  AgingChart, 
  RevenueExpensesChart, 
  ProfitMarginChart, 
  CashFlowForecast, 
  GstSummary, 
  TopCustomers, 
  ActionItems,
  QuickActions,
  DashboardSkeleton,
  MetricCardSkeleton,
  AgingChartSkeleton,
  ChartSkeleton,
  ProfitMarginChartSkeleton,
  CashFlowSkeleton,
  GSTSummarySkeleton,
  TopCustomersSkeleton,
  ActionItemsSkeleton,
  WidgetGrid,
  SortableWidgetWrapper,
} from '@/components/dashboard/widgets';
import { useDashboardData, useWidgetConfig } from '@/lib/hooks/use-dashboard-data';
import { 
  Wallet, 
  TrendingUp, 
  FileText, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Loader2,
  Settings,
  RefreshCw,
} from 'lucide-react';
import type { WidgetConfig, ActionItem as ActionItemType } from '@finmatrix/db/types';

interface Organization {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

// Color scheme constants
const COLORS = {
  primary: '#1a365d',
  secondary: '#0d9488',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
};

// Sample data for demonstration (will be replaced by live data)
const metricCards = [
  {
    id: 'cash-balance',
    title: 'Cash Balance',
    value: 'PKR 2,450,000',
    change: 12.5,
    changeLabel: 'vs last month',
    trend: 'up' as const,
    trendColor: 'green' as const,
    icon: <Wallet className="h-5 w-5 text-teal-600" />,
    sparklineData: [2100000, 2200000, 2150000, 2300000, 2280000, 2450000],
    permission: 'view:cash-balance',
  },
  {
    id: 'revenue-mtd',
    title: 'Revenue (MTD)',
    value: 'PKR 1,850,000',
    change: 8.2,
    changeLabel: 'vs last month',
    trend: 'up' as const,
    trendColor: 'green' as const,
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    sparklineData: [1500000, 1600000, 1550000, 1700000, 1800000, 1850000],
    permission: 'view:revenue',
  },
  {
    id: 'accounts-receivable',
    title: 'Accounts Receivable',
    value: 'PKR 980,000',
    change: -5.3,
    changeLabel: 'vs last month',
    trend: 'down' as const,
    trendColor: 'green' as const,
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    sparklineData: [1100000, 1050000, 1020000, 1000000, 990000, 980000],
    permission: 'view:accounts-receivable',
  },
  {
    id: 'accounts-payable',
    title: 'Accounts Payable',
    value: 'PKR 650,000',
    change: 3.1,
    changeLabel: 'vs last month',
    trend: 'up' as const,
    trendColor: 'amber' as const,
    icon: <CreditCard className="h-5 w-5 text-amber-600" />,
    sparklineData: [600000, 620000, 610000, 630000, 640000, 650000],
    permission: 'view:accounts-payable',
  },
  {
    id: 'active-customers',
    title: 'Active Customers',
    value: '156',
    change: 8.3,
    changeLabel: '+12 new',
    trend: 'up' as const,
    trendColor: 'green' as const,
    icon: <Users className="h-5 w-5 text-purple-600" />,
    sparklineData: [140, 145, 148, 150, 153, 156],
    permission: 'view:customers',
  },
  {
    id: 'open-invoices',
    title: 'Open Invoices',
    value: '28',
    change: -12.5,
    changeLabel: '-4 closed',
    trend: 'down' as const,
    trendColor: 'green' as const,
    icon: <ShoppingCart className="h-5 w-5 text-pink-600" />,
    sparklineData: [35, 33, 32, 30, 29, 28],
    permission: 'view:invoices',
  },
];

const arAgingData = [
  { name: 'Current', value: 450000, color: COLORS.success },
  { name: '1-30 Days', value: 280000, color: '#3b82f6' },
  { name: '31-60 Days', value: 150000, color: COLORS.warning },
  { name: '61-90 Days', value: 70000, color: '#f97316' },
  { name: '90+ Days', value: 30000, color: COLORS.danger },
];

const apAgingData = [
  { name: 'Current', value: 320000, color: COLORS.success },
  { name: '1-30 Days', value: 180000, color: COLORS.secondary },
  { name: '31-60 Days', value: 100000, color: COLORS.warning },
  { name: '61-90 Days', value: 35000, color: '#f97316' },
  { name: '90+ Days', value: 15000, color: COLORS.danger },
];

const revenueExpensesData = [
  { month: 'Jan', revenue: 1200000, expenses: 950000 },
  { month: 'Feb', revenue: 1350000, expenses: 1050000 },
  { month: 'Mar', revenue: 1100000, expenses: 900000 },
  { month: 'Apr', revenue: 1450000, expenses: 1100000 },
  { month: 'May', revenue: 1600000, expenses: 1200000 },
  { month: 'Jun', revenue: 1400000, expenses: 1050000 },
  { month: 'Jul', revenue: 1550000, expenses: 1150000 },
  { month: 'Aug', revenue: 1700000, expenses: 1250000 },
  { month: 'Sep', revenue: 1650000, expenses: 1200000 },
  { month: 'Oct', revenue: 1800000, expenses: 1350000 },
  { month: 'Nov', revenue: 1750000, expenses: 1300000 },
  { month: 'Dec', revenue: 1850000, expenses: 1400000 },
];

const profitMarginData = [
  { month: 'Jan', grossMargin: 35.2, netMargin: 20.8 },
  { month: 'Feb', grossMargin: 36.5, netMargin: 22.2 },
  { month: 'Mar', grossMargin: 34.8, netMargin: 18.2 },
  { month: 'Apr', grossMargin: 38.2, netMargin: 24.1 },
  { month: 'May', grossMargin: 37.5, netMargin: 25.0 },
  { month: 'Jun', grossMargin: 36.8, netMargin: 25.0 },
  { month: 'Jul', grossMargin: 38.5, netMargin: 25.8 },
  { month: 'Aug', grossMargin: 39.2, netMargin: 26.5 },
  { month: 'Sep', grossMargin: 38.8, netMargin: 27.3 },
  { month: 'Oct', grossMargin: 40.0, netMargin: 25.0 },
  { month: 'Nov', grossMargin: 39.5, netMargin: 25.7 },
  { month: 'Dec', grossMargin: 40.5, netMargin: 24.3 },
];

const cashFlowData = [
  { date: 'Week 1', actual: 2450000, projected: 2450000, optimistic: 2450000, pessimistic: 2450000 },
  { date: 'Week 2', actual: 2380000, projected: 2380000, optimistic: 2380000, pessimistic: 2380000 },
  { date: 'Week 3', projected: 2520000, optimistic: 2650000, pessimistic: 2400000 },
  { date: 'Week 4', projected: 2680000, optimistic: 2850000, pessimistic: 2500000 },
  { date: 'Week 5', projected: 2750000, optimistic: 2950000, pessimistic: 2550000 },
  { date: 'Week 6', projected: 2620000, optimistic: 2850000, pessimistic: 2400000 },
  { date: 'Week 7', projected: 2800000, optimistic: 3100000, pessimistic: 2500000 },
  { date: 'Week 8', projected: 2950000, optimistic: 3300000, pessimistic: 2600000 },
  { date: 'Week 9', projected: 2880000, optimistic: 3200000, pessimistic: 2550000 },
  { date: 'Week 10', projected: 3050000, optimistic: 3450000, pessimistic: 2650000 },
  { date: 'Week 11', projected: 3150000, optimistic: 3600000, pessimistic: 2700000 },
  { date: 'Week 12', projected: 3200000, optimistic: 3700000, pessimistic: 2750000 },
];

const gstTaxItems = [
  { type: 'GST Return', period: 'Dec 2024', dueDate: 'Jan 15, 2025', amount: 157500, status: 'pending' as const },
  { type: 'Withholding Tax', period: 'Dec 2024', dueDate: 'Jan 7, 2025', amount: 45000, status: 'upcoming' as const },
  { type: 'GST Return', period: 'Nov 2024', dueDate: 'Dec 15, 2024', amount: 142000, status: 'filed' as const },
];

const topCustomers = [
  { name: 'ABC Trading Co.', revenue: 450000, change: 15.2, invoiceCount: 12 },
  { name: 'XYZ Industries', revenue: 380000, change: 8.5, invoiceCount: 8 },
  { name: 'Karachi Enterprises', revenue: 320000, change: -3.2, invoiceCount: 15 },
  { name: 'Lahore Solutions', revenue: 280000, change: 22.1, invoiceCount: 6 },
  { name: 'Islamabad Tech', revenue: 245000, change: 5.8, invoiceCount: 9 },
];

const actionItems: ActionItemType[] = [
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
    type: 'reminder',
    actionUrl: '/dashboard/fbr/gst-return',
    actionLabel: 'Prepare Return',
    dueDate: 'Jan 15, 2025',
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Low Stock Alert',
    description: '5 products below reorder level',
    priority: 'low',
    type: 'warning',
    actionUrl: '/dashboard/inventory?filter=low-stock',
    actionLabel: 'View Items',
    createdAt: new Date(),
  },
];

// Default widget configuration
const defaultWidgetConfigs: WidgetConfig[] = [
  { id: 'cash-balance', visible: true, order: 0, row: 1 },
  { id: 'accounts-receivable', visible: true, order: 1, row: 1 },
  { id: 'accounts-payable', visible: true, order: 2, row: 1 },
  { id: 'net-income', visible: true, order: 3, row: 1 },
  { id: 'active-customers', visible: true, order: 4, row: 1 },
  { id: 'open-invoices', visible: true, order: 5, row: 1 },
  { id: 'ar-aging', visible: true, order: 0, row: 2 },
  { id: 'ap-aging', visible: true, order: 1, row: 2 },
  { id: 'revenue-expenses', visible: true, order: 0, row: 3 },
  { id: 'profit-margin', visible: true, order: 1, row: 3 },
  { id: 'cash-flow', visible: true, order: 0, row: 4 },
  { id: 'gst-summary', visible: true, order: 1, row: 4 },
  { id: 'top-customers', visible: true, order: 0, row: 5 },
  { id: 'action-items', visible: true, order: 1, row: 5 },
];

const STORAGE_KEY = 'finmatrix-dashboard-config';

export default function DashboardContent() {
  const { data: session, status } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(defaultWidgetConfigs);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side hydration - ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setIsMounted(true);
    setLastUpdated(new Date());
  }, []);

  // Load widget configuration from localStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.widgets) {
            setWidgetConfigs(parsed.widgets);
          }
        }
      } catch (e) {
        console.error('Failed to load dashboard config:', e);
      }
    }
  }, [isMounted]);

  // Save widget configuration to localStorage
  const saveWidgetConfigs = useCallback((configs: WidgetConfig[]) => {
    setWidgetConfigs(configs);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          widgets: configs,
          lastUpdated: new Date().toISOString(),
        }));
      } catch (e) {
        console.error('Failed to save dashboard config:', e);
      }
    }
  }, []);

  // Check if a widget is visible
  const isWidgetVisible = useCallback((widgetId: string) => {
    const config = widgetConfigs.find(w => w.id === widgetId);
    return config ? config.visible : true;
  }, [widgetConfigs]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
          if (data.organizations && data.organizations.length > 0) {
            setCurrentOrg(data.organizations[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    if (isMounted && session?.user) {
      fetchOrganizations();
    } else if (isMounted && status !== 'loading') {
      // If mounted and session status is resolved (not loading), stop org loading state
      setIsLoadingOrgs(false);
    }
  }, [session, isMounted, status]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In a real implementation, this would trigger SWR revalidation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, []);

  // Get user data from session
  const user = {
    firstName: session?.user?.firstName || 'User',
    lastName: session?.user?.lastName || '',
    email: session?.user?.email || '',
    currentOrganizationId: session?.user?.currentOrganizationId || null,
    role: session?.user?.role || 'member',
  };

  // RBAC check helper (simplified - in production use proper RBAC)
  const hasPermission = useCallback((permission: string): boolean => {
    // Admin and owner have all permissions
    if (user.role === 'admin' || user.role === 'owner') return true;
    
    // Define basic role permissions
    const rolePermissions: Record<string, string[]> = {
      accountant: ['view:cash-balance', 'view:revenue', 'view:accounts-receivable', 'view:accounts-payable', 'view:invoices', 'view:tax'],
      manager: ['view:cash-balance', 'view:revenue', 'view:accounts-receivable', 'view:accounts-payable', 'view:customers', 'view:invoices'],
      member: ['view:invoices', 'view:customers'],
    };

    return rolePermissions[user.role]?.includes(permission) ?? false;
  }, [user.role]);

  // Loading state - show while session is loading, not mounted, or orgs are loading
  if (!isMounted || status === 'loading' || (status === 'authenticated' && isLoadingOrgs)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          user={user} 
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Page Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Welcome back, <span className="font-medium text-slate-700 dark:text-slate-300">{user.firstName}</span>! Here's your business overview.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isCustomizing
                      ? 'text-blue-700 bg-blue-100 border border-blue-200'
                      : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  <span>Last updated:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lastUpdated?.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                  </span>
                </div>
              </div>
            </div>

            <WidgetGrid
              widgetConfigs={widgetConfigs}
              onConfigChange={saveWidgetConfigs}
              isCustomizing={isCustomizing}
              onCustomizingChange={setIsCustomizing}
            >
              {/* Row 1: Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                {metricCards.map((metric) => (
                  (!isCustomizing && !isWidgetVisible(metric.id)) ? null : (
                    <SortableWidgetWrapper
                      key={metric.id}
                      id={metric.id}
                      isCustomizing={isCustomizing}
                      isVisible={isWidgetVisible(metric.id)}
                      onToggleVisibility={() => {
                        const newConfigs = widgetConfigs.map(w =>
                          w.id === metric.id ? { ...w, visible: !w.visible } : w
                        );
                        saveWidgetConfigs(newConfigs);
                      }}
                    >
                      <MetricCard
                        title={metric.title}
                        value={metric.value}
                        change={metric.change}
                        changeLabel={metric.changeLabel}
                        trend={metric.trend}
                        trendColor={metric.trendColor}
                        icon={metric.icon}
                        sparklineData={metric.sparklineData}
                      />
                    </SortableWidgetWrapper>
                  )
                ))}
              </div>

              {/* Row 2: AR/AP Aging Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {(!isCustomizing && !isWidgetVisible('ar-aging')) ? null : (
                  <SortableWidgetWrapper
                    id="ar-aging"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('ar-aging')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'ar-aging' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <AgingChart
                      title="Accounts Receivable Aging"
                      data={arAgingData}
                      total="PKR 980K"
                      subtitle="Outstanding customer invoices"
                    />
                  </SortableWidgetWrapper>
                )}
                {(!isCustomizing && !isWidgetVisible('ap-aging')) ? null : (
                  <SortableWidgetWrapper
                    id="ap-aging"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('ap-aging')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'ap-aging' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <AgingChart
                      title="Accounts Payable Aging"
                      data={apAgingData}
                      total="PKR 650K"
                      subtitle="Outstanding vendor bills"
                      colorScheme="amber"
                    />
                  </SortableWidgetWrapper>
                )}
              </div>

              {/* Row 3: Revenue & Profit Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {(!isCustomizing && !isWidgetVisible('revenue-expenses')) ? null : (
                  <SortableWidgetWrapper
                    id="revenue-expenses"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('revenue-expenses')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'revenue-expenses' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <RevenueExpensesChart data={revenueExpensesData} />
                  </SortableWidgetWrapper>
                )}
                {(!isCustomizing && !isWidgetVisible('profit-margin')) ? null : (
                  <SortableWidgetWrapper
                    id="profit-margin"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('profit-margin')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'profit-margin' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <ProfitMarginChart data={profitMarginData} />
                  </SortableWidgetWrapper>
                )}
              </div>

              {/* Row 4: Cash Flow & GST Summary */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {(!isCustomizing && !isWidgetVisible('cash-flow')) ? null : (
                  <SortableWidgetWrapper
                    id="cash-flow"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('cash-flow')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'cash-flow' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <CashFlowForecast
                      data={cashFlowData}
                      currentBalance={2450000}
                      projectedChange={30.6}
                      minimumBalance={500000}
                    />
                  </SortableWidgetWrapper>
                )}
                {(!isCustomizing && !isWidgetVisible('gst-summary')) ? null : (
                  <SortableWidgetWrapper
                    id="gst-summary"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('gst-summary')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'gst-summary' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <GstSummary
                      outputTax={314500}
                      inputTax={157000}
                      netPayable={157500}
                      taxItems={gstTaxItems}
                    />
                  </SortableWidgetWrapper>
                )}
              </div>

              {/* Row 5: Top Customers & Action Items */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {(!isCustomizing && !isWidgetVisible('top-customers')) ? null : (
                  <SortableWidgetWrapper
                    id="top-customers"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('top-customers')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'top-customers' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <TopCustomers customers={topCustomers} />
                  </SortableWidgetWrapper>
                )}
                {(!isCustomizing && !isWidgetVisible('action-items')) ? null : (
                  <SortableWidgetWrapper
                    id="action-items"
                    isCustomizing={isCustomizing}
                    isVisible={isWidgetVisible('action-items')}
                    onToggleVisibility={() => {
                      const newConfigs = widgetConfigs.map(w =>
                        w.id === 'action-items' ? { ...w, visible: !w.visible } : w
                      );
                      saveWidgetConfigs(newConfigs);
                    }}
                  >
                    <ActionItems items={actionItems} />
                  </SortableWidgetWrapper>
                )}
              </div>
            </WidgetGrid>
          </div>
        </main>
      </div>

      {/* Quick Actions FAB */}
      <QuickActions />
    </div>
  );
}
