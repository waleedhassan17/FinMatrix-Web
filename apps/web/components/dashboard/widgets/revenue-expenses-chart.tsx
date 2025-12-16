'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RevenueExpensesChartProps {
  data: ChartData[];
  title?: string;
}

export function RevenueExpensesChart({ data, title = 'Revenue vs Expenses' }: RevenueExpensesChartProps) {
  const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');

  const getQuarterlyData = () => {
    const quarters: ChartData[] = [];
    for (let i = 0; i < data.length; i += 3) {
      const quarterData = data.slice(i, i + 3);
      quarters.push({
        month: `Q${Math.floor(i / 3) + 1}`,
        revenue: quarterData.reduce((sum, item) => sum + item.revenue, 0),
        expenses: quarterData.reduce((sum, item) => sum + item.expenses, 0),
      });
    }
    return quarters;
  };

  const chartData = view === 'monthly' ? data : getQuarterlyData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const profit = payload[0].value - payload[1].value;
      const margin = ((profit / payload[0].value) * 100).toFixed(1);
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-800 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="text-sm text-slate-600">Revenue:</span>
              <span className="text-sm font-medium text-slate-800">
                PKR {payload[0].value.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">Expenses:</span>
              <span className="text-sm font-medium text-slate-800">
                PKR {payload[1].value.toLocaleString()}
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Profit:</span>
                <span className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  PKR {profit.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Margin:</span>
                <span className={`text-sm font-medium ${Number(margin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {margin}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === 'monthly'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView('quarterly')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === 'quarterly'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Quarterly
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => (
                  <span className="text-sm text-slate-600 capitalize">{value}</span>
                )}
              />
              <Bar
                dataKey="revenue"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expenses"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
