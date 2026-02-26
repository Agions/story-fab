import React, { memo } from 'react';
import { Card, Row, Col, Progress, Typography } from 'antd';
import type { VideoAnalysis } from '@/core/types';
import styles from '../index.module.less';

const { Title, Text } = Typography;

interface AnalyzeStepProps {
  analysis?: VideoAnalysis;
  progress: number;
}

const AnalyzeStep: React.FC<AnalyzeStepProps> = ({ analysis, progress }) => {
  if (!analysis) {
    return (
      <Card title="视频分析" className={styles.stepCard}>
        <div className={styles.loadingArea}>
          <Progress percent={progress} status="active" />
          <Text>正在分析视频内容...</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card title="视频分析" className={styles.stepCard}>
      <div className={styles.analysisResult}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" title="场景检测">
              <Text strong>{analysis.scenes.length}</Text>
              <Text> 个场景</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="物体识别">
              <Text strong>{analysis.objects?.length || 0}</Text>
              <Text> 个物体</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="情感分析">
              <Text strong>{analysis.emotions?.length || 0}</Text>
              <Text> 个片段</Text>
            </Card>
          </Col>
        </Row>
        <div className={styles.analysisSummary}>
          <Title level={5}>分析摘要</Title>
          <Text>{analysis.summary}</Text>
        </div>
      </div>
    </Card>
  );
};

export default memo(AnalyzeStep);
