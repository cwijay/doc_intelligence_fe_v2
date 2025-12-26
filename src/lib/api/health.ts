import { AxiosResponse } from 'axios';
import api from './base';
import { HealthCheck } from '@/types/api';

export const healthApi = {
  check: async (): Promise<HealthCheck> => {
    const response: AxiosResponse<HealthCheck> = await api.get('/health');
    return response.data;
  },

  status: async (): Promise<any> => {
    const response = await api.get('/status');
    return response.data;
  },

  ready: async (): Promise<any> => {
    const response = await api.get('/ready');
    return response.data;
  },

  live: async (): Promise<any> => {
    const response = await api.get('/live');
    return response.data;
  },

  metrics: async (): Promise<any> => {
    const response = await api.get('/metrics');
    return response.data;
  },
};