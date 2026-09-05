import { IDataset } from '../models/Dataset';

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
    stats?: any;
  }>;
  correlations: Array<{
    col1: string;
    col2: string;
    coefficient: number;
  }>;
}

/**
 * Calculate Pearson correlation coefficient between two numeric arrays
 */
const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return Math.round((numerator / denominator) * 100) / 100;
};

export const generateDatasetAnalytics = (dataset: IDataset): DatasetSummary => {
  const totalCells = dataset.rowCount * dataset.columnCount;
  let totalMissing = 0;
  let numericCount = 0;
  let categoricalCount = 0;
  let dateCount = 0;

  const columnDetails = dataset.columns.map((col) => {
    totalMissing += col.nullCount;
    if (col.dataType === 'number') numericCount++;
    else if (col.dataType === 'date') dateCount++;
    else categoricalCount++;

    const nullPercentage =
      dataset.rowCount > 0
        ? Math.round((col.nullCount / dataset.rowCount) * 10000) / 100
        : 0;

    return {
      name: col.name,
      dataType: col.dataType,
      nullCount: col.nullCount,
      nullPercentage,
      uniqueCount: col.uniqueCount,
      stats: col.stats,
    };
  });

  const completeness =
    totalCells > 0
      ? Math.round(((totalCells - totalMissing) / totalCells) * 10000) / 100
      : 100;

  // Compute pairwise correlations for numeric columns
  const numericColumns = dataset.columns
    .filter((c) => c.dataType === 'number')
    .map((c) => c.name);

  const correlations: Array<{ col1: string; col2: string; coefficient: number }> = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];

      // Pair valid rows where both columns are non-null
      const pairs = dataset.rows
        .filter((r) => r[col1] !== null && r[col2] !== null && !isNaN(Number(r[col1])) && !isNaN(Number(r[col2])))
        .map((r) => ({ x: Number(r[col1]), y: Number(r[col2]) }));

      if (pairs.length >= 2) {
        const coef = calculatePearsonCorrelation(
          pairs.map((p) => p.x),
          pairs.map((p) => p.y)
        );
        correlations.push({ col1, col2, coefficient: coef });
      }
    }
  }

  return {
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount,
    fileSize: dataset.fileSize,
    totalMissingCells: totalMissing,
    dataCompletenessPercentage: completeness,
    numericColumnCount: numericCount,
    categoricalColumnCount: categoricalCount,
    dateColumnCount: dateCount,
    columns: columnDetails,
    correlations,
  };
};
