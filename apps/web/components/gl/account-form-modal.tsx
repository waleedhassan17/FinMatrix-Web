'use client';

// Account Form Modal Component
// Form for creating and editing Chart of Accounts entries

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@finmatrix/ui/components/dialog';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import { Spinner } from '@finmatrix/ui/components/spinner';
import { Alert, AlertDescription } from '@finmatrix/ui/components/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type {
  ChartOfAccount,
  AccountInput,
  AccountOption,
  AccountType,
  AccountSubType,
  NormalBalance,
} from '@finmatrix/db/types';
import {
  ACCOUNT_TYPE_CONFIGS,
  ACCOUNT_SUB_TYPE_LABELS,
} from '@finmatrix/db/types';

// ============================================================================
// Form Schema
// ============================================================================

const accountFormSchema = z.object({
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .max(20, 'Account number must be 20 characters or less')
    .regex(/^[0-9A-Z\-\.]+$/i, 'Account number can only contain letters, numbers, hyphens, and periods'),
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  subType: z.string().optional(),
  normalBalance: z.enum(['debit', 'credit']),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isBankAccount: z.boolean().default(false),
  bankAccountNumber: z.string().max(50).optional(),
});

type AccountFormData = z.infer<typeof accountFormSchema>;

// ============================================================================
// Props
// ============================================================================

interface AccountFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccountInput) => Promise<void>;
  account?: ChartOfAccount | null;
  parentOptions?: AccountOption[];
  validateAccountNumber?: (number: string) => Promise<boolean>;
  defaultParentId?: string | null;
}

// ============================================================================
// Sub-type options by account type
// ============================================================================

const SUB_TYPES_BY_TYPE: Record<AccountType, AccountSubType[]> = {
  asset: [
    'cash',
    'bank',
    'accounts_receivable',
    'inventory',
    'prepaid_expense',
    'fixed_asset',
    'accumulated_depreciation',
    'other_current_asset',
    'other_non_current_asset',
  ],
  liability: [
    'accounts_payable',
    'credit_card',
    'accrued_liability',
    'short_term_loan',
    'long_term_loan',
    'deferred_revenue',
    'other_current_liability',
    'other_non_current_liability',
  ],
  equity: [
    'owners_equity',
    'retained_earnings',
    'common_stock',
    'additional_paid_in_capital',
    'treasury_stock',
    'opening_balance_equity',
  ],
  revenue: [
    'sales_revenue',
    'service_revenue',
    'other_income',
    'interest_income',
    'discount_received',
  ],
  expense: [
    'cost_of_goods_sold',
    'operating_expense',
    'payroll_expense',
    'rent_expense',
    'utilities_expense',
    'depreciation_expense',
    'interest_expense',
    'tax_expense',
    'other_expense',
  ],
};

// ============================================================================
// Component
// ============================================================================

