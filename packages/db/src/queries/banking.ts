import { eq, and, desc, asc, gte, lte, sql, or, isNull, ne, like, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db } from '../client';
import {
  bankAccounts,
  bankTransactions,
  importedStatements,
  importedTransactions,
  bankReconciliations,
  reconciliationItems,
  matchingRules,
  type NewBankAccount,
  type NewBankTransaction,
  type NewImportedStatement,
  type NewImportedTransaction,
  type NewBankReconciliation,
  type NewReconciliationItem,
  type NewMatchingRule,
} from '../schema/banking';
import type {
  BankAccountWithDetails,
  BankAccountSummary,
  AccountRegisterEntry,
  ImportBatchSummary,
  ImportedTransactionWithMatch,
  ReconciliationWithDetails,
  BankReconciliationSummary,
  OutstandingItem,
  BankingDashboardSummary,
  BankingAlert,
  MatchResult,
  AutoMatchSummary,
} from '../types/banking';

// ============================================================================
// Bank Account Queries
// ============================================================================

export async function getBankAccounts(tenantId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.tenantId, tenantId))
    .orderBy(asc(bankAccounts.accountName));
}

export async function getBankAccountById(tenantId: string, accountId: string) {
  const results = await db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.id, accountId)
      )
    )
    .limit(1);
  return results[0] || null;
}

export async function getActiveBankAccounts(tenantId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.status, 'active')
      )
    )
    .orderBy(asc(bankAccounts.accountName));
}

export async function getBankAccountSummaries(tenantId: string): Promise<BankAccountSummary[]> {
  const accounts = await db
    .select({
      id: bankAccounts.id,
      accountName: bankAccounts.accountName,
      accountType: bankAccounts.accountType,
      bankName: bankAccounts.bankName,
      currentBalance: bankAccounts.currentBalance,
      lastReconciledBalance: bankAccounts.lastReconciledBalance,
      lastReconciledDate: bankAccounts.lastReconciledDate,
      status: bankAccounts.status,
    })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.status, 'active')
      )
    )
    .orderBy(asc(bankAccounts.accountName));

  // Get unreconciled counts for each account
  const unreconciledCounts = await db
    .select({
      bankAccountId: bankTransactions.bankAccountId,
      count: sql<number>`count(*)::int`,
    })
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.tenantId, tenantId),
        eq(bankTransactions.isReconciled, false)
      )
    )
    .groupBy(bankTransactions.bankAccountId);

  const countMap = new Map(unreconciledCounts.map(c => [c.bankAccountId, c.count]));

  return accounts.map(account => ({
    ...account,
    unreconciledCount: countMap.get(account.id) || 0,
  }));
}

export async function createBankAccount(data: NewBankAccount) {
  const results = await db.insert(bankAccounts).values({
    ...data,
    currentBalance: data.openingBalance,
    accountNumberMasked: data.accountNumber 
      ? `****${data.accountNumber.slice(-4)}` 
      : null,
  }).returning();
  return results[0];
}

export async function updateBankAccount(
  tenantId: string,
  accountId: string,
  data: Partial<NewBankAccount>
) {
  const results = await db
    .update(bankAccounts)
    .set({
      ...data,
      updatedAt: new Date(),
      accountNumberMasked: data.accountNumber 
        ? `****${data.accountNumber.slice(-4)}` 
        : undefined,
    })
    .where(
      and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.id, accountId)
      )
    )
    .returning();
  return results[0];
}

export async function updateBankAccountBalance(
  tenantId: string,
  accountId: string,
  newBalance: string
) {
  const results = await db
    .update(bankAccounts)
    .set({
      currentBalance: newBalance,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankAccounts.tenantId, tenantId),
        eq(bankAccounts.id, accountId)
      )
    )
    .returning();
  return results[0];
}

// ============================================================================
// Bank Transaction Queries
// ============================================================================

