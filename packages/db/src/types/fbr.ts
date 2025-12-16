// FBR Compliance Types
import {
  TaxRate,
  TaxRegistration,
  TaxFilingPeriod,
  SalesTaxReturn,
  SalesTaxReturnLine,
  InputTaxClaim,
  InputTaxClaimLine,
  GstReconciliation,
  WithholdingTaxRecord,
} from '../schema/fbr';

// ============================================================================
// Tax Configuration Types
// ============================================================================

export interface TaxRateWithDetails extends TaxRate {
  isExpired?: boolean;
}

export interface TaxRegistrationComplete extends TaxRegistration {
  hasProvincialRegistrations: boolean;
}

// ============================================================================
// Filing Period Types
// ============================================================================

export interface FilingPeriodWithStatus extends TaxFilingPeriod {
  returnStatus?: 'not_started' | 'draft' | 'filed' | 'overdue';
  daysUntilDue?: number;
  isOverdue?: boolean;
}

export interface FilingPeriodSummary {
  periodId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  outputTax: number;
  inputTax: number;
  netPayable: number;
  status: string;
}

// ============================================================================
// Sales Tax Return (Form A) Types
// ============================================================================

export interface SalesTaxReturnWithLines extends SalesTaxReturn {
  lines: SalesTaxReturnLine[];
  period?: TaxFilingPeriod;
}

export interface SalesTaxReturnSummary {
  id: string;
  returnNumber: string;
  periodName: string;
  totalSupplies: number;
  totalOutputTax: number;
  furtherTax: number;
  status: string;
  filedAt?: Date | null;
}

export interface SupplyBreakdown {
  type: 'taxable_standard' | 'taxable_reduced' | 'zero_rated' | 'exempt' | 'export';
  label: string;
  value: number;
  taxRate: number;
  taxAmount: number;
  invoiceCount: number;
}

export interface FormAData {
  periodId: string;
  // Taxable supplies
  taxableStandardSupplies: SupplyBreakdown;
  taxableReducedSupplies: SupplyBreakdown[];
  zeroRatedSupplies: SupplyBreakdown;
  exemptSupplies: SupplyBreakdown;
  exportSupplies: SupplyBreakdown;
  // Further tax
  furtherTaxSupplies: {
    value: number;
    rate: number;
    amount: number;
  };
  // Totals
  totalSupplies: number;
  totalOutputTax: number;
  totalFurtherTax: number;
  grandTotal: number;
}

// ============================================================================
// Input Tax Claim (Form B) Types
// ============================================================================

export interface InputTaxClaimWithLines extends InputTaxClaim {
  lines: InputTaxClaimLine[];
  period?: TaxFilingPeriod;
}

export interface InputTaxClaimSummary {
  id: string;
  claimNumber: string;
  periodName: string;
  totalPurchases: number;
  totalInputTax: number;
  claimableAmount: number;
  status: string;
}

export interface PurchaseBreakdown {
  type: 'local_taxable' | 'local_exempt' | 'imports' | 'capital_goods' | 'services';
  label: string;
  value: number;
  taxAmount: number;
  isClaimable: boolean;
  billCount: number;
}

export interface FormBData {
  periodId: string;
  // Purchase categories
  localTaxablePurchases: PurchaseBreakdown;
  importPurchases: PurchaseBreakdown;
  capitalGoodsPurchases: PurchaseBreakdown;
  servicesPurchases: PurchaseBreakdown;
  // Adjustments
  previousPeriodAdjustment: number;
  // Totals
  totalPurchases: number;
  totalInputTax: number;
  claimableInputTax: number;
}

// ============================================================================
// GST Reconciliation Types
// ============================================================================

export interface GstReconciliationWithDetails extends GstReconciliation {
  period?: TaxFilingPeriod;
  salesReturn?: SalesTaxReturn;
  inputClaim?: InputTaxClaim;
}

export interface ReconciliationSummary {
  periodId: string;
  periodName: string;
  outputTax: number;
  inputTax: number;
  previousCredit: number;
  netPayable: number;
  carryForward: number;
  status: 'pending' | 'paid' | 'refund_claimed';
  paymentInfo?: {
    amount: number;
    date: string;
    cprNumber: string;
  };
}

export interface MonthlyGstTrend {
  period: string;
  month: string;
  outputTax: number;
  inputTax: number;
  netPayable: number;
}

// ============================================================================
// Withholding Tax Types
// ============================================================================

export interface WithholdingTaxSummary {
  section: string;
  description: string;
  filerRate: number;
  nonFilerRate: number;
  totalTransactions: number;
  totalAmount: number;
  totalWithheld: number;
  depositedAmount: number;
  pendingDeposit: number;
}

export interface WithholdingRecord extends WithholdingTaxRecord {
  vendorDetails?: {
    name: string;
    ntn: string;
    isFiler: boolean;
  };
}

// ============================================================================
// Dashboard & Reporting Types
// ============================================================================

export interface FbrComplianceSummary {
  currentPeriod: {
    name: string;
    startDate: string;
    endDate: string;
    dueDate: string;
    daysRemaining: number;
  };
  outputTax: {
    total: number;
    filed: boolean;
  };
  inputTax: {
    total: number;
    claimed: boolean;
  };
  netPayable: number;
  complianceStatus: 'compliant' | 'pending' | 'overdue' | 'warning';
  pendingFilings: number;
  withholdingTaxDue: number;
}

export interface TaxLiabilityBreakdown {
  gstPayable: number;
  furtherTax: number;
  withholdingTax: number;
  advanceTax: number;
  provincialTax: number;
  total: number;
}

export interface ComplianceCalendarItem {
  id: string;
  title: string;
  dueDate: string;
  type: 'gst_return' | 'withholding_deposit' | 'annual_return' | 'audit';
  status: 'pending' | 'completed' | 'overdue';
  description?: string;
}

// ============================================================================
// Form Submission Types
// ============================================================================

export interface CreateTaxRateInput {
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
}

export interface UpdateTaxRegistrationInput {
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
}

export interface CreateFilingPeriodInput {
  periodType: 'monthly' | 'quarterly' | 'annual';
  periodName: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  fiscalYear: number;
  periodNumber: number;
}

export interface CreateSalesTaxReturnInput {
  periodId: string;
  returnType?: 'original' | 'revised';
}

export interface CreateInputTaxClaimInput {
  periodId: string;
}

export interface RecordWithholdingTaxInput {
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
}

// ============================================================================
// API Response Types
// ============================================================================

export interface FbrApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fbrReferenceNumber?: string;
  timestamp: string;
}

export interface NtnVerificationResult {
  ntn: string;
  name: string;
  status: 'active' | 'inactive' | 'not_found';
  businessType?: string;
  registrationDate?: string;
  isActiveTaxpayer: boolean;
}

export interface StrnVerificationResult {
  strn: string;
  ntn: string;
  name: string;
  status: 'active' | 'suspended' | 'blacklisted' | 'not_found';
  registrationDate?: string;
  businessActivity?: string;
}
