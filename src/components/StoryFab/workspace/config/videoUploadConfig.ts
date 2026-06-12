/**
 * 视频上传配置
 * 职责：视频上传相关的常量和辅助函数
 *
 * 重构说明：
 * - 从原 VideoUpload.tsx (481行) 中提取配置
 * - 集中管理上传参数、断点续传存储
 * - 职责单一，便于维护和测试
 */

import { VIDEO_FORMATS } from '@/shared/constants';
import { AppError } from '@/core/errors';

// ============================================
// 常量
// ============================================

/** 支持的视频扩展名 */
export const VIDEO_EXTENSIONS = VIDEO_FORMATS.input.map((f) => `.${f}`);

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
export interface ChunkStore {
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
export const createChunkStore = (): ChunkStore => {
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

/**
 * 检查文件是否为支持的视频格式
 * @param file 文件对象
 * @returns 是否支持
 */
export const isSupportedVideoFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

/**
 * 模拟分块上传
 * @param chunks 分块数组
 * @param onProgress 进度回调
 * @param onChunkUploaded 分块上传完成回调
 * @param signal 中断信号
 */
export const simulateChunkedUpload = async (
  chunks: Blob[],
  onProgress: (percent: number) => void,
  onChunkUploaded: (index: number) => void,
  signal?: AbortSignal
): Promise<void> => {
  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) {
      throw new AppError('APP_UPLOAD_ABORTED', 'Upload aborted', {
        severity: 'warning',
        userMessage: '上传已取消',
      });
    }
    // 模拟网络延迟
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        UPLOAD_DELAY_MIN_MS + Math.random() * UPLOAD_DELAY_RANGE_MS
      )
    );
    onChunkUploaded(i);
    onProgress(Math.round(((i + 1) / chunks.length) * 100));
  }
};