export async function getBankTransactions(
  tenantId: string,
  accountId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    reconciled?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const conditions = [
    eq(bankTransactions.tenantId, tenantId),
    eq(bankTransactions.bankAccountId, accountId),
  ];

  if (options?.startDate) {
    conditions.push(gte(bankTransactions.transactionDate, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(bankTransactions.transactionDate, options.endDate));
  }
  if (options?.reconciled !== undefined) {
    conditions.push(eq(bankTransactions.isReconciled, options.reconciled));
  }

  let query = db
    .select()
    .from(bankTransactions)
    .where(and(...conditions))
    .orderBy(desc(bankTransactions.transactionDate), desc(bankTransactions.createdAt));

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return query;
}

export async function getAccountRegister(
  tenantId: string,
  accountId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<AccountRegisterEntry[]> {
  const conditions = [
    eq(bankTransactions.tenantId, tenantId),
    eq(bankTransactions.bankAccountId, accountId),
  ];

  if (options?.startDate) {
    conditions.push(gte(bankTransactions.transactionDate, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(bankTransactions.transactionDate, options.endDate));
  }

  const baseQuery = db
    .select({
      id: bankTransactions.id,
      transactionDate: bankTransactions.transactionDate,
      transactionType: bankTransactions.transactionType,
      referenceNumber: bankTransactions.referenceNumber,
      checkNumber: bankTransactions.checkNumber,
      description: bankTransactions.description,
      payeeName: bankTransactions.payeeName,
      amount: bankTransactions.amount,
      runningBalance: bankTransactions.runningBalance,
      isReconciled: bankTransactions.isReconciled,
      source: bankTransactions.source,
    })
    .from(bankTransactions)
    .where(and(...conditions))
    .orderBy(desc(bankTransactions.transactionDate), desc(bankTransactions.createdAt));

  if (options?.limit) {
    return baseQuery.limit(options.limit);
  }

  return baseQuery;
}

export async function getUnreconciledTransactions(
  tenantId: string,
  accountId: string,
  beforeDate?: string
) {
  const conditions = [
    eq(bankTransactions.tenantId, tenantId),
    eq(bankTransactions.bankAccountId, accountId),
    eq(bankTransactions.isReconciled, false),
  ];

  if (beforeDate) {
    conditions.push(lte(bankTransactions.transactionDate, beforeDate));
  }

  return db
    .select()
    .from(bankTransactions)
    .where(and(...conditions))
    .orderBy(asc(bankTransactions.transactionDate));
}

export async function getBankTransactionById(tenantId: string, transactionId: string) {
  const results = await db
    .select()
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.tenantId, tenantId),
        eq(bankTransactions.id, transactionId)
      )
    )
    .limit(1);
  return results[0] || null;
}

export async function createBankTransaction(data: NewBankTransaction) {
  // Get current balance to calculate running balance
  const account = await db
    .select({ currentBalance: bankAccounts.currentBalance })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, data.bankAccountId))
    .limit(1);

  const currentBalance = parseFloat(account[0]?.currentBalance || '0');
  const amount = parseFloat(data.amount as string);
  const newBalance = currentBalance + amount;

  const results = await db.insert(bankTransactions).values({
    ...data,
    runningBalance: newBalance.toFixed(2),
  }).returning();

  // Update account balance
  await db
    .update(bankAccounts)
    .set({
      currentBalance: newBalance.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.id, data.bankAccountId));

  return results[0];
}

export async function updateBankTransaction(
  tenantId: string,
  transactionId: string,
  data: Partial<NewBankTransaction>
) {
  const results = await db
    .update(bankTransactions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankTransactions.tenantId, tenantId),
        eq(bankTransactions.id, transactionId)
      )
    )
    .returning();
  return results[0];
}

export async function markTransactionReconciled(
  tenantId: string,
  transactionId: string,
  reconciliationId: string,
  userId: string
) {
  const results = await db
    .update(bankTransactions)
    .set({
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy: userId,
      reconciliationId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankTransactions.tenantId, tenantId),
        eq(bankTransactions.id, transactionId)
      )
    )
    .returning();
  return results[0];
}

export async function markTransactionsReconciled(
  tenantId: string,
  transactionIds: string[],
  reconciliationId: string,
  userId: string
) {
  return db
    .update(bankTransactions)
    .set({
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy: userId,
      reconciliationId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankTransactions.tenantId, tenantId),
        inArray(bankTransactions.id, transactionIds)
      )
    )
    .returning();
}

// ============================================================================
// Statement Import Queries
// ============================================================================

export async function createImportBatch(data: NewImportedStatement) {
  const results = await db.insert(importedStatements).values(data).returning();
  return results[0];
}

export async function getImportBatches(tenantId: string, accountId?: string) {
  const conditions = [eq(importedStatements.tenantId, tenantId)];
  
  if (accountId) {
    conditions.push(eq(importedStatements.bankAccountId, accountId));
  }

  return db
    .select()
    .from(importedStatements)
    .where(and(...conditions))
    .orderBy(desc(importedStatements.importedAt));
}

