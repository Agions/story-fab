/**
 * SubtitleExtractor — 字幕编辑器（重构版）
 *
 * 重构目标：成为真正的视频字幕编辑器
 * - 顶部：视频预览 + 播放控制
 * - 中部：字幕时间轴（可点击跳转）
 * - 底部：字幕列表（内联编辑）
 *
 * 设计风格：AI Cinema Studio Dark (#0C0D14)
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card, Typography, Button, Space, Select, Progress, List,
  Input, Switch, Slider, Tooltip, Empty,
} from 'antd';
import {
  AudioOutlined, FileTextOutlined, EditOutlined,
  DownloadOutlined, PlayCircleOutlined, PauseCircleOutlined,
  SyncOutlined, AimOutlined,
} from '@ant-design/icons';
import { notify } from '@/shared';
import { subtitleService } from '@/core/services/subtitle.service';
import { useEditorStore } from '@/store/editorStore';
import type { SubtitleEntry } from '@/core/types';
import styles from './SubtitleExtractor.module.css';

const { Text } = Typography;
const { Option } = Select;

// ── Types ────────────────────────────────────────────────

interface SubtitleSegment {
  id: string;
  startTime: number;  // 秒（数值，方便计算）
  endTime: number;
  start: string;      // 格式化字符串 SRT 格式
  end: string;
  text: string;
}

// ── Utils ─────────────────────────────────────────────────

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function parseSRTTime(timeStr: string): number {
  // Handles "HH:MM:SS,mmm" or "HH:MM:SS.mmm" or "MM:SS,mmm"
  const parts = timeStr.replace(',', '.').split(':');
  if (parts.length === 3) {
    const [h, m, sec] = parts;
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(sec);
  } else if (parts.length === 2) {
    const [m, sec] = parts;
    return parseInt(m) * 60 + parseFloat(sec);
  }
  return 0;
}

function formatDisplayTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const cs = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

// ── Props ────────────────────────────────────────────────

interface SubtitleExtractorProps {
  projectId: string;
  videoUrl?: string;
  onExtracted?: (subtitles: SubtitleSegment[]) => void;
}

// ── Component ────────────────────────────────────────────

const SubtitleExtractor: React.FC<SubtitleExtractorProps> = ({
  projectId,
  videoUrl,
  onExtracted,
}) => {
  const playheadMs = useEditorStore(state => state.playheadMs);
  const previewPlaying = useEditorStore(state => state.previewPlaying);
  const setPlayheadMs = useEditorStore(state => state.setPlayheadMs);
  const setPreviewPlaying = useEditorStore(state => state.setPreviewPlaying);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── State ──────────────────────────────────────────────
  const [format, setFormat] = useState<'srt' | 'vtt' | 'txt'>('srt');
  const [translate, setTranslate] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedSubtitles, setExtractedSubtitles] = useState<SubtitleSegment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activeSubId, setActiveSubId] = useState<string | null>(null); // 当前播放到的字幕
  const [videoDuration, setVideoDuration] = useState(0);

  // ── Derived ────────────────────────────────────────────
  const totalDuration = videoDuration > 0 ? videoDuration : 1;

  // 当前播放头位置（秒）
  const playheadSec = playheadMs / 1000;

  // 当前播放的字幕（播放头在其时间范围内）
  const currentSub = extractedSubtitles.find(
    s => playheadSec >= s.startTime && playheadSec <= s.endTime
  );

  // ── Video handlers ─────────────────────────────────────
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlayheadMs(video.currentTime * 1000);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setPreviewPlaying(false);
  }, []);

  const handleVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDuration(video.duration);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (previewPlaying) {
      video.pause();
      setPreviewPlaying(false);
    } else {
      video.play().catch(() => {});
      setPreviewPlaying(true);
    }
  }, [previewPlaying]);

  // ── Seek ───────────────────────────────────────────────
  const seekTo = useCallback((timeSec: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = timeSec;
    setPlayheadMs(timeSec * 1000);
    if (!previewPlaying) {
      setPreviewPlaying(true);
      video.play().catch(() => {});
    }
  }, [previewPlaying]);

  // ── Extract ────────────────────────────────────────────
  const handleExtract = useCallback(async () => {
    if (!videoUrl) {
      notify.error(null, '未检测到视频源');
      return;
    }

    setIsExtracting(true);
    setProgress(0);
    setExtractedSubtitles([]);
    setActiveSubId(null);

    try {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 88));
      }, 250);

      const result = await subtitleService.extractSubtitles(videoUrl, {
        language: 'zh-CN',
      });

      clearInterval(interval);
      setProgress(100);

      const subs: SubtitleSegment[] = result.entries.map((entry: SubtitleEntry) => ({
        id: entry.id ?? crypto.randomUUID(),
        startTime: entry.startTime,
        endTime: entry.endTime,
        start: formatSRTTime(entry.startTime),
        end: formatSRTTime(entry.endTime),
        text: entry.text,
      }));

      setExtractedSubtitles(subs);
      if (onExtracted) onExtracted(subs);
      notify.success(`成功提取 ${subs.length} 条字幕`);
    } catch (error) {
      notify.error(error as Parameters<typeof notify.error>[0], '字幕提取失败');
    } finally {
      setIsExtracting(false);
    }
  }, [videoUrl, onExtracted]);

  // ── Edit ───────────────────────────────────────────────
  const startEdit = useCallback((sub: SubtitleSegment) => {
    setEditingId(sub.id);
    setEditingText(sub.text);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    setExtractedSubtitles(prev =>
      prev.map(s => s.id === editingId ? { ...s, text: editingText } : s)
    );
    setEditingId(null);
    notify.success('字幕已保存');
  }, [editingId, editingText]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText('');
  }, []);

  // ── Export ────────────────────────────────────────────
  const exportSubtitle = useCallback(() => {
    if (extractedSubtitles.length === 0) {
      notify.warning('无字幕可导出');
      return;
    }

    let content = '';
    if (format === 'srt') {
      content = extractedSubtitles
        .map((sub, i) => `${i + 1}\n${sub.start} --> ${sub.end}\n${sub.text}\n`)
        .join('\n');
    } else if (format === 'vtt') {
      content = 'WEBVTT\n\n' + extractedSubtitles
        .map((sub, i) => `${i + 1}\n${sub.start.replace(',', '.')} --> ${sub.end.replace(',', '.')}\n${sub.text}\n`)
        .join('\n');
    } else {
      content = extractedSubtitles
        .map(sub => `[${sub.start} - ${sub.end}] ${sub.text}`)
        .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitle_${projectId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success(`已导出为 ${format.toUpperCase()} 格式`);
  }, [extractedSubtitles, format, projectId]);

  // ── Render ─────────────────────────────────────────────

  return (
    <div className={styles.container} role="region" aria-label="字幕编辑器">
      {/* ── 顶部：视频预览 ─────────────────────────────── */}
      <div className={styles.playerSection}>
        <div className={styles.videoWrapper}>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className={styles.video}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              onLoadedMetadata={handleVideoMetadata}
              aria-label="视频预览"
            />
          ) : (
            <div className={styles.noVideo}>
              <FileTextOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.2)' }} />
              <Text type="secondary">暂无视频</Text>
            </div>
          )}

          {/* 播放控制覆盖层 */}
          {videoUrl && (
            <div className={styles.playerOverlay}>
              <button
                className={styles.playBtn}
                onClick={togglePlay}
                aria-label={previewPlaying ? '暂停' : '播放'}
              >
                {previewPlaying
                  ? <PauseCircleOutlined />
                  : <PlayCircleOutlined />
                }
              </button>
            </div>
          )}

          {/* 当前字幕提示 */}
          {currentSub && (
            <div className={styles.currentSubtitleHint} aria-live="polite">
              {currentSub.text}
            </div>
          )}
        </div>

        {/* 时间显示 */}
        <div className={styles.timeDisplay} aria-label={`当前时间 ${formatDisplayTime(playheadSec)}`}>
          <span className={styles.timeMain}>{formatDisplayTime(playheadSec)}</span>
          {videoDuration > 0 && (
            <span className={styles.timeTotal}> / {formatDisplayTime(videoDuration)}</span>
          )}
        </div>
      </div>

      {/* ── 中部：字幕时间轴 ──────────────────────────── */}
      {extractedSubtitles.length > 0 && (
        <div className={styles.timeline} role="slider" aria-label="字幕时间轴">
          {/* 播放头 */}
          <div
            className={styles.playhead}
            style={{ left: `${Math.min((playheadSec / totalDuration) * 100, 100)}%` }}
          />

          {/* 字幕块 */}
          <div className={styles.track}>
            {extractedSubtitles.map(sub => {
              const left = (sub.startTime / totalDuration) * 100;
              const width = Math.max(((sub.endTime - sub.startTime) / totalDuration) * 100, 0.5);
              const isActive = activeSubId === sub.id || (playheadSec >= sub.startTime && playheadSec <= sub.endTime);

              return (
                <Tooltip
                  key={sub.id}
                  title={`${formatDisplayTime(sub.startTime)} - ${sub.text.slice(0, 20)}${sub.text.length > 20 ? '…' : ''}`}
                >
                  <div
                    className={`${styles.subBlock} ${isActive ? styles.subBlockActive : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={() => { seekTo(sub.startTime); setActiveSubId(sub.id); }}
                    role="button"
                    tabIndex={0}
                    aria-label={`字幕: ${sub.text.slice(0, 15)}`}
                    onKeyDown={e => e.key === 'Enter' && seekTo(sub.startTime)}
                  />
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 控制栏 ────────────────────────────────────── */}
      <div className={styles.controlBar}>
        <Space size="middle" wrap>
          <Button
            type="primary"
            icon={<AudioOutlined />}
            onClick={handleExtract}
            loading={isExtracting}
            disabled={!videoUrl}
          >
            {isExtracting ? '识别中…' : '提取字幕'}
          </Button>

          {isExtracting && (
            <Progress
              percent={progress}
              size="small"
              style={{ width: 140 }}
              aria-label={`提取进度 ${progress}%`}
            />
          )}

          <Select value={format} onChange={setFormat} style={{ width: 100 }} aria-label="导出格式">
            <Option value="srt">SRT</Option>
            <Option value="vtt">VTT</Option>
            <Option value="txt">TXT</Option>
          </Select>

          <Button icon={<DownloadOutlined />} onClick={exportSubtitle} disabled={extractedSubtitles.length === 0}>
            导出字幕
          </Button>

          <div className={styles.translateToggle}>
            <Text type="secondary" style={{ fontSize: 12 }}>翻译</Text>
            <Switch
              size="small"
              checked={translate}
              onChange={setTranslate}
              checkedChildren="开"
              unCheckedChildren="关"
              aria-label="同步翻译开关"
            />
          </div>
        </Space>

        {extractedSubtitles.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            共 {extractedSubtitles.length} 条字幕
          </Text>
        )}
      </div>

      {/* ── 字幕列表 ──────────────────────────────────── */}
      <div className={styles.subtitleList}>
        {extractedSubtitles.length === 0 && !isExtracting ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="点击「提取字幕」开始识别视频语音"
          />
        ) : (
          <List
            dataSource={extractedSubtitles}
            renderItem={(sub) => {
              const isEditing = editingId === sub.id;
              const isCurrent = playheadSec >= sub.startTime && playheadSec <= sub.endTime;

              return (
                <List.Item
                  className={`${styles.subItem} ${isCurrent ? styles.subItemCurrent : ''}`}
                  onClick={() => seekTo(sub.startTime)}
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={e => { e.stopPropagation(); startEdit(sub); }}
                      aria-label="编辑字幕"
                    />,
                  ]}
                >
                  <div className={styles.subItemContent}>
                    <div className={styles.subItemTime}>
                      <span className={styles.timeStart}>{formatDisplayTime(sub.startTime)}</span>
                      <span className={styles.timeSep}>→</span>
                      <span className={styles.timeEnd}>{formatDisplayTime(sub.endTime)}</span>
                    </div>

                    <div className={styles.subItemText}>
                      {isEditing ? (
                        <Input
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onPressEnter={saveEdit}
                          onBlur={saveEdit}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          className={styles.editInput}
                        />
                      ) : (
                        <span className={`${styles.textContent} ${isCurrent ? styles.textCurrent : ''}`}>
                          {sub.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {isCurrent && (
                    <div className={styles.currentBadge} aria-label="当前播放">
                      <AimOutlined />
                    </div>
                  )}
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SubtitleExtractor;
