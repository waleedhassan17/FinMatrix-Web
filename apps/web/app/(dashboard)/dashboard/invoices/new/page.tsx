'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Building2,
  Package,
  Calculator,
  Loader2,
  AlertCircle,
  Check,
  Search,
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
import { cn } from '@finmatrix/ui/lib/utils';
import { 
  fetchCustomerSearch, 
  fetchCustomerById, 
  fetchNextInvoiceNumber, 
  addInvoice,
  postInvoice,
} from '@/actions/ar';

// Pakistan GST rate
const DEFAULT_TAX_RATE = 17;

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  taxAmount: number;
}

interface InvoiceFormData {
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  notes: string;
  termsAndConditions: string;
  lineItems: LineItem[];
}

function createEmptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: DEFAULT_TAX_RATE,
    amount: 0,
    taxAmount: 0,
  };
}

function calculateLineItem(item: Partial<LineItem>): LineItem {
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  const taxRate = item.taxRate ?? DEFAULT_TAX_RATE;
  const amount = quantity * unitPrice;
  const taxAmount = amount * (taxRate / 100);
  return {
    ...item,
    id: item.id || crypto.randomUUID(),
    description: item.description || '',
    quantity,
    unitPrice,
    taxRate,
    amount,
    taxAmount,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function InvoiceFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    poNumber: '',
    notes: '',
    termsAndConditions: 'Payment is due within the specified terms. Late payments may be subject to additional charges.',
    lineItems: [createEmptyLineItem()],
  });
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load invoice number on mount
  useEffect(() => {
    async function loadInvoiceNumber() {
      const result = await fetchNextInvoiceNumber();
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, invoiceNumber: result.data }));
      }
    }
    loadInvoiceNumber();
  }, []);

  // Load preselected customer
  useEffect(() => {
    async function loadCustomer() {
      if (preselectedCustomerId) {
        const result = await fetchCustomerById(preselectedCustomerId);
        if (result.success && result.data) {
          setSelectedCustomer(result.data);
          setFormData(prev => ({ 
            ...prev, 
            customerId: result.data.id,
            // Set due date based on customer payment terms
            dueDate: calculateDueDate(result.data.paymentTerms || 30),
          }));
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

  function calculateDueDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  function handleCustomerSelect(customer: any) {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      dueDate: calculateDueDate(customer.paymentTermsDays || 30),
    }));
    setCustomerOpen(false);
    setCustomerSearch('');
  }

  function handleLineItemChange(index: number, field: keyof LineItem, value: string | number) {
    setFormData(prev => {
      const newItems = [...prev.lineItems];
      const updatedItem = { ...newItems[index], [field]: value };
      newItems[index] = calculateLineItem(updatedItem);
      return { ...prev, lineItems: newItems };
    });
  }

  function addLineItem() {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, createEmptyLineItem()],
    }));
  }

  function removeLineItem(index: number) {
    if (formData.lineItems.length === 1) return;
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  }

  // Calculate totals
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = formData.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + totalTax;

  async function handleSubmit(e: React.FormEvent, finalize = false) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }

    if (!formData.invoiceDate) {
      setError('Invoice date is required');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }

    const validItems = formData.lineItems.filter(item => 
      item.description.trim() && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one line item with description, quantity, and price');
      return;
    }

    setIsSubmitting(true);
    if (finalize) setIsFinalizing(true);

    try {
      // Create the invoice
      const result = await addInvoice({
        customerId: formData.customerId,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        referenceNumber: formData.poNumber || undefined,
        notes: formData.notes || undefined,
        internalNotes: formData.termsAndConditions || undefined,
        lineItems: validItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      });

      if (!result.success) {
        setError(result.error || 'Failed to create invoice');
        return;
      }

      // If finalize, post the invoice (creates GL entries)
      if (finalize && result.data) {
        const postResult = await postInvoice(result.data.id);
        if (!postResult.success) {
          // Invoice created but not posted - redirect to invoice page with warning
          router.push(`/dashboard/invoices/${result.data.id}?warning=post_failed`);
          return;
        }
      }

      // Success - redirect to invoice detail or list
      if (result.data) {
        router.push(`/dashboard/invoices/${result.data.id}`);
      } else {
        router.push('/dashboard/invoices');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
      setIsFinalizing(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/invoices"
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
              <p className="mt-1 text-sm text-slate-500">
                {formData.invoiceNumber || 'Creating invoice...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/invoices">Cancel</Link>
            </Button>
            <Button 
              variant="outline"
              onClick={(e) => handleSubmit(e, false)} 
              disabled={isSubmitting}
            >
              {isSubmitting && !isFinalizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button 
              onClick={(e) => handleSubmit(e, true)} 
              disabled={isSubmitting}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Save & Post
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <form onSubmit={(e) => handleSubmit(e, false)} className="max-w-5xl mx-auto space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Details */}
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
                        {selectedCustomer.email && (
                          <div className="text-sm text-slate-500">{selectedCustomer.email}</div>
                        )}
                        {selectedCustomer.ntn && (
                          <div className="text-xs text-slate-400 mt-1">NTN: {selectedCustomer.ntn}</div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setFormData(prev => ({ ...prev, customerId: '' }));
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

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Line Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Items */}
                    {formData.lineItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-5">
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end h-10 px-3 bg-slate-50 rounded-md text-sm font-medium">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            disabled={formData.lineItems.length === 1}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Tax Rate Row */}
                        <div className="col-span-12 flex items-center gap-2 text-xs text-slate-500 pl-2 -mt-2">
                          <span>GST:</span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={item.taxRate}
                            onChange={(e) => handleLineItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-16 h-6 text-xs text-right"
                          />
                          <span>% = {formatCurrency(item.taxAmount)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Add Item Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLineItem}
                      className="w-full mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Notes (visible on invoice)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes..."
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      value={formData.termsAndConditions}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                      placeholder="Payment terms and conditions..."
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Invoice Details & Totals */}
            <div className="space-y-6">
              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="mt-1.5"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="poNumber">PO Number</Label>
                    <Input
                      id="poNumber"
                      value={formData.poNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                      placeholder="Customer PO reference"
                      className="mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Totals */}
              <Card className="bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calculator className="h-5 w-5 text-blue-400" />
                    Invoice Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>GST ({DEFAULT_TAX_RATE}%)</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FBR Compliance Notice */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-800">FBR Compliance</div>
                    <p className="text-amber-700 mt-1">
                      This invoice will be recorded with 17% GST as per FBR regulations.
                      Ensure customer NTN is on file for B2B transactions.
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

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <InvoiceFormContent />
    </Suspense>
  );
}
