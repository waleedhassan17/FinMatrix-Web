'use server';

// General Ledger Server Actions for FinMatrix
// Server actions for Chart of Accounts, Journal Entries, and GL operations

import { revalidatePath } from 'next/cache';
import { db } from '@finmatrix/db';
import {
  getAccounts,
  getAccountById,
  getAccountByNumber,
  createAccount,
  updateAccount,
  deactivateAccount,
  buildAccountTree,
  accountsToOptions,
  getJournalEntries,
  getJournalEntryWithLines,
  createJournalEntry,
  updateJournalEntry,
  postJournalEntry,
  voidJournalEntry,
  reverseJournalEntry,
  getTrialBalance,
  getGLAccountDetail,
  getFiscalPeriods,
  createFiscalPeriod,
  closeFiscalPeriod,
  getDepartments,
  createDepartment,
  updateDepartment,
} from '@finmatrix/db';
import type {
  ChartOfAccount,
  AccountInput,
  AccountTreeNode,
  AccountOption,
  JournalEntryWithLines,
  JournalEntryInput,
  TrialBalanceReport,
  GLAccountDetail,
  GLApiResponse,
  AccountType,
  JournalEntryStatus,
  FiscalPeriod,
  Department,
} from '@finmatrix/db';
import { getSession } from '@finmatrix/auth';

// Role hierarchy for quick permission checks
const rolePermissions: Record<string, string[]> = {
  super_admin: ['gl:read', 'gl:write', 'gl:post', 'gl:void', 'gl:delete', 'settings:manage'],
  org_owner: ['gl:read', 'gl:write', 'gl:post', 'gl:void', 'gl:delete', 'settings:manage'],
  admin: ['gl:read', 'gl:write', 'gl:post', 'gl:void', 'settings:manage'],
  accountant: ['gl:read', 'gl:write', 'gl:post', 'gl:void'],
  bookkeeper: ['gl:read', 'gl:write'],
  viewer: ['gl:read'],
};

// Helper to check if role has permission
function hasRolePermission(role: string, permission: string): boolean {
  const permissions = rolePermissions[role] || rolePermissions['viewer'];
  return permissions.includes(permission);
}

// Helper to get session and tenant
async function getAuthContext() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const tenantId = session.user.currentOrganizationId;
  if (!tenantId) {
    throw new Error('No organization selected');
  }

  return {
    userId: session.user.id,
    tenantId,
    role: session.user.role || 'viewer',
  };
}

// ============================================================================
// Chart of Accounts Actions
// ============================================================================

/**
 * Fetch all accounts as a flat array
 */
export async function fetchAccounts(
  options?: { type?: AccountType; includeInactive?: boolean }
): Promise<ChartOfAccount[]> {
  try {
    const { tenantId } = await getAuthContext();
    return await getAccounts(db, tenantId, options);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

/**
 * Fetch all accounts as a tree structure
 */
export async function fetchAccountsTree(
  options?: { type?: AccountType; includeInactive?: boolean }
): Promise<GLApiResponse<AccountTreeNode[]>> {
  try {
    const { tenantId } = await getAuthContext();
    const accounts = await getAccounts(db, tenantId, options);
    const tree = buildAccountTree(accounts);
    return { success: true, data: tree };
  } catch (error) {
    console.error('Error fetching accounts tree:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch accounts' };
  }
}

/**
 * Fetch accounts as dropdown options
 */
export async function fetchAccountOptions(
  type?: AccountType
): Promise<GLApiResponse<AccountOption[]>> {
  try {
    const { tenantId } = await getAuthContext();
    const accounts = await getAccounts(db, tenantId, { type, includeInactive: false });
    const options = accountsToOptions(accounts);
    return { success: true, data: options };
  } catch (error) {
    console.error('Error fetching account options:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch accounts' };
  }
}

/**
 * Fetch a single account by ID
 */
export async function fetchAccount(accountId: string): Promise<GLApiResponse<ChartOfAccount>> {
  try {
    const { tenantId } = await getAuthContext();
    const account = await getAccountById(db, tenantId, accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }
    return { success: true, data: account };
  } catch (error) {
    console.error('Error fetching account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch account' };
  }
}

/**
 * Validate account number is unique
 */
export async function validateAccountNumber(
  accountNumber: string,
  excludeId?: string
): Promise<GLApiResponse<boolean>> {
  try {
    const { tenantId } = await getAuthContext();
    const existing = await getAccountByNumber(db, tenantId, accountNumber);
    const isValid = !existing || existing.id === excludeId;
    return { success: true, data: isValid };
  } catch (error) {
    console.error('Error validating account number:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Validation failed' };
  }
}

/**
 * Create a new account
 */
export async function createAccountAction(input: AccountInput): Promise<GLApiResponse<ChartOfAccount>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    // Check permission
    if (!hasRolePermission(role, 'gl:write')) {
      return { success: false, error: 'You do not have permission to create accounts' };
    }

    // Validate unique account number
    const existing = await getAccountByNumber(db, tenantId, input.accountNumber);
    if (existing) {
      return { success: false, error: `Account number ${input.accountNumber} already exists` };
    }

    const account = await createAccount(db, tenantId, input, userId);
    revalidatePath('/gl/chart-of-accounts');
    return { success: true, data: account, message: 'Account created successfully' };
  } catch (error) {
    console.error('Error creating account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create account' };
  }
}

