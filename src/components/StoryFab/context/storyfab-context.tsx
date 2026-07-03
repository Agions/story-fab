/**
 * StoryFabContext — re-export barrel
 * 所有导出都委托给 StoryFabProvider.tsx
 */
export {
  StoryFabProvider,
  useStoryFab,
  StoryFabContext,
} from './storyfab-provider';

export type { StoryFabContextType } from './storyfab-provider';
export type { storyfabAction, storyfabState, storyfabStep, storyfabFeatureType } from '@/core/types/storyfab';
