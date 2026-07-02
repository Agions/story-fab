/**
 * Clip 操作 Hook
 * 单一职责：封装片段的增删改 + 点击/双击
 */
import { useCallback } from 'react';
import type { TimelineTrack, TimelineClip } from '@/types';
import { generateId } from '@/shared/utils';
import { TRACK_COLORS } from '../constants';

interface UseClipActionsOptions {
  tracks: TimelineTrack[];
  setTracks: React.Dispatch<React.SetStateAction<TimelineTrack[]>>;
  localPlayhead: number;
  onTracksChange?: (tracks: TimelineTrack[]) => void;
  onSelectionChange?: (clipId?: string, trackId?: string) => void;
  onClipUpdate?: (clipId: string, data: Partial<TimelineClip>) => void;
  onClipDelete?: (clipId: string) => void;
  setPropertiesClip: (clip: TimelineClip | null) => void;
}

/**
 * Clip 操作 Hook
 * 返回所有 clip 相关的操作方法
 */
export function useClipActions({
  tracks,
  setTracks,
  localPlayhead,
  onTracksChange,
  onSelectionChange,
  onClipUpdate,
  onClipDelete,
  setPropertiesClip,
}: UseClipActionsOptions) {
  /** 根据 clipId 查找所在轨道和 clip */
  const getClipById = useCallback((clipId: string) => {
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return { track, clip };
    }
    return undefined;
  }, [tracks]);

  /** 添加新片段 */
  const addClip = useCallback((trackId: string) => {
    setTracks((prev) => {
      const track = prev.find((t) => t.id === trackId);
      if (!track || track.locked) return prev;
      const newClip: TimelineClip = {
        id: generateId('clip'),
        trackId,
        startMs: localPlayhead,
        endMs: localPlayhead + 5000,
        sourceStartMs: 0,
        sourceEndMs: 5000,
        name: `片段 ${prev.flatMap((t) => t.clips).length + 1}`,
        color: TRACK_COLORS[track.type],
      };
      const updated = prev.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
      );
      onTracksChange?.(updated);
      onSelectionChange?.(newClip.id, trackId);
      return updated;
    });
  }, [setTracks, localPlayhead, onTracksChange, onSelectionChange]);

  /** 片段点击（选中） */
  const handleClipClick = useCallback((clipId: string, trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange?.(clipId, trackId);
  }, [onSelectionChange]);

  /** 片段双击（打开属性面板） */
  const handleClipDoubleClick = useCallback((clip: TimelineClip) => {
    setPropertiesClip(clip);
  }, [setPropertiesClip]);

  /** 更新片段数据 */
  const handleClipUpdate = useCallback((clipId: string, data: Partial<TimelineClip>) => {
    setTracks((prev) => {
      const updated = prev.map((t) => {
        const clipIndex = t.clips.findIndex((c) => c.id === clipId);
        if (clipIndex === -1) return t;
        const updatedClips = [...t.clips];
        updatedClips[clipIndex] = { ...updatedClips[clipIndex], ...data };
        return { ...t, clips: updatedClips };
      });
      onTracksChange?.(updated);
      onClipUpdate?.(clipId, data);
      return updated;
    });
  }, [setTracks, onTracksChange, onClipUpdate]);

  /** 删除片段 */
  const handleClipDelete = useCallback((clipId: string) => {
    setTracks((prev) => {
      const updated = prev.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      }));
      onTracksChange?.(updated);
      onClipDelete?.(clipId);
      return updated;
    });
  }, [setTracks, onTracksChange, onClipDelete]);

  return {
    getClipById,
    addClip,
    handleClipClick,
    handleClipDoubleClick,
    handleClipUpdate,
    handleClipDelete,
  };
}
