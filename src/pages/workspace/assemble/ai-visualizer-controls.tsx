/**
 * AiVisualizerControls — 分析配置卡片 + 开始按钮
 */

import React from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import { ANALYSIS_TASKS } from '../config/analysis-tasks';
import { PlayCircleIcon, CheckMarkIcon } from '@/components/icons';
import styles from './ai-visualizer.module.less';

const AiVisualizerControls: React.FC = () => {
  const { localState, selectedCount, toggleConfig, runAnalysis } = useAiVisualizer();

  return (
    <div className={styles.configSection}>
      <div className={styles.configGrid}>
        {ANALYSIS_TASKS.map((task) => {
          const isActive = localState.config[task.key as keyof typeof localState.config];
          return (
            <div
              key={task.key}
              className={`${styles.configCard} ${isActive ? styles.active : ''}`}
              onClick={() => toggleConfig(task.key)}
              role="checkbox"
              aria-checked={isActive}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleConfig(task.key)}
            >
              <div className={styles.configCardCheckbox}>
                <CheckMarkIcon size={16} className={styles.configCardCheckmark} />
              </div>
              <div className={styles.configCardIcon}>{task.icon}</div>
              <div className={styles.configCardInfo}>
                <div className={styles.configCardName}>{task.label}</div>
                <div className={styles.configCardDesc}>{task.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.startSection}>
        <button
          className={styles.startButton}
          onClick={runAnalysis}
          disabled={selectedCount === 0}
        >
          <PlayCircleIcon className={styles.startButtonSvg} size={20} />
          开始 AI 分析
        </button>
        <div className={styles.taskCount}>已选择 {selectedCount} 项分析任务</div>
      </div>
    </div>
  );
};

export default AiVisualizerControls;
