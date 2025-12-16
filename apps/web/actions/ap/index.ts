'use server';

import { getSession } from '@finmatrix/auth';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  getBills,
  getBillById,
  createBill,
  finalizeBill,
  getNextBillNumberForDisplay,
  getVendorPayments,
  getOutstandingBills,
  createVendorPayment,
  getNextVendorPaymentNumberForDisplay,
  getAPAgingReport,
  getAPDashboardStats,
  getRecentAPActivity,
  getVendorsToPay,
} from '@finmatrix/db';
import type {
  VendorInput,
  VendorListItem,
  VendorDetail,
  BillInput,
  BillListItem,
  BillDetail,
  VendorPaymentInput,
  VendorPaymentListItem,
  APAgingReport,
  APDashboardStats,
  APActivityItem,
  OutstandingBill,
} from '@finmatrix/db';

// Helper to get tenant ID from session
async function getTenantId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.currentOrganizationId || null;
}

// ==================== VENDOR ACTIONS ====================

export async function fetchVendors(options?: {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<VendorListItem[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found in session');
      return [];
    }

    return await getVendors(tenantId, options);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
}

export async function fetchVendorById(
  vendorId: string
): Promise<VendorDetail | null> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found in session');
      return null;
    }

    return await getVendorById(tenantId, vendorId);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }
}

export async function createNewVendor(
  input: VendorInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await createVendor(tenantId, input);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating vendor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create vendor',
    };
  }
}

export async function updateExistingVendor(
  vendorId: string,
  input: Partial<VendorInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: 'Not authenticated' };
    }

    await updateVendor(tenantId, vendorId, input);
    return { success: true };
  } catch (error) {
    console.error('Error updating vendor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update vendor',
    };
  }
}

// ==================== BILL ACTIONS ====================

export async function fetchBills(options?: {
  vendorId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<BillListItem[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found in session');
      return [];
    }

    return await getBills(tenantId, options);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
}

export async function fetchBillById(billId: string): Promise<BillDetail | null> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found in session');
      return null;
    }

    return await getBillById(tenantId, billId);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return null;
  }
}

export async function createNewBill(
  input: BillInput
): Promise<{ success: boolean; id?: string; billNumber?: string; error?: string }> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await createBill(tenantId, input);
    return { success: true, id: result.id, billNumber: result.billNumber };
  } catch (error) {
    console.error('Error creating bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bill',
    };
  }
}

export async function finalizeBillAction(
  billId: string,
  apAccountId: string,
  inputGstAccountId?: string
): Promise<{ success: boolean; journalEntryId?: string; error?: string }> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await finalizeBill(
      tenantId,
      billId,
      apAccountId,
      inputGstAccountId
    );
    return {
      success: result.success,
      journalEntryId: result.journalEntryId,
    };
  } catch (error) {
    console.error('Error finalizing bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to finalize bill',
    };
  }
}

export async function fetchNextBillNumber(): Promise<string> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return 'BILL-0001';
    }

    return await getNextBillNumberForDisplay(tenantId);
  } catch (error) {
    console.error('Error generating bill number:', error);
    return 'BILL-0001';
  }
}

// ==================== VENDOR PAYMENT ACTIONS ====================

export async function fetchVendorPayments(options?: {
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<VendorPaymentListItem[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found in session');
      return [];
    }

    return await getVendorPayments(tenantId, options);
  } catch (error) {
    console.error('Error fetching vendor payments:', error);
    return [];
  }
}

export async function fetchOutstandingBills(
  vendorId: string
): Promise<OutstandingBill[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found in session');
      return [];
    }

    return await getOutstandingBills(tenantId, vendorId);
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    return [];
  }
}

export async function createNewVendorPayment(
  input: VendorPaymentInput
): Promise<{ success: boolean; id?: string; paymentNumber?: string; error?: string }> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await createVendorPayment(tenantId, input);
    return {
      success: true,
      id: result.id,
      paymentNumber: result.paymentNumber,
    };
  } catch (error) {
    console.error('Error creating vendor payment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create payment',
    };
  }
}

export async function fetchNextVendorPaymentNumber(): Promise<string> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return 'VPMT-0001';
    }

    return await getNextVendorPaymentNumberForDisplay(tenantId);
  } catch (error) {
    console.error('Error generating payment number:', error);
    return 'VPMT-0001';
  }
}

// ==================== REPORTING ACTIONS ====================

export async function fetchAPAgingReport(
  asOfDate?: string
): Promise<APAgingReport> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return {
        asOfDate: new Date().toISOString().split('T')[0],
        rows: [],
        totals: {
          current: '0',
          days1_30: '0',
          days31_60: '0',
          days61_90: '0',
          over90: '0',
          total: '0',
        },
      };
    }

    return await getAPAgingReport(tenantId, asOfDate);
  } catch (error) {
    console.error('Error fetching AP aging report:', error);
    return {
      asOfDate: new Date().toISOString().split('T')[0],
      rows: [],
      totals: {
        current: '0',
        days1_30: '0',
        days31_60: '0',
        days61_90: '0',
        over90: '0',
        total: '0',
      },
    };
  }
}

export async function fetchAPDashboardStats(): Promise<APDashboardStats> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return {
        totalVendors: 0,
        activeVendors: 0,
        outstandingAP: '0.00',
        dueThisWeek: '0.00',
        overdueAmount: '0.00',
        thisMonthPurchases: '0.00',
      };
    }

    return await getAPDashboardStats(tenantId);
  } catch (error) {
    console.error('Error fetching AP dashboard stats:', error);
    return {
      totalVendors: 0,
      activeVendors: 0,
      outstandingAP: '0.00',
      dueThisWeek: '0.00',
      overdueAmount: '0.00',
      thisMonthPurchases: '0.00',
    };
  }
}

export async function fetchRecentAPActivity(
  limit?: number
): Promise<APActivityItem[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return [];
    }

    return await getRecentAPActivity(tenantId, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export async function fetchVendorsToPay(
  limit?: number
): Promise<
  {
    vendorId: string;
    vendorName: string;
    totalDue: string;
    billsDue: number;
    oldestDueDate: string;
  }[]
> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return [];
    }

    return await getVendorsToPay(tenantId, limit);
  } catch (error) {
    console.error('Error fetching vendors to pay:', error);
    return [];
  }
}

// ==================== VENDOR BILL/PAYMENT FETCHERS ====================

export async function fetchVendorBills(
  vendorId: string
): Promise<BillListItem[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return [];
    }

    return await getBills(tenantId, { vendorId });
  } catch (error) {
    console.error('Error fetching vendor bills:', error);
    return [];
  }
}

export async function fetchVendorPaymentHistory(
  vendorId: string
): Promise<VendorPaymentListItem[]> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return [];
    }

    return await getVendorPayments(tenantId, { vendorId });
  } catch (error) {
    console.error('Error fetching vendor payments:', error);
    return [];
  }
}
