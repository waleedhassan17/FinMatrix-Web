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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Checkbox,
} from '@finmatrix/ui';
import {
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Banknote,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  fetchWithholdingTaxRecords,
  fetchWithholdingTaxSummary,
  createWithholdingTaxRecord,
  depositWithholdingTax,
} from '@/actions/fbr';

export default function FbrReportsPage() {
  const [activeTab, setActiveTab] = useState('withholding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Withholding Tax State
  const [whtRecords, setWhtRecords] = useState<any[]>([]);
  const [whtSummary, setWhtSummary] = useState<any[]>([]);
  const [showWhtModal, setShowWhtModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedWht, setSelectedWht] = useState<any>(null);
  const [depositData, setDepositData] = useState({
    date: new Date().toISOString().split('T')[0],
    cprNumber: '',
  });

  // WHT Form State
  const [whtForm, setWhtForm] = useState({
    transactionType: 'payment' as 'payment' | 'invoice',
    transactionDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    vendorNtn: '',
    vendorType: 'company' as 'company' | 'individual' | 'aop',
    isFiler: false,
    grossAmount: 0,
    withholdingSection: '153(1)(a)',
    withholdingRate: 4.5,
  });

  // Date filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  async function loadData() {
    setLoading(true);
    try {
      const [recordsResult, summaryResult] = await Promise.all([
        fetchWithholdingTaxRecords({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
        fetchWithholdingTaxSummary(dateRange.startDate, dateRange.endDate),
      ]);

      if (recordsResult.success) {
        setWhtRecords(recordsResult.data || []);
      }
      if (summaryResult.success) {
        setWhtSummary(summaryResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWht() {
    if (!whtForm.vendorName || whtForm.grossAmount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const result = await createWithholdingTaxRecord({
        transactionType: whtForm.transactionType,
        transactionDate: whtForm.transactionDate,
        vendorName: whtForm.vendorName,
        vendorNtn: whtForm.vendorNtn,
        vendorType: whtForm.vendorType,
        isFiler: whtForm.isFiler,
        grossAmount: whtForm.grossAmount,
        withholdingSection: whtForm.withholdingSection,
        withholdingRate: whtForm.withholdingRate,
      });

      if (result.success) {
        setWhtRecords([result.data, ...whtRecords]);
        setShowWhtModal(false);
        resetWhtForm();
        await loadData(); // Refresh summary
        alert('Withholding tax record created successfully!');
      } else {
        alert('Error creating record: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating WHT record:', error);
      alert('Failed to create record');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeposit() {
    if (!selectedWht || !depositData.cprNumber) {
      alert('Please enter CPR number');
      return;
    }

    try {
      const result = await depositWithholdingTax(selectedWht.id, depositData);
      if (result.success) {
        setWhtRecords(whtRecords.map(r =>
          r.id === selectedWht.id ? { ...r, isDeposited: true, ...depositData } : r
        ));
        setShowDepositModal(false);
        setSelectedWht(null);
        await loadData();
        alert('Deposit recorded successfully!');
      } else {
        alert('Error recording deposit: ' + result.error);
      }
    } catch (error) {
      console.error('Error recording deposit:', error);
      alert('Failed to record deposit');
    }
  }

  function resetWhtForm() {
    setWhtForm({
      transactionType: 'payment',
      transactionDate: new Date().toISOString().split('T')[0],
      vendorName: '',
      vendorNtn: '',
      vendorType: 'company',
      isFiler: false,
      grossAmount: 0,
      withholdingSection: '153(1)(a)',
      withholdingRate: 4.5,
    });
  }

  function updateWithholdingRate() {
    const section = whtForm.withholdingSection;
    const isFiler = whtForm.isFiler;

    const rates: Record<string, { filer: number; nonFiler: number }> = {
      '153(1)(a)': { filer: 4.5, nonFiler: 9 },
      '153(1)(b)': { filer: 8, nonFiler: 16 },
      '153(1)(c)': { filer: 7.5, nonFiler: 15 },
      '156A': { filer: 12, nonFiler: 24 },
    };

    const rate = rates[section] || { filer: 4.5, nonFiler: 9 };
    setWhtForm((prev) => ({
      ...prev,
      withholdingRate: isFiler ? rate.filer : rate.nonFiler,
    }));
  }

  useEffect(() => {
    updateWithholdingRate();
  }, [whtForm.withholdingSection, whtForm.isFiler]);

  const withholdingSections = [
    { value: '153(1)(a)', label: '153(1)(a) - Supply of Goods' },
    { value: '153(1)(b)', label: '153(1)(b) - Rendering of Services' },
    { value: '153(1)(c)', label: '153(1)(c) - Execution of Contract' },
    { value: '156A', label: '156A - Commission/Brokerage' },
  ];

  // Calculate WHT totals
  const totalWithheld = whtRecords.reduce((sum, r) => sum + parseFloat(r.withholdingAmount || '0'), 0);
  const totalDeposited = whtRecords
    .filter((r) => r.isDeposited)
    .reduce((sum, r) => sum + parseFloat(r.withholdingAmount || '0'), 0);
  const pendingDeposit = totalWithheld - totalDeposited;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
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
            <BarChart3 className="h-8 w-8 text-primary" />
            FBR Tax Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Withholding tax records, compliance reports, and analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">From:</Label>
            <Input
              type="date"
              className="w-40"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">To:</Label>
            <Input
              type="date"
              className="w-40"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="withholding">Withholding Tax (Section 153)</TabsTrigger>
          <TabsTrigger value="summary">Summary Reports</TabsTrigger>
        </TabsList>

        {/* Withholding Tax Tab */}
        <TabsContent value="withholding" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Withheld
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">PKR {totalWithheld.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {whtRecords.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Deposited
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  PKR {totalDeposited.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Paid to FBR</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Deposit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${pendingDeposit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  PKR {pendingDeposit.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingDeposit > 0 ? 'Due by 7th of next month' : 'All deposited'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Taxpayers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {whtRecords.filter((r) => r.isFiler).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {whtRecords.length} vendors are filers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Withholding Tax Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Withholding Tax Records</CardTitle>
                  <CardDescription>
                    Section 153 withholding on payments to suppliers
                  </CardDescription>
                </div>
                <Button onClick={() => setShowWhtModal(true)}>
                  <Banknote className="h-4 w-4 mr-2" />
                  Record Withholding
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {whtRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No withholding tax records for this period.</p>
                  <Button onClick={() => setShowWhtModal(true)}>
                    Record Your First Withholding
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Withheld</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whtRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.transactionDate}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.vendorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.vendorNtn || 'No NTN'}
                              {record.isFiler && (
                                <Badge variant="secondary" className="ml-2">Filer</Badge>
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.withholdingSection}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          PKR {parseFloat(record.grossAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {parseFloat(record.withholdingRate).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          PKR {parseFloat(record.withholdingAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {record.isDeposited ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Deposited
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!record.isDeposited && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedWht(record);
                                setShowDepositModal(true);
                              }}
                            >
                              Deposit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Withholding Rates Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Withholding Tax Rates (Section 153)</CardTitle>
              <CardDescription>Current FBR rates for filers and non-filers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Filer Rate</TableHead>
                    <TableHead className="text-right">Non-Filer Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">153(1)(a)</TableCell>
                    <TableCell>Supply of Goods</TableCell>
                    <TableCell className="text-right text-green-600">4.5%</TableCell>
                    <TableCell className="text-right text-red-600">9%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">153(1)(b)</TableCell>
                    <TableCell>Rendering of Services</TableCell>
                    <TableCell className="text-right text-green-600">8%</TableCell>
                    <TableCell className="text-right text-red-600">16%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">153(1)(c)</TableCell>
                    <TableCell>Execution of Contract</TableCell>
                    <TableCell className="text-right text-green-600">7.5%</TableCell>
                    <TableCell className="text-right text-red-600">15%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">156A</TableCell>
                    <TableCell>Commission/Brokerage</TableCell>
                    <TableCell className="text-right text-green-600">12%</TableCell>
                    <TableCell className="text-right text-red-600">24%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Reports Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Withholding Summary by Section */}
          <Card>
            <CardHeader>
              <CardTitle>Withholding Tax Summary by Section</CardTitle>
              <CardDescription>Breakdown by withholding tax section</CardDescription>
            </CardHeader>
            <CardContent>
              {whtSummary.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No withholding tax data for this period.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Total Withheld</TableHead>
                      <TableHead className="text-right">Deposited</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whtSummary.map((item) => (
                      <TableRow key={item.section}>
                        <TableCell className="font-medium">{item.section}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.totalTransactions}</TableCell>
                        <TableCell className="text-right font-mono">
                          PKR {(item.totalAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          PKR {(item.totalWithheld || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          PKR {(item.depositedAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${item.pendingDeposit > 0 ? 'text-red-600' : ''}`}>
                          PKR {(item.pendingDeposit || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Compliance Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Compliance Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Withholding Tax Deposit</p>
                    <p className="text-sm text-yellow-700">
                      Withholding tax must be deposited by the 7th of the following month.
                      Failure to deposit on time attracts default surcharge.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Monthly Statement</p>
                    <p className="text-sm text-blue-700">
                      File monthly statement of withholding tax with FBR by the 15th of each month.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Annual Certificate</p>
                    <p className="text-sm text-green-700">
                      Issue annual withholding tax certificates to suppliers by September 30th.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create WHT Record Modal */}
      <Dialog open={showWhtModal} onOpenChange={setShowWhtModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Withholding Tax</DialogTitle>
            <DialogDescription>
              Record withholding tax deducted from a payment or invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={whtForm.transactionType}
                  onValueChange={(value: 'payment' | 'invoice') =>
                    setWhtForm({ ...whtForm, transactionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={whtForm.transactionDate}
                  onChange={(e) => setWhtForm({ ...whtForm, transactionDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vendor Name *</Label>
              <Input
                placeholder="Supplier/Vendor name"
                value={whtForm.vendorName}
                onChange={(e) => setWhtForm({ ...whtForm, vendorName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor NTN</Label>
                <Input
                  placeholder="0000000-0"
                  value={whtForm.vendorNtn}
                  onChange={(e) => setWhtForm({ ...whtForm, vendorNtn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor Type</Label>
                <Select
                  value={whtForm.vendorType}
                  onValueChange={(value: 'company' | 'individual' | 'aop') =>
                    setWhtForm({ ...whtForm, vendorType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="aop">AOP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFiler"
                checked={whtForm.isFiler}
                onCheckedChange={(checked) =>
                  setWhtForm({ ...whtForm, isFiler: checked === true })
                }
              />
              <Label htmlFor="isFiler">Vendor is an Active Taxpayer (Filer)</Label>
            </div>

            <div className="space-y-2">
              <Label>Gross Amount (PKR) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={whtForm.grossAmount || ''}
                onChange={(e) => setWhtForm({ ...whtForm, grossAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Withholding Section</Label>
                <Select
                  value={whtForm.withholdingSection}
                  onValueChange={(value) => setWhtForm({ ...whtForm, withholdingSection: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {withholdingSections.map((section) => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={whtForm.withholdingRate}
                  onChange={(e) => setWhtForm({ ...whtForm, withholdingRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {whtForm.grossAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Gross Amount:</span>
                  <span className="font-mono">PKR {whtForm.grossAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Withholding ({whtForm.withholdingRate}%):</span>
                  <span className="font-mono text-red-600">
                    PKR {((whtForm.grossAmount * whtForm.withholdingRate) / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Net Payable:</span>
                  <span className="font-mono">
                    PKR {(whtForm.grossAmount - (whtForm.grossAmount * whtForm.withholdingRate) / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWhtModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWht} disabled={saving}>
              {saving ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Deposit</DialogTitle>
            <DialogDescription>
              Enter the CPR details for this withholding tax deposit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWht && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Amount to Deposit:</p>
                <p className="text-xl font-bold">
                  PKR {parseFloat(selectedWht.withholdingAmount).toLocaleString()}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Deposit Date</Label>
              <Input
                type="date"
                value={depositData.date}
                onChange={(e) => setDepositData({ ...depositData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CPR Number (Computerized Payment Receipt) *</Label>
              <Input
                placeholder="Enter CPR number"
                value={depositData.cprNumber}
                onChange={(e) => setDepositData({ ...depositData, cprNumber: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeposit}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
