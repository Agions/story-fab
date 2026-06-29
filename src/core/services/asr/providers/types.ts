/**
 * ASR Provider 策略接口
 * 单一职责：每个 Provider 只负责一种 ASR 识别方案
 */
import type { ASRResult, ASROptions } from '../asr-types';
import type { VideoInfo } from '@/types';

/**
 * ASR Provider 接口
 * - transcribe 返回 null 表示 Provider 不可用，由编排器尝试下一个
 * - 抛出异常会被编排器捕获并降级
 */
export interface IASRProvider {
  /** Provider 名称（用于日志和结果标记） */
  readonly name: string;

  /** 语音识别实现 */
  transcribe(videoInfo: VideoInfo, opts: Required<ASROptions>): Promise<ASRResult | null>;
}
