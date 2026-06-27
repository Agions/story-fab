/**
 * AI 视频编辑器页面
 * 采用标签页分离布局：AI第一人称解说 / AI解说 / AI混剪
 */
import React, { useState, lazy, Suspense, useEffect } from 'react';
import {
  Mic,
  User,
  Scissors,
} from 'lucide-react';
import { StoryFabProvider, useStoryFab } from '@/components/StoryFab/context';
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import { useEditorStore } from '../../store/editor-store';
import { useTimelineStore } from '../../store/timeline-store';
import { useShallow } from 'zustand/react/shallow';
import { notify } from '@/shared';
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/components/StoryFab/workspace/function-mode-map';
import styles from '@/components/VideoEditor/VideoEditor.module.less';

const Workspace = lazy(() => import('@/components/StoryFab/workspace/workspace'));
const ProjectSetup = lazy(() => import('@/components/StoryFab/workspace/project-setup'));
const VideoUpload = lazy(() => import('@/components/StoryFab/workspace/video-upload'));
const AIVisualizer = lazy(() => import('@/components/StoryFab/workspace/ai-visualizer'));
const ScriptWriting = lazy(() => import('@/components/StoryFab/workspace/script-writing'));
const VideoComposing = lazy(() => import('@/components/StoryFab/workspace/video-composing'));
const VideoExport = lazy(() => import('@/components/StoryFab/workspace/VideoExport'));
const ClipRippling = lazy(() => import('@/components/StoryFab/workspace/clip-rippling'));
const CommentaryPanel = lazy(() => import('@/components/CommentaryPanel'));

// 三个核心功能配置
const AI_FUNCTIONS = [
  {
    key: 'commentary-first',
    label: (
      <span className={styles.tabLabel}>
        <User />
        AI第一人称解说
      </span>
    ),
    description: '以第一人称视角讲述，像主播一样与观众互动',
    color: '#5a9e6f',
    icon: <User />,
  },
  {
    key: 'commentary',
    label: (
      <span className={styles.tabLabel}>
        <Mic />
        AI解说
      </span>
    ),
    description: '专业解说，适合教程、评测类内容',
    color: '#6b8cce',
    icon: <Mic />,
  },
  {
    key: 'mix',
    label: (
      <span className={styles.tabLabel}>
        <Scissors />
        AI混剪
      </span>
    ),
    description: '自动识别精彩片段，生成节奏感强的混剪',
    color: '#c49660',
    icon: <Scissors />,
  },
];

const AIVideoEditorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AIFunctionTabKey>('commentary-first');
  const [shortcutsHelpVisible, setShortcutsHelpVisible] = useState(false);
  const { state, goToNextStep, setFeature } = useStoryFab();

  // ── Store selectors — use shallow equality for multi-field objects ──────────
  // Avoids N separate selector calls (each triggers re-render)
  const previewPlaying = useEditorStore(s => s.previewPlaying);
  const setPreviewPlaying = useEditorStore(s => s.setPreviewPlaying);
  const timelineStore = useTimelineStore(
    useShallow((s) => ({
      playheadMs: s.playheadMs,
      selectedClipId: s.selectedClipId,
      setPlayheadMs: s.setPlayheadMs,
      setInPoint: s.setInPoint,
      setOutPoint: s.setOutPoint,
      selectAllClips: s.selectAllClips,
      undoTrack: s.undoTrack,
      redoTrack: s.redoTrack,
      removeClipFromTrack: s.removeClipFromTrack,
    }))
  );

  // ── 快捷键注册 ────────────────────────────────────────
  useKeyboardShortcuts({
    enabled: true,
    preventDefault: true,
    onPlayPause: () => {
      setPreviewPlaying(!previewPlaying);
    },
    onPause: () => {
      setPreviewPlaying(false);
    },
    onSeek: (delta) => {
      const newTime = Math.max(0, (timelineStore.playheadMs / 1000) + delta);
      timelineStore.setPlayheadMs(newTime * 1000);
    },
    onSeekTo: (time) => {
      timelineStore.setPlayheadMs(time * 1000);
    },
    onDelete: () => {
      if (timelineStore.selectedClipId) {
        timelineStore.removeClipFromTrack(timelineStore.selectedClipId);
        notify.success('片段已删除');
      } else {
        notify.warning('请先选择要删除的片段');
      }
    },
    onInPoint: () => {
      timelineStore.setInPoint();
      notify.success(`入点: ${(timelineStore.playheadMs / 1000).toFixed(1)}s`);
    },
    onOutPoint: () => {
      timelineStore.setOutPoint();
      notify.success(`出点: ${(timelineStore.playheadMs / 1000).toFixed(1)}s`);
    },
    onSelectAll: () => {
      timelineStore.selectAllClips();
    },
    onUndo: () => {
      timelineStore.undoTrack();
    },
    onRedo: () => {
      timelineStore.redoTrack();
    },
    onExport: () => {
      goToNextStep();
    },
  });

  useEffect(() => {
    const targetFeature = TAB_TO_FEATURE[activeTab];
    if (state.selectedFeature === targetFeature) {
      return;
    }
    setFeature(targetFeature);
  }, [activeTab, setFeature, state.selectedFeature]);

  // 根据当前步骤渲染内容
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'project-create':
        return <ProjectSetup onNext={goToNextStep} />;
      case 'video-upload':
        return <VideoUpload onNext={goToNextStep} />;
      case 'ai-analyze':
        return <AIVisualizer onNext={goToNextStep} />;
      case 'clip-repurpose':
        return <ClipRippling onNext={goToNextStep} />;
      case 'script-generate':
        return activeTab === 'commentary' ? (
          <CommentaryPanel
            videoPath={state.currentVideo?.path || ''}
            subtitles={state.subtitleData.asr?.map(s => s.text).join('\n') || state.subtitleData.ocr?.map(s => s.text).join('\n') || ''}
            durationSecs={state.currentVideo?.duration}
          />
        ) : (
          <ScriptWriting onNext={goToNextStep} />
        );
      case 'video-synth':
        return <VideoComposing onNext={goToNextStep} />;
      case 'video-export':
        return <VideoExport onComplete={() => {}} />;
      default:
        return <ProjectSetup onNext={goToNextStep} />;
    }
  };

  // 快捷键：? 显示帮助面板
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsHelpVisible(true);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className={styles.editorContainer}>
      {/* 快捷键帮助面板 */}
      <KeyboardShortcutsHelp
        visible={shortcutsHelpVisible}
        onClose={() => setShortcutsHelpVisible(false)}
      />
      {/* 顶部功能标签页 */}
      <div className={styles.tabHeader}>
        <div className={styles.functionCards}>
          {AI_FUNCTIONS.map(func => (
            <div
              key={func.key}
              className={`${styles.functionCard} ${activeTab === func.key ? styles.active : ''}`}
              onClick={() => setActiveTab(func.key as AIFunctionTabKey)}
              style={{
                '--func-color': func.color,
              } as React.CSSProperties}
            >
              <div className={styles.functionIcon}>{func.icon}</div>
              <div className={styles.functionInfo}>
                <div className={styles.functionName}>{func.label}</div>
                <div className={styles.functionDesc}>{func.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主要工作区 */}
      <div className={styles.workspace}>
        <Suspense
          fallback={
            <div style={{ padding: 24, textAlign: 'center' }}>
              正在加载 AI 工作流模块...
            </div>
          }
        >
          <Workspace>
            {renderStepContent()}
          </Workspace>
        </Suspense>
      </div>
    </div>
  );
};

const AIVideoEditor: React.FC = () => {
  return (
    <StoryFabProvider>
      <AIVideoEditorContent />
    </StoryFabProvider>
  );
};

export default AIVideoEditor;
