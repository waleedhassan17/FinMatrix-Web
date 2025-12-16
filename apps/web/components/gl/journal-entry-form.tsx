'use client';

// Journal Entry Form Component
// Dynamic form for creating and editing journal entries with real-time balance validation

import * as React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Save,
  Send,
  X,
  Calculator,
  FileText,
  Paperclip,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Alert, AlertDescription } from '@finmatrix/ui/components/alert';
import { Separator } from '@finmatrix/ui/components/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@finmatrix/ui/components/tooltip';
import { Spinner } from '@finmatrix/ui/components/spinner';
import type {
  AccountOption,
  JournalEntryInput,
  JournalEntryLineInput,
  JournalEntryWithLines,
  Department,
} from '@finmatrix/db/types';
import { ACCOUNT_TYPE_CONFIGS } from '@finmatrix/db/types';

// ============================================================================
// Types
// ============================================================================

interface JournalEntryFormProps {
  entry?: JournalEntryWithLines | null;
  accounts: AccountOption[];
  departments?: Department[];
  onSaveDraft: (data: JournalEntryInput) => Promise<void>;
  onPost: (data: JournalEntryInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface JournalEntryLine extends JournalEntryLineInput {
  tempId: string;
}

// ============================================================================
// Helpers
// ============================================================================

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ============================================================================
// Line Item Row Component
// ============================================================================

interface LineItemRowProps {
  line: JournalEntryLine;
  index: number;
  accounts: AccountOption[];
  departments?: Department[];
  onUpdate: (tempId: string, field: keyof JournalEntryLineInput, value: string | number) => void;
  onRemove: (tempId: string) => void;
  canRemove: boolean;
}

function LineItemRow({
  line,
  index,
  accounts,
  departments,
  onUpdate,
  onRemove,
  canRemove,
}: LineItemRowProps) {
  const [debitInput, setDebitInput] = useState(line.debit > 0 ? line.debit.toString() : '');
  const [creditInput, setCreditInput] = useState(line.credit > 0 ? line.credit.toString() : '');

  const selectedAccount = accounts.find((a) => a.id === line.accountId);
  const typeConfig = selectedAccount ? ACCOUNT_TYPE_CONFIGS[selectedAccount.type] : null;

  const handleDebitChange = (value: string) => {
    setDebitInput(value);
    const num = parseCurrency(value);
    onUpdate(line.tempId, 'debit', num);
    if (num > 0) {
      setCreditInput('');
      onUpdate(line.tempId, 'credit', 0);
    }
  };

  const handleCreditChange = (value: string) => {
    setCreditInput(value);
    const num = parseCurrency(value);
    onUpdate(line.tempId, 'credit', num);
    if (num > 0) {
      setDebitInput('');
      onUpdate(line.tempId, 'debit', 0);
    }
  };

  const handleDebitBlur = () => {
    if (line.debit > 0) {
      setDebitInput(line.debit.toFixed(2));
    }
  };

  const handleCreditBlur = () => {
    if (line.credit > 0) {
      setCreditInput(line.credit.toFixed(2));
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 px-3 hover:bg-slate-50 rounded-md group">
      {/* Line Number */}
      <div className="col-span-1 text-sm text-slate-400 font-mono">{index + 1}</div>

      {/* Account */}
      <div className="col-span-4">
        <Select
          value={line.accountId || ''}
          onValueChange={(value) => onUpdate(line.tempId, 'accountId', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {accounts.map((account) => {
              const config = ACCOUNT_TYPE_CONFIGS[account.type];
              return (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{account.accountNumber}</span>
                    <span>{account.name}</span>
                    <span
                      className={cn('text-xs px-1.5 py-0.5 rounded', config.bgColor, config.color)}
                    >
                      {config.label}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Debit */}
      <div className="col-span-2">
        <Input
          type="text"
          placeholder="0.00"
          value={debitInput}
          onChange={(e) => handleDebitChange(e.target.value)}
          onBlur={handleDebitBlur}
          className="h-9 text-right font-mono"
        />
      </div>

      {/* Credit */}
      <div className="col-span-2">
        <Input
          type="text"
          placeholder="0.00"
          value={creditInput}
          onChange={(e) => handleCreditChange(e.target.value)}
          onBlur={handleCreditBlur}
          className="h-9 text-right font-mono"
        />
      </div>

      {/* Memo */}
      <div className="col-span-2">
        <Input
          type="text"
          placeholder="Line memo"
          value={line.memo || ''}
          onChange={(e) => onUpdate(line.tempId, 'memo', e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Remove Button */}
      <div className="col-span-1 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
            !canRemove && 'invisible'
          )}
          onClick={() => onRemove(line.tempId)}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Balance Indicator Component
// ============================================================================

function BalanceIndicator({
  totalDebit,
  totalCredit,
  difference,
  isBalanced,
}: {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isBalanced
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <span
            className={cn(
              'font-medium',
              isBalanced ? 'text-green-700' : 'text-amber-700'
            )}
          >
            {isBalanced ? 'Entry is balanced' : 'Entry is not balanced'}
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="text-right">
            <div className="text-slate-500">Total Debit</div>
            <div className="font-semibold text-slate-900">{formatCurrency(totalDebit)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">Total Credit</div>
            <div className="font-semibold text-slate-900">{formatCurrency(totalCredit)}</div>
          </div>
          {!isBalanced && (
            <div className="text-right">
              <div className="text-amber-600">Difference</div>
              <div className="font-semibold text-amber-700">{formatCurrency(Math.abs(difference))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Journal Entry Form Component
// ============================================================================

export function JournalEntryForm({
  entry,
  accounts,
  departments = [],
  onSaveDraft,
  onPost,
  onCancel,
  isSubmitting = false,
}: JournalEntryFormProps) {
  const isEditing = !!entry;

  // Form state
  const [date, setDate] = useState(
    entry?.date ? entry.date : format(new Date(), 'yyyy-MM-dd')
  );
  const [memo, setMemo] = useState(entry?.memo || '');
  const [reference, setReference] = useState(entry?.reference || '');

  // Lines state
  const [lines, setLines] = useState<JournalEntryLine[]>(() => {
    if (entry?.lines && entry.lines.length > 0) {
      return entry.lines.map((line) => ({
        tempId: generateTempId(),
        id: line.id,
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        memo: line.memo || '',
        departmentId: line.departmentId || undefined,
        projectId: line.projectId || undefined,
        reference: line.reference || undefined,
      }));
    }
    // Start with 2 empty lines
    return [
      { tempId: generateTempId(), accountId: '', debit: 0, credit: 0, memo: '' },
      { tempId: generateTempId(), accountId: '', debit: 0, credit: 0, memo: '' },
    ];
  });

  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const { totalDebit, totalCredit, difference, isBalanced } = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + line.debit, 0);
    const credit = lines.reduce((sum, line) => sum + line.credit, 0);
    const diff = debit - credit;
    return {
      totalDebit: debit,
      totalCredit: credit,
      difference: diff,
      isBalanced: Math.abs(diff) < 0.01,
    };
  }, [lines]);

  // Line operations
  const handleAddLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      { tempId: generateTempId(), accountId: '', debit: 0, credit: 0, memo: '' },
    ]);
  }, []);

  const handleRemoveLine = useCallback((tempId: string) => {
    setLines((prev) => prev.filter((line) => line.tempId !== tempId));
  }, []);

  const handleUpdateLine = useCallback(
    (tempId: string, field: keyof JournalEntryLineInput, value: string | number) => {
      setLines((prev) =>
        prev.map((line) => (line.tempId === tempId ? { ...line, [field]: value } : line))
      );
    },
    []
  );

  // Quick balance - add line to balance the entry
  const handleQuickBalance = useCallback(() => {
    if (isBalanced || difference === 0) return;

    const newLine: JournalEntryLine = {
      tempId: generateTempId(),
      accountId: '',
      debit: difference > 0 ? 0 : Math.abs(difference),
      credit: difference > 0 ? difference : 0,
      memo: '',
    };

    setLines((prev) => [...prev, newLine]);
  }, [difference, isBalanced]);

  // Build submission data
  const buildSubmissionData = useCallback((): JournalEntryInput => {
    const validLines = lines.filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));

    return {
      date,
      memo: memo || undefined,
      reference: reference || undefined,
      lines: validLines.map((line) => ({
        id: line.id,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        memo: line.memo || undefined,
        departmentId: line.departmentId,
        projectId: line.projectId,
        reference: line.reference,
      })),
    };
  }, [date, memo, reference, lines]);

  // Validation
  const validateEntry = useCallback((): string | null => {
    const validLines = lines.filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));

    if (validLines.length < 2) {
      return 'Journal entry must have at least 2 lines with amounts';
    }

    if (!isBalanced) {
      return 'Journal entry must be balanced before posting';
    }

    // Check for duplicate accounts with same debit/credit
    const seen = new Set<string>();
    for (const line of validLines) {
      const key = `${line.accountId}-${line.debit > 0 ? 'D' : 'C'}`;
      if (seen.has(key)) {
        // Warning only, not blocking
      }
      seen.add(key);
    }

    return null;
  }, [lines, isBalanced]);

  // Submit handlers
  const handleSaveDraft = useCallback(async () => {
    setError(null);
    const data = buildSubmissionData();

    if (data.lines.length < 1) {
      setError('Please add at least one line');
      return;
    }

    try {
      await onSaveDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    }
  }, [buildSubmissionData, onSaveDraft]);

  const handlePost = useCallback(async () => {
    setError(null);

    const validationError = validateEntry();
    if (validationError) {
      setError(validationError);
      return;
    }

    const data = buildSubmissionData();

    try {
      await onPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post entry');
    }
  }, [buildSubmissionData, onPost, validateEntry]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? `Edit Journal Entry: ${entry?.entryNumber}` : 'New Journal Entry'}
          </CardTitle>
          {entry?.status && (
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                entry.status === 'draft' && 'bg-slate-100 text-slate-700',
                entry.status === 'posted' && 'bg-green-100 text-green-700',
                entry.status === 'voided' && 'bg-red-100 text-red-700'
              )}
            >
              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header Fields */}
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference #</Label>
            <Input
              id="reference"
              placeholder="INV-001, Check #123, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="memo">Memo / Description</Label>
            <Input
              id="memo"
              placeholder="Describe this journal entry..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Line Items */}
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 rounded-md text-sm font-medium text-slate-600">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Account</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-2">Memo</div>
            <div className="col-span-1"></div>
          </div>

          {/* Line Rows */}
          {lines.map((line, index) => (
            <LineItemRow
              key={line.tempId}
              line={line}
              index={index}
              accounts={accounts}
              departments={departments}
              onUpdate={handleUpdateLine}
              onRemove={handleRemoveLine}
              canRemove={lines.length > 2}
            />
          ))}

          {/* Add Line Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={handleAddLine}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Line
          </Button>
        </div>

        {/* Balance Indicator */}
        <BalanceIndicator
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          difference={difference}
          isBalanced={isBalanced}
        />

        {/* Quick Balance Button */}
        {!isBalanced && difference !== 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickBalance}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Add balancing line ({formatCurrency(Math.abs(difference))}{' '}
                  {difference > 0 ? 'Credit' : 'Debit'})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Add a new line to balance the entry. You'll need to select an account.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t bg-slate-50">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || (entry?.status !== 'draft' && entry?.status !== undefined)}
          >
            {isSubmitting ? <Spinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>

          <Button
            type="button"
            onClick={handlePost}
            disabled={isSubmitting || !isBalanced}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? <Spinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Post Entry
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default JournalEntryForm;
