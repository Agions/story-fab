/**
 * AI Editor Context 类型定义
 * 从 AIEditorContext.tsx 提取的类型定义文件
 */
import { CUT_DECK_STEPS } from './constants';

// AI 功能类型
export type AIFeatureType = 'smartClip' | 'voiceover' | 'subtitle' | 'effect' | 'none';

// AI 剪辑流程步骤
export type CutDeckStep = 
  | 'project-create'    // 1. 创建项目
  | 'video-upload'      // 2. 上传视频
  | 'ai-analyze'        // 3. AI视频分析
  | 'clip-repurpose'    // 4. AI智能拆条（新增）
  | 'script-generate'   // 5. 生成文案
  | 'video-synthesize' // 6. 视频合成
  | 'export';          // 7. 导出

// 流程状态
export interface CutDeckState {
  // 当前流程步骤
  currentStep: CutDeckStep;
  
  // 步骤完成状态
  stepStatus: {
    'project-create': boolean;
    'video-upload': boolean;
    'ai-analyze': boolean;
    'clip-repurpose': boolean;
    'script-generate': boolean;
    'video-synthesize': boolean;
    'export': boolean;
  };
  
  // 当前选中的 AI 功能
  selectedFeature: AIFeatureType;

  // 项目信息
  project: import('../../core/types').ProjectData | null;
  
  // 当前视频
  currentVideo: import('../../core/types').VideoInfo | null;
  
  // AI 分析结果
  analysis: import('../../core/types').VideoAnalysis | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  
  // 字幕数据 (OCR字幕/语音字幕)
  subtitleData: {
    ocr: Array<{ startTime: number; endTime: number; text: string }> | null;
    asr: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null;
  };
  isGeneratingSubtitle: boolean;
  subtitleProgress: number;
  
  // 文案数据 (解说文案/混剪文案)
  scriptData: {
    narration: import('../../core/types').ScriptData | null;  // 解说文案
    remix: import('../../core/types').ScriptData | null;       // 混剪文案
  };
  isGeneratingScript: boolean;
  scriptProgress: number;
  
  // 配音数据
  voiceData: {
    audioUrl: string | null;
    voiceSettings: {
      voiceId: string;
      speed: number;
      volume: number;
    };
  };
  isSynthesizingVoice: boolean;
  voiceProgress: number;
  
  // 合成视频数据
  synthesisData: {
    finalVideoUrl: string | null;
    settings: {
      syncAudioVideo: boolean;
      addSubtitles: boolean;
      addWatermark: boolean;
    };
  };
  isSynthesizing: boolean;
  synthesisProgress: number;
  
  // 导出设置
  exportSettings: import('../../core/types').ExportSettings | null;
  isExporting: boolean;
  exportProgress: number;
  
  // 播放状态
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // 错误信息
  error: string | null;
}

// 动作类型
export type CutDeckAction =
  | { type: 'SET_STEP'; payload: CutDeckStep }
  | { type: 'SET_STEP_COMPLETE'; payload: { step: CutDeckStep; complete: boolean } }
  | { type: 'SET_FEATURE'; payload: AIFeatureType }
  | { type: 'SET_PROJECT'; payload: import('../../core/types').ProjectData | null }
  | { type: 'SET_VIDEO'; payload: import('../../core/types').VideoInfo | null }
  | { type: 'SET_ANALYSIS'; payload: import('../../core/types').VideoAnalysis | null }
  | { type: 'SET_ANALYZING'; payload: { isAnalyzing: boolean; progress?: number } }
  | { type: 'SET_OCR_SUBTITLE'; payload: Array<{ startTime: number; endTime: number; text: string }> | null }
  | { type: 'SET_ASR_SUBTITLE'; payload: Array<{ startTime: number; endTime: number; text: string; speaker?: string }> | null }
  | { type: 'SET_SUBTITLE_PROGRESS'; payload: { isGenerating: boolean; progress?: number } }
  | { type: 'SET_NARRATION_SCRIPT'; payload: import('../../core/types').ScriptData | null }
  | { type: 'SET_REMIX_SCRIPT'; payload: import('../../core/types').ScriptData | null }
  | { type: 'SET_SCRIPT_PROGRESS'; payload: { isGenerating: boolean; progress?: number } }
  | { type: 'SET_VOICE'; payload: { audioUrl: string | null; settings?: { voiceId?: string; speed?: number; volume?: number } } }
  | { type: 'SET_VOICE_PROGRESS'; payload: { isSynthesizing: boolean; progress?: number } }
  | { type: 'SET_SYNTHESIS'; payload: { finalVideoUrl: string | null; settings?: { syncAudioVideo?: boolean; addSubtitles?: boolean; addWatermark?: boolean } } }
  | { type: 'SET_SYNTHESIS_PROGRESS'; payload: { isSynthesizing: boolean; progress?: number } }
  | { type: 'SET_EXPORT_SETTINGS'; payload: import('../../core/types').ExportSettings | null }
  | { type: 'SET_EXPORT_PROGRESS'; payload: { isExporting: boolean; progress?: number } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }
  | { type: 'RESET_STEP'; payload: CutDeckStep };

// 获取下一步骤
export const getNextStep = (currentStep: CutDeckStep): CutDeckStep => {
  const currentIndex = CUT_DECK_STEPS.indexOf(currentStep);
  return currentIndex < CUT_DECK_STEPS.length - 1 ? CUT_DECK_STEPS[currentIndex + 1] : currentStep;
};

export const getPrevStep = (currentStep: CutDeckStep): CutDeckStep => {
  const currentIndex = CUT_DECK_STEPS.indexOf(currentStep);
  return currentIndex > 0 ? CUT_DECK_STEPS[currentIndex - 1] : currentStep;
};
