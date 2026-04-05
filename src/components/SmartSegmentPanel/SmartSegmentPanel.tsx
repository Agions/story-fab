import React, { useState, useCallback } from 'react';
import { Button, message, Spin, Empty, Tooltip } from 'antd';
import {
  PartitionOutlined,
  AimOutlined,
  PlayCircleOutlined,
  ScissorOutlined,
  SettingOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import type { SmartVideoSegment, SegmentOptions } from '@/core/video/highlight.types';
import styles from './SmartSegmentPanel.module.less';

interface SmartSegmentPanelProps {
  videoPath?: string;
  onSeekTo?: (timeMs: number) => void;
  onApplySegments?: (segments: SmartVideoSegment[]) => void;
  onPreviewSegment?: (segment: SmartVideoSegment) => void;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${(millis / 10).toFixed(0).padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${(millis / 10).toFixed(0).padStart(2, '0')}`;
};

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const getSegmentTypeClass = (type: string): string => {
  switch (type) {
    case 'dialogue':
      return styles.dialogue;
    case 'action':
      return styles.action;
    case 'transition':
      return styles.transition;
    case 'silence':
      return styles.silence;
    case 'content':
    default:
      return styles.content;
  }
};

const getSegmentTypeLabel = (type: string): string => {
  switch (type) {
    case 'dialogue':
      return '对话';
    case 'action':
      return '动作';
    case 'transition':
      return '转场';
    case 'silence':
      return '静默';
    case 'content':
    default:
      return '内容';
  }
};

const SmartSegmentPanel: React.FC<SmartSegmentPanelProps> = ({
  videoPath,
  onSeekTo,
  onApplySegments,
  onPreviewSegment,
}) => {
  const [segments, setSegments] = useState<SmartVideoSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<SmartVideoSegment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectSegments = useCallback(async () => {
    if (!videoPath) {
      message.warning('请先加载视频文件');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const input: SegmentOptions & { videoPath: string } = {
        videoPath,
        minDurationMs: 1000,
        maxDurationMs: 30000,
        sceneThreshold: 0.3,
        silenceThresholdDb: -40,
        detectDialogue: true,
        detectTransitions: true,
      };

      const result = await invoke<SmartVideoSegment[]>('detect_smart_segments', { input });
      setSegments(result);
      message.success(`智能分段完成，共 ${result.length} 个片段`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      message.error(`智能分段失败: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [videoPath]);

  const handleSegmentClick = useCallback((segment: SmartVideoSegment) => {
    setSelectedSegment(segment);
    onSeekTo?.(segment.startMs);
  }, [onSeekTo]);

  const handlePreviewClick = useCallback((e: React.MouseEvent, segment: SmartVideoSegment) => {
    e.stopPropagation();
    onPreviewSegment?.(segment);
  }, [onPreviewSegment]);

  const handleApplyAll = useCallback(() => {
    if (segments.length === 0) {
      message.warning('没有可应用的片段');
      return;
    }
    onApplySegments?.(segments);
    message.success(`已将 ${segments.length} 个片段应用到时间线`);
  }, [segments, onApplySegments]);

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <PartitionOutlined className={styles.emptyIcon} />
      <p className={styles.emptyText}>
        点击「自动分段」按钮<br />
        基于场景切换和音频分析智能分段
      </p>
    </div>
  );

  const renderLoadingState = () => (
    <div className={styles.loadingState}>
      <Spin size="large" />
      <span className={styles.loadingText}>正在分析视频场景和音频...</span>
    </div>
  );

  const renderSegmentItem = (segment: SmartVideoSegment, index: number) => {
    const isSelected = selectedSegment?.startMs === segment.startMs;
    const confidencePercent = Math.round(segment.confidence * 100);

    return (
      <div
        key={`${segment.startMs}-${index}`}
        className={`${styles.segmentItem} ${isSelected ? styles.selected : ''}`}
        onClick={() => handleSegmentClick(segment)}
      >
        <div className={styles.segmentHeader}>
          <span className={styles.segmentTime}>
            {formatTime(segment.startMs)} - {formatTime(segment.endMs)}
          </span>
          <div className={styles.segmentMeta}>
            <span className={styles.segmentDuration}>
              {formatDuration(segment.durationMs)}
            </span>
            <span className={`${styles.segmentType} ${getSegmentTypeClass(segment.segmentType)}`}>
              {getSegmentTypeLabel(segment.segmentType)}
            </span>
          </div>
        </div>

        <div className={styles.segmentBadges}>
          {segment.isSceneChange && (
            <span className={styles.sceneChangeBadge}>
              <CheckSquareOutlined /> 场景切换
            </span>
          )}
          <Tooltip title={`置信度: ${confidencePercent}%`}>
            <div className={styles.confidenceBar}>
              <div
                className={styles.confidenceFill}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </Tooltip>
        </div>

        <div className={styles.segmentActions}>
          <Button
            type="text"
            size="small"
            icon={<AimOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleSegmentClick(segment);
            }}
          >
            定位
          </Button>
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={(e) => handlePreviewClick(e, segment)}
          >
            预览
          </Button>
          <Button
            type="text"
            size="small"
            icon={<ScissorOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onApplySegments?.([segment]);
              message.success('片段已应用到时间线');
            }}
          >
            应用
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.segmentPanelContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <PartitionOutlined className={styles.titleIcon} />
          智能分段
        </h3>

        <div className={styles.controls}>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={detectSegments}
            loading={isLoading}
            disabled={!videoPath}
            size="small"
          >
            自动分段
          </Button>

          {segments.length > 0 && (
            <Button
              type="default"
              icon={<ScissorOutlined />}
              onClick={handleApplyAll}
              size="small"
            >
              全部应用
            </Button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorState}>
            {error}
          </div>
        )}

        {isLoading && renderLoadingState()}

        {!isLoading && !error && segments.length === 0 && renderEmptyState()}

        {!isLoading && segments.length > 0 && (
          <div className={styles.segmentList}>
            {segments.map((s, i) => renderSegmentItem(s, i))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSegmentPanel;
