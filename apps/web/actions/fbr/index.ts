'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/../../packages/auth/src';
import {
  // Tax Rates
  getTaxRates as dbGetTaxRates,
  getActiveTaxRates as dbGetActiveTaxRates,
  getTaxRateById as dbGetTaxRateById,
  createTaxRate as dbCreateTaxRate,
  updateTaxRate as dbUpdateTaxRate,
  deleteTaxRate as dbDeleteTaxRate,
  // Tax Registration
  getTaxRegistration as dbGetTaxRegistration,
  upsertTaxRegistration as dbUpsertTaxRegistration,
  // Filing Periods
  getFilingPeriods as dbGetFilingPeriods,
  getCurrentFilingPeriod as dbGetCurrentFilingPeriod,
  getOpenFilingPeriods as dbGetOpenFilingPeriods,
  createFilingPeriod as dbCreateFilingPeriod,
  closeFilingPeriod as dbCloseFilingPeriod,
  generateMonthlyPeriods as dbGenerateMonthlyPeriods,
  // Sales Tax Returns
  getSalesTaxReturns as dbGetSalesTaxReturns,
  getSalesTaxReturnById as dbGetSalesTaxReturnById,
  getSalesTaxReturnWithLines as dbGetSalesTaxReturnWithLines,
  createSalesTaxReturn as dbCreateSalesTaxReturn,
  updateSalesTaxReturn as dbUpdateSalesTaxReturn,
  generateReturnNumber as dbGenerateReturnNumber,
  // Input Tax Claims
  getInputTaxClaims as dbGetInputTaxClaims,
  getInputTaxClaimById as dbGetInputTaxClaimById,
  getInputTaxClaimWithLines as dbGetInputTaxClaimWithLines,
  createInputTaxClaim as dbCreateInputTaxClaim,
  updateInputTaxClaim as dbUpdateInputTaxClaim,
  generateClaimNumber as dbGenerateClaimNumber,
  // GST Reconciliation
  getGstReconciliations as dbGetGstReconciliations,
  getGstReconciliationByPeriod as dbGetGstReconciliationByPeriod,
  createOrUpdateReconciliation as dbCreateOrUpdateReconciliation,
  recordGstPayment as dbRecordGstPayment,
  // Withholding Tax
  getWithholdingTaxRecords as dbGetWithholdingTaxRecords,
  createWithholdingTaxRecord as dbCreateWithholdingTaxRecord,
  markWithholdingAsDeposited as dbMarkWithholdingAsDeposited,
  getWithholdingTaxSummary as dbGetWithholdingTaxSummary,
  // Dashboard & Reporting
  getFbrComplianceSummary as dbGetFbrComplianceSummary,
  getMonthlyGstTrend as dbGetMonthlyGstTrend,
  getComplianceCalendar as dbGetComplianceCalendar,
  // API Logs
  logFbrApiCall as dbLogFbrApiCall,
  getFbrApiLogs as dbGetFbrApiLogs,
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
// Tax Rates Actions
// ============================================================================

export async function fetchTaxRates() {
  try {
    const tenantId = await getTenantId();
    const rates = await dbGetTaxRates(tenantId);
    return { success: true, data: rates };
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    return { success: false, error: 'Failed to fetch tax rates' };
  }
}

export async function fetchActiveTaxRates() {
  try {
    const tenantId = await getTenantId();
    const rates = await dbGetActiveTaxRates(tenantId);
    return { success: true, data: rates };
  } catch (error) {
    console.error('Error fetching active tax rates:', error);
    return { success: false, error: 'Failed to fetch active tax rates' };
  }
}

export async function createTaxRate(data: {
  code: string;
  name: string;
  description?: string;
  taxType: 'gst' | 'reduced_gst' | 'zero_rated' | 'exempt' | 'further_tax' | 'withholding' | 'advance_tax' | 'provincial';
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isDefault?: boolean;
  applicableToSales?: boolean;
  applicableToPurchases?: boolean;
  fbrTaxCode?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const rate = await dbCreateTaxRate({
      tenantId,
      code: data.code,
      name: data.name,
      description: data.description,
      taxType: data.taxType,
      rate: data.rate.toString(),
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
      isDefault: data.isDefault,
      applicableToSales: data.applicableToSales ?? true,
      applicableToPurchases: data.applicableToPurchases ?? true,
      fbrTaxCode: data.fbrTaxCode,
    });
    
    revalidatePath('/fbr/config');
    return { success: true, data: rate };
  } catch (error) {
    console.error('Error creating tax rate:', error);
    return { success: false, error: 'Failed to create tax rate' };
  }
}

export async function updateTaxRate(
  id: string,
  data: {
    code?: string;
    name?: string;
    description?: string;
    rate?: number;
    effectiveFrom?: string;
    effectiveTo?: string;
    isDefault?: boolean;
    isActive?: boolean;
    applicableToSales?: boolean;
    applicableToPurchases?: boolean;
    fbrTaxCode?: string;
  }
) {
  try {
    const tenantId = await getTenantId();
    const updateData: Record<string, unknown> = { ...data };
    if (data.rate !== undefined) {
      updateData.rate = data.rate.toString();
    }

    const rate = await dbUpdateTaxRate(id, tenantId, updateData);
    
    revalidatePath('/fbr/config');
    return { success: true, data: rate };
  } catch (error) {
    console.error('Error updating tax rate:', error);
    return { success: false, error: 'Failed to update tax rate' };
  }
}

export async function deleteTaxRate(id: string) {
  try {
    const tenantId = await getTenantId();
    await dbDeleteTaxRate(id, tenantId);
    
    revalidatePath('/fbr/config');
    return { success: true };
  } catch (error) {
    console.error('Error deleting tax rate:', error);
    return { success: false, error: 'Failed to delete tax rate' };
  }
}

// ============================================================================
// Tax Registration Actions
// ============================================================================

export async function fetchTaxRegistration() {
  try {
    const tenantId = await getTenantId();
    const registration = await dbGetTaxRegistration(tenantId);
    return { success: true, data: registration };
  } catch (error) {
    console.error('Error fetching tax registration:', error);
    return { success: false, error: 'Failed to fetch tax registration' };
  }
}

export async function saveTaxRegistration(data: {
  ntn: string;
  strn?: string;
  businessType: 'manufacturer' | 'importer' | 'exporter' | 'retailer' | 'wholesaler' | 'service_provider' | 'contractor' | 'other';
  registeredName: string;
  businessAddress?: string;
  principalBusinessActivity?: string;
  taxOffice?: string;
  registrationDate?: string;
  punjabStn?: string;
  sindhSrn?: string;
  kpkStn?: string;
  balochistanStn?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const registration = await dbUpsertTaxRegistration({
      tenantId,
      ...data,
    });
    
    revalidatePath('/fbr/config');
    return { success: true, data: registration };
  } catch (error) {
    console.error('Error saving tax registration:', error);
    return { success: false, error: 'Failed to save tax registration' };
  }
}

// ============================================================================
// Filing Periods Actions
// ============================================================================

export async function fetchFilingPeriods(fiscalYear?: number) {
  try {
    const tenantId = await getTenantId();
    const periods = await dbGetFilingPeriods(tenantId, fiscalYear);
    return { success: true, data: periods };
  } catch (error) {
    console.error('Error fetching filing periods:', error);
    return { success: false, error: 'Failed to fetch filing periods' };
  }
}

export async function fetchCurrentFilingPeriod() {
  try {
    const tenantId = await getTenantId();
    const period = await dbGetCurrentFilingPeriod(tenantId);
    return { success: true, data: period };
  } catch (error) {
    console.error('Error fetching current filing period:', error);
    return { success: false, error: 'Failed to fetch current filing period' };
  }
}

export async function fetchOpenFilingPeriods() {
  try {
    const tenantId = await getTenantId();
    const periods = await dbGetOpenFilingPeriods(tenantId);
    return { success: true, data: periods };
  } catch (error) {
    console.error('Error fetching open filing periods:', error);
    return { success: false, error: 'Failed to fetch open filing periods' };
  }
}

export async function generateFilingPeriods(fiscalYear: number) {
  try {
    const tenantId = await getTenantId();
    const periods = await dbGenerateMonthlyPeriods(tenantId, fiscalYear);
    
    revalidatePath('/fbr/config');
    return { success: true, data: periods };
  } catch (error) {
    console.error('Error generating filing periods:', error);
    return { success: false, error: 'Failed to generate filing periods' };
  }
}

export async function closeFilingPeriod(periodId: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const period = await dbCloseFilingPeriod(
      periodId,
      tenantId,
      userId
    );
    
    revalidatePath('/fbr');
    return { success: true, data: period };
  } catch (error) {
    console.error('Error closing filing period:', error);
    return { success: false, error: 'Failed to close filing period' };
  }
}

