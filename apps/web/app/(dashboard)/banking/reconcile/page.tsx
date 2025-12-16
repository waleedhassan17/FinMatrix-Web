'use client';

// Bank Reconciliation Workflow Page
// Side-by-side view for matching bank statement to book transactions

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Check,
  X,
  AlertCircle,
  Landmark,
  Calculator,
  CheckCircle,
  Clock,
  Minus,
  Plus,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Badge } from '@finmatrix/ui/components/badge';
import { Skeleton } from '@finmatrix/ui/components/skeleton';
import { Checkbox } from '@finmatrix/ui/components/checkbox';
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
import { Alert, AlertDescription } from '@finmatrix/ui/components/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@finmatrix/ui/components/dialog';
import {
  fetchActiveBankAccounts,
  fetchInProgressReconciliation,
  fetchReconciliationItems,
  calculateReconciliationSummary,
  startReconciliation,
  toggleReconciliationItem,
  completeReconciliation,
  cancelReconciliation,
} from '@/actions/banking';

interface BankAccount {
  id: string;
  accountName: string;
  bankName?: string;
  currentBalance: string;
  lastReconciledBalance?: string;
  lastReconciledDate?: string;
}

interface ReconciliationItem {
  id: string;
  bankTransactionId: string;
  isCleared: boolean;
  transaction: {
    id: string;
    transactionDate: string;
    transactionType: string;
    amount: string;
    description?: string;
    checkNumber?: string;
    referenceNumber?: string;
    payeeName?: string;
  };
}

interface ReconciliationSummary {
  beginningBalance: number;
  clearedDeposits: number;
  clearedWithdrawals: number;
  clearedBalance: number;
  statementEndingBalance: number;
  difference: number;
}

interface Reconciliation {
  id: string;
  bankAccountId: string;
  statementDate: string;
  statementEndingBalance: string;
  beginningBalance: string;
  status: string;
}