export async function getImportBatchById(tenantId: string, batchId: string) {
  const results = await db
    .select()
    .from(importedStatements)
    .where(
      and(
        eq(importedStatements.tenantId, tenantId),
        eq(importedStatements.id, batchId)
      )
    )
    .limit(1);
  return results[0] || null;
}

export async function updateImportBatch(
  tenantId: string,
  batchId: string,
  data: Partial<NewImportedStatement>
) {
  const results = await db
    .update(importedStatements)
    .set(data)
    .where(
      and(
        eq(importedStatements.tenantId, tenantId),
        eq(importedStatements.id, batchId)
      )
    )
    .returning();
  return results[0];
}

export async function createImportedTransactions(data: NewImportedTransaction[]) {
  return db.insert(importedTransactions).values(data).returning();
}

export async function getImportedTransactions(
  tenantId: string,
  batchId: string,
  status?: string
) {
  const conditions = [
    eq(importedTransactions.tenantId, tenantId),
    eq(importedTransactions.importBatchId, batchId),
  ];

  if (status) {
    conditions.push(eq(importedTransactions.status, status as any));
  }

  return db
    .select()
    .from(importedTransactions)
    .where(and(...conditions))
    .orderBy(asc(importedTransactions.transactionDate));
}

export async function getPendingImportedTransactions(tenantId: string) {
  return db
    .select()
    .from(importedTransactions)
    .where(
      and(
        eq(importedTransactions.tenantId, tenantId),
        eq(importedTransactions.status, 'pending')
      )
    )
    .orderBy(desc(importedTransactions.createdAt));
}

export async function updateImportedTransaction(
  tenantId: string,
  transactionId: string,
  data: Partial<NewImportedTransaction>
) {
  const results = await db
    .update(importedTransactions)
    .set(data)
    .where(
      and(
        eq(importedTransactions.tenantId, tenantId),
        eq(importedTransactions.id, transactionId)
      )
    )
    .returning();
  return results[0];
}

// ============================================================================
// Auto-Matching Functions
// ============================================================================

