'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Settings, X, RotateCcw } from 'lucide-react';
import { cn } from '@finmatrix/ui';
import type { WidgetId, WidgetConfig } from '@finmatrix/db/types';

interface WidgetGridProps {
  children: React.ReactNode;
  widgetConfigs: WidgetConfig[];
  onConfigChange: (configs: WidgetConfig[]) => void;
  isCustomizing: boolean;
  onCustomizingChange: (customizing: boolean) => void;
}

interface SortableWidgetWrapperProps {
  id: string;
  children: React.ReactNode;
  isCustomizing: boolean;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const WIDGET_LABELS: Record<WidgetId, string> = {
  'cash-balance': 'Cash Balance',
  'accounts-receivable': 'Accounts Receivable',
  'accounts-payable': 'Accounts Payable',
  'net-income': 'Net Income MTD',
  'active-customers': 'Active Customers',
  'open-invoices': 'Open Invoices',
  'ar-aging': 'AR Aging Chart',
  'ap-aging': 'AP Aging Chart',
  'revenue-expenses': 'Revenue vs Expenses',
  'profit-margin': 'Profit Margin Trend',
  'cash-flow': 'Cash Flow Forecast',
  'gst-summary': 'GST/Tax Summary',
  'top-customers': 'Top Customers',
  'action-items': 'Action Items',
};

function SortableWidgetWrapper({ 
  id, 
  children, 
  isCustomizing, 
  isVisible,
  onToggleVisibility 
}: SortableWidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isCustomizing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isVisible && !isCustomizing) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isCustomizing && 'ring-2 ring-dashed ring-slate-300 rounded-2xl',
        !isVisible && isCustomizing && 'opacity-50'
      )}
    >
      {isCustomizing && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm">
          <button
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab hover:bg-slate-100 rounded transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
          </button>
          <span className="text-xs font-medium text-slate-600 px-1">
            {WIDGET_LABELS[id as WidgetId] || id}
          </span>
          <button
            onClick={onToggleVisibility}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title={isVisible ? 'Hide widget' : 'Show widget'}
          >
            {isVisible ? (
              <Eye className="h-4 w-4 text-slate-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export function WidgetGrid({
  children,
  widgetConfigs,
  onConfigChange,
  isCustomizing,
  onCustomizingChange,
}: WidgetGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgetConfigs.findIndex((w) => w.id === active.id);
      const newIndex = widgetConfigs.findIndex((w) => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newConfigs = arrayMove(widgetConfigs, oldIndex, newIndex).map(
          (config: WidgetConfig, index: number) => ({ ...config, order: index })
        );
        onConfigChange(newConfigs);
      }
    }
  };

  const toggleWidgetVisibility = useCallback(
    (widgetId: WidgetId) => {
      const newConfigs = widgetConfigs.map((config) =>
        config.id === widgetId ? { ...config, visible: !config.visible } : config
      );
      onConfigChange(newConfigs);
    },
    [widgetConfigs, onConfigChange]
  );

  const resetToDefault = useCallback(() => {
    const defaultConfigs: WidgetConfig[] = [
      { id: 'cash-balance', visible: true, order: 0, row: 1 },
      { id: 'accounts-receivable', visible: true, order: 1, row: 1 },
      { id: 'accounts-payable', visible: true, order: 2, row: 1 },
      { id: 'net-income', visible: true, order: 3, row: 1 },
      { id: 'active-customers', visible: true, order: 4, row: 1 },
      { id: 'open-invoices', visible: true, order: 5, row: 1 },
      { id: 'ar-aging', visible: true, order: 0, row: 2 },
      { id: 'ap-aging', visible: true, order: 1, row: 2 },
      { id: 'revenue-expenses', visible: true, order: 0, row: 3 },
      { id: 'profit-margin', visible: true, order: 1, row: 3 },
      { id: 'cash-flow', visible: true, order: 0, row: 4 },
      { id: 'gst-summary', visible: true, order: 1, row: 4 },
      { id: 'top-customers', visible: true, order: 0, row: 5 },
      { id: 'action-items', visible: true, order: 1, row: 5 },
    ];
    onConfigChange(defaultConfigs);
  }, [onConfigChange]);

  if (!isCustomizing) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Customization Toolbar */}
      <div className="sticky top-0 z-20 mb-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Customize Dashboard</h3>
              <p className="text-sm text-slate-600">
                Drag widgets to reorder, click eye icon to show/hide
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={() => onCustomizingChange(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Done
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgetConfigs.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
        <DragOverlay>
          {activeId && (
            <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-xl opacity-90 p-4">
              <p className="text-sm font-medium text-slate-600">
                {WIDGET_LABELS[activeId as WidgetId] || activeId}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export { SortableWidgetWrapper, WIDGET_LABELS };
