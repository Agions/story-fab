/**
 * 共享常量统一出口
 * 单一代谢来源
 */

// ─── 应用层常量（从 settings.ts 重导出）──────────────────────────────
export {
  PROJECT_SAVE_BEHAVIOR_KEY,
  PROJECT_AUTO_SAVE_KEY,
  type ProjectSaveBehavior,
} from '@/shared/constants/settings';

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
} from '@/shared/constants/constants';

// ─── AI / Video 配置常量 ───────────────────────────────────────────

// AI 服务配置
export { AI_CONFIG, AI_PROVIDERS, WORKFLOW_MODES } from '@/core/constants/ai-config';

// 视频配置
export {
  VIDEO_CONFIG,
  EXPORT_FORMATS,
  QUALITY_PRESETS,
  ENCODER_PRESETS,
} from '@/core/constants/video-config';

// ─── 独立常量（本地定义）────────────────────────────────────────────────────

// 路由路径
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
  AUTO_SAVE_INTERVAL: 30,
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,
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

export const MAX_FILE_SIZE = DEFAULTS.MAX_FILE_SIZE;

export const QUALITY_OPTIONS = [
  { value: 'low', label: '低 (480p)', desc: '文件小，加载快' },
  { value: 'medium', label: '中 (720p)', desc: '平衡质量和大小' },
  { value: 'high', label: '高 (1080p)', desc: '推荐质量' },
  { value: 'ultra', label: '超清 (4K)', desc: '最高质量' }
] as const;

export const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p', width: 1280, height: 720 },
  { value: '1080p', label: '1080p', width: 1920, height: 1080 },
  { value: '2k', label: '2K', width: 2560, height: 1440 },
  { value: '4k', label: '4K', width: 3840, height: 2160 }
] as const;

export const FRAME_RATE_OPTIONS = [24, 30, 60] as const;

export const TONE_OPTIONS = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'authoritative', label: '权威专业' },
  { value: 'enthusiastic', label: '热情激昂' },
  { value: 'calm', label: '平静沉稳' },
  { value: 'humorous', label: '幽默诙谐' }
] as const;

export const TARGET_AUDIENCES = [
  { value: 'general', label: '普通大众' },
  { value: 'professional', label: '专业人士' },
  { value: 'student', label: '学生群体' },
  { value: 'business', label: '商务人士' },
  { value: 'tech', label: '技术爱好者' },
  { value: 'elderly', label: '中老年群体' }
] as const;

export const THEME_MODES = [
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
  { value: 'auto', label: '自动' }
] as const;

