import { apiClient } from './client';
import type { ApiResponse, Report } from '../types';

export const reportsApi = {
  generate: async (inspectionId: string): Promise<ApiResponse<Report>> => {
    const res = await apiClient.post<ApiResponse<Report>>(
      `/reports/inspections/${inspectionId}`
    );
    return res.data;
  },

  getByInspection: async (inspectionId: string): Promise<ApiResponse<Report>> => {
    const res = await apiClient.get<ApiResponse<Report>>(
      `/reports/inspections/${inspectionId}`
    );
    return res.data;
  },

  verifyByToken: async (token: string): Promise<ApiResponse<Report>> => {
    const res = await apiClient.get<ApiResponse<Report>>(`/reports/verify/${token}`);
    return res.data;
  },
};
