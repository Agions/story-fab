/**
 * AI Editor Reducer
 * 从 AIEditorContext.tsx 提取的 reducer 逻辑
 */
import type { CutDeckState, CutDeckAction, CutDeckStep } from './workflow.types';
import { initialState } from './workflow.initialState';
import { CUT_DECK_STEPS } from './workflow.constants';

// Reducer
export function clipFlowReducer(state: CutDeckState, action: CutDeckAction): CutDeckState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_STEP_COMPLETE':
      return {
        ...state,
        stepStatus: {
          ...state.stepStatus,
          [action.payload.step]: action.payload.complete,
        },
      };
    
    case 'SET_FEATURE':
      return { ...state, selectedFeature: action.payload };
    
    case 'SET_PROJECT':
      return { 
        ...state, 
        project: action.payload,
        stepStatus: action.payload ? { ...state.stepStatus, 'project-create': true } : state.stepStatus,
        currentStep: action.payload ? 'video-upload' : state.currentStep,
      };
    
    case 'SET_VIDEO':
      return { 
        ...state, 
        currentVideo: action.payload,
        duration: action.payload?.duration || 0,
        stepStatus: action.payload ? { ...state.stepStatus, 'video-upload': true } : state.stepStatus,
      };
    
    case 'SET_ANALYSIS':
      return { 
        ...state, 
        analysis: action.payload,
        stepStatus: action.payload ? { ...state.stepStatus, 'ai-analyze': true } : state.stepStatus,
      };
    
    case 'SET_ANALYZING':
      return { 
        ...state, 
        isAnalyzing: action.payload.isAnalyzing,
        analysisProgress: action.payload.progress ?? state.analysisProgress,
      };
    
    case 'SET_OCR_SUBTITLE':
      return {
        ...state,
        subtitleData: { ...state.subtitleData, ocr: action.payload },
      };
    
    case 'SET_ASR_SUBTITLE':
      return {
        ...state,
        subtitleData: { ...state.subtitleData, asr: action.payload },
      };
    
    case 'SET_SUBTITLE_PROGRESS':
      return { 
        ...state, 
        isGeneratingSubtitle: action.payload.isGenerating,
        subtitleProgress: action.payload.progress ?? state.subtitleProgress,
      };
    
    case 'SET_NARRATION_SCRIPT':
      return {
        ...state,
        scriptData: { ...state.scriptData, narration: action.payload },
      };
    
    case 'SET_REMIX_SCRIPT':
      return {
        ...state,
        scriptData: { ...state.scriptData, remix: action.payload },
      };
    
    case 'SET_SCRIPT_PROGRESS':
      return { 
        ...state, 
        isGeneratingScript: action.payload.isGenerating,
        scriptProgress: action.payload.progress ?? state.scriptProgress,
      };
    
    case 'SET_VOICE':
      return {
        ...state,
        voiceData: {
          audioUrl: action.payload.audioUrl,
          voiceSettings: action.payload.settings 
            ? { ...state.voiceData.voiceSettings, ...action.payload.settings }
            : state.voiceData.voiceSettings,
        },
      };
    
    case 'SET_VOICE_PROGRESS':
      return { 
        ...state, 
        isSynthesizingVoice: action.payload.isSynthesizing,
        voiceProgress: action.payload.progress ?? state.voiceProgress,
      };
    
    case 'SET_SYNTHESIS':
      return {
        ...state,
        synthesisData: {
          finalVideoUrl: action.payload.finalVideoUrl,
          settings: action.payload.settings
            ? { ...state.synthesisData.settings, ...action.payload.settings }
            : state.synthesisData.settings,
        },
      };
    
    case 'SET_SYNTHESIS_PROGRESS':
      return { 
        ...state, 
        isSynthesizing: action.payload.isSynthesizing,
        synthesisProgress: action.payload.progress ?? state.synthesisProgress,
      };
    
    case 'SET_EXPORT_SETTINGS':
      return { ...state, exportSettings: action.payload };
    
    case 'SET_EXPORT_PROGRESS':
      return { 
        ...state, 
        isExporting: action.payload.isExporting,
        exportProgress: action.payload.progress ?? state.exportProgress,
        stepStatus: action.payload.isExporting === false && state.exportSettings
          ? { ...state.stepStatus, 'export': true }
          : state.stepStatus,
      };
    
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'RESET':
      return initialState;
    
    case 'RESET_STEP': {
      const resetIndex = CUT_DECK_STEPS.indexOf(action.payload);
      const newStepStatus = { ...initialState.stepStatus };
      for (let i = resetIndex; i < CUT_DECK_STEPS.length; i++) {
        newStepStatus[CUT_DECK_STEPS[i]] = false;
      }
      return {
        ...state,
        currentStep: action.payload,
        stepStatus: newStepStatus,
        // 重置相关数据
        currentVideo: null,
        analysis: null,
        subtitleData: { ocr: null, asr: null },
        scriptData: { narration: null, remix: null },
        voiceData: { audioUrl: null, voiceSettings: state.voiceData.voiceSettings },
        synthesisData: { finalVideoUrl: null, settings: state.synthesisData.settings },
        exportSettings: null,
        error: null,
      };
    }

    default:
      return state;
  }
}
