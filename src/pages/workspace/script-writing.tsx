/**
 * 步骤4: 生成文案 — AI Cinema Studio Redesign
 * 三大核心功能：AI视频解说 / AI第一人称 / AI混剪
 *
 * 重构说明：
 * - 原 686 行单体组件拆分为多个子组件 + 自定义 Hook
 * - 本文件作为编排器，组合各子组件
 * - 业务逻辑已抽离到 useScriptGeneration Hook
 * - 各个功能面板独立为子组件
 */

import React, { useState, memo, useCallback } from 'react';
import { useStoryFabStore } from '@/stores';
import { notify } from '@/shared';
import { useScriptGeneration } from './hooks/use-script-generation';
import {
  FUNCTION_TO_FEATURE,
  type AIFunctionType,
} from './function-mode-map';
import {
  type ScriptGenerateProps,
} from './script-config';

// 导入子组件
import {
  FunctionModeSelector,
  useSyncFunctionType,
} from './components/function-mode-selector';
import { StyleLengthConfig } from './components/style-length-config';
import { CommentaryStyleSelector } from './components/commentary-style-selector';
import { ScriptEditorPanel } from './components/script-editor-panel';
import { ScriptStatsBar } from './components/script-stats-bar';
import { GenerationProgress } from './components/generation-progress';
import {
  PrerequisiteStep,
  ConfigHeader,
  FunctionFeatures,
  FunctionExample,
  EditorHeader,
  GenerateSection,
  ScriptPreviewModal,
  EmptyState,
} from './components';

import { FUNCTION_CONFIG } from './function-config';
import styles from '././script-writing.module.less';

// ============================================
// 主组件
// ============================================

