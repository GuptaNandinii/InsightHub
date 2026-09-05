import { IColumnMeta } from '../models/Dataset';
import { calculateNumericStats } from './csvParser';

export type CleanActionType =
  | 'removeDuplicates'
  | 'dropNulls'
  | 'imputeMissing'
  | 'formatText'
  | 'filterOutliers'
  | 'dropColumn'
  | 'renameColumn';

export interface CleanOperation {
  type: CleanActionType;
  column?: string;
  columns?: string[];
  subsetColumns?: string[];
  strategy?: 'mean' | 'median' | 'mode' | 'constant';
  constantValue?: any;
  action?: 'trim' | 'lowercase' | 'uppercase' | 'removeSpecial' | 'drop' | 'cap';
  method?: 'iqr' | 'zscore';
  factor?: number;
  oldName?: string;
  newName?: string;
}

export interface CleaningResult {
  cleanedRows: Record<string, any>[];
  cleanedColumns: IColumnMeta[];
  changesReport: string[];
  rowsBefore: number;
  rowsAfter: number;
}

/**
 * Compute mode (most frequent value) of a column
 */
const calculateMode = (values: any[]): any => {
  const counts: Record<string, number> = {};
  for (const v of values) {
    if (v !== null && v !== undefined && v !== '') {
      const key = String(v);
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  let topVal: any = null;
  let maxCount = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      topVal = key;
    }
  }
  return topVal;
};

/**
 * Remove duplicate rows
 */
export const removeDuplicates = (
  rows: Record<string, any>[],
  subsetColumns?: string[]
): { rows: Record<string, any>[]; removedCount: number } => {
  const seen = new Set<string>();
  const filtered: Record<string, any>[] = [];

  for (const row of rows) {
    const key = subsetColumns && subsetColumns.length > 0
      ? subsetColumns.map((col) => String(row[col] ?? '')).join('|||')
      : JSON.stringify(row);

    if (!seen.has(key)) {
      seen.add(key);
      filtered.push(row);
    }
  }

  return {
    rows: filtered,
    removedCount: rows.length - filtered.length,
  };
};

/**
 * Drop rows with null values
 */
export const dropNullRows = (
  rows: Record<string, any>[],
  targetColumns?: string[]
): { rows: Record<string, any>[]; droppedCount: number } => {
  const filtered = rows.filter((row) => {
    if (targetColumns && targetColumns.length > 0) {
      return targetColumns.every(
        (col) => row[col] !== null && row[col] !== undefined && row[col] !== ''
      );
    }
    return Object.values(row).every(
      (val) => val !== null && val !== undefined && val !== ''
    );
  });

  return {
    rows: filtered,
    droppedCount: rows.length - filtered.length,
  };
};

/**
 * Impute missing values with mean, median, mode or constant
 */
export const imputeMissingValues = (
  rows: Record<string, any>[],
  column: string,
  strategy: 'mean' | 'median' | 'mode' | 'constant',
  constantValue?: any
): { rows: Record<string, any>[]; imputedCount: number; fillValueUsed: any } => {
  const validValues = rows
    .map((r) => r[column])
    .filter((v) => v !== null && v !== undefined && v !== '');

  let fillValue: any;

  if (strategy === 'constant') {
    fillValue = constantValue !== undefined ? constantValue : 'N/A';
  } else if (strategy === 'mode') {
    fillValue = calculateMode(validValues) ?? 'Unknown';
  } else {
    // Numeric mean or median
    const numericVals = validValues.map(Number).filter((n) => !isNaN(n));
    if (numericVals.length === 0) {
      fillValue = 0;
    } else if (strategy === 'mean') {
      const sum = numericVals.reduce((acc, v) => acc + v, 0);
      fillValue = Math.round((sum / numericVals.length) * 100) / 100;
    } else {
      // Median
      const sorted = [...numericVals].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      fillValue =
        sorted.length % 2 === 0
          ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
          : sorted[mid];
    }
  }

  let count = 0;
  const newRows = rows.map((r) => {
    const val = r[column];
    if (val === null || val === undefined || val === '') {
      count++;
      return { ...r, [column]: fillValue };
    }
    return { ...r };
  });

  return {
    rows: newRows,
    imputedCount: count,
    fillValueUsed: fillValue,
  };
};

