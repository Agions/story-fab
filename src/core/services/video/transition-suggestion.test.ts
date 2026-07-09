import { describe, it, expect } from 'vitest';
import {
  suggestTransition,
  suggestTransitions,
  findRuleByType,
  findRule,
  type TransitionType,
} from './transition-suggestion';
import type { SmartVideoSegment } from '../../video/highlight-types';

const seg = (over: Partial<SmartVideoSegment>): SmartVideoSegment => ({
  startMs: 0,
  endMs: 1000,
  segmentType: 'content',
  durationMs: 1000,
  confidence: 0.8,
  ...over,
});

describe('transition-suggestion', () => {
  describe('suggestTransition — single segment', () => {
    it('returns a valid suggestion shape for a content segment', () => {
      const s = suggestTransition(seg({ segmentType: 'content' }));
      expect(s.type).toBeTruthy();
      expect(s.duration).toBeGreaterThan(0);
      expect(s.confidence).toBeGreaterThan(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
      expect(s.reason).toBeTruthy();
    });

    it('returns a list of valid transition types', () => {
      const validTypes: TransitionType[] = [
        'none', 'fade', 'dissolve', 'wipe', 'slide', 'zoom', 'glitch',
      ];
      const seen = new Set<string>();
      for (const t of ['action', 'dialogue', 'silence', 'transition', 'content'] as const) {
        for (const p of ['action', 'dialogue', 'silence', 'transition', 'content', 'unknown'] as const) {
          seen.add(suggestTransition(seg({ segmentType: t }), seg({ segmentType: p })).type);
        }
      }
      for (const t of seen) {
        expect(validTypes).toContain(t);
      }
    });

    it('scene change beats type-based rules', () => {
      const curr = seg({ segmentType: 'dialogue', isSceneChange: true });
      const prev = seg({ segmentType: 'dialogue' });
      const s = suggestTransition(curr, prev);
      // scene change should win, so type should be dissolve or glitch (not fade)
      expect(['dissolve', 'glitch']).toContain(s.type);
      expect(s.confidence).toBeGreaterThan(0.7);
    });

    it('short segments get shorter transition duration', () => {
      const s = suggestTransition(seg({ segmentType: 'action', durationMs: 1000 }));
      expect(s.duration).toBeLessThanOrEqual(300);
    });

    it('long segments get longer transition duration', () => {
      const s = suggestTransition(seg({ segmentType: 'action', durationMs: 20000 }));
      expect(s.duration).toBeGreaterThanOrEqual(500);
    });

    it('handles missing segmentType gracefully', () => {
      const s = suggestTransition(seg({ segmentType: '' as unknown as string }));
      expect(s.type).toBeTruthy();
      expect(s.confidence).toBeGreaterThan(0);
    });
  });

  describe('rule matrix coverage (30+ rules)', () => {
    it('has at least 30 prev→curr rules', () => {
      // 5 types × 5 types + 5 unknown fallbacks = 30
      const types = ['action', 'dialogue', 'silence', 'transition', 'content'];
      let count = 0;
      for (const p of types) {
        for (const c of types) {
          if (findRule(p, c)) count++;
        }
      }
      for (const c of types) {
        if (findRule('unknown', c)) count++;
      }
      expect(count).toBeGreaterThanOrEqual(30);
    });

    it('action→action returns slide (momentum-preserving)', () => {
      const r = findRule('action', 'action');
      expect(r).not.toBeNull();
      expect(r!.type).toBe('slide');
      expect(r!.confidence).toBeGreaterThan(0.8);
    });

    it('silence→action returns zoom (punch)', () => {
      const r = findRule('silence', 'action');
      expect(r).not.toBeNull();
      expect(r!.type).toBe('zoom');
    });

    it('transition→action returns glitch (high-energy bridge)', () => {
      const r = findRule('transition', 'action');
      expect(r).not.toBeNull();
      expect(r!.type).toBe('glitch');
    });

    it('unknown→X fallbacks exist for all 5 main types', () => {
      for (const t of ['action', 'dialogue', 'silence', 'transition', 'content']) {
        expect(findRule('unknown', t)).not.toBeNull();
      }
    });
  });

  describe('suggestTransitions — batch', () => {
    it('returns empty array for empty input', () => {
      expect(suggestTransitions([])).toEqual([]);
    });

    it('does not mutate the input array', () => {
      const input: SmartVideoSegment[] = [
        seg({ segmentType: 'action', startMs: 0, endMs: 1000 }),
        seg({ segmentType: 'dialogue', startMs: 1000, endMs: 2000 }),
      ];
      const before = JSON.stringify(input);
      suggestTransitions(input);
      expect(JSON.stringify(input)).toBe(before);
    });

    it('produces a suggestion for every input segment', () => {
      const input: SmartVideoSegment[] = [
        seg({ segmentType: 'action', startMs: 0, endMs: 2000 }),
        seg({ segmentType: 'dialogue', startMs: 2000, endMs: 5000 }),
        seg({ segmentType: 'silence', startMs: 5000, endMs: 5500 }),
        seg({ segmentType: 'content', startMs: 5500, endMs: 8000 }),
      ];
      const out = suggestTransitions(input);
      expect(out).toHaveLength(input.length);
      for (const s of out) {
        expect(s.suggestedTransition).toBeDefined();
        expect(s.suggestedTransition!.type).toBeTruthy();
        expect(s.suggestedTransition!.confidence).toBeGreaterThan(0);
      }
    });

    it('preserves original segment fields', () => {
      const input: SmartVideoSegment[] = [
        seg({ segmentType: 'action', startMs: 100, endMs: 500, peakEnergy: 0.9 }),
      ];
      const out = suggestTransitions(input);
      expect(out[0].startMs).toBe(100);
      expect(out[0].endMs).toBe(500);
      expect(out[0].peakEnergy).toBe(0.9);
    });

    it('first segment uses prev=undefined → matches unknown→X rule', () => {
      const input: SmartVideoSegment[] = [
        seg({ segmentType: 'action' }),
        seg({ segmentType: 'dialogue', startMs: 1000, endMs: 2000 }),
      ];
      const out = suggestTransitions(input);
      // First segment has no prev → falls back to 'unknown' prev → 'wipe'
      expect(out[0].suggestedTransition!.type).toBe('wipe');
    });

    it('consecutive same-type segments still get a suggestion', () => {
      const input: SmartVideoSegment[] = [
        seg({ segmentType: 'dialogue' }),
        seg({ segmentType: 'dialogue', startMs: 1000, endMs: 2000 }),
      ];
      const out = suggestTransitions(input);
      expect(out[0].suggestedTransition).toBeDefined();
      expect(out[1].suggestedTransition).toBeDefined();
    });
  });

  describe('findRuleByType', () => {
    it('returns a rule entry for a known type', () => {
      const r = findRuleByType('slide');
      expect(r).not.toBeNull();
      expect(r!.rule.type).toBe('slide');
      expect(r!.key).toBeTruthy();
    });

    it('returns null for an unknown type', () => {
      // 'none' may not be in matrix — depends on impl; pick a definitely-absent name
      // (none is not currently used by any rule, so should be null)
      const r = findRuleByType('none');
      expect(r).toBeNull();
    });
  });
});
