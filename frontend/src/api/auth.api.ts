import { apiClient, requestWithMockFallback } from './client';
import type { ApiResponse, User } from '../types';
import { mockCurrentUser } from './mockData';

export const authApi = {
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return requestWithMockFallback<ApiResponse<User>>(
      () => apiClient.get<ApiResponse<User>>('/auth/me'),
      () => ({
        success: true,
        data: mockCurrentUser,
      })
    );
  },

  login: async (email: string, _password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    return requestWithMockFallback<ApiResponse<{ token: string; user: User }>>(
      () => apiClient.post('/auth/login', { email, _password }),
      () => {
        const token = 'mock_jwt_token_onionq_inspector';
        localStorage.setItem('onionq_token', token);
        return {
          success: true,
          message: 'Logged in successfully',
          data: {
            token,
            user: { ...mockCurrentUser, email },
          },
        };
      }
    );
  },

  logout: async (): Promise<ApiResponse<null>> => {
    localStorage.removeItem('onionq_token');
    return requestWithMockFallback<ApiResponse<null>>(
      () => apiClient.post('/auth/logout'),
      () => ({
        success: true,
        data: null,
      })
    );
  },
};
