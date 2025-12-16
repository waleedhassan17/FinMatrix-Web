'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
  Search,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import { Textarea } from '@finmatrix/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@finmatrix/ui/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@finmatrix/ui/components/popover';
import { Checkbox } from '@finmatrix/ui/components/checkbox';
import { cn } from '@finmatrix/ui/lib/utils';
import {
  fetchCustomerSearch,
  fetchCustomerById,
  fetchOutstandingInvoices,
  fetchNextPaymentNumber,
  addPayment,
} from '@/actions/ar';

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

interface InvoiceAllocation {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  balanceDue: number;
  amountApplied: number;
  selected: boolean;
}

function PaymentReceiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [invoices, setInvoices] = useState<InvoiceAllocation[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load payment number on mount
  useEffect(() => {
    async function loadPaymentNumber() {
      const result = await fetchNextPaymentNumber();
      if (result.success && result.data) {
        setPaymentNumber(result.data);
      }
    }
    loadPaymentNumber();
  }, []);

  // Load preselected customer
  useEffect(() => {
    async function loadCustomer() {
      if (preselectedCustomerId) {
        const result = await fetchCustomerById(preselectedCustomerId);
        if (result.success && result.data) {
          setSelectedCustomer(result.data);
          loadOutstandingInvoices(result.data.id);
        }
      }
    }
    loadCustomer();
  }, [preselectedCustomerId]);

  // Search customers
  useEffect(() => {
    async function searchCustomers() {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await fetchCustomerSearch(customerSearch);
        if (result.success && result.data) {
          setCustomerResults(result.data);
        }
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setIsSearching(false);
      }
    }

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  async function loadOutstandingInvoices(customerId: string) {
    setIsLoadingInvoices(true);
    try {
      const result = await fetchOutstandingInvoices(customerId);
      if (result.success && result.data) {
        setInvoices(result.data.map((inv: any) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          totalAmount: parseFloat(inv.totalAmount),
          balanceDue: parseFloat(inv.balanceDue),
          amountApplied: 0,
          selected: false,
        })));
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  }

  function handleCustomerSelect(customer: any) {
    setSelectedCustomer(customer);
    setCustomerOpen(false);
    setCustomerSearch('');
    loadOutstandingInvoices(customer.id);
    // Reset allocations
    setAmount(0);
  }

  function handleInvoiceSelect(invoiceId: string, selected: boolean) {
    setInvoices(prev => prev.map(inv => {
      if (inv.invoiceId === invoiceId) {
        return {
          ...inv,
          selected,
          amountApplied: selected ? inv.balanceDue : 0,
        };
      }
      return inv;
    }));
  }

  function handleAmountApplied(invoiceId: string, amountStr: string) {
    const amountApplied = parseFloat(amountStr) || 0;
    setInvoices(prev => prev.map(inv => {
      if (inv.invoiceId === invoiceId) {
        return {
          ...inv,
          amountApplied: Math.min(amountApplied, inv.balanceDue),
          selected: amountApplied > 0,
        };
      }
      return inv;
    }));
  }

  function handleAutoAllocate() {
    let remaining = amount;
    setInvoices(prev => prev.map(inv => {
      if (remaining <= 0) {
        return { ...inv, amountApplied: 0, selected: false };
      }
      const toApply = Math.min(remaining, inv.balanceDue);
      remaining -= toApply;
      return {
        ...inv,
        amountApplied: toApply,
        selected: toApply > 0,
      };
    }));
  }

  // Calculate totals
  const totalApplied = invoices.reduce((sum, inv) => sum + inv.amountApplied, 0);
  const unappliedAmount = amount - totalApplied;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (!paymentDate) {
      setError('Payment date is required');
      return;
    }

    const selectedInvoices = invoices.filter(inv => inv.selected && inv.amountApplied > 0);
    if (selectedInvoices.length === 0) {
      setError('Please select at least one invoice to apply the payment to');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addPayment({
        customerId: selectedCustomer.id,
        paymentNumber,
        paymentDate,
        amount,
        paymentMethod: paymentMethod as any,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        applications: selectedInvoices.map(inv => ({
          invoiceId: inv.invoiceId,
          amount: inv.amountApplied,
        })),
      });

      if (result.success && result.data) {
        router.push(`/dashboard/payments/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create payment');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/payments"
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Receive Payment</h1>
              <p className="mt-1 text-sm text-slate-500">
                {paymentNumber || 'Recording payment...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/payments">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCustomer ? (
                    <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-900">{selectedCustomer.companyName}</div>
                        <div className="text-sm text-slate-500">{selectedCustomer.customerNumber}</div>
                        {selectedCustomer.currentBalance && (
                          <div className="text-sm text-slate-500 mt-1">
                            Balance: {formatCurrency(selectedCustomer.currentBalance)}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setInvoices([]);
                          setAmount(0);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={customerOpen}
                          className="w-full justify-start"
                        >
                          <Search className="h-4 w-4 mr-2 text-slate-400" />
                          Select a customer...
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search customers..."
                            value={customerSearch}
                            onValueChange={setCustomerSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {isSearching ? 'Searching...' : 'No customers found'}
                            </CommandEmpty>
                            <CommandGroup>
                              {customerResults.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.companyName}
                                  onSelect={() => handleCustomerSelect(customer)}
                                >
                                  <div>
                                    <div className="font-medium">{customer.companyName}</div>
                                    <div className="text-xs text-slate-500">{customer.customerNumber}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Allocation */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Apply to Invoices
                    </CardTitle>
                    <CardDescription>Select invoices to apply this payment</CardDescription>
                  </div>
                  {amount > 0 && invoices.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleAutoAllocate}>
                      Auto-Allocate
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedCustomer ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      Select a customer to view outstanding invoices
                    </p>
                  ) : isLoadingInvoices ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No outstanding invoices for this customer</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-2 border-b">
                        <div className="col-span-1"></div>
                        <div className="col-span-3">Invoice</div>
                        <div className="col-span-2">Due Date</div>
                        <div className="col-span-2 text-right">Total</div>
                        <div className="col-span-2 text-right">Balance</div>
                        <div className="col-span-2 text-right">Apply</div>
                      </div>

                      {invoices.map((invoice) => (
                        <div
                          key={invoice.invoiceId}
                          className={cn(
                            'grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors',
                            invoice.selected ? 'bg-blue-50' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className="col-span-1">
                            <Checkbox
                              checked={invoice.selected}
                              onCheckedChange={(checked: boolean) =>
                                handleInvoiceSelect(invoice.invoiceId, checked as boolean)
                              }
                            />
                          </div>
                          <div className="col-span-3">
                            <div className="font-medium text-sm">{invoice.invoiceNumber}</div>
                            <div className="text-xs text-slate-500">{formatDate(invoice.invoiceDate)}</div>
                          </div>
                          <div className="col-span-2 text-sm">{formatDate(invoice.dueDate)}</div>
                          <div className="col-span-2 text-right text-sm">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                          <div className="col-span-2 text-right text-sm font-medium">
                            {formatCurrency(invoice.balanceDue)}
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="0"
                              max={invoice.balanceDue}
                              step="0.01"
                              value={invoice.amountApplied || ''}
                              onChange={(e) => handleAmountApplied(invoice.invoiceId, e.target.value)}
                              className="h-8 text-right text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    placeholder="Additional notes about this payment..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Details */}
            <div className="space-y-6">
              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paymentNumber">Payment Number</Label>
                    <Input
                      id="paymentNumber"
                      value={paymentNumber}
                      onChange={(e) => setPaymentNumber(e.target.value)}
                      className="mt-1.5"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount Received *</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">PKR</span>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount || ''}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="pl-12"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referenceNumber">Reference Number</Label>
                    <Input
                      id="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Cheque/Transaction number"
                      className="mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Amount Received</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Applied to Invoices</span>
                    <span>{formatCurrency(totalApplied)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className={cn(
                      'flex justify-between text-lg font-bold',
                      unappliedAmount > 0 ? 'text-amber-400' : 'text-white'
                    )}>
                      <span>Unapplied</span>
                      <span>{formatCurrency(Math.max(0, unappliedAmount))}</span>
                    </div>
                    {unappliedAmount > 0 && (
                      <p className="text-xs text-amber-300 mt-1">
                        Unapplied amount will be recorded as credit
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* GL Posting Notice */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-emerald-800">Auto GL Posting</div>
                    <p className="text-emerald-700 mt-1">
                      This payment will automatically post to the General Ledger
                      (Dr. Bank, Cr. Accounts Receivable).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReceivePaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <PaymentReceiveContent />
    </Suspense>
  );
}
