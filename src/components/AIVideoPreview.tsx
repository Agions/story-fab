/**
 * 视频预览区 + 时间轴
 * 简化的 AI 剪辑专用时间轴
 */
import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Upload as UploadIcon,
  CloudUpload,
  Trash2,
} from 'lucide-react';
import { useStoryFab } from '@/components/StoryFab/context';
import type { VideoInfo } from '@/core/types';
import type { CutPoint, ClipSuggestion } from '@/core/interfaces';
import { notify, formatTime } from '@/shared';
import styles from '@/components/AIVideoPreview.module.less';

// Re-expose compat aliases for consumers that reference them by that name
export type ClipSuggestionCompat = ClipSuggestion;
export type CutPointCompat = CutPoint;

export interface ClipResultCompat {
  suggestions: ClipSuggestionCompat[];
  cutPoints: CutPointCompat[];
  segments: Array<{ id: string }>;
}

const Text = ({
  children,
  type,
  strong,
  style,
  title,
  className,
}: {
  children: React.ReactNode;
  type?: string;
  strong?: boolean;
  style?: React.CSSProperties;
  title?: string;
  className?: string;
}) => {
  const classNames =
    [className, type === 'secondary' ? 'text-muted-foreground' : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return strong ? (
    <strong className={classNames} style={style} title={title}>
      {children}
    </strong>
  ) : (
    <span className={classNames} style={style} title={title}>
      {children}
    </span>
  );
};

const AIVideoPreviewComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, setVideo, setPlaying, setCurrentTime, dispatch } = useStoryFab();
  const { isPlaying, currentTime, duration, currentVideo, analysis } = state;

  const [isDragging, setIsDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // 跟踪最新 isPlaying，避免键盘监听器因播放状态变化而重绑定
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const clipResult = useMemo<ClipResultCompat>(() => {
    const scenes = analysis?.scenes || [];
    return {
      segments: scenes.map(scene => ({ id: scene.id })),
      cutPoints: scenes.map((scene, index) => ({
        id: scene.id || `scene-${index}`,
        timestamp: scene.startTime,
        type: 'scene' as const,
        description: scene.description || `场景 ${index + 1}`,
        confidence: scene.confidence ?? 0.8,
      })),
      suggestions: scenes.slice(0, 5).map((scene, index) => ({
        id: scene.id || `suggestion-${index}`,
        description: scene.description || `建议保留 ${formatTime(scene.startTime)} 的关键片段`,
        confidence: Number(scene.confidence ?? 0.8),
        startTime: scene.startTime,
        endTime: scene.endTime,
        type: 'trim' as const,
        reason: 'AI scene analysis',
        autoApplicable: false,
      }))
    };
  }, [analysis]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      dispatch({ type: 'SET_DURATION', payload: videoRef.current.duration });
    }
  }, [dispatch]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current || !currentVideo) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!isPlaying);
  }, [isPlaying, currentVideo, setPlaying]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [setCurrentTime]);

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      seekTo(newTime);
    }
  }, [duration, seekTo]);

  const handleProgressChange = useCallback((value: number | readonly number[]) => {
    const resolvedValue = Array.isArray(value) ? value[0] : value;
    seekTo(resolvedValue);
  }, [seekTo]);

  const handleUploadFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      notify.error(null, '请上传视频文件');
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      notify.error(null, '视频文件不能超过 500MB');
      return false;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    const videoInfo: VideoInfo = {
      id: `video-${Date.now()}`,
      path: url,
      name: file.name,
      duration: 0,
      width: 0,
      height: 0,
      fps: 30,
      format: file.type.split('/')[1] || 'mp4',
      size: file.size,
      createdAt: new Date().toISOString(),
    };
    setVideo(videoInfo);
    notify.success(`已加载视频: ${file.name}`);
    return false;
  }, [setVideo]);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current && currentVideo) {
      const videoInfo: VideoInfo = {
        ...currentVideo,
        duration: videoRef.current.duration,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      setVideo(videoInfo);
    }
  }, [currentVideo, setVideo]);

  const handleClearVideo = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideo(null);
    setCurrentTime(0);
    setPlaying(false);
  }, [videoUrl, setVideo, setCurrentTime, setPlaying]);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentVideo) return;
      const videoEl = videoRef.current;
      if (!videoEl) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlayingRef.current) {
            videoEl.pause();
          } else {
            videoEl.play();
          }
          setPlaying(!isPlayingRef.current);
          break;
        case 'ArrowLeft':
          videoEl.currentTime = Math.max(0, videoEl.currentTime - 5);
          setCurrentTime(videoEl.currentTime);
          break;
        case 'ArrowRight':
          videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 5);
          setCurrentTime(videoEl.currentTime);
          break;
        case 'Home':
          videoEl.currentTime = 0;
          setCurrentTime(0);
          break;
        case 'End':
          videoEl.currentTime = videoEl.duration;
          setCurrentTime(videoEl.duration);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 键盘处理仅需 currentVideo，setCurrentTime/setPlaying 稳定由 context 管理
  }, [currentVideo]);

  // 提取的建议列表渲染（useCallback 避免每次重渲染）
  const renderAISuggestions = useCallback(() => {
    if (!currentVideo) {
      return (
        <div className={styles.suggestionsList}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            暂无 AI 建议，请先上传视频
          </Text>
        </div>
      );
    }
    if (clipResult.suggestions.length > 0) {
      return (
        <div className={styles.suggestionsList}>
          {clipResult.suggestions.slice(0, 5).map((suggestion, index) => (
            <div key={suggestion.id} className={styles.suggestionItem}>
              <Text style={{ fontSize: 12 }}>
                {index + 1}. {suggestion.description}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                置信度: {Math.round(suggestion.confidence * 100)}%
              </Text>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className={styles.suggestionsList}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          点击左侧 AI 功能开始智能分析
        </Text>
      </div>
    );
  }, [currentVideo, clipResult.suggestions]);

  // 文件上传触发（提取避免内联创建 input）
  const triggerFileInput = useCallback(() => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) void handleUploadFile(file);
    };
    input.click();
  }, [handleUploadFile]);

  // 拖拽处理器
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleUploadFile(file);
  }, [handleUploadFile]);

  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        <div className={styles.videoArea}>
          {currentVideo ? (
            <video
              ref={videoRef}
              src={videoUrl || currentVideo.path}
              className={styles.video}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onLoadedData={handleVideoLoaded}
              onEnded={() => setPlaying(false)}
              onClick={togglePlay}
            />
          ) : (
            <div 
              className={`${styles.placeholder} ${isDragging ? styles.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
            >
              <UploadIcon className={styles.uploadIcon} />
              <Text>拖拽视频文件到此处或点击上传</Text>
              <Button
                variant="link"
                onClick={triggerFileInput}
              >
                <CloudUpload className="mr-1" size={14} />
                选择文件
              </Button>
            </div>
          )}
          
          {currentVideo && (
            <div className={styles.videoControls}>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={() => skip(-5)}>
                  <SkipBack size={14} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={togglePlay} className={styles.playBtn}>
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => skip(5)}>
                  <SkipForward size={14} />
                </Button>
              </div>
              
              <div className={styles.progress}>
                <Text type="secondary" style={{ fontSize: 12, minWidth: 45 }}>
                  {formatTime(currentTime)}
                </Text>
                <Slider
                  value={currentTime}
                  min={0}
                  max={duration || 100}
                  onValueChange={handleProgressChange}
                  style={{ width: '80%', margin: '0 12px' }}
                />
                <Text type="secondary" style={{ fontSize: 12, minWidth: 45 }}>
                  {formatTime(duration)}
                </Text>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" title="全屏">
                  <Maximize2 size={14} />
                </Button>
                {currentVideo && (
                  <Button variant="ghost" size="icon-sm" title="清除视频" onClick={handleClearVideo}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <Text strong style={{ color: '#ccc' }}>时间轴</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {currentVideo 
              ? `已加载 ${clipResult.segments.length} 个片段`
              : '已加载 0 个片段'}
          </Text>
        </div>
        
        <div className={styles.timelineContent}>
          {currentVideo ? (
            <div className={styles.timelineTracks}>
              <div className={styles.track}>
                <Text type="secondary" style={{ fontSize: 11 }}>视频</Text>
                <div className={styles.trackBar}>
                  <div className={styles.clipSegment} style={{ width: '100%' }}>
                    <Text style={{ fontSize: 10, color: '#666' }}>{currentVideo.name}</Text>
                  </div>
                </div>
              </div>
              
              {clipResult.cutPoints.length > 0 && (
                <div className={styles.track}>
                  <Text type="secondary" style={{ fontSize: 11 }}>AI 剪辑点</Text>
                  <div className={styles.trackBar}>
                    {clipResult.cutPoints.slice(0, 10).map((point) => (
                      <div
                        key={point.id}
                        className={styles.cutPoint}
                        style={{ 
                          left: `${(point.timestamp / (duration || 1)) * 100}%`,
                          backgroundColor: point.type === 'scene' ? '#1890ff' : 
                            point.type === 'silence' ? '#ff4d4f' : '#52c41a'
                        }}
                        title={`${point.type}: ${point.description}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.playhead} style={{ left: `${(currentTime / (duration || 1)) * 100}%` }} />
            </div>
          ) : (
            <div className={styles.emptyTimeline}>
              <Text type="secondary">添加视频后将在此处显示时间轴</Text>
            </div>
          )}
        </div>
        
        <div className={styles.aiSuggestions}>
          <Text strong style={{ color: '#1890ff' }}>🤖 AI 剪辑建议</Text>
          {renderAISuggestions()}
        </div>
      </div>
    </div>
  );
};

export default memo(AIVideoPreviewComponent);
