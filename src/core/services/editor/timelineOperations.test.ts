/**
 * timelineOperations 单元测试
 * 测试 addClip, removeClip, moveClip, splitClip 四个核心函数
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Timeline, TimelineTrack, TimelineClip } from '../../types/timeline';
import { createEmptyTimeline } from '../../types/timeline';
import { addClip, removeClip, moveClip, splitClip } from './timelineOperations';

// Mock crypto.randomUUID for deterministic tests
let mockUuidCounter = 0;
const mockUuids = ['clip-uuid-1', 'clip-uuid-2', 'clip-uuid-3', 'clip-uuid-4', 'clip-uuid-5'];
beforeEach(() => {
  mockUuidCounter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => mockUuids[mockUuidCounter++] ?? `clip-uuid-${mockUuidCounter}`,
  });
});

/** 创建测试用 TimelineTrack */
function createTestTrack(id: string, type: TimelineTrack['type'] = 'video', clips: TimelineClip[] = []): TimelineTrack {
  return {
    id,
    type,
    name: `${type} Track`,
    clips,
    muted: false,
    locked: false,
    visible: true,
    height: 60,
  };
}

/** 创建测试用 TimelineClip */
function createTestClip(overrides: Partial<TimelineClip> & { id: string; trackId: string; startMs: number; endMs: number }): TimelineClip {
  return {
    sourceStartMs: 0,
    sourceEndMs: overrides.endMs - overrides.startMs,
    name: 'Test Clip',
    ...overrides,
  };
}

/** 创建包含单个视频轨道的 Timeline */
function createSingleTrackTimeline(track: TimelineTrack = createTestTrack('track-1')): Timeline {
  const timeline = createEmptyTimeline();
  return {
    ...timeline,
    tracks: [track],
  };
}

describe('addClip', () => {
  it('should add a clip to an existing track', () => {
    const timeline = createSingleTrackTimeline();
    const clipData = {
      startMs: 0,
      endMs: 5000,
      sourceStartMs: 0,
      sourceEndMs: 5000,
      name: 'New Clip',
    };

    const result = addClip(timeline, 'track-1', clipData, 1000);

    expect(result.tracks[0].clips).toHaveLength(1);
    expect(result.tracks[0].clips[0].startMs).toBe(1000);
    expect(result.tracks[0].clips[0].endMs).toBe(6000);
    expect(result.tracks[0].clips[0].name).toBe('New Clip');
  });

  it('should return original timeline when track not found', () => {
    const timeline = createSingleTrackTimeline();
    const clipData = {
      startMs: 0,
      endMs: 5000,
      sourceStartMs: 0,
      sourceEndMs: 5000,
      name: 'New Clip',
    };

    const result = addClip(timeline, 'non-existent-track', clipData, 0);

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(0);
  });

  it('should update timeline duration when new clip extends it', () => {
    const timeline = createSingleTrackTimeline();
    const clipData = {
      startMs: 0,
      endMs: 5000,
      sourceStartMs: 0,
      sourceEndMs: 5000,
      name: 'Long Clip',
    };

    const result = addClip(timeline, 'track-1', clipData, 10000);

    expect(result.duration).toBe(15000);
  });

  it('should sort clips by startMs after adding', () => {
    // Add clip at position 5000, existing clip at 0 should come first after sorting
    const clip1 = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 3000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip1]));

    const clipData = {
      startMs: 0,
      endMs: 2000,
      sourceStartMs: 0,
      sourceEndMs: 2000,
      name: 'Later Clip',
    };

    const result = addClip(timeline, 'track-1', clipData, 5000);

    // After sorting by startMs: existing clip (0) should be first, new clip (5000) second
    expect(result.tracks[0].clips).toHaveLength(2);
    expect(result.tracks[0].clips[0].startMs).toBe(0);    // original clip
    expect(result.tracks[0].clips[1].startMs).toBe(5000);  // newly added clip
  });

  it('should assign generated id and trackId to the clip', () => {
    const timeline = createSingleTrackTimeline();
    const clipData = {
      startMs: 0,
      endMs: 5000,
      sourceStartMs: 0,
      sourceEndMs: 5000,
      name: 'New Clip',
    };

    const result = addClip(timeline, 'track-1', clipData, 0);

    expect(result.tracks[0].clips[0].id).toBe('clip-uuid-1');
    expect(result.tracks[0].clips[0].trackId).toBe('track-1');
  });
});

