/**
 * VideoUploadMetaForm — 视频详情表单（placeholder，当前由 preview 承载）
 */

import React from 'react';
import styles from './video-upload.module.less';

const VideoUploadMetaForm: React.FC = () => {
  return (
    <div className={styles.videoActions} style={{ paddingTop: 20 }}>
      {/* Meta form fields would go here in a future iteration */}
    </div>
  );
};

export default VideoUploadMetaForm;
