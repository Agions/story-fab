/**
 * 常量定义
 * 集中管理所有常量
 */
import { AI_MODELS as CORE_MODELS } from '@/core/config/models.config';

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

// 存储键名
export const STORAGE_KEYS = {
  PROJECTS: 'reelforge_projects',
  APP_STATE: 'reelforge_app_state',
  USER_PREFERENCES: 'reelforge_preferences',
  RECENT_FILES: 'reelforge_recent_files',
  MODEL_SETTINGS: 'reelforge_model_settings',
  EXPORT_HISTORY: 'reelforge_export_history'
} as const;

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
  AUTO_SAVE_INTERVAL: 30, // 秒
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_PROJECTS: 100,
  MAX_RECENT_FILES: 20,
  DEFAULT_VIDEO_QUALITY: 'high',
  DEFAULT_OUTPUT_FORMAT: 'mp4',
  DEFAULT_LANGUAGE: 'zh',
  DEFAULT_SCRIPT_LENGTH: 'medium',
  DEFAULT_STYLE: 'professional'
} as const;

const MODEL_VERSION = '2026-03-06' as const;

type CoreModelId =
  | 'gpt-5.3-codex'
  | 'o3'
  | 'claude-sonnet-4-6'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite-preview'
  | 'qwen-max-latest'
  | 'glm-5'
  | 'spark-custom'
  | 'deepseek-chat'
  | 'deepseek-reasoner'
  | 'kimi-k2-0905-preview'
  | 'kimi-k2-turbo-preview';

const MODEL_KEY_MAP: Record<string, CoreModelId> = {
  OPENAI: 'gpt-5.3-codex',
  OPENAI_REASONING: 'o3',
  ANTHROPIC: 'claude-sonnet-4-6',
  GOOGLE: 'gemini-3.1-pro-preview',
  ALIBABA: 'qwen-max-latest',
  ZHIPU: 'glm-5',
  IFLYTEK: 'spark-custom',
  DEEPSEEK: 'deepseek-chat',
  DEEPSEEK_REASONER: 'deepseek-reasoner',
  MOONSHOT: 'kimi-k2-0905-preview',
};

const asCapability = (category: string): string => {
  if (category === 'image') return 'vision';
  return category;
};

const buildLLMModel = (modelId: CoreModelId) => {
  const model = CORE_MODELS.find((item) => item.id === modelId);
  if (!model) {
    throw new Error(`Model not found in core config: ${modelId}`);
  }

  const supportsFunctionCalling = model.provider !== 'iflytek';

  return {
    provider: model.provider,
    name: model.name,
    modelId: model.id,
    version: MODEL_VERSION,
    maxTokens: model.tokenLimit,
    contextWindow: model.contextWindow,
    supportsStreaming: true,
    supportsFunctionCalling,
    pricing: { input: 0, output: 0 },
    capabilities: model.category.map(asCapability),
    recommended: model.isPro !== false,
  };
};

// LLM 模型配置（从 core/config/models.config.ts 派生）
export const LLM_MODELS = {
  OPENAI: buildLLMModel(MODEL_KEY_MAP.OPENAI),
  OPENAI_REASONING: buildLLMModel(MODEL_KEY_MAP.OPENAI_REASONING),
  ANTHROPIC: buildLLMModel(MODEL_KEY_MAP.ANTHROPIC),
  GOOGLE: buildLLMModel(MODEL_KEY_MAP.GOOGLE),
  ALIBABA: buildLLMModel(MODEL_KEY_MAP.ALIBABA),
  ZHIPU: buildLLMModel(MODEL_KEY_MAP.ZHIPU),
  IFLYTEK: buildLLMModel(MODEL_KEY_MAP.IFLYTEK),
  DEEPSEEK: buildLLMModel(MODEL_KEY_MAP.DEEPSEEK),
  DEEPSEEK_REASONER: buildLLMModel(MODEL_KEY_MAP.DEEPSEEK_REASONER),
  MOONSHOT: buildLLMModel(MODEL_KEY_MAP.MOONSHOT),
} as const;

// 默认模型（国内推荐）
export const DEFAULT_LLM_MODEL = LLM_MODELS.OPENAI;

// 模型选择建议
export const MODEL_RECOMMENDATIONS = {
  // 脚本生成
  scriptGeneration: [
    LLM_MODELS.OPENAI,
    LLM_MODELS.ANTHROPIC,
    LLM_MODELS.ALIBABA,
    LLM_MODELS.DEEPSEEK
  ],
  // 视频分析
  videoAnalysis: [
    LLM_MODELS.GOOGLE,
    LLM_MODELS.OPENAI,
    LLM_MODELS.ALIBABA
  ],
  // 长文本处理
  longContext: [
    LLM_MODELS.GOOGLE,
    LLM_MODELS.ANTHROPIC,
    LLM_MODELS.OPENAI
  ],
  // 成本敏感
  costEffective: [
    LLM_MODELS.DEEPSEEK,
    LLM_MODELS.ALIBABA,
    LLM_MODELS.GOOGLE
  ],
  // 高质量
  highQuality: [
    LLM_MODELS.OPENAI_REASONING,
    LLM_MODELS.ANTHROPIC,
    LLM_MODELS.GOOGLE
  ]
} as const;
