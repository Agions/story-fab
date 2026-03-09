import React, { useState, useRef } from 'react';
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

/**
 * 视频选择器组件
 * 支持选择本地视频文件，并显示视频预览及基本信息
 * 同时支持桌面端 (Tauri) 和 Web 端
 */
const VideoSelector: React.FC<VideoSelectorProps> = ({
  initialVideoPath,
  onVideoSelect,
  onVideoRemove,
  loading = false
}) => {
  const [videoPath, setVideoPath] = useState<string | null>(initialVideoPath || null);
  const [videoSrc, setVideoSrc] = useState<string | null>(initialVideoPath ? (isTauri() ? convertFileSrc(initialVideoPath) : initialVideoPath) : null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取文件名（兼容 Web 和 Tauri 环境）
  const getFileName = (path: string | null): string => {
    if (!path) return '';
    // Web 环境下的 blob URL 或文件路径
    if (path.startsWith('blob:') || path.startsWith('http')) {
      return '视频文件';
    }
    // Tauri 环境下的文件路径
    return path.split('/').pop() || path;
  };

  // 支持的视频格式
  const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];

  /**
   * 选择视频文件 - Tauri 桌面端
   */
  const handleSelectVideoTauri = async () => {
    try {
      // 打开文件选择对话框
      const selected = await open({
        multiple: false,
        filters: [{
          name: '视频文件',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv']
        }]
      });

      // 如果用户取消选择，selected将是null
      if (!selected || Array.isArray(selected)) {
        return;
      }

      // 设置视频路径
      const filePath = selected as string;
      setVideoPath(filePath);
      setVideoSrc(convertFileSrc(filePath));

      // 分析视频获取元数据
      setIsAnalyzing(true);
      try {
        const videoMetadata = await analyzeVideo(filePath);
        setMetadata(videoMetadata);
        onVideoSelect(filePath, videoMetadata);
      } catch (error) {
        console.error('分析视频失败:', error);
        // 即使分析失败也允许选择视频
        onVideoSelect(filePath);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('选择视频失败:', error);
      notify.error(error, '选择视频失败，请重试');
    }
  };

  /**
   * 选择视频文件 - Web 端
   */
  const handleSelectVideoWeb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      notify.error(null, `不支持的视频格式: ${ext}，请选择 ${VIDEO_EXTENSIONS.join(', ')} 格式`);
      return;
    }

    // 使用 Web API 读取视频文件
    const fileUrl = URL.createObjectURL(file);
    setVideoPath(file.name);
    setVideoSrc(fileUrl);

    // 获取视频元数据
    setIsAnalyzing(true);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const webMetadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30,
        codec: file.type,
        bitrate: video.duration > 0 ? Math.round((file.size * 8) / video.duration) : 0,
      };
      setMetadata(webMetadata);
      onVideoSelect(fileUrl, webMetadata);
      setIsAnalyzing(false);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      notify.error(null, '无法读取视频文件');
      setIsAnalyzing(false);
    };

    video.src = fileUrl;
  };

  /**
   * 选择视频文件 - 自动判断环境
   */
  const handleSelectVideo = () => {
    if (isTauri()) {
      handleSelectVideoTauri();
    } else {
      // Web 环境下触发文件输入
      fileInputRef.current?.click();
    }
  };

  /**
   * 移除选中的视频
   */
  const handleRemoveVideo = () => {
    setVideoPath(null);
    setVideoSrc(null);
    setMetadata(null);
    if (onVideoRemove) {
      onVideoRemove();
    }
  };

  /**
   * 在默认播放器中播放视频
   */
  const handlePlayVideo = async () => {
    if (!videoPath) return;
    
    try {
      await invoke('open_file', { path: videoPath });
    } catch (error) {
      console.error('打开视频失败:', error);
      notify.error(error, '无法打开视频，请确保系统有关联的视频播放器');
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
          <div className={styles.uploadArea} onClick={handleSelectVideo}>
            <UploadOutlined className={styles.uploadIcon} />
            <p>点击选择视频文件</p>
            <p className={styles.uploadTip}>支持 MP4, MOV, AVI 等格式</p>
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
                  在播放器中打开
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
