// FBR Form Auto-Population Functions
// Automatically populate Form A (Sales Tax Return) from invoices
// and Form B (Input Tax Claim) from bills

import { db } from '../client';
import { eq, and, gte, lte, sql, ne } from 'drizzle-orm';
import { invoices, invoiceLineItems } from '../schema/ar';
import { bills, billLineItems } from '../schema/ap';
import { taxFilingPeriods } from '../schema/fbr';
import type { FormAData, FormBData, SupplyBreakdown, PurchaseBreakdown } from '../types/fbr';

// ============================================================================
// Form A - Sales Tax Return (Output Tax from Invoices)
// ============================================================================

interface FormAInvoiceSummary {
  invoiceCount: number;
  totalSupplies: number;
  totalTax: number;
  byTaxRate: {
    rate: number;
    supplies: number;
    tax: number;
    invoiceCount: number;
  }[];
  exports: {
    supplies: number;
    invoiceCount: number;
  };
  exempt: {
    supplies: number;
    invoiceCount: number;
  };
}

/**
 * Get invoice summary for a period to populate Form A
 */
export async function getInvoiceSummaryForPeriod(
  tenantId: string,
  periodId: string
): Promise<FormAInvoiceSummary> {
  // Get the filing period dates
  const periodResult = await db
    .select()
    .from(taxFilingPeriods)
    .where(and(eq(taxFilingPeriods.id, periodId), eq(taxFilingPeriods.tenantId, tenantId)))
    .limit(1);

  const period = periodResult[0];
  if (!period) {
    throw new Error('Filing period not found');
  }

  // Get all finalized invoices in the period
  const invoiceData = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        ne(invoices.status, 'draft'),
        ne(invoices.status, 'void'),
        gte(invoices.invoiceDate, period.startDate),
        lte(invoices.invoiceDate, period.endDate)
      )
    );

  // Get line-level tax breakdown
  const lineData = await db
    .select({
      invoiceId: invoiceLineItems.invoiceId,
      taxRate: invoiceLineItems.taxRate,
      subtotal: invoiceLineItems.lineTotal,
      taxAmount: invoiceLineItems.taxAmount,
    })
    .from(invoiceLineItems)
    .innerJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        ne(invoices.status, 'draft'),
        ne(invoices.status, 'void'),
        gte(invoices.invoiceDate, period.startDate),
        lte(invoices.invoiceDate, period.endDate)
      )
    );

  // Group by tax rate
  const byRateMap: Record<number, { supplies: number; tax: number; invoiceIds: Set<string> }> = {};
  let exportSupplies = 0;
  let exportInvoiceCount = 0;
  let exemptSupplies = 0;
  let exemptInvoiceCount = 0;

  for (const line of lineData) {
    const rate = parseFloat(line.taxRate || '0');
    const subtotal = parseFloat(line.subtotal || '0');
    const tax = parseFloat(line.taxAmount || '0');

    if (!byRateMap[rate]) {
      byRateMap[rate] = { supplies: 0, tax: 0, invoiceIds: new Set() };
    }
    byRateMap[rate].supplies += subtotal;
    byRateMap[rate].tax += tax;
    byRateMap[rate].invoiceIds.add(line.invoiceId);
  }

  // Calculate totals
  let totalSupplies = 0;
  let totalTax = 0;
  const byTaxRate: FormAInvoiceSummary['byTaxRate'] = [];

  for (const [rateStr, data] of Object.entries(byRateMap)) {
    const rate = parseFloat(rateStr);
    totalSupplies += data.supplies;
    totalTax += data.tax;

    if (rate === 0) {
      // Could be zero-rated or exempt - for now treat as zero-rated
      exportSupplies = data.supplies;
      exportInvoiceCount = data.invoiceIds.size;
    } else {
      byTaxRate.push({
        rate,
        supplies: data.supplies,
        tax: data.tax,
        invoiceCount: data.invoiceIds.size,
      });
    }
  }

  return {
    invoiceCount: invoiceData.length,
    totalSupplies,
    totalTax,
    byTaxRate: byTaxRate.sort((a, b) => b.rate - a.rate), // Highest rate first
    exports: { supplies: exportSupplies, invoiceCount: exportInvoiceCount },
    exempt: { supplies: exemptSupplies, invoiceCount: exemptInvoiceCount },
  };
}

/**
 * Generate Form A data from invoices for a period
 */
