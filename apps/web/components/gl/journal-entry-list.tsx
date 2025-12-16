'use client';

// Journal Entry List Component
// Displays a searchable, filterable list of journal entries

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Copy,
  RotateCcw,
  XCircle,
  MoreHorizontal,
  FileText,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@finmatrix/ui/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import { Card } from '@finmatrix/ui/components/card';
import { ScrollArea } from '@finmatrix/ui/components/scroll-area';
import type { JournalEntryWithLines, JournalEntryStatus } from '@finmatrix/db/types';
import { JOURNAL_ENTRY_STATUS_CONFIGS } from '@finmatrix/db/types';

// ============================================================================
// Types
// ============================================================================

interface JournalEntryListProps {
  entries: JournalEntryWithLines[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  onFilterStatus: (status: JournalEntryStatus | null) => void;
  onFilterDateRange: (start: string, end: string) => void;
  onViewEntry: (entry: JournalEntryWithLines) => void;
  onEditEntry: (entry: JournalEntryWithLines) => void;
  onCopyEntry: (entry: JournalEntryWithLines) => void;
  onVoidEntry: (entry: JournalEntryWithLines) => void;
  onReverseEntry: (entry: JournalEntryWithLines) => void;
  onCreateNew: () => void;
  onExport: () => void;
}

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

function StatusBadge({ status }: { status: JournalEntryStatus }) {
  const config = JOURNAL_ENTRY_STATUS_CONFIGS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
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
// Journal Entry Row Component
// ============================================================================

function JournalEntryRow({
  entry,
  onView,
  onEdit,
  onCopy,
  onVoid,
  onReverse,
}: {
  entry: JournalEntryWithLines;
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onVoid: () => void;
  onReverse: () => void;
}) {
  const linesSummary = useMemo(() => {
    if (!entry.lines || entry.lines.length === 0) return 'No lines';

    const accountNames = entry.lines.slice(0, 3).map((l) => l.account?.name || 'Unknown');

    if (entry.lines.length > 3) {
      return `${accountNames.join(', ')} +${entry.lines.length - 3} more`;
    }

    return accountNames.join(', ');
  }, [entry.lines]);

  const canEdit = entry.status === 'draft';
  const canVoid = entry.status === 'posted';
  const canReverse = entry.status === 'posted';

  return (
    <div className="group grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-slate-50 border-b border-slate-100 transition-colors">
      {/* Entry Number */}
      <div className="col-span-2">
        <button onClick={onView} className="font-mono text-sm text-blue-600 hover:underline">
          {entry.entryNumber}
        </button>
      </div>

      {/* Date */}
      <div className="col-span-1 text-sm text-slate-600">
        {format(new Date(entry.date), 'MMM d, yyyy')}
      </div>

      {/* Memo */}
      <div className="col-span-3 text-sm text-slate-700 truncate" title={entry.memo || ''}>
        {entry.memo || <span className="text-slate-400 italic">No memo</span>}
      </div>

      {/* Accounts */}
      <div className="col-span-2 text-xs text-slate-500 truncate" title={linesSummary}>
        {linesSummary}
      </div>

      {/* Amount */}
      <div className="col-span-1 text-sm font-mono text-right text-slate-900">
        {formatCurrency(entry.totalDebit)}
      </div>

      {/* Status */}
      <div className="col-span-1">
        <StatusBadge status={entry.status} />
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>

        {canEdit && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Entry
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Entry
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canReverse && (
              <DropdownMenuItem onClick={onReverse}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Create Reversing Entry
              </DropdownMenuItem>
            )}
            {canVoid && (
              <DropdownMenuItem onClick={onVoid} className="text-red-600 focus:text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Void Entry
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 items-center py-3 px-4 border-b border-slate-100"
        >
          <div className="col-span-2 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="col-span-1 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="col-span-3 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="col-span-1 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="col-span-1 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="col-span-2" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="h-12 w-12 text-slate-300 mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-1">No journal entries yet</h3>
      <p className="text-sm text-slate-500 mb-4">
        Get started by creating your first journal entry.
      </p>
      <Button onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        Create Entry
      </Button>
    </div>
  );
}

// ============================================================================
// Main Journal Entry List Component
// ============================================================================

export function JournalEntryList({
  entries,
  total,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onSearch,
  onFilterStatus,
  onFilterDateRange,
  onViewEntry,
  onEditEntry,
  onCopyEntry,
  onVoidEntry,
  onReverseEntry,
  onCreateNew,
  onExport,
}: JournalEntryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      onSearch(term);
    },
    [onSearch]
  );

  const handleStatusChange = useCallback(
    (status: JournalEntryStatus | 'all') => {
      setStatusFilter(status);
      onFilterStatus(status === 'all' ? null : status);
    },
    [onFilterStatus]
  );

  const handleDateRangeChange = useCallback(() => {
    if (startDate && endDate) {
      onFilterDateRange(startDate, endDate);
    }
  }, [startDate, endDate, onFilterDateRange]);

  return (
    <Card className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36"
            placeholder="Start Date"
          />
          <span className="text-slate-400">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36"
            placeholder="End Date"
          />
          <Button variant="outline" size="sm" onClick={handleDateRangeChange}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Export */}
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        {/* Create New */}
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 items-center py-2 px-4 bg-slate-50 text-sm font-medium text-slate-600 border-b border-slate-200">
        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-900">
          Entry #
          <ArrowUpDown className="h-3 w-3" />
        </div>
        <div className="col-span-1">Date</div>
        <div className="col-span-3">Memo</div>
        <div className="col-span-2">Accounts</div>
        <div className="col-span-1 text-right">Amount</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <ListSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState onCreateNew={onCreateNew} />
        ) : (
          entries.map((entry) => (
            <JournalEntryRow
              key={entry.id}
              entry={entry}
              onView={() => onViewEntry(entry)}
              onEdit={() => onEditEntry(entry)}
              onCopy={() => onCopyEntry(entry)}
              onVoid={() => onVoidEntry(entry)}
              onReverse={() => onReverseEntry(entry)}
            />
          ))
        )}
      </ScrollArea>

      {/* Pagination */}
      {!isLoading && entries.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
            entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default JournalEntryList;
