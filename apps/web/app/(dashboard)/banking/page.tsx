'use client';

// Banking Navigation Center
// Overview of the Banking module with account summaries, quick actions, and alerts

import * as React from 'react';
import Link from 'next/link';
import {
  Landmark,
  CreditCard,
  FileUp,
  FileCheck,
  BarChart3,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Badge } from '@finmatrix/ui/components/badge';
import { Skeleton } from '@finmatrix/ui/components/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@finmatrix/ui/components/dialog';
import { fetchBankingDashboard } from '@/actions/banking';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  stats?: { label: string; value: string }[];
  badge?: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}

function NavigationCard({ title, description, icon, href, color, stats, badge }: NavigationCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'p-2 rounded-lg',
                color === 'blue' && 'bg-blue-100 text-blue-600',
                color === 'green' && 'bg-green-100 text-green-600',
                color === 'purple' && 'bg-purple-100 text-purple-600',
                color === 'amber' && 'bg-amber-100 text-amber-600',
                color === 'cyan' && 'bg-cyan-100 text-cyan-600',
                color === 'red' && 'bg-red-100 text-red-600'
              )}
            >
              {icon}
            </div>
            <div className="flex items-center gap-2">
              {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
            </div>
          </div>
          <CardTitle className="mt-4">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {stats && stats.length > 0 && (
          <CardContent>
            <div className="flex gap-4">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

interface AccountCardProps {
  name: string;
  balance: number;
  lastReconciled?: string;
  accountType: string;
  unreconciledCount: number;
  id: string;
}

function AccountCard({ name, balance, lastReconciled, accountType, unreconciledCount, id }: AccountCardProps) {
  const isNegative = balance < 0;
  
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Landmark className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <Link href={`/banking/accounts/${id}`} className="font-medium text-slate-900 hover:underline">
                {name}
              </Link>
              <p className="text-xs text-slate-500 capitalize">{accountType.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-lg font-semibold', isNegative ? 'text-red-600' : 'text-slate-900')}>
              PKR {Math.abs(balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
            {unreconciledCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                <Clock className="h-3 w-3" />
                {unreconciledCount} unreconciled
              </div>
            )}
            {unreconciledCount === 0 && lastReconciled && (
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <CheckCircle className="h-3 w-3" />
                Reconciled
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline';
}

function QuickActionButton({ icon, label, onClick, variant = 'outline' }: QuickActionButtonProps) {
  return (
    <Button variant={variant} onClick={onClick} className="flex-1">
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  accountName?: string;
}

export default function BankingPage() {
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showRecordDeposit, setShowRecordDeposit] = React.useState(false);
  const [showWriteCheck, setShowWriteCheck] = React.useState(false);
  const [showTransfer, setShowTransfer] = React.useState(false);

  React.useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await fetchBankingDashboard();
        if (result.success) {
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error('Error loading banking dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    return `PKR ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  // Mock data for initial development
  const mockAccounts = [
    { id: '1', name: 'Main Operating Account', balance: 2450000.00, lastReconciled: '2025-01-15', accountType: 'checking', unreconciledCount: 12 },
    { id: '2', name: 'Savings Account', balance: 1200000.00, lastReconciled: '2025-01-10', accountType: 'savings', unreconciledCount: 0 },
    { id: '3', name: 'Petty Cash', balance: 25000.00, lastReconciled: null, accountType: 'petty_cash', unreconciledCount: 5 },
  ];

  const mockAlerts: Alert[] = [
    { id: '1', type: 'warning', message: '12 unreconciled transactions', accountName: 'Main Operating Account' },
    { id: '2', type: 'info', message: '3 imported statements pending review' },
    { id: '3', type: 'warning', message: 'Reconciliation overdue (30+ days)', accountName: 'Main Operating Account' },
  ];

  const accounts = dashboardData?.accounts || mockAccounts;
  const alerts = dashboardData?.alerts || mockAlerts;
  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (parseFloat(acc.balance) || acc.balance), 0);
  const unreconciledTotal = accounts.reduce((sum: number, acc: any) => sum + acc.unreconciledCount, 0);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-200 bg-white">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Banking</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage bank accounts, reconciliations, and cash flow
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Cash Balance</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    alert.type === 'warning' && 'bg-amber-50 border border-amber-200',
                    alert.type === 'error' && 'bg-red-50 border border-red-200',
                    alert.type === 'info' && 'bg-blue-50 border border-blue-200'
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'h-5 w-5',
                      alert.type === 'warning' && 'text-amber-600',
                      alert.type === 'error' && 'text-red-600',
                      alert.type === 'info' && 'text-blue-600'
                    )}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900">{alert.message}</span>
                    {alert.accountName && (
                      <span className="text-sm text-slate-500 ml-2">• {alert.accountName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/banking/accounts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Account
                  </Link>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <ArrowDownRight className="h-4 w-4 mr-2 text-green-600" />
                      Record Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Deposit</DialogTitle>
                      <DialogDescription>
                        Record a deposit to one of your bank accounts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-center text-slate-500">
                      Deposit form coming soon...
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <ArrowUpRight className="h-4 w-4 mr-2 text-red-600" />
                      Write Check
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Write Check</DialogTitle>
                      <DialogDescription>
                        Write a check from one of your bank accounts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-center text-slate-500">
                      Check form coming soon...
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Funds</DialogTitle>
                      <DialogDescription>
                        Transfer funds between your bank accounts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-center text-slate-500">
                      Transfer form coming soon...
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" asChild>
                  <Link href="/banking/import">
                    <FileUp className="h-4 w-4 mr-2" />
                    Import Statement
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/banking/reconcile">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Reconcile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Summaries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Bank Accounts</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/banking/accounts">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account: any) => (
                <AccountCard
                  key={account.id}
                  id={account.id}
                  name={account.name || account.accountName}
                  balance={parseFloat(account.balance) || account.balance}
                  lastReconciled={account.lastReconciled || account.lastReconciledDate}
                  accountType={account.accountType}
                  unreconciledCount={account.unreconciledCount || 0}
                />
              ))}
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NavigationCard
              title="Bank Accounts"
              description="Manage accounts, view registers, and track balances"
              icon={<Landmark className="h-5 w-5" />}
              href="/banking/accounts"
              color="blue"
              stats={[{ label: 'Accounts', value: accounts.length.toString() }]}
            />
            <NavigationCard
              title="Import Statements"
              description="Import and process bank statements (CSV, OFX)"
              icon={<FileUp className="h-5 w-5" />}
              href="/banking/import"
              color="purple"
            />
            <NavigationCard
              title="Reconciliation"
              description="Match bank statements to book transactions"
              icon={<FileCheck className="h-5 w-5" />}
              href="/banking/reconcile"
              color="green"
              badge={unreconciledTotal > 0 ? { text: `${unreconciledTotal} pending`, variant: 'secondary' } : undefined}
            />
            <NavigationCard
              title="Reports"
              description="Outstanding checks, deposits in transit, and more"
              icon={<BarChart3 className="h-5 w-5" />}
              href="/banking/reports"
              color="amber"
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Cash Balance</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Unreconciled Transactions</p>
                    <p className="text-xl font-bold text-slate-900">{unreconciledTotal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Accounts</p>
                    <p className="text-xl font-bold text-slate-900">{accounts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