/**
 * Update an existing account
 */
export async function updateAccountAction(
  accountId: string,
  input: Partial<AccountInput>
): Promise<GLApiResponse<ChartOfAccount>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:write')) {
      return { success: false, error: 'You do not have permission to update accounts' };
    }

    // If changing account number, validate uniqueness
    if (input.accountNumber) {
      const existing = await getAccountByNumber(db, tenantId, input.accountNumber);
      if (existing && existing.id !== accountId) {
        return { success: false, error: `Account number ${input.accountNumber} already exists` };
      }
    }

    const account = await updateAccount(db, tenantId, accountId, input);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    revalidatePath('/gl/chart-of-accounts');
    return { success: true, data: account, message: 'Account updated successfully' };
  } catch (error) {
    console.error('Error updating account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update account' };
  }
}

/**
 * Deactivate an account
 */
export async function deactivateAccountAction(accountId: string): Promise<GLApiResponse<boolean>> {
  try {
    const { tenantId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:delete')) {
      return { success: false, error: 'You do not have permission to deactivate accounts' };
    }

    await deactivateAccount(db, tenantId, accountId);
    revalidatePath('/gl/chart-of-accounts');
    return { success: true, data: true, message: 'Account deactivated successfully' };
  } catch (error) {
    console.error('Error deactivating account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate account' };
  }
}

// ============================================================================
// Journal Entry Actions
// ============================================================================

/**
 * Fetch journal entries with filters
 */
export async function fetchJournalEntries(options?: {
  status?: JournalEntryStatus;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}): Promise<GLApiResponse<{ entries: JournalEntryWithLines[]; total: number }>> {
  try {
    const { tenantId } = await getAuthContext();
    const pageSize = options?.pageSize || 20;
    const page = options?.page || 1;

    const { entries, total } = await getJournalEntries(db, tenantId, {
      status: options?.status,
      startDate: options?.startDate ? new Date(options.startDate) : undefined,
      endDate: options?.endDate ? new Date(options.endDate) : undefined,
      searchTerm: options?.searchTerm,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // Fetch lines for each entry
    const entriesWithLines: (JournalEntryWithLines | null)[] = await Promise.all(
      entries.map((entry: { id: string }) => getJournalEntryWithLines(db, tenantId, entry.id))
    );

    return {
      success: true,
      data: {
        entries: entriesWithLines.filter((e): e is JournalEntryWithLines => e !== null),
        total,
      },
    };
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch entries' };
  }
}

/**
 * Fetch a single journal entry
 */
export async function fetchJournalEntry(entryId: string): Promise<GLApiResponse<JournalEntryWithLines>> {
  try {
    const { tenantId } = await getAuthContext();
    const entry = await getJournalEntryWithLines(db, tenantId, entryId);
    if (!entry) {
      return { success: false, error: 'Journal entry not found' };
    }
    return { success: true, data: entry };
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch entry' };
  }
}

/**
 * Create a new journal entry (as draft)
 */
export async function createJournalEntryAction(
  input: JournalEntryInput
): Promise<GLApiResponse<JournalEntryWithLines>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:write')) {
      return { success: false, error: 'You do not have permission to create journal entries' };
    }

    // Validate at least 2 lines
    if (input.lines.length < 2) {
      return { success: false, error: 'Journal entry must have at least 2 lines' };
    }

    // Validate debits = credits
    const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return {
        success: false,
        error: `Entry is not balanced. Debits: $${totalDebit.toFixed(2)}, Credits: $${totalCredit.toFixed(2)}`,
      };
    }

    const entry = await createJournalEntry(db, tenantId, input, userId);
    revalidatePath('/gl/journal-entries');
    return { success: true, data: entry, message: 'Journal entry created as draft' };
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create entry' };
  }
}

