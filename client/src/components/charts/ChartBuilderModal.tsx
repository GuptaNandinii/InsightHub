import React, { useState, useEffect } from 'react';
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart,
  ScatterChart,
  Check,
  Eye,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ChartRenderer } from './ChartRenderer';
import {
  ChartType,
  AggregationType,
  ColorPalette,
  DashboardWidget,
  Dataset,
} from '../../types';
import { datasetApi } from '../../api/endpoints';

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: Dataset[];
  onSaveWidget: (widget: DashboardWidget) => void;
  initialWidget?: DashboardWidget | null;
}

export const ChartBuilderModal: React.FC<ChartBuilderModalProps> = ({
  isOpen,
  onClose,
  datasets,
  onSaveWidget,
  initialWidget,
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [title, setTitle] = useState<string>('New Metric');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [colorPalette, setColorPalette] = useState<ColorPalette>('indigo');
  const [colSpan, setColSpan] = useState<number>(2);

  // Live preview state
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Initialize from props or default to first dataset
  useEffect(() => {
    if (initialWidget) {
      setSelectedDatasetId(initialWidget.datasetId);
      setTitle(initialWidget.title);
      setChartType(initialWidget.chartType);
      setXAxis(initialWidget.xAxis);
      setYAxis(initialWidget.yAxis || '');
      setAggregation(initialWidget.aggregation);
      setColorPalette(initialWidget.colorPalette);
      setColSpan(initialWidget.w || 2);
    } else if (datasets.length > 0) {
      const first = datasets[0];
      setSelectedDatasetId(first._id);
      setTitle('Performance Overview');
      if (first.columns.length > 0) {
        setXAxis(first.columns[0].name);
        const numCol = first.columns.find((c) => c.dataType === 'number');
        if (numCol) setYAxis(numCol.name);
      }
    }
  }, [initialWidget, datasets, isOpen]);

  const activeDataset = datasets.find((d) => d._id === selectedDatasetId);

  // Fetch live preview when dimensions change
  useEffect(() => {
    const fetchPreview = async () => {
      if (!selectedDatasetId || !xAxis) return;

      try {
        setIsPreviewLoading(true);
        const data = await datasetApi.queryChartData(selectedDatasetId, {
          xAxis,
          yAxis: yAxis || undefined,
          aggregation: aggregation !== 'none' ? aggregation : undefined,
          chartType,
          limit: 15,
        });
        setPreviewData(data);
      } catch (err) {
        console.error('Preview error', err);
        setPreviewData([]);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [selectedDatasetId, xAxis, yAxis, aggregation, chartType]);

  const handleSave = () => {
    if (!selectedDatasetId || !xAxis) return;

    const widget: DashboardWidget = {
      id: initialWidget ? initialWidget.id : `w-${Date.now()}`,
      title: title.trim() || 'Untitled Chart',
      chartType,
      datasetId: selectedDatasetId,
      xAxis,
      yAxis: yAxis || undefined,
      aggregation,
      colorPalette,
      w: colSpan,
      h: 1,
      x: initialWidget ? initialWidget.x : 0,
      y: initialWidget ? initialWidget.y : 0,
      chartData: previewData,
      datasetName: activeDataset?.name,
    };

    onSaveWidget(widget);
    onClose();
  };

  const chartTypes: { type: ChartType; label: string; icon: any }[] = [
    { type: 'bar', label: 'Bar', icon: <BarChart className="h-4 w-4" /> },
    { type: 'line', label: 'Line', icon: <LineChart className="h-4 w-4" /> },
    { type: 'area', label: 'Area', icon: <AreaChart className="h-4 w-4" /> },
    { type: 'pie', label: 'Pie/Donut', icon: <PieChart className="h-4 w-4" /> },
    { type: 'scatter', label: 'Scatter', icon: <ScatterChart className="h-4 w-4" /> },
  ];

  const palettes: { key: ColorPalette; name: string; color: string }[] = [
    { key: 'indigo', name: 'Indigo', color: '#6366f1' },
    { key: 'emerald', name: 'Emerald', color: '#10b981' },
    { key: 'ocean', name: 'Ocean', color: '#0ea5e9' },
    { key: 'sunset', name: 'Sunset', color: '#f97316' },
    { key: 'cyberpunk', name: 'Cyberpunk', color: '#ec4899' },
    { key: 'monochrome', name: 'Slate', color: '#64748b' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialWidget ? 'Edit Chart Widget' : 'Add Visualization to Dashboard'}
      description="Configure dataset dimensions, metric aggregations, and layout styling."
      maxWidth="4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="md:col-span-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Dataset Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Source Dataset *
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedDatasetId(id);
                const ds = datasets.find((d) => d._id === id);
                if (ds && ds.columns.length > 0) {
                  setXAxis(ds.columns[0].name);
                  const numCol = ds.columns.find((c) => c.dataType === 'number');
                  setYAxis(numCol ? numCol.name : '');
                }
              }}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {datasets.map((ds) => (
                <option key={ds._id} value={ds._id}>
                  {ds.name} ({ds.rowCount} rows)
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Chart Type *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {chartTypes.map((ct) => (
                <button
                  key={ct.type}
                  type="button"
                  onClick={() => setChartType(ct.type)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                    chartType === ct.type
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {ct.icon}
                  <span className="mt-1 text-[11px]">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Chart Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Revenue by Region"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Dimensions: X and Y Axes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                X-Axis / Category *
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {activeDataset?.columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.dataType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Y-Axis / Metric
              </label>
              <select
                value={yAxis}
                disabled={aggregation === 'count'}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">None (or Row Count)</option>
                {activeDataset?.columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.dataType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Aggregation & Width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Aggregation
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as AggregationType)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count (Frequency)</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
                <option value="none">Raw / None</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Widget Width
              </label>
              <select
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>Compact (1 Column)</option>
                <option value={2}>Standard (2 Columns)</option>
                <option value={3}>Full Width (3 Columns)</option>
              </select>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Color Palette
            </label>
            <div className="grid grid-cols-3 gap-2">
              {palettes.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setColorPalette(p.key)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                    colorPalette === p.key
                      ? 'border-indigo-600 dark:border-indigo-400 bg-slate-50 dark:bg-slate-800 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="md:col-span-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Preview
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {previewData.length} data points
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 min-h-[290px] flex items-center justify-center">
              {isPreviewLoading ? (
                <p className="text-xs text-slate-400 animate-pulse">
                  Querying preview data...
                </p>
              ) : (
                <ChartRenderer
                  chartType={chartType}
                  data={previewData}
                  colorPalette={colorPalette}
                  height={260}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              leftIcon={<Check className="h-4 w-4" />}
            >
              {initialWidget ? 'Save Changes' : 'Add to Dashboard'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
