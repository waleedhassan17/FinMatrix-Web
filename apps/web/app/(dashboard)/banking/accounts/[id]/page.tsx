'use client';

// Bank Account Register Page
// View account transactions with running balance

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Landmark,
  ChevronLeft,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  FileCheck,
  Download,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@finmatrix/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@finmatrix/ui/components/popover';
import { 
  fetchBankAccountById, 
  fetchAccountRegister, 
  recordDeposit, 
  writeCheck, 
  createBankTransaction 
} from '@/actions/banking';

interface Transaction {
  id: string;
  transactionDate: string;
  transactionType: string;
  amount: string;
  description?: string;
  referenceNumber?: string;
  checkNumber?: string;
  payeeName?: string;
  isReconciled: boolean;
  runningBalance: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  accountType: string;
  currentBalance: string;
  openingBalance: string;
  status: string;
  lastReconciledDate?: string;
  lastReconciledBalance?: string;
}

function DepositDialog({ 
  accountId, 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  accountId: string;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    transactionDate: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    referenceNumber: '',
    payerName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await recordDeposit({
        bankAccountId: accountId,
        transactionDate: formData.transactionDate,
        amount: parseFloat(formData.amount),
        description: formData.description,
        referenceNumber: formData.referenceNumber,
        payerName: formData.payerName,
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        transactionDate: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        referenceNumber: '',
        payerName: '',
      });
    } catch (error) {
      console.error('Error recording deposit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Deposit</DialogTitle>
            <DialogDescription>Record a deposit to this bank account</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="depositDate">Date *</Label>
                <Input
                  id="depositDate"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depositAmount">Amount (PKR) *</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="depositDesc">Description</Label>
              <Input
                id="depositDesc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Customer payment"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="depositRef">Reference Number</Label>
                <Input
                  id="depositRef"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g., Receipt #"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depositPayer">Received From</Label>
                <Input
                  id="depositPayer"
                  value={formData.payerName}
                  onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                  placeholder="Payer name"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Deposit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CheckDialog({ 
  accountId, 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  accountId: string;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    transactionDate: new Date().toISOString().split('T')[0],
    amount: '',
    checkNumber: '',
    payeeName: '',
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await writeCheck({
        bankAccountId: accountId,
        transactionDate: formData.transactionDate,
        amount: parseFloat(formData.amount),
        checkNumber: formData.checkNumber,
        payeeName: formData.payeeName,
        memo: formData.memo,
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        transactionDate: new Date().toISOString().split('T')[0],
        amount: '',
        checkNumber: '',
        payeeName: '',
        memo: '',
      });
    } catch (error) {
      console.error('Error writing check:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Write Check</DialogTitle>
            <DialogDescription>Record a check payment from this account</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkDate">Date *</Label>
                <Input
                  id="checkDate"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkNumber">Check Number *</Label>
                <Input
                  id="checkNumber"
                  value={formData.checkNumber}
                  onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  placeholder="e.g., 1001"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkPayee">Pay To *</Label>
                <Input
                  id="checkPayee"
                  value={formData.payeeName}
                  onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                  placeholder="Payee name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkAmount">Amount (PKR) *</Label>
                <Input
                  id="checkAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkMemo">Memo</Label>
              <Input
                id="checkMemo"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="e.g., For supplies"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Check'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountRegisterPage() {
  const params = useParams();
  const accountId = params.id as string;

  const [account, setAccount] = React.useState<BankAccount | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [depositOpen, setDepositOpen] = React.useState(false);
  const [checkOpen, setCheckOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState({
    startDate: '',
    endDate: '',
  });

  const loadData = async () => {
    try {
      const [accountResult, registerResult] = await Promise.all([
        fetchBankAccountById(accountId),
        fetchAccountRegister(accountId, {
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
        }),
      ]);

      if (accountResult.success && accountResult.data) {
        setAccount(accountResult.data as BankAccount);
      }
      if (registerResult.success && registerResult.data) {
        setTransactions(registerResult.data as Transaction[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [accountId, dateRange.startDate, dateRange.endDate]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const isNegative = num < 0;
    return (
      <span className={cn(isNegative && 'text-red-600')}>
        {isNegative ? '-' : ''}PKR {Math.abs(num).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
      </span>
    );
  };

  const getTransactionIcon = (type: string) => {
    if (['deposit', 'transfer_in', 'receipt', 'interest'].includes(type)) {
      return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    }
    if (['withdrawal', 'transfer_out', 'check', 'fee', 'payment'].includes(type)) {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    }
    return <ArrowRightLeft className="h-4 w-4 text-slate-600" />;
  };

  if (loading) {
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

  if (!account) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-slate-500">Account not found</p>
        <Button asChild className="mt-4">
          <Link href="/banking/accounts">Back to Accounts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/banking/accounts">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Accounts
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-slate-100">
              <Landmark className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{account.accountName}</h1>
              <p className="text-sm text-slate-500">
                {account.bankName && `${account.bankName} • `}
                <span className="capitalize">{account.accountType.replace('_', ' ')}</span>
                {account.accountNumber && ` • ...${account.accountNumber}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Current Balance</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => setDepositOpen(true)}>
              <ArrowDownRight className="h-4 w-4 mr-2 text-green-600" />
              Deposit
            </Button>
            <Button variant="outline" onClick={() => setCheckOpen(true)}>
              <ArrowUpRight className="h-4 w-4 mr-2 text-red-600" />
              Check
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/banking/reconcile?account=${accountId}`}>
                <FileCheck className="h-4 w-4 mr-2" />
                Reconcile
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ startDate: '', endDate: '' })}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Register Table */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Account Register</CardTitle>
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              {dateRange.startDate && dateRange.endDate && (
                <> from {dateRange.startDate} to {dateRange.endDate}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No transactions yet</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Record a deposit or check to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[60px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const amount = parseFloat(tx.amount);
                    const isDebit = amount < 0;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.transactionType)}
                            <span className="capitalize text-sm">
                              {tx.transactionType.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-slate-900">
                              {tx.description || tx.payeeName || '—'}
                            </p>
                            {tx.checkNumber && (
                              <p className="text-xs text-slate-500">Check #{tx.checkNumber}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {tx.referenceNumber || tx.checkNumber || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-600">
                          {isDebit
                            ? Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-600">
                          {!isDebit
                            ? amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {parseFloat(tx.runningBalance).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {tx.isReconciled ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-slate-400" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <DepositDialog
        accountId={accountId}
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onSuccess={loadData}
      />
      <CheckDialog
        accountId={accountId}
        open={checkOpen}
        onOpenChange={setCheckOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
