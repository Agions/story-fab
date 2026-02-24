/**
 * 步骤2: 上传视频
 * 
 * 数据输入: project (从 ProjectCreate 来)
 * 数据输出: video (VideoInfo) + duration/width/height
 * 流转到: AIAnalyze
 */
import React, { useState, useCallback } from 'react';
import { 
  Upload, Button, Card, Space, Typography, Progress, 
  List, message, Alert, Divider 
} from 'antd';
import {
  VideoCameraOutlined,
  InboxOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import { ProcessingProgress } from '@/components/common';
import type { VideoInfo } from '@/core/types';
import { formatDuration, formatFileSize } from '@/shared';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// 支持的视频格式
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];

interface VideoUploadProps {
  onNext?: () => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onNext }) => {
  const { state, setVideo, goToNextStep } = useClipFlow();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // 处理文件上传
  const handleUpload = useCallback(async (file: File) => {
    // 验证文件类型
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      message.error(`不支持的视频格式: ${ext}`);
      return;
    }

    // 验证文件大小 (最大 2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      message.error('视频文件不能超过 2GB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // 读取视频文件获取基本信息
      const videoInfo = await new Promise<VideoInfo>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          
          resolve({
            id: `video_${Date.now()}`,
            path: URL.createObjectURL(file),
            name: file.name,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            fps: 30, // 默认帧率
            format: file.name.split('.').pop() || 'mp4',
            size: file.size,
            thumbnail: '', // 可以后续生成
            createdAt: new Date().toISOString(),
          });
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error('无法读取视频文件'));
        };
        
        video.src = URL.createObjectURL(file);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 保存视频信息到状态
      setVideo(videoInfo);
      message.success('视频上传成功');

      // 跳转到下一步
      if (onNext) {
        onNext();
      } else {
        setTimeout(() => goToNextStep(), 500);
      }
    } catch (error) {
      message.error('视频处理失败，请重试');
      console.error(error);
    } finally {
      setUploading(false);
    }
  }, [setVideo, goToNextStep, onNext]);

  // 处理删除视频
  const handleDelete = () => {
    setVideo(null);
    setUploadProgress(0);
  };

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // 如果已有视频，显示视频信息
  if (state.currentVideo) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <Title level={4}>已上传视频</Title>
          <Paragraph>
            您已成功上传视频，可以继续下一步进行 AI 分析
          </Paragraph>
        </div>

        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 视频预览 */}
            <div className={styles.videoContainer}>
              <video
                src={state.currentVideo.path}
                controls
                style={{ maxWidth: '100%', maxHeight: 400 }}
              />
            </div>

            <Divider />

            {/* 视频信息 */}
            <List
              bordered={false}
              dataSource={[
                { label: '文件名', value: state.currentVideo.name },
                { label: '时长', value: formatDuration(state.currentVideo.duration) },
                { label: '分辨率', value: `${state.currentVideo.width}x${state.currentVideo.height}` },
                { label: '格式', value: state.currentVideo.format.toUpperCase() },
                { label: '大小', value: formatFileSize(state.currentVideo.size) },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Text type="secondary" style={{ width: 80 }}>
                    {item.label}
                  </Text>
                  <Text strong>{item.value}</Text>
                </List.Item>
              )}
            />

            <Space>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                删除视频
              </Button>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={goToNextStep}
              >
                下一步：AI 分析
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  // 上传区域
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Title level={4}>上传视频</Title>
        <Paragraph>
          支持 MP4、MOV、AVI、MKV、WEBM 格式，最大 2GB
        </Paragraph>
      </div>

      {state.stepStatus['project-create'] ? (
        <Card>
          <div
            className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Dragger
              showUploadList={false}
              beforeUpload={(file) => {
                handleUpload(file);
                return false; // 阻止默认上传行为
              }}
              accept={VIDEO_EXTENSIONS.join(',')}
              disabled={uploading}
            >
              {uploading ? (
                <div className={styles.analysisProgress}>
                  <ProcessingProgress
                    percent={Math.round(uploadProgress)}
                    statusText="正在处理视频..."
                    status="active"
                    type="circle"
                    size="large"
                    showIcon={false}
                  />
                </div>
              ) : (
                <>
                  <p className={styles.uploadIcon}>
                    <VideoCameraOutlined />
                  </p>
                  <p className={styles.uploadText}>
                    <Text strong>点击或拖拽视频文件到此处上传</Text>
                  </p>
                  <p className={styles.uploadText}>
                    <Text type="secondary">
                      支持 {VIDEO_EXTENSIONS.join('、')} 格式
                    </Text>
                  </p>
                </>
              )}
            </Dragger>
          </div>

          <Alert
            message="上传说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>请上传清晰的视频文件以获得最佳分析效果</li>
                <li>视频时长建议 1-30 分钟</li>
                <li>上传后系统将自动分析视频内容</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      ) : (
        <Alert
          message="请先创建项目"
          description="请先完成项目创建，然后上传视频"
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};

export default VideoUpload;
