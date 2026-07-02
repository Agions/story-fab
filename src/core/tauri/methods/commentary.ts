import { invoke, TauriCommand } from '../invoke';
import type { DirectorPlan, DirectorStatusResponse } from '@/types';

export const commentary = {
  /** 创建 Commentary Director 会话 */
  async createSession(sessionId: string, style?: string): Promise<string> {
    return invoke(TauriCommand.CREATE_DIRECTOR_SESSION, { sessionId, style }) as Promise<string>;
  },

  /** 获取 Director 状态 */
  async getStatus(sessionId: string): Promise<DirectorStatusResponse> {
    return invoke(TauriCommand.GET_DIRECTOR_STATUS, { sessionId }) as Promise<DirectorStatusResponse>;
  },

  /** 开始分析视频 */
  async startAnalysis(sessionId: string, videoPath: string, subtitles: string, targetDurationSecs?: number): Promise<void> {
    await invoke(TauriCommand.START_DIRECTOR_ANALYSIS, { sessionId, videoPath, subtitles, targetDurationSecs });
  },

  /** 生成 Director Plan */
  async generatePlan(sessionId: string, style?: string, targetDurationSecs?: number): Promise<DirectorPlan> {
    return invoke(TauriCommand.GENERATE_DIRECTOR_PLAN, { sessionId, style, targetDurationSecs }) as unknown as Promise<DirectorPlan>;
  },

  /** 确认 Plan 并开始渲染 */
  async approvePlan(sessionId: string): Promise<string> {
    return invoke(TauriCommand.APPROVE_DIRECTOR_PLAN, { sessionId }) as Promise<string>;
  },

  /** 用户修正 Plan */
  async revisePlan(sessionId: string, modifications: Record<string, unknown>): Promise<DirectorPlan> {
    return invoke(TauriCommand.REVISE_DIRECTOR_PLAN, { sessionId, modifications }) as unknown as Promise<DirectorPlan>;
  },

  /** 渲染完成回调 */
  async completeRender(sessionId: string, outputPath: string): Promise<string> {
    return invoke(TauriCommand.COMPLETE_DIRECTOR_RENDER, { sessionId, outputPath }) as Promise<string>;
  },

  /** 销毁 Director 会话 */
  async destroySession(sessionId: string): Promise<void> {
    await invoke(TauriCommand.DESTROY_DIRECTOR_SESSION, { sessionId });
  },

  /** 生成解说脚本 */
  async generateScript(input: { subtitles: string; style?: string; apiKey: string; provider?: string }) {
    return invoke(TauriCommand.GENERATE_COMMENTARY_SCRIPT, input);
  },

  /** 合成音频 */
  async synthesizeAudio(text: string, voice: string, speed: number, format: string, outputPath?: string): Promise<{ audioPath: string; durationSecs: number }> {
    return invoke(TauriCommand.SYNTHESIZE_COMMENTARY_AUDIO, { text, voice, speed, format, outputPath }) as Promise<{ audioPath: string; durationSecs: number }>;
  },

  /** 估算 TTS 时长 */
  async estimateTTSDuration(text: string, voice: string, speed: number): Promise<number> {
    return invoke(TauriCommand.ESTIMATE_TTS_DURATION, { text, voice, speed }) as Promise<number>;
  },

  /** 列出可用音色 */
  async listVoices(): Promise<Array<{ id: string; name: string; gender: string; style: string; description: string }>> {
    return invoke(TauriCommand.LIST_COMMENTARY_VOICES, undefined) as Promise<Array<{ id: string; name: string; gender: string; style: string; description: string }>>;
  },
};
