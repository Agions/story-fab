/**
 * VideoUploadDropzone — 拖拽/点击上传区域
 */

import React from 'react';
import { useVideoUpload } from './use-video-upload';
import { VIDEO_EXTENSIONS } from '../config/video-upload-config';
import { UploadCloudIcon } from '@/components/icons';
import styles from './video-upload.module.less';

const VideoUploadDropzone: React.FC = () => {
  const { state: uploadState, projectState, handleDragOver, handleDragLeave, handleDrop, handleClick, handleFileChange } = useVideoUpload();

  if (!projectState.stepStatus['project-create']) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(200, 149, 108, 0.05)',
        border: '1px solid rgba(200, 149, 108, 0.15)',
        borderRadius: '12px',
        fontFamily: 'Figtree, sans-serif',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
      }}>
        请先创建项目，再上传视频
      </div>
    );
  }

  return (
    <div
      className={`${styles.uploadZone} ${uploadState.dragActive ? styles.dragActive : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label="点击或拖拽上传视频"
    >
      <input
        type="file"
        className={styles.hiddenInput}
        accept={VIDEO_EXTENSIONS.join(',')}
        onChange={handleFileChange}
      />

      <div className={styles.uploadIcon}>
        <UploadCloudIcon size={56} className={styles.uploadIconSvg} />
      </div>

      <p className={styles.uploadPrimary}>点击或拖拽视频文件到此处上传</p>
      <p className={styles.uploadSecondary}>也可以点击选择文件</p>

      <div className={styles.formatHint}>
        <span className={styles.formatDot} />
        支持 MP4 / MOV / AVI / MKV
      </div>
    </div>
  );
};

export default VideoUploadDropzone;
