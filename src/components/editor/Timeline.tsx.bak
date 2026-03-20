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

// ==============================================
// Types - 类型定义
// ==============================================

// Track types
export type TrackType = 'video' | 'audio' | 'subtitle' | 'effect';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isMuted: boolean;
  isLocked: boolean;
  isVisible: boolean;
  volume?: number;
}

// Clip types
export interface Clip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  endTime: number;
  sourceStart: number;
  sourceEnd: number;
  duration: number;
  color: string;
  keyframes: Keyframe[];
  transitions: {
    in?: Transition;
    out?: Transition;
  };
  properties: ClipProperties;
}

export interface ClipProperties {
  scale: number;
  rotation: number;
  opacity: number;
  x: number;
  y: number;
}

export interface Keyframe {
  id: string;
  time: number;
  properties: {
    scale?: number;
    rotation?: number;
    opacity?: number;
    x?: number;
    y?: number;
  };
}

export interface Transition {
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

// Timeline props
interface TimelineProps {
  currentTime: number;
  duration: number;
  tracks: Track[];
  onTimeUpdate: (time: number) => void;
  onTrackUpdate?: (tracks: Track[]) => void;
  onClipSelect?: (clip: Clip | null) => void;
  onClipUpdate?: (clip: Clip) => void;
}

// ==============================================
// Constants - 常量
// ==============================================

const TRACK_COLORS: Record<TrackType, string> = {
  video: '#3b82f6',
  audio: '#10b981',
  subtitle: '#f59e0b',
  effect: '#ec4899'
};

const TRANSITION_TYPES = [
  { value: 'fade', label: '淡入淡出' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe', label: '擦除' },
  { value: 'slide', label: '滑动' }
];

// ==============================================
// Helper Functions - 辅助函数
// ==============================================

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatTimeRuler = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ==============================================
// Main Component - 主组件
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
  // Event Handlers - 事件处理
  // ==============================================

  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tracksContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + tracksContainerRef.current.scrollLeft;
      let time = x / scale;

      // Snap to clip edges if enabled
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
  }, [scale, duration, snapEnabled, onTimeUpdate]);

  // Get snap points
  const getSnapPoints = useCallback(() => {
    const points: number[] = [0, duration];
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        points.push(clip.startTime, clip.endTime);
      });
    });
    return [...new Set(points)];
  }, [tracks, duration]);

  // Handle playhead drag
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

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 20, 300));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 20, 40));
  const handleResetZoom = () => setScale(100);

  // Add track
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

  // Delete track
  const deleteTrack = useCallback((trackId: string) => {
    const newTracks = tracks.filter(t => t.id !== trackId);
    setTracks(newTracks);
    onTrackUpdate?.(newTracks);
  }, [tracks, onTrackUpdate]);

  // Toggle track mute
  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, isMuted: !track.isMuted } : track
    ));
  }, []);

  // Toggle track lock
  const toggleTrackLock = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, isLocked: !track.isLocked } : track
    ));
  }, []);

  // Toggle track visibility
  const toggleTrackVisibility = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, isVisible: !track.isVisible } : track
    ));
  }, []);

  // Add demo clip to track
  const addDemoClip = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const lastClipEnd = track.clips.length > 0
      ? Math.max(...track.clips.map(c => c.endTime))
      : 0;

    const newClip: Clip = {
      id: generateId(),
      trackId,
      name: `片段 ${track.clips.length + 1}`,
      startTime: lastClipEnd,
      endTime: lastClipEnd + 5,
      sourceStart: 0,
      sourceEnd: 5,
      duration: 5,
      color: TRACK_COLORS[track.type],
      keyframes: [],
      transitions: {},
      properties: {
        scale: 100,
        rotation: 0,
        opacity: 100,
        x: 0,
        y: 0
      }
    };

    const newTracks = tracks.map(t =>
      t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
    );
    setTracks(newTracks);
    onTrackUpdate?.(newTracks);
    setSelectedClipId(newClip.id);
    onClipSelect?.(newClip);
  }, [tracks, onTrackUpdate, onClipSelect]);

  // Handle clip selection
  const handleClipClick = useCallback((e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();
    setSelectedClipId(clip.id);
    onClipSelect?.(clip);
  }, [onClipSelect]);

  // Handle clip drag start
  const handleClipDragStart = useCallback((e: React.MouseEvent, clip: Clip) => {
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked) return;

    setDraggingClip({
      clipId: clip.id,
      startX: e.clientX,
      originalStart: clip.startTime
    });
  }, [tracks]);

  // Handle clip drag
  useEffect(() => {
    if (!draggingClip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - draggingClip.startX;
      const deltaTime = deltaX / scale;

      let newStart = draggingClip.originalStart + deltaTime;
      newStart = Math.max(0, newStart);

      // Snap to grid/clips if enabled
      if (snapEnabled) {
        const snapPoints = getSnapPoints().filter(p => p !== draggingClip.originalStart);
        const nearestSnap = snapPoints.reduce((prev, curr) =>
          Math.abs(curr - newStart) < Math.abs(prev - newStart) ? curr : prev
        , newStart);
        if (Math.abs(nearestSnap - newStart) < 0.2) {
          newStart = nearestSnap;
        }
      }

      const clipDuration = selectedClip?.duration || 5;
      newStart = Math.min(newStart, duration - clipDuration);

      setTracks(prev => prev.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === draggingClip.clipId
            ? { ...clip, startTime: newStart, endTime: newStart + clip.duration }
            : clip
        )
      })));
    };

    const handleMouseUp = () => {
      setDraggingClip(null);
      if (selectedClip) {
        onClipUpdate?.(selectedClip);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClip, scale, snapEnabled, duration, selectedClip, getSnapPoints, onClipUpdate]);

  // Handle clip resize start
  const handleClipResizeStart = useCallback((e: React.MouseEvent, clip: Clip, edge: 'left' | 'right') => {
    e.stopPropagation();
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked) return;

    setResizingClip({
      clipId: clip.id,
      edge,
      startX: e.clientX,
      originalStart: clip.startTime,
      originalEnd: clip.endTime
    });
  }, [tracks]);

  // Handle clip resize
  useEffect(() => {
    if (!resizingClip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizingClip.startX;
      const deltaTime = deltaX / scale;

      setTracks(prev => prev.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
          if (clip.id !== resizingClip.clipId) return clip;

          let newStart = resizingClip.originalStart;
          let newEnd = resizingClip.originalEnd;

          if (resizingClip.edge === 'left') {
            newStart = Math.max(0, resizingClip.originalStart + deltaTime);
            newStart = Math.min(newStart, clip.endTime - 0.5);
          } else {
            newEnd = Math.min(duration, resizingClip.originalEnd + deltaTime);
            newEnd = Math.max(newEnd, clip.startTime + 0.5);
          }

          return {
            ...clip,
            startTime: newStart,
            endTime: newEnd,
            duration: newEnd - newStart
          };
        })
      })));
    };

    const handleMouseUp = () => {
      setResizingClip(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingClip, scale, duration]);

  // Split clip at playhead
  const splitClipAtPlayhead = useCallback(() => {
    if (!selectedClipId || !selectedClip) return;

    const splitTime = currentTime;
    if (splitTime <= selectedClip.startTime || splitTime >= selectedClip.endTime) {
      notify.warning('播放头不在片段范围内');
      return;
    }

    const newClip: Clip = {
      ...selectedClip,
      id: generateId(),
      name: `${selectedClip.name} (2)`,
      startTime: splitTime,
      endTime: selectedClip.endTime,
      duration: selectedClip.endTime - splitTime,
      sourceStart: selectedClip.sourceStart + (splitTime - selectedClip.startTime),
      keyframes: selectedClip.keyframes.filter(k => k.time > splitTime - selectedClip.startTime)
    };

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === selectedClipId
          ? { ...clip, endTime: splitTime, duration: splitTime - clip.startTime }
          : clip
      ).concat(track.id === selectedClip.trackId ? [newClip] : [])
    })));

    notify.success('片段已拆分');
  }, [selectedClipId, selectedClip, currentTime]);

  // Copy clip
  const copyClip = useCallback(() => {
    if (!selectedClip) return;
    setCopiedClip({ ...selectedClip });
    notify.success('片段已复制');
  }, [selectedClip]);

  // Paste clip
  const pasteClip = useCallback(() => {
    if (!copiedClip) return;

    const newClip: Clip = {
      ...copiedClip,
      id: generateId(),
      name: `${copiedClip.name} (副本)`,
      startTime: currentTime,
      endTime: currentTime + copiedClip.duration
    };

    const track = tracks.find(t => t.id === copiedClip.trackId);
    if (!track) {
      notify.warning('没有对应的轨道类型');
      return;
    }

    setTracks(prev => prev.map(t =>
      t.id === track.id ? { ...t, clips: [...t.clips, newClip] } : t
    ));

    setSelectedClipId(newClip.id);
    notify.success('片段已粘贴');
  }, [copiedClip, currentTime, tracks]);

  // Delete selected clip
  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId) return;

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.filter(clip => clip.id !== selectedClipId)
    })));

    setSelectedClipId(null);
    onClipSelect?.(null);
    notify.success('片段已删除');
  }, [selectedClipId, onClipSelect]);

  // Add keyframe to selected clip
  const addKeyframe = useCallback(() => {
    if (!selectedClipId || !selectedClip) return;

    const keyframeTime = currentTime - selectedClip.startTime;
    const existingKeyframe = selectedClip.keyframes.find(k =>
      Math.abs(k.time - keyframeTime) < 0.1
    );

    if (existingKeyframe) {
      notify.warning('此处已有关键帧');
      return;
    }

    const newKeyframe: Keyframe = {
      id: generateId(),
      time: keyframeTime,
      properties: { ...selectedClip.properties }
    };

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === selectedClipId
          ? { ...clip, keyframes: [...clip.keyframes, newKeyframe].sort((a, b) => a.time - b.time) }
          : clip
      )
    })));

    setSelectedKeyframe(newKeyframe);
    notify.success('关键帧已添加');
  }, [selectedClipId, selectedClip, currentTime]);

  // Update keyframe properties
  const updateKeyframeProperty = useCallback((property: string, value: number) => {
    if (!selectedKeyframe || !selectedClip) return;

    const updatedKeyframe = {
      ...selectedKeyframe,
      properties: {
        ...selectedKeyframe.properties,
        [property]: value
      }
    };

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === selectedClip.id
          ? {
              ...clip,
              keyframes: clip.keyframes.map(k =>
                k.id === selectedKeyframe.id ? updatedKeyframe : k
              )
            }
          : clip
      )
    })));

    setSelectedKeyframe(updatedKeyframe);
  }, [selectedKeyframe, selectedClip]);

  // Update clip properties
  const updateClipProperties = useCallback((properties: Partial<ClipProperties>) => {
    if (!selectedClip) return;

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === selectedClip.id
          ? { ...clip, properties: { ...clip.properties, ...properties } }
          : clip
      )
    })));
  }, [selectedClip]);

  // Add transition to clip
  const addTransition = useCallback((type: Transition['type'], position: 'in' | 'out', duration: number = 1) => {
    if (!selectedClip) return;

    const transition: Transition = { type, duration };

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === selectedClip.id
          ? {
              ...clip,
              transitions: {
                ...clip.transitions,
                [position]: transition
              }
            }
          : clip
      )
    })));
  }, [selectedClip]);

  // ==============================================
  // Render Functions - 渲染函数
  // ==============================================

  // Render time ruler
  const renderTimeRuler = () => {
    const rulerMarks = [];
    const marksPerSecond = scale > 150 ? 2 : 1;
    const totalMarks = Math.ceil(duration * marksPerSecond);
    const markInterval = scale / marksPerSecond;

    for (let i = 0; i <= totalMarks; i++) {
      const isMainMark = i % marksPerSecond === 0;
      const time = i / marksPerSecond;

      rulerMarks.push(
        <div
          key={i}
          className={`${styles.rulerMark} ${isMainMark ? styles.mainMark : ''}`}
          style={{ left: `${i * markInterval}px` }}
        >
          {isMainMark && (
            <div className={styles.timeLabel}>{formatTimeRuler(time)}</div>
          )}
        </div>
      );
    }

    return <div className={styles.timeRuler}>{rulerMarks}</div>;
  };

  // Render waveform for audio track (simulated)
  const renderWaveform = () => {
    const bars = [];
    const barCount = 50;

    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 60 + 20;
      bars.push(
        <div
          key={i}
          className={styles.waveformBar}
          style={{ height: `${height}%` }}
        />
      );
    }

    return <div className={styles.waveform}>{bars}</div>;
  };

  // Render keyframe markers on clip
  const renderKeyframeMarkers = (clip: Clip) => {
    if (!showKeyframes || clip.keyframes.length === 0) return null;

    return clip.keyframes.map(keyframe => {
      const position = (keyframe.time / clip.duration) * 100;
      return (
        <div
          key={keyframe.id}
          className={styles.keyframeMarker}
          style={{ left: `${position}%` }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedKeyframe(keyframe);
            setShowKeyframePanel(true);
          }}
        />
      );
    });
  };

  // Render transition preview
  const renderTransitionPreview = (clip: Clip, position: 'in' | 'out') => {
    const transition = clip.transitions[position];
    if (!transition) return null;

    const width = (transition.duration / clip.duration) * 100;
    const isIn = position === 'in';

    return (
      <div
        className={`${styles.transitionPreview} ${styles[`transition${transition.type}`]}`}
        style={{
          [isIn ? 'left' : 'right']: 0,
          [isIn ? 'width' : 'width']: `${width}%`
        }}
      >
        <span className={styles.transitionIcon}>
          {transition.type === 'fade' && '◐'}
          {transition.type === 'dissolve' && '◑'}
          {transition.type === 'wipe' && '▶'}
          {transition.type === 'slide' && '⟹'}
        </span>
      </div>
    );
  };

  // Render clip
  const renderClip = (clip: Clip, track: Track) => {
    const isSelected = selectedClipId === clip.id;
    const left = clip.startTime * scale;
    const width = clip.duration * scale;

    return (
      <div
        key={clip.id}
        className={`${styles.clip} ${isSelected ? styles.selected : ''} ${track.isLocked ? styles.locked : ''}`}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          backgroundColor: clip.color || TRACK_COLORS[track.type]
        }}
        onClick={(e) => handleClipClick(e, clip)}
        onMouseDown={(e) => handleClipDragStart(e, clip)}
      >
        {/* Resize handles */}
        <div
          className={`${styles.resizeHandle} ${styles.left}`}
          onMouseDown={(e) => handleClipResizeStart(e, clip, 'left')}
        />
        <div
          className={`${styles.resizeHandle} ${styles.right}`}
          onMouseDown={(e) => handleClipResizeStart(e, clip, 'right')}
        />

        {/* Clip content */}
        <div className={styles.clipContent}>
          <div className={styles.clipName}>{clip.name}</div>
          {track.type === 'audio' && showWaveforms && renderWaveform()}
        </div>

        {/* Keyframe markers */}
        {renderKeyframeMarkers(clip)}

        {/* Transition previews */}
        {renderTransitionPreview(clip, 'in')}
        {renderTransitionPreview(clip, 'out')}

        {/* Lock indicator */}
        {track.isLocked && (
          <div className={styles.lockIndicator}>
            <LockOutlined />
          </div>
        )}
      </div>
    );
  };

  // Render track
  const renderTrack = (track: Track) => {
    return (
      <div
        key={track.id}
        className={`${styles.track} ${styles[track.type]} ${!track.isVisible ? styles.hidden : ''}`}
      >
        <div className={styles.trackHeader}>
          <div className={styles.trackInfo}>
            <div className={styles.trackName}>{track.name}</div>
            <div className={styles.trackType}>
              {track.type === 'video' && '视频'}
              {track.type === 'audio' && '音频'}
              {track.type === 'subtitle' && '字幕'}
              {track.type === 'effect' && '特效'}
            </div>
          </div>
          <div className={styles.trackActions}>
            <Tooltip title={track.isMuted ? '取消静音' : '静音'}>
              <Button
                type="text"
                size="small"
                className={track.isMuted ? styles.activeAction : ''}
                icon={track.isMuted ? <SoundOutlined /> : <SoundOutlined style={{ opacity: 0.5 }} />}
                onClick={() => toggleTrackMute(track.id)}
              />
            </Tooltip>
            <Tooltip title={track.isVisible ? '隐藏' : '显示'}>
              <Button
                type="text"
                size="small"
                className={!track.isVisible ? styles.activeAction : ''}
                icon={track.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={() => toggleTrackVisibility(track.id)}
              />
            </Tooltip>
            <Tooltip title={track.isLocked ? '解锁' : '锁定'}>
              <Button
                type="text"
                size="small"
                className={track.isLocked ? styles.activeAction : ''}
                icon={track.isLocked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => toggleTrackLock(track.id)}
              />
            </Tooltip>
            <Tooltip title="删除轨道">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => deleteTrack(track.id)}
              />
            </Tooltip>
          </div>
        </div>
        <div
          className={styles.trackContent}
          style={{ width: `${timelineWidth}px` }}
        >
          {track.clips.map(clip => renderClip(clip, track))}
        </div>
      </div>
    );
  };

  // Keyframe properties panel
  const renderKeyframePanel = () => {
    if (!showKeyframePanel || !selectedKeyframe) return null;

    return (
      <div className={styles.keyframePanel}>
        <div className={styles.panelHeader}>
          <span>关键帧属性</span>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              if (!selectedClip) return;
              setTracks(prev => prev.map(track => ({
                ...track,
                clips: track.clips.map(clip =>
                  clip.id === selectedClip.id
                    ? { ...clip, keyframes: clip.keyframes.filter(k => k.id !== selectedKeyframe.id) }
                    : clip
                )
              })));
              setSelectedKeyframe(null);
              setShowKeyframePanel(false);
            }}
          />
        </div>
        <div className={styles.panelContent}>
          <div className={styles.propertyRow}>
            <span>缩放</span>
            <Slider
              min={0}
              max={200}
              value={selectedKeyframe.properties.scale ?? 100}
              onChange={(v) => updateKeyframeProperty('scale', v)}
            />
            <InputNumber
              min={0}
              max={200}
              value={selectedKeyframe.properties.scale ?? 100}
              onChange={(v) => v && updateKeyframeProperty('scale', v)}
            />
          </div>
          <div className={styles.propertyRow}>
            <span>旋转</span>
            <Slider
              min={-180}
              max={180}
              value={selectedKeyframe.properties.rotation ?? 0}
              onChange={(v) => updateKeyframeProperty('rotation', v)}
            />
            <InputNumber
              min={-180}
              max={180}
              value={selectedKeyframe.properties.rotation ?? 0}
              onChange={(v) => v && updateKeyframeProperty('rotation', v)}
            />
          </div>
          <div className={styles.propertyRow}>
            <span>透明度</span>
            <Slider
              min={0}
              max={100}
              value={selectedKeyframe.properties.opacity ?? 100}
              onChange={(v) => updateKeyframeProperty('opacity', v)}
            />
            <InputNumber
              min={0}
              max={100}
              value={selectedKeyframe.properties.opacity ?? 100}
              onChange={(v) => v && updateKeyframeProperty('opacity', v)}
            />
          </div>
          <div className={styles.propertyRow}>
            <span>X位置</span>
            <Slider
              min={-500}
              max={500}
              value={selectedKeyframe.properties.x ?? 0}
              onChange={(v) => updateKeyframeProperty('x', v)}
            />
            <InputNumber
              min={-500}
              max={500}
              value={selectedKeyframe.properties.x ?? 0}
              onChange={(v) => v && updateKeyframeProperty('x', v)}
            />
          </div>
          <div className={styles.propertyRow}>
            <span>Y位置</span>
            <Slider
              min={-500}
              max={500}
              value={selectedKeyframe.properties.y ?? 0}
              onChange={(v) => updateKeyframeProperty('y', v)}
            />
            <InputNumber
              min={-500}
              max={500}
              value={selectedKeyframe.properties.y ?? 0}
              onChange={(v) => v && updateKeyframeProperty('y', v)}
            />
          </div>
        </div>
      </div>
    );
  };

  // Clip properties panel
  const renderClipPropertiesPanel = () => {
    if (!selectedClip) return null;

    return (
      <div className={styles.clipPropertiesPanel}>
        <div className={styles.panelHeader}>
          <span>片段属性</span>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.propertyRow}>
            <span>缩放</span>
            <Slider
              min={0}
              max={200}
              value={selectedClip.properties.scale}
              onChange={(v) => updateClipProperties({ scale: v })}
            />
            <InputNumber
              min={0}
              max={200}
              value={selectedClip.properties.scale}
              onChange={(v) => v && updateClipProperties({ scale: v })}
            />
          </div>
          <div className={styles.propertyRow}>
            <span>旋转</span>
            <Slider
              min={-180}
              max={180}
              value={selectedClip.properties.rotation}
              onChange={(v) => updateClipProperties({ rotation: v })}
            />
            <InputNumber
              min={-180}
              max={180}
              value={selectedClip.properties.rotation}
              onChange={(v) => v && updateClipProperties({ rotation: v })}
            />
          </div>
          <div className={styles.propertyRow}>
            <span>透明度</span>
            <Slider
              min={0}
              max={100}
              value={selectedClip.properties.opacity}
              onChange={(v) => updateClipProperties({ opacity: v })}
            />
            <InputNumber
              min={0}
              max={100}
              value={selectedClip.properties.opacity}
              onChange={(v) => v && updateClipProperties({ opacity: v })}
            />
          </div>

          <Divider style={{ margin: '12px 0' }}>转场效果</Divider>

          <div className={styles.transitionControls}>
            <div className={styles.transitionRow}>
              <span>入场</span>
              <Select
                placeholder="选择转场"
                style={{ width: 100 }}
                value={selectedClip.transitions.in?.type}
                onChange={(v) => addTransition(v, 'in', selectedClip.transitions.in?.duration || 1)}
                options={TRANSITION_TYPES}
                allowClear
              />
              <InputNumber
                min={0.1}
                max={3}
                step={0.1}
                value={selectedClip.transitions.in?.duration || 1}
                onChange={(v) => v && selectedClip.transitions.in && addTransition(selectedClip.transitions.in.type, 'in', v)}
              />
            </div>
            <div className={styles.transitionRow}>
              <span>退场</span>
              <Select
                placeholder="选择转场"
                style={{ width: 100 }}
                value={selectedClip.transitions.out?.type}
                onChange={(v) => addTransition(v, 'out', selectedClip.transitions.out?.duration || 1)}
                options={TRANSITION_TYPES}
                allowClear
              />
              <InputNumber
                min={0.1}
                max={3}
                step={0.1}
                value={selectedClip.transitions.out?.duration || 1}
                onChange={(v) => v && selectedClip.transitions.out && addTransition(selectedClip.transitions.out.type, 'out', v)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==============================================
  // Main Render - 主渲染
  // ==============================================

  return (
    <div className={styles.timelineContainer}>
      {/* Toolbar */}
      <div className={styles.timelineToolbar}>
        <div className={styles.timelineControls}>
          {/* Add track buttons */}
          <Dropdown
            menu={{
              items: [
                { key: 'video', label: '视频轨道', onClick: () => addTrack('video') },
                { key: 'audio', label: '音频轨道', onClick: () => addTrack('audio') },
                { key: 'subtitle', label: '字幕轨道', onClick: () => addTrack('subtitle') },
                { key: 'effect', label: '特效轨道', onClick: () => addTrack('effect') }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<PlusOutlined />}>
              添加轨道
            </Button>
          </Dropdown>

          <Divider type="vertical" />

          {/* Clip operations */}
          <Tooltip title="拆分片段">
            <Button
              type="text"
              icon={<ScissorOutlined />}
              onClick={splitClipAtPlayhead}
              disabled={!selectedClipId}
            />
          </Tooltip>
          <Tooltip title="复制片段">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={copyClip}
              disabled={!selectedClipId}
            />
          </Tooltip>
          <Tooltip title="粘贴片段">
            <Button
              type="text"
              icon={<SnippetsOutlined />}
              onClick={pasteClip}
              disabled={!copiedClip}
            />
          </Tooltip>
          <Tooltip title="删除片段">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={deleteSelectedClip}
              disabled={!selectedClipId}
            />
          </Tooltip>

          <Divider type="vertical" />

          {/* Keyframe controls */}
          <Tooltip title="添加关键帧">
            <Button
              type="text"
              icon={<AimOutlined />}
              onClick={addKeyframe}
              disabled={!selectedClipId}
            />
          </Tooltip>
          <Tooltip title={showKeyframes ? '隐藏关键帧' : '显示关键帧'}>
            <Button
              type="text"
              icon={<PartitionOutlined />}
              onClick={() => setShowKeyframes(!showKeyframes)}
              className={showKeyframes ? styles.activeAction : ''}
            />
          </Tooltip>

          <Divider type="vertical" />

          {/* Snap toggle */}
          <Tooltip title={snapEnabled ? '关闭吸附' : '开启吸附'}>
            <Button
              type="text"
              icon={snapEnabled ? <DragOutlined /> : <DragOutlined style={{ opacity: 0.5 }} />}
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={snapEnabled ? styles.activeAction : ''}
            >
              吸附
            </Button>
          </Tooltip>

          {/* Waveform toggle (for audio tracks) */}
          <Tooltip title={showWaveforms ? '隐藏波形' : '显示波形'}>
            <Button
              type="text"
              icon={<SoundOutlined />}
              onClick={() => setShowWaveforms(!showWaveforms)}
              className={showWaveforms ? styles.activeAction : ''}
            >
              波形
            </Button>
          </Tooltip>
        </div>

        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <Tooltip title="缩小">
            <Button
              type="text"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              disabled={scale <= 40}
            />
          </Tooltip>
          <Tooltip title="重置">
            <Button
              type="text"
              icon={<ColumnWidthOutlined />}
              onClick={handleResetZoom}
              disabled={scale === 100}
            />
          </Tooltip>
          <Tooltip title="放大">
            <Button
              type="text"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              disabled={scale >= 300}
            />
          </Tooltip>
          <div className={styles.scaleIndicator}>{scale}%</div>
        </div>
      </div>

      {/* Timeline content */}
      <div className={styles.timelineContent} ref={tracksContainerRef}>
        {/* Track headers */}
        <div className={styles.timelineFixed}>
          <div className={styles.timelineHeader}>
            <span className={styles.headerTitle}>轨道</span>
          </div>
          <div className={styles.trackHeaders}>
            {normalizedTracks.map(track => (
              <div key={track.id} className={styles.trackHeaderPlaceholder}>
                <div className={styles.addClipButton} onClick={() => addDemoClip(track.id)}>
                  <PlusOutlined /> 添加片段
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable area */}
        <div className={styles.timelineScrollable}>
          {/* Time ruler */}
          <div
            className={styles.timelineRulerContainer}
            style={{ width: `${timelineWidth}px` }}
          >
            {renderTimeRuler()}
          </div>

          {/* Tracks area */}
          <div
            className={styles.tracksArea}
            ref={timelineRef}
            onClick={(e) => {
              handleTimelineClick(e);
              setSelectedClipId(null);
              onClipSelect?.(null);
            }}
          >
            <div className={styles.tracksContainer}>
              {normalizedTracks.map(track => renderTrack(track))}
            </div>

            {/* Playhead */}
            <div
              className={styles.playhead}
              ref={playheadRef}
              style={{ left: `${playheadPosition}px` }}
              onMouseDown={handlePlayheadMouseDown}
            >
              <div className={styles.playheadHead} />
              <div className={styles.playheadLine} />
            </div>

            {/* Current time indicator */}
            <div
              className={styles.currentTimeIndicator}
              style={{ left: `${playheadPosition}px` }}
            >
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Properties panels */}
      {renderKeyframePanel()}
      {renderClipPropertiesPanel()}
    </div>
  );
};

export default Timeline;
