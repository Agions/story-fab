import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiVisualizerControls from './ai-visualizer-controls';
import { createMockAiVisualizer } from '../../../__tests__/mocks/ai-visualizer';

// Mock the useAiVisualizer hook
vi.mock('./use-ai-visualizer', () => ({
  useAiVisualizer: () => createMockAiVisualizer(),
}));

describe('AiVisualizerControls', () => {
  it('renders all analysis task cards', () => {
    render(<AiVisualizerControls />);
    expect(screen.getByText('场景识别')).toBeInTheDocument();
    expect(screen.getByText('OCR 文字识别')).toBeInTheDocument();
    expect(screen.getByText('语音转写')).toBeInTheDocument();
    expect(screen.getByText('情感分析')).toBeInTheDocument();
    expect(screen.getByText('内容摘要')).toBeInTheDocument();
  });

  it('renders start button', () => {
    render(<AiVisualizerControls />);
    expect(screen.getByText('开始 AI 分析')).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(<AiVisualizerControls />);
    expect(screen.getByText(/已选择 \d+ 项分析任务/)).toBeInTheDocument();
  });

  it('disables start button when no tasks selected', () => {
    render(<AiVisualizerControls />);
    const startBtn = screen.getByText('开始 AI 分析').closest('button');
    expect(startBtn).toBeDisabled();
  });

  it('renders start button with correct text', () => {
    render(<AiVisualizerControls />);
    const startBtn = screen.getByText('开始 AI 分析');
    expect(startBtn).toBeInTheDocument();
    expect(startBtn.tagName).toBe('BUTTON');
  });
});
