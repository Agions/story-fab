/**
 * story-fab context — context barrel export
 */
export { StoryFabProvider, useStoryFab, StoryFabContext } from './storyfab-context';
export type { StoryFabContextType } from './storyfab-context';

// Re-export types for convenience
export type { storyfabState, storyfabStep, storyfabAction, storyfabFeatureType, storyfabMode } from '../types';
export type { SemanticSegment } from '../types';
export type { AIFeatureType } from '@/types';
export { STORYFAB_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from '../types';
