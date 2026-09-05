import csv from 'csv-parser';
import { Readable } from 'stream';
import { DataType, IColumnMeta, IColumnStats } from '../models/Dataset';

export interface ParsedCSVResult {
  rowCount: number;
  columnCount: number;
  columns: IColumnMeta[];
  rows: Record<string, any>[];
}

/**
 * Infer data type of a value string
 */
const inferValueType = (val: string): DataType => {
  const trimmed = val.trim();
  if (trimmed === '') return 'string';

  // Boolean check
  if (['true', 'false', 'yes', 'no'].includes(trimmed.toLowerCase())) {
    return 'boolean';
  }

  // Number check (supports commas or decimals, but handles basic numbers cleanly)
  const cleanNumber = trimmed.replace(/[\$,]/g, '');
  if (!isNaN(Number(cleanNumber)) && cleanNumber !== '') {
    return 'number';
  }

  // Date check (only for standard recognizable date patterns like YYYY-MM-DD or MM/DD/YYYY)
  if (
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed)
  ) {
    const timestamp = Date.parse(trimmed);
    if (!isNaN(timestamp)) {
      return 'date';
    }
  }

  return 'string';
};

/**
 * Calculate descriptive statistics for an array of numbers
 */
export const calculateNumericStats = (values: number[]): IColumnStats => {
  if (values.length === 0) {
    return {};
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = Math.round((sum / count) * 100) / 100;

  // Median
  let median: number;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  } else {
    median = Math.round(sorted[mid] * 100) / 100;
  }

  // Standard deviation
  const variance =
    sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

  return {
    min,
    max,
    mean,
    median,
    stdDev,
    sum: Math.round(sum * 100) / 100,
  };
};

/**
 * Parse CSV buffer into structured rows and infer schema + compute statistics
 */
export const parseCSVBuffer = async (buffer: Buffer): Promise<ParsedCSVResult> => {
  return new Promise((resolve, reject) => {
    const rawRows: Record<string, string>[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
        })
      )
      .on('data', (row: Record<string, string>) => {
        rawRows.push(row);
      })
      .on('error', (err: Error) => {
        reject(new Error(`Failed to parse CSV file: ${err.message}`));
      })
      .on('end', () => {
        if (rawRows.length === 0) {
          return resolve({
            rowCount: 0,
            columnCount: 0,
            columns: [],
            rows: [],
          });
        }

        const headers = Object.keys(rawRows[0]);
        const columns: IColumnMeta[] = [];

        // For each header, infer data type and compute stats
        for (const header of headers) {
          const rawValues = rawRows.map((r) => r[header]);
          const nonEmptyValues = rawValues.filter(
            (v) => v !== undefined && v !== null && v.trim() !== ''
          );
          const nullCount = rawRows.length - nonEmptyValues.length;

          // Determine predominant type
          const typeCounts: Record<DataType, number> = {
            number: 0,
            date: 0,
            boolean: 0,
            string: 0,
          };

          for (const val of nonEmptyValues) {
            const t = inferValueType(val);
            typeCounts[t]++;
          }

          let inferredType: DataType = 'string';
          const totalValid = nonEmptyValues.length;

          if (totalValid > 0) {
            if (typeCounts.number / totalValid >= 0.8) {
              inferredType = 'number';
            } else if (typeCounts.date / totalValid >= 0.8) {
              inferredType = 'date';
            } else if (typeCounts.boolean / totalValid >= 0.8) {
              inferredType = 'boolean';
            } else {
              inferredType = 'string';
            }
          }

          // Count unique values and top frequencies
          const freqMap: Record<string, number> = {};
          const numericValues: number[] = [];

          for (const val of nonEmptyValues) {
            const strVal = val.trim();
            freqMap[strVal] = (freqMap[strVal] || 0) + 1;

            if (inferredType === 'number') {
              const cleaned = strVal.replace(/[\$,]/g, '');
              const num = Number(cleaned);
              if (!isNaN(num)) {
                numericValues.push(num);
              }
            }
          }

          const uniqueCount = Object.keys(freqMap).length;
          let stats: IColumnStats | undefined;

          if (inferredType === 'number') {
            stats = calculateNumericStats(numericValues);
          } else {
            // Get top 10 values for categorical breakdown
            const sortedTop = Object.entries(freqMap)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([value, count]) => ({ value, count }));
            stats = { topValues: sortedTop };
          }

          columns.push({
            name: header,
            dataType: inferredType,
            nullCount,
            uniqueCount,
            stats,
          });
        }

        // Convert raw rows into typed values
        const parsedRows = rawRows.map((raw) => {
          const typedRow: Record<string, any> = {};
          for (const col of columns) {
            const rawVal = raw[col.name];
            if (rawVal === undefined || rawVal === null || rawVal.trim() === '') {
              typedRow[col.name] = null;
            } else if (col.dataType === 'number') {
              const cleaned = rawVal.trim().replace(/[\$,]/g, '');
              const num = Number(cleaned);
              typedRow[col.name] = isNaN(num) ? null : num;
            } else if (col.dataType === 'boolean') {
              typedRow[col.name] = ['true', 'yes', '1'].includes(rawVal.trim().toLowerCase());
            } else {
              typedRow[col.name] = rawVal.trim();
            }
          }
          return typedRow;
        });

        resolve({
          rowCount: parsedRows.length,
          columnCount: columns.length,
          columns,
          rows: parsedRows,
        });
      });
  });
};
