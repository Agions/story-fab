import { logger } from '@/utils/logger';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Space, Card, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { analyzeVideo, VideoMetadata, formatDuration, formatResolution } from '@/services/videoService';
import { notify } from '@/shared';
import styles from './VideoSelector.module.less';

interface VideoSelectorProps {
  initialVideoPath?: string;
  onVideoSelect: (filePath: string, metadata?: VideoMetadata) => void;
  onVideoRemove?: () => void;
  loading?: boolean;
}

// 检测是否在 Tauri 环境中
const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// 支持的视频格式
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];

/**
 * 视频选择器组件
 * 支持点击选择、拖拽上传，同时支持桌面端 (Tauri) 和 Web 端
 */
const VideoSelector: React.FC<VideoSelectorProps> = ({
  initialVideoPath,
  onVideoSelect,
  onVideoRemove,
  loading = false
}) => {
  const [videoPath, setVideoPath] = useState<string | null>(initialVideoPath || null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // 组件卸载时清理 blob URL
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // 获取文件名（兼容 Web 和 Tauri 环境）
  const getFileName = useCallback((path: string | null): string => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http')) {
      return '视频文件';
    }
    return path.split('/').pop() || path;
  }, []);

  // 处理视频文件（通用逻辑）
  const processVideoFile = useCallback(async (fileOrPath: string, file?: File) => {
    const isTauriEnv = isTauri();

    if (isTauriEnv) {
      // Tauri: fileOrPath 是真实路径
      const filePath = fileOrPath;
      setVideoPath(filePath);
      setVideoSrc(convertFileSrc(filePath));

      setIsAnalyzing(true);
      try {
        const videoMetadata = await analyzeVideo(filePath);
        setMetadata(videoMetadata);
        onVideoSelect(filePath, videoMetadata);
      } catch (error) {
        logger.error('分析视频失败:', { error });
        onVideoSelect(filePath);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // Web: fileOrPath 是 blob URL，file 是原始 File 对象
      const blobUrl = fileOrPath;
      setVideoPath(file?.name || '视频文件');
      setVideoSrc(blobUrl);
      blobUrlRef.current = blobUrl; // 跟踪 blob URL 以便清理

      setIsAnalyzing(true);
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const webMetadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30,
          codec: file?.type || 'unknown',
          bitrate: video.duration > 0 && file ? Math.round((file.size * 8) / video.duration) : 0,
        };
        setMetadata(webMetadata);
        onVideoSelect(blobUrl, webMetadata);
        setIsAnalyzing(false);
      };

      video.onerror = () => {
        notify.error(null, '无法读取视频文件');
        setIsAnalyzing(false);
      };

      video.src = blobUrl;
    }
  }, [onVideoSelect]);

  // Tauri 选择视频
  const handleSelectVideoTauri = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: '视频文件',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm']
        }]
      });

      if (!selected || Array.isArray(selected)) return;

      await processVideoFile(selected as string);
    } catch (error) {
      logger.error('选择视频失败:', { error });
      notify.error(error, '选择视频失败，请重试');
    }
  };

  // Web 文件选择
  const handleSelectVideoWeb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  // 处理文件（验证 + 触发）
  const handleFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      notify.error(null, `不支持的视频格式: ${ext}，请选择 ${VIDEO_EXTENSIONS.join(', ')} 格式`);
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    processVideoFile(blobUrl, file);
  };

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isTauri()) {
      // Tauri 环境下优先用对话框
      handleSelectVideoTauri();
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  // 选择视频（自动判断环境）
  const handleSelectVideo = () => {
    if (isTauri()) {
      handleSelectVideoTauri();
    } else {
      fileInputRef.current?.click();
    }
  };

  // 移除视频
  const handleRemoveVideo = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setVideoPath(null);
    setVideoSrc(null);
    setMetadata(null);
    onVideoRemove?.();
  };

  // 在默认播放器中打开
  const handlePlayVideo = async () => {
    if (!videoPath) return;

    if (isTauri()) {
      try {
        await invoke('open_file', { path: videoPath });
      } catch (error) {
        logger.error('打开视频失败:', { error });
        notify.error(error, '无法打开视频，请确保系统有关联的视频播放器');
      }
    } else {
      // Web: 在新标签页打开
      if (videoSrc) {
        window.open(videoSrc, '_blank');
      }
    }
  };

  return (
    <div className={styles.videoSelector}>
      {/* 隐藏的文件输入 - 仅 Web 端使用 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={VIDEO_EXTENSIONS.join(',')}
        style={{ display: 'none' }}
        onChange={handleSelectVideoWeb}
      />

      <Spin spinning={loading || isAnalyzing} tip={isAnalyzing ? "分析视频中..." : "加载中..."}>
        {!videoPath ? (
          <div
            className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
            onClick={handleSelectVideo}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadOutlined className={styles.uploadIcon} />
            <p>点击选择视频文件</p>
            <p className={styles.uploadTip}>
              支持 {VIDEO_EXTENSIONS.map(e => e.slice(1).toUpperCase()).join(', ')} 格式
            </p>
            <p className={styles.uploadTip} style={{ marginTop: 4 }}>
              或拖拽文件到此处
            </p>
          </div>
        ) : (
          <div className={styles.videoPreviewContainer}>
            <div className={styles.videoPreview}>
              <video
                src={videoSrc || undefined}
                controls
                className={styles.videoPlayer}
              />
            </div>

            {metadata && (
              <Card className={styles.metadataCard} size="small" title="视频信息">
                <p><strong>文件名:</strong> {getFileName(videoPath)}</p>
                <p><strong>时长:</strong> {formatDuration(metadata.duration)}</p>
                <p><strong>分辨率:</strong> {formatResolution(metadata.width, metadata.height)}</p>
                <p><strong>帧率:</strong> {metadata.fps} fps</p>
                <p><strong>编码:</strong> {metadata.codec}</p>
              </Card>
            )}

            <div className={styles.videoActions}>
              <Space>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveVideo}
                  danger
                >
                  移除
                </Button>
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={handlePlayVideo}
                  type="primary"
                >
                  {isTauri() ? '在播放器中打开' : '新窗口播放'}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default VideoSelector;
