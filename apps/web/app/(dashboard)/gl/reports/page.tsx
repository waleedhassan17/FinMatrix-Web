'use client';

// GL Reports Page (Placeholder)
// Will contain Trial Balance, GL Detail, Account Activity, and other reports

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@finmatrix/ui/components/card';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function ReportCard({ title, description, icon, href, color }: ReportCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div
            className={`p-2 rounded-lg w-fit ${
              color === 'blue'
                ? 'bg-blue-100 text-blue-600'
                : color === 'green'
                ? 'bg-green-100 text-green-600'
                : color === 'purple'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {icon}
          </div>
          <CardTitle className="mt-3 text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function GLReportsPage() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">GL Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Generate financial reports from your general ledger
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Quick Report Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Report</CardTitle>
              <CardDescription>Generate a report with default settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asOfDate">As of Date</Label>
                  <Input
                    id="asOfDate"
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="w-44"
                  />
                </div>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Trial Balance
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Categories */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ReportCard
                title="Trial Balance"
                description="Summarized balances for all accounts as of a specific date"
                icon={<BarChart3 className="h-5 w-5" />}
                href="/gl/reports/trial-balance"
                color="blue"
              />
              <ReportCard
                title="General Ledger Detail"
                description="Transaction-level detail for one or more accounts"
                icon={<FileText className="h-5 w-5" />}
                href="/gl/reports/gl-detail"
                color="green"
              />
              <ReportCard
                title="Account Activity"
                description="Movement summary showing opening, activity, and closing balances"
                icon={<TrendingUp className="h-5 w-5" />}
                href="/gl/reports/account-activity"
                color="purple"
              />
              <ReportCard
                title="Journal Entry Listing"
                description="List of journal entries for a period"
                icon={<FileText className="h-5 w-5" />}
                href="/gl/reports/journal-entries"
                color="amber"
              />
              <ReportCard
                title="Fiscal Period Summary"
                description="Period-by-period summary of account balances"
                icon={<Calendar className="h-5 w-5" />}
                href="/gl/reports/fiscal-summary"
                color="blue"
              />
              <ReportCard
                title="Department P&L"
                description="Profit and loss breakdown by department"
                icon={<BarChart3 className="h-5 w-5" />}
                href="/gl/reports/department-pl"
                color="green"
              />
            </div>
          </div>

          {/* Coming Soon */}
          <Card className="border-dashed border-slate-300 bg-slate-50">
            <CardContent className="py-8 text-center text-slate-500">
              <p className="text-lg font-medium mb-2">More Reports Coming Soon</p>
              <p className="text-sm">
                Balance Sheet, Income Statement, Cash Flow Statement, and custom report builder
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
