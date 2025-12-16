'use client';

import { cn } from '@finmatrix/ui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendColor?: 'green' | 'red' | 'amber';
  sparklineData?: number[];
  icon?: React.ReactNode;
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  trendColor,
  sparklineData,
  icon,
  subtitle,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  const actualTrendColor = trendColor || (trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'amber');
  
  const trendColors = {
    green: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    red: 'text-red-600 bg-red-50 border border-red-100',
    amber: 'text-amber-600 bg-amber-50 border border-amber-100',
  };

  const iconBgColors = {
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    red: 'bg-gradient-to-br from-red-50 to-red-100',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100',
  };

  const sparklineColors = {
    green: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b',
  };

  const chartData = sparklineData?.map((value, index) => ({ value, index })) || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 lg:p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn(
            "h-9 w-9 lg:h-10 lg:w-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-sm group-hover:scale-110 transition-transform duration-300",
            iconBgColors[actualTrendColor]
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xl lg:text-2xl font-bold text-slate-800 truncate tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 lg:gap-2 mt-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 lg:gap-1 px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold whitespace-nowrap',
                  trendColors[actualTrendColor]
                )}
              >
                <TrendIcon className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-[10px] lg:text-xs text-slate-400 truncate">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-10 min-w-[80px] min-h-[40px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={60} minHeight={30}>
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColors[actualTrendColor]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
