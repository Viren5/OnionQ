import { apiClient } from './client';
import type { ApiResponse, OnionAnalysis } from '../types';

export const analysisApi = {
  triggerAnalysis: async (inspectionId: string): Promise<ApiResponse<{ count: number; status: string }>> => {
    const res = await apiClient.post<ApiResponse<{ count: number; status: string }>>(
      `/analysis/inspections/${inspectionId}/analyze`
    );
    return res.data;
  },

  getResults: async (inspectionId: string): Promise<ApiResponse<OnionAnalysis[]>> => {
    const res = await apiClient.get<ApiResponse<OnionAnalysis[]>>(
      `/analysis/inspections/${inspectionId}`
    );
    return res.data;
  },

  getOnion: async (onionId: string): Promise<ApiResponse<OnionAnalysis>> => {
    const res = await apiClient.get<ApiResponse<OnionAnalysis>>(`/analysis/onions/${onionId}`);
    return res.data;
  },
};
