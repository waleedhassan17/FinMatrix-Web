'use client';

// Customers & Sales Navigation Center
// Overview of the Accounts Receivable module with quick stats and navigation

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  CreditCard,
  BarChart3,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Clock,
  DollarSign,
  Receipt,
  UserPlus,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { fetchARDashboardStats, fetchRecentARActivity } from '@/actions/ar';
import type { ARDashboardStats, ARRecentActivity } from '@finmatrix/db';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  stats?: { label: string; value: string }[];
}

function NavigationCard({ title, description, icon, href, color, stats }: NavigationCardProps) {
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
                color === 'teal' && 'bg-teal-100 text-teal-600',
                color === 'rose' && 'bg-rose-100 text-rose-600'
              )}
            >
              {icon}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
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

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
  trendValue,
  color = 'blue' 
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'rose' | 'purple' | 'teal';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  'text-sm font-medium ml-1',
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'invoice_created':
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'invoice_sent':
      return <Send className="h-4 w-4 text-green-600" />;
    case 'payment_received':
      return <CreditCard className="h-4 w-4 text-teal-600" />;
    case 'invoice_overdue':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-600" />;
  }
}

function getActivityBgColor(type: string) {
  switch (type) {
    case 'invoice_created':
      return 'bg-blue-100';
    case 'invoice_sent':
      return 'bg-green-100';
    case 'payment_received':
      return 'bg-teal-100';
    case 'invoice_overdue':
      return 'bg-red-100';
    default:
      return 'bg-slate-100';
  }
}

export default function CustomersPage() {
  const [stats, setStats] = useState<ARDashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ARRecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [statsResult, activityResult] = await Promise.all([
          fetchARDashboardStats(),
          fetchRecentARActivity(10),
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
        if (activityResult.success && activityResult.data) {
          setRecentActivity(activityResult.data);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h1 className="text-2xl font-bold text-slate-900">Customers & Sales</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customers, invoices, payments, and accounts receivable
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <h1 className="text-2xl font-bold text-slate-900">Customers & Sales</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage customers, invoices, payments, and accounts receivable
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/customers/new">
                <UserPlus className="h-4 w-4 mr-2" />
                New Customer
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers?.toString() || '0'}
              subtitle={`${stats?.activeCustomers || 0} active`}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Outstanding AR"
              value={formatCurrency(stats?.totalOutstanding || 0)}
              subtitle="Total receivables"
              icon={DollarSign}
              color="teal"
            />
            <StatCard
              title="Overdue Amount"
              value={formatCurrency(stats?.overdueAmount || 0)}
              subtitle="Requires attention"
              icon={AlertCircle}
              color="rose"
            />
            <StatCard
              title="This Month Sales"
              value={formatCurrency(stats?.currentMonthSales || 0)}
              subtitle={`Collected: ${formatCurrency(stats?.currentMonthCollections || 0)}`}
              icon={TrendingUp}
              color="green"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/invoices/new">
                <FileText className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/payments/receive">
                <CreditCard className="h-4 w-4 mr-2" />
                Receive Payment
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/customers">
                <Users className="h-4 w-4 mr-2" />
                View All Customers
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/reports/ar-aging">
                <BarChart3 className="h-4 w-4 mr-2" />
                AR Aging Report
              </Link>
            </Button>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NavigationCard
              title="Customers"
              description="Manage customer profiles and contacts"
              icon={<Users className="h-5 w-5" />}
              href="/dashboard/customers"
              color="blue"
              stats={[
                { label: 'Total', value: stats?.totalCustomers?.toString() || '0' },
                { label: 'Active', value: stats?.activeCustomers?.toString() || '0' },
              ]}
            />

            <NavigationCard
              title="Invoices"
              description="Create and manage sales invoices"
              icon={<FileText className="h-5 w-5" />}
              href="/dashboard/invoices"
              color="green"
            />

            <NavigationCard
              title="Receive Payments"
              description="Record customer payments"
              icon={<CreditCard className="h-5 w-5" />}
              href="/dashboard/payments/receive"
              color="teal"
            />

            <NavigationCard
              title="Quotes"
              description="Create and send quotations"
              icon={<Receipt className="h-5 w-5" />}
              href="/dashboard/quotes"
              color="purple"
            />

            <NavigationCard
              title="Credit Memos"
              description="Issue credits and refunds"
              icon={<Receipt className="h-5 w-5" />}
              href="/dashboard/credit-memos"
              color="amber"
            />

            <NavigationCard
              title="AR Aging Report"
              description="Analyze outstanding receivables"
              icon={<BarChart3 className="h-5 w-5" />}
              href="/dashboard/reports/ar-aging"
              color="rose"
            />
          </div>

          {/* Recent Activity & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className={cn('p-2 rounded-full', getActivityBgColor(activity.type))}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{activity.title}</div>
                          <div className="text-sm text-slate-500 truncate">{activity.description}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {activity.amount && (
                            <div className="font-medium text-slate-900">
                              {formatCurrency(activity.amount)}
                            </div>
                          )}
                          <div className="text-xs text-slate-400">
                            {formatRelativeTime(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Create an invoice to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                  Top Customers by Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topCustomers && stats.topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topCustomers.map((customer, index) => (
                      <Link
                        key={customer.id}
                        href={`/dashboard/customers/${customer.id}`}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {customer.companyName}
                          </div>
                        </div>
                        <div className="font-medium text-slate-900">
                          {formatCurrency(customer.currentBalance)}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No customers with outstanding balance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overdue Alert */}
          {stats && stats.overdueAmount > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-800">
                      Overdue Invoices: {formatCurrency(stats.overdueAmount)}
                    </div>
                    <div className="text-sm text-amber-700 mt-1">
                      You have outstanding invoices past their due date. Consider sending reminders to customers.
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 text-amber-800 hover:text-amber-900"
                      asChild
                    >
                      <Link href="/dashboard/invoices?status=overdue">View Overdue Invoices →</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
