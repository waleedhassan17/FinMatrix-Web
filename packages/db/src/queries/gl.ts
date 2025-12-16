// General Ledger Database Queries
// CRUD operations and queries for Chart of Accounts, Journal Entries, Reports

import { eq, and, desc, asc, sql, gte, lte, isNull, or, like } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  chartOfAccounts,
  journalEntries,
  transactionLines,
  fiscalPeriods,
  departments,
  ChartOfAccount,
  JournalEntry,
  FiscalPeriod,
  Department,
  AccountType,
  JournalEntryStatus,
} from '../schema/gl';
import type {
  AccountTreeNode,
  AccountOption,
  JournalEntryWithLines,
  JournalEntryInput,
  AccountInput,
  TrialBalanceReport,
  TrialBalanceRow,
  GLAccountDetail,
  GLDetailRow,
} from '../types/gl';

// Helper to format Date to YYYY-MM-DD string for date columns
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// Chart of Accounts Queries
// ============================================================================

/**
 * Get all accounts for a tenant
 */
export async function getAccounts(
  db: NodePgDatabase<any>,
  tenantId: string,
  options?: {
    includeInactive?: boolean;
    type?: AccountType;
    parentId?: string | null;
  }
): Promise<ChartOfAccount[]> {
  const conditions = [eq(chartOfAccounts.tenantId, tenantId)];

  if (!options?.includeInactive) {
    conditions.push(eq(chartOfAccounts.isActive, true));
  }

  if (options?.type) {
    conditions.push(eq(chartOfAccounts.type, options.type));
  }

  if (options?.parentId !== undefined) {
    if (options.parentId === null) {
      conditions.push(isNull(chartOfAccounts.parentId));
    } else {
      conditions.push(eq(chartOfAccounts.parentId, options.parentId));
    }
  }

  const accounts = await db
    .select()
    .from(chartOfAccounts)
    .where(and(...conditions))
    .orderBy(asc(chartOfAccounts.accountNumber));

  return accounts;
}

/**
 * Get a single account by ID
 */
export async function getAccountById(
  db: NodePgDatabase<any>,
  tenantId: string,
  accountId: string
): Promise<ChartOfAccount | null> {
  const [account] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.id, accountId)))
    .limit(1);

  return account || null;
}

/**
 * Get account by account number
 */
export async function getAccountByNumber(
  db: NodePgDatabase<any>,
  tenantId: string,
  accountNumber: string
): Promise<ChartOfAccount | null> {
  const [account] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.accountNumber, accountNumber)))
    .limit(1);

  return account || null;
}

/**
 * Build account tree from flat list
 */
export function buildAccountTree(accounts: ChartOfAccount[]): AccountTreeNode[] {
  const accountMap = new Map<string, AccountTreeNode>();
  const rootNodes: AccountTreeNode[] = [];

  // First pass: create all nodes
  for (const account of accounts) {
    accountMap.set(account.id, {
      ...account,
      children: [],
      depth: 0,
      hasChildren: false,
    });
  }

  // Second pass: build tree
  for (const account of accounts) {
    const node = accountMap.get(account.id)!;

    if (account.parentId && accountMap.has(account.parentId)) {
      const parent = accountMap.get(account.parentId)!;
      parent.children.push(node);
      parent.hasChildren = true;
      node.depth = parent.depth + 1;
    } else {
      rootNodes.push(node);
    }
  }

  // Sort children by account number
  const sortChildren = (nodes: AccountTreeNode[]) => {
    nodes.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    }
  };

  sortChildren(rootNodes);
  return rootNodes;
}

/**
 * Convert accounts to dropdown options
 */
export function accountsToOptions(accounts: ChartOfAccount[]): AccountOption[] {
  const tree = buildAccountTree(accounts);
  const options: AccountOption[] = [];

  const flatten = (nodes: AccountTreeNode[], level: number = 0) => {
    for (const node of nodes) {
      options.push({
        id: node.id,
        accountNumber: node.accountNumber,
        name: node.name,
        fullName: `${node.accountNumber} - ${node.name}`,
        type: node.type,
        normalBalance: node.normalBalance,
        isActive: node.isActive,
        level,
        currentBalance: Number(node.currentBalance),
      });
      if (node.children.length > 0) {
        flatten(node.children, level + 1);
      }
    }
  };

  flatten(tree);
  return options;
}

