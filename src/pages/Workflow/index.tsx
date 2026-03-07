/**
 * 解说混剪工作流页面
 * 集成视觉识别、脚本生成、视频混剪的完整流程
 */

import React, { useState } from 'react';
import { Steps, Card, Alert, Progress, Space, Typography, Segmented, Switch, Tag, Select, Slider } from 'antd';
import { useWorkflowPage } from './hooks/useWorkflowPage';
import { WORKFLOW_MODE_OPTIONS, getWorkflowSteps } from './constants';
import { WORKFLOW_MODE_DEFINITIONS } from '@/core/workflow/featureBlueprint';
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
  const [focusedSegmentId, setFocusedSegmentId] = useState<string | undefined>(undefined);
  const {
    selectedFile,
    selectedTemplate,
    selectedModel,
    workflowMode,
    autoOriginalOverlay,
    overlayMixMode,
    overlayOpacity,
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
    setWorkflowMode,
    setAutoOriginalOverlay,
    setOverlayMixMode,
    setOverlayOpacity,
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
  const workflowSteps = getWorkflowSteps(workflowMode);
  const modeDefinition = WORKFLOW_MODE_DEFINITIONS[workflowMode];
  const modeDescription = modeDefinition.description;

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
            onModelSelect={(modelId) => {
              const nextModel = models.find((m) => m.id === modelId) || null;
              setSelectedModel(nextModel);
            }}
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
            focusedSegmentId={focusedSegmentId}
            onFocusConsumed={() => setFocusedSegmentId(undefined)}
            onSave={() => {
              editTimeline(true);
            }}
          />
        );

      case 'preview':
        return (
          <PreviewStep videoInfo={data.videoInfo} script={data.generatedScript} />
        );

      case 'export':
        return (
          <ExportStep
            onExport={exportVideo}
            alignmentGateReport={data.alignmentGateReport}
            onJumpToTimeline={() => {
              setFocusedSegmentId(undefined);
              jumpToStep('timeline-edit');
            }}
            onLocateSegment={(segmentId) => {
              setFocusedSegmentId(segmentId);
              jumpToStep('timeline-edit');
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.workflowPage}>
      <Title level={2}>AI 自主剪辑工作台</Title>
      <Paragraph type="secondary">AI 主导创作，人类负责审核与微调的精品视频生产流程</Paragraph>
      <Card className={styles.stepsCard}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Segmented
              value={workflowMode}
              options={WORKFLOW_MODE_OPTIONS.map((item) => ({
                value: item.value,
                label: (
                  <Space size={6}>
                    {item.icon}
                    {item.label}
                  </Space>
                ),
              }))}
              onChange={(value) => setWorkflowMode(value as typeof workflowMode)}
            />
            <Space>
              <Text type="secondary">自动添加原画</Text>
              <Switch checked={autoOriginalOverlay} onChange={setAutoOriginalOverlay} />
            </Space>
          </Space>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space align="center">
              <Text type="secondary">原画模式</Text>
              <Select
                value={overlayMixMode}
                style={{ width: 130 }}
                options={[
                  { label: '画中画', value: 'pip' },
                  { label: '全屏叠加', value: 'full' },
                ]}
                onChange={(value) => setOverlayMixMode(value as 'pip' | 'full')}
              />
            </Space>
            <Space align="center" style={{ minWidth: 260 }}>
              <Text type="secondary">原画透明度</Text>
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                value={overlayOpacity}
                onChange={(value) => setOverlayOpacity(value as number)}
                style={{ width: 160 }}
              />
            </Space>
          </Space>
          <Text type="secondary">{modeDescription}</Text>
          <Tag color={modeDefinition.autonomy === 'full-auto' ? 'gold' : 'blue'}>
            {modeDefinition.autonomy === 'full-auto' ? '全自动 AI 导演' : 'AI 导演 + 人工审核'}
          </Tag>
        </Space>
      </Card>

      {/* 步骤条 */}
      <Card className={styles.stepsCard}>
        <Steps current={currentStepIndex} direction="horizontal" size="small">
          {workflowSteps.map((step) => (
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
            当前步骤: {workflowSteps.find((s) => s.key === currentStep)?.title}
          </Text>
        </Card>
      )}

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 操作按钮 */}
      <WorkflowActions
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        stepKeys={workflowSteps.map((step) => step.key)}
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
