'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Customer {
  name: string;
  revenue: number;
  change: number;
  invoiceCount: number;
}

interface TopCustomersProps {
  customers: Customer[];
  title?: string;
  period?: string;
}

export function TopCustomers({ customers, title = 'Top Customers', period = 'This Month' }: TopCustomersProps) {
  const chartData = customers.slice(0, 5).map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    revenue: c.revenue,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-800">{payload[0].payload.name}</p>
          <p className="text-sm text-teal-600">PKR {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 h-full rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
            <p className="text-sm text-slate-500">{period}</p>
          </div>
          <Link
            href="/dashboard/customers"
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-40 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                fill="#0d9488"
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {customers.slice(0, 5).map((customer, index) => (
            <div
              key={customer.name}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.invoiceCount} invoices</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">
                  PKR {customer.revenue.toLocaleString()}
                </p>
                <div className={`flex items-center gap-1 text-xs ${customer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {customer.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{customer.change >= 0 ? '+' : ''}{customer.change}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
