/**
 * AiVisualizerTimeline — 分析结果展示 + 场景列表 + 高光时刻
 */

import React from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import { Highlights } from './highlights/highlights';
import { formatTime } from '@/shared/utils/formatting';
import type { Scene } from '@/types';
import { CheckMarkIcon, RefreshCwIcon, FilmIcon } from '@/components/icons';
import styles from './ai-visualizer.module.less';

const AiVisualizerTimeline: React.FC = () => {
  const { projectState, hasAnalysis, handleReAnalyze } = useAiVisualizer();

  if (!hasAnalysis) {
    return null;
  }

  return (
    <div className={styles.completionCard}>
      <div className={styles.completionHeader}>
        <div className={styles.completionBadge}>
          <CheckMarkIcon className={styles.completionBadgeSvg} size={16} />
        </div>
        <div>
          <h3 className={styles.completionTitle}>分析完成</h3>
          <p className={styles.completionSubtitle}>视频内容已全面分析，您可以继续下一步</p>
        </div>
      </div>

      <div className={styles.resultGrid}>
        <div className={styles.resultItem}>
          <div className={styles.resultValue}>{projectState.analysis?.scenes?.length || 0}</div>
          <div className={styles.resultLabel}>场景数</div>
        </div>
        <div className={styles.resultItem}>
          <div className={styles.resultValue}>{projectState.analysis?.stats?.objectCount || 0}</div>
          <div className={styles.resultLabel}>识别物体</div>
        </div>
        <div className={styles.resultItem}>
          <div className={styles.resultValue}>{(projectState.subtitleData.ocr?.length || 0) + (projectState.subtitleData.asr?.length || 0)}</div>
          <div className={styles.resultLabel}>字幕条目</div>
        </div>
      </div>

      <div className={styles.sceneSection}>
        <h4 className={styles.sceneSectionTitle}>
          <FilmIcon className={styles.sceneSectionIcon} size={16} />
          场景列表
        </h4>
        <ul className={styles.sceneList}>
          {(projectState.analysis?.scenes || []).slice(0, 5).map((scene: Scene, i: number) => (
            <li key={`scene_${scene.startTime}_${i}`} className={styles.sceneItem}>
              <span className={styles.sceneTime}>{formatTime(scene.startTime)}</span>
              <span className={styles.sceneDesc}>{scene.description || scene.type}</span>
              <span className={styles.sceneTag}>{scene.type}</span>
            </li>
          ))}
          {(projectState.analysis?.scenes?.length || 0) > 5 && (
            <li className={styles.sceneMore}>还有 {(projectState.analysis?.scenes?.length || 0) - 5} 个场景...</li>
          )}
        </ul>
      </div>

      {projectState.currentVideo && (
        <div className={styles.highlightsSection}>
          <Highlights videoInfo={projectState.currentVideo} />
        </div>
      )}

      <div className={styles.actionBar}>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={handleReAnalyze}>
          <RefreshCwIcon className={styles.actionBtnSvg} size={16} />
          重新分析
        </button>
      </div>
    </div>
  );
};

export default AiVisualizerTimeline;
