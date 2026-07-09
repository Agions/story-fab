/**
 * AiVisualizerControls — 分析配置卡片 + 开始按钮
 */

import React from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import { ANALYSIS_TASKS } from '../config/analysis-tasks';
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={styles.configCardCheckmark}>
                  <polyline points="20,6 9,17 4,12" />
                </svg>
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
          <svg className={styles.startButtonSvg} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
          开始 AI 分析
        </button>
        <div className={styles.taskCount}>已选择 {selectedCount} 项分析任务</div>
      </div>
    </div>
  );
};

export default AiVisualizerControls;
