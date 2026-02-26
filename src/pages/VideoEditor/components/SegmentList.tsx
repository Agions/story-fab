import React, { useCallback, memo } from 'react';
import { Card, Button, Typography, Space, Tag, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { VideoSegment } from '@/services/videoService';
import styles from '../VideoEditor.module.less';

const { Text, Title } = Typography;

interface SegmentListProps {
  segments: VideoSegment[];
  selectedIndex: number;
  hasVideo: boolean;
  onSelectSegment: (index: number) => void;
  onDeleteSegment: (index: number) => void;
  onAddSegment: () => void;
}

// 格式化时间
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [
    hrs > 0 ? String(hrs).padStart(2, '0') : null,
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0'),
  ].filter(Boolean);

  return parts.join(':');
};

const SegmentList: React.FC<SegmentListProps> = ({
  segments,
  selectedIndex,
  hasVideo,
  onSelectSegment,
  onDeleteSegment,
  onAddSegment,
}) => {
  const handleDelete = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onDeleteSegment(index);
  }, [onDeleteSegment]);

  if (segments.length === 0) {
    return (
      <div className={styles.segmentList}>
        <Title level={5} className={styles.sectionTitle}>片段列表</Title>
        <Empty description="暂无片段" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          onClick={onAddSegment}
          disabled={!hasVideo}
          className={styles.addSegmentButton}
        >
          添加片段
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.segmentList}>
      <Title level={5} className={styles.sectionTitle}>片段列表</Title>

      {segments.map((segment, index) => (
        <Card
          key={index}
          className={`${styles.segmentCard} ${selectedIndex === index ? styles.selected : ''}`}
          onClick={() => onSelectSegment(index)}
        >
          <div className={styles.segmentHeader}>
            <Text strong>片段 {index + 1}</Text>
            <Space>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => handleDelete(e, index)}
              />
            </Space>
          </div>

          <div className={styles.segmentTime}>
            <Tag color="blue">
              {formatTime(segment.start)} - {formatTime(segment.end)}
            </Tag>
            <Text type="secondary">
              时长: {formatTime(segment.end - segment.start)}
            </Text>
          </div>

          {segment.content && (
            <div className={styles.segmentContent}>
              <Text ellipsis>{segment.content}</Text>
            </div>
          )}
        </Card>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        block
        onClick={onAddSegment}
        disabled={!hasVideo}
        className={styles.addSegmentButton}
      >
        添加片段
      </Button>
    </div>
  );
};

export default memo(SegmentList);
