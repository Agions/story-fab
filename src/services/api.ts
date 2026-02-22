import axios from 'axios';
import { Project, VideoAnalysis, Script } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权错误
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const projectApi = {
  getAll: (): Promise<Project[]> => api.get('/projects'),
  getById: (id: string): Promise<Project> => api.get(`/projects/${id}`),
  create: (data: Partial<Project>): Promise<Project> => api.post('/projects', data),
  update: (id: string, data: Partial<Project>): Promise<Project> => api.put(`/projects/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/projects/${id}`),
};

export const analysisApi = {
  analyzeVideo: (videoUrl: string): Promise<VideoAnalysis> => api.post('/analysis', { videoUrl }),
  getAnalysis: (projectId: string): Promise<VideoAnalysis> => api.get(`/analysis/${projectId}`),
};

export const scriptApi = {
  getScript: (projectId: string, scriptId: string): Promise<Script> => 
    api.get(`/projects/${projectId}/scripts/${scriptId}`),
  generateScript: (projectId: string, data: { modelType: string; options?: any }): Promise<Script> => 
    api.post(`/projects/${projectId}/scripts`, data),
  updateScript: (projectId: string, scriptId: string, data: Partial<Script>): Promise<Script> =>
    api.put(`/projects/${projectId}/scripts/${scriptId}`, data),
  deleteScript: (projectId: string, scriptId: string): Promise<void> =>
    api.delete(`/projects/${projectId}/scripts/${scriptId}`),
};

export default api; 