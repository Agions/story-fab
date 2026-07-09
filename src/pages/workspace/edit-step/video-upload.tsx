/**
 * 步骤2: 上传视频 — AI Cinema Studio Redesign
 *
 * 重构说明：
 * - 组件已拆分为 VideoUploadDropzone / VideoUploadPreview / VideoUploadProgress / VideoUploadMetaForm
 * - 业务逻辑提取到 useVideoUpload hook
 * - 本文件仅保留组合逻辑，控制在 250 行以内
 */

import React, { memo } from 'react';
import { useVideoUpload } from './use-video-upload';
import VideoUploadDropzone from './video-upload-dropzone';
import VideoUploadPreview from './video-upload-preview';
import VideoUploadProgress from './video-upload-progress';
import VideoUploadMetaForm from './video-upload-meta-form';
import styles from './video-upload.module.less';

interface VideoUploadProps {
  onNext?: () => void;
}

const VideoUpload: React.FC<VideoUploadProps> = memo(({ onNext }) => {
  const { projectState, state, goToNextStep, handleDelete } = useVideoUpload(onNext);
  const { uploadStatus } = state;

  // === 已上传视频显示 ===
  if (projectState.currentVideo) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <h2>已上传视频</h2>
          <p>视频已成功上传，可以继续下一步进行 AI 分析</p>
        </div>
        <VideoUploadPreview />
        <div className={styles.videoActions} style={{ paddingTop: 20 }}>
          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={handleDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
            </svg>
            删除视频
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={goToNextStep}
          >
            下一步：AI 分析
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // === 上传中显示进度 ===
  if (uploadStatus === 'uploading' || uploadStatus === 'completed') {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <h2>上传进度</h2>
          <p>{uploadStatus === 'completed' ? '上传完成，正在准备视频...' : '正在上传视频，请稍候'}</p>
        </div>
        <VideoUploadProgress />
      </div>
    );
  }

  // === 上传区域 ===
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <h2>上传视频</h2>
        <p>支持多种视频格式，时长建议 1-30 分钟</p>
      </div>
      <VideoUploadDropzone />
      <div className={styles.hintAlert}>
        <div className={styles.hintAlertHeader}>
          <svg className={styles.hintIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          上传说明
        </div>
        <ul className={styles.hintList}>
          <li>请上传清晰的视频文件以获得最佳分析效果</li>
          <li>视频时长建议 1-30 分钟</li>
          <li>上传后系统将自动分析视频内容</li>
          <li>支持断点续传，大文件上传更稳定</li>
        </ul>
      </div>
      <VideoUploadMetaForm />
    </div>
  );
});

VideoUpload.displayName = 'VideoUpload';
export default VideoUpload;
