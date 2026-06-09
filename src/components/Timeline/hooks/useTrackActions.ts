/**
 * Track 操作 Hook
 * 单一职责：封装轨道的增删改 + mute/lock/visible 切换
 */
import { useCallback } from 'react';
import type { TimelineTrack } from '../../core/types/timeline';
import { generateId } from '@/shared/utils';
import { DEFAULT_TRACK_HEIGHT, TRACK_COLORS } from './constants';

interface UseTrackActionsOptions {
  setTracks: React.Dispatch<React.SetStateAction<TimelineTrack[]>>;
  onTracksChange?: (tracks: TimelineTrack[]) => void;
}

/**
 * Track 操作 Hook
 * 返回所有 track 相关的操作方法
 */
export function useTrackActions({ setTracks, onTracksChange }: UseTrackActionsOptions) {
  /** 切换轨道静音状态 */
  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => t.id === trackId ? { ...t, muted: !t.muted } : t)
    );
  }, [setTracks]);

  /** 切换轨道锁定状态 */
  const toggleTrackLock = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => t.id === trackId ? { ...t, locked: !t.locked } : t)
    );
  }, [setTracks]);

  /** 切换轨道可见性 */
  const toggleTrackVisible = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => t.id === trackId ? { ...t, visible: !t.visible } : t)
    );
  }, [setTracks]);

  /** 调整轨道高度 */
  const resizeTrack = useCallback((trackId: string, deltaY: number) => {
    setTracks((prev) => {
      const track = prev.find((t) => t.id === trackId);
      if (!track) return prev;
      const newHeight = Math.max(30, Math.min(200, track.height + deltaY));
      return prev.map((t) => t.id === trackId ? { ...t, height: newHeight } : t);
    });
  }, [setTracks]);

  /** 添加新轨道 */
  const addTrack = useCallback((type: TimelineTrack['type']) => {
    setTracks((prev) => {
      const newTrack: TimelineTrack = {
        id: generateId('track'),
        type,
        name: `${type === 'video' ? '视频' : type === 'audio' ? '音频' : type === 'subtitle' ? '字幕' : '效果'}轨 ${prev.filter((t) => t.type === type).length + 1}`,
        clips: [],
        muted: false,
        locked: false,
        visible: true,
        height: DEFAULT_TRACK_HEIGHT,
        color: TRACK_COLORS[type],
      };
      const updated = [...prev, newTrack];
      onTracksChange?.(updated);
      return updated;
    });
  }, [setTracks, onTracksChange]);

  /** 删除轨道 */
  const deleteTrack = useCallback((trackId: string) => {
    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      onTracksChange?.(updated);
      return updated;
    });
  }, [setTracks, onTracksChange]);

  return {
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisible,
    resizeTrack,
    addTrack,
    deleteTrack,
  };
}
