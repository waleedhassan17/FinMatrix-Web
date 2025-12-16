'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@finmatrix/ui';
import {
  Calculator,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Banknote,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Receipt,
} from 'lucide-react';
import {
  fetchGstReconciliations,
  calculateReconciliation,
  recordGstPayment,
  fetchOpenFilingPeriods,
  fetchMonthlyGstTrend,
} from '@/actions/fbr';

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [openPeriods, setOpenPeriods] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    cprNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const [reconcResult, periodsResult, trendResult] = await Promise.all([
        fetchGstReconciliations(),
        fetchOpenFilingPeriods(),
        fetchMonthlyGstTrend(currentYear),
      ]);

      if (reconcResult.success) {
        setReconciliations(reconcResult.data || []);
      }
      if (periodsResult.success) {
        setOpenPeriods(periodsResult.data || []);
      }
      if (trendResult.success) {
        setMonthlyTrend(trendResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCalculateReconciliation() {
    if (!selectedPeriod) {
      alert('Please select a filing period');
      return;
    }

    setCalculating(true);
    try {
      const result = await calculateReconciliation(selectedPeriod);
      if (result.success) {
        await loadData();
        alert('Reconciliation calculated successfully!');
      } else {
        alert('Error calculating reconciliation: ' + result.error);
      }
    } catch (error) {
      console.error('Error calculating reconciliation:', error);
      alert('Failed to calculate reconciliation');
    } finally {
      setCalculating(false);
    }
  }

  async function handleRecordPayment() {
    if (!selectedReconciliation || !paymentData.amount) {
      alert('Please enter payment details');
      return;
    }

    try {
      const result = await recordGstPayment(selectedReconciliation.id, {
        amount: parseFloat(paymentData.amount),
        date: paymentData.date,
        reference: paymentData.reference,
        cprNumber: paymentData.cprNumber,
      });

      if (result.success) {
        setReconciliations(reconciliations.map(r =>
          r.id === selectedReconciliation.id ? { ...r, ...result.data } : r
        ));
        setShowPaymentModal(false);
        setSelectedReconciliation(null);
        setPaymentData({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          reference: '',
          cprNumber: '',
        });
        alert('Payment recorded successfully!');
      } else {
        alert('Error recording payment: ' + result.error);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  }

  function openPaymentModal(reconciliation: any) {
    setSelectedReconciliation(reconciliation);
    setPaymentData({
      amount: reconciliation.netTaxPayable > 0 ? reconciliation.netTaxPayable : '0',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      cprNumber: '',
    });
    setShowPaymentModal(true);
  }

  const getStatusBadge = (status: string, netPayable: number) => {
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (status === 'refund_claimed') {
      return <Badge className="bg-blue-100 text-blue-800">Refund Claimed</Badge>;
    }
    if (netPayable > 0) {
      return <Badge className="bg-red-100 text-red-800">Payable</Badge>;
    }
    if (netPayable < 0) {
      return <Badge className="bg-purple-100 text-purple-800">Credit</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  // Calculate summary totals
  const totalOutputTax = reconciliations.reduce((sum, r) => sum + parseFloat(r.totalOutputTax || '0'), 0);
  const totalInputTax = reconciliations.reduce((sum, r) => sum + parseFloat(r.totalInputTax || '0'), 0);
  const totalNetPayable = reconciliations.reduce((sum, r) => sum + parseFloat(r.netTaxPayable || '0'), 0);
  const totalPaid = reconciliations.reduce((sum, r) => sum + parseFloat(r.amountPaid || '0'), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reconciliations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            GST Reconciliation
          </h1>
          <p className="text-muted-foreground mt-1">
            Reconcile output and input tax, calculate net payable amount
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {openPeriods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.periodName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCalculateReconciliation} disabled={calculating || !selectedPeriod}>
            {calculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Output Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              PKR {totalOutputTax.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Form A - Sales Tax</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Input Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              PKR {totalInputTax.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Form B - Input Credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {totalNetPayable >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              Net Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalNetPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              PKR {Math.abs(totalNetPayable).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalNetPayable >= 0 ? 'Payable to FBR' : 'Credit Available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              PKR {totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Deposited with FBR</p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How GST Reconciliation Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-center">
            <div className="flex-1">
              <div className="p-3 bg-green-50 rounded-lg inline-block mb-2">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Output Tax</p>
              <p className="text-sm text-muted-foreground">Form A</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="p-3 bg-purple-50 rounded-lg inline-block mb-2">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium">Input Tax</p>
              <p className="text-sm text-muted-foreground">Form B</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="p-3 bg-blue-50 rounded-lg inline-block mb-2">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium">Net Payable</p>
              <p className="text-sm text-muted-foreground">Output - Input</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="p-3 bg-orange-50 rounded-lg inline-block mb-2">
                <Banknote className="h-6 w-6 text-orange-600" />
              </div>
              <p className="font-medium">Payment/Credit</p>
              <p className="text-sm text-muted-foreground">Deposit or Carry Forward</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation History</CardTitle>
          <CardDescription>Monthly GST reconciliations and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {reconciliations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No reconciliations yet.</p>
              <p className="text-sm">Select a period and click "Calculate" to create a reconciliation.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Output Tax</TableHead>
                  <TableHead className="text-right">Input Tax</TableHead>
                  <TableHead className="text-right">Previous Credit</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead className="text-right">Carry Forward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((reconciliation) => {
                  const netPayable = parseFloat(reconciliation.netTaxPayable || '0');
                  const carryForward = parseFloat(reconciliation.carryForwardCredit || '0');

                  return (
                    <TableRow key={reconciliation.id}>
                      <TableCell className="font-medium">
                        {reconciliation.periodId?.substring(0, 8) || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        PKR {parseFloat(reconciliation.totalOutputTax || '0').toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-600">
                        PKR {parseFloat(reconciliation.totalInputTax || '0').toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        PKR {parseFloat(reconciliation.previousPeriodCredit || '0').toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${netPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {netPayable >= 0 ? '' : '('} PKR {Math.abs(netPayable).toLocaleString()} {netPayable < 0 ? ')' : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {carryForward > 0 ? (
                          <span className="text-blue-600">PKR {carryForward.toLocaleString()}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reconciliation.status, netPayable)}
                      </TableCell>
                      <TableCell className="text-right">
                        {reconciliation.status !== 'paid' && netPayable > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentModal(reconciliation)}
                          >
                            <Banknote className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        )}
                        {reconciliation.status === 'paid' && (
                          <span className="text-sm text-muted-foreground">
                            CPR: {reconciliation.cprNumber || 'N/A'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Chart (Simple visualization) */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly GST Trend</CardTitle>
            <CardDescription>Output tax vs Input tax over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrend.map((item) => {
                const maxValue = Math.max(item.outputTax, item.inputTax, 1);
                const outputWidth = (item.outputTax / maxValue) * 100;
                const inputWidth = (item.inputTax / maxValue) * 100;

                return (
                  <div key={item.period} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.month}</span>
                      <span className={item.netPayable >= 0 ? 'text-red-600' : 'text-green-600'}>
                        Net: PKR {Math.abs(item.netPayable).toLocaleString()}
                        {item.netPayable < 0 ? ' (Credit)' : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div
                          className="h-4 bg-green-500 rounded"
                          style={{ width: `${outputWidth}%` }}
                          title={`Output: PKR ${item.outputTax.toLocaleString()}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-4 bg-purple-500 rounded"
                          style={{ width: `${inputWidth}%` }}
                          title={`Input: PKR ${item.inputTax.toLocaleString()}`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Output: PKR {item.outputTax.toLocaleString()}</span>
                      <span>Input: PKR {item.inputTax.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-8 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Output Tax</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span>Input Tax</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record GST Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for FBR deposit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentData.date}
                onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Reference</Label>
              <Input
                placeholder="Bank reference number"
                value={paymentData.reference}
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CPR Number (Computerized Payment Receipt)</Label>
              <Input
                placeholder="FBR CPR number"
                value={paymentData.cprNumber}
                onChange={(e) => setPaymentData({ ...paymentData, cprNumber: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
