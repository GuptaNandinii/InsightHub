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