export async function findMatchesForImportedTransaction(
  tenantId: string,
  accountId: string,
  importedTx: {
    transactionDate: string;
    amount: string;
    description?: string | null;
    referenceNumber?: string | null;
    checkNumber?: string | null;
  },
  dateRangeDays: number = 5
): Promise<MatchResult[]> {
  const amount = parseFloat(importedTx.amount);
  const txDate = new Date(importedTx.transactionDate);
  const startDate = new Date(txDate);
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const endDate = new Date(txDate);
  endDate.setDate(endDate.getDate() + dateRangeDays);

  // Find unreconciled transactions in date range with matching amount
  const candidates = await db
    .select()
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.tenantId, tenantId),
        eq(bankTransactions.bankAccountId, accountId),
        eq(bankTransactions.isReconciled, false),
        gte(bankTransactions.transactionDate, startDate.toISOString().split('T')[0]),
        lte(bankTransactions.transactionDate, endDate.toISOString().split('T')[0])
      )
    );

  const matches: MatchResult[] = [];

  for (const candidate of candidates) {
    const candidateAmount = parseFloat(candidate.amount);
    const matchReasons: string[] = [];
    let score = 0;

    // Exact amount match
    if (Math.abs(candidateAmount - amount) < 0.01) {
      matchReasons.push('Exact amount match');
      score += 40;

      // Same date
      if (candidate.transactionDate === importedTx.transactionDate) {
        matchReasons.push('Same date');
        score += 30;
      } else {
        // Within date range
        const daysDiff = Math.abs(
          (new Date(candidate.transactionDate).getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 2) {
          matchReasons.push('Date within 2 days');
          score += 20;
        } else {
          matchReasons.push('Date within range');
          score += 10;
        }
      }

      // Reference number match
      if (importedTx.referenceNumber && candidate.referenceNumber &&
          importedTx.referenceNumber === candidate.referenceNumber) {
        matchReasons.push('Reference number match');
        score += 20;
      }

      // Check number match
      if (importedTx.checkNumber && candidate.checkNumber &&
          importedTx.checkNumber === candidate.checkNumber) {
        matchReasons.push('Check number match');
        score += 20;
      }

      // Description similarity (basic)
      if (importedTx.description && candidate.description) {
        const descLower = importedTx.description.toLowerCase();
        const candDescLower = candidate.description.toLowerCase();
        if (descLower.includes(candDescLower) || candDescLower.includes(descLower)) {
          matchReasons.push('Description match');
          score += 10;
        }
      }

      let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
      if (score >= 70) confidence = 'high';
      else if (score >= 50) confidence = 'medium';
      else if (score >= 30) confidence = 'low';

      if (score > 0) {
        matches.push({
          importedTransactionId: '', // Will be set by caller
          matchedTransactionId: candidate.id,
          confidence,
          score,
          matchReasons,
        });
      }
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

export async function runAutoMatch(
  tenantId: string,
  batchId: string
): Promise<AutoMatchSummary> {
  const imported = await getImportedTransactions(tenantId, batchId, 'pending');
  const batch = await getImportBatchById(tenantId, batchId);
  
  if (!batch) throw new Error('Import batch not found');

  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  let noMatch = 0;

  for (const tx of imported) {
    const matches = await findMatchesForImportedTransaction(
      tenantId,
      batch.bankAccountId,
      tx
    );

    if (matches.length > 0) {
      const bestMatch = matches[0];
      
      await updateImportedTransaction(tenantId, tx.id, {
        matchedTransactionId: bestMatch.matchedTransactionId,
        matchConfidence: bestMatch.confidence,
        matchScore: bestMatch.score,
        matchDetails: { matches: matches.slice(0, 5) } as any,
      });

      if (bestMatch.confidence === 'high') highConfidence++;
      else if (bestMatch.confidence === 'medium') mediumConfidence++;
      else lowConfidence++;
    } else {
      await updateImportedTransaction(tenantId, tx.id, {
        matchConfidence: 'none',
        matchScore: 0,
      });
      noMatch++;
    }
  }

  return {
    totalImported: imported.length,
    highConfidenceMatches: highConfidence,
    mediumConfidenceMatches: mediumConfidence,
    lowConfidenceMatches: lowConfidence,
    noMatches: noMatch,
  };
}

// ============================================================================
// Reconciliation Queries
// ============================================================================

export async function getReconciliations(tenantId: string, accountId?: string) {
  const conditions = [eq(bankReconciliations.tenantId, tenantId)];
  
  if (accountId) {
    conditions.push(eq(bankReconciliations.bankAccountId, accountId));
  }

  return db
    .select()
    .from(bankReconciliations)
    .where(and(...conditions))
    .orderBy(desc(bankReconciliations.statementDate));
}

export async function getReconciliationById(tenantId: string, reconciliationId: string) {
  const results = await db
    .select()
    .from(bankReconciliations)
    .where(
      and(
        eq(bankReconciliations.tenantId, tenantId),
        eq(bankReconciliations.id, reconciliationId)
      )
    )
    .limit(1);
  return results[0] || null;
}

export async function getInProgressReconciliation(tenantId: string, accountId: string) {
  const results = await db
    .select()
    .from(bankReconciliations)
    .where(
      and(
        eq(bankReconciliations.tenantId, tenantId),
        eq(bankReconciliations.bankAccountId, accountId),
        eq(bankReconciliations.status, 'in_progress')
      )
    )
    .limit(1);
  return results[0] || null;
}

export async function createReconciliation(data: NewBankReconciliation) {
  const results = await db.insert(bankReconciliations).values(data).returning();
  return results[0];
}

export async function updateReconciliation(
  tenantId: string,
  reconciliationId: string,
  data: Partial<NewBankReconciliation>
) {
  const results = await db
    .update(bankReconciliations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankReconciliations.tenantId, tenantId),
        eq(bankReconciliations.id, reconciliationId)
      )
    )
    .returning();
  return results[0];
}

export async function completeReconciliation(
  tenantId: string,
  reconciliationId: string,
  userId: string
) {
  const reconciliation = await getReconciliationById(tenantId, reconciliationId);
  if (!reconciliation) throw new Error('Reconciliation not found');

  // Update reconciliation status
  const updated = await db
    .update(bankReconciliations)
    .set({
      status: 'completed',
      completedAt: new Date(),
      completedBy: userId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankReconciliations.tenantId, tenantId),
        eq(bankReconciliations.id, reconciliationId)
      )
    )
    .returning();

  // Update bank account's last reconciled info
  await db
    .update(bankAccounts)
    .set({
      lastReconciledBalance: reconciliation.clearedBalance,
      lastReconciledDate: reconciliation.statementDate,
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.id, reconciliation.bankAccountId));

  return updated[0];
}

export async function addReconciliationItem(data: NewReconciliationItem) {
  const results = await db.insert(reconciliationItems).values(data).returning();
  return results[0];
}

