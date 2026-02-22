/**
 * 常量定义
 * 集中管理所有常量
 */

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
  DEFAULT_STYLE: 'professional'
} as const;

// LLM 模型配置（2026年最新）
// 数据来源：各厂商官方 API 文档
export const LLM_MODELS = {
  // 百度千帆 - ERNIE 5.0 (2026-01)
  // API: https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-5.0
  BAIDU: {
    provider: 'baidu',
    name: 'ERNIE 5.0',
    modelId: 'ernie-5.0',
    version: '2026-01',
    maxTokens: 8192,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    pricing: { input: 0.008, output: 0.024 }, // 元/千token
    capabilities: ['text', 'code', 'analysis', 'creative'],
    recommended: true
  },

  // 阿里通义 - Qwen 3.5 (原生多模态版) (2026-01)
  // API: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
  ALIBABA: {
    provider: 'alibaba',
    name: 'Qwen 3.5 (原生多模态版)',
    modelId: 'qwen-3.5',
    version: '2026-01',
    maxTokens: 8192,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    pricing: { input: 0.006, output: 0.018 },
    capabilities: ['text', 'code', 'analysis', 'creative', 'vision'],
    recommended: true
  },

  // 月之暗面 - Kimi k2.5 (2025-07)
  // API: https://api.moonshot.cn/v1/chat/completions
  MOONSHOT: {
    provider: 'moonshot',
    name: 'Kimi k2.5',
    modelId: 'kimi-k2.5',
    version: '2025-07',
    maxTokens: 8192,
    contextWindow: 200000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    pricing: { input: 0.012, output: 0.036 },
    capabilities: ['text', 'code', 'analysis', 'creative', 'long-context'],
    recommended: true
  },

  // 智谱 AI - GLM-5 (2026-01)
  // API: https://open.bigmodel.cn/api/paas/v4/chat/completions
  ZHIPU: {
    provider: 'zhipu',
    name: 'GLM-5',
    modelId: 'glm-5',
    version: '2026-01',
    maxTokens: 4096,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    pricing: { input: 0.005, output: 0.015 },
    capabilities: ['text', 'code', 'analysis'],
    recommended: true
  },

  // MiniMax - minimax-m2.5 (2025-12)
  // API: https://api.minimax.chat/v1/text/chatcompletion_v2
  MINIMAX: {
    provider: 'minimax',
    name: 'MiniMax M2.5',
    modelId: 'minimax-m2.5',
    version: '2025-12',
    maxTokens: 4096,
    contextWindow: 100000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    pricing: { input: 0.01, output: 0.03 },
    capabilities: ['text', 'creative'],
    recommended: false
  },

  // OpenAI - GPT-5 (2026-01，海外)
  // API: https://api.openai.com/v1/chat/completions
  OPENAI: {
    provider: 'openai',
    name: 'GPT-5',
    modelId: 'gpt-5',
    version: '2026-01',
    maxTokens: 8192,
    contextWindow: 256000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    pricing: { input: 0.03, output: 0.06 }, // USD
    capabilities: ['text', 'code', 'analysis', 'creative', 'vision'],
    recommended: false // 海外模型，需特殊网络
  },

  // Anthropic - Claude 4 (2026-01，海外)
  // API: https://api.anthropic.com/v1/messages
  ANTHROPIC: {
    provider: 'anthropic',
    name: 'Claude 4',
    modelId: 'claude-4-sonnet',
    version: '2026-01',
    maxTokens: 8192,
    contextWindow: 200000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    pricing: { input: 0.025, output: 0.075 }, // USD
    capabilities: ['text', 'code', 'analysis', 'creative'],
    recommended: false // 海外模型
  }
} as const;

// 默认模型（国内推荐）
export const DEFAULT_LLM_MODEL = LLM_MODELS.BAIDU;

// 模型选择建议
export const MODEL_RECOMMENDATIONS = {
  // 脚本生成
  scriptGeneration: [
    LLM_MODELS.BAIDU,
    LLM_MODELS.ALIBABA,
    LLM_MODELS.MOONSHOT
  ],
  // 视频分析
  videoAnalysis: [
    LLM_MODELS.ALIBABA, // 支持 vision
    LLM_MODELS.BAIDU
  ],
  // 长文本处理
  longContext: [
    LLM_MODELS.MOONSHOT, // 200k context
    LLM_MODELS.OPENAI // 256k context
  ],
  // 成本敏感
  costEffective: [
    LLM_MODELS.ZHIPU,
    LLM_MODELS.ALIBABA,
    LLM_MODELS.BAIDU
  ],
  // 高质量
  highQuality: [
    LLM_MODELS.OPENAI,
    LLM_MODELS.MOONSHOT,
    LLM_MODELS.BAIDU
  ]
} as const;
