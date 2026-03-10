import React, { useCallback, useMemo, memo } from 'react';
import { Card, Button, Typography, Space, Tag, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { VideoSegment } from '@/services/videoService';
import { formatTime } from '@/shared/utils/format';
import styles from '../index.module.less';

const { Text, Title } = Typography;

interface SegmentListProps {
  segments: VideoSegment[];
  selectedIndex: number;
  hasVideo: boolean;
  onSelectSegment: (index: number) => void;
  onDeleteSegment: (index: number) => void;
  onAddSegment: () => void;
}

interface SegmentItemProps {
  index: number;
  segment: VideoSegment;
  selected: boolean;
  onSelectSegment: (index: number) => void;
  onDeleteSegment: (index: number) => void;
}

// formatTime 已从 @/shared/utils/format 导入
  ].filter(Boolean);

  return parts.join(':');
};

const getSegmentKey = (segment: VideoSegment, index: number): string =>
  `${index}-${segment.start}-${segment.end}-${segment.type}-${segment.content || ''}`;

const SegmentItem: React.FC<SegmentItemProps> = memo(({
  index,
  segment,
  selected,
  onSelectSegment,
  onDeleteSegment,
}) => {
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSegment(index);
  }, [index, onDeleteSegment]);

  const handleSelect = useCallback(() => {
    onSelectSegment(index);
  }, [index, onSelectSegment]);

  return (
    <Card
      className={`${styles.segmentCard} ${selected ? styles.selected : ''}`}
      onClick={handleSelect}
    >
      <div className={styles.segmentHeader}>
        <Text strong>片段 {index + 1}</Text>
        <Space>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
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
  );
});

const SegmentList: React.FC<SegmentListProps> = ({
  segments,
  selectedIndex,
  hasVideo,
  onSelectSegment,
  onDeleteSegment,
  onAddSegment,
}) => {
  const renderedItems = useMemo(() => (
    segments.map((segment, index) => (
      <SegmentItem
        key={getSegmentKey(segment, index)}
        index={index}
        segment={segment}
        selected={selectedIndex === index}
        onSelectSegment={onSelectSegment}
        onDeleteSegment={onDeleteSegment}
      />
    ))
  ), [onDeleteSegment, onSelectSegment, segments, selectedIndex]);

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
      {renderedItems}

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