/**
 * Update a draft journal entry
 */
export async function updateJournalEntryAction(
  entryId: string,
  input: JournalEntryInput
): Promise<GLApiResponse<JournalEntryWithLines>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:write')) {
      return { success: false, error: 'You do not have permission to update journal entries' };
    }

    const entry = await updateJournalEntry(db, tenantId, entryId, input);
    if (!entry) {
      return { success: false, error: 'Journal entry not found' };
    }

    revalidatePath('/gl/journal-entries');
    revalidatePath(`/gl/journal-entries/${entryId}`);
    return { success: true, data: entry, message: 'Journal entry updated' };
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update entry' };
  }
}

/**
 * Post a journal entry (draft -> posted)
 */
export async function postJournalEntryAction(entryId: string): Promise<GLApiResponse<JournalEntryWithLines>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:post')) {
      return { success: false, error: 'You do not have permission to post journal entries' };
    }

    const entry = await postJournalEntry(db, tenantId, entryId, userId);
    revalidatePath('/gl/journal-entries');
    revalidatePath(`/gl/journal-entries/${entryId}`);
    revalidatePath('/gl/chart-of-accounts'); // Balances updated
    return { success: true, data: entry, message: `Entry ${entry.entryNumber} posted successfully` };
  } catch (error) {
    console.error('Error posting journal entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to post entry' };
  }
}

/**
 * Void a posted journal entry
 */
export async function voidJournalEntryAction(entryId: string): Promise<GLApiResponse<JournalEntryWithLines>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:void')) {
      return { success: false, error: 'You do not have permission to void journal entries' };
    }

    const entry = await voidJournalEntry(db, tenantId, entryId, userId);
    revalidatePath('/gl/journal-entries');
    revalidatePath(`/gl/journal-entries/${entryId}`);
    revalidatePath('/gl/chart-of-accounts');
    return { success: true, data: entry, message: `Entry ${entry.entryNumber} voided` };
  } catch (error) {
    console.error('Error voiding journal entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to void entry' };
  }
}

/**
 * Create a reversing entry for a posted journal entry
 */
export async function reverseJournalEntryAction(
  entryId: string,
  reversalDate: string
): Promise<GLApiResponse<JournalEntryWithLines>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'gl:write')) {
      return { success: false, error: 'You do not have permission to create reversing entries' };
    }

    const entry = await reverseJournalEntry(db, tenantId, entryId, new Date(reversalDate), userId);
    revalidatePath('/gl/journal-entries');
    return { success: true, data: entry, message: `Reversing entry ${entry.entryNumber} created` };
  } catch (error) {
    console.error('Error reversing journal entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reverse entry' };
  }
}

// ============================================================================
// Report Actions
// ============================================================================

/**
 * Generate Trial Balance report
 */
