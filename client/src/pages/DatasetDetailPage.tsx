import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Table,
  Columns,
  LineChart,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { DatasetTable } from '../components/datasets/DatasetTable';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { DataCleaningStudio } from '../components/datasets/DataCleaningStudio';
import { Dataset, ChartType, AggregationType } from '../types';
import { datasetApi } from '../api/endpoints';
import { formatFileSize, formatNumber } from '../utils/colors';

export const DatasetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'schema' | 'cleaning' | 'quickchart'>('preview');

  // Quick chart state
  const [quickX, setQuickX] = useState<string>('');
  const [quickY, setQuickY] = useState<string>('');
  const [quickChartType, setQuickChartType] = useState<ChartType>('bar');
  const [quickAgg, setQuickAgg] = useState<AggregationType>('sum');
  const [quickData, setQuickData] = useState<any[]>([]);
  const [isQuickLoading, setIsQuickLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDataset = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await datasetApi.getById(id);
        setDataset(res);
        if (res.columns.length > 0) {
          setQuickX(res.columns[0].name);
          const num = res.columns.find((c: any) => c.dataType === 'number');
          if (num) setQuickY(num.name);
        }
      } catch (err) {
        console.error('Failed to load dataset', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataset();
  }, [id]);

  // Load quick chart preview data
  useEffect(() => {
    const fetchQuickChart = async () => {
      if (!id || !quickX) return;
      try {
        setIsQuickLoading(true);
        const res = await datasetApi.queryChartData(id, {
          xAxis: quickX,
          yAxis: quickY || undefined,
          aggregation: quickAgg !== 'none' ? quickAgg : undefined,
          chartType: quickChartType,
          limit: 15,
        });
        setQuickData(res);
      } catch (err) {
        console.error('Quick chart error', err);
        setQuickData([]);
      } finally {
        setIsQuickLoading(false);
      }
    };

    if (activeTab === 'quickchart') {
      fetchQuickChart();
    }
  }, [id, quickX, quickY, quickAgg, quickChartType, activeTab]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Dataset not found.</p>
        <Button onClick={() => navigate('/datasets')} className="mt-4">
          Back to Datasets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/datasets"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {dataset.name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Original file: {dataset.originalFilename} • Ingested on{' '}
            {new Date(dataset.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/analytics?datasetId=${dataset._id}`)}
            leftIcon={<LineChart className="h-3.5 w-3.5" />}
          >
            Data Profiling & Stats
          </Button>
        </div>
      </div>

      {/* Dataset KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Records
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {dataset.rowCount.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Columns
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {dataset.columnCount}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            File Size
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatFileSize(dataset.fileSize)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Numeric Columns
          </span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {dataset.columns.filter((c) => c.dataType === 'number').length}
          </p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'preview'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Table className="h-4 w-4" />
          Preview Rows
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'schema'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Columns className="h-4 w-4" />
          Column Schema & Statistics
        </button>

        <button
          onClick={() => setActiveTab('cleaning')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'cleaning'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          Data Cleaning Studio
        </button>

        <button
          onClick={() => setActiveTab('quickchart')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'quickchart'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Quick Visualizer
        </button>
      </div>

      {/* Tab Content 1: Preview Table */}
      {activeTab === 'preview' && <DatasetTable datasetId={dataset._id} />}

      {/* Tab Content: Data Cleaning Studio */}
      {activeTab === 'cleaning' && (
        <DataCleaningStudio
          dataset={dataset}
          onCleaningComplete={() => {
            datasetApi.getById(dataset._id).then(setDataset);
          }}
        />
      )}

      {/* Tab Content 2: Schema & Column Statistics */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dataset.columns.map((col) => (
            <Card key={col.name} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {col.name}
                  </h4>
                  <Badge
                    variant={
                      col.dataType === 'number'
                        ? 'indigo'
                        : col.dataType === 'date'
                        ? 'amber'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {col.dataType}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3">
                  <div className="flex justify-between">
                    <span>Missing / Nulls:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {col.nullCount} (
                      {dataset.rowCount > 0
                        ? ((col.nullCount / dataset.rowCount) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distinct Unique:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {col.uniqueCount}
                    </span>
                  </div>
                </div>

                {/* Numeric Stats */}
                {col.dataType === 'number' && col.stats && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Min</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(col.stats.min)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Max</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(col.stats.max)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Mean / Avg</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(col.stats.mean)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Median</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(col.stats.median)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Categorical Top Values */}
                {col.dataType !== 'number' && col.stats?.topValues && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                      Top Values:
                    </span>
                    <div className="space-y-1">
                      {col.stats.topValues.slice(0, 4).map((top) => (
                        <div
                          key={top.value}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                            {top.value || '(Empty)'}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {top.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Content 3: Quick Visualizer */}
      {activeTab === 'quickchart' && (
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Chart Type
              </label>
              <select
                value={quickChartType}
                onChange={(e) => setQuickChartType(e.target.value as ChartType)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                X-Axis
              </label>
              <select
                value={quickX}
                onChange={(e) => setQuickX(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                {dataset.columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.dataType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Y-Axis
              </label>
              <select
                value={quickY}
                onChange={(e) => setQuickY(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                <option value="">None / Row Count</option>
                {dataset.columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.dataType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Aggregation
              </label>
              <select
                value={quickAgg}
                onChange={(e) => setQuickAgg(e.target.value as AggregationType)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
                <option value="none">Raw</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 min-h-[350px] flex items-center justify-center">
            {isQuickLoading ? (
              <p className="text-xs text-slate-400 animate-pulse">Rendering preview...</p>
            ) : (
              <ChartRenderer
                chartType={quickChartType}
                data={quickData}
                colorPalette="indigo"
                height={320}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