export function AccountFormModal({
  open,
  onClose,
  onSubmit,
  account,
  parentOptions = [],
  validateAccountNumber,
  defaultParentId,
}: AccountFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountNumberValid, setAccountNumberValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);

  const isEditing = !!account;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountNumber: '',
      name: '',
      description: '',
      type: 'asset',
      subType: undefined,
      normalBalance: 'debit',
      parentId: null,
      isActive: true,
      isBankAccount: false,
      bankAccountNumber: '',
    },
  });

  const watchType = watch('type');
  const watchAccountNumber = watch('accountNumber');
  const watchIsBankAccount = watch('isBankAccount');

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (open) {
      if (account) {
        reset({
          accountNumber: account.accountNumber,
          name: account.name,
          description: account.description || '',
          type: account.type,
          subType: account.subType || undefined,
          normalBalance: account.normalBalance,
          parentId: account.parentId || null,
          isActive: account.isActive,
          isBankAccount: account.isBankAccount,
          bankAccountNumber: account.bankAccountNumber || '',
        });
      } else {
        reset({
          accountNumber: '',
          name: '',
          description: '',
          type: 'asset',
          subType: undefined,
          normalBalance: 'debit',
          parentId: defaultParentId || null,
          isActive: true,
          isBankAccount: false,
          bankAccountNumber: '',
        });
      }
      setError(null);
      setSuccess(null);
      setAccountNumberValid(null);
    }
  }, [open, account, defaultParentId, reset]);

  // Auto-set normal balance based on account type
  useEffect(() => {
    const config = ACCOUNT_TYPE_CONFIGS[watchType];
    setValue('normalBalance', config.normalBalance);
  }, [watchType, setValue]);

  // Validate account number with debounce
  useEffect(() => {
    if (!validateAccountNumber || !watchAccountNumber || watchAccountNumber.length < 2) {
      setAccountNumberValid(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setValidating(true);
      try {
        const isValid = await validateAccountNumber(watchAccountNumber);
        setAccountNumberValid(isValid);
      } catch (err) {
        setAccountNumberValid(null);
      } finally {
        setValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [watchAccountNumber, validateAccountNumber]);

  const handleFormSubmit = useCallback(
    async (data: AccountFormData) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        await onSubmit({
          accountNumber: data.accountNumber,
          name: data.name,
          description: data.description || undefined,
          type: data.type,
          subType: data.subType as AccountSubType | undefined,
          normalBalance: data.normalBalance,
          parentId: data.parentId || undefined,
          isActive: data.isActive,
          isBankAccount: data.isBankAccount,
          bankAccountNumber: data.isBankAccount ? data.bankAccountNumber : undefined,
        });

        setSuccess(isEditing ? 'Account updated successfully!' : 'Account created successfully!');

        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save account');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onClose, isEditing]
  );

  const availableSubTypes = SUB_TYPES_BY_TYPE[watchType] || [];

  // Filter parent options to only show same type and not self
  const filteredParentOptions = parentOptions.filter(
    (opt) => opt.type === watchType && opt.id !== account?.id
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'New Account'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the account details below.'
              : 'Fill in the details to create a new account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Error/Success Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Account Number & Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <div className="relative">
                <Input
                  id="accountNumber"
                  {...register('accountNumber')}
                  placeholder="1000"
                  disabled={isEditing}
                  className={
                    accountNumberValid === false
                      ? 'border-red-500 pr-8'
                      : accountNumberValid === true
                      ? 'border-green-500 pr-8'
                      : ''
                  }
                />
                {validating && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
                {!validating && accountNumberValid === true && (
                  <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!validating && accountNumberValid === false && (
                  <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {errors.accountNumber && (
                <p className="text-sm text-red-500">{errors.accountNumber.message}</p>
              )}
              {accountNumberValid === false && (
                <p className="text-sm text-red-500">Account number already exists</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input id="name" {...register('name')} placeholder="Cash on Hand" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          {/* Account Type & Sub-Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue('type', value as AccountType)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_CONFIGS).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subType">Sub-Type</Label>
              <Select
                value={watch('subType') || ''}
                onValueChange={(value) => setValue('subType', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-type" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubTypes.map((subType) => (
                    <SelectItem key={subType} value={subType}>
                      {ACCOUNT_SUB_TYPE_LABELS[subType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Account */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Account</Label>
            <Select
              value={watch('parentId') || 'none'}
              onValueChange={(value) => setValue('parentId', value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None (Top-level account)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top-level account)</SelectItem>
                {filteredParentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    <span className="font-mono text-slate-500 mr-2">{opt.accountNumber}</span>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Select a parent account to create a sub-account hierarchy
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Optional description for this account"
            />
          </div>

          {/* Bank Account Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBankAccount"
              {...register('isBankAccount')}
              className="h-4 w-4 rounded border-slate-300"
            />
            <Label htmlFor="isBankAccount" className="font-normal cursor-pointer">
              This is a bank account
            </Label>
          </div>

          {/* Bank Account Number (conditional) */}
          {watchIsBankAccount && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                {...register('bankAccountNumber')}
                placeholder="****1234"
              />
            </div>
          )}

          {/* Active Toggle (for editing) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">
                Account is active
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || accountNumberValid === false}>
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              {isEditing ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AccountFormModal;
