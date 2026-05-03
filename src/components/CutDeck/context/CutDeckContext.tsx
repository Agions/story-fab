/**
 * CutDeckContext — re-export barrel
 * 所有导出都委托给 CutDeckProvider.tsx
 */
export {
  CutDeckProvider,
  useCutDeck,
  CutDeckContext,
  // CutDeckAction / CutDeckState / CutDeckStep / AIFeatureType re-exported by CutDeckProvider
} from './CutDeckProvider';

export type { CutDeckContextType } from './CutDeckProvider';
export type { CutDeckAction, CutDeckState, CutDeckStep, AIFeatureType } from '../types';

/** @deprecated 请使用 useCutDeck 代替 */
export const useAIEditor = () => {
  console.warn('useAIEditor 已弃用，请使用 useCutDeck');
  const { useCutDeck } = require('./CutDeckProvider');
  return useCutDeck();
};
