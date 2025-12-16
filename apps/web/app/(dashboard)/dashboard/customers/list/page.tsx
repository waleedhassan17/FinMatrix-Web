'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Mail,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@finmatrix/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@finmatrix/ui/components/card';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@finmatrix/ui/components/dropdown-menu';
import { Badge } from '@finmatrix/ui/components/badge';
import { fetchCustomers } from '@/actions/ar';
import type { CustomerListItem, CustomerFilters, PaginatedResult } from '@finmatrix/db';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function CustomerListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [customers, setCustomers] = useState<PaginatedResult<CustomerListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({
    isActive: true,
    sortBy: 'companyName',
    sortOrder: 'asc',
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchCustomers(
        { ...filters, search: searchTerm || undefined },
        { page, pageSize }
      );
      if (result.success && result.data) {
        setCustomers(result.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm, page, pageSize]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/customers" 
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">All Customers</h1>
              <p className="mt-1 text-sm text-slate-500">
                {customers?.total || 0} customers total
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filters.isActive === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('isActive', true)}
            >
              Active
            </Button>
            <Button
              variant={filters.isActive === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('isActive', false)}
            >
              Inactive
            </Button>
            <Button
              variant={filters.isActive === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('isActive', undefined)}
            >
              All
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filters.hasBalance ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('hasBalance', !filters.hasBalance)}
            >
              With Balance
            </Button>
            <Button
              variant={filters.isOverdue ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('isOverdue', !filters.isOverdue)}
              className={filters.isOverdue ? 'bg-rose-600 hover:bg-rose-700' : ''}
            >
              Overdue
            </Button>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : customers?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/customers/new">
                <Plus className="h-4 w-4 mr-2" />
                Add First Customer
              </Link>
            </Button>
          </div>
        ) : (
          <div className="p-6">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Credit Limit
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers?.data.map((customer) => {
                      const balance = parseFloat(customer.currentBalance);
                      const overdue = parseFloat(customer.overdueBalance);
                      const creditLimit = parseFloat(customer.creditLimit);
                      const isOverLimit = creditLimit > 0 && balance > creditLimit;

                      return (
                        <tr 
                          key={customer.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">
                                  {customer.companyName}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {customer.customerNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              {customer.contactName && (
                                <div className="text-slate-900">{customer.contactName}</div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className={cn(
                              'font-medium',
                              balance > 0 ? 'text-slate-900' : 'text-slate-400'
                            )}>
                              {formatCurrency(balance)}
                            </div>
                            {overdue > 0 && (
                              <div className="text-sm text-rose-600">
                                {formatCurrency(overdue)} overdue
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={cn(
                              creditLimit > 0 ? 'text-slate-900' : 'text-slate-400'
                            )}>
                              {creditLimit > 0 ? formatCurrency(creditLimit) : 'No limit'}
                            </span>
                            {isOverLimit && (
                              <div className="text-xs text-rose-600 flex items-center justify-end gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Over limit
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                              {customer.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/customers/${customer.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/customers/${customer.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/invoices/new?customerId=${customer.id}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Create Invoice
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {customers && customers.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <div className="text-sm text-slate-500">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, customers.total)} of {customers.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {page} of {customers.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === customers.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
