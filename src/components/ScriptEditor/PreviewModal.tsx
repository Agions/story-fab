import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import styles from './ScriptEditor.module.less';

interface PreviewModalProps {
  open: boolean;
  loading: boolean;
  previewSrc: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  loading,
  previewSrc,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>预览片段</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
};

export default memo(PreviewModal);
