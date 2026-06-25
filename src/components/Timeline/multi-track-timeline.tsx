/**
 * MultiTrackTimeline - 多轨道时间线组件
 * 支持视频轨、音频轨、字幕轨分离渲染
 * 支持片段拖拽、边缘调整、吸附、双击属性面板
 *
 * 子模块:
 * - TrackHeader       轨道头（静音/锁定/可见性控制）
 * - TimeRuler         时间刻度尺
 * - Playhead          播放头
 * - ClipRenderer      片段渲染器
 * - ClipPropertiesPanel 片段属性面板
 */

// 播放头更新间隔 (ms)，约30fps
const PLAYHEAD_INTERVAL_MS = 33;
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
  useMemo,
} from 'react';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
  PlayCircle,
  PauseCircle,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  Send,
  Rewind,
} from 'lucide-react';
import type { TimelineTrack, TimelineClip } from './types';

import { TrackHeader } from './track-header';
import { TimeRuler } from './time-ruler';
import { Playhead } from './playhead';
import { ClipRenderer } from './clip-renderer';
import { ClipPropertiesPanel } from './clip-properties-panel';
import { clamp, formatTimecodeMs } from '@/shared/utils';
import { MIN_ZOOM, MAX_ZOOM } from './constants';
import { useTrackActions } from './hooks/useTrackActions';
import { useClipActions } from './hooks/useClipActions';
import { useTimelineDrag } from './hooks/useTimelineDrag';

import styles from '@/components/Timeline/Timeline.module.less';