// ============================================================================
// Sales Tax Return (Form A) Actions
// ============================================================================

export async function fetchSalesTaxReturns(periodId?: string) {
  try {
    const tenantId = await getTenantId();
    const returns = await dbGetSalesTaxReturns(tenantId, periodId);
    return { success: true, data: returns };
  } catch (error) {
    console.error('Error fetching sales tax returns:', error);
    return { success: false, error: 'Failed to fetch sales tax returns' };
  }
}

export async function fetchSalesTaxReturnById(id: string) {
  try {
    const tenantId = await getTenantId();
    const returnData = await dbGetSalesTaxReturnWithLines(id, tenantId);
    return { success: true, data: returnData };
  } catch (error) {
    console.error('Error fetching sales tax return:', error);
    return { success: false, error: 'Failed to fetch sales tax return' };
  }
}

export async function createSalesTaxReturn(periodId: string, returnType: 'original' | 'revised' = 'original') {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const returnNumber = await dbGenerateReturnNumber(tenantId);
    
    const returnData = await dbCreateSalesTaxReturn({
      tenantId,
      periodId,
      returnNumber,
      returnType,
      status: 'draft',
      createdBy: userId,
    });
    
    revalidatePath('/fbr/form-a');
    return { success: true, data: returnData };
  } catch (error) {
    console.error('Error creating sales tax return:', error);
    return { success: false, error: 'Failed to create sales tax return' };
  }
}

