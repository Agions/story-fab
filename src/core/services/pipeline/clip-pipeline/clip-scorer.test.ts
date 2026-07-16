/**
 * clip-scorer 测试
 *
 * Stage 9 PR-5：多维评分引擎核心覆盖
 */
import { describe, it, expect } from 'vitest';
import { ClipScorer, type CandidateClip } from './clip-scorer';

const baseClip: CandidateClip = {
  id: 'c1',
  startTime: 0,
  endTime: 30,
  duration: 30,
  sceneType: 'narrative',
  transcript: 'regular transcript without keywords',
  audioEnergy: 0.5,
};

describe('ClipScorer', () => {
  describe('constructor + weight normalization', () => {
    it('uses default weights when not provided', () => {
      const scorer = new ClipScorer();
      const scored = scorer.score([baseClip]);
      expect(scored.length).toBe(1);
      // Score should be in 0-100 range
      expect(scored[0]!.totalScore).toBeGreaterThan(0);
      expect(scored[0]!.totalScore).toBeLessThanOrEqual(100);
    });

    it('accepts custom weights', () => {
      const scorer = new ClipScorer({
        weights: { keywordBoost: 1.0 },
      });
      const clip: CandidateClip = { ...baseClip, transcript: 'This is a must watch secret' };
      const scored = scorer.score([clip]);
      expect(scored.length).toBe(1);
    });

    it('normalizes weights to sum to 1', () => {
      const scorer = new ClipScorer({
        weights: {
          laughterDensity: 2,
          emotionPeak: 2,
          speechCompleteness: 2,
          silenceRatio: 0,
          speakingPace: 0,
          keywordBoost: 0,
        },
      });
      const scored = scorer.score([baseClip]);
      expect(scored[0]!.totalScore).toBeGreaterThan(0);
    });
  });

  describe('score()', () => {
    it('returns empty array for empty input', () => {
      const scorer = new ClipScorer();
      expect(scorer.score([])).toEqual([]);
    });

    it('returns array of ClipScore with same length as input', () => {
      const scorer = new ClipScorer();
      const clips = [baseClip, { ...baseClip, id: 'c2' }];
      const scored = scorer.score(clips);
      expect(scored.length).toBe(2);
    });

    it('sorts results by totalScore descending', () => {
      const scorer = new ClipScorer();
      const low: CandidateClip = { ...baseClip, id: 'low', transcript: 'boring' };
      const high: CandidateClip = {
        ...baseClip,
        id: 'high',
        transcript: 'must watch secret revealed shocking',
      };
      const scored = scorer.score([low, high]);
      expect(scored[0]!.clip.id).toBe('high');
    });

    it('includes all 6 sub-scores in each ClipScore', () => {
      const scorer = new ClipScorer();
      const scored = scorer.score([baseClip]);
      const s = scored[0]!;
      expect(s.laughterDensity).toBeDefined();
      expect(s.emotionPeak).toBeDefined();
      expect(s.speechCompleteness).toBeDefined();
      expect(s.silenceRatio).toBeDefined();
      expect(s.speakingPace).toBeDefined();
      expect(s.keywordBoost).toBeDefined();
    });

    it('returns 0 score on scoring error', () => {
      const scorer = new ClipScorer();
      // null transcript might cause errors
      const badClip = { ...baseClip, transcript: null as unknown as string };
      const scored = scorer.score([badClip]);
      expect(scored[0]!.totalScore).toBe(0);
    });
  });

  describe('keyword boost', () => {
    it('boosts score for high-engagement keywords', () => {
      const scorer = new ClipScorer();
      const noKeywords = scorer.score([{ ...baseClip, id: 'a', transcript: 'regular boring text' }]);
      const withKeywords = scorer.score([{ ...baseClip, id: 'b', transcript: 'shocking secret revealed' }]);
      // Keyword clip should score higher
      const noK = noKeywords[0]?.keywordBoost ?? 0;
      const withK = withKeywords[0]?.keywordBoost ?? 0;
      expect(withK).toBeGreaterThan(noK);
    });

    it('matches English keywords', () => {
      const scorer = new ClipScorer();
      const scored = scorer.score([{ ...baseClip, transcript: 'must watch secret' }]);
      expect(scored[0]!.keywordBoost).toBeGreaterThan(0);
    });

    it('matches Chinese keywords', () => {
      const scorer = new ClipScorer();
      const scored = scorer.score([{ ...baseClip, transcript: '必须 揭秘 真相' }]);
      expect(scored[0]!.keywordBoost).toBeGreaterThan(0);
    });
  });

  describe('duration filter', () => {
    it('penalizes clips below minClipDuration', () => {
      const scorer = new ClipScorer({ minClipDuration: 30 });
      const short = scorer.score([{ ...baseClip, startTime: 0, endTime: 5, duration: 5 }]);
      const long = scorer.score([{ ...baseClip, startTime: 0, endTime: 60, duration: 60 }]);
      // Longer clip should score higher (less penalty)
      expect(long[0]!.totalScore).toBeGreaterThan(short[0]!.totalScore);
    });

    it('penalizes clips above maxClipDuration', () => {
      const scorer = new ClipScorer({ maxClipDuration: 60 });
      const ok = scorer.score([{ ...baseClip, startTime: 0, endTime: 45, duration: 45 }]);
      const tooLong = scorer.score([{ ...baseClip, startTime: 0, endTime: 180, duration: 180 }]);
      expect(ok[0]!.totalScore).toBeGreaterThan(tooLong[0]!.totalScore);
    });
  });
});
