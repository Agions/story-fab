import React from 'react';
import { Card, Row, Col, Button, Space, Typography, Tag, Divider, Empty } from 'antd';
import { ReloadOutlined, DownloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ClipSegment } from '@/core/services/aiClip.service';
import type { VideoInfo } from '@/core/types';
import styles from '../index.module.less';

const { Title, Text } = Typography;

interface PreviewStepProps {
  videoInfo: VideoInfo;
  previewSegments: ClipSegment[];
  onReset: () => void;
}

const Statistic: React.FC<{ title: string; value: string | number }> = ({
  title,
  value
}) => (
  <div className={styles.statistic}>
    <div className={styles.statisticValue}>{value}</div>
    <div className={styles.statisticTitle}>{title}</div>
  </div>
);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PreviewStep: React.FC<PreviewStepProps> = ({
  videoInfo,
  previewSegments,
  onReset
}) => {
  if (previewSegments.length === 0) {
    return (
      <Card className={styles.previewCard}>
        <Empty description="暂无预览内容，请先应用建议" />
      </Card>
    );
  }

  const totalDuration = previewSegments.reduce((sum, s) => sum + s.duration, 0);

  return (
    <Card className={styles.previewCard}>
      <div className={styles.previewStats}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="原始时长" value={`${Math.round(videoInfo.duration)}秒`} />
          </Col>
          <Col span={8}>
            <Statistic title="剪辑后时长" value={`${Math.round(totalDuration)}秒`} />
          </Col>
          <Col span={8}>
            <Statistic title="片段数量" value={previewSegments.length} />
          </Col>
        </Row>
      </div>

      <Divider />

      <Title level={5}>剪辑片段预览</Title>
      <div className={styles.segmentsPreview}>
        {previewSegments.map((segment, index) => (
          <Card
            key={segment.id}
            size="small"
            className={styles.segmentCard}
            title={
              <Space>
                <Text strong>片段 {index + 1}</Text>
                <Tag color={segment.type === 'silence' ? 'red' : 'blue'}>
                  {segment.type === 'silence' ? '静音' : '视频'}
                </Tag>
              </Space>
            }
          >
            <div className={styles.segmentTime}>
              <ClockCircleOutlined /> {formatTime(segment.startTime)} -{' '}
              {formatTime(segment.endTime)}
            </div>
            <div className={styles.segmentDuration}>
              时长: {segment.duration.toFixed(1)}秒
            </div>
            {segment.thumbnail && (
              <img
                src={segment.thumbnail}
                alt={`片段 ${index + 1}`}
                className={styles.segmentThumbnail}
              />
            )}
          </Card>
        ))}
      </div>

      <div className={styles.actionButtons}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            重新配置
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            导出剪辑方案
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default PreviewStep;
