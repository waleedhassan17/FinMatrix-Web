// Invoice PDF Generation Utility for FinMatrix
// Uses jsPDF for browser-compatible PDF generation

// Types for invoice data
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface InvoiceData {
  // Invoice header
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;

  // Organization details
  organization: {
    name: string;
    address: string;
    phone: string;
    email: string;
    ntn: string; // National Tax Number
    strn?: string; // Sales Tax Registration Number
    logo?: string;
  };

  // Customer details
  customer: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    ntn?: string;
    strn?: string;
  };

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;

  // Payment terms
  paymentTerms?: string;
  notes?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
  };
}

// Format currency for display
function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate HTML template for invoice PDF
 * This can be used with any HTML-to-PDF converter
 */
export function generateInvoiceHTML(invoice: InvoiceData): string {
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#f3f4f6', text: '#374151' },
    pending: { bg: '#fef3c7', text: '#92400e' },
    sent: { bg: '#dbeafe', text: '#1e40af' },
    partial: { bg: '#fed7aa', text: '#c2410c' },
    paid: { bg: '#dcfce7', text: '#166534' },
    overdue: { bg: '#fee2e2', text: '#991b1b' },
    void: { bg: '#f3f4f6', text: '#6b7280' },
  };

  const statusStyle = statusColors[invoice.status] || statusColors.pending;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 40px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e5e7eb;
    }
    .company-info h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    .company-info p {
      font-size: 13px;
      color: #6b7280;
      margin: 2px 0;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 36px;
      font-weight: 800;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 10px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .info-box {
      width: 48%;
    }
    .info-box h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      margin-bottom: 12px;
    }
    .info-box p {
      font-size: 14px;
      color: #374151;
      margin: 4px 0;
    }
    .info-box .name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .dates-section {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .date-item {
      text-align: center;
    }
    .date-item label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
    }
    .date-item p {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-top: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #1e40af;
      color: white;
      padding: 14px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table th:first-child {
      border-radius: 8px 0 0 0;
    }
    .items-table th:last-child {
      border-radius: 0 8px 0 0;
      text-align: right;
    }
    .items-table td {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .items-table td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .items-table tr:nth-child(even) {
      background: #f9fafb;
    }
    .items-table .qty,
    .items-table .rate,
    .items-table .tax {
      text-align: center;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-box {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .totals-row.subtotal {
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-row.tax {
      color: #6b7280;
    }
    .totals-row.total {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      border-top: 2px solid #1e40af;
      padding-top: 15px;
      margin-top: 10px;
    }
    .totals-row.balance {
      font-size: 16px;
      font-weight: 600;
      color: #dc2626;
      background: #fef2f2;
      padding: 12px;
      border-radius: 6px;
      margin-top: 10px;
    }
    .totals-row.paid {
      color: #059669;
    }
    .footer-section {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }
    .bank-details {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .bank-details h4 {
      font-size: 14px;
      font-weight: 600;
      color: #0369a1;
      margin-bottom: 10px;
    }
    .bank-details p {
      font-size: 13px;
      color: #374151;
      margin: 4px 0;
    }
    .notes {
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
    }
    .fbr-compliance {
      margin-top: 30px;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      body {
        padding: 20px;
      }
      .invoice-container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>${invoice.organization.name}</h1>
        <p>${invoice.organization.address}</p>
        <p>Phone: ${invoice.organization.phone}</p>
        <p>Email: ${invoice.organization.email}</p>
        <p>NTN: ${invoice.organization.ntn}</p>
        ${invoice.organization.strn ? `<p>STRN: ${invoice.organization.strn}</p>` : ''}
      </div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p class="invoice-number">${invoice.invoiceNumber}</p>
        <span class="status-badge" style="background: ${statusStyle.bg}; color: ${statusStyle.text};">
          ${invoice.status.toUpperCase()}
        </span>
      </div>
    </div>

    <!-- Bill To Section -->
    <div class="info-section">
      <div class="info-box">
        <h3>Bill To</h3>
        <p class="name">${invoice.customer.name}</p>
        <p>${invoice.customer.address}</p>
        ${invoice.customer.phone ? `<p>Phone: ${invoice.customer.phone}</p>` : ''}
        ${invoice.customer.email ? `<p>Email: ${invoice.customer.email}</p>` : ''}
        ${invoice.customer.ntn ? `<p>NTN: ${invoice.customer.ntn}</p>` : ''}
        ${invoice.customer.strn ? `<p>STRN: ${invoice.customer.strn}</p>` : ''}
      </div>
      <div class="info-box" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
        ${invoice.paymentTerms ? `<p><strong>Payment Terms:</strong> ${invoice.paymentTerms}</p>` : ''}
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40%;">Description</th>
          <th class="qty" style="width: 12%;">Qty</th>
          <th class="rate" style="width: 18%;">Unit Price</th>
          <th class="tax" style="width: 12%;">GST %</th>
          <th style="width: 18%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lineItems.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="qty">${item.quantity}</td>
            <td class="rate">${formatPKR(item.unitPrice)}</td>
            <td class="tax">${item.taxRate}%</td>
            <td>${formatPKR(item.lineTotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row subtotal">
          <span>Subtotal</span>
          <span>${formatPKR(invoice.subtotal)}</span>
        </div>
        <div class="totals-row tax">
          <span>GST (Sales Tax)</span>
          <span>${formatPKR(invoice.taxAmount)}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>${formatPKR(invoice.total)}</span>
        </div>
        ${invoice.amountPaid > 0 ? `
          <div class="totals-row paid">
            <span>Amount Paid</span>
            <span>-${formatPKR(invoice.amountPaid)}</span>
          </div>
        ` : ''}
        ${invoice.balance > 0 ? `
          <div class="totals-row balance">
            <span>Balance Due</span>
            <span>${formatPKR(invoice.balance)}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      ${invoice.bankDetails ? `
        <div class="bank-details">
          <h4>Payment Information</h4>
          <p><strong>Bank:</strong> ${invoice.bankDetails.bankName}</p>
          <p><strong>Account Number:</strong> ${invoice.bankDetails.accountNumber}</p>
          ${invoice.bankDetails.iban ? `<p><strong>IBAN:</strong> ${invoice.bankDetails.iban}</p>` : ''}
        </div>
      ` : ''}
      
      ${invoice.notes ? `
        <p class="notes"><strong>Notes:</strong> ${invoice.notes}</p>
      ` : ''}

      <div class="fbr-compliance">
        <p>This invoice is generated in compliance with FBR (Federal Board of Revenue) Pakistan requirements.</p>
        <p>Please quote the invoice number for all correspondence.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate invoice data from database record
 * Utility function to transform DB invoice to PDF format
 */
export function transformInvoiceToPDFData(
  invoice: any,
  organization: any,
  customer: any,
  lineItems: any[]
): InvoiceData {
  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    organization: {
      name: organization.name,
      address: [
        organization.address,
        organization.city,
        organization.state,
        organization.country,
      ].filter(Boolean).join(', '),
      phone: organization.phone || 'N/A',
      email: organization.email || 'N/A',
      ntn: organization.taxId || 'N/A',
      strn: organization.strn,
      logo: organization.logo,
    },
    customer: {
      name: customer.companyName || `${customer.firstName} ${customer.lastName}`,
      address: [
        customer.billingAddress,
        customer.billingCity,
        customer.billingState,
        customer.billingCountry,
      ].filter(Boolean).join(', '),
      phone: customer.phone,
      email: customer.email,
      ntn: customer.taxNumber,
      strn: customer.strn,
    },
    lineItems: lineItems.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 1,
      unitPrice: parseFloat(item.unitPrice) || 0,
      taxRate: parseFloat(item.taxRate) || 0,
      taxAmount: parseFloat(item.taxAmount) || 0,
      lineTotal: parseFloat(item.lineTotal) || 0,
    })),
    subtotal: parseFloat(invoice.subtotal) || 0,
    taxAmount: parseFloat(invoice.taxAmount) || 0,
    total: parseFloat(invoice.total) || 0,
    amountPaid: parseFloat(invoice.amountPaid) || 0,
    balance: parseFloat(invoice.balance) || 0,
    paymentTerms: invoice.paymentTerms,
    notes: invoice.notes,
    bankDetails: organization.bankName ? {
      bankName: organization.bankName,
      accountNumber: organization.bankAccountNumber,
      iban: organization.iban,
    } : undefined,
  };
}
