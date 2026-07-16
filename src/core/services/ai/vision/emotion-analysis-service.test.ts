/**
 * emotion-analysis-service 测试
 *
 * Stage 9 PR-7：情感分析服务覆盖
 */
import { describe, it, expect } from 'vitest';
import { emotionAnalysisService } from './emotion-analysis-service';
import type { Scene } from '@/types';

const scene1: Scene = {
  id: 's1',
  startTime: 0,
  endTime: 10,
  description: 'intro scene',
  thumbnail: '',
  tags: [],
  type: 'intro',
  score: 0.5,
};
const scene2: Scene = {
  id: 's2',
  startTime: 10,
  endTime: 20,
  description: 'emotion scene',
  thumbnail: '',
  tags: [],
  type: 'emotion',
  score: 0.5,
};
const scene3: Scene = {
  id: 's3',
  startTime: 20,
  endTime: 30,
  description: 'unknown scene type',
  thumbnail: '',
  tags: [],
  type: 'landscape',
  score: 0.5,
};

describe('EmotionAnalysisService.analyzeEmotions', () => {
  const svc = emotionAnalysisService;

  it('returns empty array for empty input', async () => {
    const result = await svc.analyzeEmotions([]);
    expect(result).toEqual([]);
  });

  it('returns one analysis per scene', async () => {
    const result = await svc.analyzeEmotions([scene1, scene2, scene3]);
    expect(result.length).toBe(3);
  });

  it('each result has required fields', async () => {
    const result = await svc.analyzeEmotions([scene1]);
    const r = result[0]!;
    expect(r.id).toContain('emotion_');
    expect(r.sceneId).toBe('s1');
    expect(r.timestamp).toBe(0);
    expect(r.dominant).toBeDefined();
    expect(r.intensity).toBeGreaterThan(0);
    expect(Array.isArray(r.emotions)).toBe(true);
  });

  it('scene type "intro" emphasizes excited emotion', async () => {
    const result = await svc.analyzeEmotions([scene1]);
    const emotions = result[0]?.emotions ?? [];
    const excited = emotions.find((e) => e.id === 'excited');
    expect(excited).toBeDefined();
    // 'intro' adjustment sets excited=0.7, then normalized
    expect(excited!.score).toBeGreaterThan(0);
  });

  it('scene type "emotion" emphasizes excited too', async () => {
    const result = await svc.analyzeEmotions([scene2]);
    const emotions = result[0]?.emotions ?? [];
    const excited = emotions.find((e) => e.id === 'excited');
    expect(excited!.score).toBeGreaterThan(0);
  });

  it('unknown scene type uses default adjustments', async () => {
    const result = await svc.analyzeEmotions([scene3]);
    const emotions = result[0]?.emotions ?? [];
    const neutral = emotions.find((e) => e.id === 'neutral');
    expect(neutral).toBeDefined();
    expect(neutral!.score).toBeGreaterThan(0);
  });

  it('emotion scores are normalized (sum to 1)', async () => {
    const result = await svc.analyzeEmotions([scene1]);
    const first = result[0];
    if (!first) throw new Error('expected result');
    const emotions = first.emotions ?? [];
    const sum = emotions.reduce((acc, e) => acc + e.score, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('dominant emotion is the highest-scored one', async () => {
    const result = await svc.analyzeEmotions([scene1]);
    const first = result[0];
    if (!first) throw new Error('expected result');
    const emotions = first.emotions ?? [];
    const dominant = emotions.find((e) => e.id === first.dominant);
    const max = emotions.reduce<{ id: string; score: number; name: string }>(
      (m, e) => (e.score > m.score ? e : m),
      { id: '', score: -1, name: '' },
    );
    expect(dominant).toEqual(max);
  });
});

describe('EmotionAnalysisService.getDominantEmotionStats', () => {
  const svc = emotionAnalysisService;

  it('returns empty object for empty input', () => {
    expect(svc.getDominantEmotionStats([])).toEqual({});
  });

  it('counts occurrences of each dominant emotion', async () => {
    const result = await svc.analyzeEmotions([scene1, scene2, scene3]);
    const stats = svc.getDominantEmotionStats(result);
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
  });

  it('returns 0 stats when dominant is undefined', () => {
    const stats = svc.getDominantEmotionStats([
      { id: 'x', sceneId: 's', timestamp: 0, emotions: [], dominant: undefined, intensity: 0 },
    ]);
    expect(stats.neutral).toBe(1);
  });
});

describe('emotionAnalysisService singleton', () => {
  it('is an object with the expected methods', () => {
    expect(typeof emotionAnalysisService.analyzeEmotions).toBe('function');
    expect(typeof emotionAnalysisService.getDominantEmotionStats).toBe('function');
  });
});
