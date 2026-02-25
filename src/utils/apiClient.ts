/**
 * API 请求封装
 * 统一的请求/响应处理
 */
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证 token
    const token = localStorage.getItem('auth_token');
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
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    const { response } = error;
    
    // 统一错误处理
    if (response) {
      switch (response.status) {
        case 401:
          // 未授权，跳转登录
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('无权限访问');
          break;
        case 404:
          console.error('请求资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败');
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

// API 请求方法
export const api = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get(url, config);
  },
  
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post(url, data, config);
  },
  
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put(url, data, config);
  },
  
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.patch(url, data, config);
  },
  
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete(url, config);
  },
};

// 封装带错误处理的请求
export async function request<T>(
  fn: () => Promise<T>,
  options: { showError?: boolean; errorMsg?: string } = {}
): Promise<[T | null, Error | null]> {
  const { showError = true, errorMsg } = options;
  
  try {
    const data = await fn();
    return [data, null];
  } catch (error) {
    const err = error as Error;
    if (showError) {
      console.error(errorMsg || err.message);
    }
    return [null, err];
  }
}

export default apiClient;
