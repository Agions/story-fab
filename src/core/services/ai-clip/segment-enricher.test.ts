import { describe, it, expect } from 'vitest';
import {
  enrichSegment,
  enrichSegments,
  summarizeSpeeds,
  type RustRawSegment,
} from './segment-enricher';

const raw = (over: Partial<RustRawSegment>): RustRawSegment => ({
  startMs: 0,
  endMs: 1000,
  segmentType: 'content',
  durationMs: 1000,
  confidence: 0.8,
  ...over,
});

describe('segmentEnricher', () => {
  describe('enrichSegment — single', () => {
    it('maps snake_case Rust fields → camelCase TS fields', () => {
      const out = enrichSegment(raw({
        startMs: 100,
        endMs: 2500,
        segmentType: 'Action',
        durationMs: 2400,
        confidence: 0.9,
        isSceneChange: true,
        peakEnergy: 0.7,
        silenceRatio: 0.1,
        suggestedSpeed: 2.0,
      }));
      expect(out.startMs).toBe(100);
      expect(out.endMs).toBe(2500);
      expect(out.segmentType).toBe('action');
      expect(out.durationMs).toBe(2400);
      expect(out.confidence).toBe(0.9);
      expect(out.isSceneChange).toBe(true);
      expect(out.peakEnergy).toBe(0.7);
      expect(out.silenceRatio).toBe(0.1);
      expect(out.suggestedSpeed).toBe(2.0);
    });

    it('normalizes PascalCase and snake_case types', () => {
      expect(enrichSegment(raw({ segmentType: 'Dialogue' })).segmentType).toBe('dialogue');
      expect(enrichSegment(raw({ segmentType: 'silence' })).segmentType).toBe('silence');
      expect(enrichSegment(raw({ segmentType: 'Transition' })).segmentType).toBe('transition');
    });

    it('falls back to content for unknown / missing type', () => {
      expect(enrichSegment(raw({ segmentType: 'unknown_thing' })).segmentType).toBe('content');
      expect(enrichSegment(raw({ segmentType: '' })).segmentType).toBe('content');
      expect(enrichSegment(raw({ segmentType: undefined as unknown as string })).segmentType).toBe('content');
    });
  });

  describe('enrichSegments — batch', () => {
    it('returns empty array for empty input', () => {
      expect(enrichSegments([])).toEqual([]);
    });

    it('produces a suggestion for every input segment', () => {
      const input: RustRawSegment[] = [
        raw({ segmentType: 'Action', startMs: 0, endMs: 1000 }),
        raw({ segmentType: 'Dialogue', startMs: 1000, endMs: 3000 }),
        raw({ segmentType: 'Silence', startMs: 3000, endMs: 3300 }),
      ];
      const out = enrichSegments(input);
      expect(out).toHaveLength(3);
      for (const s of out) {
        expect(s.suggestedTransition).toBeDefined();
        expect(s.suggestedTransition!.type).toBeTruthy();
      }
    });

    it('preserves Rust suggestedSpeed field', () => {
      const input: RustRawSegment[] = [
        raw({ suggestedSpeed: 4.0 }),
        raw({ suggestedSpeed: 1.0, startMs: 1000, endMs: 2000 }),
        raw({ suggestedSpeed: 6.0, startMs: 2000, endMs: 3000 }),
      ];
      const out = enrichSegments(input);
      expect(out[0].suggestedSpeed).toBe(4.0);
      expect(out[1].suggestedSpeed).toBe(1.0);
      expect(out[2].suggestedSpeed).toBe(6.0);
    });

    it('passes through missing suggestedSpeed as undefined', () => {
      const out = enrichSegments([raw({ suggestedSpeed: undefined })]);
      expect(out[0].suggestedSpeed).toBeUndefined();
    });
  });

  describe('summarizeSpeeds', () => {
    it('returns zero total for empty input', () => {
      const sum = summarizeSpeeds([]);
      expect(sum.total).toBe(0);
      expect(sum.fastestSpeed).toBe(1);
      expect(sum.fastestCount).toBe(0);
    });

    it('counts segments by speed bucket', () => {
      const input: RustRawSegment[] = [
        raw({ suggestedSpeed: 1.0 }),
        raw({ suggestedSpeed: 1.0, startMs: 1000, endMs: 2000 }),
        raw({ suggestedSpeed: 2.0, startMs: 2000, endMs: 3000 }),
        raw({ suggestedSpeed: 6.0, startMs: 3000, endMs: 4000 }),
      ];
      const sum = summarizeSpeeds(enrichSegments(input));
      expect(sum.total).toBe(4);
      expect(sum.bySpeed['1x']).toBe(2);
      expect(sum.bySpeed['2x']).toBe(1);
      expect(sum.bySpeed['6x']).toBe(1);
    });

    it('identifies the fastest speed bucket', () => {
      const input: RustRawSegment[] = [
        raw({ suggestedSpeed: 2.0 }),
        raw({ suggestedSpeed: 6.0, startMs: 1000, endMs: 2000 }),
        raw({ suggestedSpeed: 6.0, startMs: 2000, endMs: 3000 }),
      ];
      const sum = summarizeSpeeds(enrichSegments(input));
      expect(sum.fastestSpeed).toBe(6);
      expect(sum.fastestCount).toBe(2);
    });

    it('counts transition types', () => {
      const input: RustRawSegment[] = [
        raw({ segmentType: 'Action' }),
        raw({ segmentType: 'Dialogue', startMs: 1000, endMs: 2000 }),
        raw({ segmentType: 'Dialogue', startMs: 2000, endMs: 3000 }),
      ];
      const sum = summarizeSpeeds(enrichSegments(input));
      expect(sum.transitionCounts.fade).toBeGreaterThanOrEqual(1);
      // The specific types depend on rule matrix; just check it's non-zero for some
      const totalTransitions = Object.values(sum.transitionCounts).reduce((a, b) => a + b, 0);
      expect(totalTransitions).toBe(input.length);
    });
  });
});
