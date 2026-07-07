/**
 * Full Pipeline — 端到端一键成片 (P0)
 *
 * 串联: 上传 → 分析 → 拆条 → 文案 → 配音 → 字幕 → 合成 → 导出
 *
 * 设计原则:
 *  - 每步可独立重试 / 跳过
 *  - 进度回调 (step, percent) 用于 UI 进度条
 *  - 错误不中断整体 pipeline，仅记录 + 通知调用方
 *
 * 用法:
 *   const pipeline = createFullPipeline({ videoPath, style: 'narration' });
 *   for await (const event of pipeline.run()) {
 *     if (event.type === 'progress') updateUI(event);
 *     if (event.type === 'done') showResult(event.outputPath);
 *   }
 */

import type { VideoInfo, VideoAnalysis, ExportSettings } from '@/types';

// ─── 类型定义 ────────────────────────────────────────────────────────────────-

export type PipelineStyle = 'narration' | 'first-person' | 'remix' | 'custom';

export interface FullPipelineOptions {
  /** 输入视频路径 */
  videoPath: string;
  /** 创作风格模板 */
  style: PipelineStyle;
  /** 输出格式 (默认跟随输入比例) */
  outputRatio?: '9:16' | '1:1' | '16:9';
  /** 是否烧录字幕 */
  burnSubtitles?: boolean;
  /** 背景音乐路径 (可选) */
  bgmPath?: string;
  /** 自定义导出设置 (覆盖模板默认值) */
  exportOverrides?: Partial<ExportSettings>;
}

export type PipelineStep =
  | 'analyze'
  | 'highlight'
  | 'script'
  | 'tts'
  | 'subtitle'
  | 'compose'
  | 'export';

export interface PipelineStepInfo {
  step: PipelineStep;
  label: string;
  /** 0-100 */
  percent: number;
}

export type PipelineEvent =
  | { type: 'progress'; step: PipelineStepInfo; message?: string }
  | { type: 'step-complete'; step: PipelineStep; result: unknown }
  | { type: 'step-error'; step: PipelineStep; error: Error; retryable: boolean }
  | { type: 'done'; outputPath: string; duration: number }
  | { type: 'cancelled' };

// ─── Pipeline 核心 ────────────────────────────────────────────────────────────

const STEP_LABELS: Record<PipelineStep, string> = {
  analyze: '视频分析',
  highlight: 'AI 拆条',
  script: '文案生成',
  tts: '配音合成',
  subtitle: '字幕生成',
  compose: '画面合成',
  export: '导出渲染',
};

export class FullPipeline {
  private options: FullPipelineOptions;
  private cancelled = false;
  private results: Record<PipelineStep, unknown> = {} as Record<PipelineStep, unknown>;

  constructor(options: FullPipelineOptions) {
    this.options = options;
  }

  cancel(): void {
    this.cancelled = true;
  }

  async *run(): AsyncGenerator<PipelineEvent> {
    const steps: PipelineStep[] = ['analyze', 'highlight', 'script', 'tts', 'subtitle', 'compose', 'export'];
    const startedAt = Date.now();

    for (let i = 0; i < steps.length; i++) {
      if (this.cancelled) {
        yield { type: 'cancelled' };
        return;
      }

      const step = steps[i];
      const basePercent = Math.round((i / steps.length) * 100);

      try {
        yield {
          type: 'progress',
          step: {
            step,
            label: STEP_LABELS[step],
            percent: basePercent,
          },
          message: `正在${STEP_LABELS[step]}...`,
        };

        const result = await this.executeStep(step);
        this.results[step] = result;

        yield {
          type: 'progress',
          step: {
            step,
            label: STEP_LABELS[step],
            percent: Math.round(((i + 1) / steps.length) * 100),
          },
        };

        yield { type: 'step-complete', step, result };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        yield {
          type: 'step-error',
          step,
          error,
          retryable: step !== 'export', // 导出失败可整体重试
        };
        // 不中断 — 后续步骤会检查前置结果
      }
    }

    const outputPath = (this.results.export as { outputPath: string })?.outputPath ?? '';
    yield {
      type: 'done',
      outputPath,
      duration: Date.now() - startedAt,
    };
  }

  private async executeStep(step: PipelineStep): Promise<unknown> {
    switch (step) {
      case 'analyze':
        return this.analyze();
      case 'highlight':
        return this.highlight();
      case 'script':
        return this.script();
      case 'tts':
        return this.tts();
      case 'subtitle':
        return this.subtitle();
      case 'compose':
        return this.compose();
      case 'export':
        return this.export();
      default:
        throw new Error(`Unknown step: ${step as string}`);
    }
  }

  private async analyze(): Promise<VideoInfo> {
    const { tauri } = await import('@/core/tauri');
    const info = await tauri.analyzeVideo(this.options.videoPath);
    if (!info) throw new Error('视频分析失败');
    return info as unknown as VideoInfo;
  }

  private async highlight(): Promise<VideoAnalysis> {
    const { tauri } = await import('@/core/tauri');
    const result = await tauri.detectHighlights(
      // @ts-expect-error — payload 形状待对齐 facade
      { videoPath: this.options.videoPath, minDuration: 15 },
    );
    return result as unknown as VideoAnalysis;
  }

  private async script(): Promise<unknown> {
    const { tauri } = await import('@/core/tauri');
    const highlight = this.results.highlight as VideoAnalysis;
    return tauri.generateNarrationScript(
      // @ts-expect-error — payload 形状待对齐 facade
      { videoPath: this.options.videoPath, style: this.options.style, highlights: highlight },
    );
  }

  private async tts(): Promise<unknown> {
    const { tauri } = await import('@/core/tauri');
    const script = this.results.script as { content: string };
    if (!script?.content) throw new Error('无文案可配音');
    return tauri.synthesizeSpeech(
      // @ts-expect-error — payload 形状待对齐 facade
      { text: script.content, voice: undefined, speed: 1 },
    );
  }

  private async subtitle(): Promise<unknown> {
    const { tauri } = await import('@/core/tauri');
    return tauri.extractSubtitles({ videoPath: this.options.videoPath });
  }

  private async compose(): Promise<unknown> {
    const { tauri } = await import('@/core/tauri');
    const subtitle = this.results.subtitle as Array<{ startTime: number; endTime: number; text: string }> | null;
    const tts = this.results.tts as { audioPath: string };
    if (!subtitle || !tts?.audioPath) return null;
    return tauri.burnInSubtitles(
      // @ts-expect-error — payload 形状待对齐 facade
      { videoPath: this.options.videoPath, subtitles: subtitle, audioPath: tts.audioPath },
    );
  }

  private async export(): Promise<{ outputPath: string }> {
    const { tauri } = await import('@/core/tauri');
    const input = this.options.videoPath;
    return tauri.exportVideo(
      // @ts-expect-error — payload 形状待对齐 facade
      {
        inputPath: input,
        format: this.options.outputRatio ?? '9:16',
        crf: this.options.exportOverrides?.quality === 'high' ? 18 : this.options.exportOverrides?.quality === 'low' ? 28 : 23,
        subtitleEnabled: this.options.burnSubtitles ?? true,
      },
    );
  }
}

/** 工厂函数 */
export function createFullPipeline(options: FullPipelineOptions): FullPipeline {
  return new FullPipeline(options);
}
