import { logger } from '@/utils/logger';
/**
 * 工作流错误处理服务
 * 提供统一的错误分类、恢复建议和错误处理
 */

import type { WorkflowStep } from './types';

export interface WorkflowError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: string;
  /** 发生步骤 */
  step: WorkflowStep;
  /** 是否可恢复 */
  recoverable: boolean;
  /** 恢复建议 */
  recoverySuggestion?: string;
  /** 错误时间 */
  timestamp: number;
}

/**
 * 错误代码枚举
 */
export const ErrorCode = {
  // 上传步骤错误
  UPLOAD_FILE_NOT_FOUND: 'UPLOAD_FILE_NOT_FOUND',
  UPLOAD_FILE_TOO_LARGE: 'UPLOAD_FILE_TOO_LARGE',
  UPLOAD_UNSUPPORTED_FORMAT: 'UPLOAD_UNSUPPORTED_FORMAT',
  UPLOAD_NETWORK_ERROR: 'UPLOAD_NETWORK_ERROR',

  // 分析步骤错误
  ANALYZE_FAILED: 'ANALYZE_FAILED',
  ANALYZE_TIMEOUT: 'ANALYZE_TIMEOUT',
  ANALYZE_NO_CONTENT: 'ANALYZE_NO_CONTENT',

  // 脚本生成错误
  SCRIPT_GENERATE_FAILED: 'SCRIPT_GENERATE_FAILED',
  SCRIPT_GENERATE_TIMEOUT: 'SCRIPT_GENERATE_TIMEOUT',
  SCRIPT_GENERATE_EMPTY: 'SCRIPT_GENERATE_EMPTY',
  SCRIPT_MODEL_ERROR: 'SCRIPT_MODEL_ERROR',

  // AI 剪辑错误
  AICLIP_FAILED: 'AICLIP_FAILED',
  AICLIP_NO_CLIPS: 'AIClIP_NO_CLIPS',
  AICLIP_TIMEOUT: 'AIClIP_TIMEOUT',

  // 导出错误
  EXPORT_FAILED: 'EXPORT_FAILED',
  EXPORT_TIMEOUT: 'EXPORT_TIMEOUT',
  EXPORT_NO_SPACE: 'EXPORT_NO_SPACE',

  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',

  // 未知错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * 错误分类
 */
type ErrorCategory = 'upload' | 'analyze' | 'script' | 'ai' | 'export' | 'network' | 'unknown';

/**
 * 获取错误分类
 */
const getErrorCategory = (code: string): ErrorCategory => {
  if (code.startsWith('UPLOAD_')) return 'upload';
  if (code.startsWith('ANALYZE_')) return 'analyze';
  if (code.startsWith('SCRIPT_')) return 'script';
  if (code.startsWith('AIClIP_')) return 'ai';
  if (code.startsWith('EXPORT_')) return 'export';
  if (code.includes('NETWORK') || code.includes('API')) return 'network';
  return 'unknown';
};

/**
 * 获取恢复建议
 */
const getRecoverySuggestion = (code: string): string => {
  const suggestions: Record<string, string> = {
    [ErrorCode.UPLOAD_FILE_NOT_FOUND]: '请重新选择视频文件',
    [ErrorCode.UPLOAD_FILE_TOO_LARGE]: '请选择更小的视频文件或压缩后上传',
    [ErrorCode.UPLOAD_UNSUPPORTED_FORMAT]: '请选择支持的视频格式: MP4, MOV, AVI, MKV',
    [ErrorCode.UPLOAD_NETWORK_ERROR]: '请检查网络连接后重试',
    [ErrorCode.ANALYZE_FAILED]: '请尝试重新分析或更换视频',
    [ErrorCode.ANALYZE_TIMEOUT]: '视频较长，请耐心等待或尝试较短的视频',
    [ErrorCode.ANALYZE_NO_CONTENT]: '视频内容无法识别，请尝试其他视频',
    [ErrorCode.SCRIPT_GENERATE_FAILED]: '请检查网络连接或稍后重试',
    [ErrorCode.SCRIPT_GENERATE_TIMEOUT]: '脚本生成超时，请尝试减少视频时长',
    [ErrorCode.SCRIPT_GENERATE_EMPTY]: '请尝试更换模板或调整参数',
    [ErrorCode.SCRIPT_MODEL_ERROR]: '请检查 API 配置或更换模型',
    [ErrorCode.AICLIP_FAILED]: '请尝试重新剪辑或手动调整',
    [ErrorCode.AICLIP_NO_CLIPS]: '未能识别有效片段，请尝试其他视频',
    [ErrorCode.AICLIP_TIMEOUT]: '剪辑超时，请尝试减少片段数量',
    [ErrorCode.EXPORT_FAILED]: '请检查磁盘空间或尝试其他导出设置',
    [ErrorCode.EXPORT_TIMEOUT]: '导出时间较长，请耐心等待',
    [ErrorCode.EXPORT_NO_SPACE]: '请清理磁盘空间后重试',
    [ErrorCode.NETWORK_ERROR]: '请检查网络连接后重试',
    [ErrorCode.API_ERROR]: '请检查 API 配置是否正确',
  };

  return suggestions[code] || '请稍后重试或联系技术支持';
};

/**
 * 检查错误是否可恢复
 */
const isRecoverable = (code: string): boolean => {
  // 网络错误通常可恢复
  if (code.includes('NETWORK') || code.includes('TIMEOUT')) {
    return true;
  }

  // 某些服务端错误可恢复
  if (code.includes('API_ERROR')) {
    return true;
  }

  // 文件相关错误可能可恢复
  if (code.startsWith('UPLOAD_') && code !== 'UPLOAD_FILE_NOT_FOUND') {
    return true;
  }

  return false;
};

/**
 * 创建工作流错误
 */
export const createWorkflowError = (
  code: string,
  message: string,
  step: WorkflowStep,
  details?: string
): WorkflowError => {
  return {
    code,
    message,
    details,
    step,
    recoverable: isRecoverable(code),
    recoverySuggestion: getRecoverySuggestion(code),
    timestamp: Date.now(),
  };
};

/**
 * 错误处理服务
 */
export class WorkflowErrorHandler {
  private errors: WorkflowError[] = [];
  private maxErrors = 100;

  /**
   * 添加错误
   */
  addError(error: WorkflowError): void {
    this.errors.push(error);

    // 限制错误数量
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // 打印错误日志
    logger.error('[WorkflowError]', { code: error.code, message: error.message, details: error.details });
  }

  /**
   * 从异常创建错误
   */
  fromException(error: unknown, step: WorkflowStep): WorkflowError {
    let code: any = ErrorCode.UNKNOWN_ERROR;
    let message = '发生未知错误';
    let details: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      details = error.stack;

      // 根据错误消息分类
      if (message.includes('network') || message.includes('fetch')) {
        code = ErrorCode.NETWORK_ERROR;
      } else if (message.includes('timeout')) {
        code = ErrorCode.ANALYZE_TIMEOUT;
      } else if (message.includes('API')) {
        code = ErrorCode.API_ERROR;
      }
    }

    const workflowError = createWorkflowError(code, message, step, details);
    this.addError(workflowError);
    return workflowError;
  }

  /**
   * 获取错误历史
   */
  getErrors(): WorkflowError[] {
    return [...this.errors];
  }

  /**
   * 获取最近错误
   */
  getRecentErrors(count: number = 10): WorkflowError[] {
    return this.errors.slice(-count);
  }

  /**
   * 获取特定步骤的错误
   */
  getErrorsForStep(step: WorkflowStep): WorkflowError[] {
    return this.errors.filter((e) => e.step === step);
  }

  /**
   * 获取可恢复错误
   */
  getRecoverableErrors(): WorkflowError[] {
    return this.errors.filter((e) => e.recoverable);
  }

  /**
   * 清除错误历史
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    recoverable: number;
    unrecoverable: number;
  } {
    const stats = {
      total: this.errors.length,
      byCategory: {
        upload: 0,
        analyze: 0,
        script: 0,
        ai: 0,
        export: 0,
        network: 0,
        unknown: 0,
      } as Record<ErrorCategory, number>,
      recoverable: 0,
      unrecoverable: 0,
    };

    for (const error of this.errors) {
      const category = getErrorCategory(error.code);
      stats.byCategory[category]++;

      if (error.recoverable) {
        stats.recoverable++;
      } else {
        stats.unrecoverable++;
      }
    }

    return stats;
  }

  /**
   * 导出错误报告
   */
  exportErrorReport(): string {
    const stats = this.getErrorStats();
    const errors = this.errors;

    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stats,
        errors,
      },
      null,
      2
    );
  }
}

// 导出单例
export const workflowErrorHandler = new WorkflowErrorHandler();
