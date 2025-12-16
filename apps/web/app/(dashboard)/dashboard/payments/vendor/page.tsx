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
import { Checkbox } from '@finmatrix/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import {
  fetchVendors,
  fetchOutstandingBills,
  fetchNextVendorPaymentNumber,
  createNewVendorPayment,
} from '@/actions/ap';
import { fetchAccounts } from '@/actions/gl';
import type { VendorListItem, OutstandingBill } from '@finmatrix/db';

interface BillAllocation {
  billId: string;
  selected: boolean;
  amountApplied: number;
}

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

export default function VendorPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get('vendorId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; accountNumber: string; name: string }[]
  >([]);
  const [outstandingBills, setOutstandingBills] = useState<OutstandingBill[]>([]);
  const [allocations, setAllocations] = useState<Map<string, BillAllocation>>(
    new Map()
  );
  const [paymentNumber, setPaymentNumber] = useState('');

  const [formData, setFormData] = useState({
    vendorId: preselectedVendorId || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer' as
      | 'bank_transfer'
      | 'cheque'
      | 'cash'
      | 'online'
      | 'credit_card',
    chequeNumber: '',
    bankAccountId: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [vendorsData, accountsData, nextPaymentNumber] = await Promise.all([
          fetchVendors({ isActive: true }),
          fetchAccounts(),
          fetchNextVendorPaymentNumber(),
        ]);
        setVendors(vendorsData);
        // Filter for bank/cash accounts (type = 'asset', subtype might be 'cash', 'bank')
        const banks = accountsData.filter(
          (acc: any) =>
            acc.type === 'asset' &&
            (acc.subType === 'cash' || acc.subType === 'bank' || acc.name.toLowerCase().includes('bank') || acc.name.toLowerCase().includes('cash'))
        );
        setBankAccounts(banks);
        setPaymentNumber(nextPaymentNumber);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadBills() {
      if (!formData.vendorId) {
        setOutstandingBills([]);
        setAllocations(new Map());
        return;
      }

      try {
        const bills = await fetchOutstandingBills(formData.vendorId);
        setOutstandingBills(bills);

        // Initialize allocations
        const newAllocations = new Map<string, BillAllocation>();
        bills.forEach((bill) => {
          newAllocations.set(bill.id, {
            billId: bill.id,
            selected: false,
            amountApplied: parseFloat(bill.balance),
          });
        });
        setAllocations(newAllocations);
      } catch (err) {
        console.error('Error loading bills:', err);
      }
    }
    loadBills();
  }, [formData.vendorId]);

  const handleVendorChange = (vendorId: string) => {
    setFormData((prev) => ({ ...prev, vendorId }));
  };

  const toggleBillSelection = (billId: string) => {
    setAllocations((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(billId);
      if (current) {
        newMap.set(billId, { ...current, selected: !current.selected });
      }
      return newMap;
    });
  };

  const updateAllocationAmount = (billId: string, amount: number) => {
    setAllocations((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(billId);
      if (current) {
        const bill = outstandingBills.find((b) => b.id === billId);
        const maxAmount = bill ? parseFloat(bill.balance) : amount;
        newMap.set(billId, {
          ...current,
          amountApplied: Math.min(amount, maxAmount),
        });
      }
      return newMap;
    });
  };

  const selectAllBills = () => {
    setAllocations((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((value, key) => {
        newMap.set(key, { ...value, selected: true });
      });
      return newMap;
    });
  };

  const getTotalPayment = (): number => {
    let total = 0;
    allocations.forEach((allocation) => {
      if (allocation.selected) {
        total += allocation.amountApplied;
      }
    });
    return total;
  };

  const getSelectedBillsCount = (): number => {
    let count = 0;
    allocations.forEach((allocation) => {
      if (allocation.selected) count++;
    });
    return count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedAllocations = Array.from(allocations.values()).filter(
      (a) => a.selected && a.amountApplied > 0
    );

    if (selectedAllocations.length === 0) {
      setError('Please select at least one bill to pay');
      return;
    }

    if (!formData.bankAccountId) {
      setError('Please select a bank account');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createNewVendorPayment({
        vendorId: formData.vendorId,
        paymentDate: formData.paymentDate,
        amount: getTotalPayment(),
        paymentMethod: formData.paymentMethod,
        chequeNumber: formData.chequeNumber || undefined,
        bankAccountId: formData.bankAccountId,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        allocations: selectedAllocations.map((a) => ({
          billId: a.billId,
          amountApplied: a.amountApplied,
        })),
      });

      if (result.success) {
        router.push(`/dashboard/vendors/${formData.vendorId}`);
      } else {
        setError(result.error || 'Failed to create payment');
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
        <Link href="/dashboard/vendors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pay Bills</h1>
          <p className="text-muted-foreground">
            Payment #{paymentNumber}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Select vendor and payment details</CardDescription>
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
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountId">Bank Account *</Label>
                <Select
                  value={formData.bankAccountId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, bankAccountId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountNumber} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.paymentMethod === 'cheque' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">Cheque Number</Label>
                  <Input
                    id="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        chequeNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter cheque number"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reference: e.target.value }))
                }
                placeholder="Payment reference or memo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Outstanding Bills</CardTitle>
              <CardDescription>
                Select bills to pay ({getSelectedBillsCount()} selected)
              </CardDescription>
            </div>
            {outstandingBills.length > 0 && (
              <Button type="button" variant="outline" onClick={selectAllBills}>
                Select All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!formData.vendorId ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a vendor to see outstanding bills
              </div>
            ) : outstandingBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No outstanding bills for this vendor
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pay</TableHead>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Amount to Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingBills.map((bill) => {
                    const allocation = allocations.get(bill.id);
                    return (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <Checkbox
                            checked={allocation?.selected || false}
                            onCheckedChange={() => toggleBillSelection(bill.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{bill.billNumber}</div>
                          {bill.vendorInvoiceNumber && (
                            <div className="text-xs text-muted-foreground">
                              Ref: {bill.vendorInvoiceNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(bill.billDate)}</TableCell>
                        <TableCell>
                          <span
                            className={bill.isOverdue ? 'text-red-500 font-medium' : ''}
                          >
                            {formatDate(bill.dueDate)}
                            {bill.isOverdue && bill.daysOverdue > 0 && (
                              <span className="block text-xs">
                                ({bill.daysOverdue} days overdue)
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(bill.total)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(bill.balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={allocation?.amountApplied || 0}
                            onChange={(e) =>
                              updateAllocationAmount(
                                bill.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={!allocation?.selected}
                            className="w-32 text-right ml-auto"
                            min={0}
                            max={parseFloat(bill.balance)}
                            step={0.01}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Payment Total */}
            {outstandingBills.length > 0 && (
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-end items-center gap-4">
                  <span className="text-lg font-medium">Total Payment:</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(getTotalPayment())}
                  </span>
                </div>
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
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Any additional notes about this payment..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/vendors">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.vendorId ||
              !formData.bankAccountId ||
              getSelectedBillsCount() === 0
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Record Payment ({formatCurrency(getTotalPayment())})
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
