'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/../../packages/auth/src';
import {
  // Bank Accounts
  getBankAccounts as dbGetBankAccounts,
  getBankAccountById as dbGetBankAccountById,
  getActiveBankAccounts as dbGetActiveBankAccounts,
  getBankAccountSummaries as dbGetBankAccountSummaries,
  createBankAccount as dbCreateBankAccount,
  updateBankAccount as dbUpdateBankAccount,
  // Bank Transactions
  getBankTransactions as dbGetBankTransactions,
  getAccountRegister as dbGetAccountRegister,
  getUnreconciledTransactions as dbGetUnreconciledTransactions,
  createBankTransaction as dbCreateBankTransaction,
  updateBankTransaction as dbUpdateBankTransaction,
  markTransactionReconciled as dbMarkTransactionReconciled,
  markTransactionsReconciled as dbMarkTransactionsReconciled,
  // Statement Import
  createImportBatch as dbCreateImportBatch,
  getImportBatches as dbGetImportBatches,
  getImportBatchById as dbGetImportBatchById,
  updateImportBatch as dbUpdateImportBatch,
  createImportedTransactions as dbCreateImportedTransactions,
  getImportedTransactions as dbGetImportedTransactions,
  getPendingImportedTransactions as dbGetPendingImportedTransactions,
  updateImportedTransaction as dbUpdateImportedTransaction,
  // Auto-Matching
  findMatchesForImportedTransaction as dbFindMatches,
  runAutoMatch as dbRunAutoMatch,
  // Reconciliation
  getReconciliations as dbGetReconciliations,
  getReconciliationById as dbGetReconciliationById,
  getInProgressReconciliation as dbGetInProgressReconciliation,
  createReconciliation as dbCreateReconciliation,
  updateReconciliation as dbUpdateReconciliation,
  completeReconciliation as dbCompleteReconciliation,
  addReconciliationItem as dbAddReconciliationItem,
  getReconciliationItems as dbGetReconciliationItems,
  updateReconciliationItem as dbUpdateReconciliationItem,
  calculateReconciliationTotals as dbCalculateReconciliationTotals,
  // Outstanding Items
  getOutstandingChecks as dbGetOutstandingChecks,
  getDepositsInTransit as dbGetDepositsInTransit,
  // Dashboard
  getBankingDashboardSummary as dbGetBankingDashboardSummary,
  // Matching Rules
  getMatchingRules as dbGetMatchingRules,
  createMatchingRule as dbCreateMatchingRule,
  // Transfers
  createTransfer as dbCreateTransfer,
} from '@finmatrix/db';

// ============================================================================
// Helper Functions
// ============================================================================

async function getTenantId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.currentOrganizationId) {
    throw new Error('Unauthorized');
  }
  return session.user.currentOrganizationId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

// ============================================================================
// Bank Account Actions
// ============================================================================

export async function fetchBankAccounts() {
  try {
    const tenantId = await getTenantId();
    const accounts = await dbGetBankAccounts(tenantId);
    return { success: true, data: accounts };
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return { success: false, error: 'Failed to fetch bank accounts' };
  }
}

export async function fetchActiveBankAccounts() {
  try {
    const tenantId = await getTenantId();
    const accounts = await dbGetActiveBankAccounts(tenantId);
    return { success: true, data: accounts };
  } catch (error) {
    console.error('Error fetching active bank accounts:', error);
    return { success: false, error: 'Failed to fetch active bank accounts' };
  }
}

export async function fetchBankAccountSummaries() {
  try {
    const tenantId = await getTenantId();
    const summaries = await dbGetBankAccountSummaries(tenantId);
    return { success: true, data: summaries };
  } catch (error) {
    console.error('Error fetching bank account summaries:', error);
    return { success: false, error: 'Failed to fetch bank account summaries' };
  }
}

export async function fetchBankAccountById(accountId: string) {
  try {
    const tenantId = await getTenantId();
    const account = await dbGetBankAccountById(tenantId, accountId);
    return { success: true, data: account };
  } catch (error) {
    console.error('Error fetching bank account:', error);
    return { success: false, error: 'Failed to fetch bank account' };
  }
}