describe('removeClip', () => {
  it('should remove a clip from track', () => {
    const clip = createTestClip({ id: 'clip-to-remove', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = removeClip(timeline, 'track-1', 'clip-to-remove');

    expect(result.tracks[0].clips).toHaveLength(0);
  });

  it('should return original timeline when track not found', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = removeClip(timeline, 'non-existent-track', 'clip-1');

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it('should return original timeline when clip not found in track', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = removeClip(timeline, 'track-1', 'non-existent-clip');

    // Should return a new object but with same clips
    expect(result).not.toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(1);
    expect(result.tracks[0].clips[0].id).toBe('clip-1');
  });

  it('should only remove the specified clip', () => {
    const clip1 = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 3000 });
    const clip2 = createTestClip({ id: 'clip-2', trackId: 'track-1', startMs: 3000, endMs: 6000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip1, clip2]));

    const result = removeClip(timeline, 'track-1', 'clip-1');

    expect(result.tracks[0].clips).toHaveLength(1);
    expect(result.tracks[0].clips[0].id).toBe('clip-2');
  });

  it('should recalculate timeline duration after removal', () => {
    const clip1 = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const clip2 = createTestClip({ id: 'clip-2', trackId: 'track-1', startMs: 10000, endMs: 15000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip1, clip2]));

    const result = removeClip(timeline, 'track-1', 'clip-2');

    expect(result.duration).toBe(10000);
  });
});

describe('moveClip', () => {
  it('should move a clip to a new position', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = moveClip(timeline, 'track-1', 'clip-1', 3000);

    expect(result.tracks[0].clips[0].startMs).toBe(3000);
    expect(result.tracks[0].clips[0].endMs).toBe(8000);
  });

  it('should return original timeline when clip not found', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = moveClip(timeline, 'track-1', 'non-existent-clip', 1000);

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips[0].startMs).toBe(0);
  });

  it('should preserve clip duration when moving', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = moveClip(timeline, 'track-1', 'clip-1', 2000);

    expect(result.tracks[0].clips[0].endMs - result.tracks[0].clips[0].startMs).toBe(5000);
  });

  it('should recalculate timeline duration after moving', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 5000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = moveClip(timeline, 'track-1', 'clip-1', 20000);

    expect(result.duration).toBe(25000);
  });
});

describe('splitClip', () => {
  it('should split a clip at the specified position', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'clip-1', 4000);

    expect(result.tracks[0].clips).toHaveLength(2);
    expect(result.tracks[0].clips[0].startMs).toBe(0);
    expect(result.tracks[0].clips[0].endMs).toBe(4000);
    expect(result.tracks[0].clips[1].startMs).toBe(4000);
    expect(result.tracks[0].clips[1].endMs).toBe(10000);
  });

  it('should return original timeline when clip not found', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'non-existent-clip', 5000);

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it('should return original timeline when splitMs equals clip startMs', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'clip-1', 0);

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it('should return original timeline when splitMs equals clip endMs', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'clip-1', 10000);

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it('should return original timeline when splitMs is outside clip range', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'clip-1', 15000);

    expect(result).toBe(timeline);
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it('should assign new ids to the split clips', () => {
    const clip = createTestClip({ id: 'clip-1', trackId: 'track-1', startMs: 0, endMs: 10000 });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'clip-1', 5000);

    expect(result.tracks[0].clips[0].id).toBe('clip-uuid-1');
    expect(result.tracks[0].clips[1].id).toBe('clip-uuid-2');
    expect(result.tracks[0].clips[0].id).not.toBe('clip-1');
  });

  it('should preserve source timing when splitting', () => {
    const clip = createTestClip({
      id: 'clip-1',
      trackId: 'track-1',
      startMs: 1000,
      endMs: 6000,
      sourceStartMs: 500,
      sourceEndMs: 5500,
    });
    const timeline = createSingleTrackTimeline(createTestTrack('track-1', 'video', [clip]));

    const result = splitClip(timeline, 'clip-1', 3000);

    expect(result.tracks[0].clips[0].sourceStartMs).toBe(500);
    expect(result.tracks[0].clips[0].sourceEndMs).toBe(5500);
    expect(result.tracks[0].clips[1].sourceStartMs).toBe(500);
    expect(result.tracks[0].clips[1].sourceEndMs).toBe(5500);
  });
});
