import api from './client';
import { User, Dataset, Dashboard, DatasetSummary } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  },
  register: async (userData: { name: string; email: string; password: string }) => {
    const res = await api.post('/auth/register', userData);
    return res.data.data;
  },
  demoLogin: async () => {
    const res = await api.post('/auth/demo-login');
    return res.data.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data.user as User;
  },
};

export const datasetApi = {
  getAll: async () => {
    const res = await api.get('/datasets');
    return res.data.data as Dataset[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/datasets/${id}`);
    return res.data.data as Dataset;
  },
  upload: async (formData: FormData) => {
    const res = await api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  getPreview: async (
    id: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) => {
    const res = await api.get(`/datasets/${id}/preview`, { params });
    return res.data.data;
  },
  queryChartData: async (
    id: string,
    params: {
      xAxis: string;
      yAxis?: string;
      aggregation?: string;
      chartType?: string;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      filterField?: string;
      filterValue?: string;
    }
  ) => {
    const res = await api.get(`/datasets/${id}/query`, { params });
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/datasets/${id}`);
    return res.data;
  },
};

export const analyticsApi = {
  getProfiling: async (datasetId: string) => {
    const res = await api.get(`/analytics/${datasetId}/profiling`);
    return res.data.data as DatasetSummary;
  },
  getColumnDistribution: async (datasetId: string, column: string) => {
    const res = await api.get(`/analytics/${datasetId}/distribution/${encodeURIComponent(column)}`);
    return res.data.data;
  },
};

export const dashboardApi = {
  getAll: async () => {
    const res = await api.get('/dashboards');
    return res.data.data as Dashboard[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/dashboards/${id}`);
    return res.data.data as Dashboard;
  },
  create: async (data: Partial<Dashboard>) => {
    const res = await api.post('/dashboards', data);
    return res.data.data as Dashboard;
  },
  update: async (id: string, data: Partial<Dashboard>) => {
    const res = await api.put(`/dashboards/${id}`, data);
    return res.data.data as Dashboard;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/dashboards/${id}`);
    return res.data;
  },
  getPublic: async (shareToken: string) => {
    const res = await api.get(`/dashboards/public/${shareToken}`);
    return res.data.data as Dashboard;
  },
};