export async function createBankAccount(data: {
  accountName: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  bankBranch?: string;
  accountType: 'checking' | 'savings' | 'money_market' | 'credit_card' | 'line_of_credit' | 'petty_cash' | 'other';
  openingBalance: number;
  openingBalanceDate?: string;
  glAccountId?: string;
  defaultDescription?: string;
  isDefault?: boolean;
  notes?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    const account = await dbCreateBankAccount({
      tenantId,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      bankName: data.bankName,
      bankBranch: data.bankBranch,
      accountType: data.accountType,
      openingBalance: data.openingBalance.toFixed(2),
      openingBalanceDate: data.openingBalanceDate,
      glAccountId: data.glAccountId,
      defaultDescription: data.defaultDescription,
      isDefault: data.isDefault,
      notes: data.notes,
      createdBy: userId,
    });
    
    revalidatePath('/banking');
    revalidatePath('/banking/accounts');
    return { success: true, data: account };
  } catch (error) {
    console.error('Error creating bank account:', error);
    return { success: false, error: 'Failed to create bank account' };
  }
}

export async function updateBankAccount(
  accountId: string,
  data: {
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    bankBranch?: string;
    accountType?: 'checking' | 'savings' | 'money_market' | 'credit_card' | 'line_of_credit' | 'petty_cash' | 'other';
    status?: 'active' | 'inactive' | 'closed';
    glAccountId?: string;
    defaultDescription?: string;
    isDefault?: boolean;
    notes?: string;
  }
) {
  try {
    const tenantId = await getTenantId();
    const account = await dbUpdateBankAccount(tenantId, accountId, data);
    
    revalidatePath('/banking');
    revalidatePath('/banking/accounts');
    return { success: true, data: account };
  } catch (error) {
    console.error('Error updating bank account:', error);
    return { success: false, error: 'Failed to update bank account' };
  }
}

// ============================================================================
// Bank Transaction Actions
// ============================================================================

export async function fetchAccountRegister(
  accountId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
) {
  try {
    const tenantId = await getTenantId();
    const transactions = await dbGetAccountRegister(tenantId, accountId, options);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error fetching account register:', error);
    return { success: false, error: 'Failed to fetch account register' };
  }
}

export async function fetchUnreconciledTransactions(accountId: string, beforeDate?: string) {
  try {
    const tenantId = await getTenantId();
    const transactions = await dbGetUnreconciledTransactions(tenantId, accountId, beforeDate);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error fetching unreconciled transactions:', error);
    return { success: false, error: 'Failed to fetch unreconciled transactions' };
  }
}

export async function recordDeposit(data: {
  bankAccountId: string;
  transactionDate: string;
  amount: number;
  description?: string;
  referenceNumber?: string;
  payerName?: string;
  payerId?: string;
  payerType?: 'customer' | 'vendor' | 'employee';
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    const transaction = await dbCreateBankTransaction({
      tenantId,
      bankAccountId: data.bankAccountId,
      transactionDate: data.transactionDate,
      transactionType: 'deposit',
      amount: Math.abs(data.amount).toFixed(2), // Positive for deposit
      description: data.description,
      referenceNumber: data.referenceNumber,
      payeeName: data.payerName,
      payeeId: data.payerId,
      payeeType: data.payerType,
      source: 'manual',
      createdBy: userId,
    });
    
    revalidatePath('/banking');
    revalidatePath(`/banking/accounts/${data.bankAccountId}`);
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error recording deposit:', error);
    return { success: false, error: 'Failed to record deposit' };
  }
}

export async function writeCheck(data: {
  bankAccountId: string;
  transactionDate: string;
  amount: number;
  checkNumber: string;
  payeeName: string;
  payeeId?: string;
  payeeType?: 'customer' | 'vendor' | 'employee';
  memo?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    const transaction = await dbCreateBankTransaction({
      tenantId,
      bankAccountId: data.bankAccountId,
      transactionDate: data.transactionDate,
      transactionType: 'check',
      amount: (-Math.abs(data.amount)).toFixed(2), // Negative for check
      checkNumber: data.checkNumber,
      description: `Check #${data.checkNumber}`,
      memo: data.memo,
      payeeName: data.payeeName,
      payeeId: data.payeeId,
      payeeType: data.payeeType,
      source: 'manual',
      createdBy: userId,
    });
    
    revalidatePath('/banking');
    revalidatePath(`/banking/accounts/${data.bankAccountId}`);
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error writing check:', error);
    return { success: false, error: 'Failed to write check' };
  }
}

