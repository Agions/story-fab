/**
 * AiVisualizerCanvas — 神经网络可视化 + 进度大数字 + 任务列表
 */

import React from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import { ANALYSIS_TASKS, TASK_ICONS } from '../config/analysis-tasks';
import styles from './ai-visualizer.module.less';

interface AiVisualizerCanvasProps {
  onReAnalyze?: () => void;
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.checkIcon}>
    <polyline points="20,6 9,17 4,12" />
  </svg>
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
        <svg className={styles.neuralLines} viewBox="0 0 280 120" preserveAspectRatio="none">
          <line x1="14" y1="60" x2="45" y2="24" className={`${styles.neuralLine} ${completedTasks.includes('scene') ? styles.completed : ''}`} />
          <line x1="14" y1="60" x2="45" y2="96" className={`${styles.neuralLine} ${completedTasks.includes('scene') ? styles.completed : ''}`} />
          <line x1="45" y1="24" x2="112" y2="36" className={`${styles.neuralLine} ${completedTasks.includes('scene') ? styles.completed : ''}`} />
          <line x1="45" y1="96" x2="112" y2="84" className={`${styles.neuralLine} ${completedTasks.includes('scene') ? styles.completed : ''}`} />
          <line x1="45" y1="24" x2="112" y2="84" className={`${styles.neuralLine} ${completedTasks.includes('emotion') ? styles.completed : ''}`} />
          <line x1="45" y1="96" x2="112" y2="36" className={`${styles.neuralLine} ${completedTasks.includes('emotion') ? styles.completed : ''}`} />
          <line x1="112" y1="36" x2="179" y2="18" className={`${styles.neuralLine} ${completedTasks.includes('emotion') ? styles.completed : ''}`} />
          <line x1="112" y1="84" x2="179" y2="60" className={`${styles.neuralLine} ${completedTasks.includes('emotion') ? styles.completed : ''}`} />
          <line x1="112" y1="36" x2="179" y2="102" className={`${styles.neuralLine} ${completedTasks.includes('ocr') ? styles.completed : ''}`} />
          <line x1="112" y1="84" x2="179" y2="102" className={`${styles.neuralLine} ${completedTasks.includes('ocr') ? styles.completed : ''}`} />
          <line x1="179" y1="18" x2="246" y2="42" className={`${styles.neuralLine} ${completedTasks.includes('ocr') ? styles.completed : ''}`} />
          <line x1="179" y1="60" x2="246" y2="78" className={`${styles.neuralLine} ${completedTasks.includes('ocr') ? styles.completed : ''}`} />
          <line x1="179" y1="102" x2="246" y2="78" className={`${styles.neuralLine} ${completedTasks.includes('asr') ? styles.completed : ''}`} />
        </svg>

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
