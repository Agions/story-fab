/**
 * PipelineEngine - 6 步解说流水线引擎
 *
 * 流水线步骤：
 * 1. Ingest  - 素材导入（视频文件 → VideoMeta）
 * 2. Analyze - 智能分析（VideoMeta → AnalysisResult）
 * 3. Script  - 脚本创作（AnalysisResult → Script）
 * 4. Voice   - 语音合成（Script → VoiceTrack）
 * 5. Compose - 视频合成（VoiceTrack + VideoMeta → ComposedVideo）
 * 6. Export  - 导出发布（ComposedVideo → ExportResult）
 */

import { logger } from '@/shared/utils/logging';
import type {
  VideoInfo,
  AnalysisResult,
  Script,
  ExportResult,
} from '@/types';

// ─── 流水线步骤名称 ───

export type StepName = 'ingest' | 'analyze' | 'script' | 'voice' | 'compose' | 'export';

export const STEP_NAMES: StepName[] = ['ingest', 'analyze', 'script', 'voice', 'compose', 'export'];

// ─── 流水线上下文（步骤间数据流转）───

export interface PipelineDataContext {
  projectId: string;
  videoPath: string;
  videoMeta?: VideoInfo;
  analysis?: AnalysisResult;
  script?: Script;
  voiceTrack?: VoiceTrackData;
  composedVideo?: ComposedVideoData;
  exportResult?: ExportResult;
}

export interface VoiceTrackData {
  audioPath: string;
  duration: number;
  segments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    audioPath: string;
  }>;
}

export interface ComposedVideoData {
  videoPath: string;
  duration: number;
  hasSubtitles: boolean;
  hasVoiceover: boolean;
}

// ─── 流水线状态 ───

export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface PipelineState {
  status: PipelineStatus;
  currentStep: StepName;
  progress: number; // 0-100
  stepProgress: Record<StepName, number>;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ─── 步骤接口 ───

export interface PipelineStep<TInput, TOutput> {
  name: StepName;
  execute(input: TInput, ctx: PipelineDataContext): Promise<TOutput>;
  validate?(input: TInput): { valid: boolean; reason?: string };
}

// ─── 流水线引擎 ───

export class PipelineEngine {
  private steps: Map<StepName, PipelineStep<unknown, unknown>> = new Map();
  private state: PipelineState;
  private context: PipelineDataContext;
  private listeners: Array<(state: PipelineState) => void> = [];

  constructor(projectId: string, videoPath: string) {
    this.context = { projectId, videoPath };
    this.state = {
      status: 'idle',
      currentStep: 'ingest',
      progress: 0,
      stepProgress: {
        ingest: 0,
        analyze: 0,
        script: 0,
        voice: 0,
        compose: 0,
        export: 0,
      },
    };
  }

  // ─── 注册步骤 ───

  registerStep<TInput, TOutput>(step: PipelineStep<TInput, TOutput>): this {
    this.steps.set(step.name, step as PipelineStep<unknown, unknown>);
    return this;
  }

  // ─── 状态监听 ───

  subscribe(listener: (state: PipelineState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private setState(update: Partial<PipelineState>): void {
    this.state = { ...this.state, ...update };
    this.listeners.forEach(l => l(this.state));
  }

  // ─── 获取状态 ───

  getState(): PipelineState {
    return { ...this.state };
  }

  getContext(): PipelineDataContext {
    return { ...this.context };
  }

  // ─── 执行单个步骤 ───

  async executeStep(stepName: StepName): Promise<void> {
    const step = this.steps.get(stepName);
    if (!step) {
      throw new Error(`Step "${stepName}" not registered`);
    }

    const stepIndex = STEP_NAMES.indexOf(stepName);
    const input = this.getStepInput(stepIndex);

    // 验证输入
    if (step.validate) {
      const validation = step.validate(input);
      if (!validation.valid) {
        throw new Error(`Step "${stepName}" validation failed: ${validation.reason}`);
      }
    }

    // 更新状态
    this.setState({
      status: 'running',
      currentStep: stepName,
      startedAt: this.state.startedAt ?? Date.now(),
    });

    try {
      logger.info(`[Pipeline] Executing step: ${stepName}`);
      const output = await step.execute(input, this.context);

      // 保存输出到上下文
      this.setStepOutput(stepName, output);

      // 更新进度
      const newStepProgress = { ...this.state.stepProgress, [stepName]: 100 };
      const completedSteps = STEP_NAMES.slice(0, stepIndex + 1);
      const totalProgress = Math.round((completedSteps.length / STEP_NAMES.length) * 100);

      this.setState({
        stepProgress: newStepProgress,
        progress: totalProgress,
      });

      logger.info(`[Pipeline] Step completed: ${stepName}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.setState({
        status: 'failed',
        error,
      });
      throw err;
    }
  }

  // ─── 执行到指定步骤 ───

  async executeTo(targetStep: StepName): Promise<void> {
    const targetIndex = STEP_NAMES.indexOf(targetStep);

    for (let i = 0; i <= targetIndex; i++) {
      const stepName = STEP_NAMES[i];
      const stepProgress = this.state.stepProgress[stepName];

      // 跳过已完成的步骤
      if (stepProgress === 100) {
        continue;
      }

      await this.executeStep(stepName);
    }

    if (this.state.status === 'running') {
      this.setState({ status: 'completed', completedAt: Date.now() });
    }
  }

  // ─── 执行完整流水线 ───

  async executeAll(): Promise<void> {
    await this.executeTo('export');
  }

  // ─── 从指定步骤重新执行 ───

  async reexecuteFrom(stepName: StepName): Promise<void> {
    const stepIndex = STEP_NAMES.indexOf(stepName);

    // 重置后续步骤的进度
    const newStepProgress = { ...this.state.stepProgress };
    for (let i = stepIndex; i < STEP_NAMES.length; i++) {
      newStepProgress[STEP_NAMES[i]] = 0;
    }

    this.setState({
      stepProgress: newStepProgress,
      status: 'idle',
      error: undefined,
    });

    await this.executeTo(STEP_NAMES[STEP_NAMES.length - 1]);
  }

  // ─── 内部辅助方法 ───

  private getStepInput(stepIndex: number): unknown {
    const stepName = STEP_NAMES[stepIndex];
    switch (stepName) {
      case 'ingest':
        return this.context.videoPath;
      case 'analyze':
        return this.context.videoMeta;
      case 'script':
        return this.context.analysis;
      case 'voice':
        return this.context.script;
      case 'compose':
        return {
          script: this.context.script,
          voiceTrack: this.context.voiceTrack,
          videoMeta: this.context.videoMeta,
        };
      case 'export':
        return this.context.composedVideo;
      default:
        return undefined;
    }
  }

  private setStepOutput(stepName: StepName, output: unknown): void {
    switch (stepName) {
      case 'ingest':
        this.context.videoMeta = output as VideoInfo;
        break;
      case 'analyze':
        this.context.analysis = output as AnalysisResult;
        break;
      case 'script':
        this.context.script = output as Script;
        break;
      case 'voice':
        this.context.voiceTrack = output as VoiceTrackData;
        break;
      case 'compose':
        this.context.composedVideo = output as ComposedVideoData;
        break;
      case 'export':
        this.context.exportResult = output as ExportResult;
        break;
    }
  }
}

// ─── 工厂函数 ───

