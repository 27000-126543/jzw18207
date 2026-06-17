import api from './client';
import type {
  Project,
  QRCode,
  QRCodeStyle,
  Template,
  AnalyticsSummary,
  TrendDataPoint,
  GeoData,
  DeviceData,
  ScanLog,
  PagedResponse,
} from '../../shared/types';

export const qrcodeApi = {
  list: (params: {
    projectId?: string;
    status?: string;
    type?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponse<QRCode>> =>
    api.get('/qrcodes', { params: { page: 1, pageSize: 20, ...params } }),

  get: (id: string): Promise<QRCode> => api.get(`/qrcodes/${id}`),

  getScans: (id: string): Promise<ScanLog[]> => api.get(`/qrcodes/${id}/scans`),

  update: (id: string, data: Partial<QRCode>): Promise<QRCode> =>
    api.put(`/qrcodes/${id}`, data),

  remove: (id: string): Promise<void> => api.delete(`/qrcodes/${id}`),

  batchGenerate: (data: {
    contents: Array<{ url: string; name?: string }>;
    projectId?: string;
    style: QRCodeStyle;
    isDynamic: boolean;
    expirationDate?: string;
  }): Promise<{ ids: string[]; downloadToken: string }> =>
    api.post('/qrcodes/batch-generate', data),

  batch: (data: {
    ids: string[];
    action: 'disable' | 'enable' | 'delete' | 'updateUrl' | 'extend';
    payload?: any;
  }): Promise<void> => api.post('/qrcodes/batch', data),

  getDownloadUrl: (token: string) => `/api/qrcodes/download/${token}`,
  getImageUrl: (id: string) => `/api/qrcodes/${id}/image`,
};

export const projectApi = {
  list: (): Promise<Project[]> => api.get('/projects'),
  get: (id: string): Promise<Project> => api.get(`/projects/${id}`),
  create: (data: Partial<Project>): Promise<Project> => api.post('/projects', data),
  update: (id: string, data: Partial<Project>): Promise<Project> =>
    api.put(`/projects/${id}`, data),
  remove: (id: string): Promise<void> => api.delete(`/projects/${id}`),
};

export const analyticsApi = {
  summary: (params?: {
    qrcodeId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsSummary> => api.get('/analytics/summary', { params }),

  trend: (params: {
    qrcodeId?: string;
    projectId?: string;
    period?: 'day' | 'week' | 'month';
  }): Promise<TrendDataPoint[]> => api.get('/analytics/trend', { params: { period: 'day', ...params } }),

  geo: (params?: { qrcodeId?: string; projectId?: string }): Promise<GeoData[]> =>
    api.get('/analytics/geo', { params }),

  devices: (params: {
    qrcodeId?: string;
    projectId?: string;
    field?: 'device_type' | 'os' | 'browser';
  }): Promise<DeviceData[]> => api.get('/analytics/devices', { params: { field: 'device_type', ...params } }),
};

export const templateApi = {
  list: (category?: string): Promise<Template[]> =>
    api.get('/templates', { params: category ? { category } : {} }),
  get: (id: string): Promise<Template> => api.get(`/templates/${id}`),
  create: (data: Partial<Template>): Promise<Template> => api.post('/templates', data),
  update: (id: string, data: Partial<Template>): Promise<Template> =>
    api.put(`/templates/${id}`, data),
  remove: (id: string): Promise<void> => api.delete(`/templates/${id}`),
};
