/**
 * 剪映草稿导出器
 * 将 ClipSegment[] 转换为剪映可读的 draft_content.json
 */

import { JIANYING_DRAFT_VERSION } from '../../types/jianying';
import type { JianYingDraft, JianYingTrack, JianYingClip } from '../../types/jianying';

export interface JianYingExportOptions {
  videoId: string;
  segments: unknown[]; // ClipSegment[]
  totalDurationMs: number;
  outputDir: string;
}

export function generateJianYingClip(
  clipId: string,
  trackId: string,
  timing: {
    startMs: number;
    endMs: number;
    sourceStartMs: number;
    sourceEndMs: number;
  }
): JianYingClip {
  return {
    id: clipId,
    trackId,
    startMs: timing.startMs,
    endMs: timing.endMs,
    sourceStartMs: timing.sourceStartMs,
    sourceEndMs: timing.sourceEndMs,
    speed: 1.0,
    color: '#FFFFFF',
  };
}

export function generateJianYingDraft(
  videoId: string,
  segments: unknown[],
  totalDurationMs: number
): JianYingDraft {
  const videoTrackId = `video-track-${videoId}`;

  const videoTrack: JianYingTrack = {
    id: videoTrackId,
    type: 'video',
    clips: segments.map((seg: unknown, i: number) => {
      const s = seg as Record<string, unknown>;
      return generateJianYingClip(
        `clip-${i}-${String(s.id ?? i)}`,
        videoTrackId,
        {
          startMs: (s.startMs as number) ?? 0,
          endMs: (s.endMs as number) ?? ((s.startMs as number) + (s.duration as number)),
          sourceStartMs: s.sourceStartMs as number,
          sourceEndMs: s.sourceEndMs as number,
        }
      );
    }),
  };

  return {
    version: JIANYING_DRAFT_VERSION,
    tracks: [videoTrack],
    duration: totalDurationMs,
  };
}
