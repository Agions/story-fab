/**
 * 视觉识别服务
 * 优化画面识别准确性
 *
 * 重构说明：
 * - 原 662 行单体服务已拆分为 4 个独立服务
 * - 本文件作为向后兼容的入口，重新导出所有服务
 * - 新代码请直接导入 vision/ 目录下的具体服务
 */

// 重新导出所有视觉相关服务
export {
  VisionService,
  visionService,
  default,
  sceneDetectionService,
  objectDetectionService,
  emotionAnalysisService,
  analysisReportService,
} from './vision';

// 导出类型
export type { VideoAnalysisOptions } from './vision';
