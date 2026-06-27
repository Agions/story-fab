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
import { useStoryFab } from '../context';
import { notify } from '@/shared';
import { useScriptGeneration } from './hooks/use-script-generation';
import {
  FUNCTION_TO_FEATURE,
  type AIFunctionType,
} from './function-mode-map';
import {
  COMMENTARY_STYLES,
  type ScriptGenerateProps,
} from './script-config';
import type { storyfabAction } from '../types';
import type { ScriptData } from '@/types';

// 导入子组件
import {
  FunctionModeSelector,
  useSyncFunctionType,
  type FunctionMode,
} from './components/function-mode-selector';
import { StyleLengthConfig } from './components/style-length-config';
import { CommentaryStyleSelector } from './components/commentary-style-selector';
import { ScriptEditorPanel } from './components/script-editor-panel';
import { ScriptStatsBar } from './components/script-stats-bar';
import { GenerationProgress } from './components/generation-progress';

import styles from './ScriptWriting.module.less';

// ============================================
// 功能配置（提取为模块级常量，避免每次渲染重建）
// ============================================

const FUNCTION_CONFIG: Record<AIFunctionType, FunctionMode> = {
  'video-narration': {
    title: 'AI 视频解说',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    description: '对视频内容进行专业解说，适合教程、评测、科普',
    color: '#6b8cce',
    features: ['智能总结要点', '专业术语解释', '逻辑连贯', '多种语气可选'],
    example: '欢迎观看本期内容！今天我们来聊聊这个话题...',
  },
  'first-person': {
    title: 'AI 第一人称',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    description: '以第一人称视角讲述，像主播一样与观众互动',
    color: '#5a9e6f',
    features: ['真实互动感', '情感充沛', '口语化表达', '粉丝粘性高'],
    example: '嘿，朋友们！我是XXX，今天带大家一起体验...',
  },
  remix: {
    title: 'AI 混剪',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
        <line x1="6" y1="9" x2="6" y2="15" />
        <line x1="18" y1="9" x2="18" y2="15" />
        <line x1="9" y1="6" x2="15" y2="6" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    ),
    description: '自动识别精彩片段，生成节奏感强的混剪视频',
    color: '#c49660',
    features: ['智能片段选取', '节奏感强', '高潮迭起', '自动配音'],
    example: '【开场】就在刚才，发生了这一幕...',
  },
};

// ============================================
// 主组件
// ============================================

const ScriptGenerate: React.FC<ScriptGenerateProps> = memo((props) => {
  const { state, setFeature, dispatch } = useStoryFab();
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
// 内部子组件
// ============================================

/**
 * 前置步骤提示
 */
const PrerequisiteStep: React.FC<{ dispatch: (action: storyfabAction) => void }> = ({ dispatch }) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2>📝 生成文案</h2>
        </div>
      </div>
      <div
        style={{
          padding: '28px',
          background: 'rgba(250, 173, 20, 0.06)',
          border: '1px solid rgba(250, 173, 20, 0.15)',
          borderRadius: '12px',
          textAlign: 'center',
          fontFamily: 'Figtree, sans-serif',
          color: 'rgba(255, 255, 255, 0.55)',
          fontSize: '14px',
        }}
      >
        ⚠️ 请先完成 AI 分析步骤，再生成文案
        <br />
        <button
          style={{
            marginTop: '14px',
            padding: '8px 20px',
            background: 'rgba(250, 173, 20, 0.12)',
            border: '1px solid rgba(250, 173, 20, 0.25)',
            borderRadius: '8px',
            color: '#c49660',
            fontFamily: 'Figtree, sans-serif',
            fontSize: '13px',
            cursor: 'pointer',
          }}
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'ai-analyze' })}
        >
          去分析
        </button>
      </div>
    </div>
  );
};

/**
 * 配置卡片头部
 */
const ConfigHeader: React.FC = () => {
  return (
    <div className={styles.configHeader}>
      <svg
        className={styles.configHeaderIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      <h3 className={styles.configTitle}>功能配置</h3>
    </div>
  );
};

/**
 * 功能特点标签
 */
const FunctionFeatures: React.FC<{ features: string[] }> = ({ features }) => {
  return (
    <div className={styles.featuresSection}>
      <span className={styles.featuresLabel}>功能特点</span>
      <div className={styles.featureTags}>
        {features.map((f, i) => (
          <span key={i} className={styles.featureTag}>
            ✓ {f}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * 示例文案
 */
const FunctionExample: React.FC<{ example: string }> = ({ example }) => {
  return (
    <div className={styles.exampleSection}>
      <span className={styles.exampleLabel}>文案示例</span>
      <p className={styles.exampleText}>"{example}..."</p>
    </div>
  );
};

/**
 * 编辑器头部
 */
const EditorHeader: React.FC<{
  onCopy: () => void;
}> = ({ onCopy }) => {
  return (
    <div className={styles.editorHeader}>
      <div className={styles.editorHeaderLeft}>
        <svg
          className={styles.editorHeaderIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <h3 className={styles.editorTitle}>文案编辑</h3>
      </div>
      <div className={styles.editorActions}>
        <button
          className={styles.iconBtn}
          onClick={onCopy}
          title="复制文案"
          aria-label="复制文案"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * 生成按钮区域
 */
const GenerateSection: React.FC<{
  currentScript: ScriptData | null;
  wordCount: number;
  estimatedDuration: number;
  generating: boolean;
  onRegenerate: () => void;
  onPreview: () => void;
}> = ({ currentScript, wordCount, estimatedDuration, generating, onRegenerate, onPreview }) => {
  return (
    <div className={styles.generateSection}>
      <div className={styles.generateRow}>
        {currentScript && (
          <span className={styles.generateStats}>
            ✓ {wordCount} 字 · ~{estimatedDuration}秒
          </span>
        )}
        <button
          className={styles.regenBtn}
          onClick={onRegenerate}
          disabled={generating}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          重新生成
        </button>
      </div>

      {/* 预览脚本按钮 */}
      {currentScript && (
        <button className={styles.previewScriptBtn} onClick={onPreview}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          预览脚本
        </button>
      )}
    </div>
  );
};

/**
 * 脚本预览弹窗
 */
const ScriptPreviewModal: React.FC<{
  script: ScriptData;
  wordCount: number;
  estimatedDuration: number;
  style: string;
  commentaryStyle: string;
  onClose: () => void;
}> = ({ script, wordCount, estimatedDuration, commentaryStyle, style, onClose }) => {
  return (
    <div className={styles.scriptPreviewModal} onClick={onClose}>
      <div className={styles.scriptPreviewContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.scriptPreviewHeader}>
          <h3>脚本预览</h3>
          <button className={styles.scriptPreviewClose} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.scriptPreviewBody}>
          <div className={styles.scriptMeta}>
            <span>
              风格:{' '}
              {COMMENTARY_STYLES.find((s) => s.value === commentaryStyle)?.label || style}
            </span>
            <span>字数: {wordCount}</span>
            <span>预计: ~{estimatedDuration}秒</span>
          </div>
          <pre className={styles.scriptPreviewText}>{script.content}</pre>
        </div>
      </div>
    </div>
  );
};

/**
 * 空状态
 */
const EmptyState: React.FC = () => {
  return (
    <div className={styles.emptyState}>
      <svg
        className={styles.emptyIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p className={styles.emptyTitle}>暂无文案</p>
      <p className={styles.emptyDesc}>点击左侧按钮生成文案</p>
    </div>
  );
};
