/**
 * 工具函数集合
 * 重新导出共享模块，并保留项目特定函数
 */

// 重新导出共享模块的工具函数
export * from '@/shared/utils';

// 重新导出 hooks
export * from './hooks';

// 从共享模块重新导出格式化函数（保持向后兼容）
export {
  formatDuration,
  formatFileSize,
  formatDate,
  truncateText,
  capitalize
} from '@/shared/utils';
