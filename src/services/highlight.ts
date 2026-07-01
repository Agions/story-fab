/**
 * 高光检测服务统一导出
 * 合并自 core/services/aiClip/ 中的分析能力
 */

export { analyzeVideo } from '@/core/services/ai-clip/analyzer';
export type {
  HighlightSegment,
  HighlightOptions,
  SmartVideoSegment,
  SegmentOptions,
} from '@/types';
