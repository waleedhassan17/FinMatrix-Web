'use client';

// Chart of Accounts Page
// Displays the Chart of Accounts tree view with CRUD operations

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AccountTreeView, AccountFormModal } from '@/components/gl';
import {
  fetchAccountsTree,
  fetchAccountOptions,
  createAccountAction,
  updateAccountAction,
  deactivateAccountAction,
  validateAccountNumber,
} from '@/actions/gl';
import type { AccountTreeNode, AccountOption, AccountInput, ChartOfAccount } from '@finmatrix/db/types';

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountTreeNode[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [treeResult, optionsResult] = await Promise.all([
        fetchAccountsTree({ includeInactive: true }),
        fetchAccountOptions(),
      ]);

      if (treeResult.success && treeResult.data) {
        setAccounts(treeResult.data);
      } else {
        toast.error(treeResult.error || 'Failed to load accounts');
      }

      if (optionsResult.success && optionsResult.data) {
        setAccountOptions(optionsResult.data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load chart of accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Handle account click (view details)
  const handleAccountClick = useCallback((account: AccountTreeNode) => {
    // Could navigate to account detail page or show a side panel
    console.log('Account clicked:', account);
  }, []);

  // Handle add account
  const handleAddAccount = useCallback((parentId?: string) => {
    setEditingAccount(null);
    setDefaultParentId(parentId || null);
    setIsModalOpen(true);
  }, []);

  // Handle edit account
  const handleEditAccount = useCallback((account: AccountTreeNode) => {
    setEditingAccount(account as ChartOfAccount);
    setDefaultParentId(null);
    setIsModalOpen(true);
  }, []);

  // Handle delete/deactivate account
  const handleDeleteAccount = useCallback(
    async (account: AccountTreeNode) => {
      const action = Number(account.currentBalance) === 0 ? 'delete' : 'deactivate';
      const confirmed = window.confirm(
        `Are you sure you want to ${action} "${account.name}"? ${
          action === 'deactivate'
            ? 'This account has a balance and will be deactivated instead of deleted.'
            : ''
        }`
      );

      if (!confirmed) return;

      try {
        const result = await deactivateAccountAction(account.id);
        if (result.success) {
          toast.success(result.message || `Account ${action}d successfully`);
          loadAccounts();
        } else {
          toast.error(result.error || `Failed to ${action} account`);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error(`Failed to ${action} account`);
      }
    },
    [loadAccounts]
  );

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (data: AccountInput) => {
      try {
        let result;
        if (editingAccount) {
          result = await updateAccountAction(editingAccount.id, data);
        } else {
          result = await createAccountAction(data);
        }

        if (result.success) {
          toast.success(result.message || 'Account saved successfully');
          setIsModalOpen(false);
          loadAccounts();
        } else {
          throw new Error(result.error || 'Failed to save account');
        }
      } catch (error) {
        throw error; // Let the modal handle the error
      }
    },
    [editingAccount, loadAccounts]
  );

  // Handle account number validation
  const handleValidateAccountNumber = useCallback(
    async (accountNumber: string): Promise<boolean> => {
      const result = await validateAccountNumber(accountNumber, editingAccount?.id);
      return result.success && result.data === true;
    },
    [editingAccount]
  );

  // Handle import
  const handleImport = useCallback(() => {
    // TODO: Implement CSV import modal
    toast.info('Import feature coming soon');
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    // TODO: Implement CSV export
    toast.info('Export feature coming soon');
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your general ledger account structure
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-slate-50">
        <AccountTreeView
          accounts={accounts}
          onAccountClick={handleAccountClick}
          onAccountEdit={handleEditAccount}
          onAccountDelete={handleDeleteAccount}
          onAddAccount={handleAddAccount}
          onImport={handleImport}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>

      {/* Account Form Modal */}
      <AccountFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        account={editingAccount}
        parentOptions={accountOptions}
        validateAccountNumber={handleValidateAccountNumber}
        defaultParentId={defaultParentId}
      />
    </div>
  );
}
