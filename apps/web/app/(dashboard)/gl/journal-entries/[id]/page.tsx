'use client';

// Journal Entry Detail Page
// Displays a single journal entry with all details

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit2,
  Copy,
  RotateCcw,
  XCircle,
  Send,
  FileText,
  Calendar,
  User,
  Clock,
  Printer,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Button } from '@finmatrix/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Separator } from '@finmatrix/ui/components/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@finmatrix/ui/components/dialog';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import {
  fetchJournalEntry,
  postJournalEntryAction,
  voidJournalEntryAction,
  reverseJournalEntryAction,
} from '@/actions/gl';
import type { JournalEntryWithLines } from '@finmatrix/db/types';
import { JOURNAL_ENTRY_STATUS_CONFIGS, ACCOUNT_TYPE_CONFIGS } from '@finmatrix/db/types';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);
}

function StatusBadge({ status }: { status: string }) {
  const config = JOURNAL_ENTRY_STATUS_CONFIGS[status as keyof typeof JOURNAL_ENTRY_STATUS_CONFIGS];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
        config.bgColor,
        config.color,
        `border ${config.borderColor}`
      )}
    >
      {config.label}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function JournalEntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<JournalEntryWithLines | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [reversalDate, setReversalDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Load entry
  const loadEntry = useCallback(async () => {
    if (!entryId) return;

    setIsLoading(true);
    try {
      const result = await fetchJournalEntry(entryId);
      if (result.success && result.data) {
        setEntry(result.data);
      } else {
        toast.error(result.error || 'Failed to load journal entry');
        router.push('/gl/journal-entries');
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      toast.error('Failed to load journal entry');
    } finally {
      setIsLoading(false);
    }
  }, [entryId, router]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  // Actions
  const handleEdit = useCallback(() => {
    router.push(`/gl/journal-entries/${entryId}/edit`);
  }, [router, entryId]);

  const handleCopy = useCallback(() => {
    router.push(`/gl/journal-entries/new?copy=${entryId}`);
  }, [router, entryId]);

  const handlePost = useCallback(async () => {
    if (!entry) return;

    setIsSubmitting(true);
    try {
      const result = await postJournalEntryAction(entry.id);
      if (result.success) {
        toast.success(result.message || 'Entry posted successfully');
        loadEntry();
      } else {
        toast.error(result.error || 'Failed to post entry');
      }
    } catch (error) {
      console.error('Error posting entry:', error);
      toast.error('Failed to post entry');
    } finally {
      setIsSubmitting(false);
    }
  }, [entry, loadEntry]);

  const handleVoid = useCallback(async () => {
    if (!entry) return;

    setIsSubmitting(true);
    try {
      const result = await voidJournalEntryAction(entry.id);
      if (result.success) {
        toast.success(result.message || 'Entry voided');
        setShowVoidDialog(false);
        loadEntry();
      } else {
        toast.error(result.error || 'Failed to void entry');
      }
    } catch (error) {
      console.error('Error voiding entry:', error);
      toast.error('Failed to void entry');
    } finally {
      setIsSubmitting(false);
    }
  }, [entry, loadEntry]);

  const handleReverse = useCallback(async () => {
    if (!entry) return;

    setIsSubmitting(true);
    try {
      const result = await reverseJournalEntryAction(entry.id, reversalDate);
      if (result.success && result.data) {
        toast.success(result.message || 'Reversing entry created');
        setShowReverseDialog(false);
        router.push(`/gl/journal-entries/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create reversing entry');
      }
    } catch (error) {
      console.error('Error reversing entry:', error);
      toast.error('Failed to create reversing entry');
    } finally {
      setIsSubmitting(false);
    }
  }, [entry, reversalDate, router]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Entry not found</div>
      </div>
    );
  }

  const canEdit = entry.status === 'draft';
  const canPost = entry.status === 'draft';
  const canVoid = entry.status === 'posted';
  const canReverse = entry.status === 'posted';

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{entry.entryNumber}</h1>
                <StatusBadge status={entry.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {format(new Date(entry.date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>

            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>

            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}

            {canReverse && (
              <Button variant="outline" size="sm" onClick={() => setShowReverseDialog(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reverse
              </Button>
            )}

            {canVoid && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowVoidDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Void
              </Button>
            )}

            {canPost && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handlePost}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                Post Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Entry Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Entry Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-slate-500">Entry Number</div>
                  <div className="font-mono font-medium">{entry.entryNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Reference</div>
                  <div>{entry.reference || <span className="text-slate-400">—</span>}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Status</div>
                  <StatusBadge status={entry.status} />
                </div>
              </div>

              {entry.memo && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Memo</div>
                    <div className="text-slate-700">{entry.memo}</div>
                  </div>
                </>
              )}

              {entry.postedAt && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="h-4 w-4" />
                      Posted: {format(new Date(entry.postedAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-sm font-medium text-slate-600 border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Account</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
                <div className="col-span-2">Memo</div>
              </div>

              {/* Lines */}
              {entry.lines.map((line, index) => {
                const typeConfig = ACCOUNT_TYPE_CONFIGS[line.account.type];
                return (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="col-span-1 text-slate-400 font-mono">{index + 1}</div>
                    <div className="col-span-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-500">
                          {line.account.accountNumber}
                        </span>
                        <span>{line.account.name}</span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            typeConfig.bgColor,
                            typeConfig.color
                          )}
                        >
                          {typeConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {Number(line.debit) > 0 ? formatCurrency(line.debit) : ''}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {Number(line.credit) > 0 ? formatCurrency(line.credit) : ''}
                    </div>
                    <div className="col-span-2 text-sm text-slate-500 truncate">
                      {line.memo || ''}
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 font-medium">
                <div className="col-span-1" />
                <div className="col-span-5 text-right">Totals</div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(entry.totalDebit)}
                </div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(entry.totalCredit)}
                </div>
                <div className="col-span-2" />
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Created:</span>
                  <span>{format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </div>

                {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Last Updated:</span>
                    <span>{format(new Date(entry.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}

                {entry.postedAt && (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-green-500" />
                    <span className="text-slate-500">Posted:</span>
                    <span>{format(new Date(entry.postedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}

                {entry.status === 'voided' && entry.updatedAt && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-slate-500">Voided:</span>
                    <span>{format(new Date(entry.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Void Confirmation Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Journal Entry?</DialogTitle>
            <DialogDescription>
              Are you sure you want to void entry <strong>{entry.entryNumber}</strong>?
              This will reverse all account balance changes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleVoid} disabled={isSubmitting}>
              {isSubmitting ? 'Voiding...' : 'Void Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse Entry Dialog */}
      <Dialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reversing Entry</DialogTitle>
            <DialogDescription>
              This will create a new journal entry that reverses{' '}
              <strong>{entry.entryNumber}</strong> (swapping debits and credits).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="reversalDate">Reversal Date</Label>
            <Input
              id="reversalDate"
              type="date"
              value={reversalDate}
              onChange={(e) => setReversalDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReverse} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Reversing Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
