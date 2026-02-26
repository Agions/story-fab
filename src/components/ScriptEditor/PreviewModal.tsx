import React, { memo } from 'react';
import { Modal } from 'antd';
import styles from './ScriptEditor.module.less';

interface PreviewModalProps {
  visible: boolean;
  loading: boolean;
  previewSrc: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  loading,
  previewSrc,
  onClose,
}) => {
  return (
    <Modal
      title="预览片段"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <div className={styles.previewContainer}>
        {loading ? (
          <div className={styles.previewLoading}>
            <p>正在生成预览...</p>
          </div>
        ) : (
          <video
            src={previewSrc}
            controls
            autoPlay
            className={styles.previewVideo}
          />
        )}
      </div>
    </Modal>
  );
};

export default memo(PreviewModal);
