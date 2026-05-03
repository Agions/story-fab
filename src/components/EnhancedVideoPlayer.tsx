import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { logger } from '../shared/utils/logging';
import { formatDuration } from '../shared/utils/formatting';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Settings,
  Maximize,
  Minimize,
  Camera,
  Rewind,
  FastForward,
} from 'lucide-react';
import styles from '@/components/EnhancedVideoPlayer.module.less';

interface EnhancedVideoPlayerProps {
  src: string;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  showControls?: boolean;
  allowFrameControl?: boolean;
  allowSpeedControl?: boolean;
  className?: string;
}

/**
 * 增强版视频播放器组件，提供帧级控制、速度调整、截图等高级功能
 */
const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  src,
  initialTime = 0,
  onTimeUpdate,
  onDurationChange,
  width = '100%',
  height = 'auto',
  autoPlay = false,
  showControls = true,
  allowFrameControl = true,
  allowSpeedControl = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [frameRate, setFrameRate] = useState(24);
  const [videoMetadata, setVideoMetadata] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
  }>({ width: 0, height: 0, aspectRatio: '16:9' });

  // 初始化播放器
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = initialTime;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (onDurationChange) {
        onDurationChange(video.duration);
      }

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const aspectRatio = `${videoWidth}:${videoHeight}`;
      setVideoMetadata({
        width: videoWidth,
        height: videoHeight,
        aspectRatio: aspectRatio
      });

      estimateFrameRate(video);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    if (autoPlay) {
      video.play().catch(_err => {
        logger.warn('自动播放失败，可能是浏览器策略限制');
      });
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src, initialTime, onTimeUpdate, onDurationChange, autoPlay]);

  const estimateFrameRate = (_video: HTMLVideoElement) => {
    setFrameRate(24);
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(_err => {
        logger.error('播放失败');
      });
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number | readonly number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Array.isArray(value) ? value[0] : value;

    video.currentTime = val;
    setCurrentTime(val);

    if (onTimeUpdate) {
      onTimeUpdate(val);
    }
  }, [onTimeUpdate]);

  const handleVolumeChange = useCallback((value: number | readonly number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Array.isArray(value) ? value[0] : value;

    setVolume(val);

    if (val === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    video.muted = newMutedState;
  }, [isMuted]);

  const handleRateChange = useCallback((value: number | readonly number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Array.isArray(value) ? value[0] : value;

    setPlaybackRate(val);
    video.playbackRate = val;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(_err => logger.error('全屏失败'));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(_err => logger.error('退出全屏失败'));
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const stepForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);

    const frameDuration = 1 / frameRate;
    video.currentTime = Math.min(video.duration, video.currentTime + frameDuration);
  }, [frameRate]);

  const stepBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);

    const frameDuration = 1 / frameRate;
    video.currentTime = Math.max(0, video.currentTime - frameDuration);
  }, [frameRate]);

  const fastForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 5);
  }, []);

  const fastBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 5);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const dataURL = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `frame_${Math.floor(video.currentTime)}.png`;
      link.click();
    } catch (e) {
      logger.error('截图失败');
    }
  }, []);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const playbackRates = [0.5, 1, 1.5, 2];

  return (
    <div
      className={`${styles.playerContainer} ${className}`}
      ref={containerRef}
      style={{ width, height }}
    >
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          src={src}
          className={styles.video}
          onClick={togglePlay}
          preload="metadata"
        />

        {/* 中央播放/暂停按钮 */}
        <div
          className={`${styles.centerPlayButton} ${isPlaying ? styles.playing : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? <Pause size={48} /> : <Play size={48} />}
        </div>

        {/* 控制面板 */}
        {showControls && (
          <div className={styles.controls}>
            <div className={styles.progressBar}>
              <Slider
                value={currentTime}
                min={0}
                max={duration}
                step={0.01}
                onValueChange={handleSeek}
              />
            </div>

            <div className={styles.controlButtons}>
              <div className={styles.leftControls}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={togglePlay}
                  className={styles.controlButton}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>

                <div
                  className={styles.volumeControl}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleMute}
                    className={styles.controlButton}
                  >
                    <VolumeIcon size={18} />
                  </Button>
                  {showVolumeSlider && (
                    <div className={styles.volumeSlider}>
                      <Slider
                        className="vertical-slider"
                        value={isMuted ? 0 : volume}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                      />
                    </div>
                  )}
                </div>

                <span className={styles.timeDisplay}>
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

              <div className={styles.rightControls}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  className={styles.controlButton}
                >
                  <Settings size={18} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleFullscreen}
                  className={styles.controlButton}
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </Button>
              </div>
            </div>

            {/* 高级控制面板 */}
            {showAdvancedControls && (
              <div className={styles.advancedControls}>
                <div className="grid grid-cols-2 gap-4">
                  {allowFrameControl && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">帧控制</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={stepBackward}>
                          <SkipBack size={14} className="mr-1" />
                          上一帧
                        </Button>
                        <Button variant="outline" size="sm" onClick={fastBackward}>
                          <Rewind size={14} className="mr-1" />
                          -5秒
                        </Button>
                        <Button variant="outline" size="sm" onClick={fastForward}>
                          <FastForward size={14} className="mr-1" />
                          +5秒
                        </Button>
                        <Button variant="outline" size="sm" onClick={stepForward}>
                          <SkipForward size={14} className="mr-1" />
                          下一帧
                        </Button>
                        <Button variant="outline" size="sm" onClick={captureFrame}>
                          <Camera size={14} className="mr-1" />
                          截图
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {allowSpeedControl && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">速度控制</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-1">
                          {playbackRates.map(rate => (
                            <button
                              key={rate}
                              onClick={() => handleRateChange(rate)}
                              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                playbackRate === rate
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-accent hover:bg-accent/80 text-foreground'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <Slider
                            min={0.25}
                            max={2}
                            step={0.05}
                            value={playbackRate}
                            onValueChange={handleRateChange}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min={0.25}
                            max={2}
                            step={0.05}
                            value={playbackRate}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0.25 && val <= 2) {
                                handleRateChange(val);
                              }
                            }}
                            className="w-16"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">视频信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">分辨率</span>
                          <span className="text-sm font-medium">{videoMetadata.width}x{videoMetadata.height}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">宽高比</span>
                          <span className="text-sm font-medium">{videoMetadata.aspectRatio}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">时长</span>
                          <span className="text-sm font-medium">{formatDuration(duration)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EnhancedVideoPlayer);
