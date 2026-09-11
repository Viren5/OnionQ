import { apiClient, requestWithMockFallback } from './client';
import type { ApiResponse, Report } from '../types';
import { mockReports } from './mockData';

export const reportsApi = {
  generate: async (inspectionId: string): Promise<ApiResponse<Report>> => {
    return requestWithMockFallback<ApiResponse<Report>>(
      () => apiClient.post<ApiResponse<Report>>(`/reports/inspections/${inspectionId}`),
      () => {
        const existing = mockReports[inspectionId] || mockReports['insp_101'];
        return {
          success: true,
          message: 'Report generated successfully',
          data: {
            ...existing,
            inspectionId,
            qrVerificationToken: `oq-cert-${Date.now().toString(36)}`,
            createdAt: new Date().toISOString(),
          },
        };
      }
    );
  },

  getByInspection: async (inspectionId: string): Promise<ApiResponse<Report>> => {
    return requestWithMockFallback<ApiResponse<Report>>(
      () => apiClient.get<ApiResponse<Report>>(`/reports/inspections/${inspectionId}`),
      () => {
        const report = mockReports[inspectionId] || mockReports['insp_101'];
        return {
          success: true,
          data: report,
        };
      }
    );
  },

  verifyByToken: async (token: string): Promise<ApiResponse<Report>> => {
    return requestWithMockFallback<ApiResponse<Report>>(
      () => apiClient.get<ApiResponse<Report>>(`/reports/verify/${token}`),
      () => {
        const report = Object.values(mockReports).find((r) => r.qrVerificationToken === token) || mockReports['insp_101'];
        return {
          success: true,
          data: report,
        };
      }
    );
  },
};