export async function updateSalesTaxReturn(
  id: string,
  data: {
    status?: 'draft' | 'pending_review' | 'ready_to_file' | 'filed' | 'revised' | 'cancelled';
    taxableSuppliesValue?: string;
    taxableSuppliesTax?: string;
    reducedRateSuppliesValue?: string;
    reducedRateSuppliesTax?: string;
    zeroRatedSuppliesValue?: string;
    exemptSuppliesValue?: string;
    exportSuppliesValue?: string;
    furtherTaxValue?: string;
    furtherTaxAmount?: string;
    totalSuppliesValue?: string;
    totalOutputTax?: string;
    notes?: string;
  }
) {
  try {
    const tenantId = await getTenantId();
    const returnData = await dbUpdateSalesTaxReturn(id, tenantId, data);
    
    revalidatePath('/fbr/form-a');
    revalidatePath(`/fbr/form-a/${id}`);
    return { success: true, data: returnData };
  } catch (error) {
    console.error('Error updating sales tax return:', error);
    return { success: false, error: 'Failed to update sales tax return' };
  }
}

export async function fileSalesTaxReturn(id: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    // In production, this would integrate with FBR API
    const returnData = await dbUpdateSalesTaxReturn(id, tenantId, {
      status: 'filed',
      filedAt: new Date(),
      filedBy: userId,
    });
    
    revalidatePath('/fbr/form-a');
    revalidatePath('/fbr');
    return { success: true, data: returnData };
  } catch (error) {
    console.error('Error filing sales tax return:', error);
    return { success: false, error: 'Failed to file sales tax return' };
  }
}

// ============================================================================
// Input Tax Claim (Form B) Actions
// ============================================================================

export async function fetchInputTaxClaims(periodId?: string) {
  try {
    const tenantId = await getTenantId();
    const claims = await dbGetInputTaxClaims(tenantId, periodId);
    return { success: true, data: claims };
  } catch (error) {
    console.error('Error fetching input tax claims:', error);
    return { success: false, error: 'Failed to fetch input tax claims' };
  }
}

export async function fetchInputTaxClaimById(id: string) {
  try {
    const tenantId = await getTenantId();
    const claimData = await dbGetInputTaxClaimWithLines(id, tenantId);
    return { success: true, data: claimData };
  } catch (error) {
    console.error('Error fetching input tax claim:', error);
    return { success: false, error: 'Failed to fetch input tax claim' };
  }
}

export async function createInputTaxClaim(periodId: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const claimNumber = await dbGenerateClaimNumber(tenantId);
    
    const claimData = await dbCreateInputTaxClaim({
      tenantId,
      periodId,
      claimNumber,
      status: 'draft',
      createdBy: userId,
    });
    
    revalidatePath('/fbr/form-b');
    return { success: true, data: claimData };
  } catch (error) {
    console.error('Error creating input tax claim:', error);
    return { success: false, error: 'Failed to create input tax claim' };
  }
}

