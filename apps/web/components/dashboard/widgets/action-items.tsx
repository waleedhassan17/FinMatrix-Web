'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import { AlertTriangle, Clock, FileWarning, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'overdue' | 'approval' | 'warning' | 'reminder' | 'reconciliation' | 'compliance';
  actionUrl: string;
  actionLabel: string;
  dueDate?: string;
  createdAt?: Date;
  relatedEntityId?: string;
  relatedEntityType?: 'invoice' | 'bill' | 'transaction' | 'customer' | 'vendor' | 'tax';
  metadata?: Record<string, unknown>;
}

interface ActionItemsProps {
  items: ActionItem[];
  title?: string;
}

const priorityConfig = {
  high: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
};

const typeIcons = {
  overdue: AlertTriangle,
  approval: Clock,
  warning: FileWarning,
  reminder: Clock,
  reconciliation: FileWarning,
  compliance: Clock,
};

export function ActionItems({ items, title = 'Action Items' }: ActionItemsProps) {
  const highPriorityCount = items.filter((item) => item.priority === 'high').length;

  if (items.length === 0) {
    return (
      <Card className="border-slate-200/80 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 bg-green-100 rounded-full mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-800">All caught up!</p>
            <p className="text-sm text-slate-500">No pending action items</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-slate-200/80 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 ${highPriorityCount > 0 ? 'ring-1 ring-red-200' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
            {highPriorityCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                {highPriorityCount} urgent
              </span>
            )}
          </div>
          <span className="text-sm text-slate-500">{items.length} items</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((item) => {
            const config = priorityConfig[item.priority];
            const TypeIcon = typeIcons[item.type];
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${config.border} ${config.bg} transition-colors hover:opacity-90`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-white ${config.color}`}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${config.badge}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {item.dueDate && (
                        <span className="text-xs text-slate-500">Due: {item.dueDate}</span>
                      )}
                      <Link
                        href={item.actionUrl}
                        className={`text-xs font-medium ${config.color} hover:underline flex items-center gap-1 ml-auto`}
                      >
                        {item.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
