/**
 * useAiVisualizer mock factory
 */

import { vi } from 'vitest';
import type { UseAiVisualizerReturn } from '@/pages/workspace/assemble/use-ai-visualizer';
import type { AIVisualizerState } from '@/pages/workspace/assemble/ai-visualizer-reducer';
import type { StoryFabState } from '@/core/types/storyfab';

export interface MockAiVisualizerOptions {
  localState?: Partial<AIVisualizerState>;
  selectedCount?: number;
  hasAnalysis?: boolean | null;
  projectState?: Partial<StoryFabState>;
}

export function createMockAiVisualizer(options: MockAiVisualizerOptions = {}): UseAiVisualizerReturn {
  const {
    localState = {},
    selectedCount = 0,
    hasAnalysis = null,
    projectState = {},
  } = options;

  const defaultLocalState: AIVisualizerState = {
    analyzing: false,
    progress: 0,
    currentTaskKey: '',
    completedTasks: [],
    visibleTasks: [],
    config: {
      sceneDetection: true,
      objectDetection: true,
      emotionAnalysis: true,
      ocrEnabled: true,
      asrEnabled: true,
    },
  };

  const defaultProjectState = {
    currentVideo: null,
    analysis: null,
    subtitleData: { ocr: [], asr: [] },
    stepStatus: {},
    ...projectState,
  } as unknown as StoryFabState;

  return {
    projectState: defaultProjectState,
    localState: { ...defaultLocalState, ...localState },
    selectedCount,
    hasAnalysis,
    toggleConfig: vi.fn(),
    runAnalysis: vi.fn(),
    handleReAnalyze: vi.fn(),
    goToNextStep: vi.fn(),
  } as UseAiVisualizerReturn;
}
