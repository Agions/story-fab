import React, { memo } from 'react';
import { Card, Alert } from 'antd';
import AIClipAssistant from '@/components/AIClipAssistant';
import type { VideoInfo } from '@/core/types';
import styles from '../index.module.less';

interface AIClipStepProps {
  videoInfo?: VideoInfo;
}

const AIClipStep: React.FC<AIClipStepProps> = ({ videoInfo }) => {
  if (!videoInfo) {
    return (
      <Card title="AI 智能剪辑" className={styles.stepCard}>
        <Alert message="请先上传视频" type="warning" />
      </Card>
    );
  }

  return (
    <Card title="AI 智能剪辑" className={styles.stepCard}>
      <AIClipAssistant
        videoInfo={videoInfo}
        onAnalysisComplete={(result) => {
          console.log('AI 剪辑分析完成:', result);
        }}
        onApplySuggestions={(segments) => {
          console.log('应用剪辑建议:', segments);
        }}
      />
    </Card>
  );
};

export default memo(AIClipStep);
