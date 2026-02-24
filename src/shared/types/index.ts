/**
 * 共享类型定义
 * 项目通用的类型定义
 */

// ============ 基础类型 ============

/** ID 类型 */
export type ID = string;

/** 时间戳类型 */
export type Timestamp = string;

/** 状态类型 */
export type Status = 'idle' | 'loading' | 'success' | 'error' | 'pending';

/** 进度类型 */
export interface Progress {
  percent: number;
  status: Status;
  message?: string;
}

// ============ 分页类型 ============

/** 分页请求 */
export interface PaginationRequest {
  page: number;
  pageSize: number;
}

/** 分页响应 */
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============ API 响应类型 ============

/** API 响应 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp: string;
  };
}

/** API 错误 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============ 文件类型 ============

/** 文件信息 */
export interface FileInfo {
  id: ID;
  name: string;
  path: string;
  size: number;
  mimeType?: string;
  extension?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** 视频文件 */
export interface VideoFile extends FileInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  thumbnail?: string;
}

/** 音频文件 */
export interface AudioFile extends FileInfo {
  duration: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
}

/** 图片文件 */
export interface ImageFile extends FileInfo {
  width: number;
  height: number;
  alt?: string;
}

// ============ 项目类型 ============

/** 项目状态 */
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'archived';

/** 项目 */
export interface Project {
  id: ID;
  name: string;
  description?: string;
  status: ProjectStatus;
  thumbnail?: string;
  videos: VideoFile[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ 工作流类型 ============

/** 工作流步骤 */
export type WorkflowStep =
  | 'upload'
  | 'analyze'
  | 'template-select'
  | 'script-generate'
  | 'script-dedup'
  | 'script-edit'
  | 'ai-clip'
  | 'timeline-edit'
  | 'preview'
  | 'export';

/** 工作流状态 */
export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/** 工作流 */
export interface Workflow {
  id: ID;
  step: WorkflowStep;
  status: WorkflowStatus;
  progress: number;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ 任务类型 ============

/** 任务类型 */
export type TaskType = 'analysis' | 'script' | 'render' | 'export' | 'upload';

/** 任务状态 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** 任务 */
export interface Task {
  id: ID;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  message?: string;
  error?: string;
  result?: unknown;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// ============ UI 类型 ============

/** 模态框属性 */
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  footer?: React.ReactNode;
}

/** 列表属性 */
export interface ListProps<T> {
  items: T[];
  loading?: boolean;
  emptyText?: string;
  onItemClick?: (item: T) => void;
}

/** 卡片属性 */
export interface CardProps {
  title?: string;
  description?: string;
  cover?: string;
  extra?: React.ReactNode;
  actions?: React.ReactNode[];
}

// ============ 表单类型 ============

/** 表单字段 */
export interface FormField<T = unknown> {
  name: string;
  label: string;
  value: T;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: unknown }>;
  validation?: (value: T) => string | null;
}

/** 表单数据 */
export type FormData = Record<string, unknown>;

// ============ 事件类型 ============

/** 事件回调 */
export interface EventCallback<T = unknown> {
  (data: T): void;
}

/** 事件发射器 */
export interface EventEmitter {
  on<T>(event: string, callback: EventCallback<T>): void;
  off<T>(event: string, callback: EventCallback<T>): void;
  emit<T>(event: string, data: T): void;
}

// ============ 配置类型 ============

/** 应用配置 */
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultQuality: 'low' | 'medium' | 'high' | 'ultra';
  defaultFormat: 'mp4' | 'mov' | 'webm';
}

/** 主题配置 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  accentColor?: string;
}
