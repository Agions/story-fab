import React, { memo } from 'react';
import { Card, Typography } from 'antd';
import type { VideoInfo, ScriptData } from '@/core/types';
import styles from '../index.module.less';

const { Title, Paragraph } = Typography;

interface PreviewStepProps {
  videoInfo?: VideoInfo;
  script?: ScriptData;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ videoInfo, script }) => {
  return (
    <Card title="预览" className={styles.stepCard}>
      <div className={styles.previewArea}>
        <video controls className={styles.previewVideo} poster={videoInfo?.thumbnail}>
          <source src={videoInfo?.path} />
        </video>
        <div className={styles.previewInfo}>
          <Title level={5}>{script?.title}</Title>
          <Paragraph>预计时长: {Math.round(videoInfo?.duration || 0)}秒</Paragraph>
        </div>
      </div>
    </Card>
  );
};

export default memo(PreviewStep);
