import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@finmatrix/auth';
import { db, getInvoiceById } from '@finmatrix/db';
import { generateInvoiceHTML, transformInvoiceToPDFData, type InvoiceData } from '@/lib/pdf/invoice-pdf';

// Dynamic route handler for invoice PDF generation
export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.currentOrganizationId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No organization selected' }, { status: 400 });
    }

    const { invoiceId } = params;
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Fetch invoice data from database (includes lineItems)
    const invoiceResult = await getInvoiceById(db, tenantId, invoiceId);
    if (!invoiceResult) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Line items are already included in invoiceResult
    const lineItems = invoiceResult.lineItems || [];

    // For now, create mock organization data
    // In production, this would come from the organizations table
    const organization = {
      name: session.user.currentOrganizationSlug || 'FinMatrix Company',
      address: 'Karachi, Pakistan',
      phone: '+92 21 12345678',
      email: session.user.email || 'info@finmatrix.pk',
      taxId: 'NTN-0000000-0',
      strn: 'STRN-00-00-0000-000-00',
      bankName: 'MCB Bank Limited',
      bankAccountNumber: '0123456789',
      iban: 'PK00MCBL0000000000000000',
    };

    // Get customer data from invoice
    const customer = {
      companyName: invoiceResult.customerName || 'Customer',
      billingAddress: invoiceResult.billingAddress || '',
      billingCity: '',
      billingState: '',
      billingCountry: 'Pakistan',
      phone: '',
      email: '',
      taxNumber: '',
    };

    // Transform to PDF format
    const pdfData: InvoiceData = transformInvoiceToPDFData(
      invoiceResult,
      organization,
      customer,
      lineItems || []
    );

    // Generate HTML
    const html = generateInvoiceHTML(pdfData);

    // Check format query param
    const format = request.nextUrl.searchParams.get('format');
    
    if (format === 'html') {
      // Return HTML for preview
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Return HTML with print dialog for PDF download
    const printableHtml = `
      ${html}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    `;

    return new NextResponse(printableHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Invoice-${pdfData.invoiceNumber}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}

// POST method to generate PDF from provided data (for preview)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceData: InvoiceData = await request.json();
    
    if (!invoiceData.invoiceNumber) {
      return NextResponse.json({ error: 'Invoice data required' }, { status: 400 });
    }

    const html = generateInvoiceHTML(invoiceData);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}
