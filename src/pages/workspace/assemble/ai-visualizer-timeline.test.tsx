import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiVisualizerTimeline from './ai-visualizer-timeline';
import { createMockAiVisualizer } from '../../../__tests__/mocks/ai-visualizer';
import type { VideoAnalysis, VideoInfo } from '@/types';

const mockUseAiVisualizer = vi.fn(() =>
  createMockAiVisualizer({
    hasAnalysis: true,
    projectState: {
      analysis: {
        id: 'analysis_1',
        videoId: 'video_1',
        scenes: [
          { id: 'scene_1', startTime: 0, endTime: 10, description: '开场', type: 'intro' as const, score: 0.9 },
          { id: 'scene_2', startTime: 10, endTime: 30, description: '主要', type: 'action' as const, score: 0.85 },
        ],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: {
          sceneCount: 2,
          objectCount: 5,
          avgSceneDuration: 15,
          sceneTypes: {},
          objectCategories: {},
          dominantEmotions: {},
        },
        createdAt: new Date().toISOString(),
      } as VideoAnalysis,
      currentVideo: {
        id: 'video_1',
        path: '',
        name: 'test.mp4',
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        format: 'mp4',
        size: 1000000,
        thumbnail: '',
        createdAt: new Date().toISOString(),
      } as VideoInfo,
    },
  }),
);

vi.mock('./use-ai-visualizer', () => ({
  useAiVisualizer: () => mockUseAiVisualizer(),
}));

vi.mock('./highlights/highlights', () => ({
  Highlights: () => null,
}));

describe('AiVisualizerTimeline', () => {
  it('renders completion badge with title', () => {
    render(<AiVisualizerTimeline />);
    expect(screen.getByText('分析完成')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    render(<AiVisualizerTimeline />);
    expect(
      screen.getByText('视频内容已全面分析，您可以继续下一步'),
    ).toBeInTheDocument();
  });

  it('renders scene count result', () => {
    render(<AiVisualizerTimeline />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('场景数')).toBeInTheDocument();
  });

  it('renders scene list', () => {
    render(<AiVisualizerTimeline />);
    expect(screen.getByText('开场')).toBeInTheDocument();
    expect(screen.getByText('主要')).toBeInTheDocument();
  });

  it('renders re-analyze button', () => {
    render(<AiVisualizerTimeline />);
    expect(screen.getByText('重新分析')).toBeInTheDocument();
  });

  it('returns null when hasAnalysis is false', () => {
    mockUseAiVisualizer.mockReturnValueOnce(
      createMockAiVisualizer({ hasAnalysis: false }),
    );

    const { container } = render(<AiVisualizerTimeline />);
    expect(container.innerHTML).toBe('');
  });

  it('renders "more scenes" indicator when scenes exceed 5', () => {
    mockUseAiVisualizer.mockReturnValueOnce(
      createMockAiVisualizer({
        hasAnalysis: true,
        projectState: {
          analysis: {
            id: 'analysis_1',
            videoId: 'video_1',
            scenes: Array.from({ length: 8 }, (_, i) => ({
              id: `scene_${i + 1}`,
              startTime: i * 10,
              endTime: (i + 1) * 10,
              description: `Scene ${i + 1}`,
              type: 'action' as const,
              score: 0.9 - i * 0.05,
            })),
            keyframes: [],
            objects: [],
            emotions: [],
            summary: '',
            stats: {
              sceneCount: 8,
              objectCount: 0,
              avgSceneDuration: 10,
              sceneTypes: {},
              objectCategories: {},
              dominantEmotions: {},
            },
            createdAt: new Date().toISOString(),
          } as VideoAnalysis,
          currentVideo: {
            id: 'video_1',
            path: '',
            name: 'test.mp4',
            duration: 80,
            width: 1920,
            height: 1080,
            fps: 30,
            format: 'mp4',
            size: 1000000,
            thumbnail: '',
            createdAt: new Date().toISOString(),
          } as VideoInfo,
        },
      }),
    );

    render(<AiVisualizerTimeline />);
    expect(screen.getByText('还有 3 个场景...')).toBeInTheDocument();
  });
});
