/**
 * 步骤3: AI 分析 — AI Cinema Studio Redesign
 *
 * 重构说明：
 * - 组件已拆分为 AiVisualizerHeader / AiVisualizerCanvas / AiVisualizerControls / AiVisualizerTimeline
 * - 业务逻辑提取到 useAiVisualizer hook
 * - 本文件仅保留组合逻辑，控制在 250 行以内
 */

import React, { memo } from 'react';
import { useAiVisualizer } from './use-ai-visualizer';
import AiVisualizerHeader from './ai-visualizer-header';
import AiVisualizerCanvas from './ai-visualizer-canvas';
import AiVisualizerControls from './ai-visualizer-controls';
import AiVisualizerTimeline from './ai-visualizer-timeline';
import styles from './ai-visualizer.module.less';
import type { AIAnalyzeProps } from '@/types/analysis';

const AIAnalyze: React.FC<AIAnalyzeProps> = memo(({ onNext }) => {
  const { projectState, localState, hasAnalysis, goToNextStep } = useAiVisualizer(onNext);

  // === 无视频状态 ===
  if (!projectState.currentVideo) {
    return (
      <div className={styles.stepContent}>
        <AiVisualizerHeader title="AI 智能分析" subtitle="请先上传视频，再进行 AI 分析" />
        <div className={styles.noVideoWarning}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className={styles.noVideoHint}>请先上传视频，再进行 AI 分析</p>
        </div>
      </div>
    );
  }

  // === 已完成分析 ===
  if (hasAnalysis) {
    return (
      <div className={styles.stepContent}>
        <AiVisualizerHeader title="AI 分析结果" subtitle="分析已完成，您可以查看结果或重新分析" />
        <AiVisualizerTimeline />
        <div className={styles.actionBar}>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={goToNextStep}>
            下一步：生成文案
            <svg className={styles.actionBtnSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // === 分析中状态 ===
  if (localState.analyzing) {
    return (
      <div className={styles.stepContent}>
        <AiVisualizerHeader title="AI 智能分析" subtitle="正在分析视频内容，请稍候..." />
        <AiVisualizerCanvas />
      </div>
    );
  }

  // === 未分析状态（配置页面）===
  return (
    <div className={styles.stepContent}>
      <AiVisualizerHeader
        title="AI 智能分析"
        subtitle="选择要开启的分析功能，AI 将自动识别视频内容"
      />
      <div className={styles.videoInfoStrip}>
        <div className={styles.videoInfoDot} />
        <span className={styles.videoInfoName}>{projectState.currentVideo?.name}</span>
        <div className={styles.videoInfoMeta}>
          <span className={styles.videoInfoTag}>{Math.floor(projectState.currentVideo?.duration || 0)}秒</span>
          <span className={styles.videoInfoTag}>{projectState.currentVideo?.width}×{projectState.currentVideo?.height}</span>
        </div>
      </div>
      <AiVisualizerControls />
    </div>
  );
});

AIAnalyze.displayName = 'AIAnalyze';
export default AIAnalyze;
