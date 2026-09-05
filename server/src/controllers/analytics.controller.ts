import { Request, Response } from 'express';
import { Dataset } from '../models/Dataset';
import { generateDatasetAnalytics } from '../services/analyticsService';
import { getDatasetRows } from '../services/datasetStorageService';
import { ApiError } from '../utils/apiError';

export const getDatasetProfiling = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  const rows = await getDatasetRows(dataset._id);
  const analytics = generateDatasetAnalytics(dataset, rows);

  res.status(200).json({
    success: true,
    data: analytics,
  });
};

export const getColumnDistribution = async (req: Request, res: Response): Promise<void> => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!dataset) {
    throw ApiError.notFound('Dataset not found');
  }

  const columnName = String(req.params.column);
  const colMeta = dataset.columns.find((c) => c.name === columnName);

  if (!colMeta) {
    throw ApiError.notFound(`Column "${columnName}" does not exist in this dataset.`);
  }

  const rows = await getDatasetRows(dataset._id);
  const rawValues = rows
    .map((r) => r[columnName])
    .filter((v) => v !== null && v !== undefined && v !== '');

  if (colMeta.dataType === 'number') {
    // Generate 5-10 equal-width bins for histogram
    const numValues = rawValues.map(Number).filter((n) => !isNaN(n));
    if (numValues.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const min = Math.min(...numValues);
    const max = Math.max(...numValues);
    const binCount = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(numValues.length))));
    const binWidth = (max - min) / binCount || 1;

    const bins: { range: string; count: number; min: number; max: number }[] = [];
    for (let i = 0; i < binCount; i++) {
      const bMin = Math.round((min + i * binWidth) * 100) / 100;
      const bMax = Math.round((min + (i + 1) * binWidth) * 100) / 100;
      bins.push({
        range: `${bMin} - ${bMax}`,
        count: 0,
        min: bMin,
        max: bMax,
      });
    }

    for (const val of numValues) {
      let placed = false;
      for (let i = 0; i < bins.length; i++) {
        if (val >= bins[i].min && (i === bins.length - 1 ? val <= bins[i].max : val < bins[i].max)) {
          bins[i].count++;
          placed = true;
          break;
        }
      }
      if (!placed && bins.length > 0) {
        bins[bins.length - 1].count++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        type: 'histogram',
        bins: bins.map((b) => ({ label: b.range, count: b.count })),
        stats: colMeta.stats,
      },
    });
    return;
  }

  // Categorical frequency distribution
  const freqMap: Record<string, number> = {};
  for (const v of rawValues) {
    const key = String(v).trim();
    freqMap[key] = (freqMap[key] || 0) + 1;
  }

  const sortedDistribution = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / rawValues.length) * 10000) / 100,
    }));

  res.status(200).json({
    success: true,
    data: {
      type: 'categorical',
      distribution: sortedDistribution,
      uniqueCount: colMeta.uniqueCount,
      nullCount: colMeta.nullCount,
    },
  });
};
