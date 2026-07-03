/**
 * 视频上传配置
 * 职责：视频上传相关的常量和辅助函数
 *
 * 重构说明：
 * - 从原 VideoUpload.tsx (481行) 中提取配置
 * - 集中管理上传参数、断点续传存储
 * - 职责单一，便于维护和测试
 */

import { VIDEO_EXTENSIONS } from '@/shared/constants';

// Re-export for consumers that import from this config module
export { VIDEO_EXTENSIONS };

/** 模拟上传分块大小（1 MB） */
export const CHUNK_SIZE = 1024 * 1024;

/** 暂停检查间隔（毫秒） */
export const PAUSE_CHECK_INTERVAL_MS = 100;

/** 模拟每块上传延迟：最小值（毫秒） */
export const UPLOAD_DELAY_MIN_MS = 80;

/** 模拟每块上传延迟：范围（毫秒） */
export const UPLOAD_DELAY_RANGE_MS = 150;

// ============================================
// 断点续传存储
// ============================================

/**
 * 分块存储接口
 */
interface ChunkStore {
  /** 添加分块 */
  addChunk: (id: string, chunk: Blob, index: number) => void;
  /** 获取所有分块 */
  getChunks: (id: string) => Blob[];
  /** 检查是否有分块 */
  hasChunks: (id: string) => boolean;
  /** 清除分块 */
  clear: (id: string) => void;
}

/**
 * 创建分块存储
 * 提取说明：原代码中此闭包内联在组件文件中
 */
const createChunkStore = (): ChunkStore => {
  const chunks: Map<string, Blob[]> = new Map();
  return {
    addChunk: (id: string, chunk: Blob, index: number) => {
      if (!chunks.has(id)) chunks.set(id, []);
      const arr = chunks.get(id)!;
      arr[index] = chunk;
    },
    getChunks: (id: string) => chunks.get(id) || [],
    hasChunks: (id: string) => chunks.has(id) && chunks.get(id)!.length > 0,
    clear: (id: string) => chunks.delete(id),
  };
};

/** 全局分块存储实例 */
export const chunkStore = createChunkStore();

// ============================================
// 工具函数
// ============================================