export async function updateInputTaxClaim(
  id: string,
  data: {
    status?: 'draft' | 'pending_review' | 'ready_to_file' | 'filed' | 'revised' | 'cancelled';
    localPurchasesValue?: string;
    localPurchasesTax?: string;
    importsValue?: string;
    importsTax?: string;
    capitalGoodsValue?: string;
    capitalGoodsTax?: string;
    servicesValue?: string;
    servicesTax?: string;
    previousPeriodAdjustment?: string;
    totalPurchasesValue?: string;
    totalInputTax?: string;
    claimableInputTax?: string;
    notes?: string;
  }
) {
  try {
    const tenantId = await getTenantId();
    const claimData = await dbUpdateInputTaxClaim(id, tenantId, data);
    
    revalidatePath('/fbr/form-b');
    revalidatePath(`/fbr/form-b/${id}`);
    return { success: true, data: claimData };
  } catch (error) {
    console.error('Error updating input tax claim:', error);
    return { success: false, error: 'Failed to update input tax claim' };
  }
}

// ============================================================================
// GST Reconciliation Actions
// ============================================================================

export async function fetchGstReconciliations() {
  try {
    const tenantId = await getTenantId();
    const reconciliations = await dbGetGstReconciliations(tenantId);
    return { success: true, data: reconciliations };
  } catch (error) {
    console.error('Error fetching GST reconciliations:', error);
    return { success: false, error: 'Failed to fetch GST reconciliations' };
  }
}

export async function fetchGstReconciliationByPeriod(periodId: string) {
  try {
    const tenantId = await getTenantId();
    const reconciliation = await dbGetGstReconciliationByPeriod(
      tenantId,
      periodId
    );
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error fetching GST reconciliation:', error);
    return { success: false, error: 'Failed to fetch GST reconciliation' };
  }
}

export async function calculateReconciliation(periodId: string) {
  try {
    const tenantId = await getTenantId();
    // Get sales tax return for period
    const returns = await dbGetSalesTaxReturns(tenantId, periodId);
    const salesReturn = returns.find(r => r.status !== 'cancelled');
    
    // Get input tax claim for period
    const claims = await dbGetInputTaxClaims(tenantId, periodId);
    const inputClaim = claims.find(c => c.status !== 'cancelled');

    const reconciliation = await dbCreateOrUpdateReconciliation(
      tenantId,
      periodId,
      {
        salesTaxReturnId: salesReturn?.id,
        inputTaxClaimId: inputClaim?.id,
        totalOutputTax: salesReturn?.totalOutputTax || '0',
        totalInputTax: inputClaim?.claimableInputTax || '0',
      }
    );
    
    revalidatePath('/fbr/reconciliation');
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error calculating reconciliation:', error);
    return { success: false, error: 'Failed to calculate reconciliation' };
  }
}

export async function recordGstPayment(
  reconciliationId: string,
  payment: {
    amount: number;
    date: string;
    reference: string;
    cprNumber?: string;
  }
) {
  try {
    const tenantId = await getTenantId();
    const reconciliation = await dbRecordGstPayment(
      reconciliationId,
      tenantId,
      {
        amount: payment.amount.toString(),
        date: payment.date,
        reference: payment.reference,
        cprNumber: payment.cprNumber,
      }
    );
    
    revalidatePath('/fbr/reconciliation');
    return { success: true, data: reconciliation };
  } catch (error) {
    console.error('Error recording GST payment:', error);
    return { success: false, error: 'Failed to record GST payment' };
  }
}

// ============================================================================
// Withholding Tax Actions
// ============================================================================

export async function fetchWithholdingTaxRecords(options?: {
  startDate?: string;
  endDate?: string;
  vendorId?: string;
  section?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const records = await dbGetWithholdingTaxRecords(tenantId, options);
    return { success: true, data: records };
  } catch (error) {
    console.error('Error fetching withholding tax records:', error);
    return { success: false, error: 'Failed to fetch withholding tax records' };
  }
}

