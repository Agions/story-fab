/**
 * 共享常量定义
 * 
 * 注意：此文件从 src/constants 重新导出所有共享常量
 * 以保持常量定义的单一来源
 */

export {
  APP,
  VIDEO_FORMATS,
  IMAGE_FORMATS,
  AUDIO_FORMATS,
  FILE_LIMITS,
  VIDEO_PARAMS,
  AI_FEATURES,
  VOICE_OPTIONS,
  SCRIPT_STYLES,
  SCRIPT_LENGTHS,
  EFFECT_STYLES,
  PROJECT_TEMPLATES,
  HOTKEYS,
  STORAGE_KEYS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '@/constants';

// 路由路径（仅在 shared 中定义）
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/project/:projectId',
  PROJECT_EDIT: '/project/edit/:projectId',
  EDITOR: '/editor',
  SETTINGS: '/settings',
  VIDEO_STUDIO: '/video-studio'
} as const;

// 默认配置
export const DEFAULTS = {
  AUTO_SAVE_INTERVAL: 30, // 秒
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_PROJECTS: 100,
  MAX_RECENT_FILES: 20,
  DEFAULT_VIDEO_QUALITY: 'high',
  DEFAULT_OUTPUT_FORMAT: 'mp4',
  DEFAULT_LANGUAGE: 'zh',
  DEFAULT_SCRIPT_LENGTH: 'medium',
  DEFAULT_STYLE: 'professional',
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;

// 质量选项
export const QUALITY_OPTIONS = [
  { value: 'low', label: '低 (480p)', desc: '文件小，加载快' },
  { value: 'medium', label: '中 (720p)', desc: '平衡质量和大小' },
  { value: 'high', label: '高 (1080p)', desc: '推荐质量' },
  { value: 'ultra', label: '超清 (4K)', desc: '最高质量' }
] as const;

// 分辨率选项
export const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p', width: 1280, height: 720 },
  { value: '1080p', label: '1080p', width: 1920, height: 1080 },
  { value: '2k', label: '2K', width: 2560, height: 1440 },
  { value: '4k', label: '4K', width: 3840, height: 2160 }
] as const;

// 帧率选项
export const FRAME_RATE_OPTIONS = [24, 30, 60] as const;

// 语气选项
export const TONE_OPTIONS = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'authoritative', label: '权威专业' },
  { value: 'enthusiastic', label: '热情激昂' },
  { value: 'calm', label: '平静沉稳' },
  { value: 'humorous', label: '幽默诙谐' }
] as const;

// 目标受众
export const TARGET_AUDIENCES = [
  { value: 'general', label: '普通大众' },
  { value: 'professional', label: '专业人士' },
  { value: 'student', label: '学生群体' },
  { value: 'business', label: '商务人士' },
  { value: 'tech', label: '技术爱好者' },
  { value: 'elderly', label: '中老年群体' }
] as const;

// 主题模式
export const THEME_MODES = [
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
  { value: 'auto', label: '自动' }
] as const;

// 允许的文件扩展名
export const ALLOWED_EXTENSIONS = {
  VIDEO: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'wmv'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'srt', 'vtt']
} as const;