// ============================================
// MultiTrackTimeline 主组件
// ============================================
export interface MultiTrackTimelineProps {
  tracks: TimelineTrack[];
  playheadMs: number;
  zoom: number;
  scrollX: number;
  duration: number;
  snapEnabled?: boolean;
  selectedClipId?: string;
  selectedTrackId?: string;
  isPlaying?: boolean;
  onTracksChange?: (tracks: TimelineTrack[]) => void;
  onPlayheadChange?: (ms: number) => void;
  onZoomChange?: (zoom: number) => void;
  onScrollXChange?: (scrollX: number) => void;
  onSelectionChange?: (clipId?: string, trackId?: string) => void;
  onClipUpdate?: (clipId: string, data: Partial<TimelineClip>) => void;
  onClipDelete?: (clipId: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = memo(({
  tracks: initialTracks,
  playheadMs,
  zoom,
  scrollX,
  duration,
  snapEnabled = true,
  selectedClipId,
  isPlaying = false,
  onTracksChange,
  onPlayheadChange,
  onZoomChange,
  onScrollXChange,
  onSelectionChange,
  onClipUpdate,
  onClipDelete,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [tracks, setTracks] = useState<TimelineTrack[]>(initialTracks);
  const [localPlayhead, setLocalPlayhead] = useState(playheadMs);
  const [localZoom, setLocalZoom] = useState(zoom);
  const [localScrollX, setLocalScrollX] = useState(scrollX);
  const [isDragging] = useState(false);
  const [propertiesClip, setPropertiesClip] = useState<TimelineClip | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const msPerPixel = 1000 / localZoom;

  // Track initialization to handle prop changes after mount
  // (e.g., project switch — parent changes initialTracks but component stays mounted)
  const initializedRef = useRef(false);
  const onTracksChangeRef = useRef(onTracksChange);
  onTracksChangeRef.current = onTracksChange;
  useEffect(() => {
    if (!initializedRef.current) {
      // First mount: seed all local state from props
      setTracks(initialTracks);
      setLocalPlayhead(playheadMs);
      setLocalZoom(zoom);
      setLocalScrollX(scrollX);
      initializedRef.current = true;
    } else {
      // Subsequent prop changes: sync tracks if parent provides new reference
      if (initialTracks !== tracks) {
        setTracks(initialTracks);
      }
      setLocalPlayhead(playheadMs);
      setLocalZoom(zoom);
      setLocalScrollX(scrollX);
    }
  }, [initialTracks, playheadMs, zoom, scrollX, tracks]);

  // 播放头跟随
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLocalPlayhead((prev) => {
        const next = prev + PLAYHEAD_INTERVAL_MS;
        if (next >= duration) { clearInterval(interval); return duration; }
        return next;
      });
    }, PLAYHEAD_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // tracks ref to avoid stale closure in keyboard handler
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // 轨道操作 — 全部使用 setTracks 函数式更新，避免闭包陈旧
  // 支持 (trackId, Partial<T>) 或 (trackId, (track: TimelineTrack) => Partial<T>) 函数式更新
  const updateTrack = useCallback((trackId: string, updates: Partial<TimelineTrack> | ((t: TimelineTrack) => Partial<TimelineTrack>)) => {
    setTracks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== trackId) return t;
        const changes = typeof updates === 'function' ? (updates as (t: TimelineTrack) => Partial<TimelineTrack>)(t) : updates;
        return { ...t, ...changes };
      });
      onTracksChangeRef.current?.(updated);
      return updated;
    });
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); onUndo?.(); }
        else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); onRedo?.(); }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        const currentTracks = tracksRef.current;
        const targetTrack = currentTracks.find((t: TimelineTrack) => t.clips.some((c: TimelineClip) => c.id === selectedClipId));
        if (targetTrack) {
          const updatedClips = targetTrack.clips.filter((c: TimelineClip) => c.id !== selectedClipId);
          updateTrack(targetTrack.id, { clips: updatedClips });
          onClipDelete?.(selectedClipId);
          onSelectionChange?.(undefined, undefined);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, onUndo, onRedo, updateTrack, onClipDelete, onSelectionChange]);

  // 吸附逻辑已提取到 timelineSnap.ts
  // 保留 msPerPixel 用于计算和向后兼容

  // ============================================
  // Track 操作 Hook（增删改 + mute/lock/visible）
  // 优化：提取到 useTrackActions，减少组件行数约 60 行
  // ============================================
  const {
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisible,
    resizeTrack,
    addTrack,
    deleteTrack,
  } = useTrackActions({ setTracks, onTracksChange });

  // ============================================
  // Clip 操作 Hook（增删改 + 点击/双击）
  // 优化：提取到 useClipActions，减少组件行数约 80 行
  // ============================================
  const {
    getClipById,
    addClip,
    handleClipClick,
    handleClipDoubleClick,
    handleClipUpdate,
    handleClipDelete,
  } = useClipActions({
    tracks,
    setTracks,
    localPlayhead,
    onTracksChange,
    onSelectionChange,
    onClipUpdate,
    onClipDelete,
    setPropertiesClip,
  });

  // ============================================
  // 拖拽 Hook（rAF 优化）
  // 优化：提取到 useTimelineDrag，减少组件行数约 100 行
  // ============================================
  const { handleDragStart } = useTimelineDrag({
    tracks,
    setTracks,
    duration,
    msPerPixel,
    snapEnabled,
    onClipUpdate,
    getClipById,
  });

  // 时间线点击
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    const container = tracksContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + localScrollX;
    const ms = clamp(x * msPerPixel, 0, duration);
    setLocalPlayhead(ms);
    onPlayheadChange?.(ms);
  }, [isDragging, localScrollX, msPerPixel, duration, onPlayheadChange]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = clamp(localZoom * delta, MIN_ZOOM, MAX_ZOOM);
      setLocalZoom(newZoom);
      onZoomChange?.(newZoom);
    } else {
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const newScrollX = Math.max(0, localScrollX + delta * 0.5);
      setLocalScrollX(newScrollX);
      onScrollXChange?.(newScrollX);
    }
  }, [localZoom, localScrollX, onZoomChange, onScrollXChange]);

  // 添加轨道菜单
  const trackMenuItems = useMemo(() => [
    { key: 'video', label: '视频轨道', onClick: () => addTrack('video') },
    { key: 'audio', label: '音频轨道', onClick: () => addTrack('audio') },
    { key: 'subtitle', label: '字幕轨道', onClick: () => addTrack('subtitle') },
    { key: 'effect', label: '效果轨道', onClick: () => addTrack('effect') },
  ], [addTrack]);

  const containerWidth = containerRef.current?.clientWidth || 800;
  const totalHeight = tracks.reduce((sum, t) => sum + t.height, 0);
  const totalWidth = duration / msPerPixel;

  return (
    <div className={styles.multiTrackTimeline} ref={containerRef}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className="flex gap-2 items-center">
          <Tooltip title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}>
            <Button icon={isPlaying ? <PauseCircle /> : <PlayCircle />}>
              {isPlaying ? '暂停' : '播放'}
            </Button>
          </Tooltip>
          <Tooltip title="跳转开头">
            <Button icon={<Rewind />} onClick={() => { setLocalPlayhead(0); onPlayheadChange?.(0); }} />
          </Tooltip>
          <span className="w-px h-4 bg-zinc-700" />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button icon={<Plus />}>添加轨道</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {trackMenuItems.map(item => (
                <DropdownMenuItem key={item.key} onClick={item.onClick}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip title={selectedClipId ? '删除片段 (Delete)' : '请先选择片段'}>
            <Button icon={<Trash2 />} danger disabled={!selectedClipId} onClick={() => selectedClipId && handleClipDelete(selectedClipId)} />
          </Tooltip>
          <span className="w-px h-4 bg-zinc-700" />
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button icon={<Send style={{ transform: 'rotate(180deg)' }} />} disabled={!canUndo} onClick={onUndo} />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button icon={<Send />} disabled={!canRedo} onClick={onRedo} />
          </Tooltip>
          <span className="w-px h-4 bg-zinc-700" />
          <div className="flex gap-2 items-center">
            <Tooltip title="缩小">
              <Button icon={<ZoomOut />} onClick={() => {
                const newZoom = clamp(localZoom / 1.2, MIN_ZOOM, MAX_ZOOM);
                setLocalZoom(newZoom);
                onZoomChange?.(newZoom);
              }} />
            </Tooltip>
            <span className={styles.zoomLabel}>{Math.round(localZoom * 100)}%</span>
            <Tooltip title="放大">
              <Button icon={<ZoomIn />} onClick={() => {
                const newZoom = clamp(localZoom * 1.2, MIN_ZOOM, MAX_ZOOM);
                setLocalZoom(newZoom);
                onZoomChange?.(newZoom);
              }} />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 时间显示 */}
      <div className={styles.timeDisplay}>
        <span className={styles.currentTime}>{formatTimecodeMs(localPlayhead)}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.totalTime}>{formatTimecodeMs(duration)}</span>
      </div>

      {/* 时间轴主体 */}
      <div className={styles.timelineWrapper} onWheel={handleWheel}>
        {/* 左侧：轨道头区域 */}
        <div className={styles.trackHeadersColumn}>
          <div className={styles.rulerHeaderSpacer} />
          {tracks.map((track) => (
            <TrackHeader
              key={track.id}
              track={track}
              onToggleMute={toggleTrackMute}
              onToggleLock={toggleTrackLock}
              onToggleVisible={toggleTrackVisible}
              onResizeTrack={resizeTrack}
              onAddClip={addClip}
              onDeleteTrack={deleteTrack}
            />
          ))}
        </div>

        {/* 右侧：轨道内容区域 */}
        <div
          className={styles.tracksContentArea}
          ref={tracksContainerRef}
          onClick={handleTimelineClick}
        >
          {/* 时间刻度 */}
          <TimeRuler
            duration={duration}
            zoom={localZoom}
            scrollX={localScrollX}
            width={containerWidth - 150}
          />

          {/* 轨道内容 */}
          <div className={styles.tracksScrollArea} style={{ width: totalWidth }}>
            {/* 播放头 */}
            <Playhead
              playheadMs={localPlayhead}
              zoom={localZoom}
              scrollX={localScrollX}
              height={totalHeight + 32}
              onSeek={(ms) => { setLocalPlayhead(ms); onPlayheadChange?.(ms); }}
            />

            {/* 轨道列表 */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`${styles.trackRow} ${!track.visible ? styles.trackHidden : ''}`}
                style={{ height: track.height }}
              >
                {track.clips.map((clip) => (
                  <ClipRenderer
                    key={clip.id}
                    clip={clip}
                    track={track}
                    zoom={localZoom}
                    scrollX={localScrollX}
                    selectedClipId={selectedClipId}
                    onClipClick={handleClipClick}
                    onClipDoubleClick={handleClipDoubleClick}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 属性面板 */}
      {propertiesClip && (
        <ClipPropertiesPanel
          clip={propertiesClip}
          onUpdate={handleClipUpdate}
          onClose={() => setPropertiesClip(null)}
          onDelete={handleClipDelete}
        />
      )}
    </div>
  );
});
MultiTrackTimeline.displayName = 'MultiTrackTimeline';

// 格式化时间（内部使用，从 utils 导入会循环依赖）

export default MultiTrackTimeline;
