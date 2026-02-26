import React, { useRef, memo } from 'react';
import { VideoSegment } from '@/services/videoService';
import styles from '../VideoEditor.module.less';

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

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline} ref={timelineRef}>
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`${styles.timelineSegment} ${selectedIndex === index ? styles.selected : ''}`}
            style={{
              left: `${(segment.start / Math.max(duration, 1)) * 100}%`,
              width: `${((segment.end - segment.start) / Math.max(duration, 1)) * 100}%`,
            }}
            onClick={() => onSelectSegment(index)}
          >
            <div className={styles.segmentHandle} />
            <div className={styles.segmentLabel}>{index + 1}</div>
            <div className={styles.segmentHandle} />
          </div>
        ))}

        {/* 播放头 */}
        <div
          className={styles.playhead}
          style={{
            left: `${(currentTime / Math.max(duration, 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default memo(Timeline);
