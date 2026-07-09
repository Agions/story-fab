/**
 * AiVisualizerHeader — AI 分析页面标题区域
 */

import React from 'react';
import styles from './ai-visualizer.module.less';

interface AiVisualizerHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const AiVisualizerHeader: React.FC<AiVisualizerHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className={styles.stepTitle}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  );
};

export default AiVisualizerHeader;
