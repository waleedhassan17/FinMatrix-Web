'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Receipt,
  Plus,
  ArrowLeft,
  Save,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calculator,
  FileCheck,
} from 'lucide-react';
import {
  fetchInputTaxClaims,
  fetchInputTaxClaimById,
  createInputTaxClaim,
  updateInputTaxClaim,
  fetchOpenFilingPeriods,
} from '@/actions/fbr';

export default function FormBPage() {
  const searchParams = useSearchParams();
  const periodIdParam = searchParams.get('period');

  const [claims, setClaims] = useState<any[]>([]);
  const [openPeriods, setOpenPeriods] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClaimPeriod, setNewClaimPeriod] = useState('');

  // Form state for editing
  const [formData, setFormData] = useState({
    localPurchasesValue: '0',
    localPurchasesTax: '0',
    importsValue: '0',
    importsTax: '0',
    capitalGoodsValue: '0',
    capitalGoodsTax: '0',
    servicesValue: '0',
    servicesTax: '0',
    previousPeriodAdjustment: '0',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (periodIdParam && openPeriods.length > 0) {
      setNewClaimPeriod(periodIdParam);
      setShowCreateModal(true);
    }
  }, [periodIdParam, openPeriods]);

  async function loadData() {
    setLoading(true);
    try {
      const [claimsResult, periodsResult] = await Promise.all([
        fetchInputTaxClaims(),
        fetchOpenFilingPeriods(),
      ]);

      if (claimsResult.success) {
        setClaims(claimsResult.data || []);
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

  async function handleCreateClaim() {
    if (!newClaimPeriod) {
      alert('Please select a filing period');
      return;
    }

    setSaving(true);
    try {
      const result = await createInputTaxClaim(newClaimPeriod);
      if (result.success) {
        setClaims([result.data, ...claims]);
        setShowCreateModal(false);
        setNewClaimPeriod('');
        handleSelectClaim(result.data);
      } else {
        alert('Error creating claim: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating claim:', error);
      alert('Failed to create claim');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectClaim(claimData: any) {
    setLoading(true);
    try {
      const result = await fetchInputTaxClaimById(claimData.id);
      if (result.success && result.data) {
        setSelectedClaim(result.data);
        setFormData({
          localPurchasesValue: result.data.localPurchasesValue || '0',
          localPurchasesTax: result.data.localPurchasesTax || '0',
          importsValue: result.data.importsValue || '0',
          importsTax: result.data.importsTax || '0',
          capitalGoodsValue: result.data.capitalGoodsValue || '0',
          capitalGoodsTax: result.data.capitalGoodsTax || '0',
          servicesValue: result.data.servicesValue || '0',
          servicesTax: result.data.servicesTax || '0',
          previousPeriodAdjustment: result.data.previousPeriodAdjustment || '0',
          notes: result.data.notes || '',
        });
      }
    } catch (error) {
      console.error('Error loading claim details:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTotals() {
    const localValue = parseFloat(formData.localPurchasesValue) || 0;
    const localTax = parseFloat(formData.localPurchasesTax) || 0;
    const importsValue = parseFloat(formData.importsValue) || 0;
    const importsTax = parseFloat(formData.importsTax) || 0;
    const capitalValue = parseFloat(formData.capitalGoodsValue) || 0;
    const capitalTax = parseFloat(formData.capitalGoodsTax) || 0;
    const servicesValue = parseFloat(formData.servicesValue) || 0;
    const servicesTax = parseFloat(formData.servicesTax) || 0;
    const adjustment = parseFloat(formData.previousPeriodAdjustment) || 0;

    const totalPurchases = localValue + importsValue + capitalValue + servicesValue;
    const totalInputTax = localTax + importsTax + capitalTax + servicesTax;
    const claimableInputTax = totalInputTax + adjustment;

    return { totalPurchases, totalInputTax, claimableInputTax };
  }

  async function handleSaveClaim() {
    if (!selectedClaim) return;

    setSaving(true);
    try {
      const { totalPurchases, totalInputTax, claimableInputTax } = calculateTotals();

      const result = await updateInputTaxClaim(selectedClaim.id, {
        ...formData,
        totalPurchasesValue: totalPurchases.toFixed(2),
        totalInputTax: totalInputTax.toFixed(2),
        claimableInputTax: claimableInputTax.toFixed(2),
        status: 'draft',
      });

      if (result.success) {
        setSelectedClaim({ ...selectedClaim, ...result.data });
        setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, ...result.data } : c));
        alert('Claim saved successfully!');
      } else {
        alert('Error saving claim: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving claim:', error);
      alert('Failed to save claim');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitClaim() {
    if (!selectedClaim) return;
    if (!confirm('Are you sure you want to submit this claim?')) return;

    setSaving(true);
    try {
      const { totalPurchases, totalInputTax, claimableInputTax } = calculateTotals();

      const result = await updateInputTaxClaim(selectedClaim.id, {
        ...formData,
        totalPurchasesValue: totalPurchases.toFixed(2),
        totalInputTax: totalInputTax.toFixed(2),
        claimableInputTax: claimableInputTax.toFixed(2),
        status: 'filed',
      });

      if (result.success) {
        setSelectedClaim({ ...selectedClaim, ...result.data, status: 'filed' });
        setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, status: 'filed' } : c));
        alert('Claim submitted successfully!');
      } else {
        alert('Error submitting claim: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(field: string, value: string) {
    setFormData({ ...formData, [field]: value });

    // Auto-calculate tax at 17%
    if (field === 'localPurchasesValue') {
      const tax = (parseFloat(value) || 0) * 0.17;
      setFormData(prev => ({ ...prev, [field]: value, localPurchasesTax: tax.toFixed(2) }));
    }
    if (field === 'importsValue') {
      const tax = (parseFloat(value) || 0) * 0.17;
      setFormData(prev => ({ ...prev, [field]: value, importsTax: tax.toFixed(2) }));
    }
    if (field === 'capitalGoodsValue') {
      const tax = (parseFloat(value) || 0) * 0.17;
      setFormData(prev => ({ ...prev, [field]: value, capitalGoodsTax: tax.toFixed(2) }));
    }
    if (field === 'servicesValue') {
      const tax = (parseFloat(value) || 0) * 0.17;
      setFormData(prev => ({ ...prev, [field]: value, servicesTax: tax.toFixed(2) }));
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filed':
        return <Badge className="bg-green-100 text-green-800">Filed</Badge>;
      case 'ready_to_file':
        return <Badge className="bg-blue-100 text-blue-800">Ready</Badge>;
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

  const { totalPurchases, totalInputTax, claimableInputTax } = calculateTotals();

  if (loading && !selectedClaim) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Form B...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedClaim && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedClaim(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-8 w-8 text-primary" />
              Form B - Input Tax Claim
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedClaim 
                ? `Claim: ${selectedClaim.claimNumber}` 
                : 'Claim input tax credit on your purchases and imports'
              }
            </p>
          </div>
        </div>
        {!selectedClaim && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Claim
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Input Tax Claim</DialogTitle>
                <DialogDescription>
                  Select the filing period for the new claim
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Filing Period</Label>
                  <Select value={newClaimPeriod} onValueChange={setNewClaimPeriod}>
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
                <Button onClick={handleCreateClaim} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Claim'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedClaim ? (
        /* Claim Detail View */
        <div className="space-y-6">
          {/* Status Bar */}
          <Card className={`border-l-4 ${
            selectedClaim.status === 'filed' ? 'border-l-green-500' :
            selectedClaim.status === 'draft' ? 'border-l-gray-500' :
            'border-l-yellow-500'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedClaim.status === 'filed' ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <Clock className="h-8 w-8 text-gray-500" />
                  )}
                  <div>
                    <p className="font-semibold">{selectedClaim.claimNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Input Tax Credit Claim
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedClaim.status)}
                  {selectedClaim.status !== 'filed' && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSaveClaim} disabled={saving}>
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Draft
                      </Button>
                      <Button onClick={handleSubmitClaim} disabled={saving}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Claim
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
              {/* Local Taxable Purchases */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Local Taxable Purchases</CardTitle>
                  <CardDescription>Purchases from registered suppliers within Pakistan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.localPurchasesValue}
                        onChange={(e) => handleInputChange('localPurchasesValue', e.target.value)}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Input Tax (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.localPurchasesTax}
                        onChange={(e) => setFormData({ ...formData, localPurchasesTax: e.target.value })}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Imports */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Imports</CardTitle>
                  <CardDescription>Goods imported and GST paid at customs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Import Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.importsValue}
                        onChange={(e) => handleInputChange('importsValue', e.target.value)}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GST Paid (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.importsTax}
                        onChange={(e) => setFormData({ ...formData, importsTax: e.target.value })}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capital Goods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Capital Goods</CardTitle>
                  <CardDescription>Machinery, equipment, and other capital assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capital Goods Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.capitalGoodsValue}
                        onChange={(e) => handleInputChange('capitalGoodsValue', e.target.value)}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Input Tax (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.capitalGoodsTax}
                        onChange={(e) => setFormData({ ...formData, capitalGoodsTax: e.target.value })}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">4. Services</CardTitle>
                  <CardDescription>Taxable services received</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Services Value (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.servicesValue}
                        onChange={(e) => handleInputChange('servicesValue', e.target.value)}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Input Tax (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.servicesTax}
                        onChange={(e) => setFormData({ ...formData, servicesTax: e.target.value })}
                        disabled={selectedClaim.status === 'filed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Previous Period Adjustment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">5. Adjustments</CardTitle>
                  <CardDescription>Carry forward from previous periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Previous Period Credit (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.previousPeriodAdjustment}
                        onChange={(e) => setFormData({ ...formData, previousPeriodAdjustment: e.target.value })}
                        disabled={selectedClaim.status === 'filed'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter positive for credit carry forward, negative for reversals
                      </p>
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
                    placeholder="Additional notes for this claim..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={selectedClaim.status === 'filed'}
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
                    Claim Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Local Purchases</span>
                      <span className="font-mono">PKR {parseFloat(formData.localPurchasesTax || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imports</span>
                      <span className="font-mono">PKR {parseFloat(formData.importsTax || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capital Goods</span>
                      <span className="font-mono">PKR {parseFloat(formData.capitalGoodsTax || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Services</span>
                      <span className="font-mono">PKR {parseFloat(formData.servicesTax || '0').toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total Input Tax</span>
                        <span>PKR {totalInputTax.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Adjustments</span>
                      <span className="font-mono">PKR {parseFloat(formData.previousPeriodAdjustment || '0').toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Claimable Input Tax</span>
                        <span className="text-purple-600">PKR {claimableInputTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Purchases Value</span>
                      <span className="font-mono">PKR {totalPurchases.toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedClaim.status !== 'filed' && (
                    <div className="pt-4 space-y-2">
                      <Button className="w-full" variant="outline" onClick={handleSaveClaim} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button className="w-full" onClick={handleSubmitClaim} disabled={saving}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Claim
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Important Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>• Input tax can only be claimed on taxable purchases</p>
                  <p>• Ensure all invoices have valid STRN of suppliers</p>
                  <p>• Capital goods input may be subject to restrictions</p>
                  <p>• Services from unregistered persons are not claimable</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Claims List View */
        <Card>
          <CardHeader>
            <CardTitle>Input Tax Claims</CardTitle>
            <CardDescription>All your Form B submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {claims.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No input tax claims yet.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Claim
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Number</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                    <TableHead className="text-right">Total Input Tax</TableHead>
                    <TableHead className="text-right">Claimable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                      <TableCell className="text-right font-mono">
                        PKR {parseFloat(claim.totalPurchasesValue || '0').toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        PKR {parseFloat(claim.totalInputTax || '0').toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-purple-600">
                        PKR {parseFloat(claim.claimableInputTax || '0').toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectClaim(claim)}
                        >
                          {claim.status === 'filed' ? 'View' : 'Edit'}
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
