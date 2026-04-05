/**
 * Video Processing Module
 *
 * 架构：
 * - types.ts              → 核心类型定义
 * - IVideoProcessor.ts    → 接口（后端无关）
 * - BaseVideoProcessor.ts → 基类（通用逻辑：错误归一化、FFmpeg 缓存）
 * - TauriVideoProcessor.ts → Tauri invoke 实现
 * - formatters.ts         → 纯格式化函数
 *
 * 使用方式：
 *   import { videoProcessor } from '@/core/video';
 *   const metadata = await videoProcessor.analyze('/path/to/video.mp4');
 *
 * 实现新驱动（以 WebCodecs 为例）：
 *   class WebCodecsVideoProcessor extends BaseVideoProcessor {
 *     protected doAnalyze(path) { ... }
 *     ...
 *   }
 */
export * from './types';
export * from './highlight.types';
export * from './IVideoProcessor';
export { BaseVideoProcessor, VideoProcessingError, normalizeVideoError } from './BaseVideoProcessor';
export { videoProcessor, TauriVideoProcessor } from './TauriVideoProcessor';
export * from './formatters';
