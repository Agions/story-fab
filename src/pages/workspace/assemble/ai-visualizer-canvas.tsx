/**
 * AiVisualizerCanvas — 神经网络可视化 + 进度大数字 + 任务列表
 */

import React from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import { ANALYSIS_TASKS, TASK_ICONS } from '../config/analysis-tasks';
import { CheckMarkIcon, NeuralNetworkIcon } from '@/components/icons';
import styles from './ai-visualizer.module.less';

interface AiVisualizerCanvasProps {
  onReAnalyze?: () => void;
}

const CheckIcon = () => (
  <CheckMarkIcon size={16} className={styles.checkIcon} />
);

const AiVisualizerCanvas: React.FC<AiVisualizerCanvasProps> = ({ onReAnalyze: _onReAnalyze }) => {
  const { localState } = useAiVisualizer();
  const { analyzing, progress, currentTaskKey, completedTasks, visibleTasks } = localState;
  const isComplete = progress === 100;

  if (!analyzing) {
    return null;
  }

  return (
    <div className={styles.analyzingCard}>
      <div className={styles.neuralViz}>
        <NeuralNetworkIcon size={280} className={styles.neuralLines} />

        <div className={styles.neuralNode} style={{ left: '0%', top: '50%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('scene') ? styles.completed : ''}`} style={{ left: '16%', top: '20%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('scene') ? styles.completed : ''}`} style={{ left: '16%', top: '80%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('emotion') || completedTasks.includes('object') ? styles.completed : ''}`} style={{ left: '40%', top: '30%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('emotion') || completedTasks.includes('object') ? styles.completed : ''}`} style={{ left: '40%', top: '70%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('ocr') ? styles.completed : ''}`} style={{ left: '64%', top: '15%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('ocr') || completedTasks.includes('emotion') ? styles.completed : ''}`} style={{ left: '64%', top: '50%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('ocr') || completedTasks.includes('emotion') ? styles.completed : ''}`} style={{ left: '64%', top: '85%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('asr') ? styles.completed : ''}`} style={{ left: '88%', top: '35%' }} />
        <div className={`${styles.neuralNode} ${completedTasks.includes('asr') || completedTasks.includes('ocr') ? styles.completed : ''}`} style={{ left: '88%', top: '65%' }} />

        {!isComplete && currentTaskKey && (
          <div className={styles.pulseRing} />
        )}
      </div>

      <div className={`${styles.progressNumber} ${isComplete ? styles.completed : ''}`}>
        {progress}%
      </div>
      <div className={styles.progressLabel}>
        {isComplete ? '分析完成' : '正在分析...'}
      </div>

      <ul className={styles.taskList}>
        {ANALYSIS_TASKS.map((task) => {
          const isCompleted = completedTasks.includes(task.key);
          const isActive = currentTaskKey === task.key && !isCompleted;
          const isVisible = visibleTasks.includes(task.key);

          return (
            <li
              key={task.key}
              className={`
                ${styles.taskItem}
                ${isVisible ? styles.visible : ''}
                ${isActive ? styles.active : ''}
                ${isCompleted ? styles.completed : ''}
              `}
            >
              <span className={styles.taskIcon}>
                {isCompleted ? <CheckIcon /> : TASK_ICONS[task.key]}
              </span>
              <span className={styles.taskLabel}>
                {task.label}
                {isCompleted && ' ✓'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AiVisualizerCanvas;
