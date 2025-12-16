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
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import {
  fetchAPDashboardStats,
  fetchRecentAPActivity,
  fetchVendorsToPay,
} from '@/actions/ap';
import type { APDashboardStats, APActivityItem } from '@finmatrix/db';

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

export default function VendorsPage() {
  const [stats, setStats] = useState<APDashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<APActivityItem[]>([]);
  const [vendorsToPay, setVendorsToPay] = useState<
    {
      vendorId: string;
      vendorName: string;
      totalDue: string;
      billsDue: number;
      oldestDueDate: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, activityData, vendorsData] = await Promise.all([
          fetchAPDashboardStats(),
          fetchRecentAPActivity(5),
          fetchVendorsToPay(5),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
        setVendorsToPay(vendorsData);
      } catch (error) {
        console.error('Error loading AP dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendors & Purchases
          </h1>
          <p className="text-muted-foreground">
            Manage vendors, bills, and payments
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVendors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeVendors || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding AP</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.outstandingAP || '0')}
            </div>
            <p className="text-xs text-muted-foreground">Total payable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.dueThisWeek || '0')}
            </div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month Purchases
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.thisMonthPurchases || '0')}
            </div>
            <p className="text-xs text-muted-foreground">Bills entered</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats && parseFloat(stats.overdueAmount) > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                Overdue Payments
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                You have {formatCurrency(stats.overdueAmount)} in overdue bills
              </p>
            </div>
            <Link href="/dashboard/bills?status=overdue">
              <Button variant="destructive" size="sm">
                View Overdue Bills
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/vendors/new">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">New Vendor</h3>
              <p className="text-sm text-muted-foreground">
                Add a new supplier
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/bills/new">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-blue-500/10 p-3 mb-3">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">Enter Bill</h3>
              <p className="text-sm text-muted-foreground">
                Record vendor invoice
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/payments/vendor">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-green-500/10 p-3 mb-3">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold">Pay Bills</h3>
              <p className="text-sm text-muted-foreground">
                Make vendor payments
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reports/ap-aging">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-purple-500/10 p-3 mb-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold">AP Aging</h3>
              <p className="text-sm text-muted-foreground">
                View payables aging
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendors to Pay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vendors to Pay</CardTitle>
              <CardDescription>Sorted by oldest due date</CardDescription>
            </div>
            <Link href="/dashboard/payments/vendor">
              <Button variant="outline" size="sm">
                Pay Bills
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {vendorsToPay.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No outstanding bills</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vendorsToPay.map((vendor) => {
                  const isOverdue =
                    new Date(vendor.oldestDueDate) < new Date();
                  return (
                    <div
                      key={vendor.vendorId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <Link
                          href={`/dashboard/vendors/${vendor.vendorId}`}
                          className="font-medium hover:underline"
                        >
                          {vendor.vendorName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {vendor.billsDue} bill(s) • Due:{' '}
                          <span
                            className={
                              isOverdue ? 'text-red-500 font-medium' : ''
                            }
                          >
                            {formatDate(vendor.oldestDueDate)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(vendor.totalDue)}
                        </p>
                        <Link
                          href={`/dashboard/payments/vendor?vendorId=${vendor.vendorId}`}
                        >
                          <Button variant="ghost" size="sm">
                            Pay
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest bills and payments</CardDescription>
            </div>
            <Link href="/dashboard/bills">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          activity.type === 'bill'
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'bg-green-100 dark:bg-green-900'
                        }`}
                      >
                        {activity.type === 'bill' ? (
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.vendorName} •{' '}
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-medium ${
                        activity.type === 'payment'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {activity.type === 'payment' ? '-' : '+'}
                      {formatCurrency(activity.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/vendors/list">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Vendor Directory</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/bills">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">All Bills</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reports/ap-aging">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">AP Aging Report</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
