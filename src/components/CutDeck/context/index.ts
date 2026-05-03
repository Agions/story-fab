/**
 * CutDeck context — context barrel export
 */
export { CutDeckProvider, useCutDeck, CutDeckContext, useAIEditor } from './CutDeckContext';
export type { CutDeckContextType } from './CutDeckContext';

// Re-export types for convenience
export type { CutDeckState, CutDeckStep, CutDeckAction, AIFeatureType } from '../types';
export { CUT_DECK_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from '../types';

// ─── Zustand Store (新) ────────────────────────────────────────────────────────
export { useCutDeckStore, useCutDeckStoreShallow } from './cutDeckStore';
export type { CutDeckStore } from './cutDeckStore';
