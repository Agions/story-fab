import React, { useEffect, memo } from 'react';
import { Modal, Button, Spin, Typography } from 'antd';
import { ScriptSegment } from '@/types';
import styles from './VideoEditor.module.less';

const { Text, Paragraph } = Typography;

interface PreviewModalProps {
  visible: boolean;
  loading: boolean;
  previewUrl: string;
  previewSegment: ScriptSegment | null;
  onClose: () => void;
}

// 格式化时间
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  loading,
  previewUrl,
  previewSegment,
  onClose,
}) => {
  return (
    <Modal
      title="片段预览"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={800}
    >
      {loading ? (
        <div className={styles.previewLoading}>
          <Spin tip="生成预览中..." />
        </div>
      ) : previewUrl ? (
        <div className={styles.previewContainer}>
          <video
            controls
            autoPlay
            src={previewUrl}
            className={styles.previewVideo}
          />
          {previewSegment && (
            <div className={styles.previewInfo}>
              <Paragraph>
                <Text strong>时间段: </Text>
                <Text>{formatTime(previewSegment.startTime)} - {formatTime(previewSegment.endTime)}</Text>
              </Paragraph>
              <Paragraph>
                <Text strong>内容: </Text>
                <Text>{previewSegment.content}</Text>
              </Paragraph>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.previewError}>
          <Text type="danger">无法生成预览，请重试</Text>
        </div>
      )}
    </Modal>
  );
};

export default memo(PreviewModal);
