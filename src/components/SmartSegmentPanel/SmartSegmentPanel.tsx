/**
 * SmartSegmentPanel — Redesigned for AI Cinema Studio
 *
 * Deep charcoal card style, JetBrains Mono timecodes,
 * amber confidence progress bars, click-to-seek.
 *
 * @design-system AI Cinema Studio
 *   bg-base: #0C0D14 | accent: #FF9F43 | cyan: #00D4FF
 *   font: Outfit + Figtree + JetBrains Mono
 */

import React, { useState, useCallback } from 'react';
import { Button, message } from 'antd';
import {
  PartitionOutlined,
  AimOutlined,
  PlayCircleOutlined,
  ScissorOutlined,
  SettingOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import type { SmartVideoSegment } from '@/core/video/highlight.types';
import styles from './SmartSegmentPanel.module.scss';

interface SmartSegmentPanelProps {
  videoPath?: string;
  onSeekTo?: (timeMs: number) => void;
  onApplySegments?: (segments: SmartVideoSegment[]) => void;
  onPreviewSegment?: (segment: SmartVideoSegment) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((ms % 1000) / 10);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const SEGMENT_TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  dialogue:   { label: '对话', cls: 'dialogue'   },
  action:     { label: '动作', cls: 'action'     },
  transition: { label: '转场', cls: 'transition' },
  silence:    { label: '静默', cls: 'silence'    },
  content:    { label: '内容', cls: 'content'    },
};

const SmartSegmentPanel: React.FC<SmartSegmentPanelProps> = ({
  videoPath,
  onSeekTo,
  onApplySegments,
  onPreviewSegment,
}) => {
  const [segments, setSegments] = useState<SmartVideoSegment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      const input = {
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

  const handleItemClick = useCallback((segment: SmartVideoSegment) => {
    setSelectedId(`${segment.startMs}`);
    onSeekTo?.(segment.startMs);
  }, [onSeekTo]);

  const handlePreviewClick = useCallback(
    (e: React.MouseEvent, segment: SmartVideoSegment) => {
      e.stopPropagation();
      onPreviewSegment?.(segment);
    },
    [onPreviewSegment]
  );

  const handleApplyAll = useCallback(() => {
    if (segments.length === 0) {
      message.warning('没有可应用的片段');
      return;
    }
    onApplySegments?.(segments);
    message.success(`已将 ${segments.length} 个片段应用到时间线`);
  }, [segments, onApplySegments]);

  const handleApplyOne = useCallback((e: React.MouseEvent, segment: SmartVideoSegment) => {
    e.stopPropagation();
    onApplySegments?.([segment]);
    message.success('片段已应用到时间线');
  }, [onApplySegments]);

  return (
    <div className={styles.container} role="region" aria-label="智能分段面板">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon} aria-hidden="true">✂️</span>
          <h2 className={styles.headerTitle}>智能分段</h2>
          {segments.length > 0 && (
            <span className={styles.countBadge} aria-label={`共 ${segments.length} 个片段`}>
              {segments.length}
            </span>
          )}
        </div>

        <div className={styles.controls}>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={detectSegments}
            loading={isLoading}
            disabled={!videoPath}
            size="small"
            className={styles.segmentBtn}
          >
            自动分段
          </Button>
          {segments.length > 0 && (
            <Button
              type="default"
              icon={<ScissorOutlined />}
              onClick={handleApplyAll}
              size="small"
              className={styles.applyAllBtn}
            >
              全部应用
            </Button>
          )}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────── */}
      <main className={styles.content} role="list" aria-label="片段列表">
        {error && (
          <div className={styles.errorState} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {!error && isLoading && (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <span className={styles.loadingText}>正在分析视频场景和音频…</span>
          </div>
        )}

        {!error && !isLoading && segments.length === 0 && (
          <div className={styles.emptyState}>
            <PartitionOutlined className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>暂无分段数据</p>
            <p className={styles.emptyHint}>
              点击「自动分段」按钮<br />基于场景切换和音频分析智能分段
            </p>
          </div>
        )}

        {!isLoading && segments.length > 0 && (
          <ul className={styles.list}>
            {segments.map((s, i) => {
              const id = `${s.startMs}`;
              const isSelected = selectedId === id;
              const confidencePct = Math.round(s.confidence * 100);
              const typeCfg = SEGMENT_TYPE_CONFIG[s.segmentType] ?? { label: s.segmentType, cls: 'content' };

              return (
                <li
                  key={id}
                  className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                  onClick={() => handleItemClick(s)}
                  role="listitem"
                  aria-selected={isSelected}
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  {/* Header row: timecode + type + duration */}
                  <div className={styles.itemHeader}>
                    <span className={styles.timecode} aria-label={`开始时间 ${formatTime(s.startMs)}`}>
                      {formatTime(s.startMs)}
                    </span>
                    <div className={styles.itemMeta}>
                      <span className={`${styles.segmentType} ${styles[`type_${typeCfg.cls}`]}`}>
                        {typeCfg.label}
                      </span>
                      <span className={styles.duration}>{formatDuration(s.durationMs)}</span>
                    </div>
                  </div>

                  {/* End time + badges */}
                  <div className={styles.itemSubHeader}>
                    <span className={styles.endTime}>→ {formatTime(s.endMs)}</span>
                    {s.isSceneChange && (
                      <span className={styles.sceneBadge}>
                        <CheckSquareOutlined /> 场景切换
                      </span>
                    )}
                    <div
                      className={styles.confidenceGroup}
                      role="progressbar"
                      aria-valuenow={confidencePct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`置信度 ${confidencePct}%`}
                    >
                      <div
                        className={styles.confidenceFill}
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>
                    <span className={styles.confidenceLabel}>{confidencePct}%</span>
                  </div>

                  {/* Action buttons */}
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); handleItemClick(s); }}
                      aria-label="定位到此片段"
                    >
                      <AimOutlined /> 定位
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => handlePreviewClick(e, s)}
                      aria-label="预览此片段"
                    >
                      <PlayCircleOutlined /> 预览
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnAccent}`}
                      onClick={(e) => handleApplyOne(e, s)}
                      aria-label="应用此片段到时间线"
                    >
                      <ScissorOutlined /> 应用
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default SmartSegmentPanel;
