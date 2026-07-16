import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiVisualizerHeader from './ai-visualizer-header';

describe('AiVisualizerHeader', () => {
  it('renders title and subtitle', () => {
    render(
      <AiVisualizerHeader
        title="AI 分析"
        subtitle="AI 正在分析您的视频"
      />,
    );
    expect(screen.getByText('AI 分析')).toBeInTheDocument();
    expect(screen.getByText('AI 正在分析您的视频')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <AiVisualizerHeader
        title="AI 分析"
        subtitle="AI 正在分析您的视频"
      >
        <button>extra action</button>
      </AiVisualizerHeader>,
    );
    expect(screen.getByText('extra action')).toBeInTheDocument();
  });
});
