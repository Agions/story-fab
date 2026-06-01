/**
 * 项目核心常量（单一来源）
 * 所有业务常量定义在这里，src/constants/index.ts 和 src/shared/constants/settings.ts 重导出
 */

export const APP = {
  name: 'story-fab',
  version: '2.0.0',
  description: 'AI 驱动的专业视频内容创作平台',
  author: 'Agions',
  website: 'https://github.com/Agions/story-fab',
};

export const VIDEO_FORMATS = {
  input: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'],
  output: ['mp4', 'mov', 'webm', 'avi'],
};

export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

export const AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];

export const FILE_LIMITS = {
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxVideoSize: 10 * 1024 * 1024 * 1024, // 10GB
  maxAudioSize: 200 * 1024 * 1024, // 200MB
  maxImageSize: 20 * 1024 * 1024, // 20MB
};

export const VIDEO_PARAMS = {
  defaultBitrate: '8M',
  defaultFPS: 30,
  defaultResolution: '1920x1080',
};

export const AI_FEATURES = {
  autoEditing: true,
  autoSubtitle: true,
  smartCrop: true,
  voiceClone: false,
};

export const VOICE_OPTIONS = [
  { value: 'zh-CN-XiaoxiaoNeural', label: 'xiaoxiao' },
  { value: 'zh-CN-YunxiNeural', label: 'yunxi' },
  { value: 'zh-CN-YunyangNeural', label: 'yunyang' },
];

export const SCRIPT_STYLES = ['humorous', 'serious', 'casual', 'professional', 'emotional'];

export const SCRIPT_LENGTHS = [
  { value: 'short', label: '短 (30s-1min)', min: 30, max: 60 },
  { value: 'medium', label: '中 (1-3min)', min: 60, max: 180 },
  { value: 'long', label: '长 (3min+)', min: 180, max: 600 },
];

export const EFFECT_STYLES = ['fade', 'slide', 'zoom', 'cut', 'dissolve'];

export const PROJECT_TEMPLATES = [
  { id: 'blank', name: '空白项目', description: '从零开始创作' },
  { id: 'vlog', name: 'Vlog', description: '个人生活记录' },
  { id: 'tutorial', name: '教程', description: '知识讲解类视频' },
  { id: 'review', name: '评测', description: '产品评测类视频' },
];

export const HOTKEYS = {
  save: { key: 's', ctrl: true },
  undo: { key: 'z', ctrl: true },
  redo: { key: 'y', ctrl: true },
  delete: { key: 'Delete' },
  selectAll: { key: 'a', ctrl: true },
};

export const STORAGE_KEYS = {
  projects: 'storyfab_projects',
  settings: 'storyfab_settings',
  recent: 'storyfab_recent',
  cache: 'storyfab_cache',
  timeline: 'storyfab_timeline',
  auth: 'storyfab_auth',
  projectSaveBehavior: 'storyfab_project_save_behavior',
  projectAutoSave: 'storyfab_project_autosave',
};

export const API_ENDPOINTS = {
  base: '/api',
  upload: '/api/upload',
  project: '/api/project',
};

export const ERROR_MESSAGES = {
  uploadFailed: '文件上传失败',
  processingFailed: '处理失败',
  networkError: '网络错误',
};

export const SUCCESS_MESSAGES = {
  saved: '保存成功',
  uploaded: '上传成功',
  processed: '处理完成',
};

export const PROJECT_SAVE_BEHAVIOR_KEY = 'project_save_behavior';
export const PROJECT_AUTO_SAVE_KEY = 'project_autosave_enabled';

export type ProjectSaveBehavior = 'stay' | 'detail';

export const MODEL_PROVIDERS = {
  openai: { name: 'OpenAI', icon: '🤖' },
  anthropic: { name: 'Anthropic', icon: '🧠' },
  google: { name: 'Google', icon: '🔴' },
} as const;