export async function generateFormAFromInvoices(
  tenantId: string,
  periodId: string
): Promise<FormAData> {
  const summary = await getInvoiceSummaryForPeriod(tenantId, periodId);

  // Standard GST rate in Pakistan
  const STANDARD_RATE = 18;
  const REDUCED_RATES = [5, 10, 12, 15]; // Various reduced rates

  // Find standard rate supplies
  const standardRateData = summary.byTaxRate.find(r => r.rate === STANDARD_RATE);
  const taxableStandardSupplies: SupplyBreakdown = {
    type: 'taxable_standard',
    label: `Taxable Supplies @ ${STANDARD_RATE}%`,
    value: standardRateData?.supplies || 0,
    taxRate: STANDARD_RATE,
    taxAmount: standardRateData?.tax || 0,
    invoiceCount: standardRateData?.invoiceCount || 0,
  };

  // Find reduced rate supplies
  const taxableReducedSupplies: SupplyBreakdown[] = summary.byTaxRate
    .filter(r => r.rate !== STANDARD_RATE && r.rate > 0)
    .map(r => ({
      type: 'taxable_reduced' as const,
      label: `Taxable Supplies @ ${r.rate}%`,
      value: r.supplies,
      taxRate: r.rate,
      taxAmount: r.tax,
      invoiceCount: r.invoiceCount,
    }));

  // Zero-rated supplies (exports)
  const zeroRatedSupplies: SupplyBreakdown = {
    type: 'zero_rated',
    label: 'Zero-Rated Supplies',
    value: summary.exports.supplies,
    taxRate: 0,
    taxAmount: 0,
    invoiceCount: summary.exports.invoiceCount,
  };

  // Exempt supplies
  const exemptSupplies: SupplyBreakdown = {
    type: 'exempt',
    label: 'Exempt Supplies',
    value: summary.exempt.supplies,
    taxRate: 0,
    taxAmount: 0,
    invoiceCount: summary.exempt.invoiceCount,
  };

  // Export supplies
  const exportSupplies: SupplyBreakdown = {
    type: 'export',
    label: 'Export Supplies',
    value: 0, // Would need export flag on invoices
    taxRate: 0,
    taxAmount: 0,
    invoiceCount: 0,
  };

  // Further tax (3% on non-filers) - would need additional logic
  const furtherTaxSupplies = {
    value: 0,
    rate: 3,
    amount: 0,
  };

  // Calculate totals
  const totalSupplies = summary.totalSupplies;
  const totalOutputTax = summary.totalTax;
  const totalFurtherTax = furtherTaxSupplies.amount;

  return {
    periodId,
    taxableStandardSupplies,
    taxableReducedSupplies,
    zeroRatedSupplies,
    exemptSupplies,
    exportSupplies,
    furtherTaxSupplies,
    totalSupplies,
    totalOutputTax,
    totalFurtherTax,
    grandTotal: totalOutputTax + totalFurtherTax,
  };
}

// ============================================================================
// Form B - Input Tax Claim (Input Tax from Bills)
// ============================================================================

interface FormBBillSummary {
  billCount: number;
  totalPurchases: number;
  totalInputTax: number;
  claimableInputTax: number;
  byCategory: {
    category: string;
    purchases: number;
    tax: number;
    isClaimable: boolean;
    billCount: number;
  }[];
  imports: {
    purchases: number;
    tax: number;
    billCount: number;
  };
  capitalGoods: {
    purchases: number;
    tax: number;
    billCount: number;
  };
}

/**
 * Get bill summary for a period to populate Form B
 */
