import { Request, Response } from 'express';
import { Dashboard } from '../models/Dashboard';
import { Dataset } from '../models/Dataset';
import { aggregateData } from '../services/aggregationService';
import { getDatasetRows } from '../services/datasetStorageService';
import { ApiError } from '../utils/apiError';

export const createDashboard = async (req: Request, res: Response): Promise<void> => {
  const { title, description, tags, isPublic, widgets } = req.body;

  const dashboard = await Dashboard.create({
    userId: req.user!._id,
    title,
    description,
    tags,
    isPublic: isPublic ?? false,
    widgets: widgets ?? [],
  });

  res.status(201).json({
    success: true,
    message: 'Dashboard created successfully',
    data: dashboard,
  });
};

export const getAllDashboards = async (req: Request, res: Response): Promise<void> => {
  const dashboards = await Dashboard.find({ userId: req.user!._id })
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: dashboards,
  });
};

export const getDashboardById = async (req: Request, res: Response): Promise<void> => {
  const dashboard = await Dashboard.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dashboard) {
    throw ApiError.notFound('Dashboard not found');
  }

  res.status(200).json({
    success: true,
    data: dashboard,
  });
};

export const updateDashboard = async (req: Request, res: Response): Promise<void> => {
  const { title, description, tags, isPublic, widgets } = req.body;

  const dashboard = await Dashboard.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!._id },
    {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
      ...(isPublic !== undefined && { isPublic }),
      ...(widgets !== undefined && { widgets }),
    },
    { new: true, runValidators: true }
  );

  if (!dashboard) {
    throw ApiError.notFound('Dashboard not found');
  }

  res.status(200).json({
    success: true,
    message: 'Dashboard updated successfully',
    data: dashboard,
  });
};

export const deleteDashboard = async (req: Request, res: Response): Promise<void> => {
  const dashboard = await Dashboard.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dashboard) {
    throw ApiError.notFound('Dashboard not found');
  }

  res.status(200).json({
    success: true,
    message: 'Dashboard deleted successfully',
  });
};

/**
 * Public access view by shareToken (Read-only, no auth required)
 * Pre-aggregates widget chart data so the public viewer gets full instant charts!
 */
export const getPublicDashboard = async (req: Request, res: Response): Promise<void> => {
  const { shareToken } = req.params;

  const dashboard = await Dashboard.findOne({ shareToken, isPublic: true });
  if (!dashboard) {
    throw ApiError.notFound('Public dashboard not found or link is private.');
  }

  // Aggregate data for all widgets
  const widgetDataPromises = dashboard.widgets.map(async (w) => {
    const dataset = await Dataset.findById(w.datasetId);
    const widgetObj = (w as any).toObject ? (w as any).toObject() : JSON.parse(JSON.stringify(w));

    if (!dataset) {
      return {
        ...widgetObj,
        chartData: [],
        datasetName: 'Unknown dataset',
      };
    }

    const rows = await getDatasetRows(dataset._id);

    const chartData = aggregateData(rows, {
      xAxis: w.xAxis,
      yAxis: w.yAxis,
      aggregation: w.aggregation,
      chartType: w.chartType,
      filterField: w.filterField,
      filterValue: w.filterValue,
      limit: 25,
    });

    return {
      ...widgetObj,
      chartData,
      datasetName: dataset.name,
    };
  });

  const hydratedWidgets = await Promise.all(widgetDataPromises);

  res.status(200).json({
    success: true,
    data: {
      id: dashboard._id,
      title: dashboard.title,
      description: dashboard.description,
      tags: dashboard.tags,
      widgets: hydratedWidgets,
      updatedAt: dashboard.updatedAt,
    },
  });
};
