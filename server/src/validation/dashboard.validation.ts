import { z } from 'zod';

const widgetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Widget title is required'),
  chartType: z.enum(['bar', 'line', 'area', 'pie', 'scatter']),
  datasetId: z.string().min(1, 'Dataset ID is required'),
  xAxis: z.string().min(1, 'xAxis is required'),
  yAxis: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max', 'none']),
  colorPalette: z.enum(['indigo', 'emerald', 'cyberpunk', 'sunset', 'ocean', 'monochrome']),
  w: z.number().min(1).max(3).default(2),
  h: z.number().min(1).max(2).default(1),
  x: z.number().default(0),
  y: z.number().default(0),
  filterField: z.string().optional(),
  filterValue: z.string().optional(),
});

export const createDashboardSchema = z.object({
  title: z.string().min(1, 'Dashboard title is required').max(200),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  widgets: z.array(widgetSchema).optional(),
});

export const updateDashboardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  widgets: z.array(widgetSchema).optional(),
});
