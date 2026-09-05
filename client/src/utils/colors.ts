import { ColorPalette } from '../types';

export const PALETTES: Record<ColorPalette, string[]> = {
  indigo: ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#3730a3', '#4338ca'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#065f46'],
  cyberpunk: ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'],
  sunset: ['#f97316', '#fb923c', '#ef4444', '#f59e0b', '#dc2626', '#b91c1c'],
  ocean: ['#0284c7', '#0ea5e9', '#38bdf8', '#06b6d4', '#2563eb', '#1d4ed8'],
  monochrome: ['#475569', '#64748b', '#94a3b8', '#334155', '#1e293b', '#0f172a'],
};

export const getPaletteColors = (palette: ColorPalette): string[] => {
  return PALETTES[palette] || PALETTES.indigo;
};

export const formatNumber = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  if (Math.abs(val) >= 1_000_000) {
    return (val / 1_000_000).toFixed(1) + 'M';
  }
  if (Math.abs(val) >= 1_000) {
    return (val / 1_000).toFixed(1) + 'k';
  }
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};
