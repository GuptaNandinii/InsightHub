import { Request, Response } from 'express';
import { Dataset } from '../models/Dataset';
import { parseCSVBuffer } from '../services/csvParser';
import { aggregateData } from '../services/aggregationService';
import { executeCleaningPipeline } from '../services/dataCleaningService';
import {
  saveDatasetRows,
  getDatasetRows,
  deleteDatasetRows,
} from '../services/datasetStorageService';
import { ApiError } from '../utils/apiError';

export const uploadDataset = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw ApiError.badRequest('Please attach a valid CSV file.');
  }

  const displayName = req.body.name?.trim() || req.file.originalname.replace(/\.[^/.]+$/, '');
  const parsed = await parseCSVBuffer(req.file.buffer);

  if (parsed.rowCount === 0) {
    throw ApiError.badRequest('The uploaded CSV file contains no data rows.');
  }

  const previewSample = parsed.rows.slice(0, 100);

  const dataset = await Dataset.create({
    userId: req.user!._id,
    name: displayName,
    originalFilename: req.file.originalname,
    fileSize: req.file.size,
    rowCount: parsed.rowCount,
    columnCount: parsed.columnCount,
    columns: parsed.columns,
    previewRows: previewSample,
    rows: previewSample,
  });

  // Save all rows partitioned in chunks to avoid MongoDB 16MB document limit
  await saveDatasetRows(dataset._id, parsed.rows);

  res.status(201).json({
    success: true,
    message: 'Dataset uploaded and processed successfully',
    data: {
      id: dataset._id,
      name: dataset.name,
      originalFilename: dataset.originalFilename,
      fileSize: dataset.fileSize,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      columns: dataset.columns,
      createdAt: dataset.createdAt,
    },
  });
};

export const getAllDatasets = async (req: Request, res: Response): Promise<void> => {
  const datasets = await Dataset.find({ userId: req.user!._id })
    .select('-rows -previewRows')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: datasets,
  });
};

export const getDatasetById = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  }).select('-rows -previewRows');

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  res.status(200).json({
    success: true,
    data: dataset,
  });
};

export const getDatasetPreview = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);
  const search = (req.query.search as string)?.toLowerCase().trim();
  const sortBy = req.query.sortBy as string;
  const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;

  // Ultra-fast path: first page without search or sort uses cached previewRows if available
  if (!search && !sortBy && page === 1 && dataset.previewRows && dataset.previewRows.length >= limit) {
    res.status(200).json({
      success: true,
      data: {
        totalRows: dataset.rowCount,
        page,
        limit,
        totalPages: Math.ceil(dataset.rowCount / limit),
        columns: dataset.columns.map((c) => ({ name: c.name, dataType: c.dataType })),
        rows: dataset.previewRows.slice(0, limit),
      },
    });
    return;
  }

  let processedRows = await getDatasetRows(dataset._id);

  // Filter search
  if (search) {
    processedRows = processedRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(search)
      )
    );
  }

  // Sorting
  if (sortBy) {
    processedRows.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 1 ? valA - valB : valB - valA;
      }
      return sortOrder === 1
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  const totalFiltered = processedRows.length;
  const startIndex = (page - 1) * limit;
  const paginatedRows = processedRows.slice(startIndex, startIndex + limit);

  res.status(200).json({
    success: true,
    data: {
      totalRows: totalFiltered,
      page,
      limit,
      totalPages: Math.ceil(totalFiltered / limit),
      columns: dataset.columns.map((c) => ({ name: c.name, dataType: c.dataType })),
      rows: paginatedRows,
    },
  });
};

export const queryChartData = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  const {
    xAxis,
    yAxis,
    aggregation = 'none',
    chartType = 'bar',
    limit = 20,
    sortBy = 'value',
    sortOrder = 'desc',
    filterField,
    filterValue,
  } = req.query;

  const rows = await getDatasetRows(dataset._id);

  const chartData = aggregateData(rows, {
    xAxis: String(xAxis),
    yAxis: yAxis ? String(yAxis) : undefined,
    aggregation: aggregation as any,
    chartType: chartType as any,
    limit: Number(limit),
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    filterField: filterField ? String(filterField) : undefined,
    filterValue: filterValue ? String(filterValue) : undefined,
  });

  res.status(200).json({
    success: true,
    data: chartData,
  });
};

export const deleteDataset = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  // Cascading delete of chunk documents
  await deleteDatasetRows(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Dataset deleted successfully',
  });
};

export const previewCleanDataset = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  const { operations } = req.body;
  const rows = await getDatasetRows(dataset._id);
  const result = executeCleaningPipeline(rows, dataset.columns, operations || []);

  res.status(200).json({
    success: true,
    data: {
      rowsBefore: result.rowsBefore,
      rowsAfter: result.rowsAfter,
      changesReport: result.changesReport,
      columns: result.cleanedColumns,
      previewRows: result.cleanedRows.slice(0, 15),
    },
  });
};

export const cleanDataset = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  const { operations, saveAsNew = true, newDatasetName } = req.body;
  const rows = await getDatasetRows(dataset._id);
  const result = executeCleaningPipeline(rows, dataset.columns, operations || []);

  if (saveAsNew) {
    const finalName = newDatasetName?.trim() || `${dataset.name} (Cleaned)`;
    const previewSample = result.cleanedRows.slice(0, 100);

    const newDataset = await Dataset.create({
      userId: req.user!._id,
      name: finalName,
      originalFilename: `cleaned_${dataset.originalFilename}`,
      fileSize: dataset.fileSize,
      rowCount: result.rowsAfter,
      columnCount: result.cleanedColumns.length,
      columns: result.cleanedColumns,
      previewRows: previewSample,
      rows: previewSample,
    });

    await saveDatasetRows(newDataset._id, result.cleanedRows);

    res.status(201).json({
      success: true,
      message: `Cleaned dataset created as "${finalName}"`,
      data: {
        id: newDataset._id,
        name: newDataset.name,
        rowCount: newDataset.rowCount,
        columnCount: newDataset.columnCount,
        columns: newDataset.columns,
        changesReport: result.changesReport,
      },
    });
  } else {
    // In-place overwrite
    const previewSample = result.cleanedRows.slice(0, 100);
    dataset.rows = previewSample;
    dataset.previewRows = previewSample;
    dataset.columns = result.cleanedColumns;
    dataset.rowCount = result.rowsAfter;
    dataset.columnCount = result.cleanedColumns.length;
    await dataset.save();

    await saveDatasetRows(dataset._id, result.cleanedRows);

    res.status(200).json({
      success: true,
      message: 'Dataset successfully cleaned and updated in place',
      data: {
        id: dataset._id,
        name: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        columns: dataset.columns,
        changesReport: result.changesReport,
      },
    });
  }
};

