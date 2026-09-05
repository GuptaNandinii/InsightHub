import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LineChart as LineChartIcon,
  Database,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { Dataset, DatasetSummary } from '../types';
import { datasetApi, analyticsApi } from '../api/endpoints';

export const AnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  // Column Distribution Drilldown
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [distributionData, setDistributionData] = useState<any>(null);
  const [isLoadingDistribution, setIsLoadingDistribution] = useState<boolean>(false);

  // Load all datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setIsLoadingDatasets(true);
        const list = await datasetApi.getAll();
        setDatasets(list);

        const initialId = searchParams.get('datasetId') || (list.length > 0 ? list[0]._id : '');
        if (initialId) {
          setSelectedDatasetId(initialId);
        }
      } catch (err) {
        console.error('Failed to load datasets', err);
      } finally {
        setIsLoadingDatasets(false);
      }
    };

    fetchDatasets();
  }, []);

  // Fetch analytics summary when dataset changes
  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchSummary = async () => {
      try {
        setIsLoadingSummary(true);
        setSearchParams({ datasetId: selectedDatasetId });
        const data = await analyticsApi.getProfiling(selectedDatasetId);
        setSummary(data);

        // Default to first column for distribution drilldown
        if (data.columns.length > 0) {
          setSelectedColumn(data.columns[0].name);
        }
      } catch (err) {
        console.error('Failed to load profiling summary', err);
        setSummary(null);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [selectedDatasetId]);

  // Fetch single column distribution
  useEffect(() => {
    if (!selectedDatasetId || !selectedColumn) return;

    const fetchDist = async () => {
      try {
        setIsLoadingDistribution(true);
        const res = await analyticsApi.getColumnDistribution(selectedDatasetId, selectedColumn);
        setDistributionData(res);
      } catch (err) {
        console.error('Failed to load distribution', err);
        setDistributionData(null);
      } finally {
        setIsLoadingDistribution(false);
      }
    };

    fetchDist();
  }, [selectedDatasetId, selectedColumn]);

  if (isLoadingDatasets) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <Database className="h-10 w-10 mx-auto text-slate-400" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          No datasets to profile
        </h2>
        <p className="text-xs text-slate-500">
          Upload a CSV file first to inspect descriptive statistics and distributions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Dataset Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LineChartIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Statistical Data Profiling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated quality audits, feature distributions, and Pearson correlation coefficients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dataset:
          </label>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {datasets.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.rowCount} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoadingSummary || !summary ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Health & Completeness KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Data Completeness
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.dataCompletenessPercentage}%
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Missing Cells
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.totalMissingCells}
                </span>
                {summary.totalMissingCells > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Feature Breakdown
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                <span className="font-bold text-indigo-600">{summary.numericColumnCount}</span> Numeric,{' '}
                <span className="font-bold text-amber-600">{summary.categoricalColumnCount}</span> Categorical,{' '}
                <span className="font-bold text-purple-600">{summary.dateColumnCount}</span> Date
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Dataset Dimensions
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-mono">
                {summary.rowCount.toLocaleString()} × {summary.columnCount} Matrix
              </p>
            </Card>
          </div>

          {/* Interactive Column Distribution Inspector */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Column Distribution Visualizer
                </h3>
                <p className="text-xs text-slate-400">
                  Explore frequency bars for categories or binned histograms for numeric continuous variables.
                </p>
              </div>

              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
                {summary.columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.dataType})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 min-h-[280px] flex items-center justify-center">
              {isLoadingDistribution ? (
                <p className="text-xs text-slate-400 animate-pulse">
                  Computing column distribution...
                </p>
              ) : distributionData ? (
                <ChartRenderer
                  chartType="bar"
                  data={
                    distributionData.type === 'histogram'
                      ? distributionData.bins.map((b: any) => ({ name: b.label, value: b.count }))
                      : distributionData.distribution.map((d: any) => ({
                          name: d.label,
                          value: d.count,
                        }))
                  }
                  colorPalette="indigo"
                  height={260}
                />
              ) : (
                <p className="text-xs text-slate-400">No distribution data available.</p>
              )}
            </div>
          </Card>

          {/* Correlation Matrix Table */}
          {summary.correlations && summary.correlations.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pearson Feature Correlation Matrix
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Linear correlation between pairs of numeric columns (-1.0 to +1.0).
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Feature 1
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Feature 2
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Pearson Coefficient (r)
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Correlation Strength
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {summary.correlations.map((cor, idx) => {
                      const strength =
                        Math.abs(cor.coefficient) >= 0.7
                          ? 'Strong'
                          : Math.abs(cor.coefficient) >= 0.3
                          ? 'Moderate'
                          : 'Weak';
                      const badgeVariant =
                        cor.coefficient > 0.3
                          ? 'emerald'
                          : cor.coefficient < -0.3
                          ? 'rose'
                          : 'slate';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {cor.col1}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {cor.col2}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold">
                            {cor.coefficient > 0 ? `+${cor.coefficient}` : cor.coefficient}
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge variant={badgeVariant} size="sm">
                              {strength} {cor.coefficient >= 0 ? 'Positive' : 'Negative'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
