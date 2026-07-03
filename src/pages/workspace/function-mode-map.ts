import type { storyfabFeatureType } from '@/components/StoryFab/context';

export type AIFunctionType = 'video-narration' | 'first-person' | 'remix';
export type AIFunctionTabKey = 'commentary-first' | 'commentary' | 'mix';
export const FEATURE_TO_FUNCTION: Partial<Record<'smartClip' | 'voiceover' | 'subtitle', AIFunctionType>> = {
  smartClip: 'remix',
  voiceover: 'first-person',
  subtitle: 'video-narration',
};

export const FUNCTION_TO_FEATURE: Record<AIFunctionType, 'smartClip' | 'voiceover' | 'subtitle'> = {
  remix: 'smartClip',
  'first-person': 'voiceover',
  'video-narration': 'subtitle',
};

export const TAB_TO_FEATURE: Record<AIFunctionTabKey, storyfabFeatureType> = {
  'commentary-first': 'voiceover',
  commentary: 'subtitle',
  mix: 'smartClip',
};