export async function getReconciliationItems(reconciliationId: string) {
  return db
    .select({
      item: reconciliationItems,
      transaction: bankTransactions,
    })
    .from(reconciliationItems)
    .innerJoin(bankTransactions, eq(reconciliationItems.bankTransactionId, bankTransactions.id))
    .where(eq(reconciliationItems.reconciliationId, reconciliationId));
}

export async function updateReconciliationItem(
  itemId: string,
  isCleared: boolean
) {
  const results = await db
    .update(reconciliationItems)
    .set({
      isCleared,
      clearedAt: isCleared ? new Date() : null,
    })
    .where(eq(reconciliationItems.id, itemId))
    .returning();
  return results[0];
}

export async function calculateReconciliationTotals(
  tenantId: string,
  reconciliationId: string
): Promise<BankReconciliationSummary> {
  const reconciliation = await getReconciliationById(tenantId, reconciliationId);
  if (!reconciliation) throw new Error('Reconciliation not found');

  const items = await getReconciliationItems(reconciliationId);
  
  let clearedDeposits = 0;
  let clearedWithdrawals = 0;
  
  for (const { item, transaction } of items) {
    if (item.isCleared) {
      const amount = parseFloat(transaction.amount);
      if (amount > 0) {
        clearedDeposits += amount;
      } else {
        clearedWithdrawals += Math.abs(amount);
      }
    }
  }

  const beginningBalance = parseFloat(reconciliation.beginningBalance);
  const clearedBalance = beginningBalance + clearedDeposits - clearedWithdrawals;
  const statementEndingBalance = parseFloat(reconciliation.statementEndingBalance);
  const difference = statementEndingBalance - clearedBalance;

  // Calculate outstanding items
  const unreconciledTxs = await getUnreconciledTransactions(
    tenantId,
    reconciliation.bankAccountId,
    reconciliation.statementDate
  );

  let outstandingDeposits = 0;
  let outstandingWithdrawals = 0;
  
  for (const tx of unreconciledTxs) {
    const amount = parseFloat(tx.amount);
    if (amount > 0) {
      outstandingDeposits += amount;
    } else {
      outstandingWithdrawals += Math.abs(amount);
    }
  }

  return {
    beginningBalance,
    clearedDeposits,
    clearedWithdrawals,
    clearedBalance,
    statementEndingBalance,
    difference,
    outstandingDeposits,
    outstandingWithdrawals,
  };
}

// ============================================================================
// Outstanding Items Queries
// ============================================================================

