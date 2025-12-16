'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  DialogTrigger,
  Switch,
  Textarea,
} from '@finmatrix/ui';
import {
  Settings,
  Building2,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  fetchTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  fetchTaxRegistration,
  saveTaxRegistration,
  fetchFilingPeriods,
  generateFilingPeriods,
  closeFilingPeriod,
} from '@/actions/fbr';

export default function FbrConfigPage() {
  const [activeTab, setActiveTab] = useState('registration');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tax Registration State
  const [registration, setRegistration] = useState({
    ntn: '',
    strn: '',
    businessType: 'manufacturer' as 'manufacturer' | 'importer' | 'exporter' | 'retailer' | 'wholesaler' | 'service_provider' | 'contractor' | 'other',
    registeredName: '',
    businessAddress: '',
    principalBusinessActivity: '',
    taxOffice: '',
    registrationDate: '',
    punjabStn: '',
    sindhSrn: '',
    kpkStn: '',
    balochistanStn: '',
  });

  // Tax Rates State
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [rateForm, setRateForm] = useState({
    code: '',
    name: '',
    description: '',
    taxType: 'gst' as const,
    rate: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    isDefault: false,
    applicableToSales: true,
    applicableToPurchases: true,
    fbrTaxCode: '',
  });

  // Filing Periods State
  const [filingPeriods, setFilingPeriods] = useState<any[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'periods') {
      loadFilingPeriods();
    }
  }, [selectedFiscalYear]);

  async function loadData() {
    setLoading(true);
    try {
      const [regResult, ratesResult, periodsResult] = await Promise.all([
        fetchTaxRegistration(),
        fetchTaxRates(),
        fetchFilingPeriods(selectedFiscalYear),
      ]);

      if (regResult.success && regResult.data) {
        setRegistration({
          ntn: regResult.data.ntn || '',
          strn: regResult.data.strn || '',
          businessType: regResult.data.businessType || 'manufacturer',
          registeredName: regResult.data.registeredName || '',
          businessAddress: regResult.data.businessAddress || '',
          principalBusinessActivity: regResult.data.principalBusinessActivity || '',
          taxOffice: regResult.data.taxOffice || '',
          registrationDate: regResult.data.registrationDate || '',
          punjabStn: regResult.data.punjabStn || '',
          sindhSrn: regResult.data.sindhSrn || '',
          kpkStn: regResult.data.kpkStn || '',
          balochistanStn: regResult.data.balochistanStn || '',
        });
      }

      if (ratesResult.success) {
        setTaxRates(ratesResult.data || []);
      }

      if (periodsResult.success) {
        setFilingPeriods(periodsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFilingPeriods() {
    const result = await fetchFilingPeriods(selectedFiscalYear);
    if (result.success) {
      setFilingPeriods(result.data || []);
    }
  }

  async function handleSaveRegistration() {
    setSaving(true);
    try {
      const result = await saveTaxRegistration(registration);
      if (result.success) {
        alert('Tax registration saved successfully!');
      } else {
        alert('Error saving registration: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      alert('Failed to save registration');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRate() {
    setSaving(true);
    try {
      if (editingRate) {
        const result = await updateTaxRate(editingRate.id, rateForm);
        if (result.success) {
          setTaxRates(taxRates.map(r => r.id === editingRate.id ? result.data : r));
          setShowRateModal(false);
          resetRateForm();
        } else {
          alert('Error updating rate: ' + result.error);
        }
      } else {
        const result = await createTaxRate(rateForm);
        if (result.success) {
          setTaxRates([...taxRates, result.data]);
          setShowRateModal(false);
          resetRateForm();
        } else {
          alert('Error creating rate: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      alert('Failed to save rate');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRate(id: string) {
    if (!confirm('Are you sure you want to delete this tax rate?')) return;

    try {
      const result = await deleteTaxRate(id);
      if (result.success) {
        setTaxRates(taxRates.filter(r => r.id !== id));
      } else {
        alert('Error deleting rate: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting rate:', error);
      alert('Failed to delete rate');
    }
  }

  async function handleGeneratePeriods() {
    if (!confirm(`Generate monthly filing periods for fiscal year ${selectedFiscalYear}?`)) return;

    try {
      const result = await generateFilingPeriods(selectedFiscalYear);
      if (result.success) {
        setFilingPeriods(result.data || []);
        alert('Filing periods generated successfully!');
      } else {
        alert('Error generating periods: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating periods:', error);
      alert('Failed to generate periods');
    }
  }

  async function handleClosePeriod(periodId: string) {
    if (!confirm('Are you sure you want to close this filing period? This action cannot be undone.')) return;

    try {
      const result = await closeFilingPeriod(periodId);
      if (result.success) {
        setFilingPeriods(filingPeriods.map(p => 
          p.id === periodId ? { ...p, isClosed: true, closedAt: new Date() } : p
        ));
      } else {
        alert('Error closing period: ' + result.error);
      }
    } catch (error) {
      console.error('Error closing period:', error);
      alert('Failed to close period');
    }
  }

  function resetRateForm() {
    setEditingRate(null);
    setRateForm({
      code: '',
      name: '',
      description: '',
      taxType: 'gst',
      rate: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isDefault: false,
      applicableToSales: true,
      applicableToPurchases: true,
      fbrTaxCode: '',
    });
  }

  function openEditRate(rate: any) {
    setEditingRate(rate);
    setRateForm({
      code: rate.code,
      name: rate.name,
      description: rate.description || '',
      taxType: rate.taxType,
      rate: parseFloat(rate.rate),
      effectiveFrom: rate.effectiveFrom,
      effectiveTo: rate.effectiveTo || '',
      isDefault: rate.isDefault,
      applicableToSales: rate.applicableToSales,
      applicableToPurchases: rate.applicableToPurchases,
      fbrTaxCode: rate.fbrTaxCode || '',
    });
    setShowRateModal(true);
  }

  const businessTypes = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'importer', label: 'Importer' },
    { value: 'exporter', label: 'Exporter' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'other', label: 'Other' },
  ];

  const taxTypes = [
    { value: 'gst', label: 'GST (Standard 17%)' },
    { value: 'reduced_gst', label: 'Reduced GST' },
    { value: 'zero_rated', label: 'Zero-Rated' },
    { value: 'exempt', label: 'Exempt' },
    { value: 'further_tax', label: 'Further Tax (3%)' },
    { value: 'withholding', label: 'Withholding Tax' },
    { value: 'advance_tax', label: 'Advance Tax' },
    { value: 'provincial', label: 'Provincial Tax' },
  ];

  const currentYear = new Date().getFullYear();
  const fiscalYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          FBR Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure tax registration, rates, and filing periods
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registration">Tax Registration</TabsTrigger>
          <TabsTrigger value="rates">Tax Rates</TabsTrigger>
          <TabsTrigger value="periods">Filing Periods</TabsTrigger>
        </TabsList>

        {/* Tax Registration Tab */}
        <TabsContent value="registration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                FBR Tax Registration
              </CardTitle>
              <CardDescription>
                Your NTN, STRN, and business registration details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ntn">National Tax Number (NTN) *</Label>
                  <Input
                    id="ntn"
                    placeholder="0000000-0"
                    value={registration.ntn}
                    onChange={(e) => setRegistration({ ...registration, ntn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strn">Sales Tax Registration Number (STRN)</Label>
                  <Input
                    id="strn"
                    placeholder="00-00-0000-000-00"
                    value={registration.strn}
                    onChange={(e) => setRegistration({ ...registration, strn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registeredName">Registered Name *</Label>
                  <Input
                    id="registeredName"
                    placeholder="Legal business name"
                    value={registration.registeredName}
                    onChange={(e) => setRegistration({ ...registration, registeredName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={registration.businessType}
                    onValueChange={(value: any) => setRegistration({ ...registration, businessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxOffice">Regional Tax Office</Label>
                  <Input
                    id="taxOffice"
                    placeholder="e.g., RTO Karachi"
                    value={registration.taxOffice}
                    onChange={(e) => setRegistration({ ...registration, taxOffice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={registration.registrationDate}
                    onChange={(e) => setRegistration({ ...registration, registrationDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    placeholder="Complete business address"
                    value={registration.businessAddress}
                    onChange={(e) => setRegistration({ ...registration, businessAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="principalBusinessActivity">Principal Business Activity</Label>
                  <Input
                    id="principalBusinessActivity"
                    placeholder="Main business activity"
                    value={registration.principalBusinessActivity}
                    onChange={(e) => setRegistration({ ...registration, principalBusinessActivity: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Provincial Tax Registrations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="punjabStn">Punjab Sales Tax Number (PSTN)</Label>
                    <Input
                      id="punjabStn"
                      placeholder="Punjab STN"
                      value={registration.punjabStn}
                      onChange={(e) => setRegistration({ ...registration, punjabStn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sindhSrn">Sindh Revenue Number (SRN)</Label>
                    <Input
                      id="sindhSrn"
                      placeholder="Sindh SRN"
                      value={registration.sindhSrn}
                      onChange={(e) => setRegistration({ ...registration, sindhSrn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kpkStn">KPK Sales Tax Number</Label>
                    <Input
                      id="kpkStn"
                      placeholder="KPK STN"
                      value={registration.kpkStn}
                      onChange={(e) => setRegistration({ ...registration, kpkStn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balochistanStn">Balochistan Sales Tax Number</Label>
                    <Input
                      id="balochistanStn"
                      placeholder="Balochistan STN"
                      value={registration.balochistanStn}
                      onChange={(e) => setRegistration({ ...registration, balochistanStn: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveRegistration} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Registration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Rates</CardTitle>
                  <CardDescription>Configure GST and other tax rates</CardDescription>
                </div>
                <Dialog open={showRateModal} onOpenChange={setShowRateModal}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetRateForm(); setShowRateModal(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tax Rate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingRate ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                      <DialogDescription>
                        Configure a new tax rate for your organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="code">Code *</Label>
                          <Input
                            id="code"
                            placeholder="GST_17"
                            value={rateForm.code}
                            onChange={(e) => setRateForm({ ...rateForm, code: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rate">Rate (%) *</Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            placeholder="17.00"
                            value={rateForm.rate}
                            onChange={(e) => setRateForm({ ...rateForm, rate: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Standard GST (17%)"
                          value={rateForm.name}
                          onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxType">Tax Type *</Label>
                        <Select
                          value={rateForm.taxType}
                          onValueChange={(value: any) => setRateForm({ ...rateForm, taxType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tax type" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Description of this tax rate"
                          value={rateForm.description}
                          onChange={(e) => setRateForm({ ...rateForm, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="effectiveFrom">Effective From *</Label>
                          <Input
                            id="effectiveFrom"
                            type="date"
                            value={rateForm.effectiveFrom}
                            onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="effectiveTo">Effective To</Label>
                          <Input
                            id="effectiveTo"
                            type="date"
                            value={rateForm.effectiveTo}
                            onChange={(e) => setRateForm({ ...rateForm, effectiveTo: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="isDefault">Default Rate</Label>
                          <Switch
                            id="isDefault"
                            checked={rateForm.isDefault}
                            onCheckedChange={(checked) => setRateForm({ ...rateForm, isDefault: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="applicableToSales">Applicable to Sales</Label>
                          <Switch
                            id="applicableToSales"
                            checked={rateForm.applicableToSales}
                            onCheckedChange={(checked) => setRateForm({ ...rateForm, applicableToSales: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="applicableToPurchases">Applicable to Purchases</Label>
                          <Switch
                            id="applicableToPurchases"
                            checked={rateForm.applicableToPurchases}
                            onCheckedChange={(checked) => setRateForm({ ...rateForm, applicableToPurchases: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRateModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveRate} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {taxRates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-4">No tax rates configured yet.</p>
                  <Button onClick={() => { resetRateForm(); setShowRateModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Tax Rate
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Effective</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.code}</TableCell>
                        <TableCell>
                          {rate.name}
                          {rate.isDefault && (
                            <Badge variant="secondary" className="ml-2">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rate.taxType}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(rate.rate).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rate.effectiveFrom}
                          {rate.effectiveTo && ` - ${rate.effectiveTo}`}
                        </TableCell>
                        <TableCell>
                          {rate.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRate(rate)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRate(rate.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Default Pakistan Tax Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Pakistan Standard Tax Rates</CardTitle>
              <CardDescription>
                Reference rates as per FBR regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold">Standard GST</h4>
                  <p className="text-2xl font-bold text-green-600">17%</p>
                  <p className="text-sm text-muted-foreground">General goods & services</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold">Further Tax</h4>
                  <p className="text-2xl font-bold text-blue-600">3%</p>
                  <p className="text-sm text-muted-foreground">Unregistered persons</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold">Reduced Rate</h4>
                  <p className="text-2xl font-bold text-purple-600">10%</p>
                  <p className="text-sm text-muted-foreground">Specific goods/sectors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filing Periods Tab */}
        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Filing Periods
                  </CardTitle>
                  <CardDescription>
                    Monthly tax filing periods (Pakistan fiscal year: July - June)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label>Fiscal Year:</Label>
                    <Select
                      value={selectedFiscalYear.toString()}
                      onValueChange={(value) => setSelectedFiscalYear(parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fiscalYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}-{year + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGeneratePeriods}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Periods
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filingPeriods.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No filing periods for fiscal year {selectedFiscalYear}-{selectedFiscalYear + 1}.</p>
                  <Button onClick={handleGeneratePeriods}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Monthly Periods
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filingPeriods.map((period) => {
                      const dueDate = new Date(period.dueDate);
                      const today = new Date();
                      const isOverdue = !period.isClosed && dueDate < today;

                      return (
                        <TableRow key={period.id}>
                          <TableCell className="font-medium">{period.periodName}</TableCell>
                          <TableCell>{period.startDate}</TableCell>
                          <TableCell>{period.endDate}</TableCell>
                          <TableCell>
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {period.dueDate}
                            </span>
                          </TableCell>
                          <TableCell>
                            {period.isClosed ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Closed
                              </Badge>
                            ) : isOverdue ? (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Open</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!period.isClosed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClosePeriod(period.id)}
                              >
                                Close Period
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
