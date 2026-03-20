/**
 * Timeline 组件 - 模块化重构版
 * 
 * 重构自 src/components/editor/Timeline.tsx (1362 行)
 * 拆分为: types.ts, constants.ts, utils.ts
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Button,
  Space,
  Tooltip,
  Dropdown,
  Slider,
  Divider,
  Input,
  Popover,
  Switch,
  Select,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ColumnWidthOutlined,
  SettingOutlined,
  DoubleRightOutlined,
  ScissorOutlined,
  CopyOutlined,
  SnippetsOutlined,
  PartitionOutlined,
  AimOutlined,
  SoundOutlined,
  FontSizeOutlined,
  ThunderboltOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FullscreenOutlined,
  CompressOutlined
} from '@ant-design/icons';
import styles from './Timeline.module.less';
import { notify } from '@/shared';

// Types, Constants, Utils
import type { TimelineProps, Track, Clip, TrackType, Keyframe } from './types';
import { TRACK_COLORS, TRANSITION_TYPES } from './constants';
import { generateId, formatTime } from './utils';

// ==============================================
// Re-export types for external use
// ==============================================
export type { TrackType, Track, Clip, Keyframe } from './types';
export type { TimelineProps } from './types';

// ==============================================
// Main Component
// ==============================================

const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  tracks: initialTracks,
  onTimeUpdate,
  onTrackUpdate,
  onClipSelect,
  onClipUpdate
}) => {
  // State
  const [tracks, setTracks] = useState<Track[]>(initialTracks || []);
  const [scale, setScale] = useState(100);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [showKeyframes, setShowKeyframes] = useState(true);
  const [copiedClip, setCopiedClip] = useState<Clip | null>(null);
  const [draggingClip, setDraggingClip] = useState<{ clipId: string; startX: number; originalStart: number } | null>(null);
  const [resizingClip, setResizingClip] = useState<{ clipId: string; edge: 'left' | 'right'; startX: number; originalStart: number; originalEnd: number } | null>(null);
  const [showKeyframePanel, setShowKeyframePanel] = useState(false);
  const [selectedKeyframe, setSelectedKeyframe] = useState<Keyframe | null>(null);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Computed
  const timelineWidth = Math.max(2000, duration * scale);
  const playheadPosition = currentTime * scale;

  // Normalize tracks to ensure all required properties exist
  const normalizedTracks = useMemo(() => {
    return (tracks || []).map(track => ({
      id: track.id,
      name: track.name,
      type: track.type as TrackType,
      clips: (track.clips || []).map(clip => ({
        id: clip.id || '',
        trackId: clip.trackId || track.id,
        name: clip.name || '未命名片段',
        startTime: clip.startTime || 0,
        endTime: clip.endTime || 0,
        sourceStart: clip.sourceStart || 0,
        sourceEnd: clip.sourceEnd || 0,
        duration: clip.duration || 0,
        color: clip.color || TRACK_COLORS[track.type as TrackType] || '#3b82f6',
        keyframes: clip.keyframes || [],
        transitions: clip.transitions || {},
        properties: clip.properties || {
          scale: 100,
          rotation: 0,
          opacity: 100,
          x: 0,
          y: 0
        }
      })),
      isMuted: track.isMuted ?? false,
      isLocked: track.isLocked ?? false,
      isVisible: track.isVisible ?? true,
      volume: track.volume ?? 100
    }));
  }, [tracks]);

  // Get selected clip
  const selectedClip = useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of normalizedTracks) {
      const clip = track.clips.find(c => c.id === selectedClipId);
      if (clip) return clip;
    }
    return null;
  }, [selectedClipId, normalizedTracks]);

  // Update tracks when initial tracks change
  useEffect(() => {
    if (initialTracks) {
      setTracks(initialTracks);
    }
  }, [initialTracks]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (playheadRef.current && tracksContainerRef.current) {
      playheadRef.current.style.left = `${playheadPosition}px`;

      const container = tracksContainerRef.current;
      const playheadX = playheadPosition;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      if (playheadX < scrollLeft || playheadX > scrollLeft + containerWidth - 50) {
        container.scrollLeft = playheadX - containerWidth / 2;
      }
    }
  }, [playheadPosition]);

  // ==============================================
  // Event Handlers
  // ==============================================

  // Define getSnapPoints first so it can be used by handleTimelineClick
  const getSnapPoints = useCallback(() => {
    const points: number[] = [0, duration];
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        points.push(clip.startTime, clip.endTime);
      });
    });
    return [...new Set(points)];
  }, [tracks, duration]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tracksContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + tracksContainerRef.current.scrollLeft;
      let time = x / scale;

      if (snapEnabled) {
        const snapPoints = getSnapPoints();
        const nearestSnap = snapPoints.reduce((prev, curr) =>
          Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev
        , time);
        if (Math.abs(nearestSnap - time) < 0.1) {
          time = nearestSnap;
        }
      }

      if (time >= 0 && time <= duration) {
        onTimeUpdate(time);
      }
    }
  }, [scale, duration, snapEnabled, onTimeUpdate, getSnapPoints]);

  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && tracksContainerRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + tracksContainerRef.current.scrollLeft;
        const time = Math.max(0, Math.min(duration, x / scale));
        onTimeUpdate(time);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [scale, duration, onTimeUpdate]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 20, 300));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 20, 40));
  const handleResetZoom = () => setScale(100);

  const addTrack = useCallback((type: TrackType) => {
    const typeCount = tracks.filter(t => t.type === type).length + 1;
    const typeNames: Record<TrackType, string> = {
      video: '视频',
      audio: '音频',
      subtitle: '字幕',
      effect: '特效'
    };

    const newTrack: Track = {
      id: generateId(),
      name: `${typeNames[type]}轨道 ${typeCount}`,
      type,
      clips: [],
      isMuted: false,
      isLocked: false,
      isVisible: true,
      volume: 100
    };

    const newTracks = [...tracks, newTrack];
    setTracks(newTracks);
    onTrackUpdate?.(newTracks);
  }, [tracks, onTrackUpdate]);

  // ==============================================
  // Render Helpers
  // ==============================================

  const renderTimeRuler = () => {
    const intervals = Math.ceil(duration / 10);
    const marks = [];
    
    for (let i = 0; i <= intervals; i++) {
      const time = i * 10;
      if (time <= duration) {
        marks.push(
          <div
            key={i}
            className={styles.timeMark}
            style={{ left: `${time * scale}px` }}
          >
            <span className={styles.timeLabel}>{formatTime(time)}</span>
          </div>
        );
      }
    }

    return marks;
  };

  const renderTrack = (track: typeof normalizedTracks[0], index: number) => {
    const trackColor = TRACK_COLORS[track.type];

    return (
      <div key={track.id} className={styles.track}>
        <div className={styles.trackHeader}>
          <div className={styles.trackInfo}>
            <div 
              className={styles.trackColorIndicator} 
              style={{ backgroundColor: trackColor }}
            />
            <span className={styles.trackName}>{track.name}</span>
          </div>
          <div className={styles.trackActions}>
            <Tooltip title={track.isMuted ? '取消静音' : '静音'}>
              <Button
                type="text"
                size="small"
                icon={track.isMuted ? <SoundOutlined /> : <SoundOutlined />}
                onClick={() => {
                  const newTracks = [...tracks];
                  newTracks[index].isMuted = !newTracks[index].isMuted;
                  setTracks(newTracks);
                  onTrackUpdate?.(newTracks);
                }}
              />
            </Tooltip>
            <Tooltip title={track.isLocked ? '解锁' : '锁定'}>
              <Button
                type="text"
                size="small"
                icon={track.isLocked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => {
                  const newTracks = [...tracks];
                  newTracks[index].isLocked = !newTracks[index].isLocked;
                  setTracks(newTracks);
                  onTrackUpdate?.(newTracks);
                }}
              />
            </Tooltip>
            <Tooltip title={track.isVisible ? '隐藏' : '显示'}>
              <Button
                type="text"
                size="small"
                icon={track.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={() => {
                  const newTracks = [...tracks];
                  newTracks[index].isVisible = !newTracks[index].isVisible;
                  setTracks(newTracks);
                  onTrackUpdate?.(newTracks);
                }}
              />
            </Tooltip>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const newTracks = tracks.filter(t => t.id !== track.id);
                setTracks(newTracks);
                onTrackUpdate?.(newTracks);
              }}
            />
          </div>
        </div>
        <div className={styles.trackContent}>
          {track.clips.map(clip => (
            <div
              key={clip.id}
              className={styles.clip}
              style={{
                left: `${clip.startTime * scale}px`,
                width: `${(clip.endTime - clip.startTime) * scale}px`,
                backgroundColor: clip.color
              }}
              onClick={() => {
                setSelectedClipId(clip.id);
                onClipSelect?.(clip);
              }}
            >
              <div className={styles.clipContent}>
                <span className={styles.clipName}>{clip.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==============================================
  // Main Render
  // ==============================================

  return (
    <div className={styles.timelineContainer} ref={timelineRef}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => addTrack('video')}>
            添加视频轨道
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => addTrack('audio')}>
            添加音频轨道
          </Button>
          <Dropdown menu={{
            items: TRANSITION_TYPES.map(t => ({
              key: t.value,
              label: t.label,
              onClick: () => {
                if (selectedClip) {
                  const updatedClip = { ...selectedClip };
                  updatedClip.transitions.out = { type: t.value as any, duration: 0.5 };
                  onClipUpdate?.(updatedClip);
                }
              }
            }))
          }}>
            <Button icon={<PartitionOutlined />}>添加转场</Button>
          </Dropdown>
        </Space>

        <Space>
          <Button icon={<AimOutlined />} onClick={handleResetZoom} title="重置缩放" />
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          <span style={{ width: 100 }}>
            <Slider 
              value={scale} 
              min={40} 
              max={300} 
              onChange={setScale}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </span>
          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
        </Space>

        <Space>
          <Switch 
            checkedChildren="吸附" 
            unCheckedChildren="吸附" 
            checked={snapEnabled} 
            onChange={setSnapEnabled}
            size="small"
          />
        </Space>
      </div>

      {/* Time Ruler */}
      <div className={styles.timeRuler}>
        {renderTimeRuler()}
      </div>

      {/* Tracks Container */}
      <div 
        className={styles.tracksContainer} 
        ref={tracksContainerRef}
        onClick={handleTimelineClick}
      >
        <div className={styles.tracksContent} style={{ width: `${timelineWidth}px` }}>
          {/* Playhead */}
          <div 
            ref={playheadRef}
            className={styles.playhead}
            onMouseDown={handlePlayheadMouseDown}
          />

          {/* Tracks */}
          {normalizedTracks.map((track, index) => renderTrack(track, index))}
        </div>
      </div>

      {/* Current Time Display */}
      <div className={styles.timeDisplay}>
        <span className={styles.currentTime}>{formatTime(currentTime)}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.totalTime}>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default Timeline;
