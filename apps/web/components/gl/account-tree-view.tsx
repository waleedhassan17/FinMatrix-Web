'use client';

// Chart of Accounts Tree View Component
// Displays accounts in a hierarchical tree with expand/collapse, inline editing, and drag-drop

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Upload,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@finmatrix/ui/components/tooltip';
import { ScrollArea } from '@finmatrix/ui/components/scroll-area';
import type { AccountTreeNode, AccountType } from '@finmatrix/db/types';
import { ACCOUNT_TYPE_CONFIGS } from '@finmatrix/db/types';

// ============================================================================
// Types
// ============================================================================

interface AccountTreeViewProps {
  accounts: AccountTreeNode[];
  onAccountClick?: (account: AccountTreeNode) => void;
  onAccountEdit?: (account: AccountTreeNode) => void;
  onAccountDelete?: (account: AccountTreeNode) => void;
  onAddAccount?: (parentId?: string) => void;
  onImport?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

interface AccountTreeNodeRowProps {
  node: AccountTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAccountClick?: (account: AccountTreeNode) => void;
  onAccountEdit?: (account: AccountTreeNode) => void;
  onAccountDelete?: (account: AccountTreeNode) => void;
  onAddChild?: (parentId: string) => void;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: () => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function AccountTypeIcon({ type }: { type: AccountType }) {
  const iconClass = 'h-4 w-4';

  switch (type) {
    case 'asset':
      return <Wallet className={cn(iconClass, 'text-blue-600')} />;
    case 'liability':
      return <CreditCard className={cn(iconClass, 'text-red-600')} />;
    case 'equity':
      return <Building2 className={cn(iconClass, 'text-purple-600')} />;
    case 'revenue':
      return <TrendingUp className={cn(iconClass, 'text-green-600')} />;
    case 'expense':
      return <TrendingDown className={cn(iconClass, 'text-amber-600')} />;
    default:
      return null;
  }
}

function AccountTypeBadge({ type }: { type: AccountType }) {
  const config = ACCOUNT_TYPE_CONFIGS[type];

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ============================================================================
// Tree Node Row Component
// ============================================================================

function AccountTreeNodeRow({
  node,
  level,
  isExpanded,
  onToggle,
  onAccountClick,
  onAccountEdit,
  onAccountDelete,
  onAddChild,
  isEditing,
  onEditStart,
  onEditEnd,
  editingName,
  onEditingNameChange,
  onSaveEdit,
}: AccountTreeNodeRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onEditEnd();
    }
  };

