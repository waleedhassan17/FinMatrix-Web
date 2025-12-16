'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@finmatrix/ui';
import { Button } from '@finmatrix/ui';
import { Badge } from '@finmatrix/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@finmatrix/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  CreditCard,
  FileText,
  Edit,
  DollarSign,
  Calendar,
  Banknote,
} from 'lucide-react';
import { fetchVendorById } from '@/actions/ap';
import type { VendorDetail, BillListItem, VendorPaymentListItem } from '@finmatrix/db';

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

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVendor() {
      try {
        const data = await fetchVendorById(vendorId);
        setVendor(data);
      } catch (error) {
        console.error('Error loading vendor:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadVendor();
  }, [vendorId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Vendor Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The vendor you're looking for doesn't exist.
        </p>
        <Link href="/dashboard/vendors">
          <Button>Back to Vendors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendors/list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {vendor.companyName}
              </h1>
              <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{vendor.vendorNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/payments/vendor?vendorId=${vendor.id}`}>
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Bills
            </Button>
          </Link>
          <Link href={`/dashboard/bills/new?vendorId=${vendor.id}`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Enter Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                parseFloat(vendor.outstandingBalance) > 0
                  ? 'text-orange-600'
                  : ''
              }`}
            >
              {formatCurrency(vendor.outstandingBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(vendor.totalPurchases)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Purchase</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendor.lastPurchaseDate
                ? formatDate(vendor.lastPurchaseDate)
                : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bills">Bills ({vendor.bills.length})</TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({vendor.payments.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.contactName && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="font-medium">{vendor.contactName}</p>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${vendor.email}`}
                      className="text-primary hover:underline"
                    >
                      {vendor.email}
                    </a>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${vendor.phone}`}
                      className="hover:underline"
                    >
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p>{vendor.address}</p>
                      {(vendor.city || vendor.postalCode) && (
                        <p className="text-muted-foreground">
                          {[vendor.city, vendor.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      {vendor.country && (
                        <p className="text-muted-foreground">{vendor.country}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax & Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tax & Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.ntn && (
                  <div>
                    <p className="text-sm text-muted-foreground">NTN</p>
                    <p className="font-medium">{vendor.ntn}</p>
                  </div>
                )}
                {vendor.strn && (
                  <div>
                    <p className="text-sm text-muted-foreground">STRN</p>
                    <p className="font-medium">{vendor.strn}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-medium">{vendor.paymentTerms} days</p>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            {vendor.bankDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Bank Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.bankDetails.bankName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{vendor.bankDetails.bankName}</p>
                    </div>
                  )}
                  {vendor.bankDetails.accountTitle && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Account Title
                      </p>
                      <p className="font-medium">
                        {vendor.bankDetails.accountTitle}
                      </p>
                    </div>
                  )}
                  {vendor.bankDetails.accountNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Account Number
                      </p>
                      <p className="font-medium font-mono">
                        {vendor.bankDetails.accountNumber}
                      </p>
                    </div>
                  )}
                  {vendor.bankDetails.iban && (
                    <div>
                      <p className="text-sm text-muted-foreground">IBAN</p>
                      <p className="font-medium font-mono">
                        {vendor.bankDetails.iban}
                      </p>
                    </div>
                  )}
                  {vendor.bankDetails.branchCode && (
                    <div>
                      <p className="text-sm text-muted-foreground">Branch Code</p>
                      <p className="font-medium">{vendor.bankDetails.branchCode}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {vendor.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{vendor.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bills</CardTitle>
                <CardDescription>All bills from this vendor</CardDescription>
              </div>
              <Link href={`/dashboard/bills/new?vendorId=${vendor.id}`}>
                <Button size="sm">Enter Bill</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {vendor.bills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bills from this vendor</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.bills.map((bill: BillListItem) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/bills/${bill.id}`}
                            className="font-medium hover:underline"
                          >
                            {bill.billNumber}
                          </Link>
                          {bill.vendorInvoiceNumber && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {bill.vendorInvoiceNumber}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(bill.billDate)}</TableCell>
                        <TableCell>
                          <span
                            className={bill.isOverdue ? 'text-red-500' : ''}
                          >
                            {formatDate(bill.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              bill.status === 'paid'
                                ? 'default'
                                : bill.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(bill.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(bill.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Payment history for this vendor</CardDescription>
              </div>
              <Link href={`/dashboard/payments/vendor?vendorId=${vendor.id}`}>
                <Button size="sm">Make Payment</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {vendor.payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No payments to this vendor</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.payments.map((payment: VendorPaymentListItem) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.paymentNumber}
                        </TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell className="capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(payment.amount)}
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
  );
}
