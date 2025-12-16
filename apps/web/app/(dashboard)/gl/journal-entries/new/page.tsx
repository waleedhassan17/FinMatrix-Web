'use client';

// New Journal Entry Page
// Creates a new journal entry with the form component

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@finmatrix/ui/components/button';
import { JournalEntryForm } from '@/components/gl';
import {
  fetchAccountOptions,
  fetchDepartments,
  fetchJournalEntry,
  createJournalEntryAction,
  postJournalEntryAction,
} from '@/actions/gl';
import type { AccountOption, Department, JournalEntryWithLines, JournalEntryInput } from '@finmatrix/db/types';

export default function NewJournalEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyId = searchParams.get('copy');

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [copyEntry, setCopyEntry] = useState<JournalEntryWithLines | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [accountsResult, departmentsResult] = await Promise.all([
          fetchAccountOptions(),
          fetchDepartments(),
        ]);

        if (accountsResult.success && accountsResult.data) {
          setAccounts(accountsResult.data);
        }

        if (departmentsResult.success && departmentsResult.data) {
          setDepartments(departmentsResult.data);
        }

        // If copying from another entry
        if (copyId) {
          const copyResult = await fetchJournalEntry(copyId);
          if (copyResult.success && copyResult.data) {
            // Clear the ID and entry number for the copy
            setCopyEntry({
              ...copyResult.data,
              id: '',
              entryNumber: '',
              status: 'draft',
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [copyId]);

  // Handle save draft
  const handleSaveDraft = useCallback(
    async (data: JournalEntryInput) => {
      setIsSubmitting(true);
      try {
        const result = await createJournalEntryAction(data);
        if (result.success && result.data) {
          toast.success(result.message || 'Draft saved');
          router.push(`/gl/journal-entries/${result.data.id}`);
        } else {
          throw new Error(result.error || 'Failed to save draft');
        }
      } catch (error) {
        console.error('Error saving draft:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  // Handle post (save and post)
  const handlePost = useCallback(
    async (data: JournalEntryInput) => {
      setIsSubmitting(true);
      try {
        // First create the entry
        const createResult = await createJournalEntryAction(data);
        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error || 'Failed to create entry');
        }

        // Then post it
        const postResult = await postJournalEntryAction(createResult.data.id);
        if (postResult.success && postResult.data) {
          toast.success(postResult.message || 'Entry posted successfully');
          router.push(`/gl/journal-entries/${postResult.data.id}`);
        } else {
          // Entry created but not posted
          toast.warning('Entry saved as draft. ' + (postResult.error || 'Failed to post'));
          router.push(`/gl/journal-entries/${createResult.data.id}`);
        }
      } catch (error) {
        console.error('Error posting entry:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push('/gl/journal-entries');
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading...</div>
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
              {copyId ? 'Copy Journal Entry' : 'New Journal Entry'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {copyId
                ? 'Create a new entry based on an existing one'
                : 'Create a new journal entry'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <JournalEntryForm
            entry={copyEntry}
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
