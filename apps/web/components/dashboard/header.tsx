'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@finmatrix/ui';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Building2,
  Command,
  Plus,
  Check,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

interface HeaderProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    currentOrganizationId?: string | null;
  };
  currentOrg?: Organization | null;
  organizations?: Organization[];
  onOrgChange?: (org: Organization) => void;
}

export function Header({ user, currentOrg, organizations = [], onOrgChange }: HeaderProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [currentDate] = useState(new Date());

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const fiscalPeriod = 'July 2025 - June 2026';
  const currentPeriod = currentDate.toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
        {/* Left Section - Org Selector */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsOrgOpen(!isOrgOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1a365d] to-[#0d9488] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">
                  {currentOrg?.name?.[0]?.toUpperCase() || 'O'}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 max-w-[140px] truncate">
                  {currentOrg?.name || 'Select Organization'}
                </p>
                <p className="text-xs text-slate-500">FY {currentPeriod}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {isOrgOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOrgOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Your Organizations
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          onOrgChange?.(org);
                          setIsOrgOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors",
                          currentOrg?.id === org.id && "bg-teal-50"
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center",
                          currentOrg?.id === org.id 
                            ? "bg-gradient-to-br from-[#1a365d] to-[#0d9488]" 
                            : "bg-slate-200"
                        )}>
                          <span className={cn(
                            "font-bold text-sm",
                            currentOrg?.id === org.id ? "text-white" : "text-slate-600"
                          )}>
                            {org.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{org.name}</p>
                          <p className="text-xs text-slate-500">{org.isOwner ? 'Owner' : 'Member'}</p>
                        </div>
                        {currentOrg?.id === org.id && (
                          <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                      <Plus className="h-4 w-4" />
                      Create New Organization
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group"
          >
            <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-500" />
            <span className="text-sm text-slate-400 flex-1 text-left group-hover:text-slate-500">
              Search...
            </span>
            <kbd className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-[10px] text-slate-400 border border-slate-200 shadow-sm">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Search className="h-5 w-5 text-slate-500" />
        </button>

        {/* Right Section */}
        <div className="flex items-center gap-1 lg:gap-2">
          {/* Period Selector */}
          <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">{currentPeriod}</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 mx-2" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1a365d] to-[#0d9488] flex items-center justify-center text-white font-semibold text-sm">
                {user.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings className="h-4 w-4" />
                      Preferences
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette / Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="flex-1 text-lg outline-none placeholder:text-slate-400"
                autoFocus
              />
              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500">ESC</kbd>
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Quick Actions
              </p>
              <div className="space-y-1">
                {[
                  { title: 'Create Invoice', icon: '📄', shortcut: 'I' },
                  { title: 'Record Payment', icon: '💰', shortcut: 'P' },
                  { title: 'New Bill', icon: '🧾', shortcut: 'B' },
                  { title: 'Bank Reconciliation', icon: '🏦', shortcut: 'R' },
                  { title: 'Generate Report', icon: '📊', shortcut: 'G' },
                ].map((action) => (
                  <button
                    key={action.title}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span className="flex-1 text-left text-sm text-slate-700">
                      {action.title}
                    </span>
                    <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500">
                      {action.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
