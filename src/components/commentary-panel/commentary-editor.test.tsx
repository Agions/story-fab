import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommentaryEditor from './commentary-editor';
import type { CommentaryScriptOutput } from '@/types';

describe('CommentaryEditor', () => {
  const mockScript: CommentaryScriptOutput = {
    fullScript: '测试脚本内容',
    segments: [{ startTime: 0, endTime: 10, text: '段落1' }],
    estimatedDurationSecs: 10,
    modelUsed: 'gpt-4',
    provider: 'openai',
  };

  const defaultProps = {
    script: mockScript,
    isGenerating: false,
    onGenerate: vi.fn(),
    apiKey: 'test-key',
    onApiKeyChange: vi.fn(),
    onSegmentChange: vi.fn(),
  };

  it('renders script when provided', () => {
    render(<CommentaryEditor {...defaultProps} script={mockScript} />);
    expect(screen.getByText('完整解说文案')).toBeInTheDocument();
    expect(screen.getByText('测试脚本内容')).toBeInTheDocument();
  });

  it('renders API key input when script is null', () => {
    render(<CommentaryEditor {...defaultProps} script={null} />);
    expect(screen.getByPlaceholderText('输入 API Key（用于 LLM 生成脚本）')).toBeInTheDocument();
  });
});
