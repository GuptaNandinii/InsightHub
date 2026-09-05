import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  Settings,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Card } from '../common/Card';
import { ChartRenderer } from '../charts/ChartRenderer';
import { DashboardWidget } from '../../types';
import { datasetApi } from '../../api/endpoints';

interface WidgetCardProps {
  widget: DashboardWidget;
  isEditable?: boolean;
  onEdit?: (widget: DashboardWidget) => void;
  onDelete?: (widgetId: string) => void;
  onMove?: (widgetId: string, direction: 'left' | 'right') => void;
  onToggleWidth?: (widgetId: string) => void;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  isEditable = true,
  onEdit,
  onDelete,
  onMove,
  onToggleWidth,
}) => {
  const [data, setData] = useState<any[]>(widget.chartData || []);
  const [isLoading, setIsLoading] = useState<boolean>(!widget.chartData);

  const fetchWidgetData = async () => {
    try {
      setIsLoading(true);
      const res = await datasetApi.queryChartData(widget.datasetId, {
        xAxis: widget.xAxis,
        yAxis: widget.yAxis || undefined,
        aggregation: widget.aggregation !== 'none' ? widget.aggregation : undefined,
        chartType: widget.chartType,
        filterField: widget.filterField,
        filterValue: widget.filterValue,
        limit: 20,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load widget data', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!widget.chartData || widget.chartData.length === 0) {
      fetchWidgetData();
    } else {
      setData(widget.chartData);
    }
  }, [widget]);

  // Col span styling
  const colSpanClass =
    widget.w === 3
      ? 'col-span-1 md:col-span-3'
      : widget.w === 2
      ? 'col-span-1 md:col-span-2'
      : 'col-span-1';

  return (
    <Card className={`${colSpanClass} flex flex-col justify-between p-5 overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {widget.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Database className="h-3 w-3" />
              {widget.datasetName || 'Dataset'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {widget.aggregation !== 'none' ? `${widget.aggregation}(${widget.yAxis || 'rows'})` : 'raw'}
            </span>
          </div>
        </div>

        {/* Toolbar controls */}
        {isEditable && (
          <div className="flex items-center gap-1">
            <button
              onClick={fetchWidgetData}
              title="Refresh widget data"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onMove && (
              <>
                <button
                  onClick={() => onMove(widget.id, 'left')}
                  title="Move left/up"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onMove(widget.id, 'right')}
                  title="Move right/down"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            {onToggleWidth && (
              <button
                onClick={() => onToggleWidth(widget.id)}
                title={widget.w === 3 ? 'Compact width' : 'Expand width'}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {widget.w === 3 ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(widget)}
                title="Edit chart settings"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(widget.id)}
                title="Remove widget"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 flex items-center justify-center pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-xs text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-500 mb-2" />
            Loading chart data...
          </div>
        ) : (
          <ChartRenderer
            chartType={widget.chartType}
            data={data}
            colorPalette={widget.colorPalette}
            height={260}
          />
        )}
      </div>
    </Card>
  );
};
