import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Share2,
  Check,
  Globe,
  Lock,
  BarChart2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { WidgetCard } from '../components/dashboards/WidgetCard';
import { ChartBuilderModal } from '../components/charts/ChartBuilderModal';
import { ShareModal } from '../components/dashboards/ShareModal';
import { EmptyState } from '../components/common/EmptyState';
import { Dashboard, DashboardWidget, Dataset } from '../types';
import { dashboardApi, datasetApi } from '../api/endpoints';

export const DashboardBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  // Modals state
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Load dashboard & datasets
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [dashData, dsData] = await Promise.all([
          dashboardApi.getById(id),
          datasetApi.getAll(),
        ]);
        setDashboard(dashData);
        setDatasets(dsData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Persist dashboard changes
  const saveDashboard = async (updatedWidgets?: DashboardWidget[], newTitle?: string, newDesc?: string) => {
    if (!dashboard) return;
    try {
      setIsSaving(true);
      const res = await dashboardApi.update(dashboard._id, {
        title: newTitle ?? dashboard.title,
        description: newDesc ?? dashboard.description,
        widgets: updatedWidgets ?? dashboard.widgets,
      });
      setDashboard(res);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    } catch (err) {
      console.error('Failed to save dashboard', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOrUpdateWidget = (widget: DashboardWidget) => {
    if (!dashboard) return;
    let newWidgets = [...dashboard.widgets];
    const existingIdx = newWidgets.findIndex((w) => w.id === widget.id);

    if (existingIdx >= 0) {
      newWidgets[existingIdx] = widget;
    } else {
      newWidgets.push(widget);
    }

    setDashboard({ ...dashboard, widgets: newWidgets });
    saveDashboard(newWidgets);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    const newWidgets = dashboard.widgets.filter((w) => w.id !== widgetId);
    setDashboard({ ...dashboard, widgets: newWidgets });
    saveDashboard(newWidgets);
  };

  const handleMoveWidget = (widgetId: string, direction: 'left' | 'right') => {
    if (!dashboard) return;
    const idx = dashboard.widgets.findIndex((w) => w.id === widgetId);
    if (idx === -1) return;

    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= dashboard.widgets.length) return;

    const newWidgets = [...dashboard.widgets];
    const [moved] = newWidgets.splice(idx, 1);
    newWidgets.splice(targetIdx, 0, moved);

    setDashboard({ ...dashboard, widgets: newWidgets });
    saveDashboard(newWidgets);
  };

  const handleToggleWidgetWidth = (widgetId: string) => {
    if (!dashboard) return;
    const newWidgets = dashboard.widgets.map((w) => {
      if (w.id === widgetId) {
        const nextW = w.w === 1 ? 2 : w.w === 2 ? 3 : 1;
        return { ...w, w: nextW };
      }
      return w;
    });

    setDashboard({ ...dashboard, widgets: newWidgets });
    saveDashboard(newWidgets);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 col-span-2 rounded-2xl" />
          <Skeleton className="h-80 col-span-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-slate-500">Dashboard not found.</p>
        <Button onClick={() => navigate('/dashboards')}>Back to Dashboards</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboards"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <input
              type="text"
              value={dashboard.title}
              onChange={(e) => setDashboard({ ...dashboard, title: e.target.value })}
              onBlur={() => saveDashboard(undefined, dashboard.title)}
              className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 rounded transition-colors"
            />
            <Badge variant={dashboard.isPublic ? 'emerald' : 'slate'} size="sm">
              <span className="flex items-center gap-1">
                {dashboard.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {dashboard.isPublic ? 'Public' : 'Private'}
              </span>
            </Badge>
          </div>

          <input
            type="text"
            value={dashboard.description || ''}
            placeholder="Add an optional dashboard description..."
            onChange={(e) => setDashboard({ ...dashboard, description: e.target.value })}
            onBlur={() => saveDashboard(undefined, undefined, dashboard.description)}
            className="text-xs text-slate-500 dark:text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 w-full max-w-xl transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Saved Status Feedback */}
          {isSaving && (
            <span className="text-xs text-slate-400 animate-pulse">
              Saving...
            </span>
          )}
          {isSavedRecently && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Share2 className="h-3.5 w-3.5" />}
          >
            Share
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingWidget(null);
              setIsChartModalOpen(true);
            }}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Chart
          </Button>
        </div>
      </div>

      {/* Grid of Interactive Chart Widgets */}
      {dashboard.widgets.length === 0 ? (
        <EmptyState
          icon={<BarChart2 className="h-8 w-8 text-indigo-500" />}
          title="No charts added yet"
          description="Click 'Add Chart' to select a dataset, choose a chart type (Bar, Line, Area, Pie, Scatter), and start visualizing insights."
          action={
            <Button
              onClick={() => {
                setEditingWidget(null);
                setIsChartModalOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Your First Chart
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboard.widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              isEditable={true}
              onEdit={(w) => {
                setEditingWidget(w);
                setIsChartModalOpen(true);
              }}
              onDelete={handleDeleteWidget}
              onMove={handleMoveWidget}
              onToggleWidth={handleToggleWidgetWidth}
            />
          ))}
        </div>
      )}

      {/* Chart Builder Modal */}
      <ChartBuilderModal
        isOpen={isChartModalOpen}
        onClose={() => {
          setIsChartModalOpen(false);
          setEditingWidget(null);
        }}
        datasets={datasets}
        initialWidget={editingWidget}
        onSaveWidget={handleAddOrUpdateWidget}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        dashboard={dashboard}
        onUpdate={(updated) => setDashboard(updated)}
      />
    </div>
  );
};
