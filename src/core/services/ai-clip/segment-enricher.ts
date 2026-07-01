/**
 * Segment Enricher
 *
 * Takes the raw segments returned by Rust `detect_smart_segments` and:
 *   1. Normalizes Rust's snake_case + CamelCase type strings → SmartVideoSegment
 *   2. Preserves Rust's `suggested_speed` field
 *   3. Runs `suggestTransitions()` to fill `suggestedTransition` on the TS side
 *
 * Why this module exists:
 *   Rust segmenter.rs populates `suggested_speed` (from the energy ratio), but
 *   does NOT populate `suggested_transition`. The TypeScript side needs both
 *   fields to render the AIClip "Smart Edit" UI. We can't round-trip through
 *   Rust just to get transitions (network/IPC cost), so we compute them here
 *   using the rule matrix in transition-suggestion.ts.
 *
 * Pipeline position: between `tauri.detectSmartSegments()` (analyzer.ts) and
 * the UI components (AIClip).
 */

import type { SmartVideoSegment } from '../../video/highlight.types';
import { suggestTransitions, type TransitionType } from '../video/transition-suggestion';

// ============================================
// Rust wire format
// ============================================

/** Shape returned by Rust `detect_smart_segments` (snake_case) */
export interface RustRawSegment {
  start_ms: number;
  end_ms: number;
  segment_type: string;
  duration_ms: number;
  confidence: number;
  is_scene_change?: boolean;
  peak_energy?: number;
  silence_ratio?: number;
  /** Rust populates this when computing speed from energy ratio. */
  suggested_speed?: number;
}

/** Normalized segment type set (must match SegmentType in highlight.types.ts) */
type NormalizedType = 'dialogue' | 'action' | 'transition' | 'silence' | 'content';

// ============================================
// 内部：归一化类型
// ============================================

/**
 * Normalize a Rust segment_type string (which may be PascalCase like "Dialogue"
 * or snake_case like "dialogue") to the lower-case values used by TS types.
 * Falls back to "content" for unknown values.
 */
function normalizeType(raw: string | undefined | null): NormalizedType {
  const t = String(raw ?? '').toLowerCase().trim();
  switch (t) {
    case 'dialogue':
    case 'action':
    case 'transition':
    case 'silence':
    case 'content':
      return t;
    default:
      return 'content';
  }
}

// ============================================
// 公开 API
// ============================================

/**
 * Convert a single raw Rust segment → SmartVideoSegment.
 * Does NOT compute transitions (use `enrichSegments` for that).
 */
export function enrichSegment(raw: RustRawSegment): SmartVideoSegment {
  return {
    startMs: raw.start_ms,
    endMs: raw.end_ms,
    segmentType: normalizeType(raw.segment_type),
    durationMs: raw.duration_ms,
    confidence: raw.confidence,
    isSceneChange: raw.is_scene_change,
    peakEnergy: raw.peak_energy,
    silenceRatio: raw.silence_ratio,
    suggestedSpeed: raw.suggested_speed,
  };
}

/**
 * Convert + apply transition suggestions in one pass.
 *
 * @param raw  Raw segments from `tauri.detectSmartSegments()`
 * @returns    Enriched SmartVideoSegment[] with `suggestedSpeed` and
 *             `suggestedTransition` populated
 */
export function enrichSegments(raw: RustRawSegment[]): SmartVideoSegment[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const base = raw.map(enrichSegment);
  return suggestTransitions(base);
}

/**
 * Aggregate stats helper for UI (e.g. "12 segments · 5×4x · 1×6x").
 * Counts segments by their suggestedSpeed bucket.
 */
export interface SpeedSummary {
  total: number;
  bySpeed: Record<string, number>; // '1x' → count, '2x' → count, ...
  fastestSpeed: number;
  fastestCount: number;
  transitionCounts: Record<TransitionType, number>;
}

export function summarizeSpeeds(segments: SmartVideoSegment[]): SpeedSummary {
  const bySpeed: Record<string, number> = {};
  const transitionCounts: Record<string, number> = {
    none: 0, fade: 0, dissolve: 0, wipe: 0, slide: 0, zoom: 0, glitch: 0,
  };
  let fastestSpeed = 1;
  let fastestCount = 0;

  for (const s of segments) {
    const sp = s.suggestedSpeed ?? 1;
    const key = `${sp}x`;
    bySpeed[key] = (bySpeed[key] ?? 0) + 1;
    if (sp > fastestSpeed) {
      fastestSpeed = sp;
      fastestCount = bySpeed[key];
    } else if (sp === fastestSpeed) {
      fastestCount = bySpeed[key];
    }
    const t = s.suggestedTransition?.type ?? 'none';
    transitionCounts[t] = (transitionCounts[t] ?? 0) + 1;
  }

  return { total: segments.length, bySpeed, fastestSpeed, fastestCount, transitionCounts: transitionCounts as SpeedSummary['transitionCounts'] };
}
