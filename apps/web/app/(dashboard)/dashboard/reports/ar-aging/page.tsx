'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Loader2,
  FileText,
  Filter,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import { Badge } from '@finmatrix/ui/components/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui/components/table';
import { fetchARAgingReport } from '@/actions/ar';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

// Use the actual type structure from the database
interface AgingRow {
  customerId: string;
  customerNumber: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  total: number;
  invoiceCount: number;
}

interface AgingSummary {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  total: number;
}

function AgingBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  
  const severity = label.includes('90') ? 'danger' : 
                   label.includes('61') ? 'warning' : 
                   label.includes('31') ? 'caution' : 'default';
  
  const colors = {
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    caution: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    default: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <Badge className={cn('font-normal', colors[severity])}>
      {formatCurrency(value)}
    </Badge>
  );
}

export default function ARAgingReportPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [agingData, setAgingData] = useState<AgingRow[]>([]);
  const [summary, setSummary] = useState<AgingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  useEffect(() => {
    loadReport();
  }, [asOfDate]);

  async function loadReport() {
    setIsLoading(true);
    try {
      const result = await fetchARAgingReport(asOfDate);
      if (result.success && result.data) {
        // Map the data to our local type
        const rows = (result.data.rows || []).map((row: any) => ({
          customerId: row.customerId,
          customerNumber: row.customerNumber,
          companyName: row.companyName,
          contactName: row.contactName,
          phone: row.phone,
          email: row.email,
          current: row.current,
          days1_30: row.days1_30,
          days31_60: row.days31_60,
          days61_90: row.days61_90,
          days90Plus: row.days90Plus,
          total: row.total,
          invoiceCount: row.invoiceCount,
        }));
        setAgingData(rows);
        
        // Map totals to summary
        if (result.data.totals) {
          setSummary({
            current: result.data.totals.current,
            days1_30: result.data.totals.days1_30,
            days31_60: result.data.totals.days31_60,
            days61_90: result.data.totals.days61_90,
            days90Plus: result.data.totals.days90Plus,
            total: result.data.totals.total,
          });
        }
      }
    } catch (error) {
      console.error('Error loading aging report:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredData = showZeroBalances 
    ? agingData 
    : agingData.filter(row => row.total > 0);

  // Calculate percentages for the summary
  const totalBalance = summary?.total || 0;
  const getPercentage = (value: number) => 
    totalBalance > 0 ? ((value / totalBalance) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/reports"
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AR Aging Report</h1>
              <p className="mt-1 text-sm text-slate-500">
                Accounts Receivable aging analysis as of {formatDate(asOfDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="asOfDate" className="text-xs text-slate-500">As of Date</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadReport}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showZeroBalances}
              onChange={(e) => setShowZeroBalances(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show zero balances
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="col-span-2 md:col-span-1 bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase">Current</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-700">
                      {formatCurrency(summary.current)}
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">
                      {getPercentage(summary.current)}% of total
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-blue-600 uppercase mb-2">1-30 Days</div>
                    <div className="text-xl font-bold text-blue-700">
                      {formatCurrency(summary.days1_30)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {getPercentage(summary.days1_30)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-yellow-600 uppercase mb-2">31-60 Days</div>
                    <div className="text-xl font-bold text-yellow-700">
                      {formatCurrency(summary.days31_60)}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {getPercentage(summary.days31_60)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-amber-600 uppercase mb-2">61-90 Days</div>
                    <div className="text-xl font-bold text-amber-700">
                      {formatCurrency(summary.days61_90)}
                    </div>
                    <div className="text-xs text-amber-600 mt-1">
                      {getPercentage(summary.days61_90)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-rose-50 border-rose-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 text-rose-600 mb-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium uppercase">90+ Days</span>
                    </div>
                    <div className="text-xl font-bold text-rose-700">
                      {formatCurrency(summary.days90Plus)}
                    </div>
                    <div className="text-xs text-rose-600 mt-1">
                      {getPercentage(summary.days90Plus)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2 md:col-span-1 bg-slate-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-300 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase">Total AR</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(summary.total)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {filteredData.length} customers
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Aging Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Customer Aging Detail
                </CardTitle>
                <CardDescription>
                  Breakdown of receivables by customer and aging bucket
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No outstanding receivables</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Customer</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">1-30 Days</TableHead>
                          <TableHead className="text-right">31-60 Days</TableHead>
                          <TableHead className="text-right">61-90 Days</TableHead>
                          <TableHead className="text-right">90+ Days</TableHead>
                          <TableHead className="text-right font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((row) => {
                          const hasOverdue = row.days31_60 > 0 || row.days61_90 > 0 || row.days90Plus > 0;
                          return (
                            <TableRow 
                              key={row.customerId}
                              className={cn(
                                'cursor-pointer hover:bg-slate-50',
                                row.days90Plus > 0 && 'bg-rose-50/30'
                              )}
                              onClick={() => window.location.href = `/dashboard/customers/${row.customerId}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {row.companyName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {row.customerNumber}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {row.current > 0 ? (
                                  <span className="text-emerald-600">{formatCurrency(row.current)}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.days1_30 > 0 ? (
                                  <span className="text-blue-600">{formatCurrency(row.days1_30)}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.days31_60 > 0 ? (
                                  <span className="text-yellow-600 font-medium">{formatCurrency(row.days31_60)}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.days61_90 > 0 ? (
                                  <span className="text-amber-600 font-medium">{formatCurrency(row.days61_90)}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.days90Plus > 0 ? (
                                  <span className="text-rose-600 font-bold">{formatCurrency(row.days90Plus)}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  'font-bold',
                                  hasOverdue ? 'text-slate-900' : 'text-emerald-600'
                                )}>
                                  {formatCurrency(row.total)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Total Row */}
                        {summary && (
                          <TableRow className="bg-slate-100 font-bold">
                            <TableCell>
                              <span className="text-slate-900">TOTAL</span>
                            </TableCell>
                            <TableCell className="text-right text-emerald-700">
                              {formatCurrency(summary.current)}
                            </TableCell>
                            <TableCell className="text-right text-blue-700">
                              {formatCurrency(summary.days1_30)}
                            </TableCell>
                            <TableCell className="text-right text-yellow-700">
                              {formatCurrency(summary.days31_60)}
                            </TableCell>
                            <TableCell className="text-right text-amber-700">
                              {formatCurrency(summary.days61_90)}
                            </TableCell>
                            <TableCell className="text-right text-rose-700">
                              {formatCurrency(summary.days90Plus)}
                            </TableCell>
                            <TableCell className="text-right text-slate-900 text-lg">
                              {formatCurrency(summary.total)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Print-only Footer */}
            <div className="hidden print:block text-center text-xs text-slate-400 mt-8 pt-4 border-t">
              <p>Generated on {new Date().toLocaleString()}</p>
              <p>FinMatrix - AR Aging Report</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