/**
 * Format string column (trim, lowercase, uppercase, removeSpecial)
 */
export const formatTextColumn = (
  rows: Record<string, any>[],
  column: string,
  action: 'trim' | 'lowercase' | 'uppercase' | 'removeSpecial'
): { rows: Record<string, any>[]; formattedCount: number } => {
  let count = 0;

  const newRows = rows.map((r) => {
    const val = r[column];
    if (typeof val === 'string') {
      let formatted = val;
      if (action === 'trim') formatted = val.trim();
      else if (action === 'lowercase') formatted = val.toLowerCase().trim();
      else if (action === 'uppercase') formatted = val.toUpperCase().trim();
      else if (action === 'removeSpecial') formatted = val.replace(/[^\w\s.-]/gi, '').trim();

      if (formatted !== val) {
        count++;
        return { ...r, [column]: formatted };
      }
    }
    return { ...r };
  });

  return { rows: newRows, formattedCount: count };
};

/**
 * Filter or cap outliers on numeric columns
 */
export const filterOutliers = (
  rows: Record<string, any>[],
  column: string,
  method: 'iqr' | 'zscore' = 'iqr',
  action: 'drop' | 'cap' = 'drop',
  factor = 1.5
): { rows: Record<string, any>[]; affectedCount: number; lowerBound: number; upperBound: number } => {
  const numericVals = rows
    .map((r) => r[column])
    .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
    .map(Number);

  if (numericVals.length < 4) {
    return { rows, affectedCount: 0, lowerBound: 0, upperBound: 0 };
  }

  let lowerBound = 0;
  let upperBound = 0;

  if (method === 'iqr') {
    const sorted = [...numericVals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    lowerBound = Math.round((q1 - factor * iqr) * 100) / 100;
    upperBound = Math.round((q3 + factor * iqr) * 100) / 100;
  } else {
    // Z-Score
    const sum = numericVals.reduce((acc, v) => acc + v, 0);
    const mean = sum / numericVals.length;
    const variance = numericVals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numericVals.length;
    const stdDev = Math.sqrt(variance) || 1;
    lowerBound = Math.round((mean - 3.0 * stdDev) * 100) / 100;
    upperBound = Math.round((mean + 3.0 * stdDev) * 100) / 100;
  }

  let count = 0;
  let newRows: Record<string, any>[];

  if (action === 'drop') {
    newRows = rows.filter((r) => {
      const v = Number(r[column]);
      if (isNaN(v) || r[column] === null) return true;
      const isOutlier = v < lowerBound || v > upperBound;
      if (isOutlier) count++;
      return !isOutlier;
    });
  } else {
    // Cap
    newRows = rows.map((r) => {
      const v = Number(r[column]);
      if (isNaN(v) || r[column] === null) return { ...r };
      if (v < lowerBound) {
        count++;
        return { ...r, [column]: lowerBound };
      }
      if (v > upperBound) {
        count++;
        return { ...r, [column]: upperBound };
      }
      return { ...r };
    });
  }

  return { rows: newRows, affectedCount: count, lowerBound, upperBound };
};

/**
 * Re-calculate column metadata and stats after cleaning
 */
export const recalculateColumnMetadata = (
  rows: Record<string, any>[],
  existingColumns: IColumnMeta[]
): IColumnMeta[] => {
  if (rows.length === 0) {
    return existingColumns.map((c) => ({
      ...c,
      nullCount: 0,
      uniqueCount: 0,
      stats: {},
    }));
  }

  const columnNames = Object.keys(rows[0] || {});
  const updatedColumns: IColumnMeta[] = [];

  for (const name of columnNames) {
    const existingCol = existingColumns.find((c) => c.name === name);
    const rawValues = rows.map((r) => r[name]);
    const validValues = rawValues.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = rows.length - validValues.length;

    // Frequencies & uniques
    const freqMap: Record<string, number> = {};
    const numericVals: number[] = [];

    for (const v of validValues) {
      const strVal = String(v);
      freqMap[strVal] = (freqMap[strVal] || 0) + 1;
      const num = Number(v);
      if (!isNaN(num)) {
        numericVals.push(num);
      }
    }

    const uniqueCount = Object.keys(freqMap).length;
    const inferredType = existingCol?.dataType || (numericVals.length === validValues.length && validValues.length > 0 ? 'number' : 'string');

    let stats: any;
    if (inferredType === 'number') {
      stats = calculateNumericStats(numericVals);
    } else {
      const sortedTop = Object.entries(freqMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
      stats = { topValues: sortedTop };
    }

    updatedColumns.push({
      name,
      dataType: inferredType,
      nullCount,
      uniqueCount,
      stats,
    });
  }

  return updatedColumns;
};

/**
 * Execute a pipeline of cleaning operations sequentially
 */
export const executeCleaningPipeline = (
  initialRows: Record<string, any>[],
  initialColumns: IColumnMeta[],
  operations: CleanOperation[]
): CleaningResult => {
  let rows = initialRows.map((r) => ({ ...r }));
  let columns = [...initialColumns];
  const changesReport: string[] = [];
  const rowsBefore = initialRows.length;

  for (const op of operations) {
    switch (op.type) {
      case 'removeDuplicates': {
        const res = removeDuplicates(rows, op.subsetColumns);
        rows = res.rows;
        if (res.removedCount > 0) {
          changesReport.push(`Removed ${res.removedCount} duplicate rows.`);
        } else {
          changesReport.push('No duplicate rows found.');
        }
        break;
      }

      case 'dropNulls': {
        const res = dropNullRows(rows, op.columns);
        rows = res.rows;
        if (res.droppedCount > 0) {
          changesReport.push(`Dropped ${res.droppedCount} rows containing missing values.`);
        } else {
          changesReport.push('No missing value rows dropped.');
        }
        break;
      }

      case 'imputeMissing': {
        if (!op.column || !op.strategy) continue;
        const res = imputeMissingValues(rows, op.column, op.strategy, op.constantValue);
        rows = res.rows;
        if (res.imputedCount > 0) {
          changesReport.push(
            `Filled ${res.imputedCount} missing values in "${op.column}" using ${op.strategy} (${res.fillValueUsed}).`
          );
        } else {
          changesReport.push(`No missing values found in "${op.column}".`);
        }
        break;
      }

      case 'formatText': {
        if (!op.column || !op.action) continue;
        const res = formatTextColumn(rows, op.column, op.action as any);
        rows = res.rows;
        changesReport.push(`Formatted text in "${op.column}" (${op.action}): ${res.formattedCount} values updated.`);
        break;
      }

      case 'filterOutliers': {
        if (!op.column) continue;
        const res = filterOutliers(rows, op.column, op.method, op.action as any, op.factor);
        rows = res.rows;
        changesReport.push(
          `${op.action === 'drop' ? 'Dropped' : 'Capped'} ${res.affectedCount} outliers in "${op.column}" [Bounds: ${res.lowerBound} to ${res.upperBound}].`
        );
        break;
      }

      case 'dropColumn': {
        if (!op.column) continue;
        const targetCol = op.column;
        rows = rows.map((r) => {
          const { [targetCol]: _, ...rest } = r;
          return rest;
        });
        columns = columns.filter((c) => c.name !== targetCol);
        changesReport.push(`Dropped column "${targetCol}".`);
        break;
      }

      case 'renameColumn': {
        if (!op.oldName || !op.newName || op.oldName === op.newName) continue;
        const { oldName, newName } = op;
        rows = rows.map((r) => {
          const { [oldName]: val, ...rest } = r;
          return { ...rest, [newName]: val };
        });
        columns = columns.map((c) => (c.name === oldName ? { ...c, name: newName } : c));
        changesReport.push(`Renamed column "${oldName}" to "${newName}".`);
        break;
      }
    }
  }

  const cleanedColumns = recalculateColumnMetadata(rows, columns);

  return {
    cleanedRows: rows,
    cleanedColumns,
    changesReport,
    rowsBefore,
    rowsAfter: rows.length,
  };
};
