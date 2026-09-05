import { AggregationType, ChartType } from '../models/Dashboard';

export interface AggregateQueryParams {
  xAxis: string;
  yAxis?: string;
  aggregation?: AggregationType;
  chartType?: ChartType;
  limit?: number;
  sortBy?: 'value' | 'label';
  sortOrder?: 'asc' | 'desc';
  filterField?: string;
  filterValue?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  count?: number;
  rawX?: any;
  rawY?: any;
}

export const aggregateData = (
  rows: Record<string, any>[],
  params: AggregateQueryParams
): any[] => {
  let filtered = rows;

  // Apply filter if provided
  if (params.filterField && params.filterValue !== undefined && params.filterValue !== '') {
    filtered = filtered.filter(
      (r) => String(r[params.filterField!]).toLowerCase() === String(params.filterValue).toLowerCase()
    );
  }

  // Handle scatter plot specially: return array of { x: number, y: number, name?: string }
  if (params.chartType === 'scatter') {
    const scatterPoints: Array<{ x: number; y: number; name?: string }> = [];
    const xCol = params.xAxis;
    const yCol = params.yAxis || params.xAxis;

    for (const row of filtered) {
      const xVal = Number(row[xCol]);
      const yVal = Number(row[yCol]);
      if (!isNaN(xVal) && !isNaN(yVal) && row[xCol] !== null && row[yCol] !== null) {
        scatterPoints.push({
          x: Math.round(xVal * 100) / 100,
          y: Math.round(yVal * 100) / 100,
          name: row['Name'] || row['ID'] || row['TransactionID'] || undefined,
        });
      }
    }

    const limit = params.limit && params.limit > 0 ? params.limit : 100;
    return scatterPoints.slice(0, limit);
  }

  // If no aggregation is requested and rows are discrete
  if (params.aggregation === 'none' || !params.aggregation) {
    const rawData = filtered.map((r, idx) => ({
      name: String(r[params.xAxis] ?? `Row ${idx + 1}`),
      value: params.yAxis && !isNaN(Number(r[params.yAxis])) ? Number(r[params.yAxis]) : 1,
    }));

    const limit = params.limit && params.limit > 0 ? params.limit : 50;
    return rawData.slice(0, limit);
  }

  // Group by xAxis
  const groups = new Map<string, number[]>();

  for (const row of filtered) {
    const key = String(row[params.xAxis] ?? 'Unspecified').trim() || 'Unspecified';
    if (!groups.has(key)) {
      groups.set(key, []);
    }

    if (params.aggregation === 'count') {
      groups.get(key)!.push(1);
    } else if (params.yAxis) {
      const num = Number(row[params.yAxis]);
      if (!isNaN(num) && row[params.yAxis] !== null) {
        groups.get(key)!.push(num);
      }
    }
  }

  const result: ChartDataPoint[] = [];

  for (const [key, vals] of groups.entries()) {
    if (vals.length === 0) continue;

    let computedValue = 0;
    switch (params.aggregation) {
      case 'count':
        computedValue = vals.length;
        break;
      case 'sum':
        computedValue = vals.reduce((acc, v) => acc + v, 0);
        break;
      case 'avg':
        computedValue = vals.reduce((acc, v) => acc + v, 0) / vals.length;
        break;
      case 'min':
        computedValue = Math.min(...vals);
        break;
      case 'max':
        computedValue = Math.max(...vals);
        break;
      default:
        computedValue = vals.length;
    }

    result.push({
      name: key,
      value: Math.round(computedValue * 100) / 100,
      count: vals.length,
    });
  }

  // Sorting
  const sortBy = params.sortBy || 'value';
  const sortOrder = params.sortOrder || 'desc';

  result.sort((a, b) => {
    if (sortBy === 'value') {
      return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
    } else {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
  });

  const limit = params.limit && params.limit > 0 ? params.limit : 15;
  return result.slice(0, limit);
};
