'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
} from '@finmatrix/ui';
import {
  Building2,
  FileText,
  Receipt,
  Calculator,
  Settings,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  FileCheck,
  Banknote,
  BarChart3,
  Shield,
} from 'lucide-react';
import {
  fetchFbrComplianceSummary,
  fetchComplianceCalendar,
  fetchOpenFilingPeriods,
} from '@/actions/fbr';

export default function FbrCompliancePage() {
  const [complianceSummary, setComplianceSummary] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [openPeriods, setOpenPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryResult, calendarResult, periodsResult] = await Promise.all([
        fetchFbrComplianceSummary(),
        fetchComplianceCalendar(new Date().getFullYear()),
        fetchOpenFilingPeriods(),
      ]);

      if (summaryResult.success) {
        setComplianceSummary(summaryResult.data);
      }
      if (calendarResult.success) {
        setCalendar(calendarResult.data || []);
      }
      if (periodsResult.success) {
        setOpenPeriods(periodsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading FBR data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'warning':
        return 'bg-orange-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const navigationCards = [
    {
      title: 'GST Configuration',
      description: 'Configure tax rates, NTN/STRN registration, and filing periods',
      icon: Settings,
      href: '/fbr/config',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Form A - Sales Tax Return',
      description: 'Prepare and file monthly GST return for output tax',
      icon: FileText,
      href: '/fbr/form-a',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Form B - Input Tax Claim',
      description: 'Claim input tax credit on purchases and imports',
      icon: Receipt,
      href: '/fbr/form-b',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'GST Reconciliation',
      description: 'Reconcile output and input tax, calculate net payable',
      icon: Calculator,
      href: '/fbr/reconciliation',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Tax Reports',
      description: 'Withholding tax, compliance reports, and analytics',
      icon: BarChart3,
      href: '/fbr/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  const upcomingDeadlines = calendar
    .filter((item) => item.status === 'pending')
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading FBR Compliance Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            FBR Compliance Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Pakistan Federal Board of Revenue - GST & Tax Compliance Management
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/fbr/config">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </Link>
        </div>
      </div>

      {/* Compliance Status Banner */}
      {complianceSummary && (
        <Card className={`border-l-4 ${
          complianceSummary.complianceStatus === 'compliant' ? 'border-l-green-500' :
          complianceSummary.complianceStatus === 'pending' ? 'border-l-yellow-500' :
          complianceSummary.complianceStatus === 'warning' ? 'border-l-orange-500' :
          'border-l-red-500'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${getStatusColor(complianceSummary.complianceStatus)} bg-opacity-10`}>
                  {complianceSummary.complianceStatus === 'compliant' ? (
                    <CheckCircle2 className={`h-6 w-6 ${getStatusColor(complianceSummary.complianceStatus).replace('bg-', 'text-')}`} />
                  ) : complianceSummary.complianceStatus === 'overdue' ? (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  ) : (
                    <Clock className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Current Period: {complianceSummary.currentPeriod?.name}</h3>
                    {getStatusBadge(complianceSummary.complianceStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Due Date: {complianceSummary.currentPeriod?.dueDate} • 
                    {complianceSummary.currentPeriod?.daysRemaining > 0 
                      ? ` ${complianceSummary.currentPeriod?.daysRemaining} days remaining`
                      : ` ${Math.abs(complianceSummary.currentPeriod?.daysRemaining || 0)} days overdue`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Net Tax Payable</p>
                <p className="text-2xl font-bold">
                  PKR {(complianceSummary.netPayable || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Output Tax (Form A)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  PKR {(complianceSummary?.outputTax?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {complianceSummary?.outputTax?.filed ? 'Filed' : 'Pending'}
                </p>
              </div>
              {complianceSummary?.outputTax?.filed ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Clock className="h-8 w-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Input Tax (Form B)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  PKR {(complianceSummary?.inputTax?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {complianceSummary?.inputTax?.claimed ? 'Claimed' : 'Pending'}
                </p>
              </div>
              {complianceSummary?.inputTax?.claimed ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Clock className="h-8 w-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{complianceSummary?.pendingFilings || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {complianceSummary?.pendingFilings === 0 ? 'All caught up!' : 'Needs attention'}
                </p>
              </div>
              {complianceSummary?.pendingFilings === 0 ? (
                <Shield className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Withholding Tax Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  PKR {(complianceSummary?.withholdingTaxDue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">To be deposited</p>
              </div>
              <Banknote className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{card.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>{card.description}</CardDescription>
                  <div className="flex items-center text-primary text-sm mt-3">
                    Open <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>
              Tax filing and payment deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming deadlines</p>
                <p className="text-sm">Generate filing periods to see deadlines</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.map((item) => {
                  const dueDate = new Date(item.dueDate);
                  const today = new Date();
                  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          daysUntil <= 3 ? 'bg-red-100' :
                          daysUntil <= 7 ? 'bg-orange-100' :
                          'bg-blue-100'
                        }`}>
                          {item.type === 'gst_return' ? (
                            <FileCheck className={`h-4 w-4 ${
                              daysUntil <= 3 ? 'text-red-600' :
                              daysUntil <= 7 ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                          ) : (
                            <Banknote className={`h-4 w-4 ${
                              daysUntil <= 3 ? 'text-red-600' :
                              daysUntil <= 7 ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          daysUntil <= 3 ? 'text-red-600' :
                          daysUntil <= 7 ? 'text-orange-600' :
                          'text-muted-foreground'
                        }`}>
                          {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.dueDate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Filing Periods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Open Filing Periods
            </CardTitle>
            <CardDescription>
              Periods that require tax return filing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {openPeriods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No open filing periods</p>
                <p className="text-sm">All periods are closed or not yet created</p>
                <Link href="/fbr/config">
                  <Button variant="outline" size="sm" className="mt-4">
                    Generate Periods
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {openPeriods.slice(0, 5).map((period) => {
                  const dueDate = new Date(period.dueDate);
                  const today = new Date();
                  const isOverdue = dueDate < today;

                  return (
                    <div
                      key={period.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{period.periodName}</p>
                        <p className="text-xs text-muted-foreground">
                          {period.startDate} to {period.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">Open</Badge>
                        )}
                        <Link href={`/fbr/form-a?period=${period.id}`}>
                          <Button size="sm" variant="outline">
                            File Return
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pakistan Tax Rates Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pakistan Tax Rates Quick Reference
          </CardTitle>
          <CardDescription>
            Standard FBR tax rates for Pakistan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-green-700">Standard GST</h4>
              <p className="text-3xl font-bold">17%</p>
              <p className="text-xs text-muted-foreground">General Sales Tax on goods & services</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-blue-700">Further Tax</h4>
              <p className="text-3xl font-bold">3%</p>
              <p className="text-xs text-muted-foreground">On supplies to unregistered persons</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-purple-700">WHT (Filer)</h4>
              <p className="text-3xl font-bold">4.5%</p>
              <p className="text-xs text-muted-foreground">Withholding on supplies (153(1)(a))</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-orange-700">WHT (Non-Filer)</h4>
              <p className="text-3xl font-bold">9%</p>
              <p className="text-xs text-muted-foreground">Withholding on supplies (153(1)(a))</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
