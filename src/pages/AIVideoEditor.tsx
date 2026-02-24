/**
 * AI 视频编辑器页面
 * 使用完整的 AI 剪辑流程
 * 
 * 流程: 创建项目 -> 上传视频 -> AI分析 -> 生成文案 -> 视频合成 -> 导出
 */
import React from 'react';
import { message } from 'antd';
import { useParams } from 'react-router-dom';
import { useClipFlow, ClipFlowStep } from '@/components/AIPanel/AIEditorContext';
import {
  ClipFlow,
  ProjectCreate,
  VideoUpload,
  AIAnalyze,
  ScriptGenerate,
  VideoSynthesize,
  VideoExport,
} from '@/components/AIPanel/ClipFlow';
import styles from './AIVideoEditor.module.less';

const AIVideoEditor: React.FC = () => {
  const { projectId } = useParams();
  const { state, goToNextStep } = useClipFlow();

  // 根据当前步骤渲染对应的组件
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
        return <VideoExport onComplete={() => message.info('视频已导出')} />;
      
      default:
        return <ProjectCreate onNext={goToNextStep} />;
    }
  };

  return (
    <div className={styles.editorContainer}>
      <ClipFlow>
        {renderStepContent()}
      </ClipFlow>
    </div>
  );
};

export default AIVideoEditor;
