import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommentaryTimeline from './commentary-timeline';
import type { CommentarySegment } from '@/types';

describe('CommentaryTimeline', () => {
  const mockSegments: CommentarySegment[] = [
    { startTime: 0, endTime: 10, text: '开场介绍' },
    { startTime: 10, endTime: 30, text: '主要内容' },
    { startTime: 30, endTime: 60, text: '结尾总结' },
  ];

  it('renders hint text', () => {
    render(
      <CommentaryTimeline
        segments={mockSegments}
        voice="default-voice"
        totalDuration={60}
      />,
    );
    expect(screen.getByText('解说片段与时间轴对齐预览')).toBeInTheDocument();
  });

  it('renders correct number of segment items', () => {
    render(
      <CommentaryTimeline
        segments={mockSegments}
        voice="default-voice"
        totalDuration={60}
      />,
    );
    expect(screen.getByText('开场介绍')).toBeInTheDocument();
    expect(screen.getByText('主要内容')).toBeInTheDocument();
    expect(screen.getByText('结尾总结')).toBeInTheDocument();
  });

  it('renders segment text in the list', () => {
    render(
      <CommentaryTimeline
        segments={mockSegments}
        voice="default-voice"
        totalDuration={60}
      />,
    );
    mockSegments.forEach((seg) => {
      expect(screen.getAllByText(seg.text).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders play buttons for each segment', () => {
    render(
      <CommentaryTimeline
        segments={mockSegments}
        voice="default-voice"
        totalDuration={60}
      />,
    );
    // Each segment has a play button (Play icon from lucide-react)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders empty state when segments is empty array', () => {
    render(
      <CommentaryTimeline
        segments={[]}
        voice="default-voice"
        totalDuration={0}
      />,
    );
    expect(screen.getByText('解说片段与时间轴对齐预览')).toBeInTheDocument();
  });
});
