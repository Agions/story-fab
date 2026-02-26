import React, { useRef, useCallback, memo } from 'react';
import { ScriptSegment } from '@/types';
import SegmentMarker from './SegmentMarker';
import styles from './VideoEditor.module.less';

interface TimelineProps {
  segments: ScriptSegment[];
  duration: number;
  onSegmentClick: (segment: ScriptSegment) => void;
  onDragStart: (segmentId: string, type: 'move' | 'start' | 'end', e: React.MouseEvent) => void;
}

interface SegmentStyleProps {
  left: string;
  width: string;
  color: string;
}

// 计算片段样式
const getSegmentStyle = (segment: ScriptSegment, duration: number): SegmentStyleProps => {
  const left = `${(segment.startTime / duration) * 100}%`;
  const width = `${((segment.endTime - segment.startTime) / duration) * 100}%`;

  // 根据片段类型设置颜色
  let color = '#1890ff'; // 默认为蓝色（旁白）
  if (segment.type === 'dialogue') {
    color = '#52c41a'; // 对话为绿色
  } else if (segment.type === 'description') {
    color = '#fa8c16'; // 描述为橙色
  }

  return { left, width, color };
};

const Timeline: React.FC<TimelineProps> = ({
  segments,
  duration,
  onSegmentClick,
  onDragStart,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.timelineContainer} ref={timelineRef}>
      {segments.map((segment, index) => (
        <SegmentMarker
          key={segment.id}
          segment={segment}
          index={index}
          style={getSegmentStyle(segment, duration)}
          duration={duration}
          onClick={onSegmentClick}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
};

export default memo(Timeline);