export async function getBillSummaryForPeriod(
  tenantId: string,
  periodId: string
): Promise<FormBBillSummary> {
  // Get the filing period dates
  const periodResult = await db
    .select()
    .from(taxFilingPeriods)
    .where(and(eq(taxFilingPeriods.id, periodId), eq(taxFilingPeriods.tenantId, tenantId)))
    .limit(1);

  const period = periodResult[0];
  if (!period) {
    throw new Error('Filing period not found');
  }

  // Get all finalized bills in the period
  const billData = await db
    .select({
      id: bills.id,
      billNumber: bills.billNumber,
      subtotal: bills.subtotal,
      taxAmount: bills.taxAmount,
      total: bills.total,
    })
    .from(bills)
    .where(
      and(
        eq(bills.tenantId, tenantId),
        ne(bills.status, 'draft'),
        ne(bills.status, 'cancelled'),
        gte(bills.billDate, period.startDate),
        lte(bills.billDate, period.endDate)
      )
    );

  // Get line-level breakdown
  const lineData = await db
    .select({
      billId: billLineItems.billId,
      description: billLineItems.description,
      subtotal: billLineItems.lineTotal,
      taxAmount: billLineItems.taxAmount,
      taxRate: billLineItems.taxRate,
    })
    .from(billLineItems)
    .innerJoin(bills, eq(billLineItems.billId, bills.id))
    .where(
      and(
        eq(bills.tenantId, tenantId),
        ne(bills.status, 'draft'),
        ne(bills.status, 'cancelled'),
        gte(bills.billDate, period.startDate),
        lte(bills.billDate, period.endDate)
      )
    );

  // Calculate totals
  let totalPurchases = 0;
  let totalInputTax = 0;
  const billIds = new Set<string>();

  for (const line of lineData) {
    const subtotal = parseFloat(line.subtotal || '0');
    const tax = parseFloat(line.taxAmount || '0');
    totalPurchases += subtotal;
    totalInputTax += tax;
    billIds.add(line.billId);
  }

  return {
    billCount: billIds.size || billData.length,
    totalPurchases,
    totalInputTax,
    claimableInputTax: totalInputTax, // All input tax is claimable by default
    byCategory: [
      {
        category: 'local_taxable',
        purchases: totalPurchases,
        tax: totalInputTax,
        isClaimable: true,
        billCount: billIds.size || billData.length,
      },
    ],
    imports: { purchases: 0, tax: 0, billCount: 0 },
    capitalGoods: { purchases: 0, tax: 0, billCount: 0 },
  };
}

/**
 * Generate Form B data from bills for a period
 */
export async function generateFormBFromBills(
  tenantId: string,
  periodId: string
): Promise<FormBData> {
  const summary = await getBillSummaryForPeriod(tenantId, periodId);

  // Local taxable purchases
  const localTaxablePurchases: PurchaseBreakdown = {
    type: 'local_taxable',
    label: 'Local Taxable Purchases',
    value: summary.totalPurchases,
    taxAmount: summary.totalInputTax,
    isClaimable: true,
    billCount: summary.billCount,
  };

  // Import purchases (would need import flag on bills)
  const importPurchases: PurchaseBreakdown = {
    type: 'imports',
    label: 'Import Purchases',
    value: summary.imports.purchases,
    taxAmount: summary.imports.tax,
    isClaimable: true,
    billCount: summary.imports.billCount,
  };

  // Capital goods (would need capital goods flag on bills)
  const capitalGoodsPurchases: PurchaseBreakdown = {
    type: 'capital_goods',
    label: 'Capital Goods',
    value: summary.capitalGoods.purchases,
    taxAmount: summary.capitalGoods.tax,
    isClaimable: true, // Capital goods input tax claimable in installments
    billCount: summary.capitalGoods.billCount,
  };

  // Services purchases (subset of local)
  const servicesPurchases: PurchaseBreakdown = {
    type: 'services',
    label: 'Services',
    value: 0,
    taxAmount: 0,
    isClaimable: true,
    billCount: 0,
  };

  return {
    periodId,
    localTaxablePurchases,
    importPurchases,
    capitalGoodsPurchases,
    servicesPurchases,
    previousPeriodAdjustment: 0, // Would come from previous period reconciliation
    totalPurchases: summary.totalPurchases,
    totalInputTax: summary.totalInputTax,
    claimableInputTax: summary.claimableInputTax,
  };
}

// ============================================================================
// Combined Form Generation
// ============================================================================

export interface GSTReturnData {
  periodId: string;
  periodName: string;
  formA: FormAData;
  formB: FormBData;
  netPosition: {
    outputTax: number;
    inputTax: number;
    netPayable: number;
    isRefundDue: boolean;
  };
}

/**
 * Generate complete GST return data from invoices and bills
 */
export async function generateGSTReturnFromTransactions(
  tenantId: string,
  periodId: string
): Promise<GSTReturnData> {
  // Get period details
  const periodResult = await db
    .select()
    .from(taxFilingPeriods)
    .where(and(eq(taxFilingPeriods.id, periodId), eq(taxFilingPeriods.tenantId, tenantId)))
    .limit(1);

  const period = periodResult[0];
  if (!period) {
    throw new Error('Filing period not found');
  }

  // Generate Form A from invoices
  const formA = await generateFormAFromInvoices(tenantId, periodId);

  // Generate Form B from bills
  const formB = await generateFormBFromBills(tenantId, periodId);

  // Calculate net position
  const outputTax = formA.grandTotal;
  const inputTax = formB.claimableInputTax;
  const netPayable = outputTax - inputTax;

  return {
    periodId,
    periodName: period.periodName,
    formA,
    formB,
    netPosition: {
      outputTax,
      inputTax,
      netPayable,
      isRefundDue: netPayable < 0,
    },
  };
}
