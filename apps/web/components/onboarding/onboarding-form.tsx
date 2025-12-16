'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  FileText, 
  Calendar, 
  Percent, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Shield,
  Sparkles
} from 'lucide-react';
import { Button, Input, Label } from '@finmatrix/ui';

interface OnboardingFormProps {
  userId?: string;
}

interface FormData {
  name: string;
  ntn: string;
  strn: string;
  fiscalYearStart: string;
  currency: string;
  gstRate: string;
}

interface FormErrors {
  name?: string;
  ntn?: string;
  strn?: string;
}

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currencies = [
  { value: 'PKR', label: 'PKR - Pakistani Rupee', flag: '🇵🇰' },
  { value: 'USD', label: 'USD - US Dollar', flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR - Euro', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP - British Pound', flag: '🇬🇧' },
  { value: 'AED', label: 'AED - UAE Dirham', flag: '🇦🇪' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', flag: '🇸🇦' },
];

const gstRates = [
  { value: '0', label: '0% - Exempt' },
  { value: '5', label: '5% - Reduced Rate' },
  { value: '10', label: '10% - Reduced Rate' },
  { value: '17', label: '17% - Standard Rate (Pakistan)' },
  { value: '18', label: '18% - Services' },
];

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const { update: updateSession } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ntn: '',
    strn: '',
    fiscalYearStart: '7',
    currency: 'PKR',
    gstRate: '17',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters';
    }
    if (formData.ntn && !/^\d{7}-\d$/.test(formData.ntn)) {
      newErrors.ntn = 'NTN must be in format XXXXXXX-X (e.g., 1234567-8)';
    }
    if (formData.strn && !/^\d{13}$/.test(formData.strn)) {
      newErrors.strn = 'STRN must be exactly 13 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          ntn: formData.ntn || undefined,
          strn: formData.strn || undefined,
          settings: {
            fiscalYearStart: parseInt(formData.fiscalYearStart),
            currency: formData.currency,
            gstRate: parseFloat(formData.gstRate),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      // Update the session to include the new organization
      await updateSession({
        organizationId: result.organization.id,
      });

      // Redirect to dashboard after successful organization creation
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
            step > 1 ? 'bg-green-500 text-white' : step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <span className="hidden sm:block font-medium text-sm">Organization</span>
        </div>
        <div className={`w-12 h-1 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <span className="hidden sm:block font-medium text-sm">Settings</span>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
        >
          <Shield className="h-5 w-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Organization Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., ABC Trading Company"
                className={`h-12 rounded-xl border-2 transition-all ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Tax Information Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Tax Information</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NTN */}
                <div className="space-y-2">
                  <Label htmlFor="ntn" className="text-gray-700 font-medium">
                    NTN (National Tax Number)
                  </Label>
                  <Input
                    id="ntn"
                    type="text"
                    value={formData.ntn}
                    onChange={(e) => handleInputChange('ntn', e.target.value)}
                    placeholder="1234567-8"
                    className={`h-12 rounded-xl border-2 transition-all ${
                      errors.ntn
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.ntn && (
                    <p className="text-sm text-red-500">{errors.ntn}</p>
                  )}
                </div>

                {/* STRN */}
                <div className="space-y-2">
                  <Label htmlFor="strn" className="text-gray-700 font-medium">
                    STRN (Sales Tax Reg. No.)
                  </Label>
                  <Input
                    id="strn"
                    type="text"
                    value={formData.strn}
                    onChange={(e) => handleInputChange('strn', e.target.value)}
                    placeholder="1234567890123"
                    className={`h-12 rounded-xl border-2 transition-all ${
                      errors.strn
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.strn && (
                    <p className="text-sm text-red-500">{errors.strn}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all group"
              disabled={isLoading}
            >
              Continue to Settings
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Fiscal Year Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Fiscal Year Settings</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fiscal Year Start */}
                <div className="space-y-2">
                  <Label htmlFor="fiscalYearStart" className="text-gray-700 font-medium">
                    Fiscal Year Starts
                  </Label>
                  <select
                    id="fiscalYearStart"
                    value={formData.fiscalYearStart}
                    onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-4 bg-white transition-all"
                    disabled={isLoading}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Pakistan fiscal year starts in July</p>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-gray-700 font-medium">
                    Base Currency
                  </Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-4 bg-white transition-all"
                    disabled={isLoading}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.flag} {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* GST Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Default GST Rate</h3>
              </div>

              <div className="space-y-2">
                <select
                  id="gstRate"
                  value={formData.gstRate}
                  onChange={(e) => handleInputChange('gstRate', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-4 bg-white transition-all"
                  disabled={isLoading}
                >
                  {gstRates.map((rate) => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">Standard GST rate in Pakistan is 17%</p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2 py-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                FBR Compliant
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                Secure
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Auto Setup
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 h-12 font-semibold rounded-xl border-2"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Organization
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OnboardingForm;
