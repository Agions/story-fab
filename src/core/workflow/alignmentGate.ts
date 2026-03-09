export const ALIGNMENT_GATE_THRESHOLD = {
  minConfidence: 0.8,
  maxDriftSeconds: 0.8,
} as const;

export interface AlignmentGateSummary {
  averageConfidence: number;
  maxDriftSeconds: number;
}

export const isAlignmentGatePassed = (
  summary: AlignmentGateSummary,
  threshold = ALIGNMENT_GATE_THRESHOLD
): boolean => {
  return (
    summary.averageConfidence >= threshold.minConfidence &&
    summary.maxDriftSeconds <= threshold.maxDriftSeconds
  );
};
