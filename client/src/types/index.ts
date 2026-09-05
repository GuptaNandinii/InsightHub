export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export type DataType = 'number' | 'string' | 'boolean' | 'date';

export interface ColumnStats {
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  topValues?: Array<{ value: string; count: number }>;
}

export interface ColumnMeta {
  name: string;
  dataType: DataType;
  nullCount: number;
  uniqueCount: number;
  stats?: ColumnStats;
}

export interface Dataset {
  _id: string;
  name: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnMeta[];
  createdAt: string;
  updatedAt?: string;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
export type ColorPalette = 'indigo' | 'emerald' | 'cyberpunk' | 'sunset' | 'ocean' | 'monochrome';

export interface DashboardWidget {
  id: string;
  title: string;
  chartType: ChartType;
  datasetId: string;
  xAxis: string;
  yAxis?: string;
  aggregation: AggregationType;
  colorPalette: ColorPalette;
  w: number; // 1, 2, or 3
  h: number;
  x: number;
  y: number;
  filterField?: string;
  filterValue?: string;
  chartData?: any[];
  datasetName?: string;
}

export interface Dashboard {
  _id: string;
  title: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  shareToken: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DatasetSummary {
  rowCount: number;
  columnCount: number;
  fileSize: number;
  totalMissingCells: number;
  dataCompletenessPercentage: number;
  numericColumnCount: number;
  categoricalColumnCount: number;
  dateColumnCount: number;
  columns: Array<{
    name: string;
    dataType: string;
    nullCount: number;
    nullPercentage: number;
    uniqueCount: number;
    stats?: ColumnStats;
  }>;
  correlations: Array<{
    col1: string;
    col2: string;
    coefficient: number;
  }>;
}
