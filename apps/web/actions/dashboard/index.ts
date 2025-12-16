'use server';

import { getSession } from '@finmatrix/auth';
import { 
  getDashboardData,
  getCashBalanceMetric,
  getAccountsReceivableMetric,
  getAccountsPayableMetric,
  getNetIncomeMetric,
  getARAgingData,
  getAPAgingData,
  getRevenueExpensesData,
  getProfitMarginData,
  getCashFlowForecastData,
  getGSTSummaryData,
  getTopCustomersData,
  getActionItemsData,
  db,
} from '@finmatrix/db';

// Helper to get the current organization schema
async function getTenantSchema(userId: string): Promise<string | null> {
  // In a real implementation, this would fetch the user's current organization
  // and return the tenant schema name
  return 'tenant_default';
}

// Helper to check RBAC permissions
async function checkPermission(userId: string, permission: string): Promise<boolean> {
  // In a real implementation, check user roles and permissions
  return true;
}

/**
 * Fetch all dashboard data at once
 */
export async function fetchDashboardData() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    const data = await getDashboardData(db, tenantSchema);
    
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}

/**
 * Fetch cash balance metric
 */
export async function fetchCashBalance() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:cash-balance')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getCashBalanceMetric(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching cash balance:', error);
    return { success: false, error: 'Failed to fetch cash balance' };
  }
}

/**
 * Fetch accounts receivable metric
 */
export async function fetchAccountsReceivable() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:accounts-receivable')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getAccountsReceivableMetric(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching accounts receivable:', error);
    return { success: false, error: 'Failed to fetch accounts receivable' };
  }
}

/**
 * Fetch accounts payable metric
 */
export async function fetchAccountsPayable() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:accounts-payable')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getAccountsPayableMetric(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching accounts payable:', error);
    return { success: false, error: 'Failed to fetch accounts payable' };
  }
}

/**
 * Fetch net income metric
 */
export async function fetchNetIncome() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:profit-loss')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getNetIncomeMetric(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching net income:', error);
    return { success: false, error: 'Failed to fetch net income' };
  }
}

/**
 * Fetch AR aging data
 */
export async function fetchARAgingData() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:accounts-receivable')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getARAgingData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching AR aging:', error);
    return { success: false, error: 'Failed to fetch AR aging data' };
  }
}

/**
 * Fetch AP aging data
 */
export async function fetchAPAgingData() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:accounts-payable')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getAPAgingData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching AP aging:', error);
    return { success: false, error: 'Failed to fetch AP aging data' };
  }
}

/**
 * Fetch revenue vs expenses data
 */
export async function fetchRevenueExpenses() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:profit-loss')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getRevenueExpensesData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching revenue/expenses:', error);
    return { success: false, error: 'Failed to fetch revenue/expenses data' };
  }
}

/**
 * Fetch profit margin data
 */
export async function fetchProfitMargin() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:profit-loss')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getProfitMarginData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching profit margin:', error);
    return { success: false, error: 'Failed to fetch profit margin data' };
  }
}

/**
 * Fetch cash flow forecast data
 */
export async function fetchCashFlowForecast() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:cash-flow')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getCashFlowForecastData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching cash flow forecast:', error);
    return { success: false, error: 'Failed to fetch cash flow forecast' };
  }
}

/**
 * Fetch GST/Tax summary data
 */
export async function fetchGSTSummary() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:tax')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getGSTSummaryData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching GST summary:', error);
    return { success: false, error: 'Failed to fetch GST summary' };
  }
}

/**
 * Fetch top customers data
 */
export async function fetchTopCustomers() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    if (!await checkPermission(session.user.id, 'view:customers')) {
      return { success: false, error: 'Permission denied' };
    }

    const data = await getTopCustomersData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching top customers:', error);
    return { success: false, error: 'Failed to fetch top customers' };
  }
}

/**
 * Fetch action items data
 */
export async function fetchActionItems() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantSchema = await getTenantSchema(session.user.id);
    if (!tenantSchema) {
      return { success: false, error: 'No organization selected' };
    }

    const data = await getActionItemsData(db, tenantSchema);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching action items:', error);
    return { success: false, error: 'Failed to fetch action items' };
  }
}
