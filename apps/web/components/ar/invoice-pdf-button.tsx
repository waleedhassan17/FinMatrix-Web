'use client';

import { useState } from 'react';
import { Button } from '@finmatrix/ui';
import { FileDown, Loader2, Printer, Eye } from 'lucide-react';

interface InvoicePDFButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  mode?: 'download' | 'print' | 'preview';
}

export function InvoicePDFButton({
  invoiceId,
  invoiceNumber,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  mode = 'download',
}: InvoicePDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const format = mode === 'preview' ? 'html' : '';
      const url = `/api/invoices/${invoiceId}/pdf${format ? `?format=${format}` : ''}`;
      
      if (mode === 'preview') {
        // Open in new tab for preview
        window.open(url, '_blank');
      } else {
        // Open print dialog
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.focus();
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    switch (mode) {
      case 'print':
        return <Printer className="h-4 w-4" />;
      case 'preview':
        return <Eye className="h-4 w-4" />;
      default:
        return <FileDown className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (mode) {
      case 'print':
        return 'Print';
      case 'preview':
        return 'Preview';
      default:
        return 'PDF';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      title={`${getLabel()} Invoice ${invoiceNumber}`}
    >
      {getIcon()}
      {showLabel && <span className="ml-2">{getLabel()}</span>}
    </Button>
  );
}

/**
 * Dropdown menu with all PDF options
 */
interface InvoicePDFActionsProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function InvoicePDFActions({ invoiceId, invoiceNumber }: InvoicePDFActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <InvoicePDFButton
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        mode="preview"
        variant="ghost"
        size="icon"
        showLabel={false}
      />
      <InvoicePDFButton
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        mode="print"
        variant="ghost"
        size="icon"
        showLabel={false}
      />
      <InvoicePDFButton
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        mode="download"
        variant="outline"
        size="sm"
        showLabel={true}
      />
    </div>
  );
}

export default InvoicePDFButton;
