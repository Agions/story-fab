/**
 * 统一错误码定义
 * ClipFlow 所有模块使用统一的错误码
 */

/**
 * 错误码分类
 */
export const ErrorCodes = {
  // 通用错误 (1000-1999)
  UNKNOWN: '1000',
  INVALID_PARAMS: '1001',
  NOT_FOUND: '1002',
  UNAUTHORIZED: '1003',
  FORBIDDEN: '1004',
  TIMEOUT: '1005',
  NETWORK_ERROR: '1006',
  
  // 文件错误 (2000-2999)
  FILE_NOT_FOUND: '2000',
  FILE_TOO_LARGE: '2001',
  FILE_TYPE_NOT_SUPPORTED: '2002',
  FILE_READ_ERROR: '2003',
  FILE_WRITE_ERROR: '2004',
  
  // 视频处理错误 (3000-3999)
  VIDEO_NOT_FOUND: '3000',
  VIDEO_DECODE_ERROR: '3001',
  VIDEO_ENCODE_ERROR: '3002',
  VIDEO_FORMAT_NOT_SUPPORTED: '3003',
  VIDEO_TOO_LONG: '3004',
  VIDEO_TOO_LARGE: '3005',
  
  // AI 服务错误 (4000-4999)
  AI_SERVICE_ERROR: '4000',
  AI_QUOTA_EXCEEDED: '4001',
  AI_API_ERROR: '4002',
  AI_TIMEOUT: '4003',
  AI_MODEL_NOT_FOUND: '4004',
  
  // 字幕错误 (5000-5999)
  SUBTITLE_NOT_FOUND: '5000',
  SUBTITLE_PARSE_ERROR: '5001',
  SUBTITLE_FORMAT_NOT_SUPPORTED: '5002',
  ASR_ERROR: '5003',
  TRANSLATION_ERROR: '5004',
  
  // 音频错误 (6000-6999)
  AUDIO_NOT_FOUND: '6000',
  AUDIO_DECODE_ERROR: '6001',
  AUDIO_ENCODE_ERROR: '6002',
  
  // 导出错误 (7000-7999)
  EXPORT_FAILED: '7000',
  EXPORT_CANCELLED: '7001',
  EXPORT_TIMEOUT: '7002',
  
  // 存储错误 (8000-8999)
  STORAGE_ERROR: '8000',
  STORAGE_FULL: '8001',
  
  // 工作流错误 (9000-9999)
  WORKFLOW_ERROR: '9000',
  WORKFLOW_CANCELLED: '9001',
  WORKFLOW_TIMEOUT: '9002',
} as const;

/**
 * 错误码类型
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * 错误码描述
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // 通用错误
  '1000': '未知错误',
  '1001': '参数无效',
  '1002': '资源不存在',
  '1003': '未授权',
  '1004': '禁止访问',
  '1005': '请求超时',
  '1006': '网络错误',
  
  // 文件错误
  '2000': '文件不存在',
  '2001': '文件过大',
  '2002': '不支持的文件类型',
  '2003': '文件读取错误',
  '2004': '文件写入错误',
  
  // 视频处理错误
  '3000': '视频不存在',
  '3001': '视频解码错误',
  '3002': '视频编码错误',
  '3003': '不支持的视频格式',
  '3004': '视频过长',
  '3005': '视频过大',
  
  // AI 服务错误
  '4000': 'AI 服务错误',
  '4001': 'AI 配额超限',
  '4002': 'AI API 错误',
  '4003': 'AI 请求超时',
  '4004': 'AI 模型不存在',
  
  // 字幕错误
  '5000': '字幕不存在',
  '5001': '字幕解析错误',
  '5002': '不支持的字幕格式',
  '5003': '语音识别错误',
  '5004': '翻译错误',
  
  // 音频错误
  '6000': '音频不存在',
  '6001': '音频解码错误',
  '6002': '音频编码错误',
  
  // 导出错误
  '7000': '导出失败',
  '7001': '导出已取消',
  '7002': '导出超时',
  
  // 存储错误
  '8000': '存储错误',
  '8001': '存储空间不足',
  
  // 工作流错误
  '9000': '工作流执行错误',
  '9001': '工作流已取消',
  '9002': '工作流超时',
};

/**
 * 快速创建错误
 */
export function createError(code: ErrorCode, message?: string, originalError?: Error): Error {
  return new Error(message || ErrorMessages[code] || '未知错误');
}