export async function getOutstandingChecks(
  tenantId: string,
  accountId: string,
  asOfDate?: string
): Promise<OutstandingItem[]> {
  const conditions = [
    eq(bankTransactions.tenantId, tenantId),
    eq(bankTransactions.bankAccountId, accountId),
    eq(bankTransactions.isReconciled, false),
    or(
      eq(bankTransactions.transactionType, 'check'),
      eq(bankTransactions.transactionType, 'withdrawal'),
      eq(bankTransactions.transactionType, 'payment')
    ),
  ];

  if (asOfDate) {
    conditions.push(lte(bankTransactions.transactionDate, asOfDate));
  }

  const transactions = await db
    .select()
    .from(bankTransactions)
    .where(and(...conditions))
    .orderBy(asc(bankTransactions.transactionDate));

  const today = new Date();
  return transactions.map(tx => ({
    id: tx.id,
    transactionDate: tx.transactionDate,
    transactionType: tx.transactionType,
    referenceNumber: tx.referenceNumber,
    checkNumber: tx.checkNumber,
    description: tx.description,
    payeeName: tx.payeeName,
    amount: tx.amount,
    daysOutstanding: Math.floor(
      (today.getTime() - new Date(tx.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

export async function getDepositsInTransit(
  tenantId: string,
  accountId: string,
  asOfDate?: string
): Promise<OutstandingItem[]> {
  const conditions = [
    eq(bankTransactions.tenantId, tenantId),
    eq(bankTransactions.bankAccountId, accountId),
    eq(bankTransactions.isReconciled, false),
    or(
      eq(bankTransactions.transactionType, 'deposit'),
      eq(bankTransactions.transactionType, 'receipt'),
      eq(bankTransactions.transactionType, 'transfer_in')
    ),
  ];

  if (asOfDate) {
    conditions.push(lte(bankTransactions.transactionDate, asOfDate));
  }

  const transactions = await db
    .select()
    .from(bankTransactions)
    .where(and(...conditions))
    .orderBy(asc(bankTransactions.transactionDate));

  const today = new Date();
  return transactions.map(tx => ({
    id: tx.id,
    transactionDate: tx.transactionDate,
    transactionType: tx.transactionType,
    referenceNumber: tx.referenceNumber,
    checkNumber: tx.checkNumber,
    description: tx.description,
    payeeName: tx.payeeName,
    amount: tx.amount,
    daysOutstanding: Math.floor(
      (today.getTime() - new Date(tx.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

// ============================================================================
// Dashboard Queries
// ============================================================================

export async function getBankingDashboardSummary(tenantId: string): Promise<BankingDashboardSummary> {
  const accounts = await getBankAccountSummaries(tenantId);
  
  // Calculate totals
  let totalCashBalance = 0;
  let reconciledBalance = 0;
  let unreconciledItems = 0;
  
  for (const account of accounts) {
    totalCashBalance += parseFloat(account.currentBalance);
    if (account.lastReconciledBalance) {
      reconciledBalance += parseFloat(account.lastReconciledBalance);
    }
    unreconciledItems += account.unreconciledCount;
  }

  // Get pending imports count
  const pendingImports = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(importedTransactions)
    .where(
      and(
        eq(importedTransactions.tenantId, tenantId),
        eq(importedTransactions.status, 'pending')
      )
    );

  // Get recent transactions
  const recentTransactions = await db
    .select()
    .from(bankTransactions)
    .where(eq(bankTransactions.tenantId, tenantId))
    .orderBy(desc(bankTransactions.createdAt))
    .limit(10);

  // Build alerts
  const alerts: BankingAlert[] = [];
  
  if (unreconciledItems > 0) {
    alerts.push({
      type: 'unreconciled',
      severity: unreconciledItems > 50 ? 'warning' : 'info',
      message: `${unreconciledItems} unreconciled transactions`,
      count: unreconciledItems,
    });
  }

  if (pendingImports[0]?.count > 0) {
    alerts.push({
      type: 'pending_import',
      severity: 'info',
      message: `${pendingImports[0].count} imported transactions pending review`,
      count: pendingImports[0].count,
    });
  }

  // Check for accounts not reconciled in 30+ days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const account of accounts) {
    if (account.lastReconciledDate) {
      const lastReconciled = new Date(account.lastReconciledDate);
      if (lastReconciled < thirtyDaysAgo) {
        alerts.push({
          type: 'overdue_reconciliation',
          severity: 'warning',
          message: `${account.accountName} not reconciled in over 30 days`,
          accountId: account.id,
          accountName: account.accountName,
        });
      }
    }
  }

  return {
    totalCashBalance,
    reconciledBalance,
    unreconciledItems,
    pendingImports: pendingImports[0]?.count || 0,
    accountSummaries: accounts,
    recentTransactions,
    alerts,
  };
}

// ============================================================================
// Matching Rules Queries
// ============================================================================

export async function getMatchingRules(tenantId: string) {
  return db
    .select()
    .from(matchingRules)
    .where(
      and(
        eq(matchingRules.tenantId, tenantId),
        eq(matchingRules.isActive, true)
      )
    )
    .orderBy(desc(matchingRules.timesUsed));
}

export async function createMatchingRule(data: NewMatchingRule) {
  const results = await db.insert(matchingRules).values(data).returning();
  return results[0];
}

export async function incrementMatchingRuleUsage(ruleId: string) {
  return db
    .update(matchingRules)
    .set({
      timesUsed: sql`${matchingRules.timesUsed} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(matchingRules.id, ruleId));
}

// ============================================================================
// Transfer Functions
// ============================================================================

export async function createTransfer(
  tenantId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  transactionDate: string,
  description: string,
  userId: string
) {
  // Create withdrawal from source account
  const withdrawal = await createBankTransaction({
    tenantId,
    bankAccountId: fromAccountId,
    transactionDate,
    transactionType: 'transfer_out',
    amount: (-amount).toFixed(2),
    description: description || 'Transfer Out',
    source: 'manual',
    createdBy: userId,
  });

  // Create deposit to destination account
  const deposit = await createBankTransaction({
    tenantId,
    bankAccountId: toAccountId,
    transactionDate,
    transactionType: 'transfer_in',
    amount: amount.toFixed(2),
    description: description || 'Transfer In',
    source: 'manual',
    createdBy: userId,
  });

  return { withdrawal, deposit };
}