/**
 * Create a new account
 */
export async function createAccount(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: AccountInput,
  createdBy: string
): Promise<ChartOfAccount> {
  // Build the path
  let path = input.accountNumber;
  let level = 1;

  if (input.parentId) {
    const parent = await getAccountById(db, tenantId, input.parentId);
    if (parent) {
      path = `${parent.path}.${input.accountNumber}`;
      level = parent.level + 1;
    }
  }

  const [account] = await db
    .insert(chartOfAccounts)
    .values({
      tenantId,
      accountNumber: input.accountNumber,
      name: input.name,
      description: input.description,
      type: input.type,
      subType: input.subType,
      normalBalance: input.normalBalance,
      parentId: input.parentId,
      path,
      level,
      isActive: input.isActive ?? true,
      isBankAccount: input.isBankAccount ?? false,
      bankAccountNumber: input.bankAccountNumber,
      createdBy,
    })
    .returning();

  return account;
}

/**
 * Update an existing account
 */
export async function updateAccount(
  db: NodePgDatabase<any>,
  tenantId: string,
  accountId: string,
  input: Partial<AccountInput>
): Promise<ChartOfAccount | null> {
  const [account] = await db
    .update(chartOfAccounts)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.id, accountId)))
    .returning();

  return account || null;
}

/**
 * Soft delete an account (set inactive)
 */
export async function deactivateAccount(
  db: NodePgDatabase<any>,
  tenantId: string,
  accountId: string
): Promise<boolean> {
  // Check if account has transactions - join with journal entries to get tenantId
  const [lineCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionLines)
    .innerJoin(journalEntries, eq(transactionLines.journalEntryId, journalEntries.id))
    .where(and(
      eq(journalEntries.tenantId, tenantId),
      eq(transactionLines.accountId, accountId)
    ));

  if (Number(lineCount?.count || 0) > 0) {
    // Has transactions, just deactivate
    await db
      .update(chartOfAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.id, accountId)));
    return true;
  }

  // No transactions, can delete
  await db
    .delete(chartOfAccounts)
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.id, accountId)));

  return true;
}

/**
 * Update account balance (called when posting journal entries)
 */
export async function updateAccountBalance(
  db: NodePgDatabase<any>,
  tenantId: string,
  accountId: string,
  debitChange: number,
  creditChange: number
): Promise<void> {
  const account = await getAccountById(db, tenantId, accountId);
  if (!account) return;

  // Calculate new balance based on normal balance
  let newBalance: number;
  if (account.normalBalance === 'debit') {
    newBalance = Number(account.currentBalance) + debitChange - creditChange;
  } else {
    newBalance = Number(account.currentBalance) + creditChange - debitChange;
  }

  await db
    .update(chartOfAccounts)
    .set({
      currentBalance: newBalance.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.id, accountId)));
}

// ============================================================================
// Journal Entry Queries
// ============================================================================

/**
 * Generate next journal entry number
 */