  const balance = Number(node.currentBalance) || 0;
  const isNegative = balance < 0;

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 transition-colors',
        !node.isActive && 'opacity-50'
      )}
      style={{ paddingLeft: `${level * 24 + 8}px` }}
    >
      {/* Expand/Collapse Toggle */}
      <button
        onClick={onToggle}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded hover:bg-slate-200 transition-colors',
          !node.hasChildren && 'invisible'
        )}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {/* Account Type Icon */}
      <AccountTypeIcon type={node.type} />

      {/* Account Number */}
      <span className="font-mono text-sm text-slate-500 w-16 shrink-0">{node.accountNumber}</span>

      {/* Account Name (with inline editing) */}
      {isEditing ? (
        <Input
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onSaveEdit}
          autoFocus
          className="h-7 text-sm flex-1 max-w-xs"
        />
      ) : (
        <button
          onClick={() => onAccountClick?.(node)}
          className="flex-1 text-left text-sm text-slate-900 hover:text-blue-600 truncate"
        >
          {node.name}
        </button>
      )}

      {/* Account Type Badge */}
      <AccountTypeBadge type={node.type} />

      {/* Balance */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'font-mono text-sm w-28 text-right shrink-0',
                isNegative ? 'text-red-600' : 'text-slate-700'
              )}
            >
              {formatCurrency(balance)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Current Balance ({node.normalBalance === 'debit' ? 'Debit' : 'Credit'} normal)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Actions Menu */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditStart}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAccountEdit?.(node)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddChild?.(node.id)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sub-Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAccountDelete?.(node)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {balance === 0 ? 'Delete' : 'Deactivate'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================================================
// Account Tree Section (Grouped by Type)
// ============================================================================

function AccountTreeSection({
  type,
  accounts,
  expandedIds,
  onToggle,
  onAccountClick,
  onAccountEdit,
  onAccountDelete,
  onAddAccount,
  editingId,
  onEditStart,
  onEditEnd,
  editingName,
  onEditingNameChange,
  onSaveEdit,
}: {
  type: AccountType;
  accounts: AccountTreeNode[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onAccountClick?: (account: AccountTreeNode) => void;
  onAccountEdit?: (account: AccountTreeNode) => void;
  onAccountDelete?: (account: AccountTreeNode) => void;
  onAddAccount?: (parentId?: string) => void;
  editingId: string | null;
  onEditStart: (id: string, name: string) => void;
  onEditEnd: () => void;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: () => void;
}) {
  const config = ACCOUNT_TYPE_CONFIGS[type];
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderNodes = (nodes: AccountTreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <AccountTreeNodeRow
          node={node}
          level={level}
          isExpanded={expandedIds.has(node.id)}
          onToggle={() => onToggle(node.id)}
          onAccountClick={onAccountClick}
          onAccountEdit={onAccountEdit}
          onAccountDelete={onAccountDelete}
          onAddChild={onAddAccount}
          isEditing={editingId === node.id}
          onEditStart={() => onEditStart(node.id, node.name)}
          onEditEnd={onEditEnd}
          editingName={editingName}
          onEditingNameChange={onEditingNameChange}
          onSaveEdit={onSaveEdit}
        />
        {node.hasChildren && expandedIds.has(node.id) && renderNodes(node.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Calculate section total
  const calculateTotal = (nodes: AccountTreeNode[]): number => {
    return nodes.reduce((sum, node) => {
      const balance = Number(node.currentBalance) || 0;
      return sum + balance + calculateTotal(node.children);
    }, 0);
  };

  const sectionTotal = calculateTotal(accounts);

  return (
    <div className="mb-4">
      {/* Section Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'flex w-full items-center gap-2 rounded-t-md px-3 py-2 text-left font-medium',
          config.bgColor,
          config.color,
          `border-l-4 ${config.borderColor}`
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <AccountTypeIcon type={type} />
        <span className="flex-1">{config.label}s</span>
        <span className="font-mono text-sm">{formatCurrency(sectionTotal)}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 ml-2 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onAddAccount?.();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </button>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="rounded-b-md border border-t-0 border-slate-200 bg-white">
          {accounts.length > 0 ? (
            renderNodes(accounts)
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No {config.label.toLowerCase()} accounts yet.
              <Button
                variant="link"
                size="sm"
                className="ml-1"
                onClick={() => onAddAccount?.()}
              >
                Add one
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Account Tree View Component
// ============================================================================

export function AccountTreeView({
  accounts,
  onAccountClick,
  onAccountEdit,
  onAccountDelete,
  onAddAccount,
  onImport,
  onExport,
  isLoading,
}: AccountTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountType, AccountTreeNode[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };

    // Filter and group
    const filterNodes = (nodes: AccountTreeNode[]): AccountTreeNode[] => {
      return nodes
        .filter((node) => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            node.accountNumber.toLowerCase().includes(query) ||
            node.name.toLowerCase().includes(query)
          );
        })
        .map((node) => ({
          ...node,
          children: filterNodes(node.children),
        }));
    };

    const filtered = filterNodes(accounts);

    for (const node of filtered) {
      if (filterType === 'all' || node.type === filterType) {
        groups[node.type].push(node);
      }
    }

    return groups;
  }, [accounts, searchQuery, filterType]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: AccountTreeNode[]) => {
      for (const node of nodes) {
        if (node.hasChildren) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      }
    };
    collectIds(accounts);
    setExpandedIds(allIds);
  }, [accounts]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleEditStart = useCallback((id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  }, []);

  const handleEditEnd = useCallback(() => {
    setEditingId(null);
    setEditingName('');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editingName.trim()) {
      const account = accounts.find((a) => a.id === editingId);
      if (account && onAccountEdit) {
        onAccountEdit({ ...account, name: editingName.trim() });
      }
    }
    handleEditEnd();
  }, [editingId, editingName, accounts, onAccountEdit, handleEditEnd]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-slate-200 bg-white">
        {/* Search */}
        <div className="relative flex-1 min-w-[150px] sm:max-w-sm order-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="order-2">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {filterType === 'all' ? 'All Types' : ACCOUNT_TYPE_CONFIGS[filterType].label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(ACCOUNT_TYPE_CONFIGS).map(([type, config]) => (
              <DropdownMenuItem key={type} onClick={() => setFilterType(type as AccountType)}>
                <AccountTypeIcon type={type as AccountType} />
                <span className="ml-2">{config.label}s</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand/Collapse - Hidden on mobile */}
        <Button variant="ghost" size="sm" onClick={handleExpandAll} className="hidden sm:inline-flex order-3">
          Expand All
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCollapseAll} className="hidden sm:inline-flex order-4">
          Collapse All
        </Button>

        <div className="hidden sm:block flex-1 order-5" />

        {/* Import/Export - Icons only on mobile */}
        <Button variant="outline" size="sm" onClick={onImport} className="order-6">
          <Upload className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="order-7">
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        {/* Add Account */}
        <Button size="sm" onClick={() => onAddAccount?.()} className="order-8">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Account</span>
        </Button>
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1 p-4">
        {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map((type) => (
          <AccountTreeSection
            key={type}
            type={type}
            accounts={groupedAccounts[type]}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onAccountClick={onAccountClick}
            onAccountEdit={onAccountEdit}
            onAccountDelete={onAccountDelete}
            onAddAccount={onAddAccount}
            editingId={editingId}
            onEditStart={handleEditStart}
            onEditEnd={handleEditEnd}
            editingName={editingName}
            onEditingNameChange={setEditingName}
            onSaveEdit={handleSaveEdit}
          />
        ))}
      </ScrollArea>
    </div>
  );
}

export default AccountTreeView;
