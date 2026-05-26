/**
 * story-fab — AI 视频剪辑工作台导出
 */

// Context exports
export { StoryFabProvider, useStoryFab, StoryFabContext } from './context';
export type { StoryFabContextType } from './context';

// Types exports
export type { storyfabState, storyfabStep, storyfabAction, storyfabFeatureType } from './types';
export { getNextStep, getPrevStep } from './types';
export { STORYFAB_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from './types';

// Workspace exports
export { Workspace, ProjectSetup, VideoUpload, AIVisualizer, ScriptWriting, VideoComposing, ClipRippling, VideoExport, StepList } from './workspace';
export type { AIFunctionType } from './workspace';
