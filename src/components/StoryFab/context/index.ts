/**
 * story-fab context — context barrel export
 */
export { StoryFabProvider, useStoryFab, StoryFabContext } from './StoryFabContext';
export type { StoryFabContextType } from './StoryFabContext';

// Re-export types for convenience
export type { storyfabState, storyfabStep, storyfabAction, storyfabFeatureType, storyfabMode } from '../types';
export type { SemanticSegment } from '../types';
export type { AIFeatureType } from '@/core/types';
export { STORYFAB_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from '../types';
