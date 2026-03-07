/**
 * 应用配置
 * 集中管理所有配置项，禁止硬编码
 */

// 应用信息
export const APP_CONFIG = {
  name: 'ClipFlow',
  version: '1.0.0',
  description: 'AI驱动的专业视频内容创作平台',
  repository: 'https://github.com/Agions/clipflow',
  license: 'MIT'
} as const;

// 存储配置
export const STORAGE_CONFIG = {
  prefix: 'clipflow_',
  keys: {
    store: 'clipflow-store',
    settings: 'clipflow-settings',
    projects: 'clipflow-projects',
    cache: 'clipflow-cache'
  }
} as const;

// API 配置
export const API_CONFIG = {
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000
} as const;

// 视频处理配置
export const VIDEO_CONFIG = {
  maxFileSize: 1024 * 1024 * 1024, // 1GB
  supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maxDuration: 3600, // 1小时
  thumbnailSize: { width: 320, height: 180 }
} as const;

// 导出配置
export const EXPORT_CONFIG = {
  formats: ['mp4', 'mov', 'webm'],
  qualities: ['low', 'medium', 'high', 'ultra'],
  defaultQuality: 'high'
} as const;

// 主题配置
export const THEME_CONFIG = {
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d'
  }
} as const;
