'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  type?: 'ar' | 'ap'; // Type of aging chart for navigation
  baseUrl?: string; // Base URL for navigation (e.g., '/dashboard/reports/ar-aging')
  onBucketClick?: (bucket: string, index: number) => void; // Custom click handler
}

const COLORS_BLUE = ['#16a34a', '#3b82f6', '#f59e0b', '#f97316', '#dc2626'];
const COLORS_AMBER = ['#16a34a', '#0d9488', '#eab308', '#f97316', '#dc2626'];

// Map bucket names to URL-friendly filter params
const BUCKET_FILTERS: Record<string, string> = {
  'Current': 'current',
  '1-30 Days': '1-30',
  '31-60 Days': '31-60',
  '61-90 Days': '61-90',
  '90+ Days': '90-plus',
};

export function AgingChart({ 
  title, 
  data, 
  total, 
  subtitle, 
  colorScheme = 'blue',
  type = 'ar',
  baseUrl,
  onBucketClick,
}: AgingChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();
  const colors = colorScheme === 'blue' ? COLORS_BLUE : COLORS_AMBER;

  // Determine the base URL for navigation
  const getReportUrl = () => {
    if (baseUrl) return baseUrl;
    return type === 'ar' 
      ? '/dashboard/reports/ar-aging' 
      : '/dashboard/reports/ap-aging';
  };

  // Handle bucket click - navigate to filtered report
  const handleBucketClick = (bucketName: string, index: number) => {
    // Call custom handler if provided
    if (onBucketClick) {
      onBucketClick(bucketName, index);
      return;
    }

    // Default behavior: navigate to aging report with filter
    const filter = BUCKET_FILTERS[bucketName] || bucketName.toLowerCase().replace(/\s+/g, '-');
    const url = `${getReportUrl()}?bucket=${filter}`;
    router.push(url);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-800">{payload[0].name}</p>
          <p className="text-sm text-slate-600">PKR {payload[0].value.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">Click to view details</p>
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
                  onClick={(_, index) => handleBucketClick(data[index].name, index)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                      style={{ outline: 'none' }}
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
                onClick={() => handleBucketClick(item.name, index)}
                title={`Click to view ${item.name} details`}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="flex-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">{item.name}</span>
                <span className="text-sm font-medium text-slate-800">
                  PKR {item.value.toLocaleString()}
                </span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
