'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface CashFlowData {
  date: string;
  actual?: number;
  projected: number;
  optimistic?: number;
  pessimistic?: number;
}

interface CashFlowForecastProps {
  data: CashFlowData[];
  minimumBalance?: number;
  currentBalance: number;
  projectedChange: number;
  title?: string;
}

export function CashFlowForecast({
  data,
  minimumBalance = 100000,
  currentBalance,
  projectedChange,
  title = 'Cash Flow Forecast',
}: CashFlowForecastProps) {
  const [showRange, setShowRange] = useState(true);

  // Check if any projected values go below minimum
  const hasLowBalanceWarning = data.some((d) => d.projected < minimumBalance);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isProjected = !payload.find((p: any) => p.dataKey === 'actual')?.value;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium text-slate-800">{label}</p>
            {isProjected && (
              <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                Projected
              </span>
            )}
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              if (!entry.value) return null;
              return (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-slate-600">
                    {entry.dataKey === 'actual'
                      ? 'Actual'
                      : entry.dataKey === 'projected'
                      ? 'Projected'
                      : entry.dataKey === 'optimistic'
                      ? 'Best Case'
                      : 'Worst Case'}
                    :
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    PKR {entry.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">30/60/90 Day Projection</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500">Current</p>
              <p className="text-sm font-semibold text-slate-800">
                PKR {currentBalance.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">90-Day Change</p>
              <div className={`flex items-center gap-1 ${projectedChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {projectedChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-sm font-semibold">
                  {projectedChange >= 0 ? '+' : ''}
                  {projectedChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasLowBalanceWarning && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Projected balance may fall below minimum (PKR {minimumBalance.toLocaleString()})
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showRange}
              onChange={(e) => setShowRange(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show confidence range
          </label>
        </div>
        <div className="h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={minimumBalance}
                stroke="#dc2626"
                strokeDasharray="5 5"
                label={{
                  value: 'Min Balance',
                  position: 'right',
                  fill: '#dc2626',
                  fontSize: 10,
                }}
              />
              {showRange && (
                <>
                  <Area
                    type="monotone"
                    dataKey="optimistic"
                    stroke="none"
                    fill="#d1fae5"
                    fillOpacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="pessimistic"
                    stroke="none"
                    fill="#fee2e2"
                    fillOpacity={0.5}
                  />
                </>
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorActual)"
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#0d9488"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorProjected)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
