import { describe, expect, it } from 'vitest';
import { ALIGNMENT_GATE_THRESHOLD, isAlignmentGatePassed } from './alignmentGate';

describe('alignmentGate', () => {
  it('passes when confidence and drift satisfy threshold', () => {
    expect(
      isAlignmentGatePassed({
        averageConfidence: ALIGNMENT_GATE_THRESHOLD.minConfidence,
        maxDriftSeconds: ALIGNMENT_GATE_THRESHOLD.maxDriftSeconds,
      })
    ).toBe(true);
  });

  it('fails when confidence is too low', () => {
    expect(
      isAlignmentGatePassed({
        averageConfidence: ALIGNMENT_GATE_THRESHOLD.minConfidence - 0.01,
        maxDriftSeconds: 0.2,
      })
    ).toBe(false);
  });

  it('fails when drift is too high', () => {
    expect(
      isAlignmentGatePassed({
        averageConfidence: 0.95,
        maxDriftSeconds: ALIGNMENT_GATE_THRESHOLD.maxDriftSeconds + 0.01,
      })
    ).toBe(false);
  });
});
