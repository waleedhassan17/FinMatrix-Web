'use client';

import useSWR from 'swr';
import {
  fetchDashboardData,
  fetchCashBalance,
  fetchAccountsReceivable,
  fetchAccountsPayable,
  fetchNetIncome,
  fetchARAgingData,
  fetchAPAgingData,
  fetchRevenueExpenses,
  fetchProfitMargin,
  fetchCashFlowForecast,
  fetchGSTSummary,
  fetchTopCustomers,
  fetchActionItems,
} from '@/actions/dashboard';

// Default refresh interval: 30 seconds
const DEFAULT_REFRESH_INTERVAL = 30000;

// SWR configuration
const swrConfig = {
  refreshInterval: DEFAULT_REFRESH_INTERVAL,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

/**
 * Hook to fetch all dashboard data
 */
export function useDashboardData(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-all',
    async () => {
      const result = await fetchDashboardData();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch cash balance metric
 */
export function useCashBalance(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-cash-balance',
    async () => {
      const result = await fetchCashBalance();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch accounts receivable metric
 */
export function useAccountsReceivable(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-accounts-receivable',
    async () => {
      const result = await fetchAccountsReceivable();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch accounts payable metric
 */
export function useAccountsPayable(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-accounts-payable',
    async () => {
      const result = await fetchAccountsPayable();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch net income metric
 */
export function useNetIncome(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-net-income',
    async () => {
      const result = await fetchNetIncome();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch AR aging data
 */
export function useARAgingData(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-ar-aging',
    async () => {
      const result = await fetchARAgingData();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch AP aging data
 */
export function useAPAgingData(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-ap-aging',
    async () => {
      const result = await fetchAPAgingData();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch revenue vs expenses data
 */
export function useRevenueExpenses(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-revenue-expenses',
    async () => {
      const result = await fetchRevenueExpenses();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch profit margin data
 */
export function useProfitMargin(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-profit-margin',
    async () => {
      const result = await fetchProfitMargin();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch cash flow forecast data
 */
export function useCashFlowForecast(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-cash-flow',
    async () => {
      const result = await fetchCashFlowForecast();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch GST summary data
 */
export function useGSTSummary(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-gst-summary',
    async () => {
      const result = await fetchGSTSummary();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch top customers data
 */
export function useTopCustomers(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-top-customers',
    async () => {
      const result = await fetchTopCustomers();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to fetch action items data
 */
export function useActionItems(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  return useSWR(
    'dashboard-action-items',
    async () => {
      const result = await fetchActionItems();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    { ...swrConfig, refreshInterval }
  );
}

/**
 * Hook to manage widget configuration stored in localStorage
 */
export function useWidgetConfig() {
  const STORAGE_KEY = 'finmatrix-dashboard-config';
  
  const defaultConfig = {
    widgets: [
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
    ],
    refreshInterval: DEFAULT_REFRESH_INTERVAL,
    theme: 'system' as const,
    lastUpdated: new Date(),
  };

  const getConfig = () => {
    if (typeof window === 'undefined') return defaultConfig;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultConfig;
      return { ...defaultConfig, ...JSON.parse(stored) };
    } catch {
      return defaultConfig;
    }
  };

  const saveConfig = (config: typeof defaultConfig) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...config,
        lastUpdated: new Date(),
      }));
    } catch (e) {
      console.error('Failed to save dashboard config:', e);
    }
  };

  return { getConfig, saveConfig, defaultConfig };
}
