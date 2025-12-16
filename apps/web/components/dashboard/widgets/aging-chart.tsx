'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface AgingData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface AgingChartProps {
  title: string;
  data: AgingData[];
  total: string;
  subtitle?: string;
  colorScheme?: 'blue' | 'amber';
}

const COLORS_BLUE = ['#16a34a', '#3b82f6', '#f59e0b', '#f97316', '#dc2626'];
const COLORS_AMBER = ['#16a34a', '#0d9488', '#eab308', '#f97316', '#dc2626'];

export function AgingChart({ title, data, total, subtitle, colorScheme = 'blue' }: AgingChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const colors = colorScheme === 'blue' ? COLORS_BLUE : COLORS_AMBER;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-800">{payload[0].name}</p>
          <p className="text-sm text-slate-600">PKR {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 h-full rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative w-40 h-40 min-w-[160px] min-h-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={140} minHeight={140}>
              <PieChart>
                <Pie
                  data={data as any}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                      className="cursor-pointer transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                  activeIndex === index ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="flex-1 text-sm text-slate-600">{item.name}</span>
                <span className="text-sm font-medium text-slate-800">
                  PKR {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
