/**
 * 步骤5: 视频合成 — AI Cinema Studio Redesign
 * 数据输入: video, script, voice
 * 数据输出: synthesis (最终合成视频)
 *
 * 重构说明：
 * - 原 716 行单体组件拆分为多个子组件 + 自定义 Hook
 * - 本文件作为编排器，组合各子组件
 * - 业务逻辑已抽离到 useVideoSynthesize Hook
 * - 各个设置面板独立为子组件
 */

import React, { memo } from 'react';
import { useStoryFab } from '../context';
import { useVideoSynthesize } from './hooks/useVideoSynthesize';
import { notify } from '@/shared';
import { TAB_OPTIONS, type ComposingTab } from './composeConfig';

// 导入子组件
import { VoiceSettingsPanel } from './components/VoiceSettingsPanel';
import { SubtitleSettingsPanel } from './components/SubtitleSettingsPanel';
import { EffectSettingsPanel } from './components/EffectSettingsPanel';
import { SynthesizeProgress } from './components/SynthesizeProgress';
import { WarningAlert } from './components/WarningAlert';
import { CompleteNotice } from './components/CompleteNotice';

import styles from './VideoComposing.module.less';

// ============================================
// 类型定义
// ============================================

interface VideoSynthesizeProps {
  onNext?: () => void;
}

// ============================================
// 主组件
// ============================================

const VideoSynthesize: React.FC<VideoSynthesizeProps> = memo(({ onNext }) => {
  const { state, setSynthesis, goToNextStep, dispatch } = useStoryFab();
  const { synthesizing, progress, config, updateConfig, synthesize, timeout } = useVideoSynthesize();

  // 当前激活的标签页
  const [activeTab, setActiveTab] = React.useState<ComposingTab>('voice');

  /**
   * 获取当前脚本内容
   * 提取说明：原代码中此函数嵌套在组件内，现提取为独立函数
   */
  const getCurrentScriptContent = (): string => {
    return state.scriptData.narration?.content || state.scriptData.remix?.content || '';
  };

  /**
   * 处理视频合成
   * 编排器：组合各子步骤
   */
  const handleSynthesize = async () => {
    const success = await synthesize({
      hasVideo: !!state.currentVideo,
      scriptContent: getCurrentScriptContent(),
      videoPath: state.currentVideo?.path || undefined,
      voiceUrl: state.voiceData.audioUrl || undefined,
      onComplete: (finalVideoPath: string) => {
        setSynthesis(finalVideoPath, {
          syncAudioVideo: config.syncAudioVideo,
          addSubtitles: config.enableSubtitle,
          addWatermark: false,
        });
        notify.success('视频合成完成！');

        // 延迟跳转
        timeout.set(() => {
          if (onNext) onNext();
          else goToNextStep();
        }, 500);
      },
    });
    return success;
  };

  // 前置条件
  const hasVideo = !!state.currentVideo;
  const hasScript = !!getCurrentScriptContent();
  const hasVoice = !!state.voiceData.audioUrl;
  const canProceed = hasVideo && (hasScript || !config.enableVoice);

  // 渲染：缺少视频
  if (!hasVideo) {
    return (
      <WarningAlert
        message="请先上传视频"
        buttonText="去上传"
        onButtonClick={() => dispatch({ type: 'SET_STEP', payload: 'video-upload' })}
      />
    );
  }

  // 渲染：缺少脚本
  if (!hasScript && config.enableVoice) {
    return (
      <WarningAlert
        message="请先生成文案"
        buttonText="去生成文案"
        onButtonClick={() => dispatch({ type: 'SET_STEP', payload: 'script-generate' })}
      />
    );
  }

  // 渲染：合成中
  if (synthesizing) {
    return (
      <div className={styles.stepContent}>
        <SynthesizeProgress progress={progress} />
      </div>
    );
  }

  // 渲染：合成完成
  if (state.synthesisData?.finalVideoUrl && state.stepStatus['video-synth']) {
    return (
      <CompleteNotice
        onNext={onNext || goToNextStep}
        onPreview={() => notify.info('预览功能开发中')}
      />
    );
  }

  // 渲染：主配置界面
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2>
            <span aria-hidden="true">⚙️</span> 视频合成配置
          </h2>
        </div>
      </div>

      {/* 预览播放器 */}
      <PreviewSection videoPath={state.currentVideo?.path} />

      {/* Tab 切换 */}
      <div className={styles.tabs}>
        {TAB_OPTIONS.map((tab) => (
          <TabButton
            key={tab.value}
            value={tab.value}
            label={tab.label}
            isActive={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
          />
        ))}
      </div>

      <div className={styles.panelCard}>
        {activeTab === 'voice' && (
          <VoiceSettingsPanel
            config={config}
            onConfigChange={updateConfig}
            hasVoice={hasVoice}
          />
        )}
        {activeTab === 'subtitle' && (
          <SubtitleSettingsPanel config={config} onConfigChange={updateConfig} />
        )}
        {activeTab === 'effect' && (
          <EffectSettingsPanel config={config} onConfigChange={updateConfig} />
        )}
      </div>

      {/* 合成按钮 */}
      <div className={styles.synthesizeSection}>
        <div className={styles.statusRow}>
          {hasVoice ? (
            <>
              <span className={`${styles.statusDot} ${styles.dotGreen}`} />
              <span>✅ 配音已就绪</span>
            </>
          ) : (
            <>
              <span className={`${styles.statusDot} ${styles.dotRed}`} />
              <span>❌ 请先生成配音</span>
            </>
          )}
        </div>
        <button
          className={`${styles.synthesizeBtn} ${canProceed ? styles.synthesizeBtnReady : ''}`}
          onClick={handleSynthesize}
          disabled={!canProceed}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          开始合成视频
        </button>
      </div>
    </div>
  );
});

VideoSynthesize.displayName = 'VideoSynthesize';
export default VideoSynthesize;

// ============================================
// 内部子组件
// ============================================

/**
 * 预览播放区域
 * 提取说明：原代码中预览 UI 内联在主组件中
 */
const PreviewSection: React.FC<{ videoPath?: string }> = ({ videoPath }) => {
  return (
    <div className={styles.previewSection}>
      <div className={styles.previewPlayer}>
        {videoPath ? (
          <>
            <video className={styles.previewVideo} src={videoPath} muted aria-label="视频预览" />
            <div className={styles.previewOverlay}>
              <button className={styles.playBtn} aria-label="播放预览">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className={styles.previewPlaceholder}>
            <svg
              className={styles.previewPlaceholderIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span className={styles.previewPlaceholderText}>视频预览</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tab 按钮
 * 提取说明：原代码中有 3 个相似的 Tab 按钮实现
 */
const TabButton: React.FC<{
  value: ComposingTab;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ value, label, isActive, onClick }) => {
  // Tab 图标映射
  const iconMap: Record<ComposingTab, React.ReactNode> = {
    voice: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    subtitle: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="15" width="20" height="4" rx="1" />
        <path d="M6 11h4M14 11h4M6 7h12" />
      </svg>
    ),
    effect: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  };

  return (
    <button
      className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
      onClick={onClick}
    >
      {iconMap[value]}
      {label}
    </button>
  );
};
