import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiVisualizerCanvas from './ai-visualizer-canvas';
import { createMockAiVisualizer } from '../../../__tests__/mocks/ai-visualizer';

// Mock the useAiVisualizer hook - default mock returns analyzing=true
const mockUseAiVisualizer = vi.fn(() =>
  createMockAiVisualizer({
    localState: {
      analyzing: true,
      progress: 50,
      currentTaskKey: 'scene',
      completedTasks: [],
      visibleTasks: ['scene'],
      config: {
        sceneDetection: true,
        objectDetection: true,
        emotionAnalysis: true,
        ocrEnabled: true,
        asrEnabled: true,
      },
    },
  }),
);

vi.mock('./use-ai-visualizer', () => ({
  useAiVisualizer: () => mockUseAiVisualizer(),
}));

describe('AiVisualizerCanvas', () => {
  it('renders progress percentage', () => {
    render(<AiVisualizerCanvas />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders analyzing status label', () => {
    render(<AiVisualizerCanvas />);
    expect(screen.getByText('正在分析...')).toBeInTheDocument();
  });

  it('renders task list items', () => {
    render(<AiVisualizerCanvas />);
    expect(screen.getByText('场景识别')).toBeInTheDocument();
    expect(screen.getByText('OCR 文字识别')).toBeInTheDocument();
    expect(screen.getByText('语音转写')).toBeInTheDocument();
    expect(screen.getByText('情感分析')).toBeInTheDocument();
    expect(screen.getByText('内容摘要')).toBeInTheDocument();
  });

  it('renders neural visualization SVG', () => {
    render(<AiVisualizerCanvas />);
    const svg = document.querySelector('svg[viewBox="0 0 280 120"]');
    expect(svg).toBeInTheDocument();
  });

  it('returns null when not analyzing', () => {
    mockUseAiVisualizer.mockReturnValueOnce(
      createMockAiVisualizer({
        localState: {
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
        },
      }),
    );

    const { container } = render(<AiVisualizerCanvas />);
    expect(container.innerHTML).toBe('');
  });

  it('shows completed state when analyzing with progress 100', () => {
    mockUseAiVisualizer.mockReturnValueOnce(
      createMockAiVisualizer({
        localState: {
          analyzing: true,
          progress: 100,
          currentTaskKey: '',
          completedTasks: ['scene', 'ocr'],
          visibleTasks: ['scene', 'ocr', 'asr', 'emotion', 'summary'],
          config: {
            sceneDetection: true,
            objectDetection: true,
            emotionAnalysis: true,
            ocrEnabled: true,
            asrEnabled: true,
          },
        },
      }),
    );

    render(<AiVisualizerCanvas />);
    expect(screen.getByText('分析完成')).toBeInTheDocument();
  });
});
