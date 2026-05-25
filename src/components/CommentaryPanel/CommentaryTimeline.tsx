/**
 * CommentaryTimeline — 解说时间线组件
 *
 * 展示解说片段与视频时间轴的对齐关系
 * 支持播放预览
 */

import React, { useState, memo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Play, Pause } from 'lucide-react';
import type { CommentarySegment } from '@/core/services/commentary';
import { formatDuration } from '@/core/video';
import styles from './CommentaryPanel.module.less';

interface Props {
  segments: CommentarySegment[];
  voice: string;
  /** 视频总时长（秒） */
  totalDuration?: number;
}

const CommentaryTimeline: React.FC<Props> = ({
  segments,
  voice: _voice,
  totalDuration = 0,
}) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handlePlaySegment = (index: number) => {
    setPlayingIndex(playingIndex === index ? null : index);
  };

  return (
    <div className={styles.timeline}>
      <p className={styles.timelineHint}>解说片段与时间轴对齐预览</p>

      <div className={styles.timelineTrack}>
        {/* 时间轴刻度 */}
        <div className={styles.timelineAxis}>
          {segments.map((seg, i) => {
            const startPct = totalDuration > 0
              ? (seg.startTime / totalDuration) * 100
              : 0;
            const endPct = totalDuration > 0
              ? (seg.endTime / totalDuration) * 100
              : 0;

            return (
              <div
                key={i}
                className={styles.timelineSegment}
                style={{
                  left: `${startPct}%`,
                  width: `${endPct - startPct}%`,
                }}
                onClick={() => handlePlaySegment(i)}
              >
                <div className={styles.timelineSegmentBar}>
                  <span className={styles.timelineSegmentNum}>{i + 1}</span>
                </div>
                <div className={styles.timelineSegmentLabel}>
                  {formatDuration(seg.startTime)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 片段列表 */}
      <div className={styles.timelineList}>
        {segments.map((seg, i) => (
          <Card
            key={i}
            className={`${styles.timelineItem} ${playingIndex === i ? styles.timelineItemPlaying : ''}`}
            onClick={() => handlePlaySegment(i)}
          >
            <CardContent className={styles.timelineItemContent}>
              <div className={styles.timelineItemIndex}>{i + 1}</div>
              <div className={styles.timelineItemInfo}>
                <div className={styles.timelineItemTimes}>
                  <span>{formatDuration(seg.startTime)}</span>
                  <span className={styles.timelineSeparator}>→</span>
                  <span>{formatDuration(seg.endTime)}</span>
                </div>
                <p className={styles.timelineItemText}>{seg.text}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaySegment(i);
                }}
              >
                {playingIndex === i ? <Pause size={14} /> : <Play size={14} />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default memo(CommentaryTimeline);