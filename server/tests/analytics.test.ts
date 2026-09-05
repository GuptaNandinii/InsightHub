import { describe, it, expect } from 'vitest';
import { calculateNumericStats } from '../src/services/csvParser';
import { aggregateData } from '../src/services/aggregationService';

describe('Analytics & Math Services', () => {
  describe('calculateNumericStats', () => {
    it('should compute min, max, mean, median, sum and stdDev accurately', () => {
      const numbers = [10, 20, 30, 40, 50];
      const stats = calculateNumericStats(numbers);

      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.sum).toBe(150);
      expect(stats.stdDev).toBe(14.14);
    });

    it('should calculate median correctly for even-length arrays', () => {
      const numbers = [10, 20, 30, 40];
      const stats = calculateNumericStats(numbers);
      expect(stats.median).toBe(25);
    });

    it('should return empty stats object for empty input', () => {
      const stats = calculateNumericStats([]);
      expect(stats).toEqual({});
    });
  });

  describe('aggregateData', () => {
    const mockRows = [
      { Region: 'North', Sales: 100 },
      { Region: 'North', Sales: 200 },
      { Region: 'South', Sales: 300 },
      { Region: 'South', Sales: 150 },
      { Region: 'East', Sales: 50 },
    ];

    it('should aggregate with sum', () => {
      const res = aggregateData(mockRows, {
        xAxis: 'Region',
        yAxis: 'Sales',
        aggregation: 'sum',
      });

      const north = res.find((r) => r.name === 'North');
      const south = res.find((r) => r.name === 'South');
      const east = res.find((r) => r.name === 'East');

      expect(north?.value).toBe(300);
      expect(south?.value).toBe(450);
      expect(east?.value).toBe(50);
    });

    it('should aggregate with count', () => {
      const res = aggregateData(mockRows, {
        xAxis: 'Region',
        aggregation: 'count',
      });

      const north = res.find((r) => r.name === 'North');
      expect(north?.value).toBe(2);
    });

    it('should aggregate with average', () => {
      const res = aggregateData(mockRows, {
        xAxis: 'Region',
        yAxis: 'Sales',
        aggregation: 'avg',
      });

      const north = res.find((r) => r.name === 'North');
      expect(north?.value).toBe(150);
    });

    it('should format scatter points correctly', () => {
      const res = aggregateData(mockRows, {
        xAxis: 'Sales',
        yAxis: 'Sales',
        chartType: 'scatter',
      });

      expect(res.length).toBe(5);
      expect(res[0]).toHaveProperty('x');
      expect(res[0]).toHaveProperty('y');
    });
  });
});
