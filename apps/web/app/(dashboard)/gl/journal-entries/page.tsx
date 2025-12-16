'use client';

// Journal Entries Page
// Lists all journal entries with search, filter, and CRUD operations

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { JournalEntryList } from '@/components/gl';
import {
  fetchJournalEntries,
  voidJournalEntryAction,
  reverseJournalEntryAction,
} from '@/actions/gl';
import type { JournalEntryWithLines, JournalEntryStatus } from '@finmatrix/db/types';
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
import { format } from 'date-fns';

export default function JournalEntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntryWithLines[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Void confirmation dialog
  const [voidEntry, setVoidEntry] = useState<JournalEntryWithLines | null>(null);

  // Reverse dialog
  const [reverseEntry, setReverseEntry] = useState<JournalEntryWithLines | null>(null);
  const [reversalDate, setReversalDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Load entries
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchJournalEntries({
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchTerm: searchTerm || undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        setEntries(result.data.entries);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || 'Failed to load journal entries');
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Navigation handlers
  const handleCreateNew = useCallback(() => {
    router.push('/gl/journal-entries/new');
  }, [router]);

  const handleViewEntry = useCallback(
    (entry: JournalEntryWithLines) => {
      router.push(`/gl/journal-entries/${entry.id}`);
    },
    [router]
  );

  const handleEditEntry = useCallback(
    (entry: JournalEntryWithLines) => {
      router.push(`/gl/journal-entries/${entry.id}/edit`);
    },
    [router]
  );

  const handleCopyEntry = useCallback(
    (entry: JournalEntryWithLines) => {
      // Navigate to new entry page with copy data
      router.push(`/gl/journal-entries/new?copy=${entry.id}`);
    },
    [router]
  );

  // Void entry
  const handleVoidEntry = useCallback((entry: JournalEntryWithLines) => {
    setVoidEntry(entry);
  }, []);

  const confirmVoidEntry = useCallback(async () => {
    if (!voidEntry) return;

    try {
      const result = await voidJournalEntryAction(voidEntry.id);
      if (result.success) {
        toast.success(result.message || 'Entry voided successfully');
        setVoidEntry(null);
        loadEntries();
      } else {
        toast.error(result.error || 'Failed to void entry');
      }
    } catch (error) {
      console.error('Error voiding entry:', error);
      toast.error('Failed to void entry');
    }
  }, [voidEntry, loadEntries]);

  // Reverse entry
  const handleReverseEntry = useCallback((entry: JournalEntryWithLines) => {
    setReverseEntry(entry);
    setReversalDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const confirmReverseEntry = useCallback(async () => {
    if (!reverseEntry) return;

    try {
      const result = await reverseJournalEntryAction(reverseEntry.id, reversalDate);
      if (result.success) {
        toast.success(result.message || 'Reversing entry created');
        setReverseEntry(null);
        loadEntries();
        // Navigate to the new entry
        if (result.data) {
          router.push(`/gl/journal-entries/${result.data.id}`);
        }
      } else {
        toast.error(result.error || 'Failed to create reversing entry');
      }
    } catch (error) {
      console.error('Error reversing entry:', error);
      toast.error('Failed to create reversing entry');
    }
  }, [reverseEntry, reversalDate, loadEntries, router]);

  // Filter handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const handleFilterStatus = useCallback((status: JournalEntryStatus | null) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const handleFilterDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Export
  const handleExport = useCallback(() => {
    // TODO: Implement export
    toast.info('Export feature coming soon');
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-900">Journal Entries</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create, view, and manage journal entries
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <JournalEntryList
          entries={entries}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onFilterStatus={handleFilterStatus}
          onFilterDateRange={handleFilterDateRange}
          onViewEntry={handleViewEntry}
          onEditEntry={handleEditEntry}
          onCopyEntry={handleCopyEntry}
          onVoidEntry={handleVoidEntry}
          onReverseEntry={handleReverseEntry}
          onCreateNew={handleCreateNew}
          onExport={handleExport}
        />
      </div>

      {/* Void Confirmation Dialog */}
      <Dialog open={!!voidEntry} onOpenChange={(open) => !open && setVoidEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Journal Entry?</DialogTitle>
            <DialogDescription>
              Are you sure you want to void entry <strong>{voidEntry?.entryNumber}</strong>?
              This will reverse all account balance changes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidEntry(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmVoidEntry}>
              Void Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse Entry Dialog */}
      <Dialog open={!!reverseEntry} onOpenChange={(open) => !open && setReverseEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reversing Entry</DialogTitle>
            <DialogDescription>
              This will create a new journal entry that reverses{' '}
              <strong>{reverseEntry?.entryNumber}</strong> (swapping debits and credits).
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
            <Button variant="outline" onClick={() => setReverseEntry(null)}>
              Cancel
            </Button>
            <Button onClick={confirmReverseEntry}>Create Reversing Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
