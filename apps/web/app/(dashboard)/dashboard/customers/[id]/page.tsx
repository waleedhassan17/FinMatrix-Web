'use client';

import * as React from 'react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Edit,
  FileText,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Badge } from '@finmatrix/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@finmatrix/ui/components/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@finmatrix/ui/components/dropdown-menu';
import { fetchCustomerById, fetchCustomerInvoices, fetchCustomerPayments } from '@/actions/ar';

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
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, icon, trend, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-white',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-rose-50 border-rose-200',
  };

  return (
    <Card className={variants[variant]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-slate-100">
            {icon}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center text-xs font-medium',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-rose-600',
            )}>
              {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
          {subValue && (
            <div className="text-xs text-slate-400 mt-1">{subValue}</div>
          )}
        </div>
      </CardContent>
    </Card>
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

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = use(params);
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [customerResult, invoicesResult, paymentsResult] = await Promise.all([
          fetchCustomerById(customerId),
          fetchCustomerInvoices(customerId),
          fetchCustomerPayments(customerId),
        ]);

        if (customerResult.success && customerResult.data) {
          setCustomer(customerResult.data);
        }
        if (invoicesResult.success && invoicesResult.data) {
          setInvoices(invoicesResult.data);
        }
        if (paymentsResult.success && paymentsResult.data) {
          setPayments(paymentsResult.data);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Customer Not Found</h2>
        <p className="text-slate-500 mt-2">The customer you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  const balance = parseFloat(customer.currentBalance || '0');
  const creditLimit = parseFloat(customer.creditLimit || '0');
  const overdueBalance = parseFloat(customer.overdueBalance || '0');
  const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + parseFloat(pay.amount || '0'), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/customers"
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {customer.companyName}
                  </h1>
                  <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {customer.customerNumber} • Customer since {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/customers/${customerId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Customer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-600">
                  Deactivate Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild variant="outline">
              <Link href={`/dashboard/payments/receive?customerId=${customerId}`}>
                <CreditCard className="h-4 w-4 mr-2" />
                Receive Payment
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/invoices/new?customerId=${customerId}`}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Current Balance"
              value={formatCurrency(balance)}
              icon={<DollarSign className="h-5 w-5 text-blue-600" />}
              variant={overdueBalance > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Overdue Amount"
              value={formatCurrency(overdueBalance)}
              icon={<Clock className="h-5 w-5 text-rose-600" />}
              variant={overdueBalance > 0 ? 'danger' : 'default'}
            />
            <StatCard
              label="Total Invoiced"
              value={formatCurrency(totalInvoiced)}
              subValue={`${invoices.length} invoices`}
              icon={<FileText className="h-5 w-5 text-emerald-600" />}
            />
            <StatCard
              label="Credit Available"
              value={creditLimit > 0 ? formatCurrency(Math.max(0, creditLimit - balance)) : 'No limit'}
              subValue={creditLimit > 0 ? `of ${formatCurrency(creditLimit)}` : undefined}
              icon={<CreditCard className="h-5 w-5 text-purple-600" />}
              variant={creditLimit > 0 && balance > creditLimit ? 'danger' : 'default'}
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-blue-600" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customer.contactName && (
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">{customer.contactName}</div>
                          <div className="text-xs text-slate-500">Primary Contact</div>
                        </div>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                        <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">
                          {customer.email}
                        </a>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                        <a href={`tel:${customer.phone}`} className="text-sm text-blue-600 hover:underline">
                          {customer.phone}
                        </a>
                      </div>
                    )}
                    {customer.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="h-4 w-4 text-slate-400 mt-0.5" />
                        <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {customer.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tax Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Tax Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">NTN</div>
                      <div className="text-sm font-medium">{customer.ntn || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">STRN</div>
                      <div className="text-sm font-medium">{customer.strn || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Payment Terms</div>
                      <div className="text-sm font-medium">Net {customer.paymentTermsDays || 30} days</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Addresses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Billing Address</div>
                      <div className="text-sm whitespace-pre-line">{customer.billingAddress || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Shipping Address</div>
                      <div className="text-sm whitespace-pre-line">{customer.shippingAddress || 'Same as billing'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent Invoices</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('invoices')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No invoices yet</p>
                  ) : (
                    <div className="space-y-2">
                      {invoices.slice(0, 5).map((invoice) => (
                        <Link
                          key={invoice.id}
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="text-sm font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-xs text-slate-500">{formatDate(invoice.invoiceDate)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getInvoiceStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                            <span className="text-sm font-medium">{formatCurrency(invoice.totalAmount)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Invoices</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/invoices/new?customerId=${customerId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Invoice
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No invoices found for this customer</p>
                      <Button asChild className="mt-4">
                        <Link href={`/dashboard/invoices/new?customerId=${customerId}`}>
                          Create First Invoice
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Invoice #</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                            <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
                              <td className="py-3 px-2 font-medium text-blue-600">{invoice.invoiceNumber}</td>
                              <td className="py-3 px-2 text-sm">{formatDate(invoice.invoiceDate)}</td>
                              <td className="py-3 px-2 text-sm">{formatDate(invoice.dueDate)}</td>
                              <td className="py-3 px-2 text-center">
                                <Badge className={getInvoiceStatusColor(invoice.status)}>{invoice.status}</Badge>
                              </td>
                              <td className="py-3 px-2 text-right font-medium">{formatCurrency(invoice.totalAmount)}</td>
                              <td className="py-3 px-2 text-right">{formatCurrency(invoice.balanceDue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payment History</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/payments/receive?customerId=${customerId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Receive Payment
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No payments received from this customer</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Payment #</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Method</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                            <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-slate-50">
                              <td className="py-3 px-2 font-medium">{payment.paymentNumber}</td>
                              <td className="py-3 px-2 text-sm">{formatDate(payment.paymentDate)}</td>
                              <td className="py-3 px-2 text-sm capitalize">{payment.paymentMethod?.replace('_', ' ')}</td>
                              <td className="py-3 px-2 text-sm text-slate-500">{payment.referenceNumber || '-'}</td>
                              <td className="py-3 px-2 text-right font-medium text-emerald-600">{formatCurrency(payment.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-line">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
