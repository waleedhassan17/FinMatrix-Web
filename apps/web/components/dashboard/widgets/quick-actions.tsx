'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Calculator,
  FileSpreadsheet,
  Users,
  Package,
  Command,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@finmatrix/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  shortcut?: string;
  category: 'sales' | 'purchases' | 'banking' | 'reports';
}

const quickActions: QuickAction[] = [
  {
    id: 'new-invoice',
    label: 'New Invoice',
    description: 'Create a new sales invoice',
    icon: FileText,
    href: '/dashboard/invoices/new',
    shortcut: 'I',
    category: 'sales',
  },
  {
    id: 'new-quotation',
    label: 'New Quotation',
    description: 'Create a quotation for customer',
    icon: FileSpreadsheet,
    href: '/dashboard/quotations/new',
    shortcut: 'Q',
    category: 'sales',
  },
  {
    id: 'receive-payment',
    label: 'Receive Payment',
    description: 'Record customer payment',
    icon: Wallet,
    href: '/dashboard/payments/receive',
    shortcut: 'P',
    category: 'sales',
  },
  {
    id: 'new-bill',
    label: 'Enter Bill',
    description: 'Record vendor bill',
    icon: Receipt,
    href: '/dashboard/bills/new',
    shortcut: 'B',
    category: 'purchases',
  },
  {
    id: 'make-payment',
    label: 'Make Payment',
    description: 'Pay vendor bill',
    icon: CreditCard,
    href: '/dashboard/payments/make',
    category: 'purchases',
  },
  {
    id: 'new-customer',
    label: 'Add Customer',
    description: 'Create new customer record',
    icon: Users,
    href: '/dashboard/customers/new',
    category: 'sales',
  },
  {
    id: 'new-product',
    label: 'Add Product',
    description: 'Create new product or service',
    icon: Package,
    href: '/dashboard/products/new',
    category: 'sales',
  },
  {
    id: 'bank-deposit',
    label: 'Bank Deposit',
    description: 'Record bank deposit',
    icon: Wallet,
    href: '/dashboard/banking/deposit',
    category: 'banking',
  },
  {
    id: 'gst-return',
    label: 'GST Return',
    description: 'Generate GST return for FBR',
    icon: Calculator,
    href: '/dashboard/fbr/gst-return',
    category: 'reports',
  },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Open with Ctrl+Shift+K or Cmd+Shift+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((open) => !open);
        return;
      }

      // Individual shortcuts when dialog is open
      if (open) {
        const action = quickActions.find(
          (a) => a.shortcut?.toLowerCase() === e.key.toLowerCase()
        );
        if (action && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setOpen(false);
          router.push(action.href);
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, router]);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Quick Action</span>
        <kbd className="hidden group-hover:inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-700 rounded text-xs">
          <Command className="h-3 w-3" />
          <span>⇧K</span>
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="What would you like to do?" />
        <CommandList>
          <CommandEmpty>No quick actions found.</CommandEmpty>
          
          <CommandGroup heading="Sales & Invoicing">
            {quickActions
              .filter((a) => a.category === 'sales')
              .map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleSelect(action.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-teal-600" />
                    <div className="flex-1">
                      <span>{action.label}</span>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
          </CommandGroup>

          <CommandGroup heading="Purchases & Bills">
            {quickActions
              .filter((a) => a.category === 'purchases')
              .map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleSelect(action.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-amber-600" />
                    <div className="flex-1">
                      <span>{action.label}</span>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
          </CommandGroup>

          <CommandGroup heading="Banking">
            {quickActions
              .filter((a) => a.category === 'banking')
              .map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleSelect(action.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <span>{action.label}</span>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
          </CommandGroup>

          <CommandGroup heading="Reports & Compliance">
            {quickActions
              .filter((a) => a.category === 'reports')
              .map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleSelect(action.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <span>{action.label}</span>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
