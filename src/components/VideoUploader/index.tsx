/**
 * 视频上传组件
 * 专业的视频上传和预览
 */

import React, { useCallback, useState } from 'react';
import {
  Upload,
  Card,
  Button,
  Progress,
  Space,
  Typography,
  Tag,
  Tooltip,
  message,
  Alert
} from 'antd';
import {
  UploadOutlined,
  VideoCameraOutlined,
  FileOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/core/hooks/useVideo';
import type { VideoInfo } from '@/core/types';
import { formatDuration, formatFileSize } from '@/shared';
import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// 支持的格式
const SUPPORTED_FORMATS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

interface VideoUploaderProps {
  onUpload?: (video: VideoInfo) => void;
  onRemove?: () => void;
  value?: VideoInfo | null;
  disabled?: boolean;
  showPreview?: boolean;
  accept?: string;
  maxSize?: number;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUpload,
  onRemove,
  value,
  disabled = false,
  showPreview = true
}) => {
  const {
    video,
    isUploading,
    uploadProgress,
    uploadVideo,
    error,
    extractThumbnail
  } = useVideo();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragFile, setDragFile] = useState<File | null>(null);

  // 处理拖拽事件
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
    setDragFile(e.dataTransfer.files[0] || null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开上传区域时才重置状态
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragActive(false);
      setDragFile(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 验证文件类型
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_FORMATS.includes(fileExt)) {
        message.error(`不支持的文件格式，仅支持 ${SUPPORTED_FORMATS.join(', ')}`);
        setDragFile(null);
        return;
      }
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        message.error(`文件过大，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`);
        setDragFile(null);
        return;
      }
      setDragFile(file);
      handleFileSelect(file);
    }
    setDragFile(null);
  }, [handleFileSelect]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    const videoInfo = await uploadVideo(file);
    if (videoInfo) {
      onUpload?.(videoInfo);
      message.success('视频上传成功');
    }
    return false; // 阻止默认上传行为
  }, [uploadVideo, onUpload]);

  // 处理删除
  const handleRemove = useCallback(() => {
    onRemove?.();
    message.info('视频已移除');
  }, [onRemove]);

  // 当前显示的视频
  const currentVideo = value || video;

  // 上传区域
  const renderUploadArea = () => (
    <Dragger
      accept={SUPPORTED_FORMATS.join(',')}
      beforeUpload={handleFileSelect}
      showUploadList={false}
      disabled={disabled || isUploading}
      className={`${styles.dragger} ${dragActive ? styles.dragActive : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={styles.uploadContent}
      >
        <div className={`${styles.uploadIcon} ${dragActive ? styles.uploadIconActive : ''}`}>
          {isUploading ? (
            <VideoCameraOutlined spin />
          ) : dragActive ? (
            <FileOutlined />
          ) : (
            <UploadOutlined />
          )}
        </div>
        <Title level={5} className={styles.uploadTitle}>
          {isUploading ? '正在上传视频...' : dragActive ? '释放鼠标上传视频' : '点击或拖拽视频到此处'}
        </Title>
        <Paragraph className={styles.uploadDesc}>
          {dragFile ? (
            <>
              已选择文件: <strong>{dragFile.name}</strong>
              <br />
              大小: {formatFileSize(dragFile.size)}
            </>
          ) : (
            <>
              支持 {SUPPORTED_FORMATS.join(', ')} 格式
              <br />
              最大支持 {formatFileSize(MAX_FILE_SIZE)}
            </>
          )}
        </Paragraph>

        {isUploading && (
          <div className={styles.progress}>
            <Progress
              percent={uploadProgress}
              status="active"
              strokeColor={{ from: '#108ee9', to: '#87d068' }}
            />
            <Text type="secondary">{uploadProgress}%</Text>
          </div>
        )}
      </motion.div>
    </Dragger>
  );

  // 视频信息卡片
  const renderVideoCard = () => {
    if (!currentVideo) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={styles.videoCard}>
          <div className={styles.videoPreview}>
            {currentVideo.thumbnail ? (
              <img
                src={currentVideo.thumbnail}
                alt={currentVideo.name}
                className={styles.thumbnail}
              />
            ) : (
              <div className={styles.placeholder}>
                <FileOutlined />
              </div>
            )}
            <div className={styles.overlay}>
              <Button
                type="primary"
                shape="circle"
                icon={<EyeOutlined />}
                onClick={() => setPreviewVisible(true)}
                className={styles.previewBtn}
              />
            </div>
          </div>

          <div className={styles.videoInfo}>
            <Title level={5} className={styles.videoName} ellipsis={{ tooltip: true }}>
              {currentVideo.name}
            </Title>

            <Space wrap className={styles.videoMeta}>
              <Tag icon={<CheckCircleOutlined />} color="success">
                {currentVideo.format.toUpperCase()}
              </Tag>
              <Tag>{formatFileSize(currentVideo.size)}</Tag>
              <Tag>{formatDuration(currentVideo.duration)}</Tag>
              <Tag>{currentVideo.width}x{currentVideo.height}</Tag>
            </Space>

            <div className={styles.actions}>
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewVisible(true)}
                >
                  预览
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemove}
                >
                  移除
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 错误提示 */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          className={styles.alert}
        />
      )}

      {/* 上传或显示 */}
      <AnimatePresence mode="wait">
        {currentVideo ? (
          renderVideoCard()
        ) : (
          renderUploadArea()
        )}
      </AnimatePresence>

      {/* 视频预览模态框 */}
      {showPreview && previewVisible && currentVideo && (
        <div className={styles.previewModal} onClick={() => setPreviewVisible(false)}>
          <div className={styles.previewContent} onClick={e => e.stopPropagation()}>
            <video
              src={currentVideo.path}
              controls
              autoPlay
              className={styles.previewVideo}
            />
            <Button
              className={styles.closeBtn}
              onClick={() => setPreviewVisible(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
