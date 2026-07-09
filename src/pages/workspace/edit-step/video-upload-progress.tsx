/**
 * VideoUploadProgress — 上传进度条
 */

import React from 'react';
import { useVideoUpload } from './use-video-upload';
import { formatFileSize } from '@/shared';
import styles from './video-upload.module.less';

const VideoUploadProgress: React.FC = () => {
  const { state, handlePauseResume } = useVideoUpload();
  const { uploading, uploadProgress, uploadStatus, currentFile } = state;

  if (!uploading && uploadStatus !== 'completed') {
    return null;
  }

  const uploadedBytes = currentFile ? (currentFile.size * uploadProgress) / 100 : 0;

  return (
    <div className={styles.stepContent}>
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <div className={styles.progressFileIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8.5A1.5 1.5 0 014.5 7h11A1.5 1.5 0 0117 8.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5v-7z" />
            </svg>
          </div>
          <div className={styles.progressInfo}>
            <div className={styles.progressFileName}>{currentFile?.name}</div>
            <div className={styles.progressMeta}>
              {formatFileSize(uploadedBytes)} / {formatFileSize(currentFile?.size ?? 0)}
            </div>
          </div>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>

        <div className={styles.progressFooter}>
          <div className={styles.progressPercent}>{Math.round(uploadProgress)}%</div>
          <div className={styles.progressStatus}>
            {uploadStatus === 'completed' ? '处理中...' : uploadStatus === 'paused' ? '已暂停' : '上传中...'}
          </div>
        </div>
      </div>

      {uploadStatus !== 'completed' && (
        <div className={styles.videoActions}>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={handlePauseResume}
          >
            {uploadStatus === 'paused' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                继续上传
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                暂停上传
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUploadProgress;
