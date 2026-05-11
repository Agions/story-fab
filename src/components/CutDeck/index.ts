/**
 * CutDeck — AI 视频剪辑工作台导出
 */

// Context exports
export { CutDeckProvider, useCutDeck, CutDeckContext } from './context';
export type { CutDeckContextType } from './context';

// Types exports
export type { CutDeckState, CutDeckStep, CutDeckAction, CutDeckFeatureType } from './types';
export { getNextStep, getPrevStep } from './types';
export { CUT_DECK_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from './types';

// Workspace exports
export { Workspace, ProjectSetup, VideoUpload, AIVisualizer, ScriptWriting, VideoComposing, ClipRippling, VideoExport, StepList } from './workspace';
export type { AIFunctionType } from './workspace';
