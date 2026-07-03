/**
 * SegmentTimelineCard — Smart Edit preview
 *
 * Renders the enriched SmartVideoSegment list with:
 *   - Segment type icon + label
 *   - Suggested playback speed (badge: 1x/2x/4x/6x)
 *   - Suggested transition (badge: fade/dissolve/...)
 *   - Timecode + duration
 *   - Confidence + reason tooltip
 *
 * This is the consumer for the P1 — 智能片段速度推荐 and P1 — 自动转场建议
 * features. Before this component, the `suggestedSpeed` and `suggestedTransition`
 * fields were populated but invisible.
 */

import React, { useMemo } from 'react';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { Gauge, Shuffle, Clock, Zap, MessageCircle, Eye, Pause, FileVideo } from 'lucide-react';
import { formatTime } from '@/shared/utils/formatting';
import type { SmartVideoSegment } from '../../../core/video/highlight.types';
import { summarizeSpeeds } from '../../../core/services/ai-clip/segment-enricher';
import type { TransitionType } from '../../../core/services/video/transition-suggestion';
import styles from '../AIClip.module.less';

const TYPE_ICON: Record<string, React.ReactNode> = {
  action:      <Zap size={12} />,
  dialogue:    <MessageCircle size={12} />,
  transition:  <Shuffle size={12} />,
  silence:     <Pause size={12} />,
  content:     <FileVideo size={12} />,
};

const TYPE_LABEL: Record<string, string> = {
  action:     '动作',
  dialogue:   '对话',
  transition: '转场',
  silence:    '静默',
  content:    '内容',
};

const TYPE_CLS: Record<string, string> = {
  action:     styles.tAction ?? '',
  dialogue:   styles.tDialogue ?? '',
  transition: styles.tTransition ?? '',
  silence:    styles.tSilence ?? '',
  content:    styles.tContent ?? '',
};

const TRANSITION_LABEL: Record<TransitionType, string> = {
  none: '无', fade: '淡入淡出', dissolve: '叠化', wipe: '擦除', slide: '滑动', zoom: '缩放', glitch: '故障',
};

interface SegmentTimelineCardProps {
  segments: SmartVideoSegment[];
  /** Optional cap on rendered rows (UI performance for long videos) */
  maxRows?: number;
}

const SegmentTimelineCard: React.FC<SegmentTimelineCardProps> = ({ segments, maxRows = 50 }) => {
  const summary = useMemo(() => summarizeSpeeds(segments), [segments]);
  const visible = useMemo(
    () => (segments.length > maxRows ? segments.slice(0, maxRows) : segments),
    [segments, maxRows],
  );

  if (segments.length === 0) {
    return (
      <div className={styles.smartEmpty ?? ''}>
        <Eye size={16} />
        <span>暂无智能片段建议</span>
      </div>
    );
  }

  return (
    <div className={styles.smartCard ?? ''}>
      {/* Summary header */}
      <div className={styles.smartHeader ?? ''}>
        <span className={styles.smartTitle ?? ''}>
          <Gauge size={14} /> 智能编辑建议
        </span>
        <span className={styles.smartMeta ?? ''}>
          {summary.total} 段 · 最快 {summary.fastestSpeed}x
        </span>
      </div>

      {/* Body */}
      <ScrollArea className={styles.smartBody ?? 'h-[280px]'}>
        <ul className={styles.smartList ?? ''}>
          {visible.map((s, i) => {
            const speed = s.suggestedSpeed ?? 1;
            const t = s.suggestedTransition;
            const tt = t?.type ?? 'none';
            const key = `seg_${s.startMs}_${i}`;
            return (
              <li key={key} className={styles.smartItem ?? ''}>
                <div className={styles.smartItemLeft ?? ''}>
                  <Badge
                    variant="outline"
                    className={`${styles.smartTypeBadge ?? ''} ${TYPE_CLS[s.segmentType] ?? ''}`}
                  >
                    {TYPE_ICON[s.segmentType] ?? <FileVideo size={12} />}
                    {TYPE_LABEL[s.segmentType] ?? s.segmentType}
                  </Badge>
                  <span className={styles.smartTime ?? ''}>
                    <Clock size={11} /> {formatTime(s.startMs / 1000)}
                  </span>
                </div>
                <div className={styles.smartItemRight ?? ''}>
                  {speed !== 1 && (
                    <Badge variant="default" className={styles.smartSpeedBadge ?? ''}>
                      {speed}x
                    </Badge>
                  )}
                  {t && tt !== 'none' && (
                    <Badge variant="secondary" title={t.reason} className={styles.smartTransitionBadge ?? ''}>
                      <Shuffle size={10} /> {TRANSITION_LABEL[tt] ?? tt}
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
          {segments.length > maxRows && (
            <li className={styles.smartMore ?? ''}>
              …还有 {segments.length - maxRows} 段未显示
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  );
};

export { SegmentTimelineCard };
