import { z } from 'zod';

export const queryChartDataSchema = z.object({
  xAxis: z.string().min(1, 'xAxis column name is required'),
  yAxis: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max', 'none']).optional(),
  chartType: z.enum(['bar', 'line', 'area', 'pie', 'scatter']).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  sortBy: z.enum(['value', 'label']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filterField: z.string().optional(),
  filterValue: z.string().optional(),
});

export const cleanOperationSchema = z.object({
  type: z.enum([
    'removeDuplicates',
    'dropNulls',
    'imputeMissing',
    'formatText',
    'filterOutliers',
    'dropColumn',
    'renameColumn',
  ]),
  column: z.string().optional(),
  columns: z.array(z.string()).optional(),
  strategy: z.enum(['mean', 'median', 'mode', 'constant']).optional(),
  constantValue: z.any().optional(),
  action: z.enum(['trim', 'lowercase', 'uppercase', 'removeSpecial', 'drop', 'cap']).optional(),
  method: z.enum(['iqr', 'zscore']).optional(),
  factor: z.number().optional(),
  oldName: z.string().optional(),
  newName: z.string().optional(),
});

export const cleanDatasetSchema = z.object({
  operations: z.array(cleanOperationSchema).min(1, 'At least one cleaning operation is required'),
  saveAsNew: z.boolean().optional().default(true),
  newDatasetName: z.string().optional(),
});
