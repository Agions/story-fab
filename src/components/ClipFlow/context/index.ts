/**
 * clipflow context — context barrel export
 */
export { ClipFlowProvider, useClipFlow, ClipFlowContext } from './ClipFlowContext';
export type { ClipFlowContextType } from './ClipFlowContext';

// Re-export types for convenience
export type { clipflowState, clipflowStep, clipflowAction, clipflowFeatureType, clipflowMode } from '../types';
export type { SemanticSegment } from '../types';
export type { AIFeatureType } from '@/core/types';
export { CLIPFLOW_STEPS, INITIAL_STEP_STATUS, DEFAULT_VOICE_SETTINGS, DEFAULT_SYNTHESIS_SETTINGS } from '../types';
