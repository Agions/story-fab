/**
 * AI 视频编辑器页面
 * 采用标签页分离布局：AI第一人称解说 / AI解说 / AI混剪
 */
import React, { useState, lazy, Suspense } from 'react';
import {
  AudioOutlined,
  UserOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import { ClipFlowProvider, useClipFlow } from '@/components/AIPanel/AIEditorContext';
import styles from './index.module.less';

const ClipFlowComponent = lazy(() => import('@/components/AIPanel/ClipFlow/ClipFlow'));
const ProjectCreate = lazy(() => import('@/components/AIPanel/ClipFlow/ProjectCreate'));
const VideoUpload = lazy(() => import('@/components/AIPanel/ClipFlow/VideoUpload'));
const AIAnalyze = lazy(() => import('@/components/AIPanel/ClipFlow/AIAnalyze'));
const ScriptGenerate = lazy(() => import('@/components/AIPanel/ClipFlow/ScriptGenerate'));
const VideoSynthesize = lazy(() => import('@/components/AIPanel/ClipFlow/VideoSynthesize'));
const VideoExport = lazy(() => import('@/components/AIPanel/ClipFlow/VideoExport'));

// 三个核心功能配置
const AI_FUNCTIONS = [
  {
    key: 'commentary-first',
    label: (
      <span className={styles.tabLabel}>
        <UserOutlined />
        AI第一人称解说
      </span>
    ),
    description: '以第一人称视角讲述，像主播一样与观众互动',
    color: '#52c41a',
    icon: <UserOutlined />,
  },
  {
    key: 'commentary',
    label: (
      <span className={styles.tabLabel}>
        <AudioOutlined />
        AI解说
      </span>
    ),
    description: '专业解说，适合教程、评测类内容',
    color: '#1890ff',
    icon: <AudioOutlined />,
  },
  {
    key: 'mix',
    label: (
      <span className={styles.tabLabel}>
        <ScissorOutlined />
        AI混剪
      </span>
    ),
    description: '自动识别精彩片段，生成节奏感强的混剪',
    color: '#fa8c16',
    icon: <ScissorOutlined />,
  },
];

const AIVideoEditorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('commentary-first');
  const { state, goToNextStep } = useClipFlow();

  // 根据当前步骤渲染内容
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'project-create':
        return <ProjectCreate onNext={goToNextStep} />;
      case 'video-upload':
        return <VideoUpload onNext={goToNextStep} />;
      case 'ai-analyze':
        return <AIAnalyze onNext={goToNextStep} />;
      case 'script-generate':
        return <ScriptGenerate onNext={goToNextStep} />;
      case 'video-synthesize':
        return <VideoSynthesize onNext={goToNextStep} />;
      case 'export':
        return <VideoExport onComplete={() => {}} />;
      default:
        return <ProjectCreate onNext={goToNextStep} />;
    }
  };

  return (
    <div className={styles.editorContainer}>
      {/* 顶部功能标签页 */}
      <div className={styles.tabHeader}>
        <div className={styles.functionCards}>
          {AI_FUNCTIONS.map(func => (
            <div
              key={func.key}
              className={`${styles.functionCard} ${activeTab === func.key ? styles.active : ''}`}
              onClick={() => setActiveTab(func.key)}
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
          <ClipFlowComponent showSteps={true} showNavigation={true}>
            {renderStepContent()}
          </ClipFlowComponent>
        </Suspense>
      </div>
    </div>
  );
};

const AIVideoEditor: React.FC = () => {
  return (
    <ClipFlowProvider>
      <AIVideoEditorContent />
    </ClipFlowProvider>
  );
};

export default AIVideoEditor;