export async function createWithholdingTaxRecord(data: {
  transactionType: 'payment' | 'invoice';
  transactionId?: string;
  transactionDate: string;
  vendorId?: string;
  vendorNtn?: string;
  vendorName: string;
  vendorType: 'company' | 'individual' | 'aop';
  isFiler: boolean;
  grossAmount: number;
  withholdingSection: string;
  withholdingRate: number;
}) {
  try {
    const tenantId = await getTenantId();
    const withholdingAmount = (data.grossAmount * data.withholdingRate) / 100;
    const netAmount = data.grossAmount - withholdingAmount;

    const record = await dbCreateWithholdingTaxRecord({
      tenantId,
      transactionType: data.transactionType,
      transactionId: data.transactionId,
      transactionDate: data.transactionDate,
      vendorId: data.vendorId,
      vendorNtn: data.vendorNtn,
      vendorName: data.vendorName,
      vendorType: data.vendorType,
      isFiler: data.isFiler,
      grossAmount: data.grossAmount.toString(),
      withholdingSection: data.withholdingSection,
      withholdingRate: data.withholdingRate.toString(),
      withholdingAmount: withholdingAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
    });
    
    revalidatePath('/fbr/reports');
    return { success: true, data: record };
  } catch (error) {
    console.error('Error creating withholding tax record:', error);
    return { success: false, error: 'Failed to create withholding tax record' };
  }
}

export async function depositWithholdingTax(
  id: string,
  depositInfo: {
    date: string;
    cprNumber: string;
  }
) {
  try {
    const tenantId = await getTenantId();
    const record = await dbMarkWithholdingAsDeposited(
      id,
      tenantId,
      depositInfo
    );
    
    revalidatePath('/fbr/reports');
    return { success: true, data: record };
  } catch (error) {
    console.error('Error depositing withholding tax:', error);
    return { success: false, error: 'Failed to deposit withholding tax' };
  }
}

export async function fetchWithholdingTaxSummary(startDate: string, endDate: string) {
  try {
    const tenantId = await getTenantId();
    const summary = await dbGetWithholdingTaxSummary(
      tenantId,
      startDate,
      endDate
    );
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching withholding tax summary:', error);
    return { success: false, error: 'Failed to fetch withholding tax summary' };
  }
}

// ============================================================================
// Dashboard & Reporting Actions
// ============================================================================

export async function fetchFbrComplianceSummary() {
  try {
    const tenantId = await getTenantId();
    const summary = await dbGetFbrComplianceSummary(tenantId);
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching FBR compliance summary:', error);
    return { success: false, error: 'Failed to fetch FBR compliance summary' };
  }
}

export async function fetchMonthlyGstTrend(fiscalYear: number) {
  try {
    const tenantId = await getTenantId();
    const trends = await dbGetMonthlyGstTrend(tenantId, fiscalYear);
    return { success: true, data: trends };
  } catch (error) {
    console.error('Error fetching monthly GST trend:', error);
    return { success: false, error: 'Failed to fetch monthly GST trend' };
  }
}

export async function fetchComplianceCalendar(year: number) {
  try {
    const tenantId = await getTenantId();
    const calendar = await dbGetComplianceCalendar(tenantId, year);
    return { success: true, data: calendar };
  } catch (error) {
    console.error('Error fetching compliance calendar:', error);
    return { success: false, error: 'Failed to fetch compliance calendar' };
  }
}

// ============================================================================
// FBR API Integration (Placeholder for future implementation)
// ============================================================================

export async function verifyNtn(ntn: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    // In production, this would call FBR's API to verify NTN
    // For now, return a mock response
    await dbLogFbrApiCall({
      tenantId,
      apiEndpoint: '/iris/verify-ntn',
      requestType: 'GET',
      requestPayload: { ntn },
      isSuccess: true,
      responsePayload: { verified: true },
      createdBy: userId,
    });

    return {
      success: true,
      data: {
        ntn,
        status: 'active' as const,
        isActiveTaxpayer: true,
        name: 'Verified Business Name',
      },
    };
  } catch (error) {
    console.error('Error verifying NTN:', error);
    return { success: false, error: 'Failed to verify NTN' };
  }
}

export async function verifyStrn(strn: string) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    // In production, this would call FBR's API to verify STRN
    await dbLogFbrApiCall({
      tenantId,
      apiEndpoint: '/iris/verify-strn',
      requestType: 'GET',
      requestPayload: { strn },
      isSuccess: true,
      responsePayload: { verified: true },
      createdBy: userId,
    });

    return {
      success: true,
      data: {
        strn,
        status: 'active' as const,
        ntn: '1234567-8',
        name: 'Verified Business Name',
      },
    };
  } catch (error) {
    console.error('Error verifying STRN:', error);
    return { success: false, error: 'Failed to verify STRN' };
  }
}
