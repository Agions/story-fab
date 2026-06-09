/**
 * 时间轴拖拽 Hook
 * 单一职责：封装片段拖拽逻辑（移动/调整开始/调整结束）
 * 使用 rAF 优化性能，避免每帧都触发状态更新
 */
import { useCallback, useRef } from 'react';
import type { TimelineTrack, TimelineClip } from '../../core/types/timeline';
import { MIN_CLIP_DURATION } from './constants';
import { snapToBoundary } from '../timelineSnap';

/** 拖拽类型 */
export type DragType = 'move' | 'start' | 'end';

interface UseTimelineDragOptions {
  tracks: TimelineTrack[];
  setTracks: React.Dispatch<React.SetStateAction<TimelineTrack[]>>;
  duration: number;
  msPerPixel: number;
  snapEnabled: boolean;
  onClipUpdate?: (clipId: string, data: Partial<TimelineClip>) => void;
  getClipById: (clipId: string) => { track: TimelineTrack; clip: TimelineClip } | undefined;
}

/**
 * 时间轴拖拽 Hook
 * 封装拖拽状态和事件处理，使用 rAF 优化性能
 */
export function useTimelineDrag({
  tracks,
  setTracks,
  duration,
  msPerPixel,
  snapEnabled,
  onClipUpdate,
  getClipById,
}: UseTimelineDragOptions) {
  // 拖拽状态 refs（用于 rAF 闭包）
  const dragAnimFrameRef = useRef<number>(0);
  const dragPendingDeltaRef = useRef<number>(0);
  const dragOriginalStartRef = useRef<number>(0);
  const dragOriginalEndRef = useRef<number>(0);
  const dragClipIdRef = useRef<string>('');
  const dragTrackIdRef = useRef<string>('');
  const dragTypeRef = useRef<DragType | null>(null);

  // 事件处理器 refs
  const dragMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const dragUpHandlerRef = useRef<(() => void) | null>(null);

  /** 计算新位置（根据拖拽类型） */
  const _calculateNewPosition = useCallback((
    dragType: DragType,
    clipId: string,
    originalStart: number,
    originalEnd: number,
    deltaMs: number,
  ) => {
    let newStartMs = originalStart;
    let newEndMs = originalEnd;

    if (dragType === 'move') {
      newStartMs = snapToBoundary(originalStart + deltaMs, clipId, tracks, duration, msPerPixel, snapEnabled);
      newEndMs = newStartMs + (originalEnd - originalStart);
    } else if (dragType === 'start') {
      newStartMs = Math.max(0, snapToBoundary(originalStart + deltaMs, clipId, tracks, duration, msPerPixel, snapEnabled));
      if (newStartMs >= newEndMs - MIN_CLIP_DURATION) {
        newStartMs = newEndMs - MIN_CLIP_DURATION;
      }
    } else if (dragType === 'end') {
      newEndMs = Math.max(newStartMs + MIN_CLIP_DURATION, snapToBoundary(originalEnd + deltaMs, clipId, tracks, duration, msPerPixel, snapEnabled));
    }

    return { newStartMs, newEndMs };
  }, [tracks, duration, msPerPixel, snapEnabled]);

  /** 开始拖拽 */
  const handleDragStart = useCallback((
    clipId: string,
    trackId: string,
    type: DragType,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    const { track, clip } = getClipById(clipId) ?? {};
    if (!clip || track?.locked) return;

    // 存储初始值到 refs（供 rAF 闭包使用）
    dragClipIdRef.current = clipId;
    dragTrackIdRef.current = trackId;
    dragTypeRef.current = type;
    dragOriginalStartRef.current = clip.startMs;
    dragOriginalEndRef.current = clip.endMs;
    dragPendingDeltaRef.current = 0;

    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      dragPendingDeltaRef.current += deltaX;

      // rAF 优化：避免每帧都触发状态更新
      if (!dragAnimFrameRef.current) {
        dragAnimFrameRef.current = requestAnimationFrame(() => {
          dragAnimFrameRef.current = 0;
          const deltaMs = dragPendingDeltaRef.current * msPerPixel;
          dragPendingDeltaRef.current = 0;

          const clipId = dragClipIdRef.current;
          const trackId = dragTrackIdRef.current;
          const dragType = dragTypeRef.current;
          const originalStart = dragOriginalStartRef.current;
          const originalEnd = dragOriginalEndRef.current;

          if (!dragType) return;

          const { newStartMs, newEndMs } = _calculateNewPosition(
            dragType, clipId, originalStart, originalEnd, deltaMs,
          );

          setTracks((prevTracks) =>
            prevTracks.map((t) => {
              if (t.id !== trackId) return t;
              return {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? { ...c, startMs: newStartMs, endMs: newEndMs } : c,
                ),
              };
            }),
          );
        });
      }
    };

    const handleMouseUp = () => {
      cancelAnimationFrame(dragAnimFrameRef.current);
      dragAnimFrameRef.current = 0;
      dragTypeRef.current = null;

      if (dragMoveHandlerRef.current) {
        document.removeEventListener('mousemove', dragMoveHandlerRef.current);
      }
      if (dragUpHandlerRef.current) {
        document.removeEventListener('mouseup', dragUpHandlerRef.current);
      }

      const { clip: finalClip } = getClipById(clipId) ?? {};
      if (finalClip) {
        onClipUpdate?.(clipId, { startMs: finalClip.startMs, endMs: finalClip.endMs });
      }
    };

    dragMoveHandlerRef.current = handleMouseMove;
    dragUpHandlerRef.current = handleMouseUp;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getClipById, msPerPixel, onClipUpdate, setTracks, _calculateNewPosition]);

  return { handleDragStart };
}
