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
import { Input } from '@finmatrix/ui';
import { Badge } from '@finmatrix/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui';
import { Plus, Search, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { fetchBills, fetchAPDashboardStats } from '@/actions/ap';
import type { BillListItem, APDashboardStats } from '@finmatrix/db';

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid':
      return 'default';
    case 'approved':
    case 'partially_paid':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillListItem[]>([]);
  const [stats, setStats] = useState<APDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [billsData, statsData] = await Promise.all([
          fetchBills({
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          }),
          fetchAPDashboardStats(),
        ]);
        setBills(billsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading bills:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [searchQuery, statusFilter]);

  const overdueBills = bills.filter((b) => b.isOverdue);

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
            <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
            <p className="text-muted-foreground">
              Manage vendor invoices and bills
            </p>
          </div>
        </div>
        <Link href="/dashboard/bills/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Enter Bill
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Bills</div>
            <div className="text-2xl font-bold">{bills.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding AP</div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.outstandingAP || '0')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Due This Week</div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.dueThisWeek || '0')}
            </div>
          </CardContent>
        </Card>
        <Card className={parseFloat(stats?.overdueAmount || '0') > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className={`text-2xl font-bold ${parseFloat(stats?.overdueAmount || '0') > 0 ? 'text-red-500' : ''}`}>
              {formatCurrency(stats?.overdueAmount || '0')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueBills.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                {overdueBills.length} Overdue Bill(s)
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Total overdue: {formatCurrency(stats?.overdueAmount || '0')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bill number or vendor reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'draft', 'approved', 'partially_paid', 'paid'].map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all'
                      ? 'All'
                      : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>
            Click on a bill to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No bills found</p>
              <Link href="/dashboard/bills/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Enter Your First Bill
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/dashboard/bills/${bill.id}`}
                        className="block"
                      >
                        <div className="font-medium hover:underline">
                          {bill.billNumber}
                        </div>
                        {bill.vendorInvoiceNumber && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {bill.vendorInvoiceNumber}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/vendors/${bill.vendorId}`}
                        className="hover:underline"
                      >
                        {bill.vendorName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(bill.billDate)}</TableCell>
                    <TableCell>
                      <span className={bill.isOverdue ? 'text-red-500 font-medium' : ''}>
                        {formatDate(bill.dueDate)}
                        {bill.isOverdue && (
                          <span className="ml-1 text-xs">(Overdue)</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(bill.status)}>
                        {bill.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          parseFloat(bill.balance) > 0
                            ? 'font-medium text-orange-600'
                            : ''
                        }
                      >
                        {formatCurrency(bill.balance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
