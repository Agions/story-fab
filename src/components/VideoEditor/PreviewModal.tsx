import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScriptSegment } from '@/types';
import styles from './VideoEditor.module.less';

interface PreviewModalProps {
  open: boolean;
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
  open,
  loading,
  previewUrl,
  previewSegment,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>片段预览</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className={styles.previewLoading}>
            <div className="animate-spin">⟳</div>
            <span className="ml-2">生成预览中...</span>
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
                <p className="mb-1">
                  <span className="font-semibold">时间段: </span>
                  <span>{formatTime(previewSegment.startTime)} - {formatTime(previewSegment.endTime)}</span>
                </p>
                <p className="mb-1">
                  <span className="font-semibold">内容: </span>
                  <span>{previewSegment.content}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.previewError}>
            <span className="text-red-500">无法生成预览，请重试</span>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(PreviewModal);