const ScriptGenerate: React.FC<ScriptGenerateProps> = memo((props) => {
  const { state, setFeature, dispatch } = useStoryFabStore();
  const {
    generating,
    progress,
    config,
    setConfig,
    alignmentGate,
    handleGenerate,
    handleEditScript,
    getCurrentScript,
  } = useScriptGeneration({
    state,
    setNarrationScript: props.setNarrationScript!,
    setRemixScript: props.setRemixScript!,
    setFeature: props.setFeature!,
    goToNextStep: props.goToNextStep!,
    onNext: props.onNext,
  });

  const [showScriptPreview, setShowScriptPreview] = useState(false);

  // 同步外部 feature 到 functionType
  useSyncFunctionType(
    config.functionType,
    state.selectedFeature,
    useCallback(
      (type: AIFunctionType) => setConfig((prev) => ({ ...prev, functionType: type })),
      [setConfig]
    )
  );

  const currentFunction = FUNCTION_CONFIG[config.functionType];
  const currentScript = getCurrentScript();
  const canProceed = state.stepStatus['ai-analyze'];

  // 计算统计
  const wordCount = currentScript?.content?.length || 0;
  const estimatedDuration = Math.ceil(wordCount / 3);

  // 复制到剪贴板
  const handleCopy = useCallback(() => {
    if (currentScript?.content) {
      navigator.clipboard.writeText(currentScript.content);
      notify.success('文案已复制到剪贴板');
    }
  }, [currentScript]);

  // 处理功能类型变更
  const handleFunctionTypeChange = useCallback(
    (type: AIFunctionType) => {
      setConfig((prev) => ({ ...prev, functionType: type }));
      setFeature(FUNCTION_TO_FEATURE[type]);
    },
    [setConfig, setFeature]
  );

  // 检查是否有内容
  const hasContent = useCallback(
    (key: AIFunctionType) => {
      if (key === 'remix') return !!state.scriptData.remix;
      return !!state.scriptData.narration;
    },
    [state.scriptData]
  );

  // 未完成前置步骤
  if (!canProceed) {
    return <PrerequisiteStep dispatch={dispatch} />;
  }

  return (
    <div className={styles.stepContent}>
      {/* 头部 */}
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2>📝 生成文案</h2>
          <span className={styles.modeTag}>
            <span className={styles.modeTagDot} />
            {currentFunction.title}
          </span>
        </div>
      </div>

      <div className={styles.columns}>
        {/* ====== 左侧：功能配置 ====== */}
        <div className={styles.configCard}>
          <ConfigHeader />
          <div className={styles.configBody}>
            {/* 功能模式选择 */}
            <FunctionModeSelector
              functionConfig={FUNCTION_CONFIG}
              currentType={config.functionType}
              hasContent={hasContent}
              onTypeChange={handleFunctionTypeChange}
            />

            {/* 风格和长度 */}
            <StyleLengthConfig
              currentStyle={config.style}
              currentLength={config.length}
              onStyleChange={(style) => setConfig((prev) => ({ ...prev, style }))}
              onLengthChange={(length) => setConfig((prev) => ({ ...prev, length }))}
            />

            {/* 解说风格选择器 - 仅解说模式显示 */}
            {config.functionType === 'video-narration' && (
              <CommentaryStyleSelector
                currentStyle={config.commentaryStyle}
                onStyleChange={(commentaryStyle) =>
                  setConfig((prev) => ({ ...prev, commentaryStyle }))
                }
              />
            )}

            {/* 功能特点 */}
            <FunctionFeatures features={currentFunction.features} />

            {/* 示例文案 */}
            <FunctionExample example={currentFunction.example} />
          </div>
        </div>

        {/* ====== 右侧：文案编辑 ====== */}
        {/* ====== 右侧：文案编辑 ====== */}
        <div className={styles.editorCard}>
          {/* 编辑器头部 */}
          <EditorHeader
            onCopy={handleCopy}
          />

          {/* 生成按钮区 */}
          <GenerateSection
            currentScript={currentScript}
            wordCount={wordCount}
            estimatedDuration={estimatedDuration}
            generating={generating}
            onRegenerate={() => handleGenerate(config.functionType)}
            onPreview={() => setShowScriptPreview(true)}
          />

          {/* 脚本预览弹窗 */}
          {showScriptPreview && currentScript && (
            <ScriptPreviewModal
              script={currentScript}
              wordCount={wordCount}
              estimatedDuration={estimatedDuration}
              style={config.style}
              commentaryStyle={config.commentaryStyle}
              onClose={() => setShowScriptPreview(false)}
            />
          )}

          {/* 进度动画 */}
          {generating && (
            <GenerationProgress progress={progress} functionTitle={currentFunction.title} />
          )}

          {/* 文案编辑区 */}
          <ScriptEditorPanel
            content={currentScript?.content || ''}
            placeholder={`点击上方"重新生成"按钮，AI 将自动生成 ${currentFunction.title}...\n\n也可以直接在此编辑文案内容`}
            disabled={!currentScript && !generating}
            onChange={handleEditScript}
          />

          {/* 统计栏 */}
          {currentScript && (
            <ScriptStatsBar
              wordCount={wordCount}
              estimatedDuration={estimatedDuration}
              style={currentScript.metadata?.style || config.style}
              alignmentGate={alignmentGate}
            />
          )}

          {/* 空状态 */}
          {!currentScript && !generating && <EmptyState />}
        </div>
      </div>
    </div>
  );
});

ScriptGenerate.displayName = 'ScriptGenerate';
export default ScriptGenerate;

// ============================================
// 子组件（已提取到 components/ 目录）
// ============================================

export { default as PrerequisiteStep } from './components/prerequisite-step';
export { default as ConfigHeader } from './components/config-header';
export { default as FunctionFeatures } from './components/function-features';
export { default as FunctionExample } from './components/function-example';
export { default as EditorHeader } from './components/editor-header';
export { default as GenerateSection } from './components/generate-section';
export { default as ScriptPreviewModal } from './components/script-preview-modal';
export { default as EmptyState } from './components/empty-state';
