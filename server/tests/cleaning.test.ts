import { describe, it, expect } from 'vitest';
import {
  removeDuplicates,
  dropNullRows,
  imputeMissingValues,
  formatTextColumn,
  filterOutliers,
  executeCleaningPipeline,
} from '../src/services/dataCleaningService';
import { IColumnMeta } from '../src/models/Dataset';

describe('Data Cleaning Engine', () => {
  describe('Deduplication', () => {
    it('should remove exact duplicate records and report count', () => {
      const rows = [
        { id: 1, name: 'Alice', role: 'Engineer' },
        { id: 2, name: 'Bob', role: 'Designer' },
        { id: 1, name: 'Alice', role: 'Engineer' }, // Duplicate
        { id: 3, name: 'Charlie', role: 'Manager' },
      ];

      const res = removeDuplicates(rows);
      expect(res.rows.length).toBe(3);
      expect(res.removedCount).toBe(1);
      expect(res.rows.map((r) => r.id)).toEqual([1, 2, 3]);
    });

    it('should deduplicate based on subset of columns', () => {
      const rows = [
        { email: 'user@test.com', timestamp: '2024-01-01', status: 'A' },
        { email: 'user@test.com', timestamp: '2024-01-02', status: 'B' },
        { email: 'other@test.com', timestamp: '2024-01-03', status: 'A' },
      ];

      const res = removeDuplicates(rows, ['email']);
      expect(res.rows.length).toBe(2);
      expect(res.removedCount).toBe(1);
    });
  });

  describe('Missing Values', () => {
    it('should drop rows with missing values in target columns', () => {
      const rows = [
        { id: 1, score: 95, notes: null },
        { id: 2, score: null, notes: 'Good' },
        { id: 3, score: 80, notes: 'Pass' },
      ];

      const res = dropNullRows(rows, ['score']);
      expect(res.rows.length).toBe(2);
      expect(res.droppedCount).toBe(1);
      expect(res.rows.map((r) => r.id)).toEqual([1, 3]);
    });

    it('should impute numeric missing values using mean', () => {
      const rows = [
        { id: 1, val: 10 },
        { id: 2, val: 20 },
        { id: 3, val: null },
        { id: 4, val: 30 },
      ];

      const res = imputeMissingValues(rows, 'val', 'mean');
      expect(res.imputedCount).toBe(1);
      expect(res.fillValueUsed).toBe(20); // (10 + 20 + 30) / 3
      expect(res.rows[2].val).toBe(20);
    });

    it('should impute numeric missing values using median', () => {
      const rows = [
        { val: 10 },
        { val: 20 },
        { val: 100 }, // Outlier skewing mean
        { val: null },
      ];

      const res = imputeMissingValues(rows, 'val', 'median');
      expect(res.fillValueUsed).toBe(20);
      expect(res.rows[3].val).toBe(20);
    });

    it('should impute categorical missing values with mode (most frequent)', () => {
      const rows = [
        { category: 'Electronics' },
        { category: 'Electronics' },
        { category: 'Clothing' },
        { category: null },
      ];

      const res = imputeMissingValues(rows, 'category', 'mode');
      expect(res.fillValueUsed).toBe('Electronics');
      expect(res.rows[3].category).toBe('Electronics');
    });

    it('should impute missing values with a constant value', () => {
      const rows = [
        { name: 'Alpha', status: null },
        { name: 'Beta', status: 'Active' },
      ];

      const res = imputeMissingValues(rows, 'status', 'constant', 'Pending');
      expect(res.rows[0].status).toBe('Pending');
    });
  });

  describe('Text Formatting', () => {
    it('should trim leading and trailing spaces', () => {
      const rows = [
        { city: '  San Francisco  ' },
        { city: 'New York' },
      ];

      const res = formatTextColumn(rows, 'city', 'trim');
      expect(res.rows[0].city).toBe('San Francisco');
      expect(res.formattedCount).toBe(1);
    });

    it('should convert text to lowercase and uppercase', () => {
      const rows = [{ tag: 'HighPriority' }];
      const lowerRes = formatTextColumn(rows, 'tag', 'lowercase');
      expect(lowerRes.rows[0].tag).toBe('highpriority');

      const upperRes = formatTextColumn(rows, 'tag', 'uppercase');
      expect(upperRes.rows[0].tag).toBe('HIGHPRIORITY');
    });
  });

  describe('Outlier Detection & Filtering', () => {
    it('should detect and drop extreme numeric outliers using IQR', () => {
      const rows = [
        { metric: 10 },
        { metric: 12 },
        { metric: 11 },
        { metric: 13 },
        { metric: 12 },
        { metric: 14 },
        { metric: 1000 }, // Extreme outlier
      ];

      const res = filterOutliers(rows, 'metric', 'iqr', 'drop', 1.5);
      expect(res.affectedCount).toBe(1);
      expect(res.rows.length).toBe(6);
      expect(res.rows.some((r) => r.metric === 1000)).toBe(false);
    });

    it('should cap extreme outliers instead of dropping', () => {
      const rows = [
        { metric: 10 },
        { metric: 12 },
        { metric: 11 },
        { metric: 13 },
        { metric: 12 },
        { metric: 14 },
        { metric: 1000 },
      ];

      const res = filterOutliers(rows, 'metric', 'iqr', 'cap', 1.5);
      expect(res.affectedCount).toBe(1);
      expect(res.rows.length).toBe(7);
      expect(res.rows[6].metric).toBe(res.upperBound);
    });
  });

  describe('Cleaning Pipeline Integration', () => {
    it('should sequentially execute multiple cleaning steps and re-compute stats', () => {
      const initialRows = [
        { id: 1, name: '  Alice  ', score: 80 },
        { id: 2, name: 'Bob', score: null },
        { id: 3, name: 'Charlie', score: 90 },
        { id: 1, name: '  Alice  ', score: 80 }, // Duplicate
      ];

      const initialColumns: IColumnMeta[] = [
        { name: 'id', dataType: 'number', nullCount: 0, uniqueCount: 3 },
        { name: 'name', dataType: 'string', nullCount: 0, uniqueCount: 3 },
        { name: 'score', dataType: 'number', nullCount: 1, uniqueCount: 2 },
      ];

      const pipeline = executeCleaningPipeline(initialRows, initialColumns, [
        { type: 'removeDuplicates' },
        { type: 'formatText', column: 'name', action: 'trim' },
        { type: 'imputeMissing', column: 'score', strategy: 'mean' },
      ]);

      expect(pipeline.rowsBefore).toBe(4);
      expect(pipeline.rowsAfter).toBe(3);
      expect(pipeline.cleanedRows[0].name).toBe('Alice');
      expect(pipeline.cleanedRows[1].score).toBe(85); // Mean of 80 and 90
      expect(pipeline.changesReport.length).toBeGreaterThanOrEqual(3);

      const scoreCol = pipeline.cleanedColumns.find((c) => c.name === 'score');
      expect(scoreCol?.nullCount).toBe(0);
      expect(scoreCol?.stats?.mean).toBe(85);
    });
  });
});
