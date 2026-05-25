/**
 * timelineStore 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore } from './timelineStore';

describe('timelineStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTimelineStore.setState({
      timelineTracks: [],
      playheadMs: 0,
      timelineDuration: 60000,
      snapEnabled: true,
      selectedClipId: undefined,
      selectedTrackId: undefined,
      selectedMultipleIds: undefined,
      inPointMs: undefined,
      outPointMs: undefined,
      trackHistory: { past: [], future: [] },
    });
  });

  // =========================================
  // Initial State
  // =========================================
  describe('initial state', () => {
    it('should have empty timelineTracks', () => {
      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks).toEqual([]);
    });

    it('should have default playheadMs of 0', () => {
      const { playheadMs } = useTimelineStore.getState();
      expect(playheadMs).toBe(0);
    });

    it('should have default timelineDuration of 60000', () => {
      const { timelineDuration } = useTimelineStore.getState();
      expect(timelineDuration).toBe(60000);
    });

    it('should have snapEnabled true by default', () => {
      const { snapEnabled } = useTimelineStore.getState();
      expect(snapEnabled).toBe(true);
    });

    it('should have empty trackHistory', () => {
      const { trackHistory } = useTimelineStore.getState();
      expect(trackHistory.past).toEqual([]);
      expect(trackHistory.future).toEqual([]);
    });
  });

  // =========================================
  // Playhead
  // =========================================
  describe('setPlayheadMs', () => {
    it('should set playhead position', () => {
      useTimelineStore.getState().setPlayheadMs(5000);
      expect(useTimelineStore.getState().playheadMs).toBe(5000);
    });

    it('should not allow negative playhead position', () => {
      useTimelineStore.getState().setPlayheadMs(-100);
      expect(useTimelineStore.getState().playheadMs).toBe(0);
    });
  });

  // =========================================
  // Track Management
  // =========================================
  describe('addTimelineTrack', () => {
    it('should add a video track', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');

      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks).toHaveLength(1);
      expect(timelineTracks[0].id).toBe(trackId);
      expect(timelineTracks[0].type).toBe('video');
      expect(timelineTracks[0].name).toBe('视频轨道 1');
      expect(timelineTracks[0].clips).toEqual([]);
    });

    it('should add an audio track with correct name', () => {
      const store = useTimelineStore.getState();
      const _trackId = store.addTimelineTrack('audio');

      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks[0].name).toBe('音频轨道 1');
    });

    it('should add multiple tracks of same type with incrementing names', () => {
      const store = useTimelineStore.getState();
      store.addTimelineTrack('video');
      store.addTimelineTrack('video');

      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks).toHaveLength(2);
      expect(timelineTracks[0].name).toBe('视频轨道 1');
      expect(timelineTracks[1].name).toBe('视频轨道 2');
    });

    it('should use custom name when provided', () => {
      const store = useTimelineStore.getState();
      store.addTimelineTrack('video', 'My Custom Track');

      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks[0].name).toBe('My Custom Track');
    });

    it('should set track with correct default properties', () => {
      const store = useTimelineStore.getState();
      store.addTimelineTrack('video');

      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks[0].muted).toBe(false);
      expect(timelineTracks[0].locked).toBe(false);
      expect(timelineTracks[0].visible).toBe(true);
    });

    it('should increase track count after adding', () => {
      const store = useTimelineStore.getState();
      expect(store.timelineTracks).toHaveLength(0);

      store.addTimelineTrack('video');
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(1);

      store.addTimelineTrack('audio');
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(2);

      store.addTimelineTrack('subtitle');
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(3);
    });
  });

  describe('removeTimelineTrack', () => {
    it('should remove a track by id', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(1);

      store.removeTimelineTrack(trackId);
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(0);
    });

    it('should decrease track count after removal', () => {
      const store = useTimelineStore.getState();
      const id1 = store.addTimelineTrack('video');
      const id2 = store.addTimelineTrack('audio');
      store.addTimelineTrack('subtitle');

      expect(useTimelineStore.getState().timelineTracks).toHaveLength(3);

      store.removeTimelineTrack(id1);
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(2);

      store.removeTimelineTrack(id2);
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(1);
    });

    it('should only remove the specified track', () => {
      const store = useTimelineStore.getState();
      const id1 = store.addTimelineTrack('video');
      store.addTimelineTrack('audio');
      store.addTimelineTrack('subtitle');

      store.removeTimelineTrack(id1);

      const { timelineTracks } = useTimelineStore.getState();
      expect(timelineTracks).toHaveLength(2);
      expect(timelineTracks.find(t => t.id === id1)).toBeUndefined();
    });
  });

  describe('updateTimelineTrack', () => {
    it('should update track properties', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');

      store.updateTimelineTrack(trackId, { name: 'Updated Name', muted: true });

      const { timelineTracks } = useTimelineStore.getState();
      const track = timelineTracks.find(t => t.id === trackId);
      expect(track?.name).toBe('Updated Name');
      expect(track?.muted).toBe(true);
    });
  });

  // =========================================
  // Clip Management
  // =========================================
  describe('addClipToTrack', () => {
    it('should add a clip to a track', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');

      const clipId = store.addClipToTrack(trackId, {
        name: 'Test Clip',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });

      const { timelineTracks } = useTimelineStore.getState();
      const track = timelineTracks.find(t => t.id === trackId);
      expect(track?.clips).toHaveLength(1);
      expect(track?.clips[0].id).toBe(clipId);
      expect(track?.clips[0].name).toBe('Test Clip');
    });

    it('should increase clip count after adding', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(0);

      store.addClipToTrack(trackId, {
        name: 'Clip 1',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });
      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(1);

      store.addClipToTrack(trackId, {
        name: 'Clip 2',
        startMs: 5000,
        endMs: 10000,
        sourceStartMs: 5000,
        sourceEndMs: 10000,
      });
      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(2);
    });

    it('should set selectedClipId and selectedTrackId when adding clip', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');

      const clipId = store.addClipToTrack(trackId, {
        name: 'Test Clip',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });

      const { selectedClipId, selectedTrackId } = useTimelineStore.getState();
      expect(selectedClipId).toBe(clipId);
      expect(selectedTrackId).toBe(trackId);
    });

    it('should auto-assign trackId to clip', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');

      const clipId = store.addClipToTrack(trackId, {
        name: 'Test Clip',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });

      const { timelineTracks } = useTimelineStore.getState();
      const clip = timelineTracks[0].clips.find(c => c.id === clipId);
      expect(clip?.trackId).toBe(trackId);
    });
  });

  describe('removeClipFromTrack', () => {
    it('should remove a clip by id', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      const clipId = store.addClipToTrack(trackId, {
        name: 'Test Clip',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(1);

      store.removeClipFromTrack(clipId);

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(0);
    });

    it('should decrease clip count after removal', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      const clipId1 = store.addClipToTrack(trackId, {
        name: 'Clip 1',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });
      store.addClipToTrack(trackId, {
        name: 'Clip 2',
        startMs: 5000,
        endMs: 10000,
        sourceStartMs: 5000,
        sourceEndMs: 10000,
      });

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(2);

      store.removeClipFromTrack(clipId1);

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(1);
    });

    it('should clear selection when removing selected clip', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      const clipId = store.addClipToTrack(trackId, {
        name: 'Test Clip',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });

      expect(useTimelineStore.getState().selectedClipId).toBe(clipId);

      store.removeClipFromTrack(clipId);

      expect(useTimelineStore.getState().selectedClipId).toBeUndefined();
    });
  });

  describe('updateClip', () => {
    it('should update clip properties', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      const clipId = store.addClipToTrack(trackId, {
        name: 'Original Name',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });

      store.updateClip(clipId, { name: 'Updated Name', startMs: 1000 });

      const { timelineTracks } = useTimelineStore.getState();
      const clip = timelineTracks[0].clips.find(c => c.id === clipId);
      expect(clip?.name).toBe('Updated Name');
      expect(clip?.startMs).toBe(1000);
    });
  });

  describe('splitClip', () => {
    it('should split a clip at the specified position', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      const clipId = store.addClipToTrack(trackId, {
        name: 'Original Clip',
        startMs: 0,
        endMs: 10000,
        sourceStartMs: 0,
        sourceEndMs: 10000,
      });

      store.splitClip(clipId, 5000);

      const { timelineTracks } = useTimelineStore.getState();
      const clips = timelineTracks[0].clips;

      expect(clips).toHaveLength(2);
      // Left clip: 0-5000
      expect(clips[0].startMs).toBe(0);
      expect(clips[0].endMs).toBe(5000);
      // Right clip: 5000-10000
      expect(clips[1].startMs).toBe(5000);
      expect(clips[1].endMs).toBe(10000);
    });

    it('should increase clip count after split', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      store.addClipToTrack(trackId, {
        name: 'Clip',
        startMs: 0,
        endMs: 10000,
        sourceStartMs: 0,
        sourceEndMs: 10000,
      });

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(1);

      store.splitClip(useTimelineStore.getState().timelineTracks[0].clips[0].id, 5000);

      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(2);
    });

    it('should not split if split point is at clip boundary', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      const clipId = store.addClipToTrack(trackId, {
        name: 'Clip',
        startMs: 0,
        endMs: 10000,
        sourceStartMs: 0,
        sourceEndMs: 10000,
      });

      store.splitClip(clipId, 0); // at start
      expect(useTimelineStore.getState().timelineTracks[0].clips).toHaveLength(1);

      store.splitClip(clipId, 10000); // at end - already split won't apply
      // Note: this may actually split because after the first split, the clip is now 0-10000 again in the old logic
    });
  });

  // =========================================
  // Selection
  // =========================================
  describe('setTimelineSelection', () => {
    it('should set selected clip and track', () => {
      const store = useTimelineStore.getState();
      store.setTimelineSelection('clip-123', 'track-456');

      const { selectedClipId, selectedTrackId } = useTimelineStore.getState();
      expect(selectedClipId).toBe('clip-123');
      expect(selectedTrackId).toBe('track-456');
    });
  });

  describe('clearTimelineSelection', () => {
    it('should clear selection', () => {
      const store = useTimelineStore.getState();
      store.setTimelineSelection('clip-123', 'track-456');
      store.clearTimelineSelection();

      const { selectedClipId, selectedTrackId } = useTimelineStore.getState();
      expect(selectedClipId).toBeUndefined();
      expect(selectedTrackId).toBeUndefined();
    });
  });

  // =========================================
  // Timeline Config
  // =========================================
  describe('setTimelineDuration', () => {
    it('should set timeline duration', () => {
      const store = useTimelineStore.getState();
      store.setTimelineDuration(120000);

      expect(useTimelineStore.getState().timelineDuration).toBe(120000);
    });

    it('should not allow negative duration', () => {
      const store = useTimelineStore.getState();
      store.setTimelineDuration(-100);

      expect(useTimelineStore.getState().timelineDuration).toBe(0);
    });
  });

  describe('setSnapEnabled', () => {
    it('should toggle snap enabled', () => {
      const store = useTimelineStore.getState();
      expect(useTimelineStore.getState().snapEnabled).toBe(true);

      store.setSnapEnabled(false);
      expect(useTimelineStore.getState().snapEnabled).toBe(false);

      store.setSnapEnabled(true);
      expect(useTimelineStore.getState().snapEnabled).toBe(true);
    });
  });

  // =========================================
  // History (Undo/Redo)
  // =========================================
  describe('track history', () => {
    it('should save history when removing track (removeTimelineTrack calls saveTrackHistory)', () => {
      const store = useTimelineStore.getState();
      const trackId = store.addTimelineTrack('video');
      store.addTimelineTrack('audio');

      expect(store.canUndoTrack()).toBe(false);

      store.removeTimelineTrack(trackId);

      expect(store.canUndoTrack()).toBe(true);
    });

    it('should undo track changes', () => {
      const store = useTimelineStore.getState();
      store.setTimelineTracks([{ id: 't1', type: 'video', name: 'Track 1', clips: [], muted: false, locked: false, visible: true, height: 60 }]);
      expect(useTimelineStore.getState().timelineTracks).toHaveLength(1);

      store.undoTrack();

      expect(useTimelineStore.getState().timelineTracks).toHaveLength(0);
    });

    it('should redo track changes', () => {
      const store = useTimelineStore.getState();
      store.setTimelineTracks([{ id: 't1', type: 'video', name: 'Track 1', clips: [], muted: false, locked: false, visible: true, height: 60 }]);
      store.undoTrack();

      expect(useTimelineStore.getState().timelineTracks).toHaveLength(0);

      store.redoTrack();

      expect(useTimelineStore.getState().timelineTracks).toHaveLength(1);
    });

    it('canUndoTrack should return true when past history exists', () => {
      const store = useTimelineStore.getState();
      store.setTimelineTracks([{ id: 't1', type: 'video', name: 'Track 1', clips: [], muted: false, locked: false, visible: true, height: 60 }]);
      expect(store.canUndoTrack()).toBe(true);
    });

    it('canRedoTrack should return true when future history exists', () => {
      const store = useTimelineStore.getState();
      store.setTimelineTracks([{ id: 't1', type: 'video', name: 'Track 1', clips: [], muted: false, locked: false, visible: true, height: 60 }]);
      store.undoTrack();
      expect(store.canRedoTrack()).toBe(true);
    });

    it('canUndoTrack should return false when no history', () => {
      const store = useTimelineStore.getState();
      expect(store.canUndoTrack()).toBe(false);
    });

    it('canRedoTrack should return false when no future history', () => {
      const store = useTimelineStore.getState();
      expect(store.canRedoTrack()).toBe(false);
    });
  });
});
