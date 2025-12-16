'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@finmatrix/ui';
import { Button } from '@finmatrix/ui';
import { Input } from '@finmatrix/ui';
import { Badge } from '@finmatrix/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@finmatrix/ui';
import { Plus, Search, Filter, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { fetchVendors } from '@/actions/ap';
import type { VendorListItem } from '@finmatrix/db';

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function VendorListPage() {
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      setIsLoading(true);
      try {
        const data = await fetchVendors({
          search: searchQuery || undefined,
          isActive: showActiveOnly ? true : undefined,
        });
        setVendors(data);
      } catch (error) {
        console.error('Error loading vendors:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadVendors();
  }, [searchQuery, showActiveOnly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Directory</h1>
            <p className="text-muted-foreground">
              Manage your suppliers and vendors
            </p>
          </div>
        </div>
        <Link href="/dashboard/vendors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showActiveOnly ? 'default' : 'outline'}
                onClick={() => setShowActiveOnly(true)}
              >
                Active Only
              </Button>
              <Button
                variant={!showActiveOnly ? 'default' : 'outline'}
                onClick={() => setShowActiveOnly(false)}
              >
                All Vendors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({vendors.length})</CardTitle>
          <CardDescription>
            Click on a vendor to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No vendors found</p>
              <Link href="/dashboard/vendors/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Vendor
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/dashboard/vendors/${vendor.id}`}
                        className="block"
                      >
                        <div className="font-medium hover:underline">
                          {vendor.companyName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vendor.vendorNumber}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {vendor.contactName && (
                          <div className="text-sm">{vendor.contactName}</div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor.city && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {vendor.city}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          parseFloat(vendor.outstandingBalance) > 0
                            ? 'font-medium text-orange-600'
                            : ''
                        }
                      >
                        {formatCurrency(vendor.outstandingBalance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
