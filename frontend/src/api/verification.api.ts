import { apiClient, requestWithMockFallback } from './client';
import type { ApiResponse, OnionAnalysis, OnionClassification, Verification, VerificationDecision } from '../types';
import { mockCurrentUser, mockOnionDetections } from './mockData';

export const verificationApi = {
  listPending: async (): Promise<ApiResponse<OnionAnalysis[]>> => {
    return requestWithMockFallback<ApiResponse<OnionAnalysis[]>>(
      () => apiClient.get<ApiResponse<OnionAnalysis[]>>('/verification'),
      () => {
        const pending: OnionAnalysis[] = [];
        Object.values(mockOnionDetections).forEach((list) => {
          list.forEach((onion) => {
            if (onion.verificationStatus === 'pending') {
              pending.push(onion);
            }
          });
        });
        return {
          success: true,
          data: pending,
        };
      }
    );
  },

  getPendingByInspection: async (inspectionId: string): Promise<ApiResponse<OnionAnalysis[]>> => {
    return requestWithMockFallback<ApiResponse<OnionAnalysis[]>>(
      () => apiClient.get<ApiResponse<OnionAnalysis[]>>(`/verification/inspections/${inspectionId}`),
      () => {
        const list = mockOnionDetections[inspectionId] || [];
        const pending = list.filter((o) => o.verificationStatus === 'pending');
        return {
          success: true,
          data: pending,
        };
      }
    );
  },

  submitDecision: async (
    onionId: string,
    decision: VerificationDecision,
    inspectorClassification?: OnionClassification,
    reason?: string
  ): Promise<ApiResponse<Verification>> => {
    return requestWithMockFallback<ApiResponse<Verification>>(
      () =>
        apiClient.post<ApiResponse<Verification>>(`/verification/onions/${onionId}`, {
          decision,
          inspectorClassification,
          reason,
        }),
      () => {
        // Update the mock detection status
        Object.values(mockOnionDetections).forEach((list) => {
          const item = list.find((o) => o._id === onionId);
          if (item) {
            item.verificationStatus = decision === 'confirm_ai' ? 'verified' : 'overridden';
            if (decision === 'override' && inspectorClassification) {
              item.classification = inspectorClassification;
            }
          }
        });

        const newVerification: Verification = {
          _id: `ver_${Date.now()}`,
          onionAnalysisId: onionId,
          inspectionId: 'insp_101',
          inspectorId: mockCurrentUser,
          decision,
          inspectorClassification,
          reason,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          message: 'Human verification decision recorded',
          data: newVerification,
        };
      }
    );
  },
};
