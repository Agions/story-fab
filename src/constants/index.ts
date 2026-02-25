/**
 * 项目常量定义
 */

// 应用信息
export const APP = {
  name: 'ClipFlow',
  version: '2.0.0',
  description: 'AI 驱动的专业视频内容创作平台',
  author: 'Agions',
  website: 'https://github.com/Agions/ClipFlow',
};

// 支持的视频格式
export const VIDEO_FORMATS = {
  input: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'],
  output: ['mp4', 'mov', 'webm', 'avi'],
};

// 支持的图片格式
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

// 支持的音频格式
export const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

// 文件大小限制 (MB)
export const FILE_LIMITS = {
  video: 2048, // 2GB
  image: 10,    // 10MB
  audio: 50,    // 50MB
};

// 视频参数
export const VIDEO_PARAMS = {
  resolutions: [
    { label: '480p', value: '480p', width: 854, height: 480 },
    { label: '720p', value: '720p', width: 1280, height: 720 },
    { label: '1080p', value: '1080p', width: 1920, height: 1080 },
    { label: '2K', value: '1440p', width: 2560, height: 1440 },
    { label: '4K', value: '2160p', width: 3840, height: 2160 },
  ],
  frameRates: [24, 25, 30, 60],
  bitrates: {
    low: 1_000_000,
    medium: 5_000_000,
    high: 10_000_000,
    ultra: 30_000_000,
  },
};

// AI 功能类型
export const AI_FEATURES = {
  videoNarration: {
    id: 'video-narration',
    name: 'AI 视频解说',
    icon: 'VideoCameraOutlined',
    description: '对视频内容进行专业解说',
  },
  firstPerson: {
    id: 'first-person',
    name: 'AI 第一人称',
    icon: 'UserOutlined',
    description: '以第一人称视角叙述',
  },
  remix: {
    id: 'remix',
    name: 'AI 混剪',
    icon: 'ScissorOutlined',
    description: '自动识别精彩片段生成混剪',
  },
};

// 配音音色选项
export const VOICE_OPTIONS = [
  { value: 'female_zh', label: '女声 (中文)', desc: '温柔甜美' },
  { value: 'male_zh', label: '男声 (中文)', desc: '成熟稳重' },
  { value: 'female_en', label: '女声 (英文)', desc: '活泼自然' },
  { value: 'male_en', label: '男声 (英文)', desc: '专业正式' },
  { value: 'neutral', label: '中性声音', desc: '通用场景' },
];

// 文案风格
export const SCRIPT_STYLES = [
  { value: 'formal', label: '正式', desc: '专业、严谨' },
  { value: 'casual', label: '轻松', desc: '活泼、亲切' },
  { value: 'humor', label: '幽默', desc: '搞笑、诙谐' },
  { value: 'emotional', label: '情感', desc: '深情、感人' },
];

// 文案长度
export const SCRIPT_LENGTHS = [
  { value: 'short', label: '短视频', desc: '30秒以内', wordCount: 80 },
  { value: 'medium', label: '中视频', desc: '1-3分钟', wordCount: 300 },
  { value: 'long', label: '长视频', desc: '3-10分钟', wordCount: 800 },
];

// 特效风格
export const EFFECT_STYLES = [
  { value: 'none', label: '无', desc: '保持原样' },
  { value: 'cinematic', label: '电影感', desc: '调色+暗角' },
  { value: 'vivid', label: '鲜艳', desc: '色彩增强' },
  { value: 'retro', label: '复古', desc: '怀旧色调' },
  { value: 'cool', label: '冷色调', desc: '蓝色系' },
  { value: 'warm', label: '暖色调', desc: '橙色系' },
];

// 项目模板
export const PROJECT_TEMPLATES = [
  { id: 'marketing', name: '营销推广', color: '#1890ff' },
  { id: 'education', name: '教育培训', color: '#52c41a' },
  { id: 'entertainment', name: '娱乐内容', color: '#fa8c16' },
  { id: 'news', name: '新闻资讯', color: '#eb2f96' },
  { id: 'custom', name: '自定义', color: '#722ed1' },
];

// 快捷键配置
export const HOTKEYS = {
  save: { key: 's', ctrl: true, label: '保存' },
  undo: { key: 'z', ctrl: true, label: '撤销' },
  redo: { key: 'y', ctrl: true, label: '重做' },
  play: { key: ' ', label: '播放/暂停' },
  bold: { key: 'b', ctrl: true, label: '粗体' },
  italic: { key: 'i', ctrl: true, label: '斜体' },
  preview: { key: 'p', ctrl: true, shift: true, label: '预览' },
  export: { key: 'e', ctrl: true, label: '导出' },
};

// 存储键名
export const STORAGE_KEYS = {
  user: 'clipflow_user',
  projects: 'clipflow_projects',
  settings: 'clipflow_settings',
  theme: 'clipflow_theme',
  language: 'clipflow_language',
  recentFiles: 'clipflow_recent_files',
};

// API 端点
export const API_ENDPOINTS = {
  // 项目
  projects: '/api/projects',
  project: (id: string) => `/api/projects/${id}`,
  
  // 视频
  videos: '/api/videos',
  video: (id: string) => `/api/videos/${id}`,
  videoUpload: '/api/videos/upload',
  
  // AI
  aiAnalyze: '/api/ai/analyze',
  aiGenerate: '/api/ai/generate',
  aiVoice: '/api/ai/voice',
  
  // 导出
  export: '/api/export',
  exportStatus: (id: string) => `/api/export/${id}`,
};

// 错误消息
export const ERROR_MESSAGES = {
  network: '网络错误，请检查网络连接',
  server: '服务器错误，请稍后重试',
  unauthorized: '登录已过期，请重新登录',
  forbidden: '无权限执行此操作',
  notFound: '请求的资源不存在',
  upload: '上传失败，请重试',
  export: '导出失败，请重试',
};

// 成功消息
export const SUCCESS_MESSAGES = {
  saved: '保存成功',
  deleted: '删除成功',
  uploaded: '上传成功',
  exported: '导出成功',
  copied: '已复制到剪贴板',
};
