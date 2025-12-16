'use client';

// Edit Journal Entry Page
// Edits an existing draft journal entry

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@finmatrix/ui/components/button';
import { JournalEntryForm } from '@/components/gl';
import {
  fetchAccountOptions,
  fetchDepartments,
  fetchJournalEntry,
  updateJournalEntryAction,
  postJournalEntryAction,
} from '@/actions/gl';
import type { AccountOption, Department, JournalEntryWithLines, JournalEntryInput } from '@finmatrix/db/types';

export default function EditJournalEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [entry, setEntry] = useState<JournalEntryWithLines | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!entryId) return;

      setIsLoading(true);
      try {
        const [accountsResult, departmentsResult, entryResult] = await Promise.all([
          fetchAccountOptions(),
          fetchDepartments(),
          fetchJournalEntry(entryId),
        ]);

        if (accountsResult.success && accountsResult.data) {
          setAccounts(accountsResult.data);
        }

        if (departmentsResult.success && departmentsResult.data) {
          setDepartments(departmentsResult.data);
        }

        if (entryResult.success && entryResult.data) {
          if (entryResult.data.status !== 'draft') {
            toast.error('Only draft entries can be edited');
            router.push(`/gl/journal-entries/${entryId}`);
            return;
          }
          setEntry(entryResult.data);
        } else {
          toast.error(entryResult.error || 'Failed to load journal entry');
          router.push('/gl/journal-entries');
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [entryId, router]);

  // Handle save draft
  const handleSaveDraft = useCallback(
    async (data: JournalEntryInput) => {
      if (!entryId) return;

      setIsSubmitting(true);
      try {
        const result = await updateJournalEntryAction(entryId, data);
        if (result.success && result.data) {
          toast.success(result.message || 'Changes saved');
          router.push(`/gl/journal-entries/${result.data.id}`);
        } else {
          throw new Error(result.error || 'Failed to save changes');
        }
      } catch (error) {
        console.error('Error saving changes:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [entryId, router]
  );

  // Handle post (save and post)
  const handlePost = useCallback(
    async (data: JournalEntryInput) => {
      if (!entryId) return;

      setIsSubmitting(true);
      try {
        // First update the entry
        const updateResult = await updateJournalEntryAction(entryId, data);
        if (!updateResult.success || !updateResult.data) {
          throw new Error(updateResult.error || 'Failed to save changes');
        }

        // Then post it
        const postResult = await postJournalEntryAction(updateResult.data.id);
        if (postResult.success && postResult.data) {
          toast.success(postResult.message || 'Entry posted successfully');
          router.push(`/gl/journal-entries/${postResult.data.id}`);
        } else {
          toast.warning('Changes saved. ' + (postResult.error || 'Failed to post'));
          router.push(`/gl/journal-entries/${updateResult.data.id}`);
        }
      } catch (error) {
        console.error('Error posting entry:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [entryId, router]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/gl/journal-entries/${entryId}`);
  }, [router, entryId]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Edit {entry.entryNumber}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Modify the journal entry details and lines
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <JournalEntryForm
            entry={entry}
            accounts={accounts}
            departments={departments}
            onSaveDraft={handleSaveDraft}
            onPost={handlePost}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