export async function transferFunds(data: {
  fromAccountId: string;
  toAccountId: string;
  transactionDate: string;
  amount: number;
  description?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    const result = await dbCreateTransfer(
      tenantId,
      data.fromAccountId,
      data.toAccountId,
      Math.abs(data.amount),
      data.transactionDate,
      data.description || 'Bank Transfer',
      userId
    );
    
    revalidatePath('/banking');
    revalidatePath(`/banking/accounts/${data.fromAccountId}`);
    revalidatePath(`/banking/accounts/${data.toAccountId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error transferring funds:', error);
    return { success: false, error: 'Failed to transfer funds' };
  }
}

export async function createBankTransaction(data: {
  bankAccountId: string;
  transactionDate: string;
  transactionType: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'check' | 'fee' | 'interest' | 'adjustment' | 'payment' | 'receipt';
  amount: number;
  referenceNumber?: string;
  checkNumber?: string;
  description?: string;
  memo?: string;
  payeeName?: string;
  payeeId?: string;
  payeeType?: 'customer' | 'vendor' | 'employee';
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    // Determine sign based on transaction type
    const isDebit = ['withdrawal', 'transfer_out', 'check', 'fee', 'payment'].includes(data.transactionType);
    const signedAmount = isDebit ? -Math.abs(data.amount) : Math.abs(data.amount);
    
    const transaction = await dbCreateBankTransaction({
      tenantId,
      bankAccountId: data.bankAccountId,
      transactionDate: data.transactionDate,
      transactionType: data.transactionType,
      amount: signedAmount.toFixed(2),
      referenceNumber: data.referenceNumber,
      checkNumber: data.checkNumber,
      description: data.description,
      memo: data.memo,
      payeeName: data.payeeName,
      payeeId: data.payeeId,
      payeeType: data.payeeType,
      source: 'manual',
      createdBy: userId,
    });
    
    revalidatePath('/banking');
    revalidatePath(`/banking/accounts/${data.bankAccountId}`);
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error creating bank transaction:', error);
    return { success: false, error: 'Failed to create transaction' };
  }
}

// ============================================================================
// Statement Import Actions
// ============================================================================

export async function createImportBatch(
  accountId: string,
  fileName: string,
  fileType: string,
  transactions: {
    transactionDate: string;
    amount: number;
    description?: string;
    referenceNumber?: string;
    checkNumber?: string;
    rawData?: Record<string, any>;
  }[],
  columnMapping?: Record<string, string>
) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const batchId = crypto.randomUUID();
    
    // Create import batch
    const batch = await dbCreateImportBatch({
      id: batchId,
      tenantId,
      bankAccountId: accountId,
      importBatchId: batchId,
      importFileName: fileName,
      importFileType: fileType,
      importedBy: userId,
      totalTransactions: transactions.length,
      columnMapping: columnMapping as any,
    });
    
    // Create imported transactions
    if (transactions.length > 0) {
      const importedTxs = transactions.map(tx => ({
        tenantId,
        importBatchId: batchId,
        bankAccountId: accountId,
        transactionDate: tx.transactionDate,
        amount: tx.amount.toFixed(2),
        description: tx.description,
        referenceNumber: tx.referenceNumber,
        checkNumber: tx.checkNumber,
        rawData: tx.rawData as any,
        status: 'pending' as const,
      }));
      
      await dbCreateImportedTransactions(importedTxs);
    }
    
    revalidatePath('/banking/import');
    return { success: true, data: { batch, batchId } };
  } catch (error) {
    console.error('Error creating import batch:', error);
    return { success: false, error: 'Failed to create import batch' };
  }
}

export async function fetchImportBatches(accountId?: string) {
  try {
    const tenantId = await getTenantId();
    const batches = await dbGetImportBatches(tenantId, accountId);
    return { success: true, data: batches };
  } catch (error) {
    console.error('Error fetching import batches:', error);
    return { success: false, error: 'Failed to fetch import batches' };
  }
}

export async function fetchImportedTransactions(batchId: string, status?: string) {
  try {
    const tenantId = await getTenantId();
    const transactions = await dbGetImportedTransactions(tenantId, batchId, status);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error fetching imported transactions:', error);
    return { success: false, error: 'Failed to fetch imported transactions' };
  }
}

export async function runAutoMatch(batchId: string) {
  try {
    const tenantId = await getTenantId();
    const summary = await dbRunAutoMatch(tenantId, batchId);
    
    revalidatePath('/banking/import');
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error running auto-match:', error);
    return { success: false, error: 'Failed to run auto-match' };
  }
}

export async function processImportedTransaction(
  transactionId: string,
  action: 'match' | 'create' | 'ignore',
  matchedTransactionId?: string
) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    if (action === 'match' && matchedTransactionId) {
      // Link imported transaction to existing book transaction
      await dbUpdateImportedTransaction(tenantId, transactionId, {
        status: 'matched',
        matchedTransactionId,
        processedAt: new Date(),
        processedBy: userId,
        userAction: 'matched',
      });
    } else if (action === 'create') {
      // Get the imported transaction details
      const imported = await dbGetImportedTransactions(tenantId, '', 'pending');
      const tx = imported.find(t => t.id === transactionId);
      
      if (tx) {
        // Create new bank transaction from imported
        const newTx = await dbCreateBankTransaction({
          tenantId,
          bankAccountId: tx.bankAccountId,
          transactionDate: tx.transactionDate,
          transactionType: parseFloat(tx.amount) >= 0 ? 'deposit' : 'withdrawal',
          amount: tx.amount,
          description: tx.description || undefined,
          referenceNumber: tx.referenceNumber || undefined,
          checkNumber: tx.checkNumber || undefined,
          source: 'import',
          createdBy: userId,
        });
        
        await dbUpdateImportedTransaction(tenantId, transactionId, {
          status: 'created',
          createdTransactionId: newTx.id,
          processedAt: new Date(),
          processedBy: userId,
          userAction: 'created',
        });
      }
    } else if (action === 'ignore') {
      await dbUpdateImportedTransaction(tenantId, transactionId, {
        status: 'ignored',
        processedAt: new Date(),
        processedBy: userId,
        userAction: 'ignored',
      });
    }
    
    revalidatePath('/banking/import');
    return { success: true };
  } catch (error) {
    console.error('Error processing imported transaction:', error);
    return { success: false, error: 'Failed to process transaction' };
  }
}

// ============================================================================
// Reconciliation Actions
// ============================================================================

export async function fetchReconciliations(accountId?: string) {
  try {
    const tenantId = await getTenantId();
    const reconciliations = await dbGetReconciliations(tenantId, accountId);
    return { success: true, data: reconciliations };
  } catch (error) {
    console.error('Error fetching reconciliations:', error);
    return { success: false, error: 'Failed to fetch reconciliations' };
  }
}

export async function fetchReconciliationById(reconciliationId: string) {
  try {
    const tenantId = await getTenantId();
    const reconciliation = await dbGetReconciliationById(tenantId, reconciliationId);
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    return { success: false, error: 'Failed to fetch reconciliation' };
  }
}

export async function fetchInProgressReconciliation(accountId: string) {
  try {
    const tenantId = await getTenantId();
    const reconciliation = await dbGetInProgressReconciliation(tenantId, accountId);
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error fetching in-progress reconciliation:', error);
    return { success: false, error: 'Failed to fetch in-progress reconciliation' };
  }
}

export async function startReconciliation(data: {
  bankAccountId: string;
  statementDate: string;
  statementEndingBalance: number;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    // Check for existing in-progress reconciliation
    const existing = await dbGetInProgressReconciliation(tenantId, data.bankAccountId);
    if (existing) {
      return { success: false, error: 'An in-progress reconciliation already exists for this account' };
    }
    
    // Get beginning balance (last reconciled balance or opening balance)
    const account = await dbGetBankAccountById(tenantId, data.bankAccountId);
    if (!account) {
      return { success: false, error: 'Bank account not found' };
    }
    
    const beginningBalance = account.lastReconciledBalance || account.openingBalance || '0';
    
    const reconciliation = await dbCreateReconciliation({
      tenantId,
      bankAccountId: data.bankAccountId,
      statementDate: data.statementDate,
      statementEndingBalance: data.statementEndingBalance.toFixed(2),
      beginningBalance,
      status: 'in_progress',
      createdBy: userId,
    });
    
    // Add all unreconciled transactions as items
    const unreconciledTxs = await dbGetUnreconciledTransactions(
      tenantId,
      data.bankAccountId,
      data.statementDate
    );
    
    for (const tx of unreconciledTxs) {
      await dbAddReconciliationItem({
        reconciliationId: reconciliation.id,
        bankTransactionId: tx.id,
        isCleared: false,
      });
    }
    
    revalidatePath('/banking/reconcile');
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error starting reconciliation:', error);
    return { success: false, error: 'Failed to start reconciliation' };
  }
}

export async function toggleReconciliationItem(itemId: string, isCleared: boolean) {
  try {
    await dbUpdateReconciliationItem(itemId, isCleared);
    revalidatePath('/banking/reconcile');
    return { success: true };
  } catch (error) {
    console.error('Error toggling reconciliation item:', error);
    return { success: false, error: 'Failed to toggle item' };
  }
}

export async function fetchReconciliationItems(reconciliationId: string) {
  try {
    const items = await dbGetReconciliationItems(reconciliationId);
    return { success: true, data: items };
  } catch (error) {
    console.error('Error fetching reconciliation items:', error);
    return { success: false, error: 'Failed to fetch reconciliation items' };
  }
}

export async function calculateReconciliationSummary(reconciliationId: string) {
  try {
    const tenantId = await getTenantId();
    const summary = await dbCalculateReconciliationTotals(tenantId, reconciliationId);
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error calculating reconciliation summary:', error);
    return { success: false, error: 'Failed to calculate summary' };
  }
}

export async function completeReconciliation(reconciliationId: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    // First check if difference is 0
    const summary = await dbCalculateReconciliationTotals(tenantId, reconciliationId);
    if (Math.abs(summary.difference) > 0.01) {
      return { 
        success: false, 
        error: `Cannot complete reconciliation. Difference of ${summary.difference.toFixed(2)} exists.` 
      };
    }
    
    // Mark all cleared items as reconciled
    const items = await dbGetReconciliationItems(reconciliationId);
    const clearedIds = items
      .filter(({ item }) => item.isCleared)
      .map(({ item }) => item.bankTransactionId);
    
    if (clearedIds.length > 0) {
      await dbMarkTransactionsReconciled(tenantId, clearedIds, reconciliationId, userId);
    }
    
    // Complete the reconciliation
    const reconciliation = await dbCompleteReconciliation(tenantId, reconciliationId, userId);
    
    revalidatePath('/banking');
    revalidatePath('/banking/reconcile');
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error completing reconciliation:', error);
    return { success: false, error: 'Failed to complete reconciliation' };
  }
}

export async function cancelReconciliation(reconciliationId: string) {
  try {
    const tenantId = await getTenantId();
    
    const reconciliation = await dbUpdateReconciliation(tenantId, reconciliationId, {
      status: 'cancelled',
    });
    
    revalidatePath('/banking/reconcile');
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error cancelling reconciliation:', error);
    return { success: false, error: 'Failed to cancel reconciliation' };
  }
}

// ============================================================================
// Report Actions
// ============================================================================

export async function fetchOutstandingChecks(accountId: string, asOfDate?: string) {
  try {
    const tenantId = await getTenantId();
    const checks = await dbGetOutstandingChecks(tenantId, accountId, asOfDate);
    return { success: true, data: checks };
  } catch (error) {
    console.error('Error fetching outstanding checks:', error);
    return { success: false, error: 'Failed to fetch outstanding checks' };
  }
}

export async function fetchDepositsInTransit(accountId: string, asOfDate?: string) {
  try {
    const tenantId = await getTenantId();
    const deposits = await dbGetDepositsInTransit(tenantId, accountId, asOfDate);
    return { success: true, data: deposits };
  } catch (error) {
    console.error('Error fetching deposits in transit:', error);
    return { success: false, error: 'Failed to fetch deposits in transit' };
  }
}

// ============================================================================
// Dashboard Actions
// ============================================================================

export async function fetchBankingDashboard() {
  try {
    const tenantId = await getTenantId();
    const summary = await dbGetBankingDashboardSummary(tenantId);
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching banking dashboard:', error);
    return { success: false, error: 'Failed to fetch banking dashboard' };
  }
}

// ============================================================================
// Matching Rules Actions
// ============================================================================

export async function fetchMatchingRules() {
  try {
    const tenantId = await getTenantId();
    const rules = await dbGetMatchingRules(tenantId);
    return { success: true, data: rules };
  } catch (error) {
    console.error('Error fetching matching rules:', error);
    return { success: false, error: 'Failed to fetch matching rules' };
  }
}

export async function createMatchingRule(data: {
  ruleName?: string;
  ruleType: 'payee' | 'description' | 'amount' | 'category';
  matchPattern: string;
  matchField: 'description' | 'payee' | 'amount';
  assignPayeeId?: string;
  assignPayeeName?: string;
  assignPayeeType?: 'customer' | 'vendor' | 'employee';
  assignTransactionType?: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'check' | 'fee' | 'interest' | 'adjustment' | 'payment' | 'receipt';
  assignGlAccountId?: string;
  assignDescription?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    
    const rule = await dbCreateMatchingRule({
      tenantId,
      ...data,
      createdBy: userId,
    });
    
    return { success: true, data: rule };
  } catch (error) {
    console.error('Error creating matching rule:', error);
    return { success: false, error: 'Failed to create matching rule' };
  }
}
