import { invoke, TauriCommand } from '../TauriBridge';

export const aiScript = {
  /**
   * 生成解说脚本
   * @param input — 包含 model_id, api_key, video_path, analysis, options
   */
  async generateNarrationScript(input: {
    modelId: string;
    apiKey: string;
    videoPath: string;
    analysis: string;
    options?: {
      style?: string;
      tone?: string;
      language?: string;
      maxWords?: number;
    };
  }) {
    return invoke(TauriCommand.GENERATE_NARRATION_SCRIPT, { input }) as Promise<{
      script: string;
      segments: Array<{ start_ms: number; end_ms: number; text: string }>;
      model: string;
      tokens_used: number;
    }>;
  },

  /**
   * 分析视频内容为解说生成做准备
   * @param input — 包含 model_id, api_key, video_path, analysis_hints
   */
  async analyzeVideoForNarration(input: {
    modelId: string;
    apiKey: string;
    videoPath: string;
    analysisHints?: string[];
  }) {
    return invoke(TauriCommand.ANALYZE_VIDEO_FOR_NARRATION, { input }) as Promise<{
      summary: string;
      keyPoints: string[];
      suggestedTone: string;
      estimatedDurationSec: number;
      sceneDescriptions: Array<{ start_ms: number; end_ms: number; description: string }>;
    }>;
  },

  /** 列出当前 API Key 可用的模型 */
  async listAvailableModels(apiKeys: Record<string, string>) {
    return invoke(TauriCommand.LIST_AVAILABLE_MODELS, { apiKeys }) as Promise<
      Array<{ id: string; name: string; provider: string; isAvailable: boolean }>
    >;
  },
};