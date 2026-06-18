import { describe, it, expect } from 'vitest';
import {
  enrichSegment,
  enrichSegments,
  summarizeSpeeds,
  type RustRawSegment,
} from './segmentEnricher';

const raw = (over: Partial<RustRawSegment>): RustRawSegment => ({
  start_ms: 0,
  end_ms: 1000,
  segment_type: 'content',
  duration_ms: 1000,
  confidence: 0.8,
  ...over,
});

describe('segmentEnricher', () => {
  describe('enrichSegment — single', () => {
    it('maps snake_case Rust fields → camelCase TS fields', () => {
      const out = enrichSegment(raw({
        start_ms: 100,
        end_ms: 2500,
        segment_type: 'Action',
        duration_ms: 2400,
        confidence: 0.9,
        is_scene_change: true,
        peak_energy: 0.7,
        silence_ratio: 0.1,
        suggested_speed: 2.0,
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
      expect(enrichSegment(raw({ segment_type: 'Dialogue' })).segmentType).toBe('dialogue');
      expect(enrichSegment(raw({ segment_type: 'silence' })).segmentType).toBe('silence');
      expect(enrichSegment(raw({ segment_type: 'Transition' })).segmentType).toBe('transition');
    });

    it('falls back to content for unknown / missing type', () => {
      expect(enrichSegment(raw({ segment_type: 'unknown_thing' })).segmentType).toBe('content');
      expect(enrichSegment(raw({ segment_type: '' })).segmentType).toBe('content');
      expect(enrichSegment(raw({ segment_type: undefined as unknown as string })).segmentType).toBe('content');
    });
  });

  describe('enrichSegments — batch', () => {
    it('returns empty array for empty input', () => {
      expect(enrichSegments([])).toEqual([]);
    });

    it('produces a suggestion for every input segment', () => {
      const input: RustRawSegment[] = [
        raw({ segment_type: 'Action', start_ms: 0, end_ms: 1000 }),
        raw({ segment_type: 'Dialogue', start_ms: 1000, end_ms: 3000 }),
        raw({ segment_type: 'Silence', start_ms: 3000, end_ms: 3300 }),
      ];
      const out = enrichSegments(input);
      expect(out).toHaveLength(3);
      for (const s of out) {
        expect(s.suggestedTransition).toBeDefined();
        expect(s.suggestedTransition!.type).toBeTruthy();
      }
    });

    it('preserves Rust suggested_speed field', () => {
      const input: RustRawSegment[] = [
        raw({ suggested_speed: 4.0 }),
        raw({ suggested_speed: 1.0, start_ms: 1000, end_ms: 2000 }),
        raw({ suggested_speed: 6.0, start_ms: 2000, end_ms: 3000 }),
      ];
      const out = enrichSegments(input);
      expect(out[0].suggestedSpeed).toBe(4.0);
      expect(out[1].suggestedSpeed).toBe(1.0);
      expect(out[2].suggestedSpeed).toBe(6.0);
    });

    it('passes through missing suggested_speed as undefined', () => {
      const out = enrichSegments([raw({ suggested_speed: undefined })]);
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
        raw({ suggested_speed: 1.0 }),
        raw({ suggested_speed: 1.0, start_ms: 1000, end_ms: 2000 }),
        raw({ suggested_speed: 2.0, start_ms: 2000, end_ms: 3000 }),
        raw({ suggested_speed: 6.0, start_ms: 3000, end_ms: 4000 }),
      ];
      const sum = summarizeSpeeds(enrichSegments(input));
      expect(sum.total).toBe(4);
      expect(sum.bySpeed['1x']).toBe(2);
      expect(sum.bySpeed['2x']).toBe(1);
      expect(sum.bySpeed['6x']).toBe(1);
    });

    it('identifies the fastest speed bucket', () => {
      const input: RustRawSegment[] = [
        raw({ suggested_speed: 2.0 }),
        raw({ suggested_speed: 6.0, start_ms: 1000, end_ms: 2000 }),
        raw({ suggested_speed: 6.0, start_ms: 2000, end_ms: 3000 }),
      ];
      const sum = summarizeSpeeds(enrichSegments(input));
      expect(sum.fastestSpeed).toBe(6);
      expect(sum.fastestCount).toBe(2);
    });

    it('counts transition types', () => {
      const input: RustRawSegment[] = [
        raw({ segment_type: 'Action' }),
        raw({ segment_type: 'Dialogue', start_ms: 1000, end_ms: 2000 }),
        raw({ segment_type: 'Dialogue', start_ms: 2000, end_ms: 3000 }),
      ];
      const sum = summarizeSpeeds(enrichSegments(input));
      expect(sum.transitionCounts.fade).toBeGreaterThanOrEqual(1);
      // The specific types depend on rule matrix; just check it's non-zero for some
      const totalTransitions = Object.values(sum.transitionCounts).reduce((a, b) => a + b, 0);
      expect(totalTransitions).toBe(input.length);
    });
  });
});
