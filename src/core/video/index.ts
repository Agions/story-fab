/**
 * Video Processing Module
 *
 * 架构：
 * - types.ts       → 核心类型定义
 * - IVideoProcessor.ts → 接口（后端无关）
 * - TauriVideoProcessor.ts → Tauri invoke 实现
 * - formatters.ts  → 纯格式化函数
 *
 * 使用方式：
 *   import { videoProcessor } from '@/core/video';
 *   const metadata = await videoProcessor.analyze('/path/to/video.mp4');
 */
export * from './types';
export * from './IVideoProcessor';
export { videoProcessor, TauriVideoProcessor } from './TauriVideoProcessor';
export * from './formatters';
