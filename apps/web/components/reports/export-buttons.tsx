'use client';

import { useState } from 'react';
import { Button } from '@finmatrix/ui';
import { FileSpreadsheet, Loader2, Download } from 'lucide-react';
import { 
  downloadARAgingReport, 
  downloadAPAgingReport,
  downloadCSV,
  generateGenericCSV,
  type ARAgingExportData,
  type APAgingExportData,
  type GenericExportColumn,
} from '@/lib/export/excel-export';

// ============================================================================
// AR Aging Export Button
// ============================================================================

interface ARAgingExportButtonProps {
  fetchData: () => Promise<ARAgingExportData>;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ARAgingExportButton({
  fetchData,
  variant = 'outline',
  size = 'sm',
}: ARAgingExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData();
      downloadARAgingReport(data);
    } catch (error) {
      console.error('Error exporting AR aging report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isLoading}
      title="Export AR Aging Report to Excel"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      <span className="ml-2">Export Excel</span>
    </Button>
  );
}

// ============================================================================
// AP Aging Export Button
// ============================================================================

interface APAgingExportButtonProps {
  fetchData: () => Promise<APAgingExportData>;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function APAgingExportButton({
  fetchData,
  variant = 'outline',
  size = 'sm',
}: APAgingExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData();
      downloadAPAgingReport(data);
    } catch (error) {
      console.error('Error exporting AP aging report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isLoading}
      title="Export AP Aging Report to Excel"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      <span className="ml-2">Export Excel</span>
    </Button>
  );
}

// ============================================================================
// Generic Export Button
// ============================================================================

interface GenericExportButtonProps<T extends Record<string, any>> {
  data: T[];
  columns: GenericExportColumn<T>[];
  filename: string;
  title?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  title,
  label = 'Export',
  variant = 'outline',
  size = 'sm',
}: GenericExportButtonProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const csv = generateGenericCSV(data, columns, title);
      downloadCSV(csv, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isLoading || data.length === 0}
      title={`Export to Excel/CSV`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-2">{label}</span>
    </Button>
  );
}

export default ExportButton;
