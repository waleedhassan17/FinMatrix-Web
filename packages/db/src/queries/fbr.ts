// FBR Compliance Queries
import { db } from '../client';
import { eq, and, desc, asc, gte, lte, sql, isNull, or } from 'drizzle-orm';
import {
  taxRates,
  taxRegistration,
  taxFilingPeriods,
  salesTaxReturns,
  salesTaxReturnLines,
  inputTaxClaims,
  inputTaxClaimLines,
  gstReconciliations,
  withholdingTaxRecords,
  fbrApiLogs,
  NewTaxRate,
  NewTaxRegistration,
  NewTaxFilingPeriod,
  NewSalesTaxReturn,
  NewInputTaxClaim,
} from '../schema/fbr';
import {
  FbrComplianceSummary,
  FilingPeriodSummary,
  SalesTaxReturnSummary,
  InputTaxClaimSummary,
  ReconciliationSummary,
  MonthlyGstTrend,
  WithholdingTaxSummary,
  ComplianceCalendarItem,
} from '../types/fbr';

// ============================================================================
// Tax Rates Queries
// ============================================================================

export async function getTaxRates(tenantId: string) {
  return db
    .select()
    .from(taxRates)
    .where(eq(taxRates.tenantId, tenantId))
    .orderBy(asc(taxRates.code));
}

export async function getActiveTaxRates(tenantId: string) {
  const today = new Date().toISOString().split('T')[0];
  return db
    .select()
    .from(taxRates)
    .where(
      and(
        eq(taxRates.tenantId, tenantId),
        eq(taxRates.isActive, true),
        lte(taxRates.effectiveFrom, today),
        or(isNull(taxRates.effectiveTo), gte(taxRates.effectiveTo, today))
      )
    )
    .orderBy(asc(taxRates.code));
}

