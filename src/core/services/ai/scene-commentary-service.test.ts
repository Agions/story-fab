/**
 * scene-commentary-service 测试
 *
 * Stage 9 PR-6：场景-解说对齐服务核心覆盖
 */
import { describe, it, expect } from 'vitest';
import {
  SceneCommentaryAlignmentService,
  sceneCommentaryAlignmentService,
} from './scene-commentary-service';
import type { Scene, ScriptSegment } from '@/types';

const scene1: Scene = {
  id: 's1',
  startTime: 0,
  endTime: 10,
  description: 'Opening scene',
  thumbnail: '',
  tags: [],
  score: 0.5,
  type: 'dialog',
};
const scene2: Scene = {
  id: 's2',
  startTime: 10,
  endTime: 20,
  description: 'Middle scene',
  thumbnail: '',
  tags: [],
  score: 0.5,
  type: 'dialog',
};
const scene3: Scene = {
  id: 's3',
  startTime: 20,
  endTime: 30,
  description: 'Closing scene',
  thumbnail: '',
  tags: [],
  score: 0.5,
  type: 'dialog',
};

const seg1: ScriptSegment = {
  id: 'seg1',
  startTime: 1,
  endTime: 5,
  content: 'opening narration',
  type: 'narration',
};
const seg2: ScriptSegment = {
  id: 'seg2',
  startTime: 12,
  endTime: 18,
  content: 'middle narration',
  type: 'narration',
};
const seg3: ScriptSegment = {
  id: 'seg3',
  startTime: 22,
  endTime: 28,
  content: 'closing narration',
  type: 'narration',
};

describe('SceneCommentaryAlignmentService.align', () => {
  const svc = new SceneCommentaryAlignmentService();

  it('returns empty array for empty input', () => {
    expect(svc.align([], [])).toEqual([]);
  });

  it('returns one alignment per segment', () => {
    const result = svc.align([scene1, scene2, scene3], [seg1, seg2, seg3]);
    expect(result.length).toBe(3);
  });

  it('matches segment to closest scene by midpoint', () => {
    const result = svc.align([scene1, scene2, scene3], [seg1]);
    // seg1 midpoint is 3, scene1 midpoint is 5 — closest
    expect(result[0]?.sceneId).toBe('s1');
  });

  it('respects scene order when sorting', () => {
    const sceneReversed: Scene[] = [scene3, scene1, scene2];
    const result = svc.align(sceneReversed, [seg2]);
    // Should still match seg2 (mid 15) to scene2 (mid 15)
    expect(result[0]?.sceneId).toBe('s2');
  });

  it('respects segment order when sorting', () => {
    const segReversed: ScriptSegment[] = [seg3, seg1, seg2];
    const result = svc.align([scene1, scene2, scene3], segReversed);
    // Output order should follow input order (sorted internally)
    expect(result[0]?.segmentId).toBe('seg1');
    expect(result[1]?.segmentId).toBe('seg2');
    expect(result[2]?.segmentId).toBe('seg3');
  });

  it('handles segment with no scenes (returns first scene fallback)', () => {
    const result = svc.align([scene1], [seg1]);
    expect(result.length).toBe(1);
    expect(result[0]?.sceneId).toBe('s1');
  });

  it('confidence decreases as drift increases', () => {
    const svcAlign = new SceneCommentaryAlignmentService();
    const segPerfect: ScriptSegment = { ...seg1, startTime: 4, endTime: 6 }; // mid 5, scene1 mid 5
    const segDrift: ScriptSegment = { ...seg1, id: 'seg-drift', startTime: 8, endTime: 9 }; // mid 8.5, scene1 mid 5

    const perfect = svcAlign.align([scene1], [segPerfect]);
    const drift = svcAlign.align([scene1], [segDrift]);

    expect(perfect[0]!.confidence).toBeGreaterThan(drift[0]!.confidence);
  });

  it('confidence is clamped between 0 and 1', () => {
    const svcAlign = new SceneCommentaryAlignmentService();
    const result = svcAlign.align([scene1], [seg1]);
    expect(result[0]!.confidence).toBeGreaterThanOrEqual(0);
    expect(result[0]!.confidence).toBeLessThanOrEqual(1);
  });

  it('produces singleton instance via export', () => {
    expect(sceneCommentaryAlignmentService).toBeInstanceOf(SceneCommentaryAlignmentService);
  });
});

describe('SceneCommentaryAlignmentService.buildOriginalOverlayPlan', () => {
  const svc = new SceneCommentaryAlignmentService();

  it('returns empty array for empty input', () => {
    expect(svc.buildOriginalOverlayPlan([])).toEqual([]);
  });

  it('returns one plan per scene', () => {
    const result = svc.buildOriginalOverlayPlan([scene1, scene2, scene3]);
    expect(result.length).toBe(3);
  });

  it('each plan has sceneId/startTime/endTime/reason', () => {
    const result = svc.buildOriginalOverlayPlan([scene1]);
    expect(result[0]).toMatchObject({
      sceneId: 's1',
      startTime: 0,
      endTime: 10,
    });
    expect(['motion', 'emotion', 'transition', 'anchor']).toContain(result[0]!.reason);
  });

  it('classifies high motionScore as motion reason', () => {
    const motionScene: Scene = { ...scene1, motionScore: 0.9 };
    const result = svc.buildOriginalOverlayPlan([motionScene]);
    expect(result[0]?.reason).toBe('motion');
  });

  it('classifies emotion as emotion reason when motionScore is low', () => {
    const emotionScene: Scene = { ...scene1, motionScore: 0.3, dominantEmotion: 'happy' };
    const result = svc.buildOriginalOverlayPlan([emotionScene]);
    expect(result[0]?.reason).toBe('emotion');
  });

  it('filters out scenes with endTime <= startTime', () => {
    const invalidScene: Scene = { ...scene1, id: 'invalid', startTime: 10, endTime: 10 };
    const result = svc.buildOriginalOverlayPlan([scene1, invalidScene]);
    expect(result.length).toBe(1);
    expect(result[0]?.sceneId).toBe('s1');
  });

  it('default classification is anchor/transition based on index', () => {
    const result = svc.buildOriginalOverlayPlan([scene1, scene2, scene3, scene1]);
    // scene1 (index 0, %3=0) → anchor
    expect(result[0]?.reason).toBe('anchor');
  });
});
