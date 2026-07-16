import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentaryScriptEditor from './commentary-script-editor';
import type { CommentaryScriptOutput } from '@/types';

describe('CommentaryScriptEditor', () => {
  const mockScript: CommentaryScriptOutput = {
    fullScript: '这是完整的解说文案内容',
    segments: [
      { startTime: 0, endTime: 10, text: '开场介绍', emotion: '开心' },
      { startTime: 10, endTime: 30, text: '主要内容' },
    ],
    estimatedDurationSecs: 30,
    modelUsed: 'gpt-4',
    provider: 'openai',
  };

  const defaultProps = {
    script: null,
    isGenerating: false,
    onGenerate: vi.fn(),
    apiKey: '',
    onApiKeyChange: vi.fn(),
    onSegmentChange: vi.fn(),
  };

  it('renders API Key input', () => {
    render(<CommentaryScriptEditor {...defaultProps} />);
    expect(screen.getByPlaceholderText('输入 API Key（用于 LLM 生成脚本）')).toBeInTheDocument();
  });

  it('renders empty state when script is null', () => {
    render(<CommentaryScriptEditor {...defaultProps} />);
    expect(
      screen.getByText('点击"生成脚本"开始创作解说文案'),
    ).toBeInTheDocument();
  });

  it('renders full script when script is provided', () => {
    render(<CommentaryScriptEditor {...defaultProps} script={mockScript} />);
    expect(screen.getByText('完整解说文案')).toBeInTheDocument();
    expect(screen.getByText('这是完整的解说文案内容')).toBeInTheDocument();
  });

  it('renders segment list when script has segments', () => {
    render(<CommentaryScriptEditor {...defaultProps} script={mockScript} />);
    expect(screen.getByText('分段解说（2 段）')).toBeInTheDocument();
    expect(screen.getByText('开场介绍')).toBeInTheDocument();
    expect(screen.getByText('主要内容')).toBeInTheDocument();
  });

  it('calls onApiKeyChange when typing in API key input', async () => {
    const onApiKeyChange = vi.fn();
    render(
      <CommentaryScriptEditor {...defaultProps} onApiKeyChange={onApiKeyChange} />,
    );
    const input = screen.getByPlaceholderText('输入 API Key（用于 LLM 生成脚本）');
    await userEvent.type(input, 'test-key');
    expect(onApiKeyChange).toHaveBeenCalled();
  });

  it('renders copy button when script exists', () => {
    render(<CommentaryScriptEditor {...defaultProps} script={mockScript} />);
    expect(screen.getByText('复制')).toBeInTheDocument();
  });

  it('renders script metadata', () => {
    render(<CommentaryScriptEditor {...defaultProps} script={mockScript} />);
    expect(screen.getByText('预计时长：30 秒')).toBeInTheDocument();
    expect(screen.getByText('模型：gpt-4')).toBeInTheDocument();
    expect(screen.getByText('提供商：openai')).toBeInTheDocument();
  });
});
