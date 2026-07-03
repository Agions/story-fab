/**
 * story-fab — AI 视频剪辑工作台导出
 */

// Context exports
export { StoryFabProvider, useStoryFab, StoryFabContext } from './context';
export type { StoryFabContextType } from './context';

// Types exports
export type { storyfabState, storyfabStep, storyfabAction, storyfabFeatureType } from '@/core/types/storyfab';
export { getNextStep, getPrevStep, STORYFAB_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from '@/core/types/storyfab';

// Workspace exports
export { Workspace, ProjectSetup, VideoUpload, AIVisualizer, ScriptWriting, VideoComposing, ClipRippling, VideoExport, StepList } from '@/pages/workspace';
export type { AIFunctionType } from '@/pages/workspace';
