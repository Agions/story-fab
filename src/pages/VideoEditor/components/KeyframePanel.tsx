import React, { memo } from 'react';
import { Typography, Empty } from 'antd';
import styles from '../VideoEditor.module.less';

const { Title } = Typography;

interface KeyframePanelProps {
  keyframes: string[];
}

const KeyframePanel: React.FC<KeyframePanelProps> = ({ keyframes }) => {
  return (
    <div className={styles.keyframesContainer}>
      <Title level={5} className={styles.sectionTitle}>关键帧</Title>

      {keyframes.length === 0 ? (
        <Empty description="暂无关键帧" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className={styles.keyframeList}>
          {keyframes.map((frame, index) => (
            <div key={index} className={styles.keyframeItem}>
              <img
                src={frame}
                alt={`关键帧 ${index + 1}`}
                className={styles.keyframeImage}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(KeyframePanel);
