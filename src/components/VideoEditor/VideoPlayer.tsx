import React, { useRef, useEffect, useCallback, memo } from 'react';
import { Button, Slider, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import styles from './VideoEditor.module.less';

const { Text } = Typography;

interface VideoPlayerProps {
  videoPath: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoPath,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 监听视频元数据加载
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      onDurationChange(video.duration);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    if (video.readyState >= 2) {
      onDurationChange(video.duration);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onDurationChange]);

  // 监听播放时间更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onTimeUpdate]);

  // 控制播放/暂停
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    onPlayStateChange(!isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // 跳转到指定时间
  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    onTimeUpdate(time);
  }, [onTimeUpdate]);

  // 格式化时间
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <>
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          src={`file://${videoPath}`}
          onEnded={() => onPlayStateChange(false)}
          preload="metadata"
          className={styles.videoPlayer}
        />
      </div>

      <div className={styles.controlsContainer}>
        <Button
          type="text"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={togglePlay}
          size="large"
        />

        <Text>{formatTime(currentTime)}</Text>

        <div className={styles.sliderContainer}>
          <Slider
            min={0}
            max={duration}
            value={currentTime}
            onChange={seekTo}
            step={0.1}
            tooltip={{ formatter: value => formatTime(value || 0) }}
          />
        </div>

        <Text>{formatTime(duration)}</Text>
      </div>
    </>
  );
};

export default memo(VideoPlayer);