export default function ReconcilePage() {
  const searchParams = useSearchParams();
  const preselectedAccount = searchParams.get('account');

  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>(preselectedAccount || '');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Reconciliation state
  const [reconciliation, setReconciliation] = React.useState<Reconciliation | null>(null);
  const [items, setItems] = React.useState<ReconciliationItem[]>([]);
  const [summary, setSummary] = React.useState<ReconciliationSummary | null>(null);

  // New reconciliation dialog
  const [showStartDialog, setShowStartDialog] = React.useState(false);
  const [startForm, setStartForm] = React.useState({
    statementDate: new Date().toISOString().split('T')[0],
    statementEndingBalance: '',
  });

  // Load accounts
  React.useEffect(() => {
    async function loadAccounts() {
      const result = await fetchActiveBankAccounts();
      if (result.success && result.data) {
        setAccounts(result.data as BankAccount[]);
      }
      setLoading(false);
    }
    loadAccounts();
  }, []);

  // Load reconciliation when account changes
  React.useEffect(() => {
    if (selectedAccountId) {
      loadReconciliation();
    } else {
      setReconciliation(null);
      setItems([]);
      setSummary(null);
    }
  }, [selectedAccountId]);

  const loadReconciliation = async () => {
    if (!selectedAccountId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchInProgressReconciliation(selectedAccountId);
      if (result.success && result.data) {
        setReconciliation(result.data as Reconciliation);
        await loadItems((result.data as Reconciliation).id);
      } else {
        setReconciliation(null);
        setItems([]);
        setSummary(null);
      }
    } catch (err) {
      console.error('Error loading reconciliation:', err);
      setError('Failed to load reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (reconciliationId: string) => {
    const [itemsResult, summaryResult] = await Promise.all([
      fetchReconciliationItems(reconciliationId),
      calculateReconciliationSummary(reconciliationId),
    ]);

    if (itemsResult.success && itemsResult.data) {
      setItems(
        (itemsResult.data as { item: any; transaction: any }[]).map((i) => ({
          id: i.item.id,
          bankTransactionId: i.item.bankTransactionId,
          isCleared: i.item.isCleared,
          transaction: i.transaction,
        }))
      );
    }

    if (summaryResult.success && summaryResult.data) {
      setSummary(summaryResult.data as ReconciliationSummary);
    }
  };

  const handleStartReconciliation = async () => {
    if (!selectedAccountId || !startForm.statementEndingBalance) return;

    setError(null);
    const result = await startReconciliation({
      bankAccountId: selectedAccountId,
      statementDate: startForm.statementDate,
      statementEndingBalance: parseFloat(startForm.statementEndingBalance),
    });

    if (result.success) {
      setShowStartDialog(false);
      await loadReconciliation();
    } else {
      setError(result.error || 'Failed to start reconciliation');
    }
  };

  const handleToggleItem = async (itemId: string, isCleared: boolean) => {
    const result = await toggleReconciliationItem(itemId, isCleared);
    if (result.success && reconciliation) {
      // Update local state optimistically
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isCleared } : item))
      );
      // Recalculate summary
      const summaryResult = await calculateReconciliationSummary(reconciliation.id);
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data as ReconciliationSummary);
      }
    }
  };

  const handleComplete = async () => {
    if (!reconciliation) return;

    setError(null);
    const result = await completeReconciliation(reconciliation.id);
    if (result.success) {
      setReconciliation(null);
      setItems([]);
      setSummary(null);
      // Optionally show success message or redirect
    } else {
      setError(result.error || 'Failed to complete reconciliation');
    }
  };

  const handleCancel = async () => {
    if (!reconciliation) return;

    const result = await cancelReconciliation(reconciliation.id);
    if (result.success) {
      setReconciliation(null);
      setItems([]);
      setSummary(null);
    }
  };

  const selectAllDeposits = () => {
    items
      .filter((i) => parseFloat(i.transaction.amount) > 0 && !i.isCleared)
      .forEach((i) => handleToggleItem(i.id, true));
  };

  const selectAllWithdrawals = () => {
    items
      .filter((i) => parseFloat(i.transaction.amount) < 0 && !i.isCleared)
      .forEach((i) => handleToggleItem(i.id, true));
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `PKR ${Math.abs(num).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const deposits = items.filter((i) => parseFloat(i.transaction.amount) > 0);
  const withdrawals = items.filter((i) => parseFloat(i.transaction.amount) < 0);

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
            <h1 className="text-2xl font-bold text-slate-900">Bank Reconciliation</h1>
            <p className="mt-1 text-sm text-slate-500">
              Match your bank statement to your book records
            </p>
          </div>
          {reconciliation && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={summary?.difference !== 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Reconciliation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Account Selection & Summary Bar */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
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
            {selectedAccount && !reconciliation && (
              <Button onClick={() => setShowStartDialog(true)}>
                Start Reconciliation
              </Button>
            )}
          </div>
          {reconciliation && summary && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500">Statement Date</p>
                <p className="font-medium">
                  {new Date(reconciliation.statementDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Statement Balance</p>
                <p className="font-medium">{formatCurrency(reconciliation.statementEndingBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Cleared Balance</p>
                <p className="font-medium">{formatCurrency(summary.clearedBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Difference</p>
                <p
                  className={cn(
                    'font-bold text-lg',
                    summary.difference === 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {summary.difference === 0 ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Balanced
                    </span>
                  ) : (
                    formatCurrency(summary.difference)
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedAccountId && (
          <div className="text-center py-12">
            <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Select a Bank Account</h3>
            <p className="text-sm text-slate-500 mt-1">
              Choose a bank account to start or continue reconciliation
            </p>
          </div>
        )}

        {selectedAccountId && !reconciliation && !loading && (
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Active Reconciliation</h3>
            <p className="text-sm text-slate-500 mt-1">
              Start a new reconciliation for {selectedAccount?.accountName}
            </p>
            <Button onClick={() => setShowStartDialog(true)} className="mt-4">
              Start Reconciliation
            </Button>
          </div>
        )}

        {reconciliation && summary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deposits (Credits) */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      Deposits (Credits)
                    </CardTitle>
                    <CardDescription>
                      {deposits.filter((d) => d.isCleared).length} of {deposits.length} cleared
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllDeposits}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                            No unreconciled deposits
                          </TableCell>
                        </TableRow>
                      ) : (
                        deposits.map((item) => (
                          <TableRow
                            key={item.id}
                            className={cn(item.isCleared && 'bg-green-50')}
                          >
                            <TableCell>
                              <Checkbox
                                checked={item.isCleared}
                                onCheckedChange={(checked) =>
                                  handleToggleItem(item.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(item.transaction.transactionDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {item.transaction.description ||
                                  item.transaction.payeeName ||
                                  '—'}
                              </div>
                              {item.transaction.referenceNumber && (
                                <div className="text-xs text-slate-500">
                                  Ref: {item.transaction.referenceNumber}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-green-600">
                              {formatCurrency(item.transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 flex justify-between text-sm font-medium">
                  <span>Cleared Deposits:</span>
                  <span className="text-green-600">{formatCurrency(summary.clearedDeposits)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawals (Debits) */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Minus className="h-5 w-5 text-red-600" />
                      Withdrawals (Debits)
                    </CardTitle>
                    <CardDescription>
                      {withdrawals.filter((w) => w.isCleared).length} of {withdrawals.length} cleared
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllWithdrawals}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                            No unreconciled withdrawals
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((item) => (
                          <TableRow
                            key={item.id}
                            className={cn(item.isCleared && 'bg-green-50')}
                          >
                            <TableCell>
                              <Checkbox
                                checked={item.isCleared}
                                onCheckedChange={(checked) =>
                                  handleToggleItem(item.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(item.transaction.transactionDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {item.transaction.checkNumber
                                  ? `Check #${item.transaction.checkNumber}`
                                  : item.transaction.description ||
                                    item.transaction.payeeName ||
                                    '—'}
                              </div>
                              {item.transaction.referenceNumber && (
                                <div className="text-xs text-slate-500">
                                  Ref: {item.transaction.referenceNumber}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-red-600">
                              {formatCurrency(Math.abs(parseFloat(item.transaction.amount)))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 flex justify-between text-sm font-medium">
                  <span>Cleared Withdrawals:</span>
                  <span className="text-red-600">{formatCurrency(summary.clearedWithdrawals)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Reconciliation Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Reconciliation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Beginning Balance</p>
                    <p className="text-lg font-semibold">{formatCurrency(summary.beginningBalance)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-green-700">+ Cleared Deposits</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(summary.clearedDeposits)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-sm text-red-700">- Cleared Withdrawals</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(summary.clearedWithdrawals)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-700">= Cleared Balance</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(summary.clearedBalance)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-4 rounded-lg text-center',
                      summary.difference === 0 ? 'bg-green-100' : 'bg-red-100'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm',
                        summary.difference === 0 ? 'text-green-700' : 'text-red-700'
                      )}
                    >
                      Difference
                    </p>
                    <p
                      className={cn(
                        'text-xl font-bold',
                        summary.difference === 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {summary.difference === 0 ? (
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircle className="h-5 w-5" />
                          0.00
                        </span>
                      ) : (
                        formatCurrency(summary.difference)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Start Reconciliation Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Reconciliation</DialogTitle>
            <DialogDescription>
              Enter the ending date and balance from your bank statement
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Bank Account</Label>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedAccount?.accountName}</p>
                {selectedAccount?.lastReconciledDate && (
                  <p className="text-sm text-slate-500">
                    Last reconciled:{' '}
                    {new Date(selectedAccount.lastReconciledDate).toLocaleDateString()} (Balance:{' '}
                    {formatCurrency(selectedAccount.lastReconciledBalance || 0)})
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="statementDate">Statement Date *</Label>
                <Input
                  id="statementDate"
                  type="date"
                  value={startForm.statementDate}
                  onChange={(e) =>
                    setStartForm({ ...startForm, statementDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="statementBalance">Statement Ending Balance (PKR) *</Label>
                <Input
                  id="statementBalance"
                  type="number"
                  step="0.01"
                  value={startForm.statementEndingBalance}
                  onChange={(e) =>
                    setStartForm({ ...startForm, statementEndingBalance: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartReconciliation}
              disabled={!startForm.statementEndingBalance}
            >
              Start Reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
