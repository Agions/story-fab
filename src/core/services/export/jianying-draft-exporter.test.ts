import { describe, it, expect } from 'vitest';
import { generateJianYingClip, generateJianYingDraft } from './jianying-draft-exporter';

describe('JianYingDraftExporter', () => {
  it('should generate clip with correct ms fields', () => {
    const clip = generateJianYingClip('clip-1', 'track-1', {
      startMs: 0,
      endMs: 4000,
      sourceStartMs: 1000,
      sourceEndMs: 5000,
    });
    expect(clip.id).toBe('clip-1');
    expect(clip.trackId).toBe('track-1');
    expect(clip.sourceStartMs).toBe(1000);
    expect(clip.sourceEndMs).toBe(5000);
    expect(clip.speed).toBe(1.0);
  });

  it('should generate draft with video track', () => {
    // Simulate ClipSegment[] with a minimal shape (no as any)
    const segments: Array<{
      id: string;
      sourceStartMs: number;
      sourceEndMs: number;
      startMs: number;
      endMs: number;
      duration: number;
      score: { total: number };
    }> = [
      {
        id: 'seg-1',
        sourceStartMs: 1000,
        sourceEndMs: 8000,
        startMs: 0,
        endMs: 7000,
        duration: 7000,
        score: { total: 80 },
      },
    ];
    const draft = generateJianYingDraft('video-1', segments, 30000);
    expect(draft.version).toBeDefined();
    expect(draft.tracks.length).toBeGreaterThanOrEqual(1);
    expect(draft.tracks[0].type).toBe('video');
    expect(draft.duration).toBe(30000);
  });
});
