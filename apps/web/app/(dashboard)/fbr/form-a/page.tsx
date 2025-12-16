'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Textarea,
  Input,
  Label,
} from '@finmatrix/ui';
import {
  FileText,
  Plus,
  ArrowLeft,
  Send,
  Save,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Calculator,
} from 'lucide-react';
import {
  fetchSalesTaxReturns,
  fetchSalesTaxReturnById,
  createSalesTaxReturn,
  updateSalesTaxReturn,
  fileSalesTaxReturn,
  fetchOpenFilingPeriods,
} from '@/actions/fbr';

export default function FormAPage() {
  const searchParams = useSearchParams();
  const periodIdParam = searchParams.get('period');

  const [returns, setReturns] = useState<any[]>([]);
  const [openPeriods, setOpenPeriods] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReturnPeriod, setNewReturnPeriod] = useState('');

  // Form state for editing
  const [formData, setFormData] = useState({
    taxableSuppliesValue: '0',
    taxableSuppliesTax: '0',
    reducedRateSuppliesValue: '0',
    reducedRateSuppliesTax: '0',
    zeroRatedSuppliesValue: '0',
    exemptSuppliesValue: '0',
    exportSuppliesValue: '0',
    furtherTaxValue: '0',
    furtherTaxAmount: '0',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (periodIdParam && openPeriods.length > 0) {
      setNewReturnPeriod(periodIdParam);
      setShowCreateModal(true);
    }
  }, [periodIdParam, openPeriods]);

  async function loadData() {
    setLoading(true);
    try {
      const [returnsResult, periodsResult] = await Promise.all([
        fetchSalesTaxReturns(),
        fetchOpenFilingPeriods(),
      ]);

      if (returnsResult.success) {
        setReturns(returnsResult.data || []);
      }
      if (periodsResult.success) {
        setOpenPeriods(periodsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReturn() {
    if (!newReturnPeriod) {
      alert('Please select a filing period');
      return;
    }

    setSaving(true);
    try {
      const result = await createSalesTaxReturn(newReturnPeriod);
      if (result.success) {
        setReturns([result.data, ...returns]);
        setShowCreateModal(false);
        setNewReturnPeriod('');
        handleSelectReturn(result.data);
      } else {
        alert('Error creating return: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating return:', error);
      alert('Failed to create return');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectReturn(returnData: any) {
    setLoading(true);
    try {
      const result = await fetchSalesTaxReturnById(returnData.id);
      if (result.success && result.data) {
        setSelectedReturn(result.data);
        setFormData({
          taxableSuppliesValue: result.data.taxableSuppliesValue || '0',
          taxableSuppliesTax: result.data.taxableSuppliesTax || '0',
          reducedRateSuppliesValue: result.data.reducedRateSuppliesValue || '0',
          reducedRateSuppliesTax: result.data.reducedRateSuppliesTax || '0',
          zeroRatedSuppliesValue: result.data.zeroRatedSuppliesValue || '0',
          exemptSuppliesValue: result.data.exemptSuppliesValue || '0',
          exportSuppliesValue: result.data.exportSuppliesValue || '0',
          furtherTaxValue: result.data.furtherTaxValue || '0',
          furtherTaxAmount: result.data.furtherTaxAmount || '0',
          notes: result.data.notes || '',
        });
      }
    } catch (error) {
      console.error('Error loading return details:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTotals() {
    const taxableValue = parseFloat(formData.taxableSuppliesValue) || 0;
    const taxableTax = parseFloat(formData.taxableSuppliesTax) || 0;
    const reducedValue = parseFloat(formData.reducedRateSuppliesValue) || 0;
    const reducedTax = parseFloat(formData.reducedRateSuppliesTax) || 0;
    const zeroRated = parseFloat(formData.zeroRatedSuppliesValue) || 0;
    const exempt = parseFloat(formData.exemptSuppliesValue) || 0;
    const exports = parseFloat(formData.exportSuppliesValue) || 0;
    const furtherTax = parseFloat(formData.furtherTaxAmount) || 0;

    const totalSupplies = taxableValue + reducedValue + zeroRated + exempt + exports;
    const totalOutputTax = taxableTax + reducedTax + furtherTax;

    return { totalSupplies, totalOutputTax };
  }

  async function handleSaveReturn() {
    if (!selectedReturn) return;

    setSaving(true);
    try {
      const { totalSupplies, totalOutputTax } = calculateTotals();

      const result = await updateSalesTaxReturn(selectedReturn.id, {
        ...formData,
        totalSuppliesValue: totalSupplies.toFixed(2),
        totalOutputTax: totalOutputTax.toFixed(2),
        status: 'draft',
      });

      if (result.success) {
        setSelectedReturn({ ...selectedReturn, ...result.data });
        setReturns(returns.map(r => r.id === selectedReturn.id ? { ...r, ...result.data } : r));
        alert('Return saved successfully!');
      } else {
        alert('Error saving return: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving return:', error);
      alert('Failed to save return');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileReturn() {
    if (!selectedReturn) return;
    if (!confirm('Are you sure you want to file this return? This action cannot be undone.')) return;

    setSaving(true);
    try {
      // First save the current data
      const { totalSupplies, totalOutputTax } = calculateTotals();
      await updateSalesTaxReturn(selectedReturn.id, {
        ...formData,
        totalSuppliesValue: totalSupplies.toFixed(2),
        totalOutputTax: totalOutputTax.toFixed(2),
      });

      // Then file it
      const result = await fileSalesTaxReturn(selectedReturn.id);
      if (result.success) {
        setSelectedReturn({ ...selectedReturn, ...result.data, status: 'filed' });
        setReturns(returns.map(r => r.id === selectedReturn.id ? { ...r, status: 'filed' } : r));
        alert('Return filed successfully!');
      } else {
        alert('Error filing return: ' + result.error);
      }
    } catch (error) {
      console.error('Error filing return:', error);
      alert('Failed to file return');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(field: string, value: string) {
    setFormData({ ...formData, [field]: value });

    // Auto-calculate tax for taxable supplies at 17%
    if (field === 'taxableSuppliesValue') {
      const tax = (parseFloat(value) || 0) * 0.17;
      setFormData(prev => ({ ...prev, [field]: value, taxableSuppliesTax: tax.toFixed(2) }));
    }

    // Auto-calculate further tax at 3%
    if (field === 'furtherTaxValue') {
      const tax = (parseFloat(value) || 0) * 0.03;
      setFormData(prev => ({ ...prev, [field]: value, furtherTaxAmount: tax.toFixed(2) }));
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filed':
        return <Badge className="bg-green-100 text-green-800">Filed</Badge>;
      case 'ready_to_file':
        return <Badge className="bg-blue-100 text-blue-800">Ready to File</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const { totalSupplies, totalOutputTax } = calculateTotals();

  if (loading && !selectedReturn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Form A...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedReturn && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedReturn(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Form A - Sales Tax Return
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedReturn 
                ? `Return: ${selectedReturn.returnNumber}` 
                : 'Prepare and file your monthly GST return (Output Tax)'
              }
            </p>
          </div>
        </div>
        {!selectedReturn && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Return
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sales Tax Return</DialogTitle>
                <DialogDescription>
                  Select the filing period for the new return
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Filing Period</Label>
                  <Select value={newReturnPeriod} onValueChange={setNewReturnPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a period" />
                    </SelectTrigger>
                    <SelectContent>
                      {openPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.periodName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReturn} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Return'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedReturn ? (
        /* Return Detail View */
        <div className="space-y-6">
          {/* Status Bar */}
          <Card className={`border-l-4 ${
            selectedReturn.status === 'filed' ? 'border-l-green-500' :
            selectedReturn.status === 'draft' ? 'border-l-gray-500' :
            'border-l-yellow-500'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedReturn.status === 'filed' ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <Clock className="h-8 w-8 text-gray-500" />
                  )}
                  <div>
                    <p className="font-semibold">{selectedReturn.returnNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {selectedReturn.returnType || 'Original'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedReturn.status)}
                  {selectedReturn.status !== 'filed' && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSaveReturn} disabled={saving}>
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Draft
                      </Button>
                      <Button onClick={handleFileReturn} disabled={saving}>
                        <Send className="h-4 w-4 mr-2" />
                        File Return
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Taxable Supplies at Standard Rate (17%) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Taxable Supplies at Standard Rate (17%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.taxableSuppliesValue}
                        onChange={(e) => handleInputChange('taxableSuppliesValue', e.target.value)}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax @ 17% (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.taxableSuppliesTax}
                        onChange={(e) => setFormData({ ...formData, taxableSuppliesTax: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Taxable Supplies at Reduced Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Taxable Supplies at Reduced Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.reducedRateSuppliesValue}
                        onChange={(e) => setFormData({ ...formData, reducedRateSuppliesValue: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Amount (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.reducedRateSuppliesTax}
                        onChange={(e) => setFormData({ ...formData, reducedRateSuppliesTax: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zero-Rated, Exempt & Export Supplies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Zero-Rated, Exempt & Export Supplies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Zero-Rated Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.zeroRatedSuppliesValue}
                        onChange={(e) => setFormData({ ...formData, zeroRatedSuppliesValue: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exempt Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.exemptSuppliesValue}
                        onChange={(e) => setFormData({ ...formData, exemptSuppliesValue: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Export Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.exportSuppliesValue}
                        onChange={(e) => setFormData({ ...formData, exportSuppliesValue: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Further Tax */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">4. Further Tax (3% on Unregistered Persons)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Value to Unregistered (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.furtherTaxValue}
                        onChange={(e) => handleInputChange('furtherTaxValue', e.target.value)}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Further Tax @ 3% (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.furtherTaxAmount}
                        onChange={(e) => setFormData({ ...formData, furtherTaxAmount: e.target.value })}
                        disabled={selectedReturn.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Additional notes for this return..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={selectedReturn.status === 'filed'}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Return Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxable (17%)</span>
                      <span className="font-mono">PKR {parseFloat(formData.taxableSuppliesTax || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reduced Rate</span>
                      <span className="font-mono">PKR {parseFloat(formData.reducedRateSuppliesTax || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Further Tax</span>
                      <span className="font-mono">PKR {parseFloat(formData.furtherTaxAmount || '0').toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Output Tax</span>
                        <span className="text-green-600">PKR {totalOutputTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Supplies Value</span>
                      <span className="font-mono">PKR {totalSupplies.toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedReturn.status !== 'filed' && (
                    <div className="pt-4 space-y-2">
                      <Button className="w-full" onClick={handleSaveReturn} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button className="w-full" variant="default" onClick={handleFileReturn} disabled={saving}>
                        <Send className="h-4 w-4 mr-2" />
                        File to FBR
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Returns List View */
        <Card>
          <CardHeader>
            <CardTitle>Sales Tax Returns</CardTitle>
            <CardDescription>All your Form A submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {returns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No sales tax returns yet.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Return
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total Supplies</TableHead>
                    <TableHead className="text-right">Output Tax</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ret.returnType || 'Original'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        PKR {parseFloat(ret.totalSuppliesValue || '0').toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        PKR {parseFloat(ret.totalOutputTax || '0').toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(ret.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ret.filedAt ? new Date(ret.filedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectReturn(ret)}
                        >
                          {ret.status === 'filed' ? 'View' : 'Edit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
