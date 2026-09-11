import { apiClient, requestWithMockFallback } from './client';
import type { ApiResponse, BatchInfo, Inspection, InspectionStatus } from '../types';
import { mockCurrentUser, mockInspections } from './mockData';

// In-memory lot storage for simulated frontend mutations
let localInspections = [...mockInspections];

export const inspectionsApi = {
  list: async (params?: { status?: InspectionStatus; search?: string }): Promise<ApiResponse<Inspection[]>> => {
    return requestWithMockFallback<ApiResponse<Inspection[]>>(
      () => apiClient.get<ApiResponse<Inspection[]>>('/inspections', { params }),
      () => {
        let results = [...localInspections];
        if (params?.status) {
          results = results.filter((i) => i.status === params.status);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          results = results.filter(
            (i) =>
              i.batchInfo.batchId.toLowerCase().includes(s) ||
              i.batchInfo.procurementCentre.toLowerCase().includes(s) ||
              i.batchInfo.farmerName?.toLowerCase().includes(s) ||
              i.batchInfo.variety?.toLowerCase().includes(s)
          );
        }
        return {
          success: true,
          data: results,
        };
      }
    );
  },

  getById: async (id: string): Promise<ApiResponse<Inspection>> => {
    return requestWithMockFallback<ApiResponse<Inspection>>(
      () => apiClient.get<ApiResponse<Inspection>>(`/inspections/${id}`),
      () => {
        const item = localInspections.find((i) => i._id === id) || localInspections[0];
        return {
          success: true,
          data: item,
        };
      }
    );
  },

  create: async (batchInfo: BatchInfo): Promise<ApiResponse<Inspection>> => {
    return requestWithMockFallback<ApiResponse<Inspection>>(
      () => apiClient.post<ApiResponse<Inspection>>('/inspections', { batchInfo }),
      () => {
        const newInspection: Inspection = {
          _id: `insp_${Date.now()}`,
          batchInfo,
          inspectorId: mockCurrentUser,
          status: 'draft',
          imageReferences: [],
          totalOnionsDetected: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localInspections = [newInspection, ...localInspections];
        return {
          success: true,
          message: 'Inspection batch created successfully',
          data: newInspection,
        };
      }
    );
  },

  uploadImages: async (id: string, imageFiles: File[]): Promise<ApiResponse<Inspection>> => {
    const formData = new FormData();
    imageFiles.forEach((f) => formData.append('images', f));

    return requestWithMockFallback<ApiResponse<Inspection>>(
      () =>
        apiClient.post<ApiResponse<Inspection>>(`/inspections/${id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      () => {
        const target = localInspections.find((i) => i._id === id);
        if (target) {
          // Add temporary object URLs for demo preview
          const newUrls = imageFiles.map((f) => URL.createObjectURL(f));
          target.imageReferences = [...target.imageReferences, ...newUrls];
          target.status = 'images_uploaded';
          target.updatedAt = new Date().toISOString();
        }
        return {
          success: true,
          message: `${imageFiles.length} image(s) uploaded successfully`,
          data: target || localInspections[0],
        };
      }
    );
  },

  cancel: async (id: string): Promise<ApiResponse<Inspection>> => {
    return requestWithMockFallback<ApiResponse<Inspection>>(
      () => apiClient.patch<ApiResponse<Inspection>>(`/inspections/${id}/cancel`),
      () => {
        const target = localInspections.find((i) => i._id === id);
        if (target) {
          target.status = 'cancelled';
        }
        return {
          success: true,
          message: 'Inspection cancelled',
          data: target || localInspections[0],
        };
      }
    );
  },
};
