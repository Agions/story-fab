import { invoke, TauriCommand } from '../invoke';
import type { CommentaryScriptOutput } from '@/types';

export const aiScript = {
  /** 生成解说脚本 */
  async generateNarrationScript(input: { subtitles: string; style?: string; apiKey: string; provider?: string }): Promise<CommentaryScriptOutput> {
    return invoke(TauriCommand.GENERATE_NARRATION_SCRIPT, input);
  },

  /** 分析视频内容 */
  async analyzeVideoForNarration(input: { videoPath: string; duration?: number }): Promise<{ videoType: string; summary: string; keyScenes: number[] }> {
    return invoke(TauriCommand.ANALYZE_VIDEO_FOR_NARRATION, input);
  },

  /** 列出可用的 AI 模型 */
  async listAvailableModels(): Promise<Array<{ id: string; name: string; provider: string; contextLimit: number }>> {
    return invoke(TauriCommand.LIST_AVAILABLE_MODELS, {});
  },
};
