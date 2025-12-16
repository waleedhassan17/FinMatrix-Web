'use client';

import { cn } from '@finmatrix/ui';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700',
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton loader for metric cards
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 lg:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-2 w-16" />
        </div>
        <Skeleton className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <Skeleton className="h-7 w-28 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="w-20 h-10" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for aging charts
 */
export function AgingChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="mb-4">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="w-40 h-40 rounded-full" />
        <div className="flex-1 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for bar/line charts
 */
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="h-72 flex items-end justify-between gap-2 pt-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <Skeleton 
              className="w-full rounded-t" 
              style={{ height: `${Math.random() * 60 + 20}%` }} 
            />
            <Skeleton 
              className="w-full rounded-t" 
              style={{ height: `${Math.random() * 40 + 10}%` }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for profit margin chart
 */
export function ProfitMarginChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-36" />
        <div className="flex gap-4">
          <div className="text-right">
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
      <div className="h-72 relative">
        <Skeleton className="absolute bottom-0 left-0 right-0 h-1/2 rounded opacity-30" />
        <Skeleton className="absolute bottom-0 left-0 right-0 h-1/3 rounded opacity-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for cash flow forecast
 */
export function CashFlowSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
      <div className="h-64 relative">
        <Skeleton className="absolute bottom-0 left-0 right-0 h-2/3 rounded opacity-20" />
        <div className="absolute bottom-1/3 left-0 right-0 border-t-2 border-dashed border-slate-300" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for GST summary
 */
export function GSTSummarySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-3 w-20 mx-auto mb-2" />
            <Skeleton className="h-6 w-24 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for top customers
 */
export function TopCustomersSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-5 w-28 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-40 w-full mb-4 rounded" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-full" />
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for action items
 */
export function ActionItemsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Aging Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <AgingChartSkeleton />
        <AgingChartSkeleton />
      </div>

      {/* Revenue & Profit Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <ChartSkeleton />
        <ProfitMarginChartSkeleton />
      </div>

      {/* Cash Flow & GST Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <CashFlowSkeleton />
        <GSTSummarySkeleton />
      </div>

      {/* Top Customers & Action Items Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <TopCustomersSkeleton />
        <ActionItemsSkeleton />
      </div>
    </div>
  );
}
