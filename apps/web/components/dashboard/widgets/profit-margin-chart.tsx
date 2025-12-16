'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MarginData {
  month: string;
  grossMargin: number;
  netMargin: number;
}

interface ProfitMarginChartProps {
  data: MarginData[];
  title?: string;
}

export function ProfitMarginChart({ data, title = 'Profit Margin Trend' }: ProfitMarginChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-800 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">Gross Margin:</span>
              <span className="text-sm font-medium text-slate-800">
                {payload[0].value.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="text-sm text-slate-600">Net Margin:</span>
              <span className="text-sm font-medium text-slate-800">
                {payload[1].value.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate average margins
  const avgGross = data.reduce((sum, item) => sum + item.grossMargin, 0) / data.length;
  const avgNet = data.reduce((sum, item) => sum + item.netMargin, 0) / data.length;

  return (
    <Card className="border-slate-200/80 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500">Avg Gross</p>
              <p className="text-sm font-semibold text-blue-600">{avgGross.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Avg Net</p>
              <p className="text-sm font-semibold text-teal-600">{avgNet.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <LineChart data={data}>
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
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => (
                  <span className="text-sm text-slate-600">
                    {value === 'grossMargin' ? 'Gross Margin' : 'Net Margin'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="grossMargin"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="netMargin"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ fill: '#0d9488', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
