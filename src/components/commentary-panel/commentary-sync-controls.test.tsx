import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentarySyncControls from './commentary-sync-controls';

describe('CommentarySyncControls', () => {
  const defaultProps = {
    disabled: false,
    subtitles: '测试字幕',
    apiKey: 'test-api-key',
    currentState: 'idle',
    multiStyleMode: false,
    isGenerating: false,
    isPipelineRunning: false,
    isPreviewing: false,
    script: null,
    onGenerate: vi.fn(),
    onMultiGenerate: vi.fn(),
    onGeneratePlan: vi.fn(),
    onToggleMultiStyle: vi.fn(),
    onPreviewVoice: vi.fn(),
    onRunPipeline: vi.fn(),
  };

  it('renders generate script button', () => {
    render(<CommentarySyncControls {...defaultProps} />);
    expect(screen.getByText('生成脚本')).toBeInTheDocument();
  });

  it('renders AI director plan button', () => {
    render(<CommentarySyncControls {...defaultProps} />);
    expect(screen.getByText('AI 导演规划')).toBeInTheDocument();
  });

  it('renders multi-style toggle button', () => {
    render(<CommentarySyncControls {...defaultProps} />);
    expect(screen.getByText('多风格')).toBeInTheDocument();
  });

  it('calls onGenerate when generate button is clicked', async () => {
    const onGenerate = vi.fn();
    render(<CommentarySyncControls {...defaultProps} onGenerate={onGenerate} />);
    await userEvent.click(screen.getByText('生成脚本'));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('calls onGeneratePlan when plan button is clicked', async () => {
    const onGeneratePlan = vi.fn();
    render(
      <CommentarySyncControls {...defaultProps} onGeneratePlan={onGeneratePlan} />,
    );
    await userEvent.click(screen.getByText('AI 导演规划'));
    expect(onGeneratePlan).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleMultiStyle when multi-style button is clicked', async () => {
    const onToggleMultiStyle = vi.fn();
    render(
      <CommentarySyncControls
        {...defaultProps}
        onToggleMultiStyle={onToggleMultiStyle}
      />,
    );
    await userEvent.click(screen.getByText('多风格'));
    expect(onToggleMultiStyle).toHaveBeenCalledTimes(1);
  });

  it('disables generate button when subtitles is empty', () => {
    render(<CommentarySyncControls {...defaultProps} subtitles="" />);
    expect(screen.getByText('生成脚本')).toBeDisabled();
  });

  it('disables generate button when apiKey is empty', () => {
    render(<CommentarySyncControls {...defaultProps} apiKey="" />);
    expect(screen.getByText('生成脚本')).toBeDisabled();
  });

  it('shows batch generate text in multi-style mode', () => {
    render(<CommentarySyncControls {...defaultProps} multiStyleMode={true} />);
    expect(screen.getByText('批量生成')).toBeInTheDocument();
  });

  it('shows preview voice button when script exists', () => {
    const mockScript = {
      fullScript: 'test',
      segments: [],
      estimatedDurationSecs: 10,
      modelUsed: 'gpt-4',
      provider: 'openai',
    };
    render(<CommentarySyncControls {...defaultProps} script={mockScript} />);
    expect(screen.getByText('预览配音')).toBeInTheDocument();
  });

  it('disables plan button when currentState is not idle', () => {
    render(<CommentarySyncControls {...defaultProps} currentState="analyzing" />);
    expect(screen.getByText('AI 导演规划')).toBeDisabled();
  });
});
