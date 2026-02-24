/**
 * 结果预览组件
 * 支持文案预览 (Text) 和 语音预览 (Audio player)
 * Modal 形式展示
 */
import React, { useState } from 'react';
import { 
  Modal, Tabs, Card, Typography, Space, Button, 
  List, Tag, Divider, Empty, Spin, message 
} from 'antd';
import {
  FileTextOutlined,
  AudioOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import styles from './PreviewModal.module.less';

const { Text, Title, Paragraph } = Typography;

// 文案数据类型
export interface ScriptPreview {
  id: string;
  title: string;
  content: string;
  metadata?: {
    wordCount: number;
    estimatedDuration: number;
    style?: string;
    tone?: string;
  };
}

// 语音数据类型
export interface AudioPreview {
  id: string;
  audioUrl: string;
  duration?: number;
  voiceName?: string;
}

export interface PreviewModalProps {
  /** 是否显示 Modal */
  visible: boolean;
  /** 关闭 Modal 的回调 */
  onClose: () => void;
  /** 文案预览数据 */
  scriptPreview?: ScriptPreview | null;
  /** 语音预览数据 */
  audioPreview?: AudioPreview | null;
  /** 视频预览 URL (可选) */
  videoPreview?: string | null;
  /** Modal 标题 */
  title?: string;
  /** Modal 宽度 */
  width?: number | string;
  /** 确认按钮文字 */
  okText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认回调 */
  onOk?: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onClose,
  scriptPreview,
  audioPreview,
  videoPreview,
  title = '预览结果',
  width = 720,
  okText = '确定',
  cancelText = '关闭',
  onOk,
}) => {
  const [activeTab, setActiveTab] = useState<string>('script');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [copied, setCopied] = useState(false);

  // 复制文案到剪贴板
  const handleCopyScript = async () => {
    if (scriptPreview?.content) {
      try {
        await navigator.clipboard.writeText(scriptPreview.content);
        setCopied(true);
        message.success('已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        message.error('复制失败');
      }
    }
  };

  // 播放/暂停音频
  const handleTogglePlay = () => {
    if (!audioPreview?.audioUrl) return;
    
    if (!audioRef) {
      const audio = new Audio(audioPreview.audioUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioRef(audio);
    }
    
    if (isPlaying) {
      audioRef?.pause();
    } else {
      audioRef?.play();
    }
    setIsPlaying(!isPlaying);
  };

import { formatDuration } from '@/shared';

  // 获取 Tab 项
  const getTabItems = () => {
    const items = [];

    // 文案预览 Tab
    if (scriptPreview) {
      items.push({
        key: 'script',
        label: (
          <Space>
            <FileTextOutlined />
            文案预览
            {scriptPreview.metadata?.wordCount && (
              <Tag color="blue">{scriptPreview.metadata.wordCount} 字</Tag>
            )}
          </Space>
        ),
        children: (
          <div className={styles.tabContent}>
            {/* 文案信息 */}
            <Card size="small" className={styles.infoCard}>
              <Space split={<Divider type="vertical" />}>
                {scriptPreview.metadata?.wordCount && (
                  <Text type="secondary">字数: {scriptPreview.metadata.wordCount}</Text>
                )}
                {scriptPreview.metadata?.estimatedDuration && (
                  <Text type="secondary">
                    预计时长: {Math.ceil(scriptPreview.metadata.estimatedDuration)}秒
                  </Text>
                )}
                {scriptPreview.metadata?.style && (
                  <Tag>风格: {scriptPreview.metadata.style}</Tag>
                )}
                {scriptPreview.metadata?.tone && (
                  <Tag color="purple">语气: {scriptPreview.metadata.tone}</Tag>
                )}
              </Space>
            </Card>

            {/* 文案内容 */}
            <div className={styles.scriptContent}>
              <div className={styles.scriptHeader}>
                <Title level={5} style={{ margin: 0 }}>
                  {scriptPreview.title}
                </Title>
                <Button 
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={handleCopyScript}
                  size="small"
                >
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
              <div className={styles.scriptText}>
                {scriptPreview.content}
              </div>
            </div>
          </div>
        ),
      });
    }

    // 语音预览 Tab
    if (audioPreview) {
      items.push({
        key: 'audio',
        label: (
          <Space>
            <AudioOutlined />
            语音预览
          </Space>
        ),
        children: (
          <div className={styles.tabContent}>
            <Card className={styles.audioCard}>
              <div className={styles.audioPlayer}>
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={isPlaying ? (
                    <PauseCircleOutlined style={{ fontSize: 32 }} />
                  ) : (
                    <PlayCircleOutlined style={{ fontSize: 32 }} />
                  )}
                  onClick={handleTogglePlay}
                  className={styles.playButton}
                />
                <div className={styles.audioInfo}>
                  <Text strong>配音预览</Text>
                  {audioPreview.voiceName && (
                    <Text type="secondary"> - {audioPreview.voiceName}</Text>
                  )}
                  {audioPreview.duration && (
                    <div className={styles.audioDuration}>
                      <Text type="secondary">
                        {formatDuration(audioPreview.duration)}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 音频波形占位 */}
              <div className={styles.waveform}>
                {[...Array(40)].map((_, i) => (
                  <div 
                    key={i}
                    className={styles.waveBar}
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      opacity: isPlaying ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            </Card>

            {/* 下载按钮 */}
            <div className={styles.audioActions}>
              <Button 
                icon={<DownloadOutlined />}
                href={audioPreview.audioUrl}
                download
              >
                下载音频
              </Button>
            </div>
          </div>
        ),
      });
    }

    // 视频预览 Tab
    if (videoPreview) {
      items.push({
        key: 'video',
        label: (
          <Space>
            <PlayCircleOutlined />
            视频预览
          </Space>
        ),
        children: (
          <div className={styles.tabContent}>
            <Card className={styles.videoCard}>
              <video
                src={videoPreview}
                controls
                style={{ maxWidth: '100%', maxHeight: 400 }}
              />
            </Card>
          </div>
        ),
      });
    }

    return items;
  };

  // 检查是否有可预览的内容
  const hasContent = scriptPreview || audioPreview || videoPreview;

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={width}
      footer={
        hasContent ? [
          <Button key="close" onClick={onClose}>
            {cancelText}
          </Button>,
          onOk && (
            <Button key="ok" type="primary" onClick={onOk}>
              {okText}
            </Button>
          ),
        ] : [
          <Button key="close" type="primary" onClick={onClose}>
            {cancelText}
          </Button>,
        ]
      }
      className={styles.previewModal}
      destroyOnClose
    >
      {!hasContent ? (
        <Empty 
          description="暂无预览内容" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={getTabItems()}
        />
      )}
    </Modal>
  );
};

export default PreviewModal;
