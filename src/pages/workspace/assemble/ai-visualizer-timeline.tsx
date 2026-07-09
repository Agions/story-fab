/**
 * AiVisualizerTimeline — 分析结果展示 + 场景列表 + 高光时刻
 */

import React from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import { Highlights } from './highlights/highlights';
import { formatTime } from '@/shared/utils/formatting';
import type { Scene } from '@/types';
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
          <svg className={styles.completionBadgeSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20,6 9,17 4,12" />
          </svg>
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
          <svg className={styles.sceneSectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
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
          <svg className={styles.actionBtnSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          重新分析
        </button>
      </div>
    </div>
  );
};

export default AiVisualizerTimeline;
