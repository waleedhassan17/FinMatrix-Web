'use server';

import { getSession } from '@finmatrix/auth';
import {
  db,
  getCustomers,
  getCustomerById,
  searchCustomers,
  getRecentCustomers,
  createCustomer,
  updateCustomer,
  getInvoices,
  getInvoiceById,
  getNextInvoiceNumber,
  createInvoice,
  finalizeInvoice,
  getOutstandingInvoices,
  getPayments,
  getNextPaymentNumber,
  createPayment,
  getARAgingReport,
  getARDashboardStats,
  getRecentARActivity,
  getAccountByNumber,
} from '@finmatrix/db';
import type {
  CustomerInput,
  CustomerFilters,
  InvoiceInput,
  InvoiceFilters,
  PaymentInput,
  PaymentFilters,
  PaginationParams,
} from '@finmatrix/db';
import { revalidatePath } from 'next/cache';

// Helper to get tenant ID from session
async function getTenantId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.currentOrganizationId) {
    throw new Error('No organization selected');
  }
  return session.user.currentOrganizationId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
}

// ============================================================================
// Customer Actions
// ============================================================================

export async function fetchCustomers(
  filters?: CustomerFilters,
  pagination?: PaginationParams
) {
  try {
    const tenantId = await getTenantId();
    const result = await getCustomers(db, tenantId, filters, pagination);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { success: false, error: 'Failed to fetch customers' };
  }
}

export async function fetchCustomerById(customerId: string) {
  try {
    const tenantId = await getTenantId();
    const customer = await getCustomerById(db, tenantId, customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }
    return { success: true, data: customer };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return { success: false, error: 'Failed to fetch customer' };
  }
}

export async function fetchCustomerSearch(searchTerm: string, limit = 10) {
  try {
    const tenantId = await getTenantId();
    const results = await searchCustomers(db, tenantId, searchTerm, limit);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error searching customers:', error);
    return { success: false, error: 'Failed to search customers' };
  }
}

export async function fetchRecentCustomers(limit = 5) {
  try {
    const tenantId = await getTenantId();
    const results = await getRecentCustomers(db, tenantId, limit);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching recent customers:', error);
    return { success: false, error: 'Failed to fetch recent customers' };
  }
}

export async function addCustomer(input: CustomerInput) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const customer = await createCustomer(db, tenantId, input, userId);
    revalidatePath('/dashboard/customers');
    return { success: true, data: customer };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { success: false, error: 'Failed to create customer' };
  }
}

export async function editCustomer(customerId: string, input: Partial<CustomerInput>) {
  try {
    const tenantId = await getTenantId();
    const customer = await updateCustomer(db, tenantId, customerId, input);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }
    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true, data: customer };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: 'Failed to update customer' };
  }
}

// ============================================================================
// Invoice Actions
// ============================================================================

export async function fetchInvoices(
  filters?: InvoiceFilters,
  pagination?: PaginationParams
) {
  try {
    const tenantId = await getTenantId();
    const result = await getInvoices(db, tenantId, filters, pagination);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: 'Failed to fetch invoices' };
  }
}

export async function fetchInvoiceById(invoiceId: string) {
  try {
    const tenantId = await getTenantId();
    const invoice = await getInvoiceById(db, tenantId, invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return { success: false, error: 'Failed to fetch invoice' };
  }
}

export async function fetchNextInvoiceNumber(prefix = 'INV') {
  try {
    const tenantId = await getTenantId();
    const invoiceNumber = await getNextInvoiceNumber(db, tenantId, prefix);
    return { success: true, data: invoiceNumber };
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return { success: false, error: 'Failed to generate invoice number' };
  }
}

export async function addInvoice(input: InvoiceInput) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const invoice = await createInvoice(db, tenantId, input, userId);
    revalidatePath('/dashboard/invoices');
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { success: false, error: 'Failed to create invoice' };
  }
}

