'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import { Textarea } from '@finmatrix/ui/components/textarea';
import { Switch } from '@finmatrix/ui/components/switch';
import { addCustomer } from '@/actions/ar';

interface CustomerFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  ntn: string;
  strn: string;
  billingAddress: string;
  shippingAddress: string;
  creditLimit: string;
  paymentTermsDays: string;
  notes: string;
  isActive: boolean;
}

const initialFormData: CustomerFormData = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  ntn: '',
  strn: '',
  billingAddress: '',
  shippingAddress: '',
  creditLimit: '0',
  paymentTermsDays: '30',
  notes: '',
  isActive: true,
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(false);

  const handleChange = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Sync shipping address if checkbox is checked
    if (field === 'billingAddress' && sameAsShipping) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: value as string,
      }));
    }
  };

  const handleSameAsShipping = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: prev.billingAddress,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addCustomer({
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        ntn: formData.ntn.trim() || undefined,
        strn: formData.strn.trim() || undefined,
        billingAddress: formData.billingAddress.trim() || undefined,
        shippingAddress: formData.shippingAddress.trim() || undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
        paymentTerms: formData.paymentTermsDays ? parseInt(formData.paymentTermsDays, 10) : 30,
        notes: formData.notes.trim() || undefined,
        isActive: formData.isActive,
      });

      if (result.success && result.data) {
        router.push(`/dashboard/customers/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/customers"
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">New Customer</h1>
              <p className="mt-1 text-sm text-slate-500">
                Add a new customer to your organization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/customers">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Customer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Company Information
              </CardTitle>
              <CardDescription>Basic company details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={e => handleChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder="https://www.example.com"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active Customer</Label>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Contact Information
              </CardTitle>
              <CardDescription>Primary contact details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={e => handleChange('contactName', e.target.value)}
                  placeholder="Full name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+92 300 1234567"
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax Information (FBR) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Tax Information
              </CardTitle>
              <CardDescription>FBR registration details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="ntn">NTN (National Tax Number)</Label>
                <Input
                  id="ntn"
                  value={formData.ntn}
                  onChange={e => handleChange('ntn', e.target.value)}
                  placeholder="0000000-0"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Required for B2B transactions and tax compliance
                </p>
              </div>
              <div>
                <Label htmlFor="strn">STRN (Sales Tax Registration)</Label>
                <Input
                  id="strn"
                  value={formData.strn}
                  onChange={e => handleChange('strn', e.target.value)}
                  placeholder="00-00-0000-000-00"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Sales tax registered number for GST invoicing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Address Information
              </CardTitle>
              <CardDescription>Billing and shipping addresses</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="billingAddress">Billing Address</Label>
                <Textarea
                  id="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('billingAddress', e.target.value)}
                  placeholder="Street address, city, country"
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={e => handleSameAsShipping(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Same as billing
                  </label>
                </div>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('shippingAddress', e.target.value)}
                  placeholder="Street address, city, country"
                  rows={3}
                  disabled={sameAsShipping}
                />
              </div>
            </CardContent>
          </Card>

          {/* Credit & Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Credit & Payment Terms
              </CardTitle>
              <CardDescription>Default payment settings for this customer</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="creditLimit">Credit Limit (PKR)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.creditLimit}
                  onChange={e => handleChange('creditLimit', e.target.value)}
                  placeholder="0"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Set to 0 for no limit
                </p>
              </div>
              <div>
                <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
                <Input
                  id="paymentTermsDays"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.paymentTermsDays}
                  onChange={e => handleChange('paymentTermsDays', e.target.value)}
                  placeholder="30"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Default due date for invoices (e.g., Net 30)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Internal notes about this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('notes', e.target.value)}
                placeholder="Add any notes or special instructions..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button (Mobile) */}
          <div className="sm:hidden">
            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
