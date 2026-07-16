/**
 * VideoUploadPreview — 已上传视频预览 + 详情
 */

import React from 'react';
import { useVideoUpload } from './use-video-upload';
import { formatDuration, formatFileSize } from '@/shared';
import { Play } from 'lucide-react';
import styles from './video-upload.module.less';

const VideoUploadPreview: React.FC = () => {
  const { projectState } = useVideoUpload();

  if (!projectState.currentVideo) {
    return null;
  }

  return (
    <div className={styles.videoCard}>
      <div className={styles.videoPreview}>
        <video src={projectState.currentVideo.path} controls />
        <div className={styles.videoOverlay}>
          <button className={styles.playBtn} aria-label="播放预览">
            <Play className={styles.playBtnSvg} size={24} />
          </button>
        </div>
      </div>

      <div className={styles.videoDetails}>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>文件名</div>
          <div className={styles.detailValue} style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {projectState.currentVideo.name}
          </div>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>时长</div>
          <div className={styles.detailValue}>{formatDuration(projectState.currentVideo.duration)}</div>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>分辨率</div>
          <div className={styles.detailValue}>{projectState.currentVideo.width}×{projectState.currentVideo.height}</div>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>格式</div>
          <div className={styles.detailValue}>{projectState.currentVideo.format.toUpperCase()}</div>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>大小</div>
          <div className={styles.detailValue}>{formatFileSize(projectState.currentVideo.size)}</div>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>帧率</div>
          <div className={styles.detailValue}>{projectState.currentVideo.fps} fps</div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadPreview;
