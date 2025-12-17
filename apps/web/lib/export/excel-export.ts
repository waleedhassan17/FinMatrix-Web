// Excel/CSV Export Utilities for FinMatrix Reports
// Provides spreadsheet export functionality for AR/AP aging reports

/**
 * Format currency for Excel
 */
function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date for Excel
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array of objects to CSV string
 */
function toCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string; format?: (value: any) => string }[]
): string {
  const header = columns.map(c => escapeCSV(c.header)).join(',');
  const rows = data.map(row =>
    columns
      .map(c => {
        const value = row[c.key];
        const formatted = c.format ? c.format(value) : value;
        return escapeCSV(formatted);
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}

// ============================================================================
// AR Aging Report Export
// ============================================================================

export interface ARAgingItem {
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  agingBucket: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export interface ARAgingExportData {
  generatedAt: Date;
  tenantName: string;
  items: ARAgingItem[];
  summary: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
    total: number;
  };
}

export function generateARAgingCSV(data: ARAgingExportData): string {
  const columns: { key: keyof ARAgingItem; header: string; format?: (v: any) => string }[] = [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'customerName', header: 'Customer Name' },
    { key: 'invoiceDate', header: 'Invoice Date', format: formatDate },
    { key: 'dueDate', header: 'Due Date', format: formatDate },
    { key: 'daysOverdue', header: 'Days Overdue' },
    { key: 'agingBucket', header: 'Aging Bucket' },
    { key: 'originalAmount', header: 'Original Amount (PKR)', format: formatCurrency },
    { key: 'paidAmount', header: 'Paid Amount (PKR)', format: formatCurrency },
    { key: 'balance', header: 'Balance Due (PKR)', format: formatCurrency },
    { key: 'status', header: 'Status' },
  ];

  // Generate header section
  const reportHeader = [
    'FinMatrix - Accounts Receivable Aging Report',
    `Generated: ${data.generatedAt.toLocaleString()}`,
    `Organization: ${data.tenantName}`,
    '',
    'AGING SUMMARY',
    `Current,${formatCurrency(data.summary.current)}`,
    `1-30 Days,${formatCurrency(data.summary.days1to30)}`,
    `31-60 Days,${formatCurrency(data.summary.days31to60)}`,
    `61-90 Days,${formatCurrency(data.summary.days61to90)}`,
    `90+ Days,${formatCurrency(data.summary.days90Plus)}`,
    `TOTAL,${formatCurrency(data.summary.total)}`,
    '',
    'DETAILED BREAKDOWN',
  ].join('\n');

  // Generate data section
  const detailCSV = toCSV(data.items, columns);

  return `${reportHeader}\n${detailCSV}`;
}

// ============================================================================
// AP Aging Report Export
// ============================================================================

export interface APAgingItem {
  billNumber: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  daysOverdue: number;
  agingBucket: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export interface APAgingExportData {
  generatedAt: Date;
  tenantName: string;
  items: APAgingItem[];
  summary: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
    total: number;
  };
}

export function generateAPAgingCSV(data: APAgingExportData): string {
  const columns: { key: keyof APAgingItem; header: string; format?: (v: any) => string }[] = [
    { key: 'billNumber', header: 'Bill #' },
    { key: 'vendorName', header: 'Vendor Name' },
    { key: 'billDate', header: 'Bill Date', format: formatDate },
    { key: 'dueDate', header: 'Due Date', format: formatDate },
    { key: 'daysOverdue', header: 'Days Overdue' },
    { key: 'agingBucket', header: 'Aging Bucket' },
    { key: 'originalAmount', header: 'Original Amount (PKR)', format: formatCurrency },
    { key: 'paidAmount', header: 'Paid Amount (PKR)', format: formatCurrency },
    { key: 'balance', header: 'Balance Due (PKR)', format: formatCurrency },
    { key: 'status', header: 'Status' },
  ];

  // Generate header section
  const reportHeader = [
    'FinMatrix - Accounts Payable Aging Report',
    `Generated: ${data.generatedAt.toLocaleString()}`,
    `Organization: ${data.tenantName}`,
    '',
    'AGING SUMMARY',
    `Current,${formatCurrency(data.summary.current)}`,
    `1-30 Days,${formatCurrency(data.summary.days1to30)}`,
    `31-60 Days,${formatCurrency(data.summary.days31to60)}`,
    `61-90 Days,${formatCurrency(data.summary.days61to90)}`,
    `90+ Days,${formatCurrency(data.summary.days90Plus)}`,
    `TOTAL,${formatCurrency(data.summary.total)}`,
    '',
    'DETAILED BREAKDOWN',
  ].join('\n');

  // Generate data section
  const detailCSV = toCSV(data.items, columns);

  return `${reportHeader}\n${detailCSV}`;
}

// ============================================================================
// Generic Report Export
// ============================================================================

export interface GenericExportColumn<T> {
  key: keyof T;
  header: string;
  format?: (value: any) => string;
}

export function generateGenericCSV<T extends Record<string, any>>(
  data: T[],
  columns: GenericExportColumn<T>[],
  title?: string
): string {
  const header = title ? `${title}\n\n` : '';
  return header + toCSV(data, columns);
}

// ============================================================================
// Download Utilities
// ============================================================================

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Download AR Aging report as Excel-compatible CSV
 */
export function downloadARAgingReport(data: ARAgingExportData): void {
  const csv = generateARAgingCSV(data);
  const filename = `AR-Aging-Report-${formatDate(data.generatedAt)}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Download AP Aging report as Excel-compatible CSV
 */
export function downloadAPAgingReport(data: APAgingExportData): void {
  const csv = generateAPAgingCSV(data);
  const filename = `AP-Aging-Report-${formatDate(data.generatedAt)}.csv`;
  downloadCSV(csv, filename);
}
