/**
 * AppError — 应用统一错误类型
 *
 * 设计目的：
 * 1. 替代散落的 `throw new Error(...)` — 提供可聚合的 code/severity
 * 2. 解耦"程序员异常"和"用户提示" — userMessage 给用户看
 * 3. 与现有 ServiceError 兼容 — ServiceError 保留在 providers/ 子域，
 *    AppError 是更上层的统一抽象（code 命名空间：APP_* 前缀）
 *
 * 使用场景：
 * - 业务流程抛错：throw new AppError('APP_PROJECT_INVALID', '项目数据无效')
 * - 第三方 API 错误：throw new AppError('APP_API_FAILED', '讯飞星火 API 错误', { originalError })
 * - 守卫/启动错误：保留 throw new Error(...)（更轻量，详见 commit message）
 *
 * @author Agions
 */

export type AppErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export interface AppErrorOptions {
  /** 底层错误（保留供日志分析） */
  originalError?: unknown;
  /** 严重级别（默认 'error'） */
  severity?: AppErrorSeverity;
  /** 给用户看的简短提示（不暴露技术细节） */
  userMessage?: string;
  /** HTTP 状态码或业务码 */
  statusCode?: number;
  /** 是否可重试（默认 false） */
  retryable?: boolean;
  /** 附加上下文 */
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  /** 业务码，便于聚合分析（命名空间：APP_*） */
  public readonly code: string;
  public readonly severity: AppErrorSeverity;
  public readonly userMessage?: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly originalError?: unknown;
  /** 错误时间戳 */
  public readonly timestamp: string;

  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = options.severity ?? 'error';
    this.userMessage = options.userMessage;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.context = options.context;
    this.originalError = options.originalError;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 转 JSON 友好形式（用于日志/上报）
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError instanceof Error
        ? { name: this.originalError.name, message: this.originalError.message }
        : this.originalError,
    };
  }

  /**
   * 任意 unknown 转 AppError（不丢失上下文）
   */
  static from(unknownErr: unknown, fallbackCode = 'APP_UNKNOWN'): AppError {
    if (unknownErr instanceof AppError) return unknownErr;
    if (unknownErr instanceof Error) {
      return new AppError(fallbackCode, unknownErr.message, {
        originalError: unknownErr,
        severity: 'error',
      });
    }
    return new AppError(fallbackCode, String(unknownErr), { severity: 'error' });
  }
}
