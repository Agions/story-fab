/**
 * Mock ASR Provider
 * 模拟 ASR 结果，用于 Rust Whisper 和 Web Speech 都不可用时的降级方案
 */
import type { VideoInfo } from '../../../types';
import type { ASRResult, ASRSegment, ASROptions } from '../asr-types';
import type { IASRProvider } from './types';

/** 模拟 ASR 文本样本（按语言） */
const MOCK_SAMPLE_TEXTS: Record<string, string[]> = {
  zh_cn: [
    '欢迎观看本期视频',
    '今天我们来介绍一个新功能',
    '首先让我们了解一下背景',
    '然后进入实际操作环节',
    '最后做一个总结',
  ],
  en_us: [
    'Welcome to this video',
    'Today we are going to introduce a new feature',
    'First let us understand the background',
    'Then we move to the practical operation',
    'Finally we make a summary',
  ],
};

/** 模拟分段时间长度（秒） */
const MOCK_SEGMENT_DURATION = 5;

/**
 * Mock ASR 策略实现
 * 永远成功，返回合成的"识别"结果
 */
export class MockASRProvider implements IASRProvider {
  readonly name = 'mock';

  async transcribe(videoInfo: VideoInfo, opts: Required<ASROptions>): Promise<ASRResult | null> {
    const segments = this._generateSegments(videoInfo, opts);
    return {
      text: segments.map(s => s.text).join('。'),
      segments,
      language: opts.language,
      confidence: 0.88,
      fullResult: opts.enableTimestamp
        ? segments.map(s => ({
            start: s.startTime,
            end: s.endTime,
            text: s.text,
            confidence: s.confidence,
            words: s.words,
          }))
        : undefined,
      provider: this.name,
    };
  }

  /** 根据视频时长生成模拟分段 */
  private _generateSegments(videoInfo: VideoInfo, opts: Required<ASROptions>): ASRSegment[] {
    const numSegments = Math.max(1, Math.floor(videoInfo.duration / MOCK_SEGMENT_DURATION));
    const texts = MOCK_SAMPLE_TEXTS[opts.language] || MOCK_SAMPLE_TEXTS['zh_cn'];
    const segments: ASRSegment[] = [];

    for (let i = 0; i < numSegments; i++) {
      const startTime = i * MOCK_SEGMENT_DURATION;
      const endTime = Math.min((i + 1) * MOCK_SEGMENT_DURATION, videoInfo.duration);
      const textIndex = i % texts.length;

      segments.push({
        id: crypto.randomUUID(),
        startTime,
        endTime,
        text: texts[textIndex],
        confidence: 0.85 + Math.random() * 0.15,
        words: opts.enableTimestamp
          ? [
              {
                word: texts[textIndex],
                startTime,
                endTime,
                confidence: 0.9,
              },
            ]
          : undefined,
      });
    }

    return segments;
  }
}
