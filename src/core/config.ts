/**
 * 应用配置
 * 统一管理环境变量和配置
 */

export interface AppConfig {
  // API 配置
  apiBaseUrl: string;
  apiTimeout: number;
  
  // AI 模型配置
  defaultModel: string;
  modelProviders: Record<string, { apiKey: string; endpoint: string }>;
  
  // 视频处理配置
  maxVideoSize: number; // MB
  supportedFormats: string[];
  defaultExportFormat: string;
  
  // 缓存配置
  cacheEnabled: boolean;
  cacheMaxSize: number; // MB
  cacheTTL: number; // ms
  
  // 性能配置
  enableHardwareAcceleration: boolean;
  workerThreads: number;
  
  // 日志配置
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableRemoteLogging: boolean;
}

/**
 * 获取应用配置
 */
export function getConfig(): AppConfig {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    
    defaultModel: import.meta.env.VITE_DEFAULT_MODEL || 'gpt-4',
    modelProviders: {
      openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        endpoint: import.meta.env.VITE_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
      },
      anthropic: {
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        endpoint: import.meta.env.VITE_ANTHROPIC_ENDPOINT || 'https://api.anthropic.com',
      },
    },
    
    maxVideoSize: parseInt(import.meta.env.VITE_MAX_VIDEO_SIZE || '500'),
    supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    defaultExportFormat: import.meta.env.VITE_DEFAULT_EXPORT_FORMAT || 'mp4',
    
    cacheEnabled: import.meta.env.VITE_CACHE_ENABLED !== 'false',
    cacheMaxSize: parseInt(import.meta.env.VITE_CACHE_MAX_SIZE || '500'),
    cacheTTL: parseInt(import.meta.env.VITE_CACHE_TTL || '3600000'),
    
    enableHardwareAcceleration: import.meta.env.VITE_ENABLE_HW_ACCEL !== 'false',
    workerThreads: parseInt(import.meta.env.VITE_WORKER_THREADS || '4'),
    
    logLevel: (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    enableRemoteLogging: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
  };
}

export const appConfig = getConfig();
export default appConfig;
