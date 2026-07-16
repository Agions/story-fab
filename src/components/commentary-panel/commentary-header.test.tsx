import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommentaryHeader from './commentary-header';

describe('CommentaryHeader', () => {
  it('renders title and sparkles icon', () => {
    render(
      <CommentaryHeader
        currentState="idle"
        progressPct={0}
        isPipelineRunning={false}
      />,
    );
    expect(screen.getByText('AI 解说模式')).toBeInTheDocument();
  });

  it('renders idle state badge', () => {
    render(
      <CommentaryHeader
        currentState="idle"
        progressPct={0}
        isPipelineRunning={false}
      />,
    );
    expect(screen.getByText('就绪')).toBeInTheDocument();
  });

  it('renders analyzing state badge', () => {
    render(
      <CommentaryHeader
        currentState="analyzing"
        progressPct={0.5}
        isPipelineRunning={false}
      />,
    );
    expect(screen.getByText('分析中')).toBeInTheDocument();
  });

  it('shows progress bar when currentState is not idle or done', () => {
    render(
      <CommentaryHeader
        currentState="planning"
        progressPct={0.75}
        isPipelineRunning={false}
      />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('does not show progress bar when currentState is idle', () => {
    render(
      <CommentaryHeader
        currentState="idle"
        progressPct={0}
        isPipelineRunning={false}
      />,
    );
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('shows pipeline progress when isPipelineRunning is true', () => {
    render(
      <CommentaryHeader
        currentState="idle"
        progressPct={0}
        isPipelineRunning={true}
        pipelineProgress={{ percent: 60, stage: 'synthesize', message: '合成中' }}
      />,
    );
    expect(screen.getByText('synthesize: 合成中 (60%)')).toBeInTheDocument();
  });
});
