import { apiClient } from './client';
import type { ApiResponse, OnionAnalysis, OnionClassification, Verification, VerificationDecision } from '../types';

export const verificationApi = {
  listPending: async (): Promise<ApiResponse<OnionAnalysis[]>> => {
    const res = await apiClient.get<ApiResponse<OnionAnalysis[]>>('/verification');
    return res.data;
  },

  getPendingByInspection: async (inspectionId: string): Promise<ApiResponse<OnionAnalysis[]>> => {
    const res = await apiClient.get<ApiResponse<OnionAnalysis[]>>(
      `/verification/inspections/${inspectionId}`
    );
    return res.data;
  },

  submitDecision: async (
    onionId: string,
    decision: VerificationDecision,
    inspectorClassification?: OnionClassification,
    reason?: string
  ): Promise<ApiResponse<Verification>> => {
    const res = await apiClient.post<ApiResponse<Verification>>(
      `/verification/onions/${onionId}`,
      { decision, inspectorClassification, reason }
    );
    return res.data;
  },
};
