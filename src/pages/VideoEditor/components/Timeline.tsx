import React, { useRef, memo, useMemo } from 'react';
import { VideoSegment } from '@/services/videoService';
import styles from '../index.module.less';

interface TimelineProps {
  segments: VideoSegment[];
  currentTime: number;
  duration: number;
  selectedIndex: number;
  onSelectSegment: (index: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  segments,
  currentTime,
  duration,
  selectedIndex,
  onSelectSegment,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const safeDuration = Math.max(duration, 1);
  const renderedSegments = useMemo(() => (
    segments.map((segment, index) => (
      <div
        key={index}
        className={`${styles.timelineSegment} ${selectedIndex === index ? styles.selected : ''}`}
        style={{
          left: `${(segment.start / safeDuration) * 100}%`,
          width: `${((segment.end - segment.start) / safeDuration) * 100}%`,
        }}
        onClick={() => onSelectSegment(index)}
      >
        <div className={styles.segmentHandle} />
        <div className={styles.segmentLabel}>{index + 1}</div>
        <div className={styles.segmentHandle} />
      </div>
    ))
  ), [onSelectSegment, safeDuration, segments, selectedIndex]);

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline} ref={timelineRef}>
        {renderedSegments}

        {/* 播放头 */}
        <div
          className={styles.playhead}
          style={{
            left: `${(currentTime / safeDuration) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default memo(Timeline);
