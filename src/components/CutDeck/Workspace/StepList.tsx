/**
 * StepList — 垂直步骤列表组件
 * 展示 AI 剪辑流程的步骤进度，支持点击跳转
 */
import React, { memo } from 'react';
import { Plus, Video, Cloud, FileText, Edit, Download, Check, Bolt } from 'lucide-react';
import type { CutDeckStep } from '../AIEditorContext';
import styles from './Workspace.module.less';

// ============================================================================
// 类型定义
// ============================================================================

interface StepConfig {
  key: CutDeckStep;
  title: string;
  icon: React.ReactNode;
}

interface StepListProps {
  currentStep: CutDeckStep;
  stepStatus: Record<CutDeckStep, boolean>;
  onStepClick: (step: CutDeckStep) => void;
  activeStepRef: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// 常量配置
// ============================================================================

const STEPS: StepConfig[] = [
  { key: 'project-create', title: '创建项目', icon: <Plus /> },
  { key: 'video-upload', title: '上传视频', icon: <Video /> },
  { key: 'ai-analyze', title: 'AI 分析', icon: <Cloud /> },
  { key: 'clip-repurpose', title: 'AI 拆条', icon: <Bolt /> },
  { key: 'script-generate', title: '生成文案', icon: <FileText /> },
  { key: 'video-synthesize', title: '视频合成', icon: <Edit /> },
  { key: 'export', title: '导出', icon: <Download /> },
];

// ============================================================================
// 辅助函数
// ============================================================================

const isStepCompleted = (
  step: CutDeckStep,
  stepStatus: Record<CutDeckStep, boolean>
): boolean => stepStatus[step];

const isStepAccessible = (
  step: CutDeckStep,
  currentStep: CutDeckStep,
  stepStatus: Record<CutDeckStep, boolean>
): boolean => {
  // 已完成的步骤可以点击跳转
  if (stepStatus[step]) return true;
  // 当前步骤可访问
  if (step === currentStep) return true;
  // 检查是否是下一步（允许直接进入下一步）
  const STEP_ORDER: readonly CutDeckStep[] = [
    'project-create',
    'video-upload',
    'ai-analyze',
    'clip-repurpose',
    'script-generate',
    'video-synthesize',
    'export',
  ];
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const targetIndex = STEP_ORDER.indexOf(step);
  return targetIndex === currentIndex + 1;
};

// ============================================================================
// 组件
// ============================================================================

const StepList: React.FC<StepListProps> = memo(({
  currentStep,
  stepStatus,
  onStepClick,
  activeStepRef,
}) => {
  return (
    <div className={styles.stepList}>
      {STEPS.map((step, index) => {
        const completed = isStepCompleted(step.key, stepStatus);
        const active = step.key === currentStep;
        const accessible = isStepAccessible(step.key, currentStep, stepStatus);

        // 判断进行中：当前步骤且未完成
        const inProgress = active && !completed;

        let statusClass = styles.stepItemPending;
        if (completed) statusClass = styles.stepItemCompleted;
        else if (active) statusClass = styles.stepItemActive;
        else if (inProgress) statusClass = styles.stepItemInProgress;

        return (
          <div key={step.key} className={styles.stepWrapper}>
            {/* 连接线（除最后一个） */}
            {index < STEPS.length - 1 && (
              <div
                className={`${styles.stepConnector} ${
                  completed ? styles.connectorCompleted : ''
                }`}
              />
            )}

            {/* 步骤项 */}
            <div
              className={`${styles.stepItem} ${statusClass} ${
                accessible ? styles.stepItemAccessible : ''
              }`}
              onClick={() => accessible && onStepClick(step.key)}
              role="button"
              tabIndex={accessible ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && accessible) {
                  onStepClick(step.key);
                }
              }}
              ref={(active ? activeStepRef : null) as React.RefObject<HTMLDivElement>}
            >
              {/* 状态图标 */}
              <div className={styles.stepIconWrapper}>
                {completed ? (
                  <span className={`${styles.stepIcon} ${styles.iconCompleted}`}>
                    <Check />
                  </span>
                ) : inProgress ? (
                  <span className={`${styles.stepIcon} ${styles.iconInProgress}`}>
                    <Bolt />
                  </span>
                ) : (
                  <span className={`${styles.stepIcon} ${styles.iconPending}`}>
                    {step.icon}
                  </span>
                )}
              </div>

              {/* 步骤文字 */}
              <div className={styles.stepText}>
                <span className={styles.stepTitle}>{step.title}</span>
                {completed && (
                  <span className={styles.stepStatus}>已完成</span>
                )}
                {inProgress && (
                  <span className={styles.stepStatusInProgress}>进行中</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

StepList.displayName = 'StepList';

export default StepList;