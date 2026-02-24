/**
 * 视频预览区 + 时间轴
 * 简化的 AI 剪辑专用时间轴
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layout, Button, Slider, Typography, Space, Upload, Progress, message } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ExpandOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAIEditor } from './AIPanel/AIEditorContext';
import type { VideoInfo } from '@/core/types';
import styles from './AIVideoPreview.module.less';

const { Content } = Layout;
const { Text } = Typography;

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AIVideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, setVideo, setPlaying, setCurrentTime, dispatch } = useAIEditor();
  const { isPlaying, currentTime, duration, currentVideo, clipResult } = state;
  
  const [isDragging, setIsDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // 视频加载完成
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      dispatch({ type: 'SET_DURATION', payload: videoRef.current.duration });
    }
  };

  // 播放进度更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (!videoRef.current || !currentVideo) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!isPlaying);
  }, [isPlaying, currentVideo, setPlaying]);

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 跳过前后 5 秒
  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      seekTo(newTime);
    }
  };

  // 进度条拖动
  const handleProgressChange = (value: number) => {
    seekTo(value);
  };

  // 文件上传
  const handleUpload = (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      message.error('请上传视频文件');
      return false;
    }

    // 验证文件大小 (最大 500MB)
    if (file.size > 500 * 1024 * 1024) {
      message.error('视频文件不能超过 500MB');
      return false;
    }

    // 创建视频 URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // 创建视频信息
    const videoInfo: VideoInfo = {
      id: `video-${Date.now()}`,
      path: url,
      name: file.name,
      duration: 0, // 等待加载后更新
      width: 0,
      height: 0,
      fps: 30,
      format: file.type.split('/')[1],
      size: file.size,
      createdAt: new Date().toISOString(),
    };

    setVideo(videoInfo);
    message.success(`已加载视频: ${file.name}`);

    return false; // 阻止默认上传
  };

  // 视频元数据加载
  const handleVideoLoaded = () => {
    if (videoRef.current && currentVideo) {
      const videoInfo: VideoInfo = {
        ...currentVideo,
        duration: videoRef.current.duration,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      setVideo(videoInfo);
    }
  };

  // 清除视频
  const handleClearVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideo(null);
    setCurrentTime(0);
    setPlaying(false);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentVideo) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowRight':
          skip(5);
          break;
        case 'Home':
          seekTo(0);
          break;
        case 'End':
          seekTo(duration);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideo, duration, togglePlay]);

  // 渲染 AI 建议
  const renderAISuggestions = () => {
    if (!currentVideo) {
      return (
        <div className={styles.suggestionsList}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            暂无 AI 建议，请先上传视频
          </Text>
        </div>
      );
    }

    if (clipResult && clipResult.suggestions.length > 0) {
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
  };

  return (
    <div className={styles.container}>
      {/* 视频预览区 */}
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
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleUpload(file);
              }}
            >
              <UploadOutlined className={styles.uploadIcon} />
              <Text>拖拽视频文件到此处或点击上传</Text>
              <Upload
                accept="video/*"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <Button type="link" icon={<CloudUploadOutlined />}>
                  选择文件
                </Button>
              </Upload>
            </div>
          )}
          
          {/* 视频控制栏 */}
          {currentVideo && (
            <div className={styles.videoControls}>
              <Space>
                <Button 
                  type="text" 
                  icon={<StepBackwardOutlined />} 
                  size="small"
                  onClick={() => skip(-5)}
                />
                <Button 
                  type="text" 
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                  onClick={togglePlay}
                  className={styles.playBtn}
                  size="large"
                />
                <Button 
                  type="text" 
                  icon={<StepForwardOutlined />} 
                  size="small"
                  onClick={() => skip(5)}
                />
              </Space>
              
              <div className={styles.progress}>
                <Text type="secondary" style={{ fontSize: 12, minWidth: 45 }}>
                  {formatTime(currentTime)}
                </Text>
                <Slider 
                  value={currentTime}
                  min={0}
                  max={duration || 100}
                  onChange={handleProgressChange}
                  tooltip={{ formatter: (value) => formatTime(value || 0) }}
                  style={{ width: '80%', margin: '0 12px' }}
                />
                <Text type="secondary" style={{ fontSize: 12, minWidth: 45 }}>
                  {formatTime(duration)}
                </Text>
              </div>
              
              <Space>
                <Button 
                  type="text" 
                  icon={<ExpandOutlined />} 
                  size="small"
                  title="全屏"
                />
                {currentVideo && (
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    size="small"
                    title="清除视频"
                    onClick={handleClearVideo}
                    danger
                  />
                )}
              </Space>
            </div>
          )}
        </div>
      </div>
      
      {/* 时间轴 */}
      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <Text strong style={{ color: '#ccc' }}>时间轴</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {currentVideo 
              ? `已加载 ${clipResult?.segments?.length || 0} 个片段`
              : '已加载 0 个片段'}
          </Text>
        </div>
        
        <div className={styles.timelineContent}>
          {currentVideo ? (
            <div className={styles.timelineTracks}>
              {/* 视频轨道 */}
              <div className={styles.track}>
                <Text type="secondary" style={{ fontSize: 11 }}>视频</Text>
                <div className={styles.trackBar}>
                  <div 
                    className={styles.clipSegment}
                    style={{ width: '100%' }}
                  >
                    <Text style={{ fontSize: 10, color: '#666' }}>{currentVideo.name}</Text>
                  </div>
                </div>
              </div>
              
              {/* AI 剪辑点轨道 */}
              {clipResult && clipResult.cutPoints.length > 0 && (
                <div className={styles.track}>
                  <Text type="secondary" style={{ fontSize: 11 }}>AI 剪辑点</Text>
                  <div className={styles.trackBar}>
                    {clipResult.cutPoints.slice(0, 10).map((point) => (
                      <div
                        key={point.id}
                        className={styles.cutPoint}
                        style={{ 
                          left: `${(point.timestamp / duration) * 100}%`,
                          backgroundColor: point.type === 'scene' ? '#1890ff' : 
                            point.type === 'silence' ? '#ff4d4f' : '#52c41a'
                        }}
                        title={`${point.type}: ${point.description}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 播放头 */}
              <div 
                className={styles.playhead}
                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          ) : (
            <div className={styles.emptyTimeline}>
              <Text type="secondary">添加视频后将在此处显示时间轴</Text>
            </div>
          )}
        </div>
        
        {/* AI 建议区 */}
        <div className={styles.aiSuggestions}>
          <Text strong style={{ color: '#1890ff' }}>🤖 AI 剪辑建议</Text>
          {renderAISuggestions()}
        </div>
      </div>
    </div>
  );
};

export default AIVideoPreview;