export async function fetchTrialBalance(asOfDate: string): Promise<GLApiResponse<TrialBalanceReport>> {
  try {
    const { tenantId } = await getAuthContext();
    const report = await getTrialBalance(db, tenantId, new Date(asOfDate));
    return { success: true, data: report };
  } catch (error) {
    console.error('Error generating trial balance:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' };
  }
}

/**
 * Get GL detail for a single account
 */
export async function fetchGLAccountDetail(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<GLApiResponse<GLAccountDetail>> {
  try {
    const { tenantId } = await getAuthContext();
    const detail = await getGLAccountDetail(db, tenantId, accountId, new Date(startDate), new Date(endDate));
    if (!detail) {
      return { success: false, error: 'Account not found' };
    }
    return { success: true, data: detail };
  } catch (error) {
    console.error('Error fetching GL detail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GL detail' };
  }
}

// ============================================================================
// Fiscal Period Actions
// ============================================================================

/**
 * Fetch all fiscal periods
 */
export async function fetchFiscalPeriods(): Promise<GLApiResponse<FiscalPeriod[]>> {
  try {
    const { tenantId } = await getAuthContext();
    const periods = await getFiscalPeriods(db, tenantId);
    return { success: true, data: periods };
  } catch (error) {
    console.error('Error fetching fiscal periods:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch periods' };
  }
}

/**
 * Create a fiscal period
 */
export async function createFiscalPeriodAction(input: {
  name: string;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  period: number;
}): Promise<GLApiResponse<FiscalPeriod>> {
  try {
    const { tenantId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'settings:manage')) {
      return { success: false, error: 'You do not have permission to manage fiscal periods' };
    }

    const period = await createFiscalPeriod(db, tenantId, {
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      fiscalYear: input.fiscalYear,
      period: input.period,
    });

    revalidatePath('/gl/settings');
    return { success: true, data: period, message: 'Fiscal period created' };
  } catch (error) {
    console.error('Error creating fiscal period:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create period' };
  }
}

/**
 * Close a fiscal period
 */
export async function closeFiscalPeriodAction(periodId: string): Promise<GLApiResponse<FiscalPeriod>> {
  try {
    const { tenantId, userId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'settings:manage')) {
      return { success: false, error: 'You do not have permission to close fiscal periods' };
    }

    const period = await closeFiscalPeriod(db, tenantId, periodId, userId);
    revalidatePath('/gl/settings');
    return { success: true, data: period, message: 'Fiscal period closed' };
  } catch (error) {
    console.error('Error closing fiscal period:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to close period' };
  }
}

// ============================================================================
// Department Actions
// ============================================================================

/**
 * Fetch all departments
 */
export async function fetchDepartments(includeInactive = false): Promise<GLApiResponse<Department[]>> {
  try {
    const { tenantId } = await getAuthContext();
    const depts = await getDepartments(db, tenantId, includeInactive);
    return { success: true, data: depts };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch departments' };
  }
}

/**
 * Create a department
 */
export async function createDepartmentAction(input: {
  code: string;
  name: string;
  description?: string;
}): Promise<GLApiResponse<Department>> {
  try {
    const { tenantId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'settings:manage')) {
      return { success: false, error: 'You do not have permission to create departments' };
    }

    const dept = await createDepartment(db, tenantId, input);
    revalidatePath('/gl/settings');
    return { success: true, data: dept, message: 'Department created' };
  } catch (error) {
    console.error('Error creating department:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create department' };
  }
}

/**
 * Update a department
 */
export async function updateDepartmentAction(
  departmentId: string,
  input: Partial<{ code: string; name: string; description?: string; isActive: boolean }>
): Promise<GLApiResponse<Department>> {
  try {
    const { tenantId, role } = await getAuthContext();

    if (!hasRolePermission(role, 'settings:manage')) {
      return { success: false, error: 'You do not have permission to update departments' };
    }

    const dept = await updateDepartment(db, tenantId, departmentId, input);
    if (!dept) {
      return { success: false, error: 'Department not found' };
    }

    revalidatePath('/gl/settings');
    return { success: true, data: dept, message: 'Department updated' };
  } catch (error) {
    console.error('Error updating department:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update department' };
  }
}
