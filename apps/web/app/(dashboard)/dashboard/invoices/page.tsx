'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Send,
  FileCheck,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Badge } from '@finmatrix/ui/components/badge';
import { fetchInvoices, fetchARDashboardStats } from '@/actions/ar';

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

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subLabel, icon, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-white border-slate-200',
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-rose-50 border-rose-200',
  };

  return (
    <Card className={cn('border', variants[variant])}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-slate-100">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
          {subLabel && (
            <div className="text-xs text-slate-400 mt-1">{subLabel}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  stats?: string;
  color?: string;
}

function NavigationCard({ title, description, icon, href, stats, color = 'blue' }: NavigationCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
  };

  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:shadow-md hover:border-blue-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={cn('p-3 rounded-xl transition-colors', colors[color])}>
              {icon}
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
            {stats && (
              <div className="text-xs font-medium text-slate-400 mt-2">{stats}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getInvoiceStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
    sent: 'bg-blue-100 text-blue-700',
    partial: 'bg-purple-100 text-purple-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return colors[status] || colors.draft;
}

export default function InvoicesNavigationPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [statsResult, invoicesResult] = await Promise.all([
          fetchARDashboardStats(),
          fetchInvoices({ sortBy: 'invoiceDate', sortOrder: 'desc' }, { page: 1, pageSize: 5 }),
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
        if (invoicesResult.success && invoicesResult.data) {
          setRecentInvoices(invoicesResult.data.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingCount = stats?.invoicesByStatus?.pending || 0;
  const overdueCount = stats?.invoicesByStatus?.overdue || 0;
  const paidCount = stats?.invoicesByStatus?.paid || 0;
  const draftCount = stats?.invoicesByStatus?.draft || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, manage, and track your sales invoices
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Pending Invoices"
              value={pendingCount}
              subLabel={pendingCount > 0 ? 'Awaiting payment' : 'All caught up!'}
              icon={<Clock className="h-5 w-5 text-amber-600" />}
              variant={pendingCount > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Overdue Invoices"
              value={overdueCount}
              subLabel={overdueCount > 0 ? 'Needs attention' : 'None overdue'}
              icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
              variant={overdueCount > 0 ? 'danger' : 'default'}
            />
            <StatCard
              label="Paid This Month"
              value={paidCount}
              icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
              variant="success"
            />
            <StatCard
              label="Draft Invoices"
              value={draftCount}
              subLabel={draftCount > 0 ? 'Ready to finalize' : 'No drafts'}
              icon={<FileText className="h-5 w-5 text-slate-600" />}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NavigationCard
              title="All Invoices"
              description="View and manage all invoices"
              icon={<FileText className="h-6 w-6" />}
              href="/dashboard/invoices/list"
              stats={`${recentInvoices.length > 0 ? 'Recently updated' : 'Get started'}`}
              color="blue"
            />
            <NavigationCard
              title="Pending Approval"
              description="Invoices awaiting review"
              icon={<Clock className="h-6 w-6" />}
              href="/dashboard/invoices/list?status=pending"
              stats={`${pendingCount} pending`}
              color="amber"
            />
            <NavigationCard
              title="Send Invoices"
              description="Email invoices to customers"
              icon={<Send className="h-6 w-6" />}
              href="/dashboard/invoices/list?status=draft"
              stats={`${draftCount} drafts ready`}
              color="purple"
            />
            <NavigationCard
              title="Paid Invoices"
              description="View payment history"
              icon={<FileCheck className="h-6 w-6" />}
              href="/dashboard/invoices/list?status=paid"
              stats={`${paidCount} this month`}
              color="emerald"
            />
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/invoices/list">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No invoices yet</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/invoices/new">Create Your First Invoice</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Invoice #</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentInvoices.map((invoice) => (
                        <tr 
                          key={invoice.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                        >
                          <td className="py-3 px-2">
                            <span className="font-medium text-blue-600">{invoice.invoiceNumber}</span>
                          </td>
                          <td className="py-3 px-2 text-sm">{invoice.customer?.companyName || '-'}</td>
                          <td className="py-3 px-2 text-sm text-slate-500">{formatDate(invoice.invoiceDate)}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge className={getInvoiceStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="py-3 px-2 text-right text-slate-500">{formatCurrency(invoice.balanceDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
