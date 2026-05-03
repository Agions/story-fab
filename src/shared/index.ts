/**
 * Shared 模块入口
 * 导出所有共享的工具、hooks、类型和常量
 */

// 格式化工具函数 (new formatting.ts - renamed from src/utils/format.ts)
export * from './utils/formatting';

// 日志工具
export * from './utils/logging';

// 项目工具函数
export * from './utils/projectUtils';

// 通用工具函数
export * from '@/shared/utils';

// Hooks

// 类型
export * from '@/shared/types';

// 常量
export * from '@/shared/constants';
