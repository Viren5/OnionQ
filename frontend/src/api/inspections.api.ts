import { apiClient } from './client';
import type { ApiResponse, BatchInfo, Inspection, InspectionStatus } from '../types';

export const inspectionsApi = {
  list: async (params?: { status?: InspectionStatus; search?: string }): Promise<ApiResponse<Inspection[]>> => {
    const res = await apiClient.get<ApiResponse<Inspection[]>>('/inspections', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Inspection>> => {
    const res = await apiClient.get<ApiResponse<Inspection>>(`/inspections/${id}`);
    return res.data;
  },

  create: async (batchInfo: BatchInfo): Promise<ApiResponse<Inspection>> => {
    const res = await apiClient.post<ApiResponse<Inspection>>('/inspections', { batchInfo });
    return res.data;
  },

  uploadImages: async (id: string, imageFiles: File[]): Promise<ApiResponse<Inspection>> => {
    const formData = new FormData();
    imageFiles.forEach((f) => formData.append('images', f));
    const res = await apiClient.post<ApiResponse<Inspection>>(`/inspections/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  cancel: async (id: string): Promise<ApiResponse<Inspection>> => {
    const res = await apiClient.patch<ApiResponse<Inspection>>(`/inspections/${id}/cancel`);
    return res.data;
  },
};
