/**
 * Transition Suggestion Engine — 单元测试
 *
 * 覆盖：
 * - suggestTransition 单段推荐
 * - suggestTransitions 批量推荐
 * - findRule / findRuleByType 查询
 */

import { describe, it, expect } from 'vitest';
import { suggestTransition, suggestTransitions, findRule, findRuleByType } from './transition-suggestion';
import type { SmartVideoSegment } from '../../video/highlight-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function segment(overrides: Partial<SmartVideoSegment> = {}): SmartVideoSegment {
  return {
    startMs: 0,
    endMs: 5000,
    durationMs: 5000,
    segmentType: 'content',
    confidence: 0.8,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('suggestTransition', () => {
  it('returns dissolve for scene change', () => {
    const s = suggestTransition(segment({ isSceneChange: true }));
    expect(s.type).toBe('dissolve');
    expect(s.confidence).toBeGreaterThan(0);
  });

  it('returns glitch for scene change with action', () => {
    const s = suggestTransition(
      segment({ segmentType: 'action', isSceneChange: true }),
      segment({ segmentType: 'action' }),
    );
    expect(s.type).toBe('glitch');
  });

  it('uses rule matrix for prev->curr', () => {
    const prev = segment({ segmentType: 'dialogue' });
    const curr = segment({ segmentType: 'action' });
    const s = suggestTransition(curr, prev);
    expect(s.type).toBe('wipe');
  });

  it('falls back to content default when no rule matches', () => {
    const curr = segment({ segmentType: 'content' });
    const s = suggestTransition(curr);
    expect(s.type).toBe('dissolve');
  });

  it('adjusts duration for short segments', () => {
    const short = segment({ durationMs: 2000 });
    const s = suggestTransition(short);
    expect(s.duration).toBe(250);
  });

  it('adjusts duration for long segments', () => {
    const long = segment({ durationMs: 20000 });
    const s = suggestTransition(long);
    expect(s.duration).toBe(600);
  });
});

describe('suggestTransitions', () => {
  it('returns empty array for empty input', () => {
    expect(suggestTransitions([])).toEqual([]);
  });

  it('maps over segments and attaches suggestedTransition', () => {
    const segs = [segment({ segmentType: 'action' }), segment({ segmentType: 'dialogue' })];
    const result = suggestTransitions(segs);
    expect(result).toHaveLength(2);
    expect(result[0].suggestedTransition).toBeDefined();
    expect(result[1].suggestedTransition).toBeDefined();
  });
});

describe('findRule', () => {
  it('returns rule for known prev->curr', () => {
    const rule = findRule('action', 'dialogue');
    expect(rule).not.toBeNull();
    expect(rule?.type).toBe('fade');
  });

  it('returns null for unknown pair', () => {
    expect(findRule('unknown', 'unknown')).toBeNull();
  });
});

describe('findRuleByType', () => {
  it('returns first rule matching type', () => {
    const hit = findRuleByType('wipe');
    expect(hit).not.toBeNull();
    expect(hit?.rule.type).toBe('wipe');
  });

  it('returns null for unknown type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(findRuleByType('nonexistent' as any)).toBeNull();
  });
});
