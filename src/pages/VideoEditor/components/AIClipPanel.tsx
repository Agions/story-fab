import React, { memo } from 'react';
import { Typography, Empty } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { AIClipAssistant } from '@/components/AIClipAssistant';
import styles from '../VideoEditor.module.less';

const { Title } = Typography;

interface AIClipPanelProps {
  projectId: string | undefined;
  videoSrc: string;
  duration: number;
  onAnalysisComplete: (result: any) => void;
  onApplySuggestions: (segments: any[]) => void;
}

const AIClipPanel: React.FC<AIClipPanelProps> = ({
  projectId,
  videoSrc,
  duration,
  onAnalysisComplete,
  onApplySuggestions,
}) => {
  if (!videoSrc || duration === 0) {
    return (
      <div className={styles.aiClipPanel}>
        <Title level={5} className={styles.sectionTitle}>
          <RobotOutlined /> AI 智能剪辑助手
        </Title>
        <Empty description="请先加载视频" />
      </div>
    );
  }

  return (
    <div className={styles.aiClipPanel}>
      <Title level={5} className={styles.sectionTitle}>
        <RobotOutlined /> AI 智能剪辑助手
      </Title>

      <AIClipAssistant
        videoInfo={{
          id: projectId || 'new',
          path: videoSrc,
          name: '当前视频',
          duration,
          width: 1920,
          height: 1080,
          fps: 30,
          format: 'mp4',
          size: 0,
          createdAt: new Date().toISOString(),
        }}
        onAnalysisComplete={onAnalysisComplete}
        onApplySuggestions={onApplySuggestions}
      />
    </div>
  );
};

export default memo(AIClipPanel);
