import { apiClient } from './client';
import type { ApiResponse, User } from '../types';

export const authApi = {
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const res = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });
    if (res.data.data?.token) {
      localStorage.setItem('onionq_token', res.data.data.token);
    }
    return res.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    localStorage.removeItem('onionq_token');
    const res = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },
};