export async function generateEntryNumber(
  db: NodePgDatabase<any>,
  tenantId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GL-${year}-`;

  const [lastEntry] = await db
    .select({ entryNumber: journalEntries.entryNumber })
    .from(journalEntries)
    .where(and(eq(journalEntries.tenantId, tenantId), like(journalEntries.entryNumber, `${prefix}%`)))
    .orderBy(desc(journalEntries.entryNumber))
    .limit(1);

  if (!lastEntry) {
    return `${prefix}00001`;
  }

  const lastNum = parseInt(lastEntry.entryNumber.replace(prefix, ''), 10);
  const nextNum = (lastNum + 1).toString().padStart(5, '0');
  return `${prefix}${nextNum}`;
}

/**
 * Get journal entries with optional filters
 */
export async function getJournalEntries(
  db: NodePgDatabase<any>,
  tenantId: string,
  options?: {
    status?: JournalEntryStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    searchTerm?: string;
  }
): Promise<{ entries: JournalEntry[]; total: number }> {
  const conditions = [eq(journalEntries.tenantId, tenantId)];

  if (options?.status) {
    conditions.push(eq(journalEntries.status, options.status));
  }

  if (options?.startDate) {
    conditions.push(gte(journalEntries.date, formatDateString(options.startDate)));
  }

  if (options?.endDate) {
    conditions.push(lte(journalEntries.date, formatDateString(options.endDate)));
  }

  if (options?.searchTerm) {
    conditions.push(
      or(
        like(journalEntries.entryNumber, `%${options.searchTerm}%`),
        like(journalEntries.memo, `%${options.searchTerm}%`),
        like(journalEntries.reference, `%${options.searchTerm}%`)
      )!
    );
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries)
    .where(and(...conditions));

  const entries = await db
    .select()
    .from(journalEntries)
    .where(and(...conditions))
    .orderBy(desc(journalEntries.date), desc(journalEntries.entryNumber))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return {
    entries,
    total: Number(countResult?.count || 0),
  };
}

/**
 * Get a single journal entry with lines
 */
export async function getJournalEntryWithLines(
  db: NodePgDatabase<any>,
  tenantId: string,
  entryId: string
): Promise<JournalEntryWithLines | null> {
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.id, entryId)))
    .limit(1);

  if (!entry) return null;

  const lines = await db
    .select({
      line: transactionLines,
      account: {
        id: chartOfAccounts.id,
        accountNumber: chartOfAccounts.accountNumber,
        name: chartOfAccounts.name,
        type: chartOfAccounts.type,
      },
    })
    .from(transactionLines)
    .innerJoin(chartOfAccounts, eq(transactionLines.accountId, chartOfAccounts.id))
    .where(eq(transactionLines.journalEntryId, entryId))
    .orderBy(asc(transactionLines.lineNumber));

  return {
    ...entry,
    lines: lines.map((l) => ({
      ...l.line,
      account: l.account,
    })),
  };
}

/**
 * Create a journal entry (draft)
 */
export async function createJournalEntry(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: JournalEntryInput,
  createdBy: string
): Promise<JournalEntryWithLines> {
  // Validate debits = credits
  const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
  }

  const entryNumber = await generateEntryNumber(db, tenantId);

  // Parse the date to determine fiscal year and period
  const entryDate = new Date(input.date);
  const fiscalYear = entryDate.getFullYear();
  const fiscalPeriod = entryDate.getMonth() + 1; // 1-12

  const [entry] = await db
    .insert(journalEntries)
    .values({
      tenantId,
      entryNumber,
      date: formatDateString(entryDate),
      memo: input.memo,
      reference: input.reference,
      status: 'draft',
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
      fiscalYear,
      fiscalPeriod,
      attachments: input.attachments || [],
      createdBy,
    })
    .returning();

  // Insert lines
  const lineValues = input.lines.map((line, index) => ({
    journalEntryId: entry.id,
    lineNumber: index + 1,
    accountId: line.accountId,
    debit: line.debit.toString(),
    credit: line.credit.toString(),
    memo: line.memo,
    departmentId: line.departmentId,
    projectId: line.projectId,
    reference: line.reference,
  }));

  await db.insert(transactionLines).values(lineValues);

  return getJournalEntryWithLines(db, tenantId, entry.id) as Promise<JournalEntryWithLines>;
}

/**
 * Update a draft journal entry
 */
export async function updateJournalEntry(
  db: NodePgDatabase<any>,
  tenantId: string,
  entryId: string,
  input: JournalEntryInput
): Promise<JournalEntryWithLines | null> {
  // Check entry exists and is still draft
  const [existing] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.id, entryId)))
    .limit(1);

  if (!existing) {
    throw new Error('Journal entry not found');
  }

  if (existing.status !== 'draft') {
    throw new Error('Only draft entries can be edited');
  }

  // Validate debits = credits
  const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
  }

  // Parse the date to determine fiscal year and period
  const entryDate = new Date(input.date);
  const fiscalYear = entryDate.getFullYear();
  const fiscalPeriod = entryDate.getMonth() + 1;

  // Update entry
  await db
    .update(journalEntries)
    .set({
      date: formatDateString(entryDate),
      memo: input.memo,
      reference: input.reference,
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
      fiscalYear,
      fiscalPeriod,
      attachments: input.attachments || [],
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, entryId));

  // Delete old lines and insert new
  await db.delete(transactionLines).where(eq(transactionLines.journalEntryId, entryId));

  const lineValues = input.lines.map((line, index) => ({
    journalEntryId: entryId,
    lineNumber: index + 1,
    accountId: line.accountId,
    debit: line.debit.toString(),
    credit: line.credit.toString(),
    memo: line.memo,
    departmentId: line.departmentId,
    projectId: line.projectId,
    reference: line.reference,
  }));

  await db.insert(transactionLines).values(lineValues);

  return getJournalEntryWithLines(db, tenantId, entryId);
}

/**
 * Post a journal entry (draft -> posted)
 */
export async function postJournalEntry(
  db: NodePgDatabase<any>,
  tenantId: string,
  entryId: string,
  postedBy: string
): Promise<JournalEntryWithLines> {
  const entry = await getJournalEntryWithLines(db, tenantId, entryId);

  if (!entry) {
    throw new Error('Journal entry not found');
  }

  if (entry.status !== 'draft') {
    throw new Error('Only draft entries can be posted');
  }

  // Check if fiscal period is closed
  const [period] = await db
    .select()
    .from(fiscalPeriods)
    .where(
      and(
        eq(fiscalPeriods.tenantId, tenantId),
        eq(fiscalPeriods.fiscalYear, entry.fiscalYear),
        eq(fiscalPeriods.period, entry.fiscalPeriod)
      )
    )
    .limit(1);

  if (period && period.isClosed) {
    throw new Error('Cannot post to a closed fiscal period');
  }

  // Update account balances
  for (const line of entry.lines) {
    await updateAccountBalance(
      db,
      tenantId,
      line.accountId,
      Number(line.debit),
      Number(line.credit)
    );
  }

  // Update entry status
  await db
    .update(journalEntries)
    .set({
      status: 'posted',
      postedAt: new Date(),
      postedBy,
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, entryId));

  return getJournalEntryWithLines(db, tenantId, entryId) as Promise<JournalEntryWithLines>;
}

/**
 * Void a posted journal entry
 */
export async function voidJournalEntry(
  db: NodePgDatabase<any>,
  tenantId: string,
  entryId: string,
  voidedBy: string,
  voidReason?: string
): Promise<JournalEntryWithLines> {
  const entry = await getJournalEntryWithLines(db, tenantId, entryId);

  if (!entry) {
    throw new Error('Journal entry not found');
  }

  if (entry.status !== 'posted') {
    throw new Error('Only posted entries can be voided');
  }

  // Reverse account balances
  for (const line of entry.lines) {
    await updateAccountBalance(
      db,
      tenantId,
      line.accountId,
      -Number(line.debit),
      -Number(line.credit)
    );
  }

  // Update entry status
  await db
    .update(journalEntries)
    .set({
      status: 'voided',
      voidedAt: new Date(),
      voidedBy,
      voidReason,
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, entryId));

  return getJournalEntryWithLines(db, tenantId, entryId) as Promise<JournalEntryWithLines>;
}

/**
 * Create a reversing journal entry
 */
export async function reverseJournalEntry(
  db: NodePgDatabase<any>,
  tenantId: string,
  originalEntryId: string,
  reversalDate: Date,
  createdBy: string
): Promise<JournalEntryWithLines> {
  const original = await getJournalEntryWithLines(db, tenantId, originalEntryId);

  if (!original) {
    throw new Error('Original journal entry not found');
  }

  if (original.status !== 'posted') {
    throw new Error('Only posted entries can be reversed');
  }

  // Create new entry with swapped debits and credits
  const reversedInput: JournalEntryInput = {
    date: formatDateString(reversalDate),
    memo: `Reversal of ${original.entryNumber}: ${original.memo || ''}`,
    reference: original.reference || undefined,
    lines: original.lines.map((line) => ({
      accountId: line.accountId,
      debit: Number(line.credit), // Swap
      credit: Number(line.debit), // Swap
      memo: line.memo || undefined,
      departmentId: line.departmentId || undefined,
      projectId: line.projectId || undefined,
      reference: line.reference || undefined,
    })),
  };

  const reversalEntry = await createJournalEntry(db, tenantId, reversedInput, createdBy);

  // Link the reversal
  await db
    .update(journalEntries)
    .set({ reversedBy: reversalEntry.id })
    .where(eq(journalEntries.id, originalEntryId));

  return reversalEntry;
}

// ============================================================================
// Report Queries
// ============================================================================

/**
 * Generate Trial Balance report
 */
export async function getTrialBalance(
  db: NodePgDatabase<any>,
  tenantId: string,
  asOfDate: Date
): Promise<TrialBalanceReport> {
  const accounts = await getAccounts(db, tenantId, { includeInactive: false });
  const rows: TrialBalanceRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  const asOfDateStr = formatDateString(asOfDate);

  for (const account of accounts) {
    // Get all posted transactions up to the date
    const [result] = await db
      .select({
        totalDebit: sql<string>`COALESCE(SUM(CAST(${transactionLines.debit} AS DECIMAL)), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(CAST(${transactionLines.credit} AS DECIMAL)), 0)`,
      })
      .from(transactionLines)
      .innerJoin(journalEntries, eq(transactionLines.journalEntryId, journalEntries.id))
      .where(
        and(
          eq(journalEntries.tenantId, tenantId),
          eq(transactionLines.accountId, account.id),
          eq(journalEntries.status, 'posted'),
          lte(journalEntries.date, asOfDateStr)
        )
      );

    const debit = Number(result?.totalDebit || 0);
    const credit = Number(result?.totalCredit || 0);
    let balance: number;

    if (account.normalBalance === 'debit') {
      balance = debit - credit;
    } else {
      balance = credit - debit;
    }

    if (balance !== 0) {
      const row: TrialBalanceRow = {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountName: account.name,
        accountType: account.type,
        debit: balance > 0 && account.normalBalance === 'debit' ? balance : 0,
        credit: balance > 0 && account.normalBalance === 'credit' ? balance : balance < 0 && account.normalBalance === 'debit' ? -balance : 0,
        balance,
      };

      if (row.debit === 0 && row.credit === 0) {
        row.debit = balance > 0 ? balance : 0;
        row.credit = balance < 0 ? -balance : 0;
      }

      rows.push(row);
      totalDebit += row.debit;
      totalCredit += row.credit;
    }
  }

  return {
    asOfDate: asOfDateStr,
    rows: rows.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

/**
 * Get GL detail for a single account
 */
export async function getGLAccountDetail(
  db: NodePgDatabase<any>,
  tenantId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<GLAccountDetail | null> {
  const account = await getAccountById(db, tenantId, accountId);
  if (!account) return null;

  const startDateStr = formatDateString(startDate);
  const endDateStr = formatDateString(endDate);
  
  // Calculate day before start for opening balance
  const dayBeforeStart = new Date(startDate.getTime() - 86400000);
  const dayBeforeStartStr = formatDateString(dayBeforeStart);

  // Get opening balance (all transactions before startDate)
  const [openingResult] = await db
    .select({
      totalDebit: sql<string>`COALESCE(SUM(CAST(${transactionLines.debit} AS DECIMAL)), 0)`,
      totalCredit: sql<string>`COALESCE(SUM(CAST(${transactionLines.credit} AS DECIMAL)), 0)`,
    })
    .from(transactionLines)
    .innerJoin(journalEntries, eq(transactionLines.journalEntryId, journalEntries.id))
    .where(
      and(
        eq(journalEntries.tenantId, tenantId),
        eq(transactionLines.accountId, accountId),
        eq(journalEntries.status, 'posted'),
        lte(journalEntries.date, dayBeforeStartStr)
      )
    );

  let openingBalance = 0;
  if (account.normalBalance === 'debit') {
    openingBalance = Number(openingResult?.totalDebit || 0) - Number(openingResult?.totalCredit || 0);
  } else {
    openingBalance = Number(openingResult?.totalCredit || 0) - Number(openingResult?.totalDebit || 0);
  }

  // Get transactions in the period
  const transactions = await db
    .select({
      line: transactionLines,
      entry: journalEntries,
    })
    .from(transactionLines)
    .innerJoin(journalEntries, eq(transactionLines.journalEntryId, journalEntries.id))
    .where(
      and(
        eq(journalEntries.tenantId, tenantId),
        eq(transactionLines.accountId, accountId),
        eq(journalEntries.status, 'posted'),
        gte(journalEntries.date, startDateStr),
        lte(journalEntries.date, endDateStr)
      )
    )
    .orderBy(asc(journalEntries.date), asc(journalEntries.entryNumber));

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  const rows: GLDetailRow[] = transactions.map((t) => {
    const debit = Number(t.line.debit);
    const credit = Number(t.line.credit);

    if (account.normalBalance === 'debit') {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }

    totalDebit += debit;
    totalCredit += credit;

    return {
      date: t.entry.date, // Already a string from the database
      entryNumber: t.entry.entryNumber,
      journalEntryId: t.entry.id,
      memo: t.line.memo || t.entry.memo || '',
      reference: t.entry.reference || undefined,
      debit,
      credit,
      balance: runningBalance,
      status: t.entry.status,
    };
  });

  return {
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountName: account.name,
    accountType: account.type,
    normalBalance: account.normalBalance,
    openingBalance,
    transactions: rows,
    closingBalance: runningBalance,
    totalDebit,
    totalCredit,
  };
}

// ============================================================================
// Fiscal Period Queries
// ============================================================================

/**
 * Get all fiscal periods for a tenant
 */
export async function getFiscalPeriods(
  db: NodePgDatabase<any>,
  tenantId: string
): Promise<FiscalPeriod[]> {
  return db
    .select()
    .from(fiscalPeriods)
    .where(eq(fiscalPeriods.tenantId, tenantId))
    .orderBy(desc(fiscalPeriods.startDate));
}

/**
 * Create a fiscal period
 */
export async function createFiscalPeriod(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: {
    name: string;
    startDate: Date;
    endDate: Date;
    fiscalYear: number;
    period: number;
  }
): Promise<FiscalPeriod> {
  const [fiscalPeriod] = await db
    .insert(fiscalPeriods)
    .values({
      tenantId,
      name: input.name,
      startDate: formatDateString(input.startDate),
      endDate: formatDateString(input.endDate),
      fiscalYear: input.fiscalYear,
      period: input.period,
    })
    .returning();

  return fiscalPeriod;
}

/**
 * Close a fiscal period
 */
export async function closeFiscalPeriod(
  db: NodePgDatabase<any>,
  tenantId: string,
  periodId: string,
  closedBy: string
): Promise<FiscalPeriod> {
  // Check for any draft entries in the period
  const [period] = await db
    .select()
    .from(fiscalPeriods)
    .where(and(eq(fiscalPeriods.tenantId, tenantId), eq(fiscalPeriods.id, periodId)))
    .limit(1);

  if (!period) {
    throw new Error('Fiscal period not found');
  }

  const [draftCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.tenantId, tenantId),
        eq(journalEntries.fiscalYear, period.fiscalYear),
        eq(journalEntries.fiscalPeriod, period.period),
        eq(journalEntries.status, 'draft')
      )
    );

  if (Number(draftCount?.count || 0) > 0) {
    throw new Error('Cannot close period with draft journal entries');
  }

  const [updatedPeriod] = await db
    .update(fiscalPeriods)
    .set({
      isClosed: true,
      closedAt: new Date(),
      closedBy,
    })
    .where(and(eq(fiscalPeriods.tenantId, tenantId), eq(fiscalPeriods.id, periodId)))
    .returning();

  return updatedPeriod;
}

// ============================================================================
// Department Queries
// ============================================================================

/**
 * Get all departments for a tenant
 */
export async function getDepartments(
  db: NodePgDatabase<any>,
  tenantId: string,
  includeInactive = false
): Promise<Department[]> {
  const conditions = [eq(departments.tenantId, tenantId)];

  if (!includeInactive) {
    conditions.push(eq(departments.isActive, true));
  }

  return db
    .select()
    .from(departments)
    .where(and(...conditions))
    .orderBy(asc(departments.code));
}

/**
 * Create a department
 */
export async function createDepartment(
  db: NodePgDatabase<any>,
  tenantId: string,
  input: { code: string; name: string; description?: string }
): Promise<Department> {
  const [dept] = await db
    .insert(departments)
    .values({
      tenantId,
      ...input,
    })
    .returning();

  return dept;
}

/**
 * Update a department
 */
export async function updateDepartment(
  db: NodePgDatabase<any>,
  tenantId: string,
  departmentId: string,
  input: Partial<{ code: string; name: string; description?: string; isActive: boolean }>
): Promise<Department | null> {
  const [dept] = await db
    .update(departments)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(departments.tenantId, tenantId), eq(departments.id, departmentId)))
    .returning();

  return dept || null;
}
