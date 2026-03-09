import { describe, expect, it } from 'vitest';
import type { ScriptSegment, VideoAnalysis } from '@/core/types';
import { orchestrateCommentaryAgents } from './commentaryAgents';

const buildAnalysis = (): VideoAnalysis => ({
  id: 'analysis-1',
  videoId: 'video-1',
  summary: '测试视频',
  scenes: [
    {
      id: 'scene-1',
      startTime: 0,
      endTime: 10,
      thumbnail: '',
      tags: ['intro'],
      features: { motionScore: 0.9 },
    },
    {
      id: 'scene-2',
      startTime: 10,
      endTime: 20,
      thumbnail: '',
      tags: ['body'],
    },
  ],
  keyframes: [],
  objects: [],
  emotions: [],
  createdAt: new Date().toISOString(),
});

const buildSegments = (): ScriptSegment[] => [
  {
    id: 'seg-1',
    startTime: 0,
    endTime: 10,
    content: '第一段',
    type: 'narration',
  },
  {
    id: 'seg-2',
    startTime: 10,
    endTime: 20,
    content: '第二段',
    type: 'narration',
  },
];

describe('commentaryAgents orchestration', () => {
  it('creates mode-specific director task goals', () => {
    const analysis = buildAnalysis();
    const result = orchestrateCommentaryAgents({
      mode: 'ai-first-person',
      analysis,
      segments: buildSegments(),
    });

    const directorTask = result.tasks.find((task) => task.role === 'director-agent');
    expect(directorTask).toBeTruthy();
    expect(directorTask?.goal).toContain('第一人称');
  });

  it('compresses segment windows for mixclip mode', () => {
    const analysis = buildAnalysis();
    const result = orchestrateCommentaryAgents({
      mode: 'ai-mixclip',
      analysis,
      segments: [buildSegments()[0]],
    });

    expect(result.alignedSegments).toHaveLength(1);
    const only = result.alignedSegments[0];
    expect(only.startTime).toBeCloseTo(1.5, 3);
    expect(only.endTime).toBeCloseTo(8.5, 3);
    expect(only.endTime - only.startTime).toBeLessThan(10);
  });

  it('returns stable alignment summary and overlay plan', () => {
    const analysis = buildAnalysis();
    const result = orchestrateCommentaryAgents({
      mode: 'ai-commentary',
      analysis,
      segments: buildSegments(),
    });

    expect(result.alignmentSummary.averageConfidence).toBeCloseTo(1, 4);
    expect(result.alignmentSummary.maxDriftSeconds).toBeCloseTo(0, 4);
    expect(result.overlayPlan).toHaveLength(2);
    expect(result.overlayPlan[0].reason).toBe('motion');
  });
});
