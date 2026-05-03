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
import { CutDeckProvider, useCutDeck } from '@/components/CutDeck/context';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS_HELP } from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import { useEditorStore } from '../../store/editorStore';
import { useTimelineStore } from '../../store/timelineStore';
import { notify } from '@/shared';
import { TAB_TO_FEATURE, type AIFunctionTabKey } from '@/components/CutDeck/workspace/functionModeMap';
import styles from '@/pages/AIVideoEditor/index.module.less';

const Workspace = lazy(() => import('@/components/CutDeck/workspace/Workspace'));
const ProjectSetup = lazy(() => import('@/components/CutDeck/workspace/ProjectSetup'));
const VideoUpload = lazy(() => import('@/components/CutDeck/workspace/VideoUpload'));
const AIVisualizer = lazy(() => import('@/components/CutDeck/workspace/AIVisualizer'));
const ScriptWriting = lazy(() => import('@/components/CutDeck/workspace/ScriptWriting'));
const VideoComposing = lazy(() => import('@/components/CutDeck/workspace/VideoComposing'));
const VideoExport = lazy(() => import('@/components/CutDeck/workspace/VideoExport'));
const ClipRippling = lazy(() => import('@/components/CutDeck/workspace/ClipRippling'));

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
    color: '#52c41a',
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
    color: '#1890ff',
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
    color: '#fa8c16',
    icon: <Scissors />,
  },
];

const AIVideoEditorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AIFunctionTabKey>('commentary-first');
  const [shortcutsHelpVisible, setShortcutsHelpVisible] = useState(false);
  const { state, goToNextStep, setFeature } = useCutDeck();
  const previewPlaying = useEditorStore(state => state.previewPlaying);
  const setPreviewPlaying = useEditorStore(state => state.setPreviewPlaying);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const playheadMs = useTimelineStore(state => state.playheadMs);
  const selectedClipId = useTimelineStore(state => state.selectedClipId);
  const setPlayheadMs = useTimelineStore(state => state.setPlayheadMs);
  const setInPoint = useTimelineStore(state => state.setInPoint);
  const setOutPoint = useTimelineStore(state => state.setOutPoint);
  const selectAllClips = useTimelineStore(state => state.selectAllClips);
  const undoTrack = useTimelineStore(state => state.undoTrack);
  const redoTrack = useTimelineStore(state => state.redoTrack);
  const removeClipFromTrack = useTimelineStore(state => state.removeClipFromTrack);

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
      const newTime = Math.max(0, (playheadMs / 1000) + delta);
      setPlayheadMs(newTime * 1000);
    },
    onSeekTo: (time) => {
      setPlayheadMs(time * 1000);
    },
    onDelete: () => {
      if (selectedClipId) {
        removeClipFromTrack(selectedClipId);
        notify.success('片段已删除');
      } else {
        notify.warning('请先选择要删除的片段');
      }
    },
    onInPoint: () => {
      setInPoint();
      notify.success(`入点: ${(playheadMs / 1000).toFixed(1)}s`);
    },
    onOutPoint: () => {
      setOutPoint();
      notify.success(`出点: ${(playheadMs / 1000).toFixed(1)}s`);
    },
    onSelectAll: () => {
      selectAllClips();
    },
    onUndo: () => {
      undo();
      undoTrack();
    },
    onRedo: () => {
      redo();
      redoTrack();
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
        return <ScriptWriting onNext={goToNextStep} />;
      case 'video-synthesize':
        return <VideoComposing onNext={goToNextStep} />;
      case 'export':
        return <VideoExport onComplete={() => {}} />;
      default:
        return <ProjectSetup onNext={goToNextStep} />;
    }
  };

  // 快捷键：? 显示帮助面板
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
    <CutDeckProvider>
      <AIVideoEditorContent />
    </CutDeckProvider>
  );
};

export default AIVideoEditor;
