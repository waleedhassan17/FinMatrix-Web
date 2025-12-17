'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@finmatrix/ui';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Package,
  Landmark,
  BookOpen,
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Zap,
  FileCheck,
  ShoppingCart,
  Wallet,
  ClipboardList,
  Building2,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Customers & Sales',
    icon: Users,
    children: [
      { title: 'Customers', href: '/dashboard/customers' },
      { title: 'Invoices', href: '/dashboard/invoices' },
      { title: 'Quotes', href: '/dashboard/quotes' },
      { title: 'Sales Orders', href: '/dashboard/sales-orders' },
      { title: 'Receive Payments', href: '/dashboard/payments/receive' },
      { title: 'Credit Memos', href: '/dashboard/credit-memos' },
    ],
  },
  {
    title: 'Vendors & Purchases',
    icon: ShoppingCart,
    children: [
      { title: 'Vendors', href: '/dashboard/vendors' },
      { title: 'Vendor List', href: '/dashboard/vendors/list' },
      { title: 'Bills', href: '/dashboard/bills' },
      { title: 'New Bill', href: '/dashboard/bills/new' },
      { title: 'Pay Bills', href: '/dashboard/payments/vendor' },
      { title: 'Purchase Orders', href: '/dashboard/purchase-orders' },
      { title: 'Vendor Credits', href: '/dashboard/vendor-credits' },
    ],
  },
  {
    title: 'Inventory & Services',
    href: '/dashboard/inventory',
    icon: Package,
  },
  {
    title: 'Banking',
    icon: Landmark,
    children: [
      { title: 'Banking Center', href: '/banking' },
      { title: 'Bank Accounts', href: '/banking/accounts' },
      { title: 'Import Statement', href: '/banking/import' },
      { title: 'Reconciliation', href: '/banking/reconcile' },
      { title: 'Reports', href: '/banking/reports' },
    ],
  },
  {
    title: 'General Ledger',
    icon: BookOpen,
    children: [
      { title: 'Overview', href: '/gl' },
      { title: 'Chart of Accounts', href: '/gl/chart-of-accounts' },
      { title: 'Journal Entries', href: '/gl/journal-entries' },
      { title: 'Reports', href: '/gl/reports' },
      { title: 'Settings', href: '/gl/settings' },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: BarChart3,
    children: [
      { title: 'Dashboard', href: '/dashboard/reports' },
      { title: 'AR Aging', href: '/dashboard/reports/ar-aging' },
      { title: 'AP Aging', href: '/dashboard/reports/ap-aging' },
      { title: 'Sales Summary', href: '/dashboard/reports/sales' },
      { title: 'Financial Statements', href: '/dashboard/reports/financials' },
    ],
  },
  {
    title: 'FBR Compliance',
    icon: Shield,
    children: [
      { title: 'Compliance Center', href: '/fbr' },
      { title: 'GST Configuration', href: '/fbr/config' },
      { title: 'Form A - Sales Tax', href: '/fbr/form-a' },
      { title: 'Form B - Input Tax', href: '/fbr/form-b' },
      { title: 'GST Reconciliation', href: '/fbr/reconciliation' },
      { title: 'Reports & WHT', href: '/fbr/reports' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'Company', href: '/dashboard/settings/company' },
      { title: 'Users', href: '/dashboard/settings/users' },
      { title: 'Roles', href: '/dashboard/settings/roles' },
      { title: 'Fiscal Periods', href: '/dashboard/settings/fiscal-periods' },
    ],
  },
];

const quickActions = [
  { title: 'New Invoice', href: '/dashboard/invoices/new', icon: FileText },
  { title: 'Receive Payment', href: '/dashboard/payments/receive', icon: CreditCard },
  { title: 'New Bill', href: '/dashboard/bills/new', icon: Receipt },
  { title: 'Journal Entry', href: '/gl/journal-entries/new', icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Customers & Sales']);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (children: { href: string }[]) =>
    children.some((child) => pathname.startsWith(child.href));

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold">FinMatrix</span>
          )}
        </Link>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.title)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isParentActive(item.children)
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {expandedItems.includes(item.title) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.title) && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'block px-3 py-2 rounded-lg text-sm transition-colors',
                              isActive(child.href)
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href!)
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Toggle - Desktop only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 rounded-full bg-[#1a365d] border-2 border-slate-200 shadow-md items-center justify-center hover:bg-[#2d4a7c] transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-white" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-white" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1a365d] text-white shadow-lg hover:bg-[#2d4a7c] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop spacer */}
      <div className={cn(
        'hidden lg:block flex-shrink-0 transition-all duration-300',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )} />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-[#1a365d] to-[#0f2544] text-white transition-all duration-300 flex flex-col shadow-xl',
          // Mobile: full width, slide in/out
          'w-72 lg:w-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop: collapsible width
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
