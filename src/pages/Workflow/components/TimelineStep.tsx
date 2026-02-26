import React, { memo } from 'react';
import { Card } from 'antd';
import VideoTimeline from '@/components/VideoTimeline';
import type { TimelineData, VideoInfo, ScriptData } from '@/core/types';
import styles from '../index.module.less';

interface TimelineStepProps {
  timeline?: TimelineData;
  videoInfo?: VideoInfo;
  script?: ScriptData;
  onSave: () => void;
}

const TimelineStep: React.FC<TimelineStepProps> = ({
  timeline,
  videoInfo,
  script,
  onSave,
}) => {
  if (!timeline || !videoInfo) {
    return (
      <Card title="时间轴编辑" className={styles.stepCard}>
        <div>暂无时间轴数据</div>
      </Card>
    );
  }

  return (
    <Card title="时间轴编辑" className={styles.stepCard}>
      <VideoTimeline
        timeline={timeline}
        videoInfo={videoInfo}
        script={script}
        onSave={onSave}
      />
    </Card>
  );
};

export default memo(TimelineStep);
