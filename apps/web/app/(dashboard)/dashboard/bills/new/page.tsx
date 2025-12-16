'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Label } from '@finmatrix/ui';
import { Textarea } from '@finmatrix/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  fetchVendors,
  fetchNextBillNumber,
  createNewBill,
  finalizeBillAction,
} from '@/actions/ap';
import { fetchAccounts } from '@/actions/gl';
import type { VendorListItem } from '@finmatrix/db';

interface LineItem {
  id: string;
  expenseAccountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function NewBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get('vendorId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<
    { id: string; accountNumber: string; name: string }[]
  >([]);
  const [billNumber, setBillNumber] = useState('');

  const [formData, setFormData] = useState({
    vendorId: preselectedVendorId || '',
    vendorInvoiceNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      expenseAccountId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 17, // Default GST rate in Pakistan
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [vendorsData, accountsData, nextBillNumber] = await Promise.all([
          fetchVendors({ isActive: true }),
          fetchAccounts(),
          fetchNextBillNumber(),
        ]);
        setVendors(vendorsData);
        // Filter for expense accounts (type = 'expense')
        const expenses = accountsData.filter(
          (acc: any) => acc.type === 'expense' || acc.type === 'cost_of_goods_sold'
        );
        setExpenseAccounts(expenses);
        setBillNumber(nextBillNumber);

        // Set default due date based on selected vendor's payment terms
        if (preselectedVendorId) {
          const vendor = vendorsData.find((v: VendorListItem) => v.id === preselectedVendorId);
          if (vendor) {
            calculateDueDate(formData.billDate, 30); // Default 30 days
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    }
    loadData();
  }, [preselectedVendorId]);

  const calculateDueDate = (billDate: string, paymentTerms: number) => {
    const date = new Date(billDate);
    date.setDate(date.getDate() + paymentTerms);
    setFormData((prev) => ({
      ...prev,
      dueDate: date.toISOString().split('T')[0],
    }));
  };

  const handleVendorChange = (vendorId: string) => {
    setFormData((prev) => ({ ...prev, vendorId }));
    // You could fetch vendor payment terms here and recalculate due date
    calculateDueDate(formData.billDate, 30);
  };

  const handleLineItemChange = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        expenseAccountId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 17,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const calculateLineTotal = (item: LineItem): number => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * (item.taxRate / 100);
    return subtotal + tax;
  };

  const calculateSubtotal = (): number => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const calculateTotalTax = (): number => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + subtotal * (item.taxRate / 100);
    }, 0);
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const handleSubmit = async (e: React.FormEvent, finalize: boolean = false) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate line items
      const validLineItems = lineItems.filter(
        (item) => item.expenseAccountId && item.description && item.unitPrice > 0
      );

      if (validLineItems.length === 0) {
        setError('Please add at least one valid line item');
        setIsSubmitting(false);
        return;
      }

      const result = await createNewBill({
        vendorId: formData.vendorId,
        vendorInvoiceNumber: formData.vendorInvoiceNumber || undefined,
        billDate: formData.billDate,
        dueDate: formData.dueDate,
        notes: formData.notes || undefined,
        lineItems: validLineItems.map((item) => ({
          expenseAccountId: item.expenseAccountId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      });

      if (result.success && result.id) {
        if (finalize) {
          // Finalize the bill - you'd need AP account and GST account IDs
          // For now, just redirect to the bill page
          router.push(`/dashboard/bills/${result.id}`);
        } else {
          router.push(`/dashboard/bills/${result.id}`);
        }
      } else {
        setError(result.error || 'Failed to create bill');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bills">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enter Bill</h1>
          <p className="text-muted-foreground">
            Record a vendor invoice - Bill #{billNumber}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Vendor & Bill Info */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Information</CardTitle>
            <CardDescription>Vendor and date details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendorId">Vendor *</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={handleVendorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.companyName} ({vendor.vendorNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorInvoiceNumber">Vendor Invoice # (Reference)</Label>
                <Input
                  id="vendorInvoiceNumber"
                  value={formData.vendorInvoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vendorInvoiceNumber: e.target.value,
                    }))
                  }
                  placeholder="Vendor's invoice number"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billDate">Bill Date *</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      billDate: e.target.value,
                    }));
                    calculateDueDate(e.target.value, 30);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add expense items from the bill</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={addLineItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                <div className="col-span-3">Expense Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-1">Tax %</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Line Item Rows */}
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 border rounded-lg"
                >
                  <div className="md:col-span-3">
                    <Label className="md:hidden text-xs">Expense Account</Label>
                    <Select
                      value={item.expenseAccountId}
                      onValueChange={(value) =>
                        handleLineItemChange(item.id, 'expenseAccountId', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountNumber} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="md:hidden text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleLineItemChange(item.id, 'description', e.target.value)
                      }
                      placeholder="Description"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="md:hidden text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(
                          item.id,
                          'quantity',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="md:hidden text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleLineItemChange(
                          item.id,
                          'unitPrice',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="md:hidden text-xs">Tax %</Label>
                    <Input
                      type="number"
                      value={item.taxRate}
                      onChange={(e) =>
                        handleLineItemChange(
                          item.id,
                          'taxRate',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min={0}
                      max={100}
                      step={0.01}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end">
                    <span className="font-medium">
                      {formatCurrency(calculateLineTotal(item))}
                    </span>
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (Input GST):</span>
                  <span>{formatCurrency(calculateTotalTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Any additional notes about this bill..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/bills">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !formData.vendorId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
