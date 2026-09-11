import { apiClient, requestWithMockFallback } from './client';
import type { ApiResponse, OnionAnalysis } from '../types';
import { mockOnionDetections } from './mockData';

let localDetections: Record<string, OnionAnalysis[]> = { ...mockOnionDetections };

export const analysisApi = {
  triggerAnalysis: async (inspectionId: string): Promise<ApiResponse<{ count: number }>> => {
    return requestWithMockFallback<ApiResponse<{ count: number }>>(
      () => apiClient.post<ApiResponse<{ count: number }>>(`/analysis/inspections/${inspectionId}/analyze`),
      () => {
        const detections = localDetections[inspectionId] || mockOnionDetections['insp_101'];
        return {
          success: true,
          message: 'AI detection and classification completed',
          data: { count: detections.length },
        };
      }
    );
  },

  getResults: async (inspectionId: string): Promise<ApiResponse<OnionAnalysis[]>> => {
    return requestWithMockFallback<ApiResponse<OnionAnalysis[]>>(
      () => apiClient.get<ApiResponse<OnionAnalysis[]>>(`/analysis/inspections/${inspectionId}`),
      () => {
        const detections = localDetections[inspectionId] || mockOnionDetections['insp_101'];
        return {
          success: true,
          data: detections,
        };
      }
    );
  },

  getOnion: async (onionId: string): Promise<ApiResponse<OnionAnalysis>> => {
    return requestWithMockFallback<ApiResponse<OnionAnalysis>>(
      () => apiClient.get<ApiResponse<OnionAnalysis>>(`/analysis/onions/${onionId}`),
      () => {
        for (const list of Object.values(localDetections)) {
          const match = list.find((o) => o._id === onionId);
          if (match) return { success: true, data: match };
        }
        return { success: true, data: mockOnionDetections['insp_101'][0] };
      }
    );
  },
};
