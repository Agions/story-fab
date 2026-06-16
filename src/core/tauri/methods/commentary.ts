import { rawInvoke } from '../invoke';

// Typed commentary module — all commands are Rust commentary layer only
export const commentary: {
  createSession(sessionId: string, style?: string): Promise<string>;
  getStatus(sessionId: string): Promise<unknown>;
  startAnalysis(sessionId: string, videoPath: string, subtitles: string, targetDurationSecs?: number): Promise<void>;
  generatePlan(sessionId: string, style?: string, targetDurationSecs?: number): Promise<unknown>;
  approvePlan(sessionId: string): Promise<string>;
  revisePlan(sessionId: string, modifications: unknown): Promise<unknown>;
  completeRender(sessionId: string, outputPath: string): Promise<string>;
  destroySession(sessionId: string): Promise<void>;
  generateScript(input: {
    subtitles: string; durationSecs?: number; targetDurationSecs?: number; style?: string;
    summary?: string; highlights?: string[]; angle?: string;
    provider?: 'openai' | 'google' | 'deepseek' | 'qwen' | 'anthropic';
    model?: string; apiKey: string; baseUrl?: string; systemPromptExtra?: string;
  }): Promise<unknown>;
  synthesizeAudio(text: string, voice: string, speed?: number, format?: 'mp3' | 'wav' | 'ogg', outputPath?: string): Promise<unknown>;
  estimateTTSDuration(text: string, voice: string, speed?: number): Promise<number>;
  listVoices(style?: string): Promise<unknown[]>;
  cancelExport(exportId: string): Promise<void>;
} = {
  // ─── Director Agent ─────────────────────────────────────────────────────

  /** 创建 Commentary Director 会话 */
  async createSession(sessionId: string, style?: string): Promise<string> {
    return rawInvoke('create_director_session', { sessionId, style }) as Promise<string>;
  },

  /** 获取 Director 状态 */
  async getStatus(sessionId: string): Promise<unknown> {
    return rawInvoke('get_director_status', { sessionId });
  },

  /** 开始分析视频 */
  async startAnalysis(
    sessionId: string,
    videoPath: string,
    subtitles: string,
    targetDurationSecs?: number,
  ): Promise<void> {
    return rawInvoke('start_director_analysis', {
      sessionId,
      videoPath,
      subtitles,
      targetDurationSecs,
    }) as Promise<void>;
  },

  /** 生成 Director Plan */
  async generatePlan(
    sessionId: string,
    style?: string,
    targetDurationSecs?: number,
  ): Promise<unknown> {
    return rawInvoke('generate_director_plan', {
      sessionId,
      style,
      targetDurationSecs,
    });
  },

  /** 确认 Plan 并开始渲染 */
  async approvePlan(sessionId: string): Promise<string> {
    return rawInvoke('approve_director_plan', { sessionId }) as Promise<string>;
  },

  /** 用户修正 Plan */
  async revisePlan(sessionId: string, modifications: unknown): Promise<unknown> {
    return rawInvoke('revise_director_plan', { sessionId, modifications });
  },

  /** 渲染完成回调 */
  async completeRender(sessionId: string, outputPath: string): Promise<string> {
    return rawInvoke('complete_director_render', { sessionId, outputPath }) as Promise<string>;
  },

  /** 销毁 Director 会话 */
  async destroySession(sessionId: string): Promise<void> {
    return rawInvoke('destroy_director_session', { sessionId }) as Promise<void>;
  },

  // ─── Script Generator ────────────────────────────────────────────────────

  /** 生成解说脚本 */
  async generateScript(input: {
    subtitles: string;
    durationSecs?: number;
    targetDurationSecs?: number;
    style?: string;
    summary?: string;
    highlights?: string[];
    angle?: string;
    provider?: 'openai' | 'google' | 'deepseek' | 'qwen' | 'anthropic';
    model?: string;
    apiKey: string;
    baseUrl?: string;
    systemPromptExtra?: string;
  }): Promise<unknown> {
    return rawInvoke('generate_commentary_script', { input });
  },

  // ─── Commentary Synthesizer ─────────────────────────────────────────────

  /** 合成单条解说音频 */
  async synthesizeAudio(
    text: string,
    voice: string,
    speed?: number,
    format?: 'mp3' | 'wav' | 'ogg',
    outputPath?: string,
  ): Promise<unknown> {
    return rawInvoke('synthesize_commentary_audio', {
      text,
      voice,
      speed: speed ?? 1.0,
      format,
      outputPath,
    });
  },

  /** 估算 TTS 音频时长 */
  async estimateTTSDuration(text: string, voice: string, speed?: number): Promise<number> {
    return rawInvoke('estimate_tts_duration', {
      text,
      voice,
      speed: speed ?? 1.0,
    }) as Promise<number>;
  },

  /** 获取推荐音色列表 */
  async listVoices(style?: string): Promise<unknown[]> {
    return rawInvoke('list_commentary_voices', { style }) as Promise<unknown[]>;
  },

  // ─── Export Cancellation ──────────────────────────────────────────────────

  /** 取消正在进行的导出 */
  async cancelExport(exportId: string): Promise<void> {
    return rawInvoke('cancel_export', { export_id: exportId }) as Promise<void>;
  },
};