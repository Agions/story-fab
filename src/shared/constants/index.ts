/**
 * 共享常量定义
 */

// 存储键名
export const STORAGE_KEYS = {
  PROJECTS: 'clipflow_projects',
  APP_STATE: 'clipflow_app_state',
  USER_PREFERENCES: 'clipflow_preferences',
  RECENT_FILES: 'clipflow_recent_files',
  MODEL_SETTINGS: 'clipflow_model_settings',
  EXPORT_HISTORY: 'clipflow_export_history'
} as const;

// 路由路径
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_EDIT: '/projects/:id/edit',
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

// 视频格式
export const VIDEO_FORMATS = {
  MP4: 'mp4',
  MOV: 'mov',
  WEBM: 'webm',
  MKV: 'mkv',
  AVI: 'avi'
} as const;

// 音频格式
export const AUDIO_FORMATS = {
  MP3: 'mp3',
  WAV: 'wav',
  FLAC: 'flac',
  AAC: 'aac',
  OGG: 'ogg'
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

// 脚本风格
export const SCRIPT_STYLES = [
  { value: 'professional', label: '专业正式', desc: '适合商业、教育类视频' },
  { value: 'casual', label: '轻松随意', desc: '适合生活、娱乐类视频' },
  { value: 'humorous', label: '幽默风趣', desc: '适合搞笑、娱乐类视频' },
  { value: 'emotional', label: '情感共鸣', desc: '适合故事、情感类视频' },
  { value: 'technical', label: '技术讲解', desc: '适合教程、科普类视频' },
  { value: 'promotional', label: '营销推广', desc: '适合产品、广告类视频' }
] as const;

// 语气选项
export const TONE_OPTIONS = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'authoritative', label: '权威专业' },
  { value: 'enthusiastic', label: '热情激昂' },
  { value: 'calm', label: '平静沉稳' },
  { value: 'humorous', label: '幽默诙谐' }
] as const;

// 脚本长度
export const SCRIPT_LENGTHS = [
  { value: 'short', label: '简短', desc: '1-3分钟', words: '300-500字' },
  { value: 'medium', label: '适中', desc: '3-5分钟', words: '500-800字' },
  { value: 'long', label: '详细', desc: '5-10分钟', words: '800-1500字' }
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

// 语言选项
export const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
] as const;

// 主题模式
export const THEME_MODES = [
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
  { value: 'auto', label: '自动' }
] as const;

// 文件大小限制 (字节)
export const FILE_LIMITS = {
  VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  AUDIO: 100 * 1024 * 1024, // 100MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024 // 50MB
} as const;

// 允许的文件扩展名
export const ALLOWED_EXTENSIONS = {
  VIDEO: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'wmv'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'srt', 'vtt']
} as const;
