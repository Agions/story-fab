/**
 * story-fab context — context barrel export
 */
export { StoryFabProvider, useStoryFab, StoryFabContext } from './storyfab-context';
export type { StoryFabContextType } from './storyfab-context';

// Re-export types for convenience
export type { storyfabState, storyfabStep, storyfabAction, storyfabFeatureType, storyfabMode } from '@/core/types/storyfab';
export type { SemanticSegment } from '@/core/types/storyfab';
export type { AIFeatureType } from '@/types';
export { STORYFAB_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from '@/core/types/storyfab';
