/**
 * useCommentary mock factory
 */

import { vi } from 'vitest';
import type { UseCommentaryReturn } from '@/components/commentary-panel/use-commentary';
import type { CommentaryPanelState } from '@/components/commentary-panel/commentary-panel-reducer';
import type { CommentaryScriptOutput, VoiceInfo, PipelineProgressEvent, PipelineErrorEvent } from '@/types';

export interface MockCommentaryOptions {
  state?: Partial<CommentaryPanelState>;
  script?: CommentaryScriptOutput | null;
  voices?: VoiceInfo[];
  selectedVoice?: string;
  multiStyleMode?: boolean;
  isGenerating?: boolean;
  isPipelineRunning?: boolean;
  pipelineProgress?: PipelineProgressEvent | null;
  pipelineError?: PipelineErrorEvent | null;
  sessionId?: string | null;
  currentState?: string;
  progressPct?: number;
}

export function createMockCommentary(options: MockCommentaryOptions = {}): UseCommentaryReturn {
  const {
    state = {},
    script = null,
    voices = [],
    selectedVoice = 'default-voice',
    multiStyleMode = false,
    isGenerating = false,
    isPipelineRunning = false,
    pipelineProgress = null,
    pipelineError = null,
    sessionId = null,
    currentState = 'idle',
    progressPct = 0,
  } = options;

  const defaultState: CommentaryPanelState = {
    activeTab: 'script',
    planConfirmOpen: false,
    apiKey: '',
    selectedStyle: 'conversational',
  };

  return {
    state: { ...defaultState, ...state },
    dispatch: vi.fn(),
    sessionId,
    directorStatus: null,
    currentState,
    progressPct,
    script,
    scripts: new Map(),
    activeScriptStyle: null,
    multiStyleMode,
    isGenerating,
    voices,
    selectedVoice,
    isPreviewing: false,
    isPipelineRunning,
    pipelineProgress,
    pipelineError,
    handleGenerateScript: vi.fn(),
    handleMultiStyleGenerate: vi.fn(),
    handleSegmentChange: vi.fn(),
    handleGeneratePlan: vi.fn(),
    handleApprovePlan: vi.fn(),
    handlePreviewVoice: vi.fn(),
    toggleMultiStyleMode: vi.fn(),
    handleRunPipeline: vi.fn(),
  } as UseCommentaryReturn;
}
