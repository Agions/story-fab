import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentaryTrackList from './commentary-track-list';
import type { CommentaryScriptOutput, ScriptStylePreset } from '@/types';

// Mock useCommentaryVoice to avoid Tauri deps in tests
vi.mock('@/hooks/use-commentary-voice', () => ({
  useCommentaryVoice: () => ({
    voices: [],
    selectedVoice: 'voice-1',
    setSelectedVoice: vi.fn(),
    previewVoice: vi.fn(),
    isPreviewing: false,
    stopPreview: vi.fn(),
    isLoading: false,
  }),
}));

describe('CommentaryTrackList', () => {
  const mockScript: CommentaryScriptOutput = {
    fullScript: '测试脚本',
    segments: [{ startTime: 0, endTime: 10, text: '测试段落' }],
    estimatedDurationSecs: 10,
    modelUsed: 'gpt-4',
    provider: 'openai',
  };

  const defaultProps = {
    dispatch: vi.fn(),
    apiKey: 'test-key',
    script: mockScript,
    scripts: new Map<ScriptStylePreset, CommentaryScriptOutput>(),
    activeScriptStyle: undefined,
    multiStyleMode: false,
    isGenerating: false,
    voices: [],
    selectedVoice: 'voice-1',
    isPreviewing: false,
    selectedStyle: 'conversational' as ScriptStylePreset,
    onGenerate: vi.fn(),
    onMultiGenerate: vi.fn(),
    onSegmentChange: vi.fn(),
    onSetApiKey: vi.fn(),
  };

  it('renders all tab triggers', () => {
    render(<CommentaryTrackList {...defaultProps} />);
    expect(screen.getByText('脚本')).toBeInTheDocument();
    expect(screen.getByText('风格')).toBeInTheDocument();
    expect(screen.getByText('音色')).toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
  });

  it('renders script tab content by default', () => {
    render(<CommentaryTrackList {...defaultProps} />);
    expect(screen.getByText('完整解说文案')).toBeInTheDocument();
  });

  it('renders segment content in script tab', () => {
    render(<CommentaryTrackList {...defaultProps} />);
    expect(screen.getByText('分段解说（1 段）')).toBeInTheDocument();
  });

  it('renders script text content in script tab', () => {
    render(<CommentaryTrackList {...defaultProps} />);
    expect(screen.getByText('测试段落')).toBeInTheDocument();
  });

  it('calls dispatch when style tab is clicked', async () => {
    const dispatch = vi.fn();
    render(<CommentaryTrackList {...defaultProps} dispatch={dispatch} />);
    await userEvent.click(screen.getByText('风格'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ACTIVE_TAB', payload: 'style' });
  });

  it('calls dispatch when voice tab is clicked', async () => {
    const dispatch = vi.fn();
    render(<CommentaryTrackList {...defaultProps} dispatch={dispatch} />);
    await userEvent.click(screen.getByText('音色'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ACTIVE_TAB', payload: 'voice' });
  });
});
