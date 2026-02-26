/**
 * 解说混剪工作流页面
 * 集成视觉识别、脚本生成、视频混剪的完整流程
 */

import React from 'react';
import { Steps, Card, Alert, Progress, Space, Typography } from 'antd';
import { useWorkflowPage } from './hooks/useWorkflowPage';
import { WORKFLOW_STEPS } from './constants';
import {
  UploadStep,
  AnalyzeStep,
  TemplateStep,
  ScriptGenerateStep,
  DedupStep,
  ScriptEditStep,
  AIClipStep,
  TimelineStep,
  PreviewStep,
  ExportStep,
  WorkflowActions,
} from './components';

import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

export const WorkflowPage: React.FC = () => {
  const {
    selectedFile,
    selectedTemplate,
    selectedModel,
    scriptParams,
    aiClipConfig,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error,
    currentStep,
    currentStepIndex,
    progress,
    data,
    models,
    templates,
    setSelectedFile,
    setSelectedTemplate,
    setSelectedModel,
    updateScriptParams,
    updateAIClipConfig,
    handleStart,
    editScript,
    editTimeline,
    exportVideo,
    pause,
    resume,
    cancel,
    reset,
    jumpToStep,
  } = useWorkflowPage();

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadStep
            selectedFile={selectedFile}
            aiClipConfig={aiClipConfig}
            onFileSelect={setSelectedFile}
            onConfigChange={updateAIClipConfig}
          />
        );

      case 'analyze':
        return <AnalyzeStep analysis={data.videoAnalysis} progress={progress} />;

      case 'template-select':
        return (
          <TemplateStep
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        );

      case 'script-generate':
        return (
          <ScriptGenerateStep
            models={models}
            selectedModel={selectedModel}
            scriptParams={scriptParams}
            isRunning={isRunning}
            progress={progress}
            onModelSelect={setSelectedModel}
            onParamsChange={updateScriptParams}
          />
        );

      case 'script-dedup':
        return <DedupStep data={data} />;

      case 'script-edit':
        return (
          <ScriptEditStep
            script={data.uniqueScript}
            scenes={data.videoAnalysis?.scenes}
            onSave={editScript}
          />
        );

      case 'ai-clip':
        return <AIClipStep videoInfo={data.videoInfo} />;

      case 'timeline-edit':
        return (
          <TimelineStep
            timeline={data.timeline}
            videoInfo={data.videoInfo}
            script={data.editedScript || data.generatedScript}
            onSave={() => editTimeline(true)}
          />
        );

      case 'preview':
        return (
          <PreviewStep videoInfo={data.videoInfo} script={data.generatedScript} />
        );

      case 'export':
        return <ExportStep onExport={exportVideo} />;

      default:
        return null;
    }
  };

  return (
    <div className={styles.workflowPage}>
      <Title level={2}>解说混剪工作流</Title>
      <Paragraph type="secondary">一站式视频解说创作工具，从视频分析到最终导出</Paragraph>

      {/* 步骤条 */}
      <Card className={styles.stepsCard}>
        <Steps current={currentStepIndex} direction="horizontal" size="small">
          {WORKFLOW_STEPS.map((step) => (
            <Step key={step.key} title={step.title} description={step.description} icon={step.icon} />
          ))}
        </Steps>
      </Card>

      {/* 错误提示 */}
      {hasError && (
        <Alert
          message="工作流出错"
          description={error}
          type="error"
          showIcon
          closable
          className={styles.errorAlert}
        />
      )}

      {/* 进度条 */}
      {isRunning && (
        <Card className={styles.progressCard}>
          <Progress
            percent={Math.round(progress)}
            status={hasError ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary">
            当前步骤: {WORKFLOW_STEPS.find((s) => s.key === currentStep)?.title}
          </Text>
        </Card>
      )}

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 操作按钮 */}
      <WorkflowActions
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        isRunning={isRunning}
        isPaused={isPaused}
        isCompleted={isCompleted}
        canStart={!!selectedFile && !!selectedModel}
        onStart={handleStart}
        onPause={pause}
        onResume={resume}
        onCancel={cancel}
        onReset={reset}
        onJumpToStep={jumpToStep}
      />
    </div>
  );
};

export default WorkflowPage;
