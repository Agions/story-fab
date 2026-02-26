import React from 'react';
import { Card, Row, Col, Progress, Typography, Divider, Tooltip, Space, Spin, Empty } from 'antd';
import type { ClipAnalysisResult } from '@/core/services/aiClip.service';
import styles from '../index.module.less';

const { Title, Text } = Typography;

interface AnalyzeStepProps {
  analyzing: boolean;
  analysisProgress: number;
  analysisResult: ClipAnalysisResult | null;
}

const AnalyzeStep: React.FC<AnalyzeStepProps> = ({
  analyzing,
  analysisProgress,
  analysisResult
}) => {
  const getProgressText = () => {
    if (analysisProgress < 30) return '正在检测场景切换...';
    if (analysisProgress < 60) return '正在分析音频和静音片段...';
    if (analysisProgress < 90) return '正在提取关键帧...';
    return '正在生成剪辑建议...';
  };

  if (analyzing) {
    return (
      <Card className={styles.analyzeCard}>
        <div className={styles.analyzingState}>
          <Spin size="large" />
          <Title level={5}>正在分析视频...</Title>
          <Progress percent={Math.round(analysisProgress)} status="active" />
          <Text type="secondary">{getProgressText()}</Text>
        </div>
      </Card>
    );
  }

  if (!analysisResult) {
    return (
      <Card className={styles.analyzeCard}>
        <Empty description="请先开始分析" />
      </Card>
    );
  }

  return (
    <Card className={styles.analyzeCard}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small" className={styles.statCard}>
            <div className={styles.statValue}>{analysisResult.cutPoints.length}</div>
            <div className={styles.statLabel}>检测到剪辑点</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className={styles.statCard}>
            <div className={styles.statValue}>{analysisResult.silenceSegments.length}</div>
            <div className={styles.statLabel}>静音片段</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className={styles.statCard}>
            <div className={styles.statValue}>{analysisResult.keyframeTimestamps.length}</div>
            <div className={styles.statLabel}>关键帧</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className={styles.statCard}>
            <div className={styles.statValue}>
              {Math.round(analysisResult.estimatedFinalDuration)}s
            </div>
            <div className={styles.statLabel}>预估最终时长</div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>剪辑点分布</Title>
      <div className={styles.timelineVisualization}>
        <div className={styles.timelineBar}>
          {analysisResult.cutPoints.map((cp) => (
            <Tooltip
              key={cp.id}
              title={`${cp.description} (${cp.confidence > 0.8 ? '高' : cp.confidence > 0.5 ? '中' : '低'}置信度)`}
            >
              <div
                className={`${styles.cutPoint} ${styles[cp.type]}`}
                style={{
                  left: `${(cp.timestamp / analysisResult.duration) * 100}%`
                }}
              />
            </Tooltip>
          ))}
        </div>
        <div className={styles.timelineLabels}>
          <Text type="secondary">0s</Text>
          <Text type="secondary">{Math.round(analysisResult.duration / 2)}s</Text>
          <Text type="secondary">{Math.round(analysisResult.duration)}s</Text>
        </div>
      </div>

      <div className={styles.legend}>
        <Space>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.scene}`} />
            场景切换
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.silence}`} />
            静音
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.keyframe}`} />
            关键帧
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.emotion}`} />
            情感变化
          </span>
        </Space>
      </div>
    </Card>
  );
};

export default AnalyzeStep;
