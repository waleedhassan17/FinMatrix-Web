'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@finmatrix/ui';
import { Button } from '@finmatrix/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui';
import {
  ArrowLeft,
  Download,
  Loader2,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { fetchAPAgingReport } from '@/actions/ap';
import type { APAgingReport } from '@finmatrix/db';

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function APAgingReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<APAgingReport | null>(null);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAPAgingReport(reportDate);
      setReport(data);
    } catch (err) {
      console.error('Error loading AP aging report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportDate]);

  const handleExportCSV = () => {
    if (!report) return;

    const headers = [
      'Vendor',
      'Vendor Number',
      'Current',
      '1-30 Days',
      '31-60 Days',
      '61-90 Days',
      'Over 90 Days',
      'Total Payable',
    ];

    const rows = report.rows.map((row) => [
      row.vendorName,
      row.vendorNumber,
      row.current,
      row.days1_30,
      row.days31_60,
      row.days61_90,
      row.over90,
      row.total,
    ]);

    const totals = [
      'TOTALS',
      '',
      report.totals.current,
      report.totals.days1_30,
      report.totals.days31_60,
      report.totals.days61_90,
      report.totals.over90,
      report.totals.total,
    ];

    const csvContent = [headers, ...rows, totals]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ap-aging-report-${reportDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getOverduePercentage = (): number => {
    if (!report || parseFloat(report.totals.total) === 0) return 0;
    const overdue =
      parseFloat(report.totals.days1_30) +
      parseFloat(report.totals.days31_60) +
      parseFloat(report.totals.days61_90) +
      parseFloat(report.totals.over90);
    return Math.round((overdue / parseFloat(report.totals.total)) * 100);
  };

  const getSeriouslyOverdue = (): number => {
    if (!report) return 0;
    return parseFloat(report.totals.days61_90) + parseFloat(report.totals.over90);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AP Aging Report</h1>
            <p className="text-muted-foreground">
              Accounts Payable aging by vendor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadReport} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={!report}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">As of Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(report?.totals.total || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {report?.rows.length || 0} vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(report?.totals.current || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Not yet due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue %</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${getOverduePercentage()}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Past payment terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seriously Overdue</CardTitle>
            <div className="h-3 w-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(getSeriouslyOverdue())
              )}
            </div>
            <p className="text-xs text-muted-foreground">Over 60 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aging by Vendor</CardTitle>
          <CardDescription>
            Detailed breakdown of payables by aging period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !report || report.rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No outstanding payables found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">1-30 Days</TableHead>
                  <TableHead className="text-right">31-60 Days</TableHead>
                  <TableHead className="text-right">61-90 Days</TableHead>
                  <TableHead className="text-right">Over 90</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row) => (
                  <TableRow key={row.vendorId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/vendors/${row.vendorId}`}
                        className="hover:underline"
                      >
                        <div className="font-medium">{row.vendorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.vendorNumber}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {parseFloat(row.current) > 0 ? formatCurrency(row.current) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {parseFloat(row.days1_30) > 0 ? formatCurrency(row.days1_30) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {parseFloat(row.days31_60) > 0 ? formatCurrency(row.days31_60) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {parseFloat(row.days61_90) > 0 ? formatCurrency(row.days61_90) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-700 font-medium">
                      {parseFloat(row.over90) > 0 ? formatCurrency(row.over90) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTALS</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(report.totals.current)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {formatCurrency(report.totals.days1_30)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(report.totals.days31_60)}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    {formatCurrency(report.totals.days61_90)}
                  </TableCell>
                  <TableCell className="text-right text-red-700">
                    {formatCurrency(report.totals.over90)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(report.totals.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
