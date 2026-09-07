import { apiClient } from './client';
import type { ApiResponse, Report } from '../types';

export const reportsApi = {
  generate: async (inspectionId: string): Promise<ApiResponse<Report>> => {
    const response = await apiClient.post<ApiResponse<Report>>(
      `/reports/inspections/${inspectionId}`
    );
    return response.data;
  },

  getByInspection: async (inspectionId: string): Promise<ApiResponse<Report>> => {
    const response = await apiClient.get<ApiResponse<Report>>(
      `/reports/inspections/${inspectionId}`
    );
    return response.data;
  },
};