export async function postInvoice(invoiceId: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    // Get default accounts (in production, these should come from organization settings)
    const arAccount = await getAccountByNumber(db, tenantId, '1200');
    const revenueAccount = await getAccountByNumber(db, tenantId, '4000');
    const taxAccount = await getAccountByNumber(db, tenantId, '2200');

    if (!arAccount || !revenueAccount) {
      return { 
        success: false, 
        error: 'Please set up Accounts Receivable and Revenue accounts in Chart of Accounts' 
      };
    }

    const invoice = await finalizeInvoice(db, tenantId, invoiceId, userId, {
      receivableAccountId: arAccount.id,
      revenueAccountId: revenueAccount.id,
      taxPayableAccountId: taxAccount?.id,
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath('/dashboard/customers');
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error finalizing invoice:', error);
    return { success: false, error: (error as Error).message || 'Failed to finalize invoice' };
  }
}

export async function fetchOutstandingInvoices(customerId: string) {
  try {
    const tenantId = await getTenantId();
    const invoices = await getOutstandingInvoices(db, tenantId, customerId);
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching outstanding invoices:', error);
    return { success: false, error: 'Failed to fetch outstanding invoices' };
  }
}

export async function fetchCustomerInvoices(customerId: string) {
  try {
    const tenantId = await getTenantId();
    const result = await getInvoices(db, tenantId, { customerId });
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return { success: false, error: 'Failed to fetch customer invoices' };
  }
}

export async function fetchCustomerPayments(customerId: string) {
  try {
    const tenantId = await getTenantId();
    const result = await getPayments(db, tenantId, { customerId });
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return { success: false, error: 'Failed to fetch customer payments' };
  }
}

// ============================================================================
// Payment Actions
// ============================================================================

export async function fetchPayments(
  filters?: PaymentFilters,
  pagination?: PaginationParams
) {
  try {
    const tenantId = await getTenantId();
    const result = await getPayments(db, tenantId, filters, pagination);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { success: false, error: 'Failed to fetch payments' };
  }
}

export async function fetchNextPaymentNumber(prefix = 'RCP') {
  try {
    const tenantId = await getTenantId();
    const paymentNumber = await getNextPaymentNumber(db, tenantId, prefix);
    return { success: true, data: paymentNumber };
  } catch (error) {
    console.error('Error generating payment number:', error);
    return { success: false, error: 'Failed to generate payment number' };
  }
}

export async function addPayment(input: PaymentInput) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    // Get default accounts
    const arAccount = await getAccountByNumber(db, tenantId, '1200');
    const bankAccount = await getAccountByNumber(db, tenantId, '1000');

    if (!arAccount || !bankAccount) {
      return { 
        success: false, 
        error: 'Please set up Accounts Receivable and Bank accounts in Chart of Accounts' 
      };
    }

    const payment = await createPayment(db, tenantId, input, userId, {
      receivableAccountId: arAccount.id,
      bankAccountId: bankAccount.id,
    });

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/customers');
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: 'Failed to create payment' };
  }
}

// ============================================================================
// Reporting Actions
// ============================================================================

export async function fetchARAgingReport(asOfDate?: string) {
  try {
    const tenantId = await getTenantId();
    const report = await getARAgingReport(db, tenantId, asOfDate);
    return { success: true, data: report };
  } catch (error) {
    console.error('Error fetching AR aging report:', error);
    return { success: false, error: 'Failed to fetch AR aging report' };
  }
}

export async function fetchARDashboardStats() {
  try {
    const tenantId = await getTenantId();
    const stats = await getARDashboardStats(db, tenantId);
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching AR dashboard stats:', error);
    return { success: false, error: 'Failed to fetch dashboard statistics' };
  }
}

export async function fetchRecentARActivity(limit = 10) {
  try {
    const tenantId = await getTenantId();
    const activity = await getRecentARActivity(db, tenantId, limit);
    return { success: true, data: activity };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return { success: false, error: 'Failed to fetch recent activity' };
  }
}
