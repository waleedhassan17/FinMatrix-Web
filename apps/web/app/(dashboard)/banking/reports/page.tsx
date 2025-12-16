'use client';

// Banking Reports Page
// Outstanding checks, deposits in transit, reconciliation history

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle,
  Download,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Badge } from '@finmatrix/ui/components/badge';
import { Skeleton } from '@finmatrix/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui/components/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@finmatrix/ui/components/tabs';
import {
  fetchActiveBankAccounts,
  fetchOutstandingChecks,
  fetchDepositsInTransit,
  fetchReconciliations,
} from '@/actions/banking';

interface BankAccount {
  id: string;
  accountName: string;
  bankName?: string;
}

interface OutstandingItem {
  id: string;
  transactionDate: string;
  amount: string;
  description?: string;
  checkNumber?: string;
  referenceNumber?: string;
  payeeName?: string;
  daysOutstanding: number;
}

interface Reconciliation {
  id: string;
  bankAccountId: string;
  statementDate: string;
  statementEndingBalance: string;
  beginningBalance: string;
  clearedDeposits: string;
  clearedWithdrawals: string;
  status: string;
  completedAt?: string;
  completedBy?: string;
}

export default function ReportsPage() {
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>('');
  const [asOfDate, setAsOfDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = React.useState(true);

  const [outstandingChecks, setOutstandingChecks] = React.useState<OutstandingItem[]>([]);
  const [depositsInTransit, setDepositsInTransit] = React.useState<OutstandingItem[]>([]);
  const [reconciliations, setReconciliations] = React.useState<Reconciliation[]>([]);

  // Load accounts
  React.useEffect(() => {
    async function loadAccounts() {
      const result = await fetchActiveBankAccounts();
      if (result.success && result.data) {
        const accs = result.data as BankAccount[];
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      }
      setLoading(false);
    }
    loadAccounts();
  }, []);

  // Load report data when account or date changes
  React.useEffect(() => {
    if (selectedAccountId) {
      loadReportData();
    }
  }, [selectedAccountId, asOfDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [checksResult, depositsResult, reconcResult] = await Promise.all([
        fetchOutstandingChecks(selectedAccountId, asOfDate),
        fetchDepositsInTransit(selectedAccountId, asOfDate),
        fetchReconciliations(selectedAccountId),
      ]);

      if (checksResult.success && checksResult.data) {
        setOutstandingChecks(checksResult.data as OutstandingItem[]);
      }
      if (depositsResult.success && depositsResult.data) {
        setDepositsInTransit(depositsResult.data as OutstandingItem[]);
      }
      if (reconcResult.success && reconcResult.data) {
        const data = reconcResult.data as unknown as any[];
        setReconciliations(data.map((r) => ({
          id: r.id,
          bankAccountId: r.bankAccountId,
          statementDate: typeof r.statementDate === 'string' ? r.statementDate : r.statementDate?.toISOString?.() || '',
          statementEndingBalance: r.statementEndingBalance,
          beginningBalance: r.beginningBalance,
          clearedDeposits: r.clearedDeposits || '0',
          clearedWithdrawals: r.clearedWithdrawals || '0',
          status: r.status,
          completedAt: r.completedAt ? (typeof r.completedAt === 'string' ? r.completedAt : r.completedAt?.toISOString?.()) : undefined,
          completedBy: r.completedBy || undefined,
        })));
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `PKR ${Math.abs(num).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const totalOutstandingChecks = outstandingChecks.reduce(
    (sum, c) => sum + Math.abs(parseFloat(c.amount)),
    0
  );
  const totalDepositsInTransit = depositsInTransit.reduce(
    (sum, d) => sum + parseFloat(d.amount),
    0
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-200 bg-white">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/banking">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Banking
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Banking Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Outstanding checks, deposits in transit, and reconciliation history
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Label className="sr-only">Bank Account</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="asOfDate" className="text-sm text-slate-500">
              As of:
            </Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="outstanding">
            <TabsList className="mb-6">
              <TabsTrigger value="outstanding">Outstanding Items</TabsTrigger>
              <TabsTrigger value="history">Reconciliation History</TabsTrigger>
            </TabsList>

            <TabsContent value="outstanding" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-100">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Outstanding Checks</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(totalOutstandingChecks)}
                        </p>
                        <p className="text-xs text-slate-500">{outstandingChecks.length} items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Deposits in Transit</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(totalDepositsInTransit)}
                        </p>
                        <p className="text-xs text-slate-500">{depositsInTransit.length} items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Outstanding Checks Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Outstanding Checks</CardTitle>
                  <CardDescription>
                    Checks that have been recorded but not yet cleared the bank
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {outstandingChecks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                      <p>All checks have cleared</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Check #</TableHead>
                          <TableHead>Payee</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Days Out</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingChecks.map((check) => (
                          <TableRow key={check.id}>
                            <TableCell>
                              {new Date(check.transactionDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono">
                              {check.checkNumber || '—'}
                            </TableCell>
                            <TableCell>{check.payeeName || '—'}</TableCell>
                            <TableCell className="text-slate-500">
                              {check.description || '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600">
                              {formatCurrency(check.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={check.daysOutstanding > 30 ? 'destructive' : 'secondary'}
                              >
                                {check.daysOutstanding}d
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50 font-medium">
                          <TableCell colSpan={4}>Total</TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(totalOutstandingChecks)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Deposits in Transit Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deposits in Transit</CardTitle>
                  <CardDescription>
                    Deposits that have been recorded but not yet credited by the bank
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {depositsInTransit.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                      <p>All deposits have been credited</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Days Out</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {depositsInTransit.map((deposit) => (
                          <TableRow key={deposit.id}>
                            <TableCell>
                              {new Date(deposit.transactionDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono">
                              {deposit.referenceNumber || '—'}
                            </TableCell>
                            <TableCell>{deposit.payeeName || '—'}</TableCell>
                            <TableCell className="text-slate-500">
                              {deposit.description || '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600">
                              {formatCurrency(deposit.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={deposit.daysOutstanding > 5 ? 'destructive' : 'secondary'}
                              >
                                {deposit.daysOutstanding}d
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50 font-medium">
                          <TableCell colSpan={4}>Total</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(totalDepositsInTransit)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reconciliation History</CardTitle>
                  <CardDescription>
                    Past reconciliations for {selectedAccount?.accountName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reconciliations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                      <p>No reconciliations found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Statement Date</TableHead>
                          <TableHead>Beginning Balance</TableHead>
                          <TableHead>Deposits</TableHead>
                          <TableHead>Withdrawals</TableHead>
                          <TableHead>Ending Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reconciliations.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell>
                              {new Date(rec.statementDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(rec.beginningBalance)}
                            </TableCell>
                            <TableCell className="font-mono text-green-600">
                              {rec.clearedDeposits ? formatCurrency(rec.clearedDeposits) : '—'}
                            </TableCell>
                            <TableCell className="font-mono text-red-600">
                              {rec.clearedWithdrawals
                                ? formatCurrency(rec.clearedWithdrawals)
                                : '—'}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {formatCurrency(rec.statementEndingBalance)}
                            </TableCell>
                            <TableCell>
                              {rec.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : rec.status === 'in_progress' ? (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              ) : (
                                <Badge variant="outline">{rec.status}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {rec.completedAt
                                ? new Date(rec.completedAt).toLocaleDateString()
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
