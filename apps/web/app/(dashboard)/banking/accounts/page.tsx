'use client';

// Bank Accounts Management Page
// List all bank accounts with CRUD operations

import * as React from 'react';
import Link from 'next/link';
import {
  Landmark,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@finmatrix/ui/components/dropdown-menu';
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
import { Label } from '@finmatrix/ui/components/label';
import { Textarea } from '@finmatrix/ui/components/textarea';
import { fetchBankAccounts, createBankAccount, updateBankAccount } from '@/actions/banking';

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
  unreconciledCount?: number;
}

const accountTypeOptions = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'money_market', label: 'Money Market' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'line_of_credit', label: 'Line of Credit' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'other', label: 'Other' },
];

function AccountFormDialog({
  open,
  onOpenChange,
  account,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount;
  onSave: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    accountName: account?.accountName || '',
    accountNumber: account?.accountNumber || '',
    bankName: account?.bankName || '',
    accountType: account?.accountType || 'checking',
    openingBalance: account?.openingBalance || '0',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (account) {
        await updateBankAccount(account.id, {
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          accountType: formData.accountType as any,
          notes: formData.notes,
        });
      } else {
        await createBankAccount({
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          accountType: formData.accountType as any,
          openingBalance: parseFloat(formData.openingBalance),
          notes: formData.notes,
        });
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{account ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            <DialogDescription>
              {account ? 'Update the bank account details.' : 'Add a new bank account to track.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., Main Operating Account"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Last 4 digits"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g., HBL, UBL, MCB"
              />
            </div>
            {!account && (
              <div className="grid gap-2">
                <Label htmlFor="openingBalance">Opening Balance (PKR)</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this account"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : account ? 'Update Account' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<BankAccount | undefined>();

  const loadAccounts = async () => {
    try {
      const result = await fetchBankAccounts();
      if (result.success && result.data) {
        setAccounts(result.data as BankAccount[]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.bankName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountNumber?.includes(searchQuery);
    const matchesType = filterType === 'all' || account.accountType === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const handleAddAccount = () => {
    setEditingAccount(undefined);
    setDialogOpen(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleSave = () => {
    loadAccounts();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
            <h1 className="text-2xl font-bold text-slate-900">Bank Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your bank accounts and view balances
            </p>
          </div>
          <Button onClick={handleAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {accountTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No bank accounts found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first bank account'}
                </p>
                {!searchQuery && filterType === 'all' && (
                  <Button onClick={handleAddAccount} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Reconciled</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100">
                            <Landmark className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <Link
                              href={`/banking/accounts/${account.id}`}
                              className="font-medium text-slate-900 hover:underline"
                            >
                              {account.accountName}
                            </Link>
                            {account.accountNumber && (
                              <p className="text-xs text-slate-500">...{account.accountNumber}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{account.bankName || '—'}</TableCell>
                      <TableCell className="capitalize">
                        {account.accountType.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={cn(
                            parseFloat(account.currentBalance) < 0 && 'text-red-600'
                          )}
                        >
                          {formatCurrency(account.currentBalance)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(account.status)}</TableCell>
                      <TableCell>
                        {account.lastReconciledDate
                          ? new Date(account.lastReconciledDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/banking/accounts/${account.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Register
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/banking/reconcile?account=${account.id}`}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reconcile
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Form Dialog */}
      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
        onSave={handleSave}
      />
    </div>
  );
}