export async function getTaxRateById(id: string, tenantId: string) {
  const result = await db
    .select()
    .from(taxRates)
    .where(and(eq(taxRates.id, id), eq(taxRates.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function createTaxRate(data: NewTaxRate) {
  const result = await db.insert(taxRates).values(data).returning();
  return result[0];
}

export async function updateTaxRate(
  id: string,
  tenantId: string,
  data: Partial<NewTaxRate>
) {
  const result = await db
    .update(taxRates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(taxRates.id, id), eq(taxRates.tenantId, tenantId)))
    .returning();
  return result[0];
}

export async function deleteTaxRate(id: string, tenantId: string) {
  return db
    .delete(taxRates)
    .where(and(eq(taxRates.id, id), eq(taxRates.tenantId, tenantId)));
}

// ============================================================================
// Tax Registration Queries
// ============================================================================

export async function getTaxRegistration(tenantId: string) {
  const result = await db
    .select()
    .from(taxRegistration)
    .where(eq(taxRegistration.tenantId, tenantId))
    .limit(1);
  return result[0] || null;
}

export async function upsertTaxRegistration(data: NewTaxRegistration) {
  const existing = await getTaxRegistration(data.tenantId);
  
  if (existing) {
    const result = await db
      .update(taxRegistration)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taxRegistration.id, existing.id))
      .returning();
    return result[0];
  } else {
    const result = await db.insert(taxRegistration).values(data).returning();
    return result[0];
  }
}

// ============================================================================
// Filing Periods Queries
// ============================================================================

export async function getFilingPeriods(tenantId: string, fiscalYear?: number) {
  let query = db
    .select()
    .from(taxFilingPeriods)
    .where(eq(taxFilingPeriods.tenantId, tenantId));

  if (fiscalYear) {
    query = db
      .select()
      .from(taxFilingPeriods)
      .where(
        and(
          eq(taxFilingPeriods.tenantId, tenantId),
          eq(taxFilingPeriods.fiscalYear, fiscalYear)
        )
      );
  }

  return query.orderBy(desc(taxFilingPeriods.startDate));
}

export async function getCurrentFilingPeriod(tenantId: string) {
  const today = new Date().toISOString().split('T')[0];
  const result = await db
    .select()
    .from(taxFilingPeriods)
    .where(
      and(
        eq(taxFilingPeriods.tenantId, tenantId),
        lte(taxFilingPeriods.startDate, today),
        gte(taxFilingPeriods.endDate, today)
      )
    )
    .limit(1);
  return result[0] || null;
}

export async function getOpenFilingPeriods(tenantId: string) {
  return db
    .select()
    .from(taxFilingPeriods)
    .where(
      and(
        eq(taxFilingPeriods.tenantId, tenantId),
        eq(taxFilingPeriods.isClosed, false)
      )
    )
    .orderBy(asc(taxFilingPeriods.startDate));
}

export async function createFilingPeriod(data: NewTaxFilingPeriod) {
  const result = await db.insert(taxFilingPeriods).values(data).returning();
  return result[0];
}

export async function closeFilingPeriod(
  id: string,
  tenantId: string,
  userId: string
) {
  const result = await db
    .update(taxFilingPeriods)
    .set({
      isClosed: true,
      closedAt: new Date(),
      closedBy: userId,
    })
    .where(and(eq(taxFilingPeriods.id, id), eq(taxFilingPeriods.tenantId, tenantId)))
    .returning();
  return result[0];
}

export async function generateMonthlyPeriods(
  tenantId: string,
  fiscalYear: number
) {
  // Pakistan fiscal year: July to June
  const periods: NewTaxFilingPeriod[] = [];
  const startMonth = 6; // July (0-indexed)

  for (let i = 0; i < 12; i++) {
    const monthIndex = (startMonth + i) % 12;
    const year = i < 6 ? fiscalYear : fiscalYear + 1;
    
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    const dueDate = new Date(year, monthIndex + 1, 15); // 15th of next month

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    periods.push({
      tenantId,
      periodType: 'monthly',
      periodName: `${monthNames[monthIndex]} ${year}`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      fiscalYear,
      periodNumber: i + 1,
    });
  }

  const result = await db.insert(taxFilingPeriods).values(periods).returning();
  return result;
}

// ============================================================================
// Sales Tax Return (Form A) Queries
// ============================================================================

export async function getSalesTaxReturns(tenantId: string, periodId?: string) {
  if (periodId) {
    return db
      .select()
      .from(salesTaxReturns)
      .where(
        and(
          eq(salesTaxReturns.tenantId, tenantId),
          eq(salesTaxReturns.periodId, periodId)
        )
      )
      .orderBy(desc(salesTaxReturns.createdAt));
  }

  return db
    .select()
    .from(salesTaxReturns)
    .where(eq(salesTaxReturns.tenantId, tenantId))
    .orderBy(desc(salesTaxReturns.createdAt));
}

export async function getSalesTaxReturnById(id: string, tenantId: string) {
  const result = await db
    .select()
    .from(salesTaxReturns)
    .where(and(eq(salesTaxReturns.id, id), eq(salesTaxReturns.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getSalesTaxReturnWithLines(id: string, tenantId: string) {
  const returnData = await getSalesTaxReturnById(id, tenantId);
  if (!returnData) return null;

  const lines = await db
    .select()
    .from(salesTaxReturnLines)
    .where(eq(salesTaxReturnLines.returnId, id));

  return { ...returnData, lines };
}

export async function createSalesTaxReturn(data: NewSalesTaxReturn) {
  const result = await db.insert(salesTaxReturns).values(data).returning();
  return result[0];
}

export async function updateSalesTaxReturn(
  id: string,
  tenantId: string,
  data: Partial<NewSalesTaxReturn>
) {
  const result = await db
    .update(salesTaxReturns)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(salesTaxReturns.id, id), eq(salesTaxReturns.tenantId, tenantId)))
    .returning();
  return result[0];
}

export async function generateReturnNumber(tenantId: string, prefix: string = 'STR') {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(salesTaxReturns)
    .where(eq(salesTaxReturns.tenantId, tenantId));
  
  const count = result[0]?.count || 0;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
}

// ============================================================================
// Input Tax Claim (Form B) Queries
// ============================================================================

export async function getInputTaxClaims(tenantId: string, periodId?: string) {
  if (periodId) {
    return db
      .select()
      .from(inputTaxClaims)
      .where(
        and(
          eq(inputTaxClaims.tenantId, tenantId),
          eq(inputTaxClaims.periodId, periodId)
        )
      )
      .orderBy(desc(inputTaxClaims.createdAt));
  }

  return db
    .select()
    .from(inputTaxClaims)
    .where(eq(inputTaxClaims.tenantId, tenantId))
    .orderBy(desc(inputTaxClaims.createdAt));
}

export async function getInputTaxClaimById(id: string, tenantId: string) {
  const result = await db
    .select()
    .from(inputTaxClaims)
    .where(and(eq(inputTaxClaims.id, id), eq(inputTaxClaims.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getInputTaxClaimWithLines(id: string, tenantId: string) {
  const claimData = await getInputTaxClaimById(id, tenantId);
  if (!claimData) return null;

  const lines = await db
    .select()
    .from(inputTaxClaimLines)
    .where(eq(inputTaxClaimLines.claimId, id));

  return { ...claimData, lines };
}

export async function createInputTaxClaim(data: NewInputTaxClaim) {
  const result = await db.insert(inputTaxClaims).values(data).returning();
  return result[0];
}

export async function updateInputTaxClaim(
  id: string,
  tenantId: string,
  data: Partial<NewInputTaxClaim>
) {
  const result = await db
    .update(inputTaxClaims)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(inputTaxClaims.id, id), eq(inputTaxClaims.tenantId, tenantId)))
    .returning();
  return result[0];
}

export async function generateClaimNumber(tenantId: string, prefix: string = 'ITC') {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(inputTaxClaims)
    .where(eq(inputTaxClaims.tenantId, tenantId));
  
  const count = result[0]?.count || 0;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
}

// ============================================================================
// GST Reconciliation Queries
// ============================================================================

export async function getGstReconciliations(tenantId: string) {
  return db
    .select()
    .from(gstReconciliations)
    .where(eq(gstReconciliations.tenantId, tenantId))
    .orderBy(desc(gstReconciliations.createdAt));
}

export async function getGstReconciliationByPeriod(tenantId: string, periodId: string) {
  const result = await db
    .select()
    .from(gstReconciliations)
    .where(
      and(
        eq(gstReconciliations.tenantId, tenantId),
        eq(gstReconciliations.periodId, periodId)
      )
    )
    .limit(1);
  return result[0] || null;
}

export async function createOrUpdateReconciliation(
  tenantId: string,
  periodId: string,
  data: {
    salesTaxReturnId?: string;
    inputTaxClaimId?: string;
    totalOutputTax: string;
    totalInputTax: string;
    previousPeriodCredit?: string;
  }
) {
  const existing = await getGstReconciliationByPeriod(tenantId, periodId);
  
  const outputTax = parseFloat(data.totalOutputTax || '0');
  const inputTax = parseFloat(data.totalInputTax || '0');
  const prevCredit = parseFloat(data.previousPeriodCredit || '0');
  
  const netPayable = outputTax - inputTax - prevCredit;
  const carryForward = netPayable < 0 ? Math.abs(netPayable) : 0;

  const reconciliationData = {
    tenantId,
    periodId,
    salesTaxReturnId: data.salesTaxReturnId,
    inputTaxClaimId: data.inputTaxClaimId,
    totalOutputTax: data.totalOutputTax,
    totalInputTax: data.totalInputTax,
    previousPeriodCredit: data.previousPeriodCredit || '0',
    netTaxPayable: netPayable.toFixed(2),
    carryForwardCredit: carryForward.toFixed(2),
  };

  if (existing) {
    const result = await db
      .update(gstReconciliations)
      .set({ ...reconciliationData, updatedAt: new Date() })
      .where(eq(gstReconciliations.id, existing.id))
      .returning();
    return result[0];
  } else {
    const result = await db
      .insert(gstReconciliations)
      .values(reconciliationData)
      .returning();
    return result[0];
  }
}

export async function recordGstPayment(
  id: string,
  tenantId: string,
  payment: {
    amount: string;
    date: string;
    reference: string;
    cprNumber?: string;
  }
) {
  const result = await db
    .update(gstReconciliations)
    .set({
      amountPaid: payment.amount,
      paymentDate: payment.date,
      paymentReference: payment.reference,
      cprNumber: payment.cprNumber,
      status: 'paid',
      updatedAt: new Date(),
    })
    .where(and(eq(gstReconciliations.id, id), eq(gstReconciliations.tenantId, tenantId)))
    .returning();
  return result[0];
}

// ============================================================================
// Withholding Tax Queries
// ============================================================================

export async function getWithholdingTaxRecords(
  tenantId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    vendorId?: string;
    section?: string;
  }
) {
  let conditions = [eq(withholdingTaxRecords.tenantId, tenantId)];

  if (options?.startDate) {
    conditions.push(gte(withholdingTaxRecords.transactionDate, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(withholdingTaxRecords.transactionDate, options.endDate));
  }
  if (options?.vendorId) {
    conditions.push(eq(withholdingTaxRecords.vendorId, options.vendorId));
  }
  if (options?.section) {
    conditions.push(eq(withholdingTaxRecords.withholdingSection, options.section));
  }

  return db
    .select()
    .from(withholdingTaxRecords)
    .where(and(...conditions))
    .orderBy(desc(withholdingTaxRecords.transactionDate));
}

export async function createWithholdingTaxRecord(data: {
  tenantId: string;
  transactionType: string;
  transactionId?: string;
  transactionDate: string;
  vendorId?: string;
  vendorNtn?: string;
  vendorName: string;
  vendorType?: string;
  isFiler: boolean;
  grossAmount: string;
  withholdingSection: string;
  withholdingRate: string;
  withholdingAmount: string;
  netAmount: string;
}) {
  const result = await db.insert(withholdingTaxRecords).values(data).returning();
  return result[0];
}

export async function markWithholdingAsDeposited(
  id: string,
  tenantId: string,
  depositInfo: {
    date: string;
    cprNumber: string;
  }
) {
  const result = await db
    .update(withholdingTaxRecords)
    .set({
      isDeposited: true,
      depositDate: depositInfo.date,
      cprNumber: depositInfo.cprNumber,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(withholdingTaxRecords.id, id),
        eq(withholdingTaxRecords.tenantId, tenantId)
      )
    )
    .returning();
  return result[0];
}

export async function getWithholdingTaxSummary(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<WithholdingTaxSummary[]> {
  const records = await db
    .select({
      section: withholdingTaxRecords.withholdingSection,
      totalTransactions: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${withholdingTaxRecords.grossAmount}::numeric)`,
      totalWithheld: sql<number>`sum(${withholdingTaxRecords.withholdingAmount}::numeric)`,
      depositedAmount: sql<number>`sum(case when ${withholdingTaxRecords.isDeposited} then ${withholdingTaxRecords.withholdingAmount}::numeric else 0 end)`,
    })
    .from(withholdingTaxRecords)
    .where(
      and(
        eq(withholdingTaxRecords.tenantId, tenantId),
        gte(withholdingTaxRecords.transactionDate, startDate),
        lte(withholdingTaxRecords.transactionDate, endDate)
      )
    )
    .groupBy(withholdingTaxRecords.withholdingSection);

  const sectionDescriptions: Record<string, { description: string; filerRate: number; nonFilerRate: number }> = {
    '153(1)(a)': { description: 'Supply of Goods', filerRate: 4.5, nonFilerRate: 9 },
    '153(1)(b)': { description: 'Rendering of Services', filerRate: 8, nonFilerRate: 16 },
    '153(1)(c)': { description: 'Execution of Contract', filerRate: 7.5, nonFilerRate: 15 },
    '156A': { description: 'Commission/Brokerage', filerRate: 12, nonFilerRate: 24 },
  };

  return records.map((r) => ({
    section: r.section,
    description: sectionDescriptions[r.section]?.description || 'Other',
    filerRate: sectionDescriptions[r.section]?.filerRate || 0,
    nonFilerRate: sectionDescriptions[r.section]?.nonFilerRate || 0,
    totalTransactions: r.totalTransactions,
    totalAmount: r.totalAmount || 0,
    totalWithheld: r.totalWithheld || 0,
    depositedAmount: r.depositedAmount || 0,
    pendingDeposit: (r.totalWithheld || 0) - (r.depositedAmount || 0),
  }));
}

// ============================================================================
// Dashboard & Reporting Queries
// ============================================================================

export async function getFbrComplianceSummary(tenantId: string): Promise<FbrComplianceSummary | null> {
  const currentPeriod = await getCurrentFilingPeriod(tenantId);
  if (!currentPeriod) {
    return null;
  }

  const today = new Date();
  const dueDate = new Date(currentPeriod.dueDate);
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Get output tax for period
  const outputTaxResult = await db
    .select()
    .from(salesTaxReturns)
    .where(
      and(
        eq(salesTaxReturns.tenantId, tenantId),
        eq(salesTaxReturns.periodId, currentPeriod.id)
      )
    )
    .limit(1);

  const salesReturn = outputTaxResult[0];
  const outputTax = parseFloat(salesReturn?.totalOutputTax || '0');
  const outputFiled = salesReturn?.status === 'filed';

  // Get input tax for period
  const inputTaxResult = await db
    .select()
    .from(inputTaxClaims)
    .where(
      and(
        eq(inputTaxClaims.tenantId, tenantId),
        eq(inputTaxClaims.periodId, currentPeriod.id)
      )
    )
    .limit(1);

  const inputClaim = inputTaxResult[0];
  const inputTax = parseFloat(inputClaim?.claimableInputTax || '0');
  const inputClaimed = inputClaim?.status === 'filed';

  // Get pending filings count
  const pendingFilingsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(taxFilingPeriods)
    .where(
      and(
        eq(taxFilingPeriods.tenantId, tenantId),
        eq(taxFilingPeriods.isClosed, false),
        lte(taxFilingPeriods.dueDate, today.toISOString().split('T')[0])
      )
    );

  const pendingFilings = pendingFilingsResult[0]?.count || 0;

  // Get withholding tax due
  const whtResult = await db
    .select({
      total: sql<number>`sum(${withholdingTaxRecords.withholdingAmount}::numeric)`,
    })
    .from(withholdingTaxRecords)
    .where(
      and(
        eq(withholdingTaxRecords.tenantId, tenantId),
        eq(withholdingTaxRecords.isDeposited, false)
      )
    );

  const withholdingTaxDue = whtResult[0]?.total || 0;

  // Determine compliance status
  let complianceStatus: 'compliant' | 'pending' | 'overdue' | 'warning' = 'compliant';
  if (pendingFilings > 0) {
    complianceStatus = 'overdue';
  } else if (!outputFiled || !inputClaimed) {
    complianceStatus = daysRemaining <= 5 ? 'warning' : 'pending';
  }

  return {
    currentPeriod: {
      name: currentPeriod.periodName,
      startDate: currentPeriod.startDate,
      endDate: currentPeriod.endDate,
      dueDate: currentPeriod.dueDate,
      daysRemaining,
    },
    outputTax: {
      total: outputTax,
      filed: outputFiled,
    },
    inputTax: {
      total: inputTax,
      claimed: inputClaimed,
    },
    netPayable: outputTax - inputTax,
    complianceStatus,
    pendingFilings,
    withholdingTaxDue,
  };
}

export async function getMonthlyGstTrend(
  tenantId: string,
  fiscalYear: number
): Promise<MonthlyGstTrend[]> {
  const periods = await getFilingPeriods(tenantId, fiscalYear);
  const trends: MonthlyGstTrend[] = [];

  for (const period of periods) {
    const salesReturn = await db
      .select()
      .from(salesTaxReturns)
      .where(
        and(
          eq(salesTaxReturns.tenantId, tenantId),
          eq(salesTaxReturns.periodId, period.id)
        )
      )
      .limit(1);

    const inputClaim = await db
      .select()
      .from(inputTaxClaims)
      .where(
        and(
          eq(inputTaxClaims.tenantId, tenantId),
          eq(inputTaxClaims.periodId, period.id)
        )
      )
      .limit(1);

    const outputTax = parseFloat(salesReturn[0]?.totalOutputTax || '0');
    const inputTax = parseFloat(inputClaim[0]?.claimableInputTax || '0');

    trends.push({
      period: period.id,
      month: period.periodName,
      outputTax,
      inputTax,
      netPayable: outputTax - inputTax,
    });
  }

  return trends.reverse(); // Oldest first
}

export async function getComplianceCalendar(
  tenantId: string,
  year: number
): Promise<ComplianceCalendarItem[]> {
  const items: ComplianceCalendarItem[] = [];
  const today = new Date();

  // Get all filing periods for the year
  const periods = await getFilingPeriods(tenantId, year);

  for (const period of periods) {
    const dueDate = new Date(period.dueDate);
    const isOverdue = dueDate < today && !period.isClosed;

    items.push({
      id: period.id,
      title: `GST Return - ${period.periodName}`,
      dueDate: period.dueDate,
      type: 'gst_return',
      status: period.isClosed ? 'completed' : isOverdue ? 'overdue' : 'pending',
      description: `File GST return for ${period.periodName}`,
    });
  }

  // Add withholding tax deposit deadlines (7th of each month)
  for (let month = 0; month < 12; month++) {
    const monthYear = month < 6 ? year : year + 1;
    const depositDate = new Date(monthYear, (6 + month) % 12, 7);
    
    if (depositDate.getFullYear() === year || depositDate.getFullYear() === year + 1) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      items.push({
        id: `wht-${monthYear}-${(6 + month) % 12}`,
        title: `Withholding Tax Deposit - ${monthNames[(6 + month) % 12]} ${monthYear}`,
        dueDate: depositDate.toISOString().split('T')[0],
        type: 'withholding_deposit',
        status: depositDate < today ? 'completed' : 'pending',
        description: 'Deposit withholding tax collected in previous month',
      });
    }
  }

  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// ============================================================================
// API Log Queries
// ============================================================================

export async function logFbrApiCall(data: {
  tenantId: string;
  apiEndpoint: string;
  requestType: string;
  requestPayload?: object;
  responseCode?: number;
  responsePayload?: object;
  isSuccess: boolean;
  errorMessage?: string;
  referenceId?: string;
  referenceType?: string;
  createdBy?: string;
}) {
  const result = await db.insert(fbrApiLogs).values(data).returning();
  return result[0];
}

export async function getFbrApiLogs(
  tenantId: string,
  options?: {
    limit?: number;
    referenceId?: string;
    referenceType?: string;
  }
) {
  const baseQuery = db
    .select()
    .from(fbrApiLogs)
    .where(eq(fbrApiLogs.tenantId, tenantId))
    .orderBy(desc(fbrApiLogs.createdAt));

  if (options?.limit) {
    return baseQuery.limit(options.limit);
  }

  return baseQuery;
}
