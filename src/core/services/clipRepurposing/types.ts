/**
 * Shared Types — ClipRepurposing
 *
 * Unifies types between:
 *   - ClipWorkflowService (timeline editing, legacy)
 *   - ClipRepurposingPipeline (scoring + SEO, new Step-based)
 *
 * The two services share VideoSegmentBase fields but diverge on
 * service-specific enrichments:
 *   ClipSegment      → timeline editing (transitions, effects, text overlays)
 *   CandidateClip    → candidate selection (transcript, audioEnergy, sceneType)
 */

import type { CandidateClip, ClipScore } from './clipScorer';
import type { SEOMetadata } from './seoGenerator';
import type { ExportTask, AspectRatio } from './multiFormatExport';

// ============================================================
// Shared Base
// ============================================================

/**
 * Time-bounded segment — the common denominator between
 * ClipWorkflowService (timeline) and ClipRepurposingPipeline (candidate).
 */
export interface VideoSegmentBase {
  /** Segment ID */
  id: string;
  /** Start time in source video (seconds) */
  startTime: number;
  /** End time in source video (seconds) */
  endTime: number;
  /** Duration (seconds) */
  duration: number;
  /** Source video ID */
  sourceId: string;
  /** Segment type */
  type: 'video' | 'audio' | 'subtitle';
}

// ============================================================
// Repurposing Types (Pipeline output)
// ============================================================

export interface RepurposingClip {
  clip: CandidateClip;
  score: ClipScore;
  seo?: SEOMetadata;
  exportTasks?: ExportTask[];
}

export interface RepurposingResult {
  clips: RepurposingClip[];
  totalInputDuration: number;
  totalOutputDuration: number;
  platform: string;
  exportedFormats: AspectRatio[];
}

// ============================================================
// Conversion Helpers
// ============================================================

import type { ClipSegment } from '../clip-workflow.service';

/**
 * Convert RepurposingClip (Pipeline output) → ClipSegment (Timeline format).
 * Used when ClipWorkflowService delegates to ClipRepurposingPipeline.
 *
 * Note: Pipeline-specific fields (seo, exportTasks) are not carried over
 * since ClipSegment is timeline-oriented. SEO metadata is accessible via
 * the RepurposingResult when using the pipeline directly.
 */
export function clipSegmentFromRepurposing(
  rep: RepurposingClip,
  index: number,
  sourceId: string,
): ClipSegment {
  return {
    id: rep.clip.id ?? crypto.randomUUID(),
    _startTime: 0, // filled in by timeline assembler
    endTime: 0,    // filled in by timeline assembler
    sourceStart: rep.clip.startTime,
    sourceEnd: rep.clip.endTime,
    sourceId,
    type: 'video',
    transition: undefined,
    effects: [],
    text: rep.clip.transcript?.slice(0, 200) ?? undefined,
    duration: (rep.clip.endTime ?? 0) - (rep.clip.startTime ?? 0),
  };
}
