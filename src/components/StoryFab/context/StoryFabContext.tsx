/**
 * StoryFabContext — re-export barrel
 * 所有导出都委托给 StoryFabProvider.tsx
 */
export {
  StoryFabProvider,
  useStoryFab,
  StoryFabContext,
} from './StoryFabProvider';

export type { StoryFabContextType } from './StoryFabProvider';
export type { storyfabAction, storyfabState, storyfabStep, storyfabFeatureType } from '../types';
