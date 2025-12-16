'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import { FileText, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TaxItem {
  type: string;
  period: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'filed' | 'overdue' | 'upcoming';
}

interface GstSummaryProps {
  outputTax: number;
  inputTax: number;
  netPayable: number;
  taxItems: TaxItem[];
  title?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  filed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  upcoming: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
};

export function GstSummary({
  outputTax,
  inputTax,
  netPayable,
  taxItems,
  title = 'GST/Tax Liability Summary',
}: GstSummaryProps) {
  const hasOverdue = taxItems.some((item) => item.status === 'overdue');

  return (
    <Card className={`border-slate-200/80 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 ${hasOverdue ? 'ring-1 ring-red-200' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
              FBR Compliant
            </span>
          </div>
          <Link
            href="/dashboard/fbr"
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tax Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Output Tax (17%)</p>
            <p className="text-lg font-semibold text-slate-800">
              PKR {outputTax.toLocaleString()}
            </p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Input Tax Credit</p>
            <p className="text-lg font-semibold text-green-600">
              -PKR {inputTax.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Net Payable</p>
            <p className={`text-lg font-bold ${netPayable >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
              PKR {Math.abs(netPayable).toLocaleString()}
              {netPayable < 0 && <span className="text-xs ml-1">(Refund)</span>}
            </p>
          </div>
        </div>

        {/* Upcoming Filings */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Upcoming Filings</p>
          {taxItems.map((item, index) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${config.border} ${config.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white ${config.color}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.type}</p>
                    <p className="text-xs text-slate-500">{item.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">
                    PKR {item.amount.toLocaleString()}
                  </p>
                  <div className={`flex items-center gap-1 text-xs ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    <span>Due {item.dueDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
            Generate GST Return
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Export to FBR Format
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
