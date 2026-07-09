/**
 * EditorStore — 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore, __resetTrackHistoryForTest } from './editor-store';

beforeEach(() => {
  __resetTrackHistoryForTest();
  useEditorStore.setState({
    video: null,
    script: null,
    voice: null,
    activePanel: 'video',
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    muted: false,
    selection: { segmentId: undefined, multipleIds: [] },
    zoom: 1,
    scrollPosition: 0,
    timelineTracks: [],
    playheadMs: 0,
    timelineDuration: 60000,
    snapEnabled: true,
    snapThreshold: 100,
    selectedClipId: undefined,
    selectedTrackId: undefined,
    selectedMultipleIds: undefined,
    inPointMs: undefined,
    outPointMs: undefined,
  });
});

describe('useEditorStore', () => {
  describe('setters', () => {
    it('setVideo updates video', () => {
      useEditorStore.getState().setVideo({ id: 'v1', url: '/v.mp4', duration: 10 });
      expect(useEditorStore.getState().video?.id).toBe('v1');
    });

    it('setScript updates script', () => {
      useEditorStore.getState().setScript({ id: 's1', content: 'hello' });
      expect(useEditorStore.getState().script?.content).toBe('hello');
    });

    it('setActivePanel updates activePanel', () => {
      useEditorStore.getState().setActivePanel('script');
      expect(useEditorStore.getState().activePanel).toBe('script');
    });

    it('setIsPlaying updates isPlaying', () => {
      useEditorStore.getState().setIsPlaying(true);
      expect(useEditorStore.getState().isPlaying).toBe(true);
    });

    it('setCurrentTime updates currentTime', () => {
      useEditorStore.getState().setCurrentTime(5.5);
      expect(useEditorStore.getState().currentTime).toBe(5.5);
    });

    it('setVolume clamps between 0 and 1', () => {
      useEditorStore.getState().setVolume(1.5);
      expect(useEditorStore.getState().volume).toBe(1);
      useEditorStore.getState().setVolume(-0.5);
      expect(useEditorStore.getState().volume).toBe(0);
    });

    it('setMuted updates muted', () => {
      useEditorStore.getState().setMuted(true);
      expect(useEditorStore.getState().muted).toBe(true);
    });
  });

  describe('selection', () => {
    it('setSelection merges partial selection', () => {
      useEditorStore.getState().setSelection({ segmentId: 'seg-1' });
      expect(useEditorStore.getState().selection.segmentId).toBe('seg-1');
      expect(useEditorStore.getState().selection.multipleIds).toEqual([]);
    });

    it('clearSelection resets selection', () => {
      useEditorStore.getState().setSelection({ segmentId: 'seg-1', multipleIds: ['a'] });
      useEditorStore.getState().clearSelection();
      expect(useEditorStore.getState().selection).toEqual({ segmentId: undefined, multipleIds: [] });
    });
  });

  describe('zoom', () => {
    it('setZoom clamps to max', () => {
      useEditorStore.getState().setZoom(20);
      expect(useEditorStore.getState().zoom).toBe(10);
    });

    it('setZoom clamps to min', () => {
      useEditorStore.getState().setZoom(0.01);
      expect(useEditorStore.getState().zoom).toBe(0.1);
    });
  });

  describe('timeline tracks', () => {
    it('addTimelineTrack creates track with id', () => {
      const id = useEditorStore.getState().addTimelineTrack('video', 'My Track');
      expect(typeof id).toBe('string');
      const track = useEditorStore.getState().timelineTracks.find(t => t.id === id);
      expect(track?.name).toBe('My Track');
      expect(track?.type).toBe('video');
    });

    it('removeTimelineTrack removes track', () => {
      const id = useEditorStore.getState().addTimelineTrack('audio');
      expect(useEditorStore.getState().timelineTracks).toHaveLength(1);
      useEditorStore.getState().removeTimelineTrack(id);
      expect(useEditorStore.getState().timelineTracks).toHaveLength(0);
    });

    it('updateTimelineTrack updates fields', () => {
      const id = useEditorStore.getState().addTimelineTrack('video');
      useEditorStore.getState().updateTimelineTrack(id, { muted: true });
      expect(useEditorStore.getState().timelineTracks[0].muted).toBe(true);
    });
  });

  describe('clips', () => {
    it('addClipToTrack adds clip and selects it', () => {
      const trackId = useEditorStore.getState().addTimelineTrack('video');
      const clipId = useEditorStore.getState().addClipToTrack(trackId, {
        name: 'clip-1',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });
      const track = useEditorStore.getState().timelineTracks.find(t => t.id === trackId)!;
      expect(track.clips).toHaveLength(1);
      expect(useEditorStore.getState().selectedClipId).toBe(clipId);
    });

    it('removeClipFromTrack removes clip', () => {
      const trackId = useEditorStore.getState().addTimelineTrack('video');
      const clipId = useEditorStore.getState().addClipToTrack(trackId, {
        name: 'clip-1',
        startMs: 0,
        endMs: 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
      });
      expect(useEditorStore.getState().timelineTracks[0].clips).toHaveLength(1);
      useEditorStore.getState().removeClipFromTrack(clipId);
      expect(useEditorStore.getState().timelineTracks[0].clips).toHaveLength(0);
    });

    it('splitClip splits at midpoint', () => {
      const trackId = useEditorStore.getState().addTimelineTrack('video');
      const clipId = useEditorStore.getState().addClipToTrack(trackId, {
        name: 'clip-1',
        startMs: 0,
        endMs: 10000,
        sourceStartMs: 0,
        sourceEndMs: 10000,
      });
      useEditorStore.getState().splitClip(clipId, 5000);
      const track = useEditorStore.getState().timelineTracks.find(t => t.id === trackId)!;
      expect(track.clips).toHaveLength(2);
      expect(track.clips[0].endMs).toBe(5000);
      expect(track.clips[1].startMs).toBe(5000);
    });
  });

  describe('history', () => {
    it('saveTrackHistory stores state', () => {
      useEditorStore.getState().addTimelineTrack('video');
      useEditorStore.getState().saveTrackHistory();
      expect(useEditorStore.getState().canUndoTrack()).toBe(true);
    });

    it('undoTrack restores previous state', () => {
      useEditorStore.getState().addTimelineTrack('video');
      useEditorStore.getState().saveTrackHistory();
      useEditorStore.getState().addTimelineTrack('audio');
      expect(useEditorStore.getState().timelineTracks).toHaveLength(2);
      useEditorStore.getState().undoTrack();
      expect(useEditorStore.getState().timelineTracks).toHaveLength(1);
    });

    it('redoTrack re-applies undone change', () => {
      useEditorStore.getState().addTimelineTrack('video');
      useEditorStore.getState().saveTrackHistory();
      useEditorStore.getState().addTimelineTrack('audio');
      useEditorStore.getState().undoTrack();
      useEditorStore.getState().redoTrack();
      expect(useEditorStore.getState().timelineTracks).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('restores initial state', () => {
      useEditorStore.getState().setVideo({ id: 'v1', url: '/v.mp4', duration: 10 });
      useEditorStore.getState().setActivePanel('script');
      useEditorStore.getState().reset();
      expect(useEditorStore.getState().video).toBeNull();
      expect(useEditorStore.getState().activePanel).toBe('video');
    });
  });
});
