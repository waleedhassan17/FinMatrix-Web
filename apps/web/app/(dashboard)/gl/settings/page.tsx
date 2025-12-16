'use client';

// GL Settings Page
// Manage Fiscal Periods and Departments

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Settings,
  Calendar,
  Building2,
  Plus,
  Edit,
  Lock,
  ArrowLeft,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@finmatrix/ui/components/button';
import { Input } from '@finmatrix/ui/components/input';
import { Label } from '@finmatrix/ui/components/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@finmatrix/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@finmatrix/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@finmatrix/ui/components/select';
import {
  fetchFiscalPeriods,
  fetchDepartments,
  createFiscalPeriodAction,
  closeFiscalPeriodAction,
  createDepartmentAction,
  updateDepartmentAction,
} from '@/actions/gl';
import type { FiscalPeriod as FiscalPeriodSchema, Department as DepartmentSchema } from '@finmatrix/db/types';

// Use simplified types for UI state
interface FiscalPeriodUI {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  fiscalYear: number;
  period: number;
}

interface DepartmentUI {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export default function GLSettingsPage() {
  const [activeTab, setActiveTab] = useState<'fiscal-periods' | 'departments'>('fiscal-periods');
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriodUI[]>([]);
  const [departments, setDepartments] = useState<DepartmentUI[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentUI | null>(null);
  
  // Form states
  const [periodForm, setPeriodForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    year: new Date().getFullYear(),
  });
  const [departmentForm, setDepartmentForm] = useState({
    code: '',
    name: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [periodsResult, deptsResult] = await Promise.all([
        fetchFiscalPeriods(),
        fetchDepartments(),
      ]);
      
      if (periodsResult.success && periodsResult.data) {
        setFiscalPeriods(periodsResult.data.map((p: FiscalPeriodSchema) => ({
          id: p.id,
          name: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          isClosed: p.isClosed,
          fiscalYear: p.fiscalYear,
          period: p.period,
        })));
      }
      if (deptsResult.success && deptsResult.data) {
        setDepartments(deptsResult.data.map((d: DepartmentSchema) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          isActive: d.isActive,
        })));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePeriod() {
    setSaving(true);
    try {
      const result = await createFiscalPeriodAction({
        name: periodForm.name,
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
        fiscalYear: periodForm.year,
        period: 1, // Will be auto-determined based on date
      });
      
      if (result.success) {
        setShowPeriodDialog(false);
        setPeriodForm({
          name: '',
          startDate: '',
          endDate: '',
          year: new Date().getFullYear(),
        });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create period:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleClosePeriod(periodId: string) {
    if (!confirm('Are you sure you want to close this period? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await closeFiscalPeriodAction(periodId);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to close period:', error);
    }
  }

  async function handleSaveDepartment() {
    setSaving(true);
    try {
      if (editingDepartment) {
        const result = await updateDepartmentAction(editingDepartment.id, {
          code: departmentForm.code,
          name: departmentForm.name,
        });
        if (result.success) {
          setShowDepartmentDialog(false);
          setEditingDepartment(null);
          setDepartmentForm({ code: '', name: '' });
          loadData();
        }
      } else {
        const result = await createDepartmentAction({
          code: departmentForm.code,
          name: departmentForm.name,
        });
        if (result.success) {
          setShowDepartmentDialog(false);
          setDepartmentForm({ code: '', name: '' });
          loadData();
        }
      }
    } catch (error) {
      console.error('Failed to save department:', error);
    } finally {
      setSaving(false);
    }
  }

  function openEditDepartment(dept: DepartmentUI) {
    setEditingDepartment(dept);
    setDepartmentForm({ code: dept.code, name: dept.name });
    setShowDepartmentDialog(true);
  }

  function getStatusBadge(isClosed: boolean) {
    if (isClosed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Lock className="h-3 w-3 mr-1" />
          Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <Check className="h-3 w-3 mr-1" />
        Open
      </span>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">GL Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage fiscal periods and departments
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'fiscal-periods' ? 'default' : 'outline'}
              onClick={() => setActiveTab('fiscal-periods')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Fiscal Periods
            </Button>
            <Button
              variant={activeTab === 'departments' ? 'default' : 'outline'}
              onClick={() => setActiveTab('departments')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Departments
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                <p className="mt-2 text-slate-500">Loading...</p>
              </CardContent>
            </Card>
          ) : activeTab === 'fiscal-periods' ? (
            /* Fiscal Periods Tab */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fiscal Periods</CardTitle>
                    <CardDescription>
                      Manage accounting periods for financial reporting
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowPeriodDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fiscalPeriods.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No fiscal periods defined</p>
                    <p className="text-sm mt-1">Create your first fiscal period to get started</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {fiscalPeriods.map((period) => (
                      <div
                        key={period.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{period.name}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(period.startDate), 'MMM d, yyyy')} -{' '}
                            {format(new Date(period.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(period.isClosed)}
                          {!period.isClosed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClosePeriod(period.id)}
                            >
                              Close Period
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Departments Tab */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>
                      Manage organizational units for cost tracking
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingDepartment(null);
                    setDepartmentForm({ code: '', name: '' });
                    setShowDepartmentDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No departments defined</p>
                    <p className="text-sm mt-1">Create departments for cost tracking</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{dept.name}</p>
                          <p className="text-sm text-slate-500">Code: {dept.code}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {dept.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              Inactive
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDepartment(dept)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Fiscal Period Dialog */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fiscal Period</DialogTitle>
            <DialogDescription>
              Define a new accounting period for your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodName">Period Name</Label>
              <Input
                id="periodName"
                placeholder="e.g., Q1 2024, January 2024"
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Fiscal Year</Label>
              <Input
                id="year"
                type="number"
                value={periodForm.year}
                onChange={(e) => setPeriodForm({ ...periodForm, year: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePeriod} disabled={saving || !periodForm.name || !periodForm.startDate || !periodForm.endDate}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Department Dialog */}
      <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Create Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? 'Update department information'
                : 'Add a new department for cost tracking'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deptCode">Department Code</Label>
              <Input
                id="deptCode"
                placeholder="e.g., FIN, HR, OPS"
                value={departmentForm.code}
                onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                maxLength={10}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deptName">Department Name</Label>
              <Input
                id="deptName"
                placeholder="e.g., Finance, Human Resources"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDepartment}
              disabled={saving || !departmentForm.code || !departmentForm.name}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDepartment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
