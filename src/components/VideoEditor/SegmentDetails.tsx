import React, { useCallback, memo } from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { ScriptSegment } from '@/types';
import styles from './VideoEditor.module.less';

const { Text } = Typography;

interface SegmentDetailsProps {
  segment: ScriptSegment;
  onPreview: (segment: ScriptSegment) => void;
}

// 格式化时间
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// 获取类型中文名
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'narration':
      return '旁白';
    case 'dialogue':
      return '对话';
    case 'description':
      return '描述';
    default:
      return type;
  }
};

const SegmentDetails: React.FC<SegmentDetailsProps> = ({
  segment,
  onPreview,
}) => {
  const handlePreview = useCallback(() => {
    onPreview(segment);
  }, [onPreview, segment]);

  return (
    <Card size="small" style={{ marginTop: 10 }}>
      <div className={styles.segmentDetails}>
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>时间: </Text>
            <Text>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</Text>
          </Col>
          <Col span={4}>
            <Text strong>类型: </Text>
            <Text>{getTypeLabel(segment.type)}</Text>
          </Col>
          <Col span={12}>
            <Text strong>内容: </Text>
            <Text>{segment.content}</Text>
          </Col>
          <Col span={2}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={handlePreview}
            >
              预览
            </Button>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default memo(SegmentDetails);
