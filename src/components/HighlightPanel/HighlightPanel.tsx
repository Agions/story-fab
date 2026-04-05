import React, { useState, useCallback } from 'react';
import { Button, Slider, Tooltip, message, Spin, Empty } from 'antd';
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  AimOutlined,
  BulbOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import type { HighlightSegment, HighlightOptions } from '@/core/video/highlight.types';
import styles from './HighlightPanel.module.less';

interface HighlightPanelProps {
  videoPath?: string;
  onSeekTo?: (timeMs: number) => void;
  onPreviewHighlight?: (highlight: HighlightSegment) => void;
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

const getReasonTagClass = (reason: string): string => {
  switch (reason) {
    case 'scene_change':
      return styles.sceneChange;
    case 'motion_burst':
      return styles.motionBurst;
    case 'combined':
      return styles.combined;
    default:
      return '';
  }
};

const getReasonLabel = (reason: string): string => {
  switch (reason) {
    case 'audio_energy':
      return 'Audio';
    case 'scene_change':
      return 'Scene';
    case 'motion_burst':
      return 'Motion';
    case 'combined':
      return 'Combined';
    default:
      return reason;
  }
};

const HighlightPanel: React.FC<HighlightPanelProps> = ({
  videoPath,
  onSeekTo,
  onPreviewHighlight,
}) => {
  const [highlights, setHighlights] = useState<HighlightSegment[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightSegment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(1.5);
  const [topN, setTopN] = useState(10);

  const detectHighlights = useCallback(async () => {
    if (!videoPath) {
      message.warning('请先加载视频文件');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const input = {
        videoPath,
        threshold,
        minDurationMs: 500,
        topN,
        windowMs: 100,
        detectScene: true,
        sceneThreshold: 0.3,
      };

      const result = await invoke<HighlightSegment[]>('detect_highlights', { input });
      setHighlights(result);
      message.success(`检测到 ${result.length} 个高光时刻`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      message.error(`高光检测失败: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [videoPath, threshold, topN]);

  const handleHighlightClick = useCallback((highlight: HighlightSegment) => {
    setSelectedHighlight(highlight);
    onSeekTo?.(highlight.startMs);
  }, [onSeekTo]);

  const handlePreviewClick = useCallback((e: React.MouseEvent, highlight: HighlightSegment) => {
    e.stopPropagation();
    onPreviewHighlight?.(highlight);
  }, [onPreviewHighlight]);

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <BulbOutlined className={styles.emptyIcon} />
      <p className={styles.emptyText}>
        点击「自动检测高光」按钮<br />
        基于音频能量分析自动识别精彩片段
      </p>
    </div>
  );

  const renderLoadingState = () => (
    <div className={styles.loadingState}>
      <Spin size="large" />
      <span className={styles.loadingText}>正在分析视频音频能量...</span>
    </div>
  );

  const renderHighlightItem = (highlight: HighlightSegment, index: number) => {
    const isSelected = selectedHighlight?.startMs === highlight.startMs;
    const scorePercent = Math.round(highlight.score * 100);

    return (
      <div
        key={`${highlight.startMs}-${index}`}
        className={`${styles.highlightItem} ${isSelected ? styles.selected : ''}`}
        onClick={() => handleHighlightClick(highlight)}
      >
        <div className={styles.highlightHeader}>
          <span className={styles.highlightTime}>
            {formatTime(highlight.startMs)} - {formatTime(highlight.endMs)}
          </span>
          <div className={styles.highlightScore}>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <span className={styles.scoreValue}>{scorePercent}%</span>
          </div>
        </div>

        <div className={styles.highlightReason}>
          <span className={`${styles.reasonTag} ${getReasonTagClass(highlight.reason)}`}>
            {getReasonLabel(highlight.reason)}
          </span>
          {highlight.audioScore !== undefined && (
            <Tooltip title="音频分数">
              <span style={{ fontSize: 10, color: '#a8a8b3' }}>
                A: {Math.round(highlight.audioScore * 100)}%
              </span>
            </Tooltip>
          )}
          {highlight.sceneScore !== undefined && (
            <Tooltip title="场景分数">
              <span style={{ fontSize: 10, color: '#a8a8b3' }}>
                S: {Math.round(highlight.sceneScore * 100)}%
              </span>
            </Tooltip>
          )}
        </div>

        <div className={styles.highlightActions}>
          <Button
            type="text"
            size="small"
            icon={<AimOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleHighlightClick(highlight);
            }}
          >
            定位
          </Button>
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={(e) => handlePreviewClick(e, highlight)}
          >
            预览
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.highlightPanelContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <ThunderboltOutlined className={styles.titleIcon} />
          高光检测
        </h3>

        <div className={styles.controls}>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={detectHighlights}
            loading={isLoading}
            disabled={!videoPath}
            size="small"
          >
            自动检测
          </Button>

          <div className={styles.thresholdControl}>
            <span>阈值</span>
            <Slider
              className={styles.thresholdSlider}
              min={1.0}
              max={3.0}
              step={0.1}
              value={threshold}
              onChange={setThreshold}
              tooltip={{ formatter: (v) => `${v?.toFixed(1)}x` }}
              size="small"
            />
          </div>

          <div className={styles.thresholdControl}>
            <span>Top</span>
            <Slider
              className={styles.thresholdSlider}
              min={3}
              max={30}
              step={1}
              value={topN}
              onChange={setTopN}
              tooltip={{ formatter: (v) => `${v}` }}
              size="small"
            />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorState}>
            {error}
          </div>
        )}

        {isLoading && renderLoadingState()}

        {!isLoading && !error && highlights.length === 0 && renderEmptyState()}

        {!isLoading && highlights.length > 0 && (
          <div className={styles.highlightList}>
            {highlights.map((h, i) => renderHighlightItem(h, i))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlightPanel;
