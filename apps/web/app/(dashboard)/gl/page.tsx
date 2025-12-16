'use client';

// GL Module Index Page
// Overview of the General Ledger module with navigation cards

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  stats?: { label: string; value: string }[];
}

function NavigationCard({ title, description, icon, href, color, stats }: NavigationCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'p-2 rounded-lg',
                color === 'blue' && 'bg-blue-100 text-blue-600',
                color === 'green' && 'bg-green-100 text-green-600',
                color === 'purple' && 'bg-purple-100 text-purple-600',
                color === 'amber' && 'bg-amber-100 text-amber-600'
              )}
            >
              {icon}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
          </div>
          <CardTitle className="mt-4">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {stats && stats.length > 0 && (
          <CardContent>
            <div className="flex gap-4">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

export default function GLIndexPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-900">General Ledger</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your chart of accounts, journal entries, and financial reports
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/gl/journal-entries/new">
                <FileText className="h-4 w-4 mr-2" />
                New Journal Entry
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/gl/chart-of-accounts">
                <BookOpen className="h-4 w-4 mr-2" />
                View Chart of Accounts
              </Link>
            </Button>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NavigationCard
              title="Chart of Accounts"
              description="Manage your GL account structure"
              icon={<BookOpen className="h-5 w-5" />}
              href="/gl/chart-of-accounts"
              color="blue"
              stats={[
                { label: 'Total Accounts', value: '45' },
                { label: 'Active', value: '42' },
              ]}
            />

            <NavigationCard
              title="Journal Entries"
              description="Create and manage journal entries"
              icon={<FileText className="h-5 w-5" />}
              href="/gl/journal-entries"
              color="green"
              stats={[
                { label: 'This Month', value: '24' },
                { label: 'Drafts', value: '3' },
              ]}
            />

            <NavigationCard
              title="Reports"
              description="Trial balance, GL detail, and more"
              icon={<BarChart3 className="h-5 w-5" />}
              href="/gl/reports"
              color="purple"
            />

            <NavigationCard
              title="Settings"
              description="Fiscal periods, departments"
              icon={<Settings className="h-5 w-5" />}
              href="/gl/settings"
              color="amber"
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">GL-2024-00024 Posted</div>
                    <div className="text-sm text-slate-500">Monthly depreciation entry - $1,250.00</div>
                  </div>
                  <div className="text-sm text-slate-400">2 hours ago</div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">New Account Created</div>
                    <div className="text-sm text-slate-500">1350 - Prepaid Insurance</div>
                  </div>
                  <div className="text-sm text-slate-400">Yesterday</div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">Fiscal Period Closed</div>
                    <div className="text-sm text-slate-500">November 2024</div>
                  </div>
                  <div className="text-sm text-slate-400">3 days ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-800">3 Draft Entries Pending</div>
                  <div className="text-sm text-amber-700 mt-1">
                    You have 3 journal entries saved as drafts. Review and post them to update account balances.
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 text-amber-800 hover:text-amber-900"
                    asChild
                  >
                    <Link href="/gl/journal-entries?status=draft">View Draft Entries →</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